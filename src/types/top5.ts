export type AfinidadTier = 'alta' | 'media' | 'baja'

export interface Top5Request {
  p_actor_ui: string
  p_paso2_ui: string
  p_paso4_ui: string
  p_territorio_codigo?: string | null
  p_chips?: string[] | null
  p_texto_libre?: string | null
}

export interface Top5Result {
  fondo_id: string
  nombre_fondo: string
  entidad_encargada: string | null
  pagina_web: string | null
  vigencia: string | null
  tier_afinidad: AfinidadTier
  mostrar_badge: boolean
  // Enriched fields (from fondos table)
  tipo_fondo_categoria: string | null
  como_acceder: string | null
  monto_texto: string | null
  monto_min_usd: number | null
  monto_max_usd: number | null
  actividades_apoyadas: string | null
  objetivos_fondo: string | null
  publico_objetivo: string | null
  // Enriched fields (from fondos_modelos_aplicacion table)
  acceso_modelo: string | null
  estado_modelo: string | null
  periodicidad_modelo: string | null
}

export interface Top5Response {
  resultados: Top5Result[]
}
