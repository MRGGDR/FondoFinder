export interface NgActor {
  actor_id: number
  actor_nombre: string
  actor_orden: number | null
  activo: boolean | null
}

export interface NgTipoFondo {
  tipo_fondo_id: number
  tipo_fondo_nombre: string
  fondos_disponibles: number
}

export interface NgProcesoGrd {
  id: number
  nombre: string
}

export interface NgObjetivoPngrd {
  id: number
  nombre: string
  nombre_corto: string | null
  descripcion: string | null
}

export interface NgCategoria {
  categoria_id: number
  categoria_codigo: string | null
  categoria_nombre: string
  fondos_disponibles: number
}

export interface NgActividad {
  actividad_id: number
  actividad_nombre: string
  fondos_disponibles: number
}

export interface NgResultadoBusqueda {
  fondo_id: string
  fondo_nombre: string
  tipo_fondo_nombre: string | null
  entidad_encargada: string | null
  vigencia: string | null
  pagina_web: string | null
  como_acceder: string | null
  monto_texto: string | null
  tiene_instructivo: boolean
  tiene_modelo_aplicacion: boolean
  categorias_match: string[]
  procesos_match: string[]
  objetivos_match: string[]
  actividades_match: string[]
  total_filas_match: number
  // Campos enriquecidos desde fondos_modelos_aplicacion (opcionales: se inyectan post-búsqueda)
  acceso_modalidad?: string | null
  estado_convocatoria?: string | null
  periodicidad?: string | null
  // Campos numéricos de presupuesto (opcionales: se inyectan post-búsqueda desde fondos)
  monto_min_usd?: number | null
  monto_max_usd?: number | null
}

export interface NgEntidadResumen {
  entidad_encargada: string
  fondos_disponibles: number
}

export interface NgVigenciaResumen {
  vigencia: string
  fondos_disponibles: number
}

export interface NgResumenFlags {
  fondos_total: number
  fondos_con_instructivo: number
  fondos_sin_instructivo: number
  fondos_con_modelo_aplicacion: number
  fondos_sin_modelo_aplicacion: number
  fondos_con_monto_numerico: number
  fondos_sin_monto_numerico: number
}

export interface NgBusquedaFilters {
  actorId: number | null
  tipoFondoId: number | null
  procesoIds: number[]
  objetivoIds: number[]
  categoriaId: number | null
  actividadIds: number[]
  limite?: number
}

export interface NgWizardState {
  actorId: number | null
  tipoFondoId: number | null
  procesoIds: number[]
  objetivoIds: number[]
  categoriaId: number | null
  actividadIds: number[]
  entidadesSeleccionadas: string[]
  vigenciasSeleccionadas: string[]
}

export interface NgRpcArgsBase {
  p_actor_id: number | null
  p_tipo_fondo_id: number | null
  p_proceso_ids: number[] | null
  p_objetivo_ids: number[] | null
  p_categoria_id: number | null
  p_actividad_ids: number[] | null
}

export interface NgDatabase {
  public: {
    Tables: {
      ng_actores: {
        Row: {
          actor_id: number
          actor_nombre: string
          actor_orden: number | null
          activo: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: never
        Update: never
      }
      cat_procesos: {
        Row: { id: number; nombre: string }
        Insert: never
        Update: never
      }
      cat_objetivos_pngrd: {
        Row: {
          id: number
          nombre: string | null
          nombre_corto: string | null
          descripcion: string | null
        }
        Insert: never
        Update: never
      }
    }
    Views: {
      ng_vw_busqueda_base: {
        Row: Record<string, unknown>
      }
    }
    Functions: {
      ng_buscar_fondos_v1: {
        Args: {
          p_actor_id?: number | null
          p_tipo_fondo_id?: number | null
          p_proceso_ids?: number[] | null
          p_objetivo_ids?: number[] | null
          p_categoria_id?: number | null
          p_actividad_ids?: number[] | null
          p_limite?: number
        }
        Returns: Array<{
          fondo_id: string
          fondo_nombre: string
          tipo_fondo_nombre: string | null
          entidad_encargada: string | null
          vigencia: string | null
          pagina_web: string | null
          como_acceder: string | null
          monto_texto: string | null
          tiene_instructivo: boolean | null
          tiene_modelo_aplicacion: boolean | null
          categorias_match: string[] | null
          procesos_match: string[] | null
          objetivos_match: string[] | null
          actividades_match: string[] | null
          total_filas_match: number | string | null
        }>
      }
      ng_listar_tipos_fondo_v1: {
        Args: { p_actor_id?: number | null }
        Returns: Array<{
          tipo_fondo_id: number | string | null
          tipo_fondo_nombre: string | null
          fondos_disponibles: number | string | null
        }>
      }
      ng_listar_categorias_v1: {
        Args: {
          p_actor_id?: number | null
          p_tipo_fondo_id?: number | null
          p_proceso_ids?: number[] | null
          p_objetivo_ids?: number[] | null
        }
        Returns: Array<{
          categoria_id: number | string | null
          categoria_codigo: string | null
          categoria_nombre: string | null
          fondos_disponibles: number | string | null
        }>
      }
      ng_listar_actividades_v1: {
        Args: {
          p_actor_id?: number | null
          p_tipo_fondo_id?: number | null
          p_proceso_ids?: number[] | null
          p_objetivo_ids?: number[] | null
          p_categoria_id?: number | null
        }
        Returns: Array<{
          actividad_id: number | string | null
          actividad_nombre: string | null
          fondos_disponibles: number | string | null
        }>
      }
      ng_listar_entidades_v1: {
        Args: {
          p_actor_id?: number | null
          p_tipo_fondo_id?: number | null
          p_proceso_ids?: number[] | null
          p_objetivo_ids?: number[] | null
          p_categoria_id?: number | null
          p_actividad_ids?: number[] | null
        }
        Returns: Array<{
          entidad_encargada: string | null
          fondos_disponibles: number | string | null
        }>
      }
      ng_listar_vigencias_v1: {
        Args: {
          p_actor_id?: number | null
          p_tipo_fondo_id?: number | null
          p_proceso_ids?: number[] | null
          p_objetivo_ids?: number[] | null
          p_categoria_id?: number | null
          p_actividad_ids?: number[] | null
        }
        Returns: Array<{
          vigencia: string | null
          fondos_disponibles: number | string | null
        }>
      }
      ng_resumen_flags_v1: {
        Args: {
          p_actor_id?: number | null
          p_tipo_fondo_id?: number | null
          p_proceso_ids?: number[] | null
          p_objetivo_ids?: number[] | null
          p_categoria_id?: number | null
          p_actividad_ids?: number[] | null
        }
        Returns: Array<{
          fondos_total: number | string | null
          fondos_con_instructivo: number | string | null
          fondos_sin_instructivo: number | string | null
          fondos_con_modelo_aplicacion: number | string | null
          fondos_sin_modelo_aplicacion: number | string | null
          fondos_con_monto_numerico: number | string | null
          fondos_sin_monto_numerico: number | string | null
        }>
      }
    }
  }
}
