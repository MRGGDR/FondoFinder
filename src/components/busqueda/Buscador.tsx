'use client'
import { useState } from 'react'
import { useBusqueda } from '@/hooks/useBusqueda'
import FiltroPanel from './FiltroPanel'
import ResultadosGrid from './ResultadosGrid'

// Etiquetas legibles para los chips de filtros activos
const TIPO_LABELS: Record<string, string> = {
  Nacional: 'Nacional',
  Territorial: 'Territorial',
  Internacional: 'Internacional',
}

const PROCESO_LABELS: Record<number, string> = {
  1: 'Conocimiento',
  2: 'Reducción',
  3: 'Respuesta',
  4: 'Recuperación',
}

const BENEFICIARIO_LABELS: Record<number, string> = {
  1: 'Entidades nacionales',
  2: 'Entidades territoriales',
  3: 'CARs',
  4: 'Universidades',
  5: 'Sector privado',
  6: 'Sociedad civil',
  7: 'Entidades financieras',
  8: 'Cooperación internacional',
}

const OBJETIVO_LABELS: Record<number, string> = {
  1: 'Conocimiento riesgo',
  2: 'Reducción riesgo',
  3: 'Acción comunitaria',
  4: 'Gobernanza',
  5: 'Preparación y respuesta',
}

export function Buscador() {
  const { resultados, total, cargando, error, filtros, setFiltro, resetFiltros, totalPaginas, usandoCache } =
    useBusqueda()
  const [drawerAbierto, setDrawerAbierto] = useState(false)

  // Chips de filtros activos
  type Chip = { label: string; onRemove: () => void }
  const chips: Chip[] = []

  if (filtros.tipoFondo) {
    chips.push({
      label: TIPO_LABELS[filtros.tipoFondo] ?? filtros.tipoFondo,
      onRemove: () => setFiltro('tipoFondo', null),
    })
  }
  filtros.procesoIds.forEach(id => {
    chips.push({
      label: PROCESO_LABELS[id] ?? `Proceso ${id}`,
      onRemove: () =>
        setFiltro(
          'procesoIds',
          filtros.procesoIds.filter(x => x !== id)
        ),
    })
  })
  filtros.beneficiarioIds.forEach(id => {
    chips.push({
      label: BENEFICIARIO_LABELS[id] ?? `Beneficiario ${id}`,
      onRemove: () =>
        setFiltro(
          'beneficiarioIds',
          filtros.beneficiarioIds.filter(x => x !== id)
        ),
    })
  })
  filtros.objetivoIds.forEach(id => {
    chips.push({
      label: OBJETIVO_LABELS[id] ?? `Objetivo ${id}`,
      onRemove: () =>
        setFiltro(
          'objetivoIds',
          filtros.objetivoIds.filter(x => x !== id)
        ),
    })
  })
  if (filtros.presupuestoUSD) {
    chips.push({
      label: `≤ USD ${filtros.presupuestoUSD.toLocaleString('es-CO')}`,
      onRemove: () => setFiltro('presupuestoUSD', null),
    })
  }

  return (
    <div className="space-y-4">
      {/* Banner modo offline */}
      {usandoCache && (
        <div className="bg-ungrd-yellow text-ungrd-navy text-sm px-4 py-2 text-center font-medium rounded-xl">
          ⚠ Sin conexión — mostrando {resultados.length} fondos guardados localmente.
          Los PDF descargados anteriormente siguen disponibles.
        </div>
      )}

      {/* Barra de búsqueda */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ungrd-gray pointer-events-none">
            🔍
          </span>
          <input
            type="search"
            value={filtros.query}
            onChange={e => setFiltro('query', e.target.value)}
            placeholder="Buscar fondos de financiamiento..."
            className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm text-ungrd-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ungrd-blue-light"
          />
        </div>
        {/* Botón filtros (solo móvil) */}
        <button
          onClick={() => setDrawerAbierto(true)}
          className="lg:hidden flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm text-ungrd-navy font-medium text-sm hover:bg-gray-50 transition-colors"
        >
          ⚙️ Filtros
          {chips.length > 0 && (
            <span className="bg-ungrd-blue-mid text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {chips.length}
            </span>
          )}
        </button>
      </div>

      {/* Chips de filtros activos */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {chips.map((chip, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ungrd-navy/10 text-ungrd-navy text-xs font-medium"
            >
              {chip.label}
              <button
                onClick={chip.onRemove}
                className="hover:text-red-500 transition-colors leading-none"
                aria-label={`Eliminar filtro ${chip.label}`}
              >
                ×
              </button>
            </span>
          ))}
          <button
            onClick={resetFiltros}
            className="text-xs text-ungrd-gray hover:text-ungrd-navy underline"
          >
            Limpiar todo
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          Error al cargar los fondos: {error}
        </div>
      )}

      {/* Layout principal */}
      <div className="flex gap-6 items-start">
        {/* Sidebar filtros — solo desktop */}
        <div className="hidden lg:block w-72 shrink-0 sticky top-4">
          <FiltroPanel
            filtros={filtros}
            setFiltro={setFiltro}
            resetFiltros={resetFiltros}
          />
        </div>

        {/* Resultados */}
        <div className="flex-1 min-w-0">
          <ResultadosGrid
            resultados={resultados}
            total={total}
            cargando={cargando}
            pagina={filtros.pagina}
            totalPaginas={totalPaginas}
            onCambiarPagina={p => setFiltro('pagina', p)}
          />
        </div>
      </div>

      {/* Drawer móvil */}
      {drawerAbierto && (
        <FiltroPanel
          filtros={filtros}
          setFiltro={setFiltro}
          resetFiltros={resetFiltros}
          asDrawer
          onClose={() => setDrawerAbierto(false)}
        />
      )}
    </div>
  )
}

