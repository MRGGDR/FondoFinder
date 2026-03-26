'use client'

import Link from 'next/link'
import type { ResultadoBusqueda } from '@/types/database'
import Badge from '@/components/ui/Badge'
import Tag from '@/components/ui/Tag'
import { formatUSD } from '@/lib/utils'
import { useLoader } from '@/hooks/useLoader'
import { UNGRDLoader } from '@/components/ui/UNGRDLoader'

interface FondoCardProps {
  fondo: ResultadoBusqueda
}

export default function FondoCard({ fondo }: FondoCardProps) {
  const montoLabel = fondo.monto_texto
    ?? (fondo.monto_min_usd || fondo.monto_max_usd
      ? `${formatUSD(fondo.monto_min_usd)} – ${formatUSD(fondo.monto_max_usd)}`
      : 'Monto variable')
  const { estado: loader, mostrar: mostrarLoader } = useLoader()

  return (
    <>
      <Link
        href={`/fondo/${fondo.id}`}
        className="group flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-ungrd-yellow transition-all duration-200 overflow-hidden h-full"
        onClick={() => mostrarLoader('buscando')}
      >
        {/* Card header */}
        <div className="bg-ungrd-blue-dark/10 px-4 pt-4 pb-3 flex items-start justify-between gap-2">
          <Badge tipo={fondo.tipo_fondo_categoria} />
          <span className="text-[11px] font-bold text-ungrd-gray/80 tracking-widest uppercase shrink-0">
            {fondo.id}
          </span>
        </div>

        {/* Card body */}
        <div className="px-4 py-3 flex flex-col gap-2 flex-1">
          <h3 className="font-bold text-ungrd-navy text-base leading-snug line-clamp-2">
            {fondo.nombre}
          </h3>
          {fondo.entidad_encargada && (
            <p className="text-xs text-ungrd-gray line-clamp-1">
              {fondo.entidad_encargada}
            </p>
          )}

          {/* Tags de procesos */}
          {fondo.procesos?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {fondo.procesos.slice(0, 3).map(p => (
                <Tag key={p.id} label={p.nombre} variant="proceso" />
              ))}
              {fondo.procesos.length > 3 && (
                <Tag label={`+${fondo.procesos.length - 3}`} variant="default" />
              )}
            </div>
          )}
        </div>

        {/* Card footer */}
        <div className="px-4 pb-4 pt-2 flex items-center justify-between gap-2 border-t border-gray-100 mt-auto">
          <span className="text-sm font-semibold text-ungrd-blue-mid truncate">
            {montoLabel}
          </span>
          <span className="shrink-0 text-xs font-semibold text-ungrd-navy bg-ungrd-yellow/20 group-hover:bg-ungrd-yellow px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
            Ver más →
          </span>
        </div>
      </Link>
      <UNGRDLoader visible={loader.visible} contexto={loader.contexto} subTexto={loader.subTexto} />
    </>
  )
}
