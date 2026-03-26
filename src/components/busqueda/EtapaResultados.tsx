'use client'

import Link from 'next/link'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { formatUSD } from '@/lib/utils'
import type { ResultadoBusqueda, TipoFondo } from '@/types/database'

interface FiltrosActivos {
  query: string
  tipoFondo: TipoFondo | null
  procesoIds: number[]
  objetivoIds: number[]
  presupuestoCOP: string
}

interface Props {
  resultados: ResultadoBusqueda[]
  total: number
  cargando: boolean
  filtros: FiltrosActivos
  onLimpiarFiltros: () => void
}

export function EtapaResultados({ resultados, total, cargando, filtros, onLimpiarFiltros }: Props) {
  return (
    <section className="bg-[#f6fafe] min-h-screen">

      {/* Header de resultados */}
      <div className="bg-[#f6fafe] border-b border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 md:px-12 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-black text-[#213362]">
              {cargando ? 'Buscando...' : `${total} fondos encontrados`}
            </h2>
            <p className="text-gray-400 font-medium mt-1 text-sm">
              Basado en los criterios seleccionados
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {filtros.tipoFondo && (
              <span className="bg-[#213362] text-white text-xs font-bold px-4 py-1.5 rounded-full">
                {filtros.tipoFondo}
              </span>
            )}
            {filtros.procesoIds?.length > 0 && (
              <span className="bg-[#213362] text-white text-xs font-bold px-4 py-1.5 rounded-full">
                {filtros.procesoIds.length} proceso(s)
              </span>
            )}
            {filtros.presupuestoCOP && (
              <span className="bg-[#FFCD00] text-[#213362] text-xs font-bold px-4 py-1.5 rounded-full">
                COP {filtros.presupuestoCOP}
              </span>
            )}
            <button
              onClick={onLimpiarFiltros}
              className="text-xs font-bold text-[#07519D] underline ml-2"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista editorial */}
      <div className="max-w-6xl mx-auto px-6 md:px-12">

        {/* Estado de carga */}
        {cargando && (
          <div className="py-16 space-y-8">
            {[1, 2, 3].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {!cargando && total === 0 && (
          <div className="py-32 text-center">
            <p className="text-6xl font-black text-gray-100 mb-4">0</p>
            <p className="text-xl font-black text-[#213362] mb-2">Sin resultados</p>
            <p className="text-gray-400 mb-8">
              No encontramos fondos con estos criterios.
            </p>
            <button
              onClick={onLimpiarFiltros}
              className="bg-[#FFCD00] text-[#213362] px-10 py-4 rounded-2xl font-black"
            >
              Ver todos los fondos
            </button>
          </div>
        )}

        {/* Resultados en layout editorial */}
        {!cargando && resultados.map((fondo, index) => {
          const montoDisplay =
            fondo.monto_min_usd && fondo.monto_max_usd
              ? `USD ${formatUSD(fondo.monto_min_usd)} - ${formatUSD(fondo.monto_max_usd)}`
              : fondo.monto_texto && fondo.monto_texto.length < 120
                ? fondo.monto_texto
                : 'Variable, caso a caso'

          const montoLargo = montoDisplay.length > 28

          return (
            <div
              key={fondo.id}
              className={`bg-white rounded-3xl p-12 mb-12 last:mb-0 shadow-[0_12px_40px_-28px_rgba(33,51,98,0.45)] border-l-[10px] ${
                index % 2 === 0 ? 'border-l-[#213362]' : 'border-l-[#FFCD00]'
              }`}
            >
              <div className="grid md:grid-cols-12 gap-8 md:gap-16 items-start">

                {/* Numero decorativo */}
                <div className="hidden md:flex md:col-span-1 flex-col items-center pt-2">
                  <span className="text-6xl font-black text-[#FFCD00] leading-none">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="w-px h-24 bg-gray-100 mt-4" />
                </div>

                {/* Info del fondo */}
                <div className="md:col-span-7">
                  {/* Badges */}
                  <div className="flex items-center gap-3 mb-5 flex-wrap">
                    <span className="px-4 py-1 rounded-full bg-[#FFCD00] text-[#213362] text-[10px] font-black uppercase tracking-[0.2em]">
                      Destacado
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      fondo.tipo_fondo_categoria === 'Nacional'
                        ? 'bg-[#1B4472] text-white'
                        : fondo.tipo_fondo_categoria === 'Territorial'
                        ? 'bg-[#07519D] text-white'
                        : 'bg-[#213362] text-[#FFCD00]'
                    }`}>
                      {fondo.tipo_fondo_categoria}
                    </span>
                    <span className="text-gray-300 font-black text-xs">ID: {fondo.id}</span>
                  </div>

                  {/* Nombre */}
                  <h3 className="text-4xl md:text-5xl font-black text-[#213362] leading-tight mb-6">
                    {fondo.nombre}
                  </h3>

                  {/* Entidad */}
                  {fondo.entidad_encargada && (
                    <p className="text-lg text-gray-400 font-medium mb-8 leading-relaxed">
                      {fondo.entidad_encargada.length > 200
                        ? fondo.entidad_encargada.slice(0, 200) + '...'
                        : fondo.entidad_encargada}
                    </p>
                  )}

                  {/* Tags de procesos */}
                  {fondo.procesos && fondo.procesos.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {fondo.procesos.map(p => (
                        <span
                          key={p.id}
                          className="bg-gray-50 text-gray-500 text-xs font-bold px-4 py-2 rounded-xl border border-gray-100"
                        >
                          {p.nombre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Panel de monto */}
                <div className={`md:col-span-4 rounded-[2rem] p-8 md:p-10 flex flex-col justify-between min-h-[280px] md:min-h-[360px] ${
                  index % 2 === 0
                    ? 'bg-[#eaeef3]'
                    : 'bg-[#213362] text-white'
                }`}>
                  <div>
                    <p className={`text-xs font-black uppercase tracking-[0.2em] mb-4 ${
                      index % 2 === 0 ? 'text-gray-400' : 'text-white/40'
                    }`}>
                      Inversion disponible
                    </p>
                    <p className={`font-black tracking-tight leading-snug break-words ${
                      montoLargo ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'
                    } ${index % 2 === 0 ? 'text-[#213362]' : 'text-[#FFCD00]'}`}>
                      {montoDisplay}
                    </p>
                  </div>
                  <Link
                    href={`/fondo/${fondo.id}`}
                    className={`mt-8 w-full py-4 rounded-2xl font-black text-lg text-center hover:scale-[1.02] active:scale-95 transition-all shadow-xl block ${
                      index % 2 === 0
                        ? 'bg-[#213362] text-white shadow-[#213362]/20'
                        : 'bg-white text-[#213362] hover:bg-[#FFCD00]'
                    }`}
                  >
                    CONOCER MAS
                  </Link>
                </div>

              </div>
            </div>
          )
        })}

      </div>
    </section>
  )
}
