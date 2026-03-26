'use client'

import type { TipoFondo } from '@/types/database'

const IconNacional = ({ selected }: { selected: boolean }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"
    className={selected ? 'text-[#FFCD00]' : 'text-[#213362]'}>
    <rect x="4" y="14" width="24" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M16 4L28 14H4L16 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <rect x="13" y="20" width="6" height="8" rx="1" fill="currentColor"/>
  </svg>
)

const IconTerritorial = ({ selected }: { selected: boolean }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"
    className={selected ? 'text-[#FFCD00]' : 'text-[#213362]'}>
    <path d="M16 3C11.03 3 7 7.03 7 12C7 19 16 29 16 29C16 29 25 19 25 12C25 7.03 20.97 3 16 3Z"
      stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="16" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

const IconInternacional = ({ selected }: { selected: boolean }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"
    className={selected ? 'text-[#FFCD00]' : 'text-[#213362]'}>
    <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.5"/>
    <ellipse cx="16" cy="16" rx="6" ry="12" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="4" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="6" y1="10" x2="26" y2="10" stroke="currentColor" strokeWidth="1.2"/>
    <line x1="6" y1="22" x2="26" y2="22" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
)

const TIPOS: Array<{
  id: TipoFondo
  label: string
  fondos: number
  descripcion: string
  Icon: (props: { selected: boolean }) => JSX.Element
}> = [
  { id: 'Nacional',       label: 'Nacional',       fondos: 12, descripcion: '12 fondos de origen central',      Icon: IconNacional },
  { id: 'Territorial',    label: 'Territorial',     fondos: 5,  descripcion: '5 fondos locales y regionales',    Icon: IconTerritorial },
  { id: 'Internacional',  label: 'Internacional',   fondos: 15, descripcion: '15 fondos de organismos globales', Icon: IconInternacional },
]

interface EtapaTipoProps {
  seleccionado: TipoFondo | null
  onSeleccionar: (tipo: TipoFondo) => void
  onSaltar: () => void
}

export function EtapaTipo({ seleccionado, onSeleccionar, onSaltar }: EtapaTipoProps) {
  return (
    <section className="bg-[#f6fafe] py-24 border-b border-gray-100"
      aria-labelledby="etapa-tipo-titulo">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row gap-16 items-center">

          {/* Texto izquierda */}
          <div className="w-full md:w-1/3 shrink-0">
            <span className="text-6xl font-black text-[#FFCD00] block mb-2">01</span>
            <h2 id="etapa-tipo-titulo"
              className="text-4xl font-black text-[#213362] mb-6">
              Primero,<br />define el alcance
            </h2>
            <p className="text-gray-500 font-medium leading-relaxed">
              Filtra por el origen de los recursos para encontrar
              convocatorias alineadas a tu gobernanza.
            </p>
          </div>

          {/* Cards � 3 columnas, sin scroll */}
          <div className="w-full md:w-2/3">
            <div
              role="radiogroup"
              aria-label="Tipo de fondo"
              className="grid grid-cols-1 sm:grid-cols-3 gap-6"
            >
              {TIPOS.map(({ id, label, descripcion, Icon }) => {
                const isSelected = seleccionado === id
                return (
                  <button
                    key={id}
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onSeleccionar(id)}
                    className={[
                      'w-full rounded-3xl p-8 flex flex-col justify-between transition-all aspect-square',
                      isSelected
                        ? 'bg-[#213362] text-white shadow-2xl shadow-[#213362]/30 border-2 border-[#213362]'
                        : 'bg-white border-2 border-gray-200 hover:border-[#213362] hover:shadow-xl',
                    ].join(' ')}
                  >
                    <Icon selected={isSelected} />
                    <div className="text-left">
                      <h4 className={`text-xl font-black ${ isSelected ? 'text-white' : 'text-[#213362]' }`}>
                        {label}
                      </h4>
                      <p className={`text-sm font-medium mt-1 ${ isSelected ? 'text-white/60' : 'text-gray-400' }`}>
                        {descripcion}
                      </p>
                      {isSelected && (
                        <span className="mt-3 inline-block bg-[#FFCD00] text-[#213362]
                          px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                          Activo
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            <button
              onClick={onSaltar}
              className="mt-8 text-sm text-gray-400 hover:text-[#213362] font-medium transition-colors underline-offset-4 hover:underline"
            >
              Saltar este paso
            </button>
          </div>

        </div>
      </div>
    </section>
  )
}
