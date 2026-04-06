'use client'
/**
 * EtapaPredicado — selección del predicado, verbos y complementos narrativos
 *
 * Esta es la etapa más rica del flujo:
 *   - predicado  → ¿Para qué? (ej. "Reducir riesgo", "Reconstruir infraestructura")
 *   - verbos     → ¿Qué quiere hacer? (multiselección)
 *   - complementos → ¿Sobre qué? (multiselección)
 *
 * Props reciben listas ya filtradas por grupo desde el catálogo.
 */

import type { TerminoNarrativo } from '@/types/database'

interface Props {
  predicados: TerminoNarrativo[]
  verbos: TerminoNarrativo[]
  complementos: TerminoNarrativo[]
  predicadoSeleccionado: string | null
  verbosSeleccionados: string[]
  complementosSeleccionados: string[]
  onPredicado: (id: string) => void
  onVerbos: (ids: string[]) => void
  onComplementos: (ids: string[]) => void
  onContinuar: () => void
  onSaltar: () => void
}

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
}

function GrupoTerminos({
  titulo,
  descripcion,
  terminos,
  seleccionados,
  unico,
  onCambiar,
}: {
  titulo: string
  descripcion: string
  terminos: TerminoNarrativo[]
  seleccionados: string[]
  unico: boolean
  onCambiar: (ids: string[]) => void
}) {
  if (terminos.length === 0) return null
  return (
    <div className="mb-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#07519D] mb-1">{titulo}</p>
      <p className="text-xs text-gray-400 mb-3">{descripcion}</p>
      <div className="flex flex-wrap gap-2">
        {terminos.map(t => {
          const activo = seleccionados.includes(t.id)
          return (
            <button
              key={t.id}
              onClick={() => {
                if (unico) {
                  onCambiar(activo ? [] : [t.id])
                } else {
                  onCambiar(toggleId(seleccionados, t.id))
                }
              }}
              aria-pressed={activo}
              className={[
                'px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all',
                activo
                  ? 'bg-[#07519D] border-[#07519D] text-white'
                  : 'bg-white border-gray-200 text-[#213362] hover:border-[#07519D] hover:bg-blue-50',
              ].join(' ')}
            >
              {t.termino_canonico}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function EtapaPredicado({
  predicados, verbos, complementos,
  predicadoSeleccionado, verbosSeleccionados, complementosSeleccionados,
  onPredicado, onVerbos, onComplementos,
  onContinuar, onSaltar,
}: Props) {
  const haySeleccion =
    predicadoSeleccionado ||
    verbosSeleccionados.length > 0 ||
    complementosSeleccionados.length > 0

  return (
    <section className="bg-[#f6fafe] py-24 border-b border-gray-100" aria-labelledby="etapa-predicado-titulo">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row gap-16 items-start">

          {/* Texto izquierda */}
          <div className="w-full md:w-1/3 shrink-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#07519D] mb-4">
              Paso 2 · Para qué
            </p>
            <h2 id="etapa-predicado-titulo" className="text-3xl font-black text-[#213362] leading-tight mb-4">
              ¿Para qué necesita el fondo?
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Selecciona el objetivo principal y las acciones concretas.
              Puedes elegir varios verbos y complementos.
            </p>
            <button onClick={onSaltar}
              className="text-xs font-bold text-gray-400 underline underline-offset-2 hover:text-[#07519D] transition-colors">
              Saltar este paso →
            </button>
          </div>

          {/* Grupos derecha */}
          <div className="flex-1">
            <GrupoTerminos
              titulo="Objetivo principal"
              descripcion="¿Qué quiere lograr? (elige uno)"
              terminos={predicados}
              seleccionados={predicadoSeleccionado ? [predicadoSeleccionado] : []}
              unico={true}
              onCambiar={ids => onPredicado(ids[0] ?? '')}
            />
            <GrupoTerminos
              titulo="Acciones"
              descripcion="¿Qué actividades va a realizar? (puede elegir varias)"
              terminos={verbos}
              seleccionados={verbosSeleccionados}
              unico={false}
              onCambiar={onVerbos}
            />
            <GrupoTerminos
              titulo="¿Sobre qué?"
              descripcion="Tema o área específica (puede elegir varios)"
              terminos={complementos}
              seleccionados={complementosSeleccionados}
              unico={false}
              onCambiar={onComplementos}
            />

            {haySeleccion && (
              <button
                onClick={onContinuar}
                className="mt-4 bg-[#213362] text-white font-black px-8 py-3 rounded-xl hover:bg-[#07519D] transition-colors"
              >
                Continuar →
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
