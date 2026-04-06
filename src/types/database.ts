export type TipoFondo = 'Nacional' | 'Territorial' | 'Internacional'

export interface Fondo {
  id: string                     // 'F01'..'F32'
  nombre: string
  tipo_fondo_categoria: TipoFondo
  tipo_fondo_detalle: string | null
  ciclo_desastre: string | null
  publico_objetivo: string | null
  actividades_apoyadas: string | null
  instrumentos: string | null
  condiciones_elegibilidad: string | null
  requisitos: string | null
  criterios_asignacion: string | null
  como_acceder: string | null
  tiempo_aplicacion: string | null
  monto_texto: string | null
  monto_min_usd: number | null
  monto_max_usd: number | null
  capitalizacion: string | null
  subcuentas: string | null
  entidad_encargada: string | null
  objetivos_fondo: string | null
  vigencia: string | null
  creacion: string | null
  normatividad: string | null
  pagina_web: string | null
  created_at: string
  updated_at: string
}

export interface FondoConRelaciones extends Fondo {
  procesos: { id: number; nombre: string }[]
  beneficiarios: { id: number; nombre: string }[]
  objetivos: { id: number; nombre: string }[]
}

export interface CatProceso {
  id: number
  nombre: string
}

export interface CatBeneficiario {
  id: number
  nombre: string
}

export interface CatObjetivo {
  id: number
  nombre_corto: string
  descripcion: string
}

export interface Municipio {
  id: string
  codigo_divipola: string
  nombre: string
  departamento: string
}

export interface Usuario {
  id: string
  municipio_id: string
  nombre_contacto: string | null
  created_at: string
}

// Parámetros para la función buscar_fondos de Supabase
export interface BusquedaParams {
  p_query?: string
  p_tipo_fondo?: TipoFondo | null
  p_proceso_ids?: number[] | null
  p_beneficiario_ids?: number[] | null
  p_objetivo_ids?: number[] | null
  p_presupuesto_usd?: number | null
  p_limit?: number
  p_offset?: number
}

export interface ResultadoBusqueda extends FondoConRelaciones {
  relevancia: number
  total_count: number
}

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS v2 — estructuras nuevas, portables a PostgreSQL puro
// ─────────────────────────────────────────────────────────────────────────────

/** Grupos de términos del catálogo narrativo */
export type GrupoTermino =
  | 'sujeto'
  | 'verbo'
  | 'predicado'
  | 'complemento'
  | 'desastre'
  | 'afectacion'
  | 'alcance'

/** Un término dentro de cat_narrativa_terminos */
export interface TerminoNarrativo {
  id: string
  grupo: GrupoTermino
  termino_canonico: string
  termino_normalizado: string
  descripcion: string | null
  orden_visual: number
  activo: boolean
}

/** Catálogo narrativo completo, agrupado por grupo */
export type CatalogoNarrativa = Record<GrupoTermino, TerminoNarrativo[]>

/** Perfil de consulta público sin password (perfiles_consulta) */
export interface PerfilConsulta {
  id: string
  codigo_acceso: string
  nombre_contacto: string | null
  nombre_normalizado: string | null
  municipio_id: string | null
  tipo_actor: string | null
  entidad: string | null
  canal_registro: string | null
  metadata_json: Record<string, unknown> | null
  created_at: string
  last_seen_at: string | null
  activo: boolean
}

/** Payload para crear o recuperar un perfil de consulta */
export interface CrearPerfilPayload {
  nombre_contacto: string
  municipio_id?: string | null
  tipo_actor?: string | null
  entidad?: string | null
  canal_registro?: string
  metadata_json?: Record<string, unknown>
}

/** Payload para actualizar campos de un perfil existente */
export interface ActualizarPerfilPayload {
  perfil_id: string
  municipio_id?: string | null
  tipo_actor?: string | null
  entidad?: string | null
}

/** Fila de municipio para los selectores de perfil y territorio */
export interface MunicipioRow {
  id: string
  nombre: string
  departamento: string
}

/** Respuesta al crear/recuperar un perfil */
export interface PerfilConsultaRespuesta {
  perfil_id: string
  codigo_acceso: string
  nombre_contacto: string | null
  municipio_id: string | null
  tipo_actor: string | null
  es_nuevo: boolean
}

/** Parámetros para la búsqueda narrativa v2 */
export interface BusquedaNarrativaParams {
  texto_narrativo?: string | null
  sujeto_termino_id?: string | null
  predicado_termino_id?: string | null
  verbo_ids?: string[] | null
  complemento_ids?: string[] | null
  tipo_desastre?: string | null
  afectacion?: string | null
  tipo_fondo?: TipoFondo | null
  presupuesto_usd?: number | null
  limit?: number
  offset?: number
  /** UUID del perfil que realiza la búsqueda (del localStorage del cliente) */
  perfil_id?: string | null
  /** UUID del municipio de origen del perfil */
  municipio_origen_id?: string | null
  /** UUID del municipio consultado en el formulario */
  municipio_consulta_id?: string | null
}

/** Un resultado de buscar_fondos_narrativo_v2
 *
 * Firma confirmada post-migración 001 (2026-04-03) — 25 columnas:
 *   id, nombre, tipo_fondo_categoria, publico_objetivo, actividades_apoyadas,
 *   como_acceder, monto_texto, monto_min_usd, monto_max_usd, entidad_encargada,
 *   pagina_web, vigencia, procesos (jsonb), beneficiarios (jsonb), objetivos (jsonb),
 *   tags_visibles (text[]), tiene_instructivo (boolean), tiene_modelo_aplicacion (boolean),
 *   score_total, score_texto, score_terminos, score_instructivo, score_sujeto,
 *   score_predicado (numeric), total_count (bigint)
 */
export interface ResultadoBusquedaNarrativa {
  id: string
  nombre: string
  tipo_fondo_categoria: TipoFondo
  publico_objetivo: string | null
  actividades_apoyadas: string | null
  como_acceder: string | null
  monto_texto: string | null
  monto_min_usd: number | null
  monto_max_usd: number | null
  entidad_encargada: string | null
  pagina_web: string | null
  vigencia: string | null
  tags_visibles: string[]
  tiene_instructivo: boolean
  tiene_modelo_aplicacion: boolean
  procesos: { id: number; nombre: string }[]
  beneficiarios: { id: number; nombre: string }[]
  objetivos: { id: number; nombre: string }[]
  score_total: number
  score_texto: number
  score_terminos: number
  score_instructivo: number
  score_sujeto: number
  score_predicado: number
  /** bigint en PG, number en TS (seguro hasta 2^53) */
  total_count: number
  /**
   * Bonus territorial calculado en backend post-SQL (fondos_cobertura_territorial).
   * 0 si no hay territorio activo o sin cobertura registrada.
   * Positivo si el fondo cubre el territorio consultado; negativo si lo excluye.
   * No modifica score_total del RPC — campo adicional exclusivo del backend TS.
   */
  score_territorial_bonus?: number
}

/** Respuesta completa de la API /api/busqueda/narrativa */
export interface RespuestaBusquedaNarrativa {
  resultados: ResultadoBusquedaNarrativa[]
  total_count: number
  search_event_id: string | null
}

/** Instructivo paso a paso de un fondo (fondos_instructivos) */
export interface FondoInstructivo {
  fondo_id: string
  tipo_fuente: string | null
  descripcion: string | null
  estado_convocatoria: string | null
  ciclo_convocatoria: string | null
  elegibilidad_organizacion: string | null
  elegibilidad_proyecto: string | null
  financiamiento: string | null
  duracion_proyecto: string | null
  proceso_formulacion: string | null
  otros_requerimientos: string | null
  fechas_clave: string | null
  checklist_documentos: string | null
  contactos_clave: string | null
  marco_normativo: string | null
  pasos_json: unknown | null
  requisitos_json: unknown | null
  payload_json: unknown | null
  fuente_hoja: string | null
  updated_at: string
}

/** Modelo de aplicación de un fondo (fondos_modelos_aplicacion) */
export interface FondoModeloAplicacion {
  id: string
  fondo_id: string
  modelo_aplicacion: string | null
  descripcion: string | null
  acceso: string | null
  estado_convocatoria: string | null
  periodicidad: string | null
  fechas_convocatoria: string | null
  payload_json: unknown | null
  fuente_hoja: string | null
  updated_at: string
}

/** Fila de vw_busquedas_por_municipio_origen_v2 o consulta_v2 (admin/mapa) */
export interface FilaMapaBusquedas {
  municipio: string
  codigo_divipola: string
  codigo_departamento: string
  total_busquedas: number
  perfiles_unicos?: number
  ultima_busqueda: string
}

/** Fila de vw_top_fondos_consultados_v2 (admin) */
export interface FilaTopFondos {
  fondo_id: string
  nombre: string
  total_apariciones: number
  score_promedio: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipo para la base de datos completa (necesario para el cliente tipado de Supabase)
export interface Database {
  public: {
    Tables: {
      fondos: { Row: Fondo; Insert: Partial<Fondo>; Update: Partial<Fondo> }
      municipios: { Row: Municipio; Insert: Partial<Municipio>; Update: Partial<Municipio> }
      usuarios: { Row: Usuario; Insert: Partial<Usuario>; Update: Partial<Usuario> }
      cat_procesos: { Row: CatProceso; Insert: never; Update: never }
      cat_beneficiarios: { Row: CatBeneficiario; Insert: never; Update: never }
      cat_objetivos_pngrd: { Row: CatObjetivo; Insert: never; Update: never }
    }
    Functions: {
      buscar_fondos: {
        Args: BusquedaParams
        Returns: ResultadoBusqueda[]
      }
    }
    Views: {
      vista_fondo_detalle: { Row: FondoConRelaciones }
      vista_usuario_municipio: {
        Row: {
          id: string
          nombre_contacto: string | null
          created_at: string
          codigo_divipola: string
          municipio_nombre: string
          municipio_departamento: string
        }
      }
    }
  }
}
