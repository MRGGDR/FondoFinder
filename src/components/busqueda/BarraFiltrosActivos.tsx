'use client'

interface Chip {
  label: string
  onRemove: () => void
}

interface BarraFiltrosActivosProps {
  visible: boolean
  chips: Chip[]
  total: number
  onResetAll: () => void
}

export function BarraFiltrosActivos({ visible, chips, total, onResetAll }: BarraFiltrosActivosProps) {
  if (!visible || chips.length === 0) return null

  return (
    <div
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 w-auto
        bg-[#213362]/90 backdrop-blur-xl px-8 py-4 rounded-full
        border border-white/20 shadow-2xl hidden md:flex items-center gap-8"
      role="region"
      aria-label="Filtros activos"
    >
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest whitespace-nowrap">
          Filtros activos
        </span>
        <div className="flex gap-2 flex-wrap">
          {chips.map((chip, i) => (
            <span
              key={i}
              className="bg-white/10 text-white text-[10px] font-bold
                px-3 py-1 rounded-full border border-white/10 flex items-center gap-2
                whitespace-nowrap"
            >
              {chip.label}
              <button
                onClick={chip.onRemove}
                className="hover:text-red-400 transition-colors leading-none"
                aria-label={`Eliminar filtro ${chip.label}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="h-6 w-px bg-white/20 shrink-0" />

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-white font-black text-lg">{total}</span>
        <span className="text-[10px] font-bold text-white/40 uppercase whitespace-nowrap">
          Resultados
        </span>
      </div>

      <button
        onClick={onResetAll}
        className="bg-[#FFCD00] text-[#213362] w-9 h-9 rounded-full
          flex items-center justify-center font-black text-lg
          hover:rotate-180 transition-transform duration-500 shrink-0"
        aria-label="Limpiar todos los filtros"
      >
        ↺
      </button>
    </div>
  )
}
