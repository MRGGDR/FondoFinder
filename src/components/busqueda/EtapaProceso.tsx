'use client'

const PROCESOS: Array<{ id: number; nombre: string; desc: string; emoji: string }> = [
  { id: 1, nombre: 'Conocimiento del Riesgo',   desc: 'Estudios, mapas, sistemas de alerta temprana',  emoji: '🔍' },
  { id: 2, nombre: 'Reducción del Riesgo',       desc: 'Obras, planes, reasentamientos preventivos',    emoji: '🛡️' },
  { id: 3, nombre: 'Manejo – Respuesta',         desc: 'Atención inmediata a emergencias y desastres',  emoji: '🚨' },
  { id: 4, nombre: 'Manejo – Recuperación',      desc: 'Rehabilitación, reconstrucción post-desastre',  emoji: '🔄' },
]

interface EtapaProcesoProps {
  seleccionados: number[]
  onCambiar: (ids: number[]) => void
  onContinuar: () => void
}

export function EtapaProceso({ seleccionados, onCambiar, onContinuar }: EtapaProcesoProps) {
  function toggleProceso(id: number) {
    if (seleccionados.includes(id)) {
      onCambiar(seleccionados.filter(x => x !== id))
    } else {
      onCambiar([...seleccionados, id])
    }
  }

  return (
    <section className="bg-[#f0f4f9] py-32 border-y border-gray-200"
      aria-labelledby="etapa-proceso-titulo">
      <div className="max-w-6xl mx-auto px-6 md:px-12">

        {/* Encabezado centrado */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-6xl font-black text-[#FFCD00] block mb-2">02</span>
          <h2 id="etapa-proceso-titulo" className="text-4xl font-black text-[#213362] mb-6">
            Enfoque del Proyecto
          </h2>
          <p className="text-gray-500 font-medium leading-relaxed">
            ¿En qué etapa de la gestión del riesgo se encuentra tu necesidad?
            Selecciona uno o varios.
          </p>
        </div>

        {/* Grid 2x2 con peer-checked */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8"
          role="group" aria-label="Proceso de gestión del riesgo">
          {PROCESOS.map(({ id, nombre, desc, emoji }) => (
            <label key={id} className="relative group cursor-pointer">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={seleccionados.includes(id)}
                onChange={() => toggleProceso(id)}
              />
              <div className="h-full bg-white rounded-[2rem] p-10 border-2
                border-transparent peer-checked:border-[#213362]
                peer-checked:bg-[#213362]/5 transition-all
                group-hover:shadow-xl group-hover:border-gray-200">
                <div className="text-3xl mb-6">{emoji}</div>
                <h4 className="text-xl font-black text-[#213362] mb-3">{nombre}</h4>
                <p className="text-sm text-gray-500 font-medium">{desc}</p>
              </div>
              {/* Check mark visible cuando está seleccionado */}
              <span className="absolute -top-3 -right-3 bg-[#213362] text-white
                p-2 rounded-full shadow-lg hidden peer-checked:flex
                items-center justify-center w-8 h-8 text-sm font-black">
                ✓
              </span>
            </label>
          ))}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={onContinuar}
            className="bg-[#213362] text-white px-16 py-5 rounded-2xl
              font-black text-lg hover:scale-[1.02] transition-all"
          >
            Continuar →
          </button>
        </div>
      </div>
    </section>
  )
}

