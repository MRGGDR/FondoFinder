'use client'
import { useState } from 'react'
import type { FiltrosBusqueda } from '@/hooks/useBusqueda'

const TIPOS = ['Nacional', 'Territorial', 'Internacional'] as const

const PROCESOS = [
  { id: 1, nombre: 'Conocimiento del riesgo' },
  { id: 2, nombre: 'Reducción del riesgo' },
  { id: 3, nombre: 'Manejo de desastres – Respuesta' },
  { id: 4, nombre: 'Manejo de desastres – Recuperación' },
]

const BENEFICIARIOS = [
  { id: 1, nombre: 'Entidades nacionales (Ministerios, Agencias)' },
  { id: 2, nombre: 'Entidades territoriales (Departamentos y municipios)' },
  { id: 3, nombre: 'Autoridades ambientales / CARs' },
  { id: 4, nombre: 'Universidades / Centros de Investigación' },
  { id: 5, nombre: 'Sector privado' },
  { id: 6, nombre: 'Organizaciones comunitarias / sociedad civil' },
  { id: 7, nombre: 'Entidades financieras' },
  { id: 8, nombre: 'Agencias de cooperación internacional' },
]

const OBJETIVOS = [
  { id: 1, nombre: 'Conocimiento y análisis del riesgo' },
  { id: 2, nombre: 'Intervención y reducción del riesgo' },
  { id: 3, nombre: 'Participación y acción comunitaria' },
  { id: 4, nombre: 'Gobernanza y gestión institucional' },
  { id: 5, nombre: 'Preparación y respuesta ante emergencias' },
]

interface FiltroPanelProps {
  filtros: FiltrosBusqueda
  setFiltro: <K extends keyof FiltrosBusqueda>(key: K, value: FiltrosBusqueda[K]) => void
  resetFiltros: () => void
  /** Cuando es true se muestra como drawer/modal (móvil) */
  asDrawer?: boolean
  onClose?: () => void
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold text-ungrd-navy uppercase tracking-wider mb-2 mt-4 first:mt-0">
      {children}
    </h3>
  )
}

function toggleInArray(arr: number[], id: number): number[] {
  return arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]
}

export default function FiltroPanel({
  filtros,
  setFiltro,
  resetFiltros,
  asDrawer = false,
  onClose,
}: FiltroPanelProps) {
  const [presupuestoCOP, setPresupuestoCOP] = useState(
    filtros.presupuestoUSD ? String(Math.round(filtros.presupuestoUSD * 4200)) : ''
  )

  const hayFiltrosActivos =
    filtros.tipoFondo !== null ||
    filtros.procesoIds.length > 0 ||
    filtros.beneficiarioIds.length > 0 ||
    filtros.objetivoIds.length > 0 ||
    filtros.presupuestoUSD !== null

  function handleReset() {
    resetFiltros()
    setPresupuestoCOP('')
    onClose?.()
  }

  function handlePresupuestoCOP(raw: string) {
    const digits = raw.replace(/\D/g, '')
    setPresupuestoCOP(digits)
    const cop = parseInt(digits, 10)
    setFiltro('presupuestoUSD', digits === '' || isNaN(cop) ? null : Math.round(cop / 4200))
  }

  const usdEquiv = filtros.presupuestoUSD
    ? new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(filtros.presupuestoUSD)
    : null

  const inner = (
    <div className="space-y-1">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-ungrd-navy flex items-center gap-1.5">
          <span>🔍</span> Filtros
        </span>
        {hayFiltrosActivos && (
          <button
            onClick={handleReset}
            className="text-xs text-ungrd-blue-mid hover:underline"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {/* Tipo de fondo */}
      <SectionTitle>Tipo de fondo</SectionTitle>
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="tipo_fondo"
            checked={filtros.tipoFondo === null}
            onChange={() => setFiltro('tipoFondo', null)}
            className="accent-ungrd-blue-mid"
          />
          <span className="text-sm text-gray-700">Todos</span>
        </label>
        {TIPOS.map(tipo => (
          <label key={tipo} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="tipo_fondo"
              value={tipo}
              checked={filtros.tipoFondo === tipo}
              onChange={() => setFiltro('tipoFondo', tipo)}
              className="accent-ungrd-blue-mid"
            />
            <span className="text-sm text-gray-700">{tipo}</span>
          </label>
        ))}
      </div>

      {/* Proceso GRD */}
      <SectionTitle>Proceso GRD</SectionTitle>
      <div className="flex flex-col gap-1.5">
        {PROCESOS.map(p => (
          <label key={p.id} className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filtros.procesoIds.includes(p.id)}
              onChange={() =>
                setFiltro('procesoIds', toggleInArray(filtros.procesoIds, p.id))
              }
              className="mt-0.5 accent-ungrd-blue-mid"
            />
            <span className="text-sm text-gray-700 leading-snug">{p.nombre}</span>
          </label>
        ))}
      </div>

      {/* Mi organización es... */}
      <SectionTitle>Mi organización es…</SectionTitle>
      <div className="flex flex-col gap-1.5">
        {BENEFICIARIOS.map(b => (
          <label key={b.id} className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filtros.beneficiarioIds.includes(b.id)}
              onChange={() =>
                setFiltro('beneficiarioIds', toggleInArray(filtros.beneficiarioIds, b.id))
              }
              className="mt-0.5 accent-ungrd-blue-mid"
            />
            <span className="text-sm text-gray-700 leading-snug">{b.nombre}</span>
          </label>
        ))}
      </div>

      {/* Objetivo PNGRD */}
      <SectionTitle>Objetivo PNGRD</SectionTitle>
      <div className="flex flex-col gap-1.5">
        {OBJETIVOS.map(o => (
          <label key={o.id} className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filtros.objetivoIds.includes(o.id)}
              onChange={() =>
                setFiltro('objetivoIds', toggleInArray(filtros.objetivoIds, o.id))
              }
              className="mt-0.5 accent-ungrd-blue-mid"
            />
            <span className="text-sm text-gray-700 leading-snug">{o.nombre}</span>
          </label>
        ))}
      </div>

      {/* Presupuesto */}
      <SectionTitle>Mi presupuesto (COP)</SectionTitle>
      <div className="space-y-1">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Ej: 500000000"
          value={presupuestoCOP}
          onChange={e => handlePresupuestoCOP(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ungrd-blue-light"
        />
        {usdEquiv ? (
          <p className="text-xs text-ungrd-gray">≈ {usdEquiv}</p>
        ) : (
          <p className="text-xs text-gray-400">Fondos sin monto definido siempre aparecen</p>
        )}
      </div>
    </div>
  )

  if (asDrawer) {
    return (
      <>
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
        {/* Drawer */}
        <aside className="fixed left-0 top-0 h-full w-80 max-w-[90vw] bg-white z-50 overflow-y-auto p-5 shadow-xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-ungrd-gray hover:text-ungrd-navy text-xl leading-none"
            aria-label="Cerrar filtros"
          >
            ✕
          </button>
          {inner}
        </aside>
      </>
    )
  }

  return (
    <aside className="w-full bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      {inner}
    </aside>
  )
}
