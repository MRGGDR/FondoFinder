'use client'
/**
 * EtapaSujeto — selección del sujeto narrativo
 *
 * Muestra los términos del grupo "sujeto" como botones de selección.
 * El sujeto identifica quién necesita el fondo:
 *   ej. "Municipio", "Gobernación", "ONG", "Empresa privada"...
 *
 * Props:
 *   terminos       → cat_narrativa_terminos filtrados por grupo=sujeto
 *   seleccionado   → id del término seleccionado (null si ninguno)
 *   onSeleccionar  → callback con el id del término elegido
 *   onContinuar    → avanza a la siguiente etapa
 *   onSaltar       → avanza sin seleccionar sujeto
 */

import type { TerminoNarrativo } from '@/types/database'

interface Props {
  terminos: TerminoNarrativo[]
  seleccionado: string | null
  onSeleccionar: (id: string) => void
  onContinuar: () => void
  onSaltar: () => void
}

export function EtapaSujeto({ terminos, seleccionado, onSeleccionar, onContinuar, onSaltar }: Props) {
  return (
    <section className="bg-white py-24 border-b border-gray-100" aria-labelledby="etapa-sujeto-titulo">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row gap-16 items-start">

          {/* Texto izquierda */}
          <div className="w-full md:w-1/3 shrink-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#07519D] mb-4">
              Paso 1 · Quién
            </p>
            <h2 id="etapa-sujeto-titulo" className="text-3xl font-black text-[#213362] leading-tight mb-4">
              ¿Quién va a aplicar al fondo?
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Selecciona el tipo de entidad o actor que buscará acceder al financiamiento.
              Esto mejora los resultados al priorizar fondos compatibles con tu perfil.
            </p>
            <button
              onClick={onSaltar}
              className="text-xs font-bold text-gray-400 underline underline-offset-2 hover:text-[#07519D] transition-colors"
            >
              Saltar este paso →
            </button>
          </div>

          {/* Opciones derecha */}
          <div className="flex-1">
            {terminos.length === 0 ? (
              <p className="text-gray-400 text-sm">Cargando opciones...</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {terminos.map(t => {
                  const activo = seleccionado === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => onSeleccionar(t.id)}
                      aria-pressed={activo}
                      className={[
                        'px-5 py-3 rounded-xl text-sm font-bold border-2 transition-all',
                        activo
                          ? 'bg-[#213362] border-[#213362] text-white shadow-md'
                          : 'bg-white border-gray-200 text-[#213362] hover:border-[#213362] hover:bg-[#f0f4ff]',
                      ].join(' ')}
                    >
                      {t.termino_canonico}
                      {t.descripcion && (
                        <span className={`block text-[11px] font-normal mt-0.5 ${activo ? 'text-white/70' : 'text-gray-400'}`}>
                          {t.descripcion}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {seleccionado && (
              <div className="mt-8">
                <button
                  onClick={onContinuar}
                  className="bg-[#213362] text-white font-black px-8 py-3 rounded-xl hover:bg-[#07519D] transition-colors"
                >
                  Continuar →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
