/**
 * GET /api/admin/analytics/territorio
 *
 * Devuelve analítica completa para un territorio (municipio o departamento).
 * Eje central: municipio_origen_id en search_events (desde dónde usa el usuario la plataforma).
 *
 * Query params:
 *   municipio_id   — UUID de municipio (para vista municipal)
 *   dept_code      — código de 2 dígitos de departamento (para vista departamental)
 *                    Solo uno de los dos se usa; municipio_id tiene precedencia.
 *
 * Devuelve:
 *   info               → nombre, tipo, departamento, codigo_divipola
 *   stats              → total_busquedas, usuarios_unicos, ultima_busqueda
 *   actor_frecuente    → tipo_actor más común
 *   actores            → [ { actor, usuarios } ] — ranking de actores
 *   top_fondos         → [ { fondo_id, nombre, tipo, veces } ] — top 8 fondos consultados
 *   top_sujetos        → [ { nombre, veces } ] — paso 1 del buscador (quién soy)
 *   top_predicados     → [ { nombre, veces } ] — paso 2 (qué necesito)
 *   actividad_reciente → últimas 5 búsquedas con contexto resumido
 *   municipios_activos → (solo para dept) ranking de municipios más activos dentro del dept
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOTAS TÉCNICAS — vistas SQL sugeridas para implementar:
 *
 * 1. vw_analytics_territorio_municipio
 *    SELECT
 *      se.municipio_origen_id,
 *      COUNT(*) as total_busquedas,
 *      COUNT(DISTINCT se.perfil_id) as usuarios_unicos,
 *      MAX(se.created_at) as ultima_busqueda
 *    FROM search_events se
 *    WHERE se.municipio_origen_id IS NOT NULL
 *    GROUP BY se.municipio_origen_id;
 *
 * 2. vw_analytics_top_fondos_por_municipio
 *    SELECT
 *      se.municipio_origen_id,
 *      ser.fondo_id,
 *      f.nombre,
 *      f.tipo_fondo_categoria,
 *      COUNT(*) as veces_consultado
 *    FROM search_event_results ser
 *    JOIN search_events se ON se.id = ser.search_event_id
 *    JOIN fondos f ON f.id = ser.fondo_id
 *    WHERE se.municipio_origen_id IS NOT NULL
 *    GROUP BY se.municipio_origen_id, ser.fondo_id, f.nombre, f.tipo_fondo_categoria;
 *
 * 3. vw_analytics_actores_por_municipio
 *    SELECT
 *      se.municipio_origen_id,
 *      pc.tipo_actor,
 *      COUNT(DISTINCT se.perfil_id) as usuarios
 *    FROM search_events se
 *    JOIN perfiles_consulta pc ON pc.id = se.perfil_id
 *    WHERE se.municipio_origen_id IS NOT NULL AND pc.tipo_actor IS NOT NULL
 *    GROUP BY se.municipio_origen_id, pc.tipo_actor;
 *
 * Implementar estas vistas mejoraría el rendimiento; por ahora se hace en TS.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
function safeUuid(v: unknown): string | null {
  return typeof v === 'string' && UUID_RE.test(v) ? v : null
}

function countBy<T>(arr: T[], key: (item: T) => string | null | undefined): { nombre: string; veces: number }[] {
  const counts: Record<string, number> = {}
  for (const item of arr) {
    const k = key(item)
    if (k) counts[k] = (counts[k] ?? 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([nombre, veces]) => ({ nombre, veces }))
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const municipioIdRaw = searchParams.get('municipio_id')
  const deptCode       = searchParams.get('dept_code')?.trim()

  const municipioId = safeUuid(municipioIdRaw)

  if (!municipioId && !deptCode) {
    return NextResponse.json({ error: 'Requiere municipio_id (UUID) o dept_code (2 dígitos)' }, { status: 400 })
  }

  try {
    const db = getDb()
    let tipo: 'municipio' | 'departamento' = municipioId ? 'municipio' : 'departamento'
    let nombre = ''
    let departamento = ''
    let codigoDivipola: string | null = null
    let municipioIds: string[] = []

    if (tipo === 'municipio') {
      // ── Vista municipal ──────────────────────────────────────────────────────
      const { data: muniData } = await db
        .from('municipios')
        .select('id, nombre, departamento, codigo_divipola, codigo_departamento')
        .eq('id', municipioId!)
        .maybeSingle()

      if (!muniData) {
        return NextResponse.json({ error: 'Municipio no encontrado' }, { status: 404 })
      }
      const m = muniData as { id: string; nombre: string; departamento: string; codigo_divipola: string; codigo_departamento: string }
      nombre = m.nombre
      departamento = m.departamento
      codigoDivipola = m.codigo_divipola
      municipioIds = [municipioId!]
    } else {
      // ── Vista departamental ──────────────────────────────────────────────────
      // Normalizar el código a 2 dígitos
      const deptNorm = deptCode!.replace(/\D+/g, '').padStart(2, '0')

      const { data: munisDept } = await db
        .from('municipios')
        .select('id, nombre, codigo_divipola, departamento')
        .eq('codigo_departamento', deptNorm)

      if (!munisDept || munisDept.length === 0) {
        return NextResponse.json({ error: 'Departamento no encontrado' }, { status: 404 })
      }
      const firstMuni = munisDept[0] as { nombre: string; departamento: string }
      nombre = firstMuni.departamento ?? `Departamento ${deptNorm}`
      departamento = nombre
      municipioIds = (munisDept as { id: string }[]).map(m => m.id)
    }

    // ── Obtener search_events del territorio (max 500 para analytics) ──────────
    const { data: eventosRaw } = await db
      .from('search_events')
      .select('id, perfil_id, sujeto_termino_id, predicado_termino_id, tipo_desastre, afectacion, payload_json, created_at')
      .in('municipio_origen_id', municipioIds)
      .order('created_at', { ascending: false })
      .limit(500)

    type EventoRow = {
      id: string
      perfil_id: string | null
      sujeto_termino_id: string | null
      predicado_termino_id: string | null
      tipo_desastre: string | null
      afectacion: string | null
      payload_json: Record<string, unknown> | null
      created_at: string
    }
    const eventos: EventoRow[] = (eventosRaw ?? []) as EventoRow[]

    const totalBusquedas = eventos.length
    const ultimaBusqueda = eventos[0]?.created_at ?? null

    if (totalBusquedas === 0) {
      return NextResponse.json({
        tipo,
        nombre,
        departamento,
        codigo_divipola: codigoDivipola,
        stats: { total_busquedas: 0, usuarios_unicos: 0, ultima_busqueda: null },
        actor_frecuente: null,
        actores: [],
        top_fondos: [],
        top_sujetos: [],
        top_predicados: [],
        actividad_reciente: [],
        municipios_activos: tipo === 'departamento' ? [] : undefined,
      })
    }

    const eventoIds  = eventos.map(e => e.id)
    const perfilIds  = Array.from(new Set(eventos.map(e => e.perfil_id).filter(Boolean))) as string[]
    const usuariosUnicos = perfilIds.length

    // ── Paralelo: perfiles + resultados de búsqueda + nombres de términos ─────
    const sujetoIds    = Array.from(new Set(eventos.map(e => e.sujeto_termino_id).filter(Boolean))) as string[]
    const predicadoIds = Array.from(new Set(eventos.map(e => e.predicado_termino_id).filter(Boolean))) as string[]
    const terminoIds   = Array.from(new Set([...sujetoIds, ...predicadoIds]))

    const [perfilesRes, resultadosRes, terminosRes, fondosNombresRes] = await Promise.all([
      // Actores (tipo_actor de perfiles) — solo los que han buscado en este territorio
      perfilIds.length > 0
        ? db.from('perfiles_consulta').select('id, tipo_actor').in('id', perfilIds)
        : Promise.resolve({ data: [] }),
      // Top fondos desde search_event_results
      eventoIds.length > 0
        ? db.from('search_event_results').select('search_event_id, fondo_id, posicion').in('search_event_id', eventoIds.slice(0, 200))
        : Promise.resolve({ data: [] }),
      // Nombres de términos narrativos
      terminoIds.length > 0
        ? db.from('cat_narrativa_terminos').select('id, termino_canonico, grupo').in('id', terminoIds)
        : Promise.resolve({ data: [] }),
      // Nombres de fondos (se obtendrán después)
      Promise.resolve({ data: [] }),
    ])

    // ── Actores ────────────────────────────────────────────────────────────────
    type PerfilRow = { id: string; tipo_actor: string | null }
    const perfiles = (perfilesRes.data ?? []) as PerfilRow[]
    const perfilActorMap = Object.fromEntries(perfiles.map(p => [p.id, p.tipo_actor]))

    const actoresCount: Record<string, number> = {}
    for (const e of eventos) {
      const actor = e.perfil_id ? perfilActorMap[e.perfil_id] : null
      if (actor) {
        actoresCount[actor] = (actoresCount[actor] ?? 0) + 1
      }
    }
    const actoresRanking = Object.entries(actoresCount)
      .sort((a, b) => b[1] - a[1])
      .map(([actor, usuarios]) => ({ actor, usuarios }))
    const actorFrecuente = actoresRanking[0]?.actor ?? null

    // ── Top fondos ─────────────────────────────────────────────────────────────
    type ResultadoRow = { search_event_id: string; fondo_id: string; posicion: number }
    const resultados = (resultadosRes.data ?? []) as ResultadoRow[]

    const fondoCount: Record<string, number> = {}
    for (const r of resultados) {
      fondoCount[r.fondo_id] = (fondoCount[r.fondo_id] ?? 0) + 1
    }
    const topFondoIds = Object.entries(fondoCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id]) => id)

    // Obtener nombres y tipos de los top fondos
    let topFondos: { fondo_id: string; nombre: string; tipo: string; veces: number }[] = []
    if (topFondoIds.length > 0) {
      const { data: fondoRows } = await db
        .from('fondos')
        .select('id, nombre, tipo_fondo_categoria')
        .in('id', topFondoIds)
      const fondoMap = Object.fromEntries(
        ((fondoRows ?? []) as { id: string; nombre: string; tipo_fondo_categoria: string }[])
          .map(f => [f.id, f])
      )
      topFondos = topFondoIds.map(id => ({
        fondo_id: id,
        nombre:   fondoMap[id]?.nombre ?? id,
        tipo:     fondoMap[id]?.tipo_fondo_categoria ?? '',
        veces:    fondoCount[id] ?? 0,
      }))
    }

    // ── Top sujetos y predicados ───────────────────────────────────────────────
    type TerminoRow = { id: string; termino_canonico: string; grupo: string }
    const terminosMap = Object.fromEntries(
      ((terminosRes.data ?? []) as TerminoRow[]).map(t => [t.id, t.termino_canonico])
    )

    const topSujetos   = countBy(eventos, e => e.sujeto_termino_id    ? terminosMap[e.sujeto_termino_id]    ?? null : null)
    const topPredicados = countBy(eventos, e => e.predicado_termino_id ? terminosMap[e.predicado_termino_id] ?? null : null)

    // Enriquecer con payload_json si termino_id no resuelve
    const topSujetosRich = topSujetos.length > 0
      ? topSujetos
      : countBy(eventos, e => (e.payload_json as Record<string, unknown> | null)?.sujeto_ui as string | null)
    const topPredicadosRich = topPredicados.length > 0
      ? topPredicados
      : countBy(eventos, e => (e.payload_json as Record<string, unknown> | null)?.predicado_ui as string | null)

    // ── Actividad reciente ─────────────────────────────────────────────────────
    const actividadReciente = eventos.slice(0, 8).map(e => {
      const pj = e.payload_json as Record<string, unknown> | null
      return {
        created_at:         e.created_at,
        sujeto_ui:          (terminosMap[e.sujeto_termino_id ?? ''] ?? pj?.sujeto_ui ?? null) as string | null,
        predicado_ui:       (terminosMap[e.predicado_termino_id ?? ''] ?? pj?.predicado_ui ?? null) as string | null,
        tipo_desastre:      e.tipo_desastre,
        afectacion:         e.afectacion,
        cantidad_resultados: (pj?.cantidad_resultados ?? null) as number | null,
      }
    })

    // ── Municipios activos dentro del departamento ────────────────────────────
    let municipiosActivos: { nombre: string; codigo_divipola: string | null; total_busquedas: number; usuarios_unicos: number }[] | undefined
    if (tipo === 'departamento') {
      // Agregar eventos por municipio_origen_id
      const eventsMuniCount: Record<string, number>         = {}
      const eventsMuniPerfiles: Record<string, Set<string>> = {}
      const { data: eventsMuniRaw } = await db
        .from('search_events')
        .select('municipio_origen_id, perfil_id')
        .in('municipio_origen_id', municipioIds)
        .limit(1000)

      type EventMiniRow = { municipio_origen_id: string | null; perfil_id: string | null }
      for (const row of ((eventsMuniRaw ?? []) as EventMiniRow[])) {
        const mid = row.municipio_origen_id
        if (!mid) continue
        eventsMuniCount[mid] = (eventsMuniCount[mid] ?? 0) + 1
        if (!eventsMuniPerfiles[mid]) eventsMuniPerfiles[mid] = new Set()
        if (row.perfil_id) eventsMuniPerfiles[mid].add(row.perfil_id)
      }

      // Obtener nombres / divipola de los municipios
      const { data: muniInfoRaw } = await db
        .from('municipios')
        .select('id, nombre, codigo_divipola')
        .in('id', municipioIds)

      const muniInfoMap = Object.fromEntries(
        ((muniInfoRaw ?? []) as { id: string; nombre: string; codigo_divipola: string }[]).map(m => [m.id, m])
      )

      municipiosActivos = Object.entries(eventsMuniCount)
        .map(([mid, total_busquedas]) => ({
          nombre:          muniInfoMap[mid]?.nombre ?? mid,
          codigo_divipola: muniInfoMap[mid]?.codigo_divipola ?? null,
          total_busquedas,
          usuarios_unicos: eventsMuniPerfiles[mid]?.size ?? 0,
        }))
        .sort((a, b) => b.total_busquedas - a.total_busquedas)
        .slice(0, 15)
    }

    return NextResponse.json({
      tipo,
      nombre,
      departamento,
      codigo_divipola:  codigoDivipola,
      stats: {
        total_busquedas:  totalBusquedas,
        usuarios_unicos:  usuariosUnicos,
        ultima_busqueda:  ultimaBusqueda,
      },
      actor_frecuente: actorFrecuente,
      actores:         actoresRanking.slice(0, 6),
      top_fondos:      topFondos,
      top_sujetos:     topSujetosRich,
      top_predicados:  topPredicadosRich,
      actividad_reciente: actividadReciente,
      ...(tipo === 'departamento' ? { municipios_activos: municipiosActivos } : {}),
    })
  } catch (e) {
    console.error('[/api/admin/analytics/territorio]', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
