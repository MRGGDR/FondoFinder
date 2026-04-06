'use client'
/**
 * EtapaContexto — tipo de desastre, afectación, tipo de fondo y presupuesto
 *
 * Esta etapa captura el contexto de la emergencia/necesidad:
 *   - tipo_desastre  → términos grupo "desastre" del catálogo
 *   - afectacion     → términos grupo "afectacion" del catálogo
 *   - tipo_fondo     → Nacional / Territorial / Internacional (libre, no del catálogo)
 *   - presupuesto    → número en USD (opcional)
 *
 * Al confirmar se ejecuta la búsqueda narrativa.
 */

import type { TerminoNarrativo, TipoFondo } from '@/types/database'

const TIPOS_FONDO: TipoFondo[] = ['Nacional', 'Territorial', 'Internacional']

interface Props {
  desastres: TerminoNarrativo[]
  afectaciones: TerminoNarrativo[]
  tipoDesastre: string | null
  afectacion: string | null
  tipoFondo: TipoFondo | null
  presupuestoUSD: number | null
  onTipoDesastre: (v: string | null) => void
  onAfectacion: (v: string | null) => void
  onTipoFondo: (v: TipoFondo | null) => void
  onPresupuesto: (v: number | null) => void
  onBuscar: () => void
  cargando: boolean
}

function ChipSelector({
  terminos,
  seleccionado,
  onSeleccionar,
}: {
  terminos: TerminoNarrativo[]
  seleccionado: string | null
  onSeleccionar: (v: string | null) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {terminos.map(t => {
        const activo = seleccionado === t.termino_canonico
        return (
          <button
            key={t.id}
            onClick={() => onSeleccionar(activo ? null : t.termino_canonico)}
            aria-pressed={activo}
            className={[
              'px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all',
              activo
                ? 'bg-[#d80e25] border-[#d80e25] text-white'
                : 'bg-white border-gray-200 text-[#213362] hover:border-[#d80e25] hover:bg-red-50',
            ].join(' ')}
          >
            {t.termino_canonico}
          </button>
        )
      })}
    </div>
  )
}

export function EtapaContexto({
  desastres, afectaciones,
  tipoDesastre, afectacion, tipoFondo, presupuestoUSD,
  onTipoDesastre, onAfectacion, onTipoFondo, onPresupuesto,
  onBuscar, cargando,
}: Props) {
  function handlePresupuesto(val: string) {
    const n = parseFloat(val)
    onPresupuesto(isNaN(n) || n <= 0 ? null : n)
  }

  return (
    <section className="bg-white py-24 border-b border-gray-100" aria-labelledby="etapa-contexto-titulo">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row gap-16 items-start">

          {/* Texto izquierda */}
          <div className="w-full md:w-1/3 shrink-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d80e25] mb-4">
              Paso 3 · Contexto
            </p>
            <h2 id="etapa-contexto-titulo" className="text-3xl font-black text-[#213362] leading-tight mb-4">
              ¿Cuál es la situación?
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Opcional. Afinar el contexto mejora la relevancia de los resultados.
              Puedes buscar sin completar estos campos.
            </p>
          </div>

          {/* Campos derecha */}
          <div className="flex-1 space-y-8">
            {/* Tipo de desastre */}
            {desastres.length > 0 && (
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-500 mb-2">
                  Tipo de evento / amenaza
                </p>
                <ChipSelector terminos={desastres} seleccionado={tipoDesastre} onSeleccionar={onTipoDesastre} />
              </div>
            )}

            {/* Afectación */}
            {afectaciones.length > 0 && (
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-500 mb-2">
                  Tipo de afectación
                </p>
                <ChipSelector terminos={afectaciones} seleccionado={afectacion} onSeleccionar={onAfectacion} />
              </div>
            )}

            {/* Tipo de fondo */}
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-500 mb-2">
                Alcance del fondo
              </p>
              <div className="flex gap-3">
                {TIPOS_FONDO.map(tf => {
                  const activo = tipoFondo === tf
                  return (
                    <button
                      key={tf}
                      onClick={() => onTipoFondo(activo ? null : tf)}
                      aria-pressed={activo}
                      className={[
                        'px-5 py-2 rounded-lg text-sm font-bold border-2 transition-all',
                        activo
                          ? 'bg-[#213362] border-[#213362] text-white'
                          : 'bg-white border-gray-200 text-[#213362] hover:border-[#213362] hover:bg-[#f0f4ff]',
                      ].join(' ')}
                    >
                      {tf}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Presupuesto */}
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-500 mb-2">
                Presupuesto disponible (USD, opcional)
              </p>
              <input
                type="number"
                min={0}
                step={1000}
                placeholder="ej. 500000"
                defaultValue={presupuestoUSD ?? ''}
                onChange={e => handlePresupuesto(e.target.value)}
                className="w-full max-w-xs border-2 border-gray-200 rounded-lg px-4 py-2 text-sm font-bold text-[#213362]
                  focus:outline-none focus:border-[#213362] transition-colors"
              />
            </div>

            {/* Botón buscar */}
            <button
              onClick={onBuscar}
              disabled={cargando}
              className="bg-[#FFCD00] text-[#213362] font-black px-10 py-4 rounded-xl text-base
                hover:bg-[#f0c000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                shadow-md"
            >
              {cargando ? 'Buscando...' : 'Buscar fondos →'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
