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
