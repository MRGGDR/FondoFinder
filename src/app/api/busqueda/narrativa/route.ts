/**
 * POST /api/busqueda/narrativa
 *
 * Ejecuta buscar_fondos_narrativo_v2() y registra el evento de búsqueda
 * en search_events + search_event_results para trazabilidad (mapa admin).
 *
 * Payload esperado (BusquedaNarrativaParams):
 *   texto_narrativo, sujeto_termino_id, predicado_termino_id,
 *   verbo_ids, complemento_ids, tipo_desastre, afectacion,
 *   tipo_fondo, presupuesto_usd, limit, offset,
 *   perfil_id (opcional, del localStorage del cliente),
 *   municipio_origen_id, municipio_consulta_id (opcionales)
 *
 * POST-PROCESAMIENTO BACKEND (sin cambiar la firma del RPC):
 *   1. Expansión semántica: narrative_catalog_terms → amplía texto FTS
 *   2. Bonus territorial:   fondos_cobertura_territorial → reordena resultados
 *
 * MIGRACIÓN A POSTGRESQL PURO:
 *   Reemplazar todas las llamadas .rpc() y .from() por SQL directo.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { BusquedaNarrativaParams, ResultadoBusquedaNarrativa } from '@/types/database'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Valida que un string sea un UUID v1–v5 válido. Retorna null si no lo es. */
function safeUuid(val: unknown): string | null {
  if (typeof val !== 'string') return null
  return UUID_RE.test(val) ? val : null
}

// ── Expansión semántica ────────────────────────────────────────────────────────
/**
 * Lee narrative_catalog_terms para los IDs seleccionados y devuelve
 * los términos de expansión como texto adicional para FTS.
 * Mejora el matching de: conocimiento/monitoreo/innovación/agua/infraestructura.
 * Falla silenciosamente → la búsqueda sigue sin expansión.
 */
async function fetchExpansionTerms(
  db: ReturnType<typeof getDb>,
  ids: string[],
): Promise<string> {
  if (ids.length === 0) return ''
  try {
    // Primero intenta con option_id (IDs nuevos).
    const { data, error } = await db
      .from('narrative_catalog_terms')
      .select('term')
      .in('option_id', ids)
    if (error) {
      console.warn('[busqueda/narrativa] fetchExpansionTerms error', error.message)
    }
    let terms = (data ?? []).map((r: Record<string, unknown>) => String(r.term ?? r.texto ?? r.value ?? '')).filter(Boolean)

    // Fallback: si no encontró nada, intentar traduciendo IDs legacy → option_id
    if (!terms.length) {
      const { data: cat } = await db
        .from('narrative_catalog')
        .select('id')
        .in('legacy_termino_id', ids)
      const fallbackIds = (cat ?? []).map((r: { id: string }) => r.id)
      if (fallbackIds.length) {
        const { data: data2, error: error2 } = await db
          .from('narrative_catalog_terms')
          .select('term')
          .in('option_id', fallbackIds)
        if (error2) {
          console.warn('[busqueda/narrativa] fetchExpansionTerms fallback error', error2.message)
        }
        terms = (data2 ?? []).map((r: Record<string, unknown>) => String(r.term ?? r.texto ?? r.value ?? '')).filter(Boolean)
      }
    }

    return terms.join(' ')
  } catch (e) {
    console.warn('[busqueda/narrativa] fetchExpansionTerms exception', e)
    return ''
  }
}

// ── Pesos configurables ───────────────────────────────────────────────────────
/**
 * Pesos del re-ranking post-SQL leídos desde ranking_weight_config.
 * Todos los territoriales y el boost de conocimiento/innovación viven aquí.
 * Defaults = comportamiento idéntico a v5-ajustada para evitar regresiones.
 * Falla silenciosamente → devuelve defaults.
 */
interface RankingWeights {
  territorial_incluye_muni:    number
  territorial_incluye_depto:   number
  territorial_prioriza_muni:   number
  territorial_prioriza_depto:  number
  score_terminos_weight:       number
  /** Almacenado positivo en la tabla; se aplica como negativo en código */
  territorial_excluye_penalty: number
  /** Boost extra de score_texto para consultas de conocimiento/innovación (0 = sin cambio) */
  conocimiento_boost:          number
  /** Factor para amortiguar fondos muy amplios cuando no hay señal textual */
  broad_fund_dominance_dampener?: number
  territorial_match_municipio_include_bonus?: number
  territorial_match_departamento_include_bonus?: number
  territorial_match_region_include_bonus?: number
  territorial_match_municipio_prioriza_bonus?: number
  territorial_match_departamento_prioriza_bonus?: number
  territorial_match_region_prioriza_bonus?: number
  territorial_mismatch_municipio_penalty?: number
  territorial_mismatch_departamento_penalty?: number
  territorial_mismatch_region_penalty?: number
}

const WEIGHTS_DEFAULTS: RankingWeights = {
  territorial_incluye_muni:    0.20,
  territorial_incluye_depto:   0.12,
  territorial_prioriza_muni:   0.14,
  territorial_prioriza_depto:  0.08,
  score_terminos_weight:       1.0,
  territorial_excluye_penalty: 0.30,
  conocimiento_boost:          0.0,
  territorial_match_municipio_include_bonus:    0,
  territorial_match_departamento_include_bonus: 0,
  territorial_match_region_include_bonus:       0,
  territorial_match_municipio_prioriza_bonus:   0,
  territorial_match_departamento_prioriza_bonus:0,
  territorial_match_region_prioriza_bonus:      0,
  territorial_mismatch_municipio_penalty:       0,
  territorial_mismatch_departamento_penalty:    0,
  territorial_mismatch_region_penalty:          0,
}

async function fetchRankingWeights(
  db: ReturnType<typeof getDb>,
): Promise<RankingWeights> {
  try {
    const keys = Object.keys(WEIGHTS_DEFAULTS)
    const extraKeys = [
      'territorial_match_municipio_include_bonus',
      'territorial_match_departamento_include_bonus',
      'territorial_match_region_include_bonus',
      'territorial_match_municipio_prioriza_bonus',
      'territorial_match_departamento_prioriza_bonus',
      'territorial_match_region_prioriza_bonus',
      'territorial_mismatch_municipio_penalty',
      'territorial_mismatch_departamento_penalty',
      'territorial_mismatch_region_penalty',
    ]
    const { data, error } = await db
      .from('vw_ranking_weight_config')
      .select('weight_key, weight_value')
      .in('weight_key', [...keys, 'broad_fund_dominance_dampener_weight', ...extraKeys])
    if (error || !data?.length) return WEIGHTS_DEFAULTS
    const result: RankingWeights = { ...WEIGHTS_DEFAULTS }
    for (const row of data as Array<{ weight_key: string; weight_value: number | null }>) {
      if (row.weight_key in result && row.weight_value !== null) {
        ;(result as unknown as Record<string, number>)[row.weight_key] = row.weight_value
      }
      if (row.weight_key === 'broad_fund_dominance_dampener_weight' && row.weight_value !== null) {
        result.broad_fund_dominance_dampener = row.weight_value
      }
    }
    // Prefer newer territorial_*_match_* keys if están cargados
    const map = Object.fromEntries(
      (data as Array<{ weight_key: string; weight_value: number | null }>)
        .map(r => [r.weight_key, r.weight_value])
    )
    if (map['territorial_match_municipio_include_bonus'] !== undefined) {
      result.territorial_incluye_muni = Number(map['territorial_match_municipio_include_bonus'])
    }
    if (map['territorial_match_departamento_include_bonus'] !== undefined) {
      result.territorial_incluye_depto = Number(map['territorial_match_departamento_include_bonus'])
    }
    if (map['territorial_match_region_include_bonus'] !== undefined) {
      result.territorial_match_region_include_bonus = Number(map['territorial_match_region_include_bonus'])
    }
    if (map['territorial_match_municipio_prioriza_bonus'] !== undefined) {
      result.territorial_prioriza_muni = Number(map['territorial_match_municipio_prioriza_bonus'])
    }
    if (map['territorial_match_departamento_prioriza_bonus'] !== undefined) {
      result.territorial_prioriza_depto = Number(map['territorial_match_departamento_prioriza_bonus'])
    }
    if (map['territorial_match_region_prioriza_bonus'] !== undefined) {
      result.territorial_match_region_prioriza_bonus = Number(map['territorial_match_region_prioriza_bonus'])
    }
    if (map['territorial_mismatch_municipio_penalty'] !== undefined) {
      const v = Number(map['territorial_mismatch_municipio_penalty'])
      result.territorial_excluye_penalty = Math.abs(v)
      result.territorial_mismatch_municipio_penalty = v
    }
    if (map['territorial_mismatch_departamento_penalty'] !== undefined) {
      result.territorial_mismatch_departamento_penalty = Number(map['territorial_mismatch_departamento_penalty'])
    }
    if (map['territorial_mismatch_region_penalty'] !== undefined) {
      result.territorial_mismatch_region_penalty = Number(map['territorial_mismatch_region_penalty'])
    }
    return result
  } catch {
    return WEIGHTS_DEFAULTS
  }
}

// ── Nombres de términos legacy para analytics en payload_json ────────────────
/**
 * Dado un array de legacy UUIDs de cat_narrativa_terminos, devuelve un mapa
 * { legacy_id → termino_canonico } para enriquecer payload_json de search_events.
 * Falla silenciosamente → devuelve mapa vacío.
 */
async function fetchTermNames(
  db: ReturnType<typeof getDb>,
  legacyIds: string[],
): Promise<Record<string, string>> {
  if (legacyIds.length === 0) return {}
  try {
    const { data } = await db
      .from('cat_narrativa_terminos')
      .select('id, termino_canonico')
      .in('id', legacyIds)
    return Object.fromEntries(
      (data ?? []).map((r: { id: string; termino_canonico: string }) => [r.id, r.termino_canonico])
    )
  } catch {
    return {}
  }
}

// ── Traducción de IDs nuevos → IDs legacy ────────────────────────────────────
/**
 * Dado un array de nuevos UUIDs de narrative_catalog, devuelve un mapa
 * { nuevo_id → legacy_termino_id } consultando la columna bridge.
 * Falla silenciosamente → devuelve mapa vacío (la búsqueda sigue sin filtros).
 */
async function resolveToLegacyIds(
  db: ReturnType<typeof getDb>,
  newIds: string[],
): Promise<Record<string, string | null>> {
  if (newIds.length === 0) return {}
  try {
    const { data } = await db
      .from('narrative_catalog')
      .select('id, legacy_termino_id')
      .in('id', newIds)
    if (!data?.length) return {}
    return Object.fromEntries(
      (data as Array<{ id: string; legacy_termino_id: string | null }>)
        .map(r => [r.id, r.legacy_termino_id])
    )
  } catch {
    return {}
  }
}

// Keywords para detectar intención de conocimiento/innovación en el backend
// (se aplica sobre el texto expandido; independiente de la detección en cliente)
const KW_CONOCIMIENTO_BACKEND = [
  'conocimiento', 'monitoreo', 'diagnóstico', 'innovar', 'innovación',
  'investigar', 'investigación', 'capacitar', 'capacitación',
  'tecnología', 'ciencia', 'datos', 'sig', 'sensores', 'cartografía',
]

// ── Bonus territorial ─────────────────────────────────────────────────────────
/**
 * Reglas de bonus (post-SQL, no cambia la firma de buscar_fondos_narrativo_v2).
 * Los valores vienen de ranking_weight_config vía RankingWeights.
 * sin registros para el fondo → 0  (neutro, no excluye).
 *
 * No es un filtro duro: un fondo sin cobertura estructurada sigue apareciendo.
 */
async function calcTerritorialBonus(
  db: ReturnType<typeof getDb>,
  territorio_activo: string,
  fondoIds: string[],
  w: RankingWeights,
): Promise<Record<string, number>> {
  const bonus: Record<string, number> = {}
  if (!territorio_activo || fondoIds.length === 0) return bonus
  try {
    // Obtener departamento del municipio consultado
    const { data: mun } = await db
      .from('municipios')
      .select('departamento, codigo_departamento, nombre, nombre_normalizado, departamento_normalizado, catalogo_id')
      .eq('id', territorio_activo)
      .maybeSingle()
    const munRow = mun as Record<string, unknown> | null
    const deptoConsulta = munRow?.codigo_departamento
      ? String(munRow.codigo_departamento)
      : munRow?.departamento
      ? String(munRow.departamento)
      : null

    // Traer coberturas en un solo query (sin N+1)
    const { data: coberturas, error } = await db
      .from('fondos_cobertura_territorial')
      .select('fondo_id, municipio_id, codigo_departamento, tipo_cobertura, tipo_regla, region_tipo, region_nombre, es_restriccion_fuerte')
      .in('fondo_id', fondoIds)
    if (error || !coberturas?.length) return bonus

    for (const c of coberturas as Array<Record<string, unknown>>) {
      const fid      = String(c.fondo_id ?? '')
      const tipo     = String(c.tipo_regla ?? c.tipo_cobertura ?? '').toLowerCase()
      const cMuni    = c.municipio_id ? String(c.municipio_id) : null
      const cDepto   = c.codigo_departamento ? String(c.codigo_departamento) : null
      const matchMuni  = cMuni  !== null && cMuni  === territorio_activo
      const matchDepto = cDepto !== null && deptoConsulta !== null && cDepto === deptoConsulta

      let delta = 0
      if (tipo === 'excluye' && (matchMuni || matchDepto)) {
        if      (matchMuni && w.territorial_mismatch_municipio_penalty !== undefined)    delta = w.territorial_mismatch_municipio_penalty
        else if (matchDepto && w.territorial_mismatch_departamento_penalty !== undefined) delta = w.territorial_mismatch_departamento_penalty
      } else if (tipo === 'incluye') {
        if      (matchMuni && w.territorial_match_municipio_include_bonus !== undefined)    delta = w.territorial_match_municipio_include_bonus
        else if (matchDepto && w.territorial_match_departamento_include_bonus !== undefined) delta = w.territorial_match_departamento_include_bonus
      } else if (tipo === 'prioriza') {
        if      (matchMuni && w.territorial_match_municipio_prioriza_bonus !== undefined)    delta = w.territorial_match_municipio_prioriza_bonus
        else if (matchDepto && w.territorial_match_departamento_prioriza_bonus !== undefined) delta = w.territorial_match_departamento_prioriza_bonus
      }

      // Tomar el mayor beneficio o la penalización más fuerte para el fondo
      if (delta !== 0) {
        const prev = bonus[fid] ?? 0
        // Penalizaciones siempre ganan; bonos se acumulan hasta el máximo
        bonus[fid] = delta < 0 ? Math.min(prev, delta) : Math.max(prev, delta)
      }
    }
  } catch (e) {
    console.warn('[busqueda/narrativa] calcTerritorialBonus falló silenciosamente:', e)
  }
  return bonus
}

export async function POST(req: NextRequest) {
  try {
    const body: BusquedaNarrativaParams = await req.json()

    const {
      texto_narrativo,
      tipo_desastre,
      afectacion,
      tipo_fondo,
      presupuesto_usd,
      limit = 12,
      offset = 0,
    } = body

    // Validar UUIDs antes de pasarlos a la BD — evita errores 22P02 e inyecciones
    const sujeto_termino_id    = safeUuid(body.sujeto_termino_id)
    const predicado_termino_id = safeUuid(body.predicado_termino_id)
    const perfil_id            = safeUuid(body.perfil_id)
    const municipio_origen_id  = safeUuid(body.municipio_origen_id)
    const municipio_consulta_id = safeUuid(body.municipio_consulta_id)

    // ── Precedencia territorial (única fuente de verdad) ────────────────────
    // Regla:
    //   1. municipio_consulta_id = territorio de interés elegido explícitamente por el
    //      usuario en la búsqueda. Tiene prioridad total.
    //   2. municipio_origen_id = municipio del perfil del usuario. Se conserva solo
    //      para trazabilidad en search_events. NUNCA se usa como filtro de búsqueda.
    //   3. Si municipio_consulta_id es null, la búsqueda es territorialmente abierta.
    //      Un usuario de Bogotá consultando Caldas recibe resultados de Caldas.
    //      Un usuario de Bogotá sin territorio de interés recibe resultados nacionales.
    //
    // INVARIANTE: territorio_activo = municipio_consulta_id ?? null
    // PROHIBIDO:  territorio_activo = municipio_consulta_id ?? municipio_origen_id
    //             (ese fallback convertiría el perfil en un filtro duro implícito)
    const territorio_activo: string | null = municipio_consulta_id ?? null

    // Validar arrays de UUIDs
    const verbo_ids      = (body.verbo_ids ?? []).filter((id): id is string => safeUuid(id) !== null)
    const complemento_ids = (body.complemento_ids ?? []).filter((id): id is string => safeUuid(id) !== null)

    if (typeof limit !== 'number' || typeof offset !== 'number') {
      return NextResponse.json({ error: 'limit y offset deben ser números' }, { status: 400 })
    }

    const db = getDb()

    // ── C. Expansión semántica desde narrative_catalog_terms ──────────────────
    // Los IDs de verbo/complemento/sujeto/predicado se usan para buscar sus
    // términos de expansión (agua, monitoreo, SIG, conocimiento, etc.) y se
    // añaden al texto FTS. Esto mejora el matching sin cambiar la firma SQL.
    const idsParaExpansion = [
      ...(verbo_ids ?? []),
      ...(complemento_ids ?? []),
      ...(sujeto_termino_id ? [sujeto_termino_id] : []),
      ...(predicado_termino_id ? [predicado_termino_id] : []),
    ]
    // Paralelo: expansión semántica + traducción IDs + pesos configurables (sin coste extra de latencia)
    const [termExpansion, legacyMap, weights] = await Promise.all([
      fetchExpansionTerms(db, idsParaExpansion),
      resolveToLegacyIds(db, idsParaExpansion),
      fetchRankingWeights(db),
    ])
    const textoConExpansion = [texto_narrativo, termExpansion]
      .filter(Boolean)
      .join(' ')
      .trim() || null

    // ── Traducción new UUIDs → legacy UUIDs para buscar_fondos_narrativo_v2 ──
    // La función SQL usa FKs a cat_narrativa_terminos (legacy). Los IDs del
    // frontend vienen de narrative_catalog (nuevo). La columna legacy_termino_id
    // (añadida por migración 007) actúa como puente explícito por término.
    // Los IDs originales (nuevos) se conservan en search_events para trazabilidad.
    const sujeto_legacy    = sujeto_termino_id    ? (legacyMap[sujeto_termino_id]    ?? null) : null
    const predicado_legacy = predicado_termino_id ? (legacyMap[predicado_termino_id] ?? null) : null
    const verbos_legacy    = verbo_ids.map(id => legacyMap[id]).filter((id): id is string => id != null)
    const complementos_legacy = complemento_ids.map(id => legacyMap[id]).filter((id): id is string => id != null)

    // 1. Ejecutar búsqueda narrativa v2 + nombres de términos (en paralelo, sin coste de latencia)
    // MIGRATION NOTE: reemplazar por SELECT * FROM public.buscar_fondos_narrativo_v2(...)
    const legacyIdsParaNombres = [
      sujeto_legacy, predicado_legacy, ...verbos_legacy, ...complementos_legacy,
    ].filter((id): id is string => !!id)

    const [rpcResult, termNamesMap] = await Promise.all([
      db.rpc(
        'buscar_fondos_narrativo_v2',
        {
          // Texto FTS = texto original del usuario + términos de expansión semántica
          p_texto_narrativo:      textoConExpansion,
          p_sujeto_termino_id:    sujeto_legacy,
          p_predicado_termino_id: predicado_legacy,
          p_verbo_ids:            verbos_legacy.length ? verbos_legacy : null,
          p_complemento_ids:      complementos_legacy.length ? complementos_legacy : null,
          p_tipo_desastre:        tipo_desastre ?? null,
          p_afectacion:           afectacion ?? null,
          p_tipo_fondo:           tipo_fondo ?? null,
          p_presupuesto_usd:      presupuesto_usd ?? null,
          p_limit:                limit,
          p_offset:               offset,
        }
      ),
      fetchTermNames(db, legacyIdsParaNombres),
    ])

    const { data: rawResultados, error: errorBusqueda } = rpcResult

    if (errorBusqueda) {
      console.error('[/api/busqueda/narrativa] rpc error', errorBusqueda.message)
      return NextResponse.json({ error: errorBusqueda.message }, { status: 500 })
    }

    let resultados = (rawResultados as ResultadoBusquedaNarrativa[]) ?? []
    const total_count = resultados[0]?.total_count ?? 0

    // ── D. Re-ranking post-SQL: territorial + conocimiento/innovación ─────────
    // Fuentes de re-orden:
    //   1. Bonus territorial (fondos_cobertura_territorial)
    //   2. Boost de conocimiento/innovación (cuando weights.conocimiento_boost > 0)
    // Ambos leen sus valores desde ranking_weight_config (ya en `weights`).
    // No cambia la firma SQL. No es filtro duro.
    const esConsultaConocimiento = textoConExpansion
      ? KW_CONOCIMIENTO_BACKEND.some(kw =>
          textoConExpansion.toLowerCase().includes(kw))
      : false
    const needsTerritorial = territorio_activo !== null && resultados.length > 0
    const needsKI          = esConsultaConocimiento && weights.conocimiento_boost > 0

    if (needsTerritorial || needsKI) {
      let bonusMap: Record<string, number> = {}
      if (needsTerritorial) {
        const fondoIds = resultados.map(r => r.id)
        bonusMap = await calcTerritorialBonus(db, territorio_activo!, fondoIds, weights)
      }
      const hasBonusoTerritorial = Object.keys(bonusMap).length > 0
      if (hasBonusoTerritorial || needsKI) {
        resultados = resultados
          .map(r => {
            const score_territorial_bonus = bonusMap[r.id] ?? 0

            // Guardrail: limita el aporte de score_terminos cuando no hay señal textual/contextual
            // Aplica solo a consultas con desastre + afectación y NO a conocimiento/innovación.
            const hasDesastreYAfectacion = Boolean(tipo_desastre) && Boolean(afectacion)
            const hasTexto = (r.score_texto ?? 0) > 0
            const hasContexto = (r.score_contexto ?? 0) > 0.02
            // No aplicar guardrail en consultas de conocimiento/innovación ni cuando el predicado es Conocimiento del riesgo.
            const esPredicadoConocimiento = predicado_legacy === '8258ac16-5a5c-4194-8070-7202158a7bd8'
            const needsGuardrail = !esConsultaConocimiento && !esPredicadoConocimiento && hasDesastreYAfectacion && !hasTexto && !hasContexto
            const termCapFactor = needsGuardrail ? 0.5 : 1

            const score_total_guarded =
              r.score_total
              - r.score_terminos * weights.score_terminos_weight
              + r.score_terminos * weights.score_terminos_weight * termCapFactor

            return { ...r, score_territorial_bonus, score_total_guarded, guardrail_applied: needsGuardrail ? termCapFactor : 1 }
          })
          .sort((a, b) => {
            let sa = (a.score_total_guarded ?? a.score_total) + (a.score_territorial_bonus ?? 0)
            let sb = (b.score_total_guarded ?? b.score_total) + (b.score_territorial_bonus ?? 0)
            const damp = weights.broad_fund_dominance_dampener ?? 1
            if (damp < 1) {
              if (a.score_texto === 0) sa *= damp
              if (b.score_texto === 0) sb *= damp
            }
            if (needsKI) {
              sa += a.score_texto * weights.conocimiento_boost
              sb += b.score_texto * weights.conocimiento_boost
            }
            return sb - sa
          })
      }
    }

    // 2. Registrar evento de búsqueda (trazabilidad para mapa admin)
    // Solo si hay texto o algún término seleccionado (evitar eventos vacíos)
    let search_event_id: string | null = null
    const hayContenido =
      texto_narrativo ||
      sujeto_termino_id ||
      predicado_termino_id ||
      tipo_desastre ||
      afectacion

    if (hayContenido) {
      const eventoPayload = {
        perfil_id: perfil_id ?? null,
        // municipio_origen_id: solo trazabilidad — no se usa en el ranking ni en el RPC
        municipio_origen_id: municipio_origen_id ?? null,
        // municipio_consulta_id = territorio_activo cuando el usuario eligió territorio de interés
        municipio_consulta_id: territorio_activo,
        texto_narrativo: texto_narrativo ?? null,
        sujeto_termino_id: sujeto_termino_id ?? null,
        predicado_termino_id: predicado_termino_id ?? null,
        tipo_desastre: tipo_desastre ?? null,
        afectacion: afectacion ?? null,
        nivel_necesidad: null,
        payload_json: {
          // ── Contexto del wizard (legible para analítica admin) ──────────────
          // sujeto_ui / predicado_ui / verbos_ui / complementos_ui: nombres canónicos
          // para el mapa admin (quién, qué necesidad, qué temas)
          sujeto_ui:       sujeto_legacy ? (termNamesMap[sujeto_legacy] ?? null) : null,
          predicado_ui:    predicado_legacy ? (termNamesMap[predicado_legacy] ?? null) : null,
          verbos_ui:       verbos_legacy.map(id => termNamesMap[id]).filter(Boolean),
          complementos_ui: complementos_legacy.map(id => termNamesMap[id]).filter(Boolean),
          tipo_fondo:      tipo_fondo ?? null,
          tipo_desastre:   tipo_desastre ?? null,
          afectacion:      afectacion ?? null,
          presupuesto_usd: presupuesto_usd ?? null,
          cantidad_resultados: total_count,
        },
      }

      // MIGRATION NOTE: reemplazar por INSERT INTO public.search_events (...) RETURNING id
      const { data: eventoData, error: errorEvento } = await db
        .from('search_events')
        .insert(eventoPayload)
        .select('id')
        .single()

      if (!errorEvento && eventoData) {
        search_event_id = (eventoData as { id: string }).id

        // Insertar resultados del evento (top 20 por posición).
        // La función ya devuelve el desglose completo; los sub-scores se mapean
        // directamente a las columnas de auditoría de search_event_results.
        if (resultados.length > 0 && search_event_id) {
          const filas = resultados
            .slice(0, 20)
            .map((r, i) => ({
              search_event_id,
              fondo_id: r.id,
              rank_orden: i + 1,
              score_total: r.score_total ?? 0,
              score_terminos: (r.score_terminos ?? 0) + (r.score_sujeto ?? 0) + (r.score_predicado ?? 0),
              score_filtros: (r.score_terminos ?? 0) + (r.score_sujeto ?? 0) + (r.score_predicado ?? 0),
              score_texto: r.score_texto ?? 0,
              score_bonus_instructivo: r.score_instructivo ?? 0,
            }))

          // MIGRATION NOTE: reemplazar por INSERT INTO public.search_event_results (...)
          const { error: errorResultados } = await db
            .from('search_event_results')
            .insert(filas)

          if (errorResultados) {
            // No es crítico: la búsqueda ya se ejecutó, solo falla la trazabilidad
            console.error('[/api/busqueda/narrativa] no se guardaron resultados del evento:', {
              code: errorResultados.code,
              message: errorResultados.message,
              details: errorResultados.details,
              hint: errorResultados.hint,
            })
          }
        }
      } else if (errorEvento) {
        console.error('[/api/busqueda/narrativa] SEARCH_EVENT INSERT FAILED:', {
          code: errorEvento.code,
          message: errorEvento.message,
          details: errorEvento.details,
          hint: errorEvento.hint,
          payload: JSON.stringify(eventoPayload).slice(0, 500),
        })
      }
    }

    return NextResponse.json({ resultados, total_count, search_event_id })
  } catch (e) {
    console.error('[/api/busqueda/narrativa] error', e)
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }
}
