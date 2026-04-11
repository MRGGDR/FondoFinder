/**
 * GET /api/admin/analytics/territorio
 *
 * Devuelve analÃ­tica completa para un territorio (municipio o departamento).
 * Eje central: municipio_origen_id en search_events (desde dÃ³nde usa el usuario la plataforma).
 *
 * Query params:
 *   municipio_id   â€” UUID de municipio (para vista municipal)
 *   dept_code      â€” cÃ³digo de 2 dÃ­gitos de departamento (para vista departamental)
 *                    Solo uno de los dos se usa; municipio_id tiene precedencia.
 *
 * Devuelve:
 *   info               â†’ nombre, tipo, departamento, codigo_divipola
 *   stats              â†’ total_busquedas, usuarios_unicos, ultima_busqueda
 *   actor_frecuente    â†’ tipo_actor mÃ¡s comÃºn
 *   actores            â†’ [ { actor, usuarios } ] â€” ranking de actores
 *   top_fondos         â†’ [ { fondo_id, nombre, tipo, veces } ] â€” top 8 fondos consultados
 *   top_sujetos        â†’ [ { nombre, veces } ] â€” paso 1 del buscador (quiÃ©n soy)
 *   top_predicados     â†’ [ { nombre, veces } ] â€” paso 2 (quÃ© necesito)
 *   actividad_reciente â†’ Ãºltimas 5 bÃºsquedas con contexto resumido
 *   municipios_activos â†’ (solo para dept) ranking de municipios mÃ¡s activos dentro del dept
 *
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * NOTAS TÃ‰CNICAS â€” vistas SQL sugeridas para implementar:
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
 * Implementar estas vistas mejorarÃ­a el rendimiento; por ahora se hace en TS.
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { authorizeAdminRequest } from '@/lib/adminGuardServer'

export const dynamic = 'force-dynamic'

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
  const noStoreHeaders = { 'Cache-Control': 'no-store' }
  const jsonNoStore = (body: unknown, init?: { status?: number }) =>
    NextResponse.json(body as Record<string, unknown>, {
      status: init?.status ?? 200,
      headers: noStoreHeaders,
    })

  const municipioId = safeUuid(municipioIdRaw)
  const deptCodeDigits = deptCode ? deptCode.replace(/\D+/g, '') : ''

  if (!municipioId && !deptCodeDigits) {
    return jsonNoStore({ error: 'Requiere municipio_id (UUID) o dept_code (2 digitos)' }, { status: 400 })
  }
  if (!municipioId && deptCodeDigits.length > 2) {
    return jsonNoStore({ error: 'dept_code invalido' }, { status: 400 })
  }

  try {
    const auth = await authorizeAdminRequest(req)
    if (!auth.ok) {
      return jsonNoStore({ error: auth.error }, { status: auth.status })
    }

    const db = getDb()
    let tipo: 'municipio' | 'departamento' = municipioId ? 'municipio' : 'departamento'
    let nombre = ''
    let departamento = ''
    let codigoDivipola: string | null = null
    let municipioIds: string[] = []

    if (tipo === 'municipio') {
      // â”€â”€ Vista municipal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const { data: muniData } = await db
        .from('municipios')
        .select('id, nombre, departamento, codigo_divipola, codigo_departamento')
        .eq('id', municipioId!)
        .maybeSingle()

      if (!muniData) {
        return jsonNoStore({ error: 'Municipio no encontrado' }, { status: 404 })
      }
      const m = muniData as { id: string; nombre: string; departamento: string; codigo_divipola: string; codigo_departamento: string }
      nombre = m.nombre
      departamento = m.departamento
      codigoDivipola = m.codigo_divipola
      municipioIds = [municipioId!]
    } else {
      // â”€â”€ Vista departamental â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      // Normalizar el cÃ³digo a 2 dÃ­gitos
      const deptNorm = deptCodeDigits.padStart(2, '0')

      const { data: munisDept } = await db
        .from('municipios')
        .select('id, nombre, codigo_divipola, departamento')
        .eq('codigo_departamento', deptNorm)

      if (!munisDept || munisDept.length === 0) {
        return jsonNoStore({ error: 'Departamento no encontrado' }, { status: 404 })
      }
      const firstMuni = munisDept[0] as { nombre: string; departamento: string }
      nombre = firstMuni.departamento ?? `Departamento ${deptNorm}`
      departamento = nombre
      municipioIds = (munisDept as { id: string }[]).map(m => m.id)
    }

    // â”€â”€ Obtener ng_search_events del territorio (max 500 para analytics) â”€â”€â”€â”€â”€â”€
    const { data: eventosRaw } = await db
      .from('ng_search_events')
      .select('id, perfil_id, actor_id, tipo_fondo_id, proceso_ids, objetivo_ids, categoria_id, actividad_ids, resultados_count, created_at')
      .in('municipio_origen_id', municipioIds)
      .order('created_at', { ascending: false })
      .limit(500)

    type EventoRow = {
      id: string
      perfil_id: string | null
      actor_id: number | null
      tipo_fondo_id: number | null
      proceso_ids: number[] | null
      objetivo_ids: number[] | null
      categoria_id: number | null
      actividad_ids: number[] | null
      resultados_count: number | null
      created_at: string
    }
    const eventos: EventoRow[] = (eventosRaw ?? []) as EventoRow[]

    const totalBusquedas = eventos.length
    const ultimaBusqueda = eventos[0]?.created_at ?? null

    if (totalBusquedas === 0) {
      return jsonNoStore({
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
        top_objetivos: [],
        top_categorias: [],
        top_actividades: [],
        avg_resultados: null,
        actividad_reciente: [],
        municipios_activos: tipo === 'departamento' ? [] : undefined,
      })
    }

    const eventoIds  = eventos.map(e => e.id)
    const perfilIds  = Array.from(new Set(eventos.map(e => e.perfil_id).filter(Boolean))) as string[]
    const usuariosUnicos = perfilIds.length

    // â”€â”€ Paralelo: resultados de bÃºsqueda + lookups de actores y procesos â”€â”€â”€â”€â”€â”€
    const [resultadosRes, ngActoresRes, ngProcesosRes, ngObjetivosRes, ngCategoriasRes, ngActividadesRes] = await Promise.all([
      // Top fondos desde ng_search_event_results
      eventoIds.length > 0
        ? db.from('ng_search_event_results').select('search_event_id, fondo_id, posicion').in('search_event_id', eventoIds.slice(0, 200))
        : Promise.resolve({ data: [] }),
      // Nombres de actores (para resolver actor_id de ng_search_events)
      db.from('ng_actores').select('actor_id, actor_nombre'),
      // Nombres de procesos GRD
      db.from('cat_procesos').select('id, nombre'),
      // Nombres de objetivos PNGRD
      db.from('cat_objetivos_pngrd').select('id, nombre_corto'),
      // CategorÃ­as (vÃ­a RPC con params nulos = devuelve todo)
      db.rpc('ng_listar_categorias_v1', { p_actor_id: null }),
      // Actividades (vÃ­a RPC con params nulos = devuelve todo)
      db.rpc('ng_listar_actividades_v1', { p_actor_id: null, p_categoria_id: null }),
    ])

    // â”€â”€ Lookup maps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    type NgActorRow = { actor_id: number; actor_nombre: string }
    const ngActoresMap: Record<string, string> = Object.fromEntries(
      ((ngActoresRes.data ?? []) as NgActorRow[]).map(a => [String(a.actor_id), a.actor_nombre])
    )

    type NgProcesoRow = { id: number; nombre: string }
    const ngProcesosMap: Record<string, string> = Object.fromEntries(
      ((ngProcesosRes.data ?? []) as NgProcesoRow[]).map(p => [String(p.id), p.nombre])
    )

    type NgObjetivoRow = { id: number; nombre_corto: string }
    const ngObjetivosMap: Record<string, string> = Object.fromEntries(
      ((ngObjetivosRes.data ?? []) as NgObjetivoRow[]).map(o => [String(o.id), o.nombre_corto])
    )

    type NgCategoriaRow = { categoria_id: number | string | null; categoria_nombre: string | null }
    const ngCategoriasMap: Record<string, string> = Object.fromEntries(
      ((ngCategoriasRes.data ?? []) as NgCategoriaRow[])
        .filter(c => c.categoria_id != null)
        .map(c => [String(c.categoria_id), c.categoria_nombre ?? `CategorÃ­a ${c.categoria_id}`])
    )

    type NgActividadRow = { actividad_id: number | string | null; actividad_nombre: string | null }
    const ngActividadesMap: Record<string, string> = Object.fromEntries(
      ((ngActividadesRes.data ?? []) as NgActividadRow[])
        .filter(a => a.actividad_id != null)
        .map(a => [String(a.actividad_id), a.actividad_nombre ?? `Actividad ${a.actividad_id}`])
    )

    // â”€â”€ Actores â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const actoresCount: Record<string, number> = {}
    for (const e of eventos) {
      const actor = e.actor_id != null ? (ngActoresMap[String(e.actor_id)] ?? `Actor ${e.actor_id}`) : null
      if (actor) {
        actoresCount[actor] = (actoresCount[actor] ?? 0) + 1
      }
    }
    const actoresRanking = Object.entries(actoresCount)
      .sort((a, b) => b[1] - a[1])
      .map(([actor, usuarios]) => ({ actor, usuarios }))
    const actorFrecuente = actoresRanking[0]?.actor ?? null

    // â”€â”€ Top fondos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    // â”€â”€ Top tipos de fondo y procesos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Resolver tipo_fondo_id a nombre via RPC
    const tipoFondoIdsUsados = Array.from(
      new Set(eventos.map(e => e.tipo_fondo_id).filter(v => v != null).map(v => String(v!)))
    )
    let ngTiposFondoMap: Record<string, string> = {}
    if (tipoFondoIdsUsados.length > 0) {
      const { data: tiposRows } = await db.rpc('ng_listar_tipos_fondo_v1', { p_actor_id: null })
      ngTiposFondoMap = Object.fromEntries(
        ((tiposRows ?? []) as { tipo_fondo_id: number; tipo_fondo_nombre: string }[])
          .map(t => [String(t.tipo_fondo_id), t.tipo_fondo_nombre])
      )
    }

    const topTiposFondo = countBy(
      eventos,
      e => {
        if (e.tipo_fondo_id == null) return null
        return ngTiposFondoMap[String(e.tipo_fondo_id)] ?? `Tipo ${e.tipo_fondo_id}`
      }
    )

    const topProcesos = countBy(
      eventos,
      e => {
        const ids = e.proceso_ids
        if (!Array.isArray(ids) || ids.length === 0) return null
        return ngProcesosMap[String(ids[0])] ?? `Proceso ${ids[0]}`
      }
    )

    const topObjetivos = countBy(
      eventos,
      e => {
        const ids = e.objetivo_ids
        if (!Array.isArray(ids) || ids.length === 0) return null
        return ngObjetivosMap[String(ids[0])] ?? `Objetivo ${ids[0]}`
      }
    )

    const topCategorias = countBy(
      eventos,
      e => {
        if (e.categoria_id == null) return null
        return ngCategoriasMap[String(e.categoria_id)] ?? `CategorÃ­a ${e.categoria_id}`
      }
    )

    const topActividades = countBy(
      eventos,
      e => {
        const ids = e.actividad_ids
        if (!Array.isArray(ids) || ids.length === 0) return null
        return ngActividadesMap[String(ids[0])] ?? `Actividad ${ids[0]}`
      }
    )

    // Promedio de resultados por bÃºsqueda
    const eventosConResultados = eventos.filter(e => e.resultados_count != null && e.resultados_count > 0)
    const avgResultados = eventosConResultados.length > 0
      ? Math.round(eventosConResultados.reduce((s, e) => s + (e.resultados_count ?? 0), 0) / eventosConResultados.length)
      : null

    // â”€â”€ Actividad reciente â€” desglose completo por paso del wizard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const actividadReciente = eventos.slice(0, 8).map(e => ({
      created_at:          e.created_at,
      actor_ui:            e.actor_id != null ? (ngActoresMap[String(e.actor_id)] ?? `Actor ${e.actor_id}`) : null,
      tipo_fondo_ui:       e.tipo_fondo_id != null ? (ngTiposFondoMap[String(e.tipo_fondo_id)] ?? `Tipo ${e.tipo_fondo_id}`) : null,
      procesos_ui:         Array.isArray(e.proceso_ids) && e.proceso_ids.length > 0
                             ? e.proceso_ids.map(id => ngProcesosMap[String(id)] ?? `Proceso ${id}`)
                             : [],
      objetivos_ui:        Array.isArray(e.objetivo_ids) && e.objetivo_ids.length > 0
                             ? e.objetivo_ids.map(id => ngObjetivosMap[String(id)] ?? `Objetivo ${id}`)
                             : [],
      categoria_ui:        e.categoria_id != null ? (ngCategoriasMap[String(e.categoria_id)] ?? `CategorÃ­a ${e.categoria_id}`) : null,
      actividades_ui:      Array.isArray(e.actividad_ids) && e.actividad_ids.length > 0
                             ? e.actividad_ids.map(id => ngActividadesMap[String(id)] ?? `Actividad ${id}`)
                             : [],
      cantidad_resultados: e.resultados_count ?? null,
      // legacy compat
      sujeto_ui:           e.actor_id != null ? (ngActoresMap[String(e.actor_id)] ?? null) : null,
      predicado_ui:        e.tipo_fondo_id != null ? (ngTiposFondoMap[String(e.tipo_fondo_id)] ?? null) : null,
    }))

    // â”€â”€ Municipios activos dentro del departamento â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let municipiosActivos: { nombre: string; codigo_divipola: string | null; total_busquedas: number; usuarios_unicos: number }[] | undefined
    if (tipo === 'departamento') {
      // Agregar eventos por municipio_origen_id
      const eventsMuniCount: Record<string, number>         = {}
      const eventsMuniPerfiles: Record<string, Set<string>> = {}
      const { data: eventsMuniRaw } = await db
        .from('ng_search_events')
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

    return jsonNoStore({
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
      top_sujetos:     topTiposFondo,
      top_predicados:  topProcesos,
      top_objetivos:   topObjetivos,
      top_categorias:  topCategorias,
      top_actividades: topActividades,
      avg_resultados:  avgResultados,
      actividad_reciente: actividadReciente,
      ...(tipo === 'departamento' ? { municipios_activos: municipiosActivos } : {}),
    })
  } catch (e) {
    console.error('[/api/admin/analytics/territorio]', e)
    return jsonNoStore({ error: 'Error interno' }, { status: 500 })
  }
}

