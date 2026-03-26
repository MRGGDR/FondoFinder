'use client'

import { type KeyboardEvent } from 'react'
import Image from 'next/image'
import { NavBar } from '@/components/layout/NavBar'

interface HeroBuscadorProps {
  query: string
  onQueryChange: (q: string) => void
  onComenzar: () => void
  onBusquedaDirecta: (query: string) => void
  onReset?: () => void
}

export function HeroBuscador({ query, onQueryChange, onComenzar, onBusquedaDirecta, onReset }: HeroBuscadorProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && query.trim()) {
      onBusquedaDirecta(query.trim())
    }
  }

  return (
    <>
      <section
        className="min-h-screen bg-[#213362] flex flex-col items-center justify-center px-6 text-center pb-16 relative"
        style={{ paddingTop: '72px' }}
        aria-label="Buscador de fondos"
      >
        {/* Watermark UNGRD */}
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

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <NavBar variant="hero" />
        </div>

        {/* Chip */}
        <div className="inline-flex items-center gap-2 bg-[#FFCD00]/10
          border border-[#FFCD00]/20 text-[#FFCD00] text-[10px] font-bold
          px-4 py-[5px] rounded-full tracking-[1px] uppercase mb-8">
          <div className="w-[5px] h-[5px] bg-[#FFCD00] rounded-full flex-shrink-0" />
          UNGRD &middot; Fuentes de Financiamiento
        </div>

        {/* Título */}
        <h1 className="text-[68px] md:text-[80px] font-black text-white
          text-center leading-[1.05] tracking-[-2px] mb-6">
          Encuentra el<br />
          <span className="block text-[80px] md:text-[96px] leading-none
            tracking-[-3px] text-[#FFCD00] italic underline
            decoration-white/15 underline-offset-[8px]">
            financiamiento
          </span>
          para tu municipio
        </h1>

        {/* Subtítulo */}
        <p className="text-white/50 text-base md:text-lg font-normal
          leading-relaxed max-w-[520px] mb-10">
          32 fuentes de financiamiento disponibles para la gestión del riesgo
          en Colombia. Nacionales, territoriales e internacionales.
        </p>

        {/* Buscador grande */}
        <div className="w-full max-w-[640px] flex items-center bg-white/[0.08]
          border-[1.5px] border-white/[0.18] rounded-2xl overflow-hidden mb-6
          focus-within:border-[#FFCD00] focus-within:bg-white/10 transition-all">
          <div className="px-5 flex items-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.8" viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="9" cy="9" r="6" />
              <path d="m16 16-3-3" strokeLinecap="round" />
            </svg>
          </div>
          <label htmlFor="hero-search" className="sr-only">
            {'¿Qué proyecto buscas financiar?'}
          </label>
          <input
            id="hero-search"
            type="text"
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={'¿Qué proyecto buscas financiar?'}
            className="flex-1 bg-transparent border-none outline-none
              text-white text-[15px] placeholder:text-white/30
              py-[17px] pr-4 font-normal"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center mb-10">
          <div className="text-center px-6">
            <div className="text-[32px] font-black text-[#FFCD00] leading-none tracking-[-1px]">32</div>
            <div className="text-[9px] font-bold text-white/30 uppercase tracking-[1px] mt-[3px]">Fondos</div>
          </div>
          <div className="w-px h-9 bg-white/[0.12]" />
          <div className="text-center px-6">
            <div className="text-[32px] font-black text-white leading-none tracking-[-1px]">12</div>
            <div className="text-[9px] font-bold text-white/30 uppercase tracking-[1px] mt-[3px]">Nacionales</div>
          </div>
          <div className="w-px h-9 bg-white/[0.12]" />
          <div className="text-center px-6">
            <div className="text-[32px] font-black text-white leading-none tracking-[-1px]">5</div>
            <div className="text-[9px] font-bold text-white/30 uppercase tracking-[1px] mt-[3px]">Territoriales</div>
          </div>
          <div className="w-px h-9 bg-white/[0.12]" />
          <div className="text-center px-6">
            <div className="text-[32px] font-black text-white leading-none tracking-[-1px]">15</div>
            <div className="text-[9px] font-bold text-white/30 uppercase tracking-[1px] mt-[3px]">Internacionales</div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onComenzar}
            className="bg-[#FFCD00] text-[#213362] text-sm font-black
              px-14 py-4 rounded-[14px] uppercase tracking-[1px]
              shadow-[0_8px_32px_rgba(255,205,0,0.25)]
              hover:brightness-110 hover:scale-[1.02]
              active:scale-95 transition-all">
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
          <p className="text-white/35 text-xs font-medium">
            {'¿No sabes qué fondo elegir?'}{' '}
            <span className="text-[#FFCD00]/70 font-semibold">
              Te guiamos paso a paso
            </span>
          </p>
        </div>

      </section>

      {/* Franja tricolor Colombia */}
      <div className="flex h-[6px] w-full" aria-hidden="true">
        <div className="w-1/2 bg-[#FFC800]" />
        <div className="w-1/4 bg-[#223A7A]" />
        <div className="w-1/4 bg-[#D80E25]" />
      </div>
    </>
  )
}
