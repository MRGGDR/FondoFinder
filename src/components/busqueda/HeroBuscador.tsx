'use client'

import Image from 'next/image'
import { NavBar } from '@/components/layout/NavBar'

interface HeroBuscadorProps {
  query?: string
  onQueryChange?: (q: string) => void
  onComenzar: () => void
  onReset?: () => void
  ctaVariant?: 'single' | 'triple'
  onBusquedaDirecta?: (query: string) => void
  onBuscadorAvanzado?: () => void
  onBuscadorLibre?: () => void
}

export function HeroBuscador({
  onComenzar,
  onReset,
  query,
  onQueryChange,
  onBusquedaDirecta,
  ctaVariant = 'single',
  onBuscadorAvanzado,
  onBuscadorLibre,
}: HeroBuscadorProps) {
  return (
    <>
      <section
        className="min-h-screen bg-[#213362] flex flex-col items-center justify-center px-4 sm:px-6 text-center pb-20 relative overflow-hidden"
        style={{ paddingTop: '100px' }}
        aria-label="Buscador de fondos"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <Image
            src="/logo-ungrd-sinfondo.png"
            alt=""
            width={900}
            height={900}
            className="opacity-5 absolute -right-16 bottom-6 max-w-none select-none"
            priority
          />
        </div>

        <div style={{ position: 'absolute', top: 16, left: 0, right: 0 }}>
          <NavBar variant="hero" />
        </div>

        <div
          className="inline-flex items-center gap-2 bg-[#FFCD00]/10
          border border-[#FFCD00]/20 text-[#FFCD00] text-[9px] sm:text-[10px] font-bold
          px-3 sm:px-4 py-[5px] rounded-full tracking-[1px] uppercase mb-6 sm:mb-8"
        >
          <div className="w-[5px] h-[5px] bg-[#FFCD00] rounded-full flex-shrink-0" />
          Herramienta digital para el financiamiento del PNGRD
        </div>

        <h1
          className="text-[40px] sm:text-[54px] md:text-[68px] lg:text-[80px] font-black text-white
          text-center leading-[1.05] tracking-[-1px] sm:tracking-[-2px] mb-6"
        >
          Encuentra el
          <br />
          <span
            className="block text-[44px] sm:text-[64px] md:text-[80px] lg:text-[96px] leading-none
            tracking-[-2px] sm:tracking-[-3px] text-[#FFCD00] italic underline
            decoration-white/15 underline-offset-[8px]"
          >
            fondo de financiamiento
          </span>
          para tu territorio
        </h1>

        <p
          className="text-white/50 text-sm md:text-base lg:text-lg font-normal
          leading-relaxed max-w-[520px] mb-8"
        >
          Identifica en minutos qué fondo financia tu proyecto de gestión del riesgo.
        </p>

        <div className="flex flex-nowrap items-center justify-center mb-8">
          <div className="text-center px-2 sm:px-6">
            <div className="text-[22px] sm:text-[32px] font-black text-[#FFCD00] leading-none tracking-[-1px]">33</div>
            <div className="text-[8px] sm:text-[9px] font-bold text-white/30 uppercase tracking-[1px] mt-[3px]">Fondos</div>
          </div>
          <div className="w-px h-7 sm:h-9 bg-white/[0.12]" />
          <div className="text-center px-2 sm:px-6">
            <div className="text-[22px] sm:text-[32px] font-black text-white leading-none tracking-[-1px]">6</div>
            <div className="text-[8px] sm:text-[9px] font-bold text-white/30 uppercase tracking-[1px] mt-[3px]">Nacionales</div>
          </div>
          <div className="w-px h-7 sm:h-9 bg-white/[0.12]" />
          <div className="text-center px-2 sm:px-6">
            <div className="text-[22px] sm:text-[32px] font-black text-white leading-none tracking-[-1px]">8</div>
            <div className="text-[8px] sm:text-[9px] font-bold text-white/30 uppercase tracking-[1px] mt-[3px]">Territoriales</div>
          </div>
          <div className="w-px h-7 sm:h-9 bg-white/[0.12]" />
          <div className="text-center px-2 sm:px-6">
            <div className="text-[22px] sm:text-[32px] font-black text-white leading-none tracking-[-1px]">19</div>
            <div className="text-[8px] sm:text-[9px] font-bold text-white/30 uppercase tracking-[1px] mt-[3px]">Internacionales</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          {ctaVariant === 'single' && (
            <>
              <button
                onClick={onComenzar}
                className="bg-[#FFCD00] text-[#213362] text-sm font-black
                  px-14 py-4 rounded-[14px] uppercase tracking-[1px]
                  shadow-[0_8px_32px_rgba(255,205,0,0.25)]
                  hover:brightness-110 hover:scale-[1.02]
                  active:scale-95 transition-all"
              >
                {'Comencemos →'}
              </button>
              {onReset && (
                <button
                  type="button"
                  onClick={onReset}
                  className="text-white/60 text-xs font-semibold underline underline-offset-4 hover:text-white transition-colors"
                >
                  Reiniciar recorrido
                </button>
              )}
            </>
          )}

          {ctaVariant === 'triple' && (
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto px-2 sm:px-0">
              <button
                onClick={onComenzar}
                className="group flex flex-col items-center gap-1.5 bg-[#FFCD00] text-[#213362]
                  px-8 py-5 rounded-2xl w-full sm:min-w-[210px] sm:w-auto
                  shadow-[0_8px_32px_rgba(255,205,0,0.30)]
                  hover:brightness-110 hover:scale-[1.02]
                  active:scale-95 transition-all"
              >
                <span className="text-[11px] font-black uppercase tracking-[1.2px] opacity-60">Paso a paso</span>
                <span className="text-[17px] font-black uppercase tracking-[0.6px] leading-none">Buscador Guiado →</span>
                <span className="text-[11px] font-semibold opacity-50 leading-tight max-w-[180px] text-center">
                  Te ayudamos a encontrar el fondo ideal
                </span>
              </button>

              <button
                onClick={onBuscadorAvanzado ?? (() => {})}
                className="group flex flex-col items-center gap-1.5 bg-white/10 text-white
                  px-8 py-5 rounded-2xl w-full sm:min-w-[210px] sm:w-auto
                  border border-white/25
                  hover:bg-white/15 hover:scale-[1.02]
                  active:scale-95 transition-all"
              >
                <span className="text-[11px] font-black uppercase tracking-[1.2px] opacity-60">Catálogo completo</span>
                <span className="text-[17px] font-black uppercase tracking-[0.6px] leading-none">Búsqueda Avanzada →</span>
                <span className="text-[11px] font-semibold opacity-50 leading-tight max-w-[180px] text-center">
                  Filtra por tipo, estado, territorio y más
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Link descarga manual */}
        <button
          type="button"
          className="mt-3 text-white/40 text-xs font-semibold hover:text-white/70
            transition-colors text-center leading-relaxed bg-transparent border-0 cursor-pointer p-0"
          onClick={async () => {
            const res = await fetch('/api/manual')
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'Manual_Herramienta_Financiamiento.pdf'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }}
        >
          ¿Necesitas ayuda navegando la herramienta?{' '}
          <span className="underline underline-offset-2">Descarga el manual aquí</span>
        </button>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-[14px] md:h-[16px] lg:h-[18px] z-30"
          style={{
            background:
              'linear-gradient(90deg, #ffc800 0%, #ffc800 50%, #223a7a 50%, #223a7a 75%, #d80e25 75%, #d80e25 100%)',
            boxShadow: '0 -4px 14px rgba(0,0,0,0.14)',
          }}
        />
      </section>
    </>
  )
}
