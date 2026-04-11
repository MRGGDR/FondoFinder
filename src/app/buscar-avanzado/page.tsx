import { getDb } from '@/lib/db'
import BuscadorAvanzado from '@/components/busqueda-avanzada/BuscadorAvanzado'
import type {
  FondoAvanzado,
  CatItem,
  CatObjetivoItem,
  DeptoOption,
  MunicipioOption,
} from '@/types/buscador-avanzado'

export const metadata = { title: 'Fondos | Financiamiento PNGRD' }
export const dynamic = 'force-dynamic'

export default async function BuscarAvanzadoPage() {
  const db = getDb()

  const [
    { data: fondosRaw },
    { data: modelosRaw },
    { data: procesosJoinRaw },
    { data: benefJoinRaw },
    { data: objetivosJoinRaw },
    { data: coberturaRaw },
    { data: catBenefRaw },
    { data: catObjetivosRaw },
    { data: catProcesosRaw },
  ] = await Promise.all([
    db.from('fondos')
      .select('id, nombre, tipo_fondo_categoria, entidad_encargada, monto_min_usd, monto_max_usd, monto_texto, actividades_apoyadas, publico_objetivo, objetivos_fondo, como_acceder, tags_visibles, tiene_instructivo, tiene_modelo_aplicacion')
      .order('nombre'),
    db.from('fondos_modelos_aplicacion')
      .select('fondo_id, modelo_aplicacion, acceso, estado_convocatoria, periodicidad'),
    db.from('fondos_procesos')
      .select('fondo_id, proceso_id, aplica')
      .eq('aplica', true),
    db.from('fondos_beneficiarios')
      .select('fondo_id, categoria_id, aplica')
      .eq('aplica', true),
    db.from('fondos_objetivos')
      .select('fondo_id, objetivo_id, aplica')
      .eq('aplica', true),
    db.from('fondos_cobertura_territorial')
      .select('fondo_id, tipo_cobertura, es_restriccion_fuerte, nivel_geografico, codigo_departamento, municipio_id'),
    db.from('cat_beneficiarios').select('id, nombre').order('nombre'),
    db.from('cat_objetivos_pngrd').select('id, nombre_corto, descripcion').order('id'),
    db.from('cat_procesos').select('id, nombre').order('nombre'),
  ])

  // --- Build catalog maps ---
  const catProcMap: Record<number, string> = {}
  for (const c of catProcesosRaw ?? []) {
    const r = c as Record<string, unknown>
    catProcMap[Number(r.id)] = String(r.nombre)
  }
  const catBenefMap: Record<number, string> = {}
  for (const c of catBenefRaw ?? []) {
    const r = c as Record<string, unknown>
    catBenefMap[Number(r.id)] = String(r.nombre)
  }
  const catObjetMap: Record<number, string> = {}
  for (const c of catObjetivosRaw ?? []) {
    const r = c as Record<string, unknown>
    catObjetMap[Number(r.id)] = String(r.nombre_corto)
  }

  // --- Build relationship maps ---
  const modelosMap: Record<string, FondoAvanzado['modelo']> = {}
  for (const m of modelosRaw ?? []) {
    const r = m as Record<string, unknown>
    const fid = String(r.fondo_id)
    if (!modelosMap[fid]) {
      modelosMap[fid] = {
        modelo_aplicacion: r.modelo_aplicacion != null ? String(r.modelo_aplicacion) : null,
        acceso: r.acceso != null ? String(r.acceso) : null,
        estado_convocatoria: r.estado_convocatoria != null ? String(r.estado_convocatoria) : null,
        periodicidad: r.periodicidad != null ? String(r.periodicidad) : null,
      }
    }
  }

  const procesosMap: Record<string, string[]> = {}
  for (const p of procesosJoinRaw ?? []) {
    const r = p as Record<string, unknown>
    const fid = String(r.fondo_id)
    const nombre = catProcMap[Number(r.proceso_id)]
    if (nombre) {
      if (!procesosMap[fid]) procesosMap[fid] = []
      procesosMap[fid].push(nombre)
    }
  }

  const benefMap: Record<string, string[]> = {}
  for (const b of benefJoinRaw ?? []) {
    const r = b as Record<string, unknown>
    const fid = String(r.fondo_id)
    const nombre = catBenefMap[Number(r.categoria_id)]
    if (nombre) {
      if (!benefMap[fid]) benefMap[fid] = []
      benefMap[fid].push(nombre)
    }
  }

  const objetivosMap: Record<string, string[]> = {}
  for (const o of objetivosJoinRaw ?? []) {
    const r = o as Record<string, unknown>
    const fid = String(r.fondo_id)
    const nombre = catObjetMap[Number(r.objetivo_id)]
    if (nombre) {
      if (!objetivosMap[fid]) objetivosMap[fid] = []
      objetivosMap[fid].push(nombre)
    }
  }

  const coberturaMap: Record<string, FondoAvanzado['coberturas']> = {}
  for (const c of coberturaRaw ?? []) {
    const r = c as Record<string, unknown>
    const fid = String(r.fondo_id)
    if (!coberturaMap[fid]) coberturaMap[fid] = []
    coberturaMap[fid].push({
      tipo_cobertura: r.tipo_cobertura != null ? String(r.tipo_cobertura) : null,
      es_restriccion_fuerte: typeof r.es_restriccion_fuerte === 'boolean' ? r.es_restriccion_fuerte : null,
      nivel_geografico: r.nivel_geografico != null ? String(r.nivel_geografico) : null,
      codigo_departamento: r.codigo_departamento != null ? String(r.codigo_departamento) : null,
      municipio_id: r.municipio_id != null ? String(r.municipio_id) : null,
    })
  }

  // --- Enrich fondos ---
  const fondos: FondoAvanzado[] = (fondosRaw ?? []).map(f => {
    const r = f as Record<string, unknown>
    const fid = String(r.id)
    const coberturas = coberturaMap[fid] ?? []
    return {
      id: String(r.id),
      nombre: String(r.nombre),
      tipo_fondo_categoria: String(r.tipo_fondo_categoria),
      entidad_encargada: r.entidad_encargada != null ? String(r.entidad_encargada) : null,
      monto_min_usd: r.monto_min_usd != null ? Number(r.monto_min_usd) : null,
      monto_max_usd: r.monto_max_usd != null ? Number(r.monto_max_usd) : null,
      monto_texto: r.monto_texto != null ? String(r.monto_texto) : null,
      actividades_apoyadas: r.actividades_apoyadas != null ? String(r.actividades_apoyadas) : null,
      publico_objetivo: r.publico_objetivo != null ? String(r.publico_objetivo) : null,
      objetivos_fondo: r.objetivos_fondo != null ? String(r.objetivos_fondo) : null,
      como_acceder: r.como_acceder != null ? String(r.como_acceder) : null,
      tags_visibles: Array.isArray(r.tags_visibles) ? (r.tags_visibles as string[]) : null,
      tiene_instructivo: Boolean(r.tiene_instructivo),
      tiene_modelo_aplicacion: Boolean(r.tiene_modelo_aplicacion),
      modelo: modelosMap[fid] ?? null,
      procesos: procesosMap[fid] ?? [],
      beneficiarios: benefMap[fid] ?? [],
      objetivos: objetivosMap[fid] ?? [],
      coberturas,
      departamentos_cobertura: Array.from(new Set(coberturas.map(c => c.codigo_departamento).filter(Boolean) as string[])),
      municipios_cobertura: Array.from(new Set(coberturas.map(c => c.municipio_id).filter(Boolean) as string[])),
    }
  })

  // --- Derive filter options from real data ---
  const accesoOpciones = Array.from(new Set(
    (modelosRaw ?? []).map(m => (m as Record<string, unknown>).acceso).filter(Boolean) as string[]
  )).sort((a, b) => a.localeCompare(b, 'es'))

  const estadoOpciones = Array.from(new Set(
    (modelosRaw ?? []).map(m => (m as Record<string, unknown>).estado_convocatoria).filter(Boolean) as string[]
  )).sort((a, b) => a.localeCompare(b, 'es'))

  const periodicidadOpciones = Array.from(new Set(
    (modelosRaw ?? []).map(m => (m as Record<string, unknown>).periodicidad).filter(Boolean) as string[]
  )).sort((a, b) => a.localeCompare(b, 'es'))

  const catBenef: CatItem[] = (catBenefRaw ?? []).map(c => {
    const r = c as Record<string, unknown>
    return { id: Number(r.id), nombre: String(r.nombre) }
  })

  const catObjetivos: CatObjetivoItem[] = (catObjetivosRaw ?? []).map(c => {
    const r = c as Record<string, unknown>
    return {
      id: Number(r.id),
      nombre_corto: String(r.nombre_corto),
      descripcion: r.descripcion != null ? String(r.descripcion) : null,
    }
  })

  const catProcesos: CatItem[] = (catProcesosRaw ?? []).map(c => {
    const r = c as Record<string, unknown>
    return { id: Number(r.id), nombre: String(r.nombre) }
  })

  // --- Territory options ---
  const depCodes = Array.from(new Set(
    (coberturaRaw ?? []).map(c => (c as Record<string, unknown>).codigo_departamento).filter(Boolean) as string[]
  ))
  const municipioIds = Array.from(new Set(
    (coberturaRaw ?? []).map(c => (c as Record<string, unknown>).municipio_id).filter(Boolean) as string[]
  ))

  const [{ data: deptoNamesRaw }, { data: municipiosRaw }] = await Promise.all([
    depCodes.length > 0
      ? db.from('municipios').select('codigo_departamento, departamento').in('codigo_departamento', depCodes).limit(200)
      : Promise.resolve({ data: [] as { codigo_departamento: string; departamento: string }[] }),
    municipioIds.length > 0
      ? db.from('municipios').select('id, nombre, codigo_departamento').in('id', municipioIds)
      : Promise.resolve({ data: [] as { id: string; nombre: string; codigo_departamento: string }[] }),
  ])

  const deptoMap: Record<string, string> = {}
  for (const d of deptoNamesRaw ?? []) {
    const r = d as Record<string, unknown>
    const code = String(r.codigo_departamento)
    if (!deptoMap[code]) deptoMap[code] = String(r.departamento)
  }
  const deptoOpciones: DeptoOption[] = Object.entries(deptoMap)
    .map(([codigo, nombre]) => ({ codigo, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  const municipioOpciones: MunicipioOption[] = (municipiosRaw ?? []).map(m => {
    const r = m as Record<string, unknown>
    return {
      id: String(r.id),
      nombre: String(r.nombre),
      codigo_departamento: String(r.codigo_departamento),
    }
  }).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  return (
    <div className="min-h-screen bg-[#f6fafe] pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#213362]">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,#4f8ecf,transparent_35%),radial-gradient(circle_at_80%_10%,#ffcd00,transparent_28%)]" />
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-14 relative">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60 mb-3">
            Catálogo completo
          </p>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
            {fondos.length} Fuentes de Financiamiento
          </h1>
          <p className="text-white/60 text-sm md:text-base mt-3 max-w-3xl leading-relaxed">
            Nacionales, territoriales e internacionales para la gestión del riesgo de desastres. Filtra por criterios técnicos o busca por palabra clave.
          </p>
        </div>
        <div className="h-1.5 flex">
          <div className="w-1/2 bg-[#FFCD00]" />
          <div className="w-1/4 bg-[#223a7a]" />
          <div className="w-1/4 bg-[#d80e25]" />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 md:px-10 mt-10">
        <BuscadorAvanzado
          fondos={fondos}
          catBenef={catBenef}
          catObjetivos={catObjetivos}
          catProcesos={catProcesos}
          accesoOpciones={accesoOpciones}
          estadoOpciones={estadoOpciones}
          periodicidadOpciones={periodicidadOpciones}
          deptoOpciones={deptoOpciones}
          municipioOpciones={municipioOpciones}
        />
      </section>
    </div>
  )
}
