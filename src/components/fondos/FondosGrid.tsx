'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { formatUSD } from '@/lib/utils'

type Proceso = { id?: number; nombre: string }

type Fondo = {
  id: string
  nombre: string
  tipo_fondo_categoria: string
  entidad_encargada: string | null
  monto_min_usd: number | null
  monto_max_usd: number | null
  procesos: Proceso[] | null
  tags_visibles: string[] | null
}

function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[,;]/g, ' ')
    .toLowerCase()
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

const COP_PER_USD = 4200 // tasa aproximada de referencia

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

export default function FondosGrid({ fondos }: { fondos: Fondo[] }) {
  const [query, setQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [selectedProcesos, setSelectedProcesos] = useState<Set<string>>(new Set())
  const [minMonto, setMinMonto] = useState('')
  const [maxMonto, setMaxMonto] = useState('')
  const [minCOP, setMinCOP] = useState('')
  const [maxCOP, setMaxCOP] = useState('')

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
    setMinCOP('') // clear COP when user edits USD directly
  }
  function handleMaxUSD(val: string) {
    setMaxMonto(val)
    setMaxCOP('')
  }

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
      const texto = normalize(`${f.nombre} ${f.entidad_encargada ?? ''} ${(f.tags_visibles ?? []).join(' ')}`)
      const matchesQuery = query.length === 0 || texto.includes(normalize(query))

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
    setMinCOP('')
    setMaxCOP('')
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
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-[#4b5c7a]">Monto</p>
              </div>

              {/* COP inputs */}
              <div>
                <p className="text-[11px] font-semibold text-[#9aa8c2] uppercase tracking-wide mb-1.5">Buscar en pesos (COP)</p>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={minCOP ? Number(minCOP).toLocaleString('es-CO') : ''}
                    onChange={e => handleMinCOP(e.target.value)}
                    placeholder="Desde $"
                    className="w-full rounded-xl border border-[#e4e9f1] bg-[#f8faff] px-3 py-2 text-sm text-[#213362] focus:border-[#07519D] focus:outline-none"
                  />
                  <span className="text-[#9aa8c2] text-sm font-semibold">—</span>
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
                    <p className="text-[11px] text-[#07519D] font-semibold mt-1.5">
                      ≈ {parts.join(' — ')}
                    </p>
                  )
                })()}
              </div>

              {/* USD inputs */}
              <div>
                <p className="text-[11px] font-semibold text-[#9aa8c2] uppercase tracking-wide mb-1.5">O directamente en dólares (USD)</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={minMonto}
                    onChange={e => handleMinUSD(e.target.value)}
                    placeholder="Mín"
                    className="w-full rounded-xl border border-[#e4e9f1] bg-white px-3 py-2 text-sm text-[#213362] focus:border-[#07519D] focus:outline-none"
                  />
                  <span className="text-[#9aa8c2] text-sm font-semibold">—</span>
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
                  <p className="text-[11px] text-[#9aa8c2] font-medium mt-1.5">
                    ≈ COP{minMonto ? ` $${formatCOP(minMonto)}` : ''}{minMonto && maxMonto ? ' — ' : ''}{maxMonto ? `$${formatCOP(maxMonto)}` : ''}
                  </p>
                )}
              </div>

              <p className="text-[11px] text-[#b0bdd4]">
                Tasa de referencia: $4.200 COP/USD · Solo orientativa.
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
                ? `${formatUSD(fondo.monto_min_usd)} – ${formatUSD(fondo.monto_max_usd)}`
                : fondo.monto_min_usd
                  ? `Desde ${formatUSD(fondo.monto_min_usd)}`
                  : 'Variable'

            const tags = Array.isArray(fondo.tags_visibles) ? fondo.tags_visibles.filter(Boolean) : []

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
                      <span className="text-[11px] font-semibold text-[#8ea0c0]">{fondo.id}</span>
                    </div>

                    <div className="space-y-2">
                      <h3 {...clampLines('text-base font-black text-[#213362] leading-tight')}>
                        {fondo.nombre}
                      </h3>
                      <p {...clampLines('text-[13px] text-[#7787a8] font-medium')}>
                        {fondo.entidad_encargada}
                      </p>
                    </div>

                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.slice(0, 4).map(tag => (
                          <span
                            key={tag}
                            className="bg-[#f6fafe] border border-[#e4e9f1] text-[11px] font-semibold text-[#4b5c7a] px-3 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {tags.length > 4 && (
                          <span className="text-[11px] font-semibold text-[#213362]/70 px-2 py-1">
                            +{tags.length - 4} más
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
