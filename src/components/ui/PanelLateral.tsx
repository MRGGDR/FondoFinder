'use client'
/**
 * PanelLateral — drawer deslizable desde la derecha
 *
 * Características:
 *   - Backdrop semitransparente; clic cierra el panel
 *   - Tecla Escape cierra el panel
 *   - document.body overflow:hidden mientras está abierto
 *   - Cabecera fija con título y botón ✕
 *   - Cuerpo con overflow-y:auto para contenido largo
 *
 * Props:
 *   abierto   → controla visibilidad
 *   titulo    → texto de la cabecera
 *   onCerrar  → callback para cerrar
 *   children  → contenido del panel
 */

import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface Props {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  children: ReactNode
}

export function PanelLateral({ abierto, titulo, onCerrar, children }: Props) {
  // Bloquear scroll del body mientras está abierto
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [abierto])

  // Cerrar con Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && abierto) onCerrar()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [abierto, onCerrar])

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onCerrar}
        className={[
          'fixed inset-0 bg-black/40 z-40 transition-opacity duration-300',
          abierto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={[
          'fixed top-0 right-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl',
          'flex flex-col transition-transform duration-300 ease-out',
          abierto ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Cabecera fija */}
        <div className="shrink-0 flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-black text-[#213362] text-lg leading-tight pr-4">
            {titulo}
          </h2>
          <button
            onClick={onCerrar}
            aria-label="Cerrar panel"
            className="shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors
              flex items-center justify-center text-gray-500"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Contenido desplazable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </div>
      </aside>
    </>
  )
}
