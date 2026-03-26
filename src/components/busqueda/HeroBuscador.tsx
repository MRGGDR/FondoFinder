'use client'

import { type KeyboardEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'

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
        className="hero-buscador min-h-screen flex flex-col items-center
          justify-center px-6 text-center pt-[88px] pb-16 relative"
        style={{ backgroundColor: '#213362', overflow: 'hidden' }}
        aria-label="Buscador de fondos"
      >
        {/* Watermark — ícono de la mano UNGRD, muy sutil */}
        <div className="hero-watermark" style={{
          position: 'absolute',
          right: '-40px',
          bottom: '40px',
          opacity: 0.05,
          pointerEvents: 'none',
          zIndex: 0,
          width: '900px',
          height: '900px',
        }}>
          <Image src="/logo-ungrd-sinfondo.png" alt="" width={900} height={900}
            style={{ objectFit: 'contain', objectPosition: 'right center' }}
            aria-hidden="true" />
        </div>

        {/* Navegacion integrada en el hero - reemplaza al header */}
        <div className="hero-nav" style={{
          position: 'absolute',
          top: '12px', left: 0, right: 0,
          height: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '60px',
          paddingRight: '60px',
        }}>
          <Image
            src="/logo-ungrd-blanco.png"
            alt="UNGRD"
            height={78}
            width={250}
            className="hero-logo"
            style={{ objectFit: 'contain', objectPosition: 'left center', display: 'block' }}
            priority
          />

          <nav style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {[
              { label: 'Inicio', href: '/' },
              { label: 'Fondos', href: '/fondos' },
              { label: 'Mapa', href: '/mapa' },
              { label: 'Admin', href: '/admin' },
            ].map(item => (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  color: 'rgba(255,255,255,0.75)',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  padding: '0 12px 10px',
                  borderBottom: '2px solid transparent',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FFCD00'
                  e.currentTarget.style.borderBottomColor = '#FFCD00'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
                  e.currentTarget.style.borderBottomColor = 'transparent'
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Chip */}
          <div className="hero-chip inline-flex items-center gap-2 bg-[#FFCD00]/10
            border border-[#FFCD00]/20 text-[#FFCD00] text-[10px] font-bold
            px-4 py-[5px] rounded-full tracking-[1px] uppercase mb-8">
            <div className="w-[5px] h-[5px] bg-[#FFCD00] rounded-full flex-shrink-0" />
            UNGRD &middot; Fuentes de Financiamiento
          </div>

          {/* Titulo */}
          <h1 className="hero-title text-[64px] md:text-[78px] font-black text-white
            text-center leading-[1.08] tracking-[-2px] mb-6">
            <span className="block">Encuentra la</span>
            <span className="hero-highlight block text-[70px] md:text-[88px] leading-tight
              tracking-[-2.5px] text-[#FFCD00] italic inline-block
              underline decoration-white/20 decoration-[6px] underline-offset-[10px]">
              fuente de financiamiento
            </span>
            <span className="block">para tu municipio</span>
          </h1>

          {/* Subtitulo */}
          <p className="text-white/50 text-base md:text-lg font-normal
            leading-relaxed max-w-[520px] mb-10">
            32 fuentes de financiamiento disponibles para la gesti&oacute;n del riesgo
            en Colombia. Nacionales, territoriales e internacionales.
          </p>

          {/* Buscador grande */}
          <div className="hero-search w-full max-w-[640px] flex items-center bg-white/[0.08]
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
              {'\u00bfQu\u00e9 proyecto buscas financiar?'}
            </label>
            <input
              id="hero-search"
              type="text"
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={'\u00bfQu\u00e9 proyecto buscas financiar?'}
              className="flex-1 bg-transparent border-none outline-none
                text-white text-[15px] placeholder:text-white/30
                py-[17px] pr-4 font-normal"
            />
          </div>

          {/* Stats */}
          <div className="hero-stats flex items-center justify-center mb-10">
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
          <div className="hero-cta flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={onComenzar}
                className="bg-[#FFCD00] text-[#213362] text-sm font-black
                  px-14 py-4 rounded-[14px] uppercase tracking-[1px]
                  shadow-[0_8px_32px_rgba(255,205,0,0.25)]
                  hover:brightness-110 hover:scale-[1.02]
                  active:scale-95 transition-all">
                Comencemos &rarr;
              </button>
              {onReset && (
                <button
                  type="button"
                  onClick={onReset}
                  aria-label="Reiniciar paso a paso"
                  className="w-11 h-11 rounded-full border border-white/20 text-white/70
                    hover:text-[#213362] hover:bg-[#FFCD00] hover:border-[#FFCD00]
                    active:scale-95 transition-all flex items-center justify-center"
                >
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M5 4v3h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 7a7 7 0 1 1-2 5.196" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
            <p className="text-white/35 text-xs font-medium">
              {'\u00bfNo sabes qu\u00e9 fondo elegir?'}{' '}
              <span className="text-[#FFCD00]/70 font-semibold">
                Te guiamos paso a paso
              </span>
            </p>
          </div>
        </div>

        {/* Franja tricolor Colombia */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
          display: 'flex',
          height: '12px',
          pointerEvents: 'none',
          zIndex: 2,
        }}
        >
          <div style={{ width: '50%', background: '#FFC800' }} />
          <div style={{ width: '25%', background: '#223A7A' }} />
          <div style={{ width: '25%', background: '#D80E25' }} />
        </div>

      </section>

    </>
  )
}
