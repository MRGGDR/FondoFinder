'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { formatUSD } from '@/lib/utils'

type Proceso = { id?: number; nombre: string }

type Fondo = {
  id: number
  nombre: string
  tipo_fondo_categoria: string
  entidad_encargada: string | null
  monto_min_usd: number | null
  monto_max_usd: number | null
  procesos: Proceso[] | null
}

const categoryStyles: Record<string, string> = {
  Nacional: 'bg-[#1B4472] text-white',
  Territorial: 'bg-[#07519D] text-white',
  Internacional: 'bg-[#213362] text-[#FFCD00]',
}

function clampLines(className = '') {
  return {
    className,
    style: {
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical' as const,
      overflow: 'hidden',
    },
  }
}

export default function FondosGrid({ fondos }: { fondos: Fondo[] }) {
  const [query, setQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [selectedProcesos, setSelectedProcesos] = useState<Set<string>>(new Set())
  const [minMonto, setMinMonto] = useState('')
  const [maxMonto, setMaxMonto] = useState('')

  const procesosDisponibles = useMemo(() => {
    const nombres = new Set<string>()
    fondos.forEach(f => f.procesos?.forEach(p => p?.nombre && nombres.add(p.nombre)))
    return Array.from(nombres).sort((a, b) => a.localeCompare(b, 'es'))
  }, [fondos])

  const categorias = ['Nacional', 'Territorial', 'Internacional']

  const filteredFondos = useMemo(() => {
    const minVal = minMonto ? Number(minMonto) : null
    const maxVal = maxMonto ? Number(maxMonto) : null

    return fondos.filter(f => {
      const texto = `${f.nombre} ${f.entidad_encargada ?? ''}`.toLowerCase()
      const matchesQuery = query.length === 0 || texto.includes(query.toLowerCase())

      const matchesCategoria =
        selectedCategories.size === 0 || selectedCategories.has(f.tipo_fondo_categoria)

      const montoMin = f.monto_min_usd ?? null
      const montoMax = f.monto_max_usd ?? null
      const montoReference = montoMin ?? montoMax

      const matchesMonto =
        (minVal === null && maxVal === null) ||
        (montoReference !== null &&
          (minVal === null || montoReference >= minVal) &&
          (maxVal === null || (montoMax ?? montoReference) <= maxVal))

      const procesosNames = (f.procesos ?? []).map(p => p?.nombre).filter(Boolean) as string[]
      const matchesProcesos =
        selectedProcesos.size === 0 ||
        Array.from(selectedProcesos).every(sel => procesosNames.includes(sel))

      return matchesQuery && matchesCategoria && matchesMonto && matchesProcesos
    })
  }, [fondos, query, selectedCategories, selectedProcesos, minMonto, maxMonto])

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  const toggleProceso = (nombre: string) => {
    setSelectedProcesos(prev => {
      const next = new Set(prev)
      next.has(nombre) ? next.delete(nombre) : next.add(nombre)
      return next
    })
  }

  const limpiarFiltros = () => {
    setQuery('')
    setSelectedCategories(new Set())
    setSelectedProcesos(new Set())
    setMinMonto('')
    setMaxMonto('')
  }

  return (
    <div className="grid lg:grid-cols-12 gap-8 mt-10">
      {/* Sidebar de filtros */}
      <aside className="lg:col-span-4 xl:col-span-3">
        <div className="sticky top-24">
          <div className="bg-white border border-[#e4e9f1] rounded-2xl shadow-[0_10px_30px_-18px_rgba(7,29,76,0.25)] p-5 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8ea0c0]">
                  Filtros
                </p>
                <p className="text-lg font-black text-[#213362] leading-tight">
                  Refinar resultados
                </p>
              </div>
              <button
                onClick={limpiarFiltros}
                className="flex items-center justify-center h-11 w-11 rounded-xl border border-[#dbe3f3] bg-white text-[#213362] hover:text-[#07519D] hover:border-[#07519D] shadow-[0_10px_30px_-18px_rgba(7,29,76,0.35)] transition"
                title="Recargar filtros"
                aria-label="Recargar filtros"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4v4h4" />
                  <path d="M20 20v-4h-4" />
                  <path d="M20 8a8 8 0 0 0-15.5-2" />
                  <path d="M4 16a8 8 0 0 0 15.5 2" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-[13px] font-semibold text-[#4b5c7a]">
                Búsqueda rápida
              </label>
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Nombre o entidad"
                className="w-full rounded-xl border border-[#e4e9f1] bg-[#f8faff] px-3 py-2 text-sm text-[#213362] focus:border-[#07519D] focus:outline-none"
              />
            </div>

            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-[#4b5c7a]">Categoría</p>
              <div className="flex flex-wrap gap-2">
                {categorias.map(cat => {
                  const active = selectedCategories.has(cat)
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.12em] border transition ${
                        active
                          ? `${categoryStyles[cat] ?? 'bg-[#213362] text-white'} border-transparent`
                          : 'bg-white border-[#e4e9f1] text-[#4b5c7a] hover:border-[#c8d3e6]'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-[#4b5c7a]">Monto (USD)</p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={minMonto}
                  onChange={e => setMinMonto(e.target.value)}
                  placeholder="Mín"
                  className="w-full rounded-xl border border-[#e4e9f1] bg-white px-3 py-2 text-sm text-[#213362] focus:border-[#07519D] focus:outline-none"
                />
                <span className="text-[#9aa8c2] text-sm font-semibold">—</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={maxMonto}
                  onChange={e => setMaxMonto(e.target.value)}
                  placeholder="Máx"
                  className="w-full rounded-xl border border-[#e4e9f1] bg-white px-3 py-2 text-sm text-[#213362] focus:border-[#07519D] focus:outline-none"
                />
              </div>
              <p className="text-[12px] text-[#9aa8c2]">
                Usa valores aproximados (ej. 50000 para 50K).
              </p>
            </div>

            {procesosDisponibles.length > 0 && (
              <div className="space-y-3">
                <p className="text-[13px] font-semibold text-[#4b5c7a]">Procesos</p>
                <div className="max-h-48 overflow-y-auto pr-1 space-y-2">
                  {procesosDisponibles.map(nombre => {
                    const active = selectedProcesos.has(nombre)
                    return (
                      <label
                        key={nombre}
                        className="flex items-center gap-2 text-[13px] text-[#213362]"
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleProceso(nombre)}
                          className="h-4 w-4 accent-[#07519D]"
                        />
                        <span className={active ? 'font-semibold' : ''}>{nombre}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Lista de tarjetas */}
      <div className="lg:col-span-8 xl:col-span-9 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#4b5c7a] font-semibold">
            Mostrando <span className="font-black text-[#213362]">{filteredFondos.length}</span> de{' '}
            {fondos.length}
          </p>
          <span className="hidden md:inline text-xs font-semibold text-[#9aa8c2]">
            Scroll para ver más resultados
          </span>
        </div>

        <div
          className="grid gap-6 auto-rows-fr"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}
        >
          {filteredFondos.map(fondo => {
            const rango =
              fondo.monto_min_usd && fondo.monto_max_usd
                ? `USD ${formatUSD(fondo.monto_min_usd)} - ${formatUSD(fondo.monto_max_usd)}`
                : 'Variable'

            const procesos = Array.isArray(fondo.procesos) ? fondo.procesos : []

            return (
              <Link
                key={fondo.id}
                href={`/fondo/${fondo.id}`}
                className="group h-full"
              >
                <article className="h-full rounded-2xl bg-white border border-[#e4e9f1] shadow-[0_10px_30px_-18px_rgba(7,29,76,0.35)] overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_-16px_rgba(7,29,76,0.45)]">
                  <div className={`h-1 w-full ${categoryStyles[fondo.tipo_fondo_categoria] ?? 'bg-[#213362]'}`} />

                  <div className="px-5 pt-4 pb-5 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] rounded-full ${categoryStyles[fondo.tipo_fondo_categoria] ?? 'bg-[#213362] text-white'}`}>
                        {fondo.tipo_fondo_categoria}
                      </span>
                      <span className="text-[11px] font-semibold text-[#8ea0c0]">F{fondo.id}</span>
                    </div>

                    <div className="space-y-2">
                      <h3 {...clampLines('text-base font-black text-[#213362] leading-tight')}>
                        {fondo.nombre}
                      </h3>
                      <p {...clampLines('text-[13px] text-[#7787a8] font-medium')}>
                        {fondo.entidad_encargada}
                      </p>
                    </div>

                    {procesos.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {procesos.slice(0, 3).map(p => (
                          <span
                            key={p.id ?? p.nombre}
                            className="bg-[#f6fafe] border border-[#e4e9f1] text-[11px] font-semibold text-[#4b5c7a] px-3 py-1 rounded-full"
                          >
                            {p.nombre}
                          </span>
                        ))}
                        {procesos.length > 3 && (
                          <span className="text-[11px] font-semibold text-[#213362]/70 px-2 py-1">
                            +{procesos.length - 3} más
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-[#eef2f8]">
                      <div>
                        <div className="text-[11px] text-[#9aa8c2] font-semibold uppercase tracking-[0.12em]">
                          Monto
                        </div>
                        <div className="text-sm font-black text-[#213362] leading-tight">
                          {rango}
                        </div>
                      </div>
                      <span className="text-sm font-black text-[#07519D] group-hover:text-[#213362] transition-colors flex items-center gap-1">
                        Ver más <span aria-hidden>→</span>
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
