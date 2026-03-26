import Link from 'next/link'
import type { FondoConRelaciones } from '@/types/database'
import { formatUSD, truncate } from '@/lib/utils'

interface FondoDestacadoProps {
  fondo: FondoConRelaciones
  numero: number
}

export function FondoDestacado({ fondo, numero }: FondoDestacadoProps) {
  const numStr = String(numero).padStart(2, '0')

  const montoLabel =
    fondo.monto_min_usd && fondo.monto_max_usd
      ? `USD ${formatUSD(fondo.monto_min_usd)} – ${formatUSD(fondo.monto_max_usd)}`
      : fondo.monto_min_usd
      ? `Desde USD ${formatUSD(fondo.monto_min_usd)}`
      : 'Variable · caso a caso'

  return (
    <section className="py-32 bg-white relative border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-12 gap-16 items-start">

          {/* Número decorativo */}
          <div className="hidden md:flex md:col-span-1 flex-col items-center">
            <span className="text-6xl font-black text-[#FFCD00]">{numStr}</span>
            <div className="w-px h-32 bg-gray-100 my-4" />
          </div>

          {/* Info del fondo */}
          <div className="md:col-span-7">
            <div className="flex items-center gap-4 mb-6">
              <span className="px-4 py-1 rounded-full bg-[#FFCD00] text-[#213362]
                text-[10px] font-black uppercase tracking-[0.2em]">
                Destacado
              </span>
              <span className="text-gray-400 font-black text-xs">
                {fondo.tipo_fondo_categoria}
              </span>
              <span className="text-gray-300 font-black text-xs">ID: {fondo.id}</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-[#213362]
              leading-tight mb-8">
              {fondo.nombre}
            </h2>

            {fondo.entidad_encargada && (
              <p className="text-xl text-gray-500 font-medium mb-12 leading-relaxed">
                {truncate(fondo.entidad_encargada, 200)}
              </p>
            )}

            {/* Tags de procesos */}
            {fondo.procesos?.length > 0 && (
              <div className="flex flex-wrap gap-4 mb-12">
                {fondo.procesos.map(p => (
                  <span key={p.id}
                    className="bg-gray-50 text-gray-600 text-xs
                      font-bold px-4 py-2 rounded-xl border border-gray-100">
                    {p.nombre}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Panel de monto */}
          <div className="md:col-span-4 bg-[#eaeef3] rounded-[2rem] p-10
            flex flex-col justify-between min-h-[360px]">
            <div>
              <p className="text-xs font-black text-gray-400 uppercase
                tracking-[0.2em] mb-4">
                Inversión disponible
              </p>
              <p className="text-3xl font-black text-[#213362] tracking-tighter leading-tight">
                {montoLabel}
              </p>
            </div>
            <Link
              href={`/fondo/${fondo.id}`}
              className="mt-12 w-full bg-[#213362] text-white py-5 rounded-2xl
                font-black text-lg text-center hover:scale-[1.02] active:scale-95
                transition-all shadow-xl shadow-[#213362]/20 block"
            >
              CONOCER MÁS
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
