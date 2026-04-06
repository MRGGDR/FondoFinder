export type ModeloInfo = {
  modelo_aplicacion: string | null
  acceso: string | null
  estado_convocatoria: string | null
  periodicidad: string | null
}

export type CoberturaInfo = {
  tipo_cobertura: string | null
  es_restriccion_fuerte: boolean | null
  nivel_geografico: string | null
  codigo_departamento: string | null
  municipio_id: string | null
}

export type FondoAvanzado = {
  id: string
  nombre: string
  tipo_fondo_categoria: string
  entidad_encargada: string | null
  monto_min_usd: number | null
  monto_max_usd: number | null
  monto_texto: string | null
  actividades_apoyadas: string | null
  publico_objetivo: string | null
  objetivos_fondo: string | null
  como_acceder: string | null
  tags_visibles: string[] | null
  tiene_instructivo: boolean
  tiene_modelo_aplicacion: boolean
  modelo: ModeloInfo | null
  procesos: string[]
  beneficiarios: string[]
  objetivos: string[]
  coberturas: CoberturaInfo[]
  departamentos_cobertura: string[]
  municipios_cobertura: string[]
}

export type CatItem = { id: number; nombre: string }

export type CatObjetivoItem = {
  id: number
  nombre_corto: string
  descripcion: string | null
}

export type DeptoOption = { codigo: string; nombre: string }

export type MunicipioOption = {
  id: string
  nombre: string
  codigo_departamento: string
}

export type OrdenTipo =
  | 'az'
  | 'za'
  | 'tipo'
  | 'acceso'
  | 'estado'
  | 'abierta_primero'
