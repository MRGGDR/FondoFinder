import type { ResultadoBusqueda } from '@/types/database'
import FondoCard from '@/components/fondos/FondoCard'
import { SkeletonCard } from '@/components/ui/Skeleton'

interface ResultadosGridProps {
  resultados: ResultadoBusqueda[]
  total: number
  cargando: boolean
  pagina: number
  totalPaginas: number
  onCambiarPagina: (p: number) => void
}

export default function ResultadosGrid({
  resultados,
  total,
  cargando,
  pagina,
  totalPaginas,
  onCambiarPagina,
}: ResultadosGridProps) {
  if (cargando) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-36 animate-pulse bg-gray-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!resultados.length) {
    return (
      <div className="py-20 text-center space-y-2">
        <p className="text-2xl">🔍</p>
        <p className="font-semibold text-ungrd-navy">No encontramos fondos con estos criterios</p>
        <p className="text-sm text-ungrd-gray">Prueba con otros filtros o amplía tu búsqueda.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ungrd-gray">
        <span className="font-semibold text-ungrd-navy">{total}</span> fondo{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {resultados.map(fondo => (
          <FondoCard key={fondo.id} fondo={fondo} />
        ))}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => onCambiarPagina(pagina - 1)}
            disabled={pagina <= 1}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-ungrd-navy disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            ← Anterior
          </button>
          <span className="text-sm text-ungrd-gray">
            Página{' '}
            <span className="font-semibold text-ungrd-navy">{pagina}</span>
            {' '}de{' '}
            <span className="font-semibold text-ungrd-navy">{totalPaginas}</span>
          </span>
          <button
            onClick={() => onCambiarPagina(pagina + 1)}
            disabled={pagina >= totalPaginas}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-ungrd-navy disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}
