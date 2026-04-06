'use client'
/**
 * ResumenNarrativo — barra de chips que resume la búsqueda activa
 *
 * Se renderiza encima de la cuadrícula de resultados para dar feedback
 * visual de qué parámetros se usaron.
 * Retorna null si no hay nada seleccionado (sin montar elemento vacío).
 *
 * Colores por categoría semántica:
 *   azul navy  → sujeto, predicado, verbos, complementos
 *   rojo        → desastre, afectación
 *   amarillo    → tipo de fondo
 *   verde       → presupuesto
 */

import type { TipoFondo } from '@/types/database'
import { formatUSD } from '@/lib/utils'

export interface ResumenNarrativoData {
  sujetoNombre: string | null
  predicadoNombre: string | null
  verbosNombres: string[]
  complementosNombres: string[]
  tipoDesastre: string | null
  afectacion: string | null
  tipoFondo: TipoFondo | null
  presupuestoUSD: number | null
}

interface Props {
  datos: ResumenNarrativoData
  onEditar: () => void
}

type Color = 'navy' | 'red' | 'yellow' | 'green'

const COLOR_CLASSES: Record<Color, string> = {
  navy:   'bg-[#213362] text-white',
  red:    'bg-[#d80e25] text-white',
  yellow: 'bg-[#FFCD00] text-[#213362]',
  green:  'bg-emerald-700 text-white',
}

function Chip({ label, color }: { label: string; color: Color }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${COLOR_CLASSES[color]}`}>
      {label}
    </span>
  )
}

export function ResumenNarrativo({ datos, onEditar }: Props) {
  const {
    sujetoNombre, predicadoNombre, verbosNombres, complementosNombres,
    tipoDesastre, afectacion, tipoFondo, presupuestoUSD,
  } = datos

  const hayAlgo =
    sujetoNombre ||
    predicadoNombre ||
    verbosNombres.length > 0 ||
    complementosNombres.length > 0 ||
    tipoDesastre ||
    afectacion ||
    tipoFondo ||
    presupuestoUSD !== null

  if (!hayAlgo) return null

  return (
    <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-3 flex items-start gap-4 flex-wrap">
        {/* Label */}
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1 shrink-0 pt-0.5">
          Tu búsqueda:
        </p>

        {/* Chips */}
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {sujetoNombre && <Chip label={sujetoNombre} color="navy" />}
          {predicadoNombre && <Chip label={predicadoNombre} color="navy" />}
          {verbosNombres.map(v => <Chip key={v} label={v} color="navy" />)}
          {complementosNombres.map(c => <Chip key={c} label={c} color="navy" />)}
          {tipoDesastre && <Chip label={tipoDesastre} color="red" />}
          {afectacion && <Chip label={afectacion} color="red" />}
          {tipoFondo && <Chip label={tipoFondo} color="yellow" />}
          {presupuestoUSD !== null && (
            <Chip label={`≤ ${formatUSD(presupuestoUSD)}`} color="green" />
          )}
        </div>

        {/* Modificar */}
        <button
          onClick={onEditar}
          className="text-xs font-bold text-gray-400 hover:text-[#07519D] transition-colors
            shrink-0 pt-1 underline underline-offset-2"
        >
          Modificar
        </button>
      </div>
    </div>
  )
}
