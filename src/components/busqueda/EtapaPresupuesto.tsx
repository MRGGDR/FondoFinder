'use client'

const OBJETIVOS: Array<{ id: number; nombre: string }> = [
  { id: 1, nombre: 'Conocimiento y análisis del riesgo' },
  { id: 2, nombre: 'Intervención y reducción del riesgo' },
  { id: 3, nombre: 'Participación y acción comunitaria' },
  { id: 4, nombre: 'Gobernanza y gestión institucional' },
  { id: 5, nombre: 'Preparación y respuesta ante emergencias' },
]

const COP_TO_USD = 4200

function formatearCOP(raw: string): string {
  const soloDigitos = raw.replace(/\D/g, '')
  if (!soloDigitos) return ''
  return soloDigitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

interface EtapaPresupuestoProps {
  presupuestoCOP: string
  onCambiar: (val: string) => void
  objetivoIds: number[]
  onCambiarObjetivos: (ids: number[]) => void
  onBuscar: () => void
}

export function EtapaPresupuesto({
  presupuestoCOP,
  onCambiar,
  objetivoIds,
  onCambiarObjetivos,
  onBuscar,
}: EtapaPresupuestoProps) {
  const valorNumerico = presupuestoCOP ? parseFloat(presupuestoCOP.replace(/\./g, '')) : 0
  const valorUSD = valorNumerico > 0 ? (valorNumerico / COP_TO_USD).toFixed(2) : '0.00'

  function handleInputCOP(e: React.ChangeEvent<HTMLInputElement>) {
    onCambiar(formatearCOP(e.target.value))
  }

  function toggleObjetivo(id: number) {
    if (objetivoIds.includes(id)) {
      onCambiarObjetivos(objetivoIds.filter(x => x !== id))
    } else {
      onCambiarObjetivos([...objetivoIds, id])
    }
  }

  return (
    <section className="bg-[#213362] text-white py-32 relative overflow-hidden"
      aria-labelledby="etapa-presupuesto-titulo">

      <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid md:grid-cols-2 gap-24 items-center">

          {/* Izquierda — input presupuesto */}
          <div>
            <span className="text-6xl font-black text-[#FFCD00] block mb-4">03</span>
            <h2 id="etapa-presupuesto-titulo" className="text-5xl font-black mb-8">
              Ajusta tu{' '}
              <br />
              <span className="text-[#FFCD00]">Presupuesto</span>
            </h2>
            <p className="text-xl text-white/60 mb-12 leading-relaxed">
              El sistema recalculará automáticamente los fondos
              que se ajustan a tus necesidades de inversión.
            </p>

            <div className="space-y-6">
              <div className="bg-white/10 p-8 rounded-3xl border border-white/20">
                <label htmlFor="monto-cop"
                  className="text-xs font-black uppercase tracking-widest
                    text-white/40 mb-4 block">
                  Monto Disponible (COP)
                </label>
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-light text-white/30">$</span>
                  <input
                    id="monto-cop"
                    type="text"
                    inputMode="numeric"
                    value={presupuestoCOP}
                    onChange={handleInputCOP}
                    placeholder="Ingresa valor"
                    className="bg-transparent border-none text-4xl font-black
                      focus:outline-none p-0 w-full placeholder:text-white/10
                      text-white input-cop"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center px-4">
                <span className="text-sm font-bold text-white/40 uppercase">
                  Equivalente Aproximado:
                </span>
                <span className="text-2xl font-black text-[#FFCD00]">
                  USD {valorUSD}
                </span>
              </div>
            </div>
          </div>

          {/* Derecha — objetivos PNGRD + botón */}
          <div className="bg-white/5 rounded-[3rem] p-12 backdrop-blur-xl
            border border-white/10">
            <h3 className="text-2xl font-black mb-8">Objetivos PNGRD</h3>
            <div className="space-y-4">
              {OBJETIVOS.map(({ id, nombre }) => (
                <label key={id}
                  className="flex items-center gap-6 p-6 rounded-2xl bg-white/5
                    hover:bg-white/10 cursor-pointer transition-all border
                    border-transparent hover:border-white/20">
                  <input
                    type="checkbox"
                    checked={objetivoIds.includes(id)}
                    onChange={() => toggleObjetivo(id)}
                    className="w-6 h-6 rounded-xl accent-[#FFCD00] cursor-pointer flex-shrink-0"
                  />
                  <span className="font-black">{nombre}</span>
                </label>
              ))}
            </div>
            <button
              onClick={onBuscar}
              className="w-full mt-10 py-5 bg-[#FFCD00] text-[#213362]
                rounded-2xl font-black text-lg shadow-2xl shadow-[#FFCD00]/20
                hover:brightness-110 transition-all uppercase tracking-wide"
            >
              Encontrar fondos →
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

