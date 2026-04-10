import { createNgClient } from '@/lib/supabase/ngClient'
import type {
  NgActor,
  NgActividad,
  NgBusquedaFilters,
  NgCategoria,
  NgEntidadResumen,
  NgObjetivoPngrd,
  NgProcesoGrd,
  NgResultadoBusqueda,
  NgResumenFlags,
  NgRpcArgsBase,
  NgTipoFondo,
  NgVigenciaResumen,
} from '@/types/ng-buscador'

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function toNullableNumber(value: unknown): number | null {
  const num = toNumber(value, Number.NaN)
  return Number.isFinite(num) ? num : null
}

function sanitizeIds(values: number[] | undefined): number[] {
  return Array.from(
    new Set(
      (values ?? [])
        .map(v => Number(v))
        .filter(v => Number.isFinite(v))
    )
  )
}

function buildRpcArgs(filters: NgBusquedaFilters): NgRpcArgsBase {
  const procesoIds = sanitizeIds(filters.procesoIds)
  const objetivoIds = sanitizeIds(filters.objetivoIds)
  const actividadIds = sanitizeIds(filters.actividadIds)

  return {
    p_actor_id: filters.actorId ?? null,
    p_tipo_fondo_id: filters.tipoFondoId ?? null,
    p_proceso_ids: procesoIds.length ? procesoIds : null,
    p_objetivo_ids: objetivoIds.length ? objetivoIds : null,
    p_categoria_id: filters.categoriaId ?? null,
    p_actividad_ids: actividadIds.length ? actividadIds : null,
  }
}

export async function getNgActores(): Promise<NgActor[]> {
  const supabase = createNgClient() as any
  const { data, error } = await supabase
    .from('ng_actores')
    .select('actor_id, actor_nombre, actor_orden, activo')
    .eq('activo', true)
    .order('actor_orden', { ascending: true })

  if (error) throw new Error(`[ng_actores] ${error.message}`)

  return (data ?? []).map((row: any) => ({
    actor_id: toNumber(row.actor_id),
    actor_nombre: row.actor_nombre,
    actor_orden: toNullableNumber(row.actor_orden),
    activo: row.activo,
  }))
}

export async function getNgTiposFondo(actorId: number | null): Promise<NgTipoFondo[]> {
  const supabase = createNgClient() as any
  const { data, error } = await supabase.rpc('ng_listar_tipos_fondo_v1', {
    p_actor_id: actorId ?? null,
  })

  if (error) throw new Error(`[ng_listar_tipos_fondo_v1] ${error.message}`)

  return (data ?? [])
    .map((row: any) => ({
      tipo_fondo_id: toNumber(row.tipo_fondo_id),
      tipo_fondo_nombre: row.tipo_fondo_nombre ?? 'Sin nombre',
      fondos_disponibles: toNumber(row.fondos_disponibles),
    }))
    .filter((row: any) => Number.isFinite(row.tipo_fondo_id))
}

export async function getProcesosGrd(): Promise<NgProcesoGrd[]> {
  const supabase = createNgClient() as any
  const { data, error } = await supabase
    .from('cat_procesos')
    .select('id, nombre')
    .order('id', { ascending: true })

  if (error) throw new Error(`[cat_procesos] ${error.message}`)

  return (data ?? []).map((row: any) => ({
    id: toNumber(row.id),
    nombre: row.nombre,
  }))
}

export async function getObjetivosPngrd(): Promise<NgObjetivoPngrd[]> {
  const supabase = createNgClient() as any
  const { data, error } = await supabase
    .from('cat_objetivos_pngrd')
    .select('id, nombre_corto, descripcion')
    .order('id', { ascending: true })

  if (error) throw new Error(`[cat_objetivos_pngrd] ${error.message}`)

  return (data ?? []).map((row: any) => ({
    id: toNumber(row.id),
    nombre: row.nombre_corto ?? `Objetivo ${row.id}`,
    nombre_corto: row.nombre_corto,
    descripcion: row.descripcion,
  }))
}

export async function getNgCategorias(filters: NgBusquedaFilters): Promise<NgCategoria[]> {
  const supabase = createNgClient() as any
  const args = buildRpcArgs(filters)

  const { data, error } = await supabase.rpc('ng_listar_categorias_v1', {
    p_actor_id: args.p_actor_id,
    p_tipo_fondo_id: args.p_tipo_fondo_id,
    p_proceso_ids: args.p_proceso_ids,
    p_objetivo_ids: args.p_objetivo_ids,
  })

  if (error) throw new Error(`[ng_listar_categorias_v1] ${error.message}`)

  return (data ?? [])
    .map((row: any) => ({
      categoria_id: toNumber(row.categoria_id),
      categoria_codigo: row.categoria_codigo,
      categoria_nombre: row.categoria_nombre ?? 'Sin nombre',
      fondos_disponibles: toNumber(row.fondos_disponibles),
    }))
    .filter((row: any) => Number.isFinite(row.categoria_id))
}

export async function getNgActividades(filters: NgBusquedaFilters): Promise<NgActividad[]> {
  const supabase = createNgClient() as any
  const args = buildRpcArgs(filters)

  const { data, error } = await supabase.rpc('ng_listar_actividades_v1', {
    p_actor_id: args.p_actor_id,
    p_tipo_fondo_id: args.p_tipo_fondo_id,
    p_proceso_ids: args.p_proceso_ids,
    p_objetivo_ids: args.p_objetivo_ids,
    p_categoria_id: args.p_categoria_id,
  })

  if (error) throw new Error(`[ng_listar_actividades_v1] ${error.message}`)

  return (data ?? [])
    .map((row: any) => ({
      actividad_id: toNumber(row.actividad_id),
      actividad_nombre: row.actividad_nombre ?? 'Sin nombre',
      fondos_disponibles: toNumber(row.fondos_disponibles),
    }))
    .filter((row: any) => Number.isFinite(row.actividad_id))
}

export async function buscarFondosNg(filters: NgBusquedaFilters): Promise<NgResultadoBusqueda[]> {
  const supabase = createNgClient() as any
  const args = buildRpcArgs(filters)

  const { data, error } = await supabase.rpc('ng_buscar_fondos_v1', {
    ...args,
    p_limite: filters.limite ?? 200,
  })

  if (error) throw new Error(`[ng_buscar_fondos_v1] ${error.message}`)

  const normalized = (data ?? []).map((row: any) => ({
    fondo_id: String(row.fondo_id),
    fondo_nombre: row.fondo_nombre ?? String(row.fondo_id),
    tipo_fondo_nombre: row.tipo_fondo_nombre,
    entidad_encargada: row.entidad_encargada,
    vigencia: row.vigencia,
    pagina_web: row.pagina_web,
    como_acceder: row.como_acceder,
    monto_texto: row.monto_texto,
    tiene_instructivo: Boolean(row.tiene_instructivo),
    tiene_modelo_aplicacion: Boolean(row.tiene_modelo_aplicacion),
    categorias_match: row.categorias_match ?? [],
    procesos_match: row.procesos_match ?? [],
    objetivos_match: row.objetivos_match ?? [],
    actividades_match: row.actividades_match ?? [],
    total_filas_match: toNumber(row.total_filas_match),
  }))

  const uniqueByFondo = new Map<string, NgResultadoBusqueda>()
  for (const row of normalized) {
    const previous = uniqueByFondo.get(row.fondo_id)
    if (!previous || row.total_filas_match > previous.total_filas_match) {
      uniqueByFondo.set(row.fondo_id, row)
    }
  }

  return Array.from(uniqueByFondo.values()).sort(
    (a, b) => b.total_filas_match - a.total_filas_match
  )
}

export async function getNgEntidades(filters: NgBusquedaFilters): Promise<NgEntidadResumen[]> {
  const supabase = createNgClient() as any
  const args = buildRpcArgs(filters)

  const { data, error } = await supabase.rpc('ng_listar_entidades_v1', args)

  if (error) throw new Error(`[ng_listar_entidades_v1] ${error.message}`)

  return (data ?? [])
    .filter((row: any) => Boolean(row.entidad_encargada))
    .map((row: any) => ({
      entidad_encargada: row.entidad_encargada ?? 'Sin entidad',
      fondos_disponibles: toNumber(row.fondos_disponibles),
    }))
}

export async function getNgVigencias(filters: NgBusquedaFilters): Promise<NgVigenciaResumen[]> {
  const supabase = createNgClient() as any
  const args = buildRpcArgs(filters)

  const { data, error } = await supabase.rpc('ng_listar_vigencias_v1', args)

  if (error) throw new Error(`[ng_listar_vigencias_v1] ${error.message}`)

  return (data ?? [])
    .filter((row: any) => Boolean(row.vigencia))
    .map((row: any) => ({
      vigencia: row.vigencia ?? 'Sin vigencia',
      fondos_disponibles: toNumber(row.fondos_disponibles),
    }))
}

export async function getNgResumenFlags(filters: NgBusquedaFilters): Promise<NgResumenFlags> {
  const supabase = createNgClient() as any
  const args = buildRpcArgs(filters)

  const { data, error } = await supabase.rpc('ng_resumen_flags_v1', args)

  if (error) throw new Error(`[ng_resumen_flags_v1] ${error.message}`)

  const row = data?.[0]
  return {
    fondos_total: toNumber(row?.fondos_total),
    fondos_con_instructivo: toNumber(row?.fondos_con_instructivo),
    fondos_sin_instructivo: toNumber(row?.fondos_sin_instructivo),
    fondos_con_modelo_aplicacion: toNumber(row?.fondos_con_modelo_aplicacion),
    fondos_sin_modelo_aplicacion: toNumber(row?.fondos_sin_modelo_aplicacion),
    fondos_con_monto_numerico: toNumber(row?.fondos_con_monto_numerico),
    fondos_sin_monto_numerico: toNumber(row?.fondos_sin_monto_numerico),
  }
}

/** Fetches acceso, estado_convocatoria, periodicidad for a given set of fondo IDs.
 *  Queries fondos_modelos_aplicacion directly — no RPC needed. */
export async function getNgModeloInfoBatch(
  fondoIds: string[]
): Promise<Record<string, { acceso_modalidad: string | null; estado_convocatoria: string | null; periodicidad: string | null }>> {
  if (!fondoIds.length) return {}

  const supabase = createNgClient() as any
  const { data, error } = await supabase
    .from('fondos_modelos_aplicacion')
    .select('fondo_id, acceso, estado_convocatoria, periodicidad')
    .in('fondo_id', fondoIds)

  if (error) throw new Error(`[fondos_modelos_aplicacion] ${error.message}`)

  const map: Record<string, { acceso_modalidad: string | null; estado_convocatoria: string | null; periodicidad: string | null }> = {}
  for (const row of data ?? []) {
    if (row.fondo_id) {
      map[String(row.fondo_id)] = {
        acceso_modalidad: row.acceso ?? null,
        estado_convocatoria: row.estado_convocatoria ?? null,
        periodicidad: row.periodicidad ?? null,
      }
    }
  }
  return map
}

/** Fetches monto_min_usd and monto_max_usd via the server-side API route (bypasses RLS). */
export async function getNgMontosBatch(
  _fondoIds: string[]
): Promise<Record<string, { monto_min_usd: number | null; monto_max_usd: number | null }>> {
  const res = await fetch('/api/ng/montos', { cache: 'no-store' })
  if (!res.ok) return {}

  const data: { id: string; monto_min_usd: number | null; monto_max_usd: number | null }[] =
    await res.json()

  const map: Record<string, { monto_min_usd: number | null; monto_max_usd: number | null }> = {}
  for (const row of data ?? []) {
    if (row.id) {
      map[String(row.id)] = {
        monto_min_usd: row.monto_min_usd != null ? Number(row.monto_min_usd) : null,
        monto_max_usd: row.monto_max_usd != null ? Number(row.monto_max_usd) : null,
      }
    }
  }
  return map
}
