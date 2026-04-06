'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { formatUSD } from '@/lib/utils'
import type {
  FondoAvanzado,
  CatItem,
  CatObjetivoItem,
  DeptoOption,
  MunicipioOption,
  OrdenTipo,
} from '@/types/buscador-avanzado'

// ─── Helpers ───────────────────────────────────────────────────────────────

function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[,;]/g, ' ')
    .toLowerCase()
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

function buildFundCardSummary(fondo: FondoAvanzado): string {
  const src =
    fondo.actividades_apoyadas ||
    fondo.publico_objetivo ||
    fondo.objetivos_fondo ||
    fondo.como_acceder
  return src ? truncate(src, 130) : 'Fuente de financiamiento para gestión del riesgo de desastres.'
}

function formatMonto(f: FondoAvanzado): string | null {
  if (f.monto_min_usd && f.monto_max_usd)
    return `${formatUSD(f.monto_min_usd)} – ${formatUSD(f.monto_max_usd)}`
  if (f.monto_min_usd) return `Desde ${formatUSD(f.monto_min_usd)}`
  if (f.monto_max_usd) return `Hasta ${formatUSD(f.monto_max_usd)}`
  if (f.monto_texto) return truncate(f.monto_texto, 60)
  return null
}

// ─── Monto / COP helpers ──────────────────────────────────────────────────

const COP_PER_USD = 4200

function copToUsd(cop: string): number | null {
  const n = Number(cop.replace(/[^0-9]/g, ''))
  if (!n) return null
  return Math.round(n / COP_PER_USD)
}

function formatCOP(usd: string): string {
  const n = Number(usd)
  if (!n) return ''
  return (n * COP_PER_USD).toLocaleString('es-CO')
}

function toggleItem<T>(prev: T[], item: T): T[] {
  return prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
}

// ─── Style maps ───────────────────────────────────────────────────────────

const TIPO_BADGE: Record<string, string> = {
  Nacional: 'bg-[#1B4472] text-white',
  Territorial: 'bg-[#07519D] text-white',
  Internacional: 'bg-[#213362] text-[#FFCD00]',
}

const ESTADO_BADGE: Record<string, string> = {
  Abierta: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Cerrada: 'bg-red-50 text-red-600 border border-red-100',
  'Por Abrir': 'bg-blue-50 text-blue-700 border border-blue-200',
  'N/A': 'bg-gray-100 text-gray-500 border border-gray-200',
}

const ESTADO_DOT: Record<string, string> = {
  Abierta: 'bg-emerald-500',
  Cerrada: 'bg-red-400',
  'Por Abrir': 'bg-blue-500',
}

// ─── Sub-components ────────────────────────────────────────────────────────

function FilterSection({
  title,
  children,
  defaultOpen = false,
  count = 0,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  count?: number
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[#eef2f8] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3 text-left group"
      >
        <span className="flex items-center gap-2">
          <span className="text-[12px] font-black uppercase tracking-[0.14em] text-[#4b5c7a] group-hover:text-[#213362] transition-colors">
            {title}
          </span>
          {count > 0 && (
            <span className="bg-[#07519D] text-white text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full leading-none flex items-center justify-center">
              {count}
            </span>
          )}
        </span>
        <svg
          className={`w-4 h-4 shrink-0 text-[#b0bdd4] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="pb-4 space-y-3">{children}</div>}
    </div>
  )
}

function CheckGroup({
  opciones,
  selected,
  onToggle,
}: {
  opciones: string[]
  selected: string[]
  onToggle: (val: string) => void
}) {
  if (opciones.length === 0)
    return <p className="text-[12px] text-[#b0bdd4] italic">Sin datos disponibles</p>
  return (
    <div className="space-y-2">
      {opciones.map(opt => (
        <label key={opt} className="flex items-start gap-2 text-[13px] text-[#213362] cursor-pointer group">
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => onToggle(opt)}
            className="h-4 w-4 mt-0.5 accent-[#07519D] shrink-0"
          />
          <span className={`leading-snug ${selected.includes(opt) ? 'font-semibold' : 'group-hover:text-[#07519D]'}`}>
            {opt}
          </span>
        </label>
      ))}
    </div>
  )
}

function FondoCardAvanzado({ fondo }: { fondo: FondoAvanzado }) {
  const summary = buildFundCardSummary(fondo)
  const monto = formatMonto(fondo)
  const estado = fondo.modelo?.estado_convocatoria
  const estadoStyle = estado ? (ESTADO_BADGE[estado] ?? 'bg-gray-100 text-gray-500 border border-gray-200') : null
  const dotStyle = estado ? (ESTADO_DOT[estado] ?? 'bg-gray-400') : null
  const tipoStyle = TIPO_BADGE[fondo.tipo_fondo_categoria] ?? 'bg-[#213362] text-white'
  const tieneTerritorio = fondo.coberturas.length > 0
  const procesosPreview = fondo.procesos.slice(0, 2)

  return (
    <Link href={`/fondo/${fondo.id}`} className="group block h-full">
      <article className="h-full rounded-2xl bg-white border border-[#e4e9f1] shadow-[0_8px_24px_-12px_rgba(7,29,76,0.22)] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-12px_rgba(7,29,76,0.38)]">
        {/* Color stripe */}
        <div className={`h-1 w-full ${tipoStyle.split(' ')[0]}`} />

        <div className="px-5 pt-4 pb-5 flex flex-col gap-3">
          {/* Row: tipo + estado */}
          <div className="flex items-start flex-wrap gap-2">
            <span className={`shrink-0 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] rounded-full ${tipoStyle}`}>
              {fondo.tipo_fondo_categoria}
            </span>
            {estado && estadoStyle && (
              <span className={`shrink-0 flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.10em] rounded-full ${estadoStyle}`}>
                {dotStyle && <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />}
                {estado}
              </span>
            )}
            {fondo.modelo?.periodicidad && (
              <span className="shrink-0 px-2.5 py-0.5 text-[10px] font-semibold text-[#6b82a8] bg-[#f0f4fb] border border-[#e4e9f1] rounded-full truncate max-w-[180px]">
                {fondo.modelo.periodicidad}
              </span>
            )}
          </div>

          {/* Nombre + entidad */}
          <div className="space-y-1">
            <h3
              className="text-[15px] font-black text-[#213362] leading-snug"
              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {fondo.nombre}
            </h3>
            {fondo.entidad_encargada && (
              <p className="text-[12px] text-[#7787a8] font-medium leading-snug">{fondo.entidad_encargada}</p>
            )}
          </div>

          {/* Summary */}
          <p className="text-[12px] text-[#4b5c7a] leading-relaxed">{summary}</p>

          {/* Acceso */}
          {fondo.modelo?.acceso && (
            <div className="flex items-center gap-1.5 text-[12px] text-[#4b5c7a]">
              <svg className="w-3.5 h-3.5 text-[#8ea0c0] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-semibold">{fondo.modelo.acceso}</span>
            </div>
          )}

          {/* Procesos GRD chips */}
          {procesosPreview.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {procesosPreview.map(p => (
                <span key={p} className="px-2 py-0.5 bg-[#f0f4fb] border border-[#dde5f5] text-[11px] font-semibold text-[#4b5c7a] rounded-full">
                  {p}
                </span>
              ))}
              {fondo.procesos.length > 2 && (
                <span className="text-[11px] font-semibold text-[#213362]/60 px-1">
                  +{fondo.procesos.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Footer row */}
          <div className="flex items-end justify-between pt-3 border-t border-[#eef2f8] gap-3 mt-auto">
            <div className="space-y-1.5 min-w-0">
              {monto && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9aa8c2]">Monto</p>
                  <p className="text-[13px] font-black text-[#213362] leading-none">{monto}</p>
                </div>
              )}
              {tieneTerritorio && (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#07519D]">
                  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Cobertura territorial
                </div>
              )}
            </div>
            <span className="shrink-0 text-[13px] font-black text-[#07519D] group-hover:text-[#213362] transition-colors flex items-center gap-1">
              Ver fondo <span aria-hidden>→</span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

// ─── Props ─────────────────────────────────────────────────────────────────

interface Props {
  fondos: FondoAvanzado[]
  catBenef: CatItem[]
  catObjetivos: CatObjetivoItem[]
  catProcesos: CatItem[]
  accesoOpciones: string[]
  estadoOpciones: string[]
  periodicidadOpciones: string[]
  deptoOpciones: DeptoOption[]
  municipioOpciones: MunicipioOption[]
}

// ─── Main component ────────────────────────────────────────────────────────

export default function BuscadorAvanzado({
  fondos,
  catBenef,
  catObjetivos,
  catProcesos,
  accesoOpciones,
  estadoOpciones,
  periodicidadOpciones,
  deptoOpciones,
  municipioOpciones,
}: Props) {
  // Filter state
  const [query, setQuery] = useState('')
  const [tipo, setTipo] = useState<string[]>([])
  const [beneficiarios, setBeneficiarios] = useState<string[]>([])
  const [acceso, setAcceso] = useState<string[]>([])
  const [estado, setEstado] = useState<string[]>([])
  const [periodicidad, setPeriodicidad] = useState<string[]>([])
  const [procesos, setProcesos] = useState<string[]>([])
  const [objetivos, setObjetivos] = useState<string[]>([])
  const [departamento, setDepartamento] = useState<string>('')
  const [municipio, setMunicipio] = useState<string>('')
  const [soloConTerritorio, setSoloConTerritorio] = useState(false)
  const [minMonto, setMinMonto] = useState('')
  const [maxMonto, setMaxMonto] = useState('')
  const [minCOP, setMinCOP] = useState('')
  const [maxCOP, setMaxCOP] = useState('')
  const [orden, setOrden] = useState<OrdenTipo>('az')

  function handleMinCOP(val: string) {
    const digits = val.replace(/[^0-9]/g, '')
    setMinCOP(digits)
    const usd = copToUsd(digits)
    setMinMonto(usd != null ? String(usd) : '')
  }
  function handleMaxCOP(val: string) {
    const digits = val.replace(/[^0-9]/g, '')
    setMaxCOP(digits)
    const usd = copToUsd(digits)
    setMaxMonto(usd != null ? String(usd) : '')
  }
  function handleMinUSD(val: string) {
    setMinMonto(val)
    setMinCOP('')
  }
  function handleMaxUSD(val: string) {
    setMaxMonto(val)
    setMaxCOP('')
  }
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Derived: cascaded municipios
  const municipiosFiltrados = useMemo(() =>
    departamento
      ? municipioOpciones.filter(m => m.codigo_departamento === departamento)
      : municipioOpciones,
    [departamento, municipioOpciones]
  )

  // Active filter chips
  const filtrosActivos = useMemo(() => {
    const chips: { label: string; onClear: () => void }[] = []
    if (query) chips.push({ label: `"${query}"`, onClear: () => setQuery('') })
    tipo.forEach(t => chips.push({ label: t, onClear: () => setTipo(p => p.filter(x => x !== t)) }))
    beneficiarios.forEach(b => chips.push({ label: b, onClear: () => setBeneficiarios(p => p.filter(x => x !== b)) }))
    acceso.forEach(a => chips.push({ label: a, onClear: () => setAcceso(p => p.filter(x => x !== a)) }))
    estado.forEach(e => chips.push({ label: e, onClear: () => setEstado(p => p.filter(x => x !== e)) }))
    periodicidad.forEach(pe => chips.push({ label: pe, onClear: () => setPeriodicidad(p => p.filter(x => x !== pe)) }))
    procesos.forEach(pr => chips.push({ label: pr, onClear: () => setProcesos(p => p.filter(x => x !== pr)) }))
    objetivos.forEach(o => chips.push({ label: o, onClear: () => setObjetivos(p => p.filter(x => x !== o)) }))
    if (departamento) {
      const nombre = deptoOpciones.find(d => d.codigo === departamento)?.nombre ?? departamento
      chips.push({ label: nombre, onClear: () => { setDepartamento(''); setMunicipio('') } })
    }
    if (municipio) {
      const nombre = municipioOpciones.find(m => m.id === municipio)?.nombre ?? municipio
      chips.push({ label: nombre, onClear: () => setMunicipio('') })
    }
    if (soloConTerritorio) chips.push({ label: 'Con cobertura territorial', onClear: () => setSoloConTerritorio(false) })
    if (minMonto) chips.push({ label: `Monto desde ${formatUSD(Number(minMonto))}`, onClear: () => { setMinMonto(''); setMinCOP('') } })
    if (maxMonto) chips.push({ label: `Monto hasta ${formatUSD(Number(maxMonto))}`, onClear: () => { setMaxMonto(''); setMaxCOP('') } })
    return chips
  }, [query, tipo, beneficiarios, acceso, estado, periodicidad, procesos, objetivos, departamento, municipio, soloConTerritorio, minMonto, maxMonto, deptoOpciones, municipioOpciones])

  // Filtered + sorted fondos
  const filteredFondos = useMemo(() => {
    const result = fondos.filter(f => {
      if (query) {
        const q = normalize(query)
        const haystack = normalize([
          f.nombre,
          f.entidad_encargada ?? '',
          ...(f.tags_visibles ?? []),
          f.actividades_apoyadas ?? '',
          f.publico_objetivo ?? '',
        ].join(' '))
        if (!haystack.includes(q)) return false
      }
      if (tipo.length > 0 && !tipo.includes(f.tipo_fondo_categoria)) return false
      if (beneficiarios.length > 0 && !beneficiarios.some(b => f.beneficiarios.includes(b))) return false
      if (acceso.length > 0 && (!f.modelo?.acceso || !acceso.includes(f.modelo.acceso))) return false
      if (estado.length > 0 && (!f.modelo?.estado_convocatoria || !estado.includes(f.modelo.estado_convocatoria))) return false
      if (periodicidad.length > 0 && (!f.modelo?.periodicidad || !periodicidad.includes(f.modelo.periodicidad))) return false
      if (procesos.length > 0 && !procesos.some(p => f.procesos.includes(p))) return false
      if (objetivos.length > 0 && !objetivos.some(o => f.objetivos.includes(o))) return false
      if (soloConTerritorio) {
        if (f.coberturas.length === 0) return false
        if (departamento && !f.departamentos_cobertura.includes(departamento)) return false
        if (municipio && !f.municipios_cobertura.includes(municipio)) return false
      }
      if (minMonto || maxMonto) {
        const minVal = minMonto ? Number(minMonto) : null
        const maxVal = maxMonto ? Number(maxMonto) : null
        const montoRef = f.monto_min_usd ?? f.monto_max_usd ?? null
        if (montoRef === null) return false
        if (minVal !== null && montoRef < minVal) return false
        if (maxVal !== null && (f.monto_max_usd ?? montoRef) > maxVal) return false
      }
      return true
    })

    return [...result].sort((a, b) => {
      switch (orden) {
        case 'az': return a.nombre.localeCompare(b.nombre, 'es')
        case 'za': return b.nombre.localeCompare(a.nombre, 'es')
        case 'tipo': return a.tipo_fondo_categoria.localeCompare(b.tipo_fondo_categoria, 'es') || a.nombre.localeCompare(b.nombre, 'es')
        case 'acceso': return (a.modelo?.acceso ?? 'zzz').localeCompare(b.modelo?.acceso ?? 'zzz', 'es')
        case 'estado': return (a.modelo?.estado_convocatoria ?? 'zzz').localeCompare(b.modelo?.estado_convocatoria ?? 'zzz', 'es')
        case 'abierta_primero': {
          const aO = a.modelo?.estado_convocatoria === 'Abierta' ? 0 : 1
          const bO = b.modelo?.estado_convocatoria === 'Abierta' ? 0 : 1
          return aO - bO || a.nombre.localeCompare(b.nombre, 'es')
        }
        default: return a.nombre.localeCompare(b.nombre, 'es')
      }
    })
  }, [fondos, query, tipo, beneficiarios, acceso, estado, periodicidad, procesos, objetivos, departamento, municipio, soloConTerritorio, minMonto, maxMonto, orden])

  function limpiarFiltros() {
    setQuery('')
    setTipo([])
    setBeneficiarios([])
    setAcceso([])
    setEstado([])
    setPeriodicidad([])
    setProcesos([])
    setObjetivos([])
    setDepartamento('')
    setMunicipio('')
    setSoloConTerritorio(false)
    setMinMonto('')
    setMaxMonto('')
    setMinCOP('')
    setMaxCOP('')
  }

  const hayFiltros = filtrosActivos.length > 0

  // ─── Render ─────────────────────────────────────────────────────────────

  const filterPanel = (
    <div className="bg-white border border-[#e4e9f1] rounded-2xl shadow-[0_8px_24px_-12px_rgba(7,29,76,0.22)] flex flex-col" style={{ maxHeight: 'calc(100vh - 130px)' }}>
      {/* Fixed header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#eef2f8] shrink-0">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8ea0c0]">Filtros</p>
          <p className="text-lg font-black text-[#213362] leading-tight">Criterios</p>
        </div>
        {hayFiltros && (
          <button
            onClick={limpiarFiltros}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-[#4b5c7a] hover:text-[#07519D] transition-colors px-3 py-1.5 rounded-lg border border-[#e4e9f1] hover:border-[#07519D]"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpiar
          </button>
        )}
      </div>
      {/* Scrollable accordion body */}
      <div className="overflow-y-auto flex-1 px-5">

      {/* A. Búsqueda de texto */}
      <FilterSection title="Búsqueda de texto" defaultOpen count={query ? 1 : 0}>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Nombre, palabra clave, entidad..."
          className="w-full rounded-xl border border-[#e4e9f1] bg-[#f8faff] px-3 py-2 text-sm text-[#213362] placeholder-[#b0bdd4] focus:border-[#07519D] focus:outline-none"
        />
      </FilterSection>

      {/* B. Tipo de fondo */}
      <FilterSection title="Tipo de fondo" defaultOpen count={tipo.length}>
        <div className="flex flex-wrap gap-2">
          {(['Nacional', 'Territorial', 'Internacional'] as const).map(t => {
            const active = tipo.includes(t)
            return (
              <button
                key={t}
                onClick={() => setTipo(p => toggleItem(p, t))}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-[0.12em] border transition ${
                  active
                    ? `${TIPO_BADGE[t]} border-transparent`
                    : 'bg-white border-[#e4e9f1] text-[#4b5c7a] hover:border-[#c8d3e6]'
                }`}
              >
                {t}
              </button>
            )
          })}
        </div>
      </FilterSection>

      {/* C. Beneficiarios */}
      <FilterSection title="Beneficiario elegible" count={beneficiarios.length}>
        <CheckGroup
          opciones={catBenef.map(b => b.nombre)}
          selected={beneficiarios}
          onToggle={v => setBeneficiarios(p => toggleItem(p, v))}
        />
      </FilterSection>

      {/* D. Modalidad de acceso */}
      <FilterSection title="Modalidad de acceso" count={acceso.length}>
        <CheckGroup
          opciones={accesoOpciones}
          selected={acceso}
          onToggle={v => setAcceso(p => toggleItem(p, v))}
        />
      </FilterSection>

      {/* E. Estado de convocatoria */}
      <FilterSection title="Estado de convocatoria" defaultOpen count={estado.length}>
        <CheckGroup
          opciones={estadoOpciones}
          selected={estado}
          onToggle={v => setEstado(p => toggleItem(p, v))}
        />
      </FilterSection>

      {/* F. Periodicidad */}
      <FilterSection title="Periodicidad" count={periodicidad.length}>
        <CheckGroup
          opciones={periodicidadOpciones}
          selected={periodicidad}
          onToggle={v => setPeriodicidad(p => toggleItem(p, v))}
        />
      </FilterSection>

      {/* G. Proceso GRD */}
      <FilterSection title="Proceso GRD" count={procesos.length}>
        <CheckGroup
          opciones={catProcesos.map(c => c.nombre)}
          selected={procesos}
          onToggle={v => setProcesos(p => toggleItem(p, v))}
        />
      </FilterSection>

      {/* H. Objetivos PNGRD */}
      <FilterSection title="Objetivo PNGRD" count={objetivos.length}>
        <div className="space-y-2">
          {catObjetivos.map(obj => {
            const active = objetivos.includes(obj.nombre_corto)
            return (
              <button
                key={obj.id}
                onClick={() => setObjetivos(p => toggleItem(p, obj.nombre_corto))}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  active
                    ? 'bg-[#ebf2ff] border-[#07519D] ring-1 ring-[#07519D]/20'
                    : 'bg-white border-[#e4e9f1] hover:border-[#c8d3e6]'
                }`}
              >
                <p className={`text-[12px] leading-snug font-semibold ${active ? 'text-[#07519D]' : 'text-[#213362]'}`}>
                  {obj.nombre_corto}
                </p>
                {obj.descripcion && (
                  <p className="text-[11px] text-[#7787a8] leading-snug mt-0.5 line-clamp-2">
                    {obj.descripcion}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      </FilterSection>

      {/* I. Territorio */}
      <FilterSection title="Territorio" count={(soloConTerritorio || departamento || municipio) ? 1 : 0}>
        <label className="flex items-center gap-2 text-[13px] text-[#213362] cursor-pointer">
          <input
            type="checkbox"
            checked={soloConTerritorio}
            onChange={e => {
              setSoloConTerritorio(e.target.checked)
              if (!e.target.checked) { setDepartamento(''); setMunicipio('') }
            }}
            className="h-4 w-4 accent-[#07519D]"
          />
          <span className="font-semibold">Solo con cobertura territorial explícita</span>
        </label>

        {soloConTerritorio && deptoOpciones.length > 0 && (
          <div className="mt-3 space-y-2">
            <select
              value={departamento}
              onChange={e => { setDepartamento(e.target.value); setMunicipio('') }}
              className="w-full rounded-xl border border-[#e4e9f1] bg-[#f8faff] px-3 py-2 text-sm text-[#213362] focus:border-[#07519D] focus:outline-none"
            >
              <option value="">Todos los departamentos</option>
              {deptoOpciones.map(d => (
                <option key={d.codigo} value={d.codigo}>{d.nombre}</option>
              ))}
            </select>

            {municipiosFiltrados.length > 0 && (
              <select
                value={municipio}
                onChange={e => setMunicipio(e.target.value)}
                className="w-full rounded-xl border border-[#e4e9f1] bg-[#f8faff] px-3 py-2 text-sm text-[#213362] focus:border-[#07519D] focus:outline-none"
              >
                <option value="">Todos los municipios</option>
                {municipiosFiltrados.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {soloConTerritorio && deptoOpciones.length === 0 && (
          <p className="text-[12px] text-[#b0bdd4] mt-2 italic">
            Sin datos de cobertura disponibles para filtrar.
          </p>
        )}
      </FilterSection>

      {/* J. Presupuesto */}
      <FilterSection title="Presupuesto" count={(minMonto ? 1 : 0) + (maxMonto ? 1 : 0)}>
        {/* COP inputs */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold text-[#9aa8c2] uppercase tracking-wide">En pesos colombianos (COP)</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={minCOP ? Number(minCOP).toLocaleString('es-CO') : ''}
              onChange={e => handleMinCOP(e.target.value)}
              placeholder="Desde $"
              className="w-full rounded-xl border border-[#e4e9f1] bg-[#f8faff] px-3 py-2 text-sm text-[#213362] focus:border-[#07519D] focus:outline-none"
            />
            <span className="text-[#9aa8c2] text-sm font-semibold shrink-0">—</span>
            <input
              type="text"
              inputMode="numeric"
              value={maxCOP ? Number(maxCOP).toLocaleString('es-CO') : ''}
              onChange={e => handleMaxCOP(e.target.value)}
              placeholder="Hasta $"
              className="w-full rounded-xl border border-[#e4e9f1] bg-[#f8faff] px-3 py-2 text-sm text-[#213362] focus:border-[#07519D] focus:outline-none"
            />
          </div>
          {(minCOP || maxCOP) && (() => {
            const minU = minCOP ? copToUsd(minCOP) : null
            const maxU = maxCOP ? copToUsd(maxCOP) : null
            const fmt = (n: number) => n.toLocaleString('en-US')
            const parts = [minU != null ? `USD ${fmt(minU)}` : '', maxU != null ? `USD ${fmt(maxU)}` : ''].filter(Boolean)
            return (
              <p className="text-[11px] text-[#07519D] font-semibold">
                ≈ {parts.join(' — ')}
              </p>
            )
          })()}
        </div>

        {/* USD inputs */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-[#9aa8c2] uppercase tracking-wide">O directamente en dólares (USD)</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={minMonto}
              onChange={e => handleMinUSD(e.target.value)}
              placeholder="Mín"
              className="w-full rounded-xl border border-[#e4e9f1] bg-white px-3 py-2 text-sm text-[#213362] focus:border-[#07519D] focus:outline-none"
            />
            <span className="text-[#9aa8c2] text-sm font-semibold shrink-0">—</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={maxMonto}
              onChange={e => handleMaxUSD(e.target.value)}
              placeholder="Máx"
              className="w-full rounded-xl border border-[#e4e9f1] bg-white px-3 py-2 text-sm text-[#213362] focus:border-[#07519D] focus:outline-none"
            />
          </div>
          {(minMonto || maxMonto) && !minCOP && !maxCOP && (
            <p className="text-[11px] text-[#9aa8c2] font-medium">
              ≈ COP{minMonto ? ` $${formatCOP(minMonto)}` : ''}{minMonto && maxMonto ? ' — ' : ''}{maxMonto ? `$${formatCOP(maxMonto)}` : ''}
            </p>
          )}
        </div>

        <p className="text-[11px] text-[#b0bdd4]">Tasa de referencia: $4.200 COP/USD · Solo orientativa.</p>
      </FilterSection>
      </div>
    </div>
  )

  return (
    <div className="grid lg:grid-cols-12 gap-8 pb-10">
      {/* ──────────────────── Mobile: toggle filters ──────────────────── */}
      <div className="lg:hidden flex items-center justify-between">
        <p className="text-sm font-semibold text-[#4b5c7a]">
          <span className="font-black text-[#213362]">{filteredFondos.length}</span> de {fondos.length} fondos
        </p>
        <button
          onClick={() => setShowMobileFilters(p => !p)}
          className="flex items-center gap-2 text-[13px] font-black text-[#213362] bg-white border border-[#e4e9f1] px-4 py-2 rounded-xl shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1zM6 10h12M9 16h6" />
          </svg>
          {showMobileFilters ? 'Ocultar filtros' : 'Filtros'}
          {hayFiltros && (
            <span className="ml-1 bg-[#07519D] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {filtrosActivos.length}
            </span>
          )}
        </button>
      </div>

      {/* ──────────────────── Mobile filter panel ──────────────────── */}
      {showMobileFilters && (
        <div className="lg:hidden col-span-full">{filterPanel}</div>
      )}

      {/* ──────────────────── Desktop sidebar ──────────────────── */}
      <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
        <div className="sticky top-24">{filterPanel}</div>
      </aside>

      {/* ──────────────────── Results area ──────────────────── */}
      <div className="lg:col-span-8 xl:col-span-9 space-y-5">
        {/* Counter + Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#4b5c7a] font-semibold">
            <span className="font-black text-[#213362]">{filteredFondos.length}</span>{' '}
            {filteredFondos.length === 1 ? 'fondo' : 'fondos'}
            {filteredFondos.length < fondos.length && (
              <span className="text-[#9aa8c2]"> de {fondos.length}</span>
            )}
          </p>

          <select
            value={orden}
            onChange={e => setOrden(e.target.value as OrdenTipo)}
            className="text-[13px] font-semibold text-[#213362] bg-white border border-[#e4e9f1] rounded-xl px-3 py-2 focus:border-[#07519D] focus:outline-none"
          >
            <option value="az">A – Z</option>
            <option value="za">Z – A</option>
            <option value="tipo">Por tipo de fondo</option>
            <option value="acceso">Por modalidad de acceso</option>
            <option value="estado">Por estado</option>
            <option value="abierta_primero">Convocatoria abierta primero</option>
          </select>
        </div>

        {/* Active filter chips */}
        {filtrosActivos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filtrosActivos.map((chip, i) => (
              <button
                key={i}
                onClick={chip.onClear}
                className="flex items-center gap-1 bg-[#ebf2ff] border border-[#c8d8f5] text-[12px] font-semibold text-[#213362] px-3 py-1 rounded-full hover:bg-[#dce8ff] transition-colors"
              >
                {chip.label}
                <svg className="w-3 h-3 ml-0.5 text-[#7b9bc8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ))}
            <button
              onClick={limpiarFiltros}
              className="text-[12px] font-semibold text-[#9aa8c2] hover:text-[#4b5c7a] px-2 py-1 transition-colors"
            >
              Limpiar todo
            </button>
          </div>
        )}

        {/* Cards grid */}
        {filteredFondos.length > 0 ? (
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
          >
            {filteredFondos.map(fondo => (
              <FondoCardAvanzado key={fondo.id} fondo={fondo} />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-[#f0f4fb] border border-[#e4e9f1] flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-[#b0bdd4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 105.65 16.65 7.5 7.5 0 0016.65 16.65z" />
              </svg>
            </div>
            <p className="text-lg font-black text-[#213362]">Sin resultados</p>
            <p className="text-sm text-[#7787a8] mt-2 max-w-xs leading-relaxed">
              No encontramos fondos con esos filtros. Prueba quitando uno o más criterios.
            </p>
            {hayFiltros && (
              <button
                onClick={limpiarFiltros}
                className="mt-5 px-5 py-2.5 bg-[#213362] text-white text-[13px] font-black rounded-xl hover:bg-[#07519D] transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
