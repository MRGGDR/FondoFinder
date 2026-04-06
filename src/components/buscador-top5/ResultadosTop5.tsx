'use client'

import Link from 'next/link'
import type { Top5Result } from '@/types/top5'

interface Props {
  resultados: Top5Result[]
  cargando: boolean
  error: string | null
  onRetry?: () => void
}

const BADGE_TIER: Record<string, string> = {
  alta:  'bg-[#a5f3c7] text-[#0f5132]',
  media: 'bg-[#fde68a] text-[#92400e]',
  baja:  'bg-gray-100 text-gray-600',
}

const TIER_LABEL: Record<string, string> = {
  alta:  'Alta',
  media: 'Media',
  baja:  'Estándar',
}

function buildFundCardSummary(r: Top5Result): string | null {
  const src = r.actividades_apoyadas || r.objetivos_fondo || r.publico_objetivo
  if (!src) return null
  return src.length > 160 ? src.slice(0, 160).replace(/\s\w+$/, '') + '…' : src
}

function formatFundAmount(r: Top5Result): string | null {
  if (r.monto_texto) return r.monto_texto
  if (r.monto_min_usd != null && r.monto_max_usd != null) {
    return `USD ${r.monto_min_usd.toLocaleString('es-CO')} – ${r.monto_max_usd.toLocaleString('es-CO')}`
  }
  if (r.monto_min_usd != null) return `Desde USD ${r.monto_min_usd.toLocaleString('es-CO')}`
  return null
}

function getVisibleMetaChips(r: Top5Result): string[] {
  return [
    r.tipo_fondo_categoria,
    r.acceso_modelo,
    r.estado_modelo,
    r.periodicidad_modelo,
  ].filter((v): v is string => Boolean(v) && v.trim().toUpperCase() !== 'N/A')
}

function MetaRow({ label, value, light }: { label: string; value: string | null; light?: boolean }) {
  if (!value || value.trim().toUpperCase() === 'N/A') return null
  const trimmed = value.length > 80 ? value.slice(0, 80).replace(/\s\w+$/, '') + '…' : value
  return (
    <div className="mb-3 last:mb-0">
      <p className={`text-[9px] font-black uppercase tracking-[0.15em] ${light ? 'text-white/40' : 'text-gray-400'}`}>{label}</p>
      <p className={`text-sm font-bold leading-snug ${light ? 'text-white' : 'text-[#213362]'}`}>{trimmed}</p>
    </div>
  )
}

export function ResultadosTop5({ resultados, cargando, error, onRetry }: Props) {
  if (cargando) {
    return (
      <div className="space-y-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-white rounded-3xl p-8 md:p-12 border-l-[10px] border-l-gray-200 shadow-[0_12px_40px_-28px_rgba(33,51,98,0.18)]">
            <div className="grid md:grid-cols-12 gap-8 md:gap-16 items-start">
              <div className="hidden md:flex md:col-span-1 flex-col items-center pt-2">
                <div className="w-12 h-12 bg-gray-100 rounded-lg" />
              </div>
              <div className="md:col-span-7 space-y-4">
                <div className="flex gap-3">
                  <div className="h-6 w-24 bg-gray-100 rounded-full" />
                  <div className="h-6 w-16 bg-gray-100 rounded-full" />
                </div>
                <div className="h-10 bg-gray-100 rounded-xl w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-4/5" />
              </div>
              <div className="md:col-span-4 bg-gray-100 rounded-[2rem] min-h-[200px]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-12 text-center">
        <p className="text-xl font-black text-red-700 mb-3">No pudimos completar la búsqueda.</p>
        <p className="text-sm text-red-600 mb-8">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-[#213362] text-white font-black px-10 py-4 rounded-2xl hover:bg-[#07519D] transition-colors"
          >
            Reintentar
          </button>
        )}
      </div>
    )
  }

  if (!resultados.length) {
    return (
      <div className="py-32 text-center">
        <p className="text-6xl font-black text-gray-100 mb-4">0</p>
        <p className="text-xl font-black text-[#213362] mb-2">Sin resultados</p>
        <p className="text-gray-400 mb-8">No encontramos fondos con estos criterios.</p>
      </div>
    )
  }

  return (
    <div>
      {resultados.map((r, idx) => {
        const borderColor = idx % 2 === 0 ? 'border-l-[#213362]' : 'border-l-[#FFCD00]'
        const panelBg = idx % 2 === 0 ? 'bg-[#eaeef3]' : 'bg-[#213362] text-white'
        const light = idx % 2 !== 0
        const summary = buildFundCardSummary(r)
        const monto = formatFundAmount(r)
        const chips = getVisibleMetaChips(r)

        return (
          <div
            key={r.fondo_id || idx}
            className={`bg-white rounded-3xl p-8 md:p-12 mb-12 last:mb-0
              shadow-[0_12px_40px_-28px_rgba(33,51,98,0.45)] border-l-[10px] ${borderColor}`}
          >
            <div className="grid md:grid-cols-12 gap-8 md:gap-16 items-start">

              {/* Número decorativo */}
              <div className="hidden md:flex md:col-span-1 flex-col items-center pt-2">
                <span className="text-6xl font-black text-[#FFCD00] leading-none">
                  {idx + 1}.
                </span>
                <div className="w-px h-24 bg-gray-100 mt-4" />
              </div>

              {/* Info del fondo */}
              <div className="md:col-span-7">
                {/* Badges */}
                <div className="flex items-center gap-3 mb-5 flex-wrap">
                  {r.mostrar_badge && (
                    <span className="px-4 py-1 rounded-full bg-[#FFCD00] text-[#213362] text-[10px] font-black uppercase tracking-[0.2em]">
                      En revisión
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${BADGE_TIER[r.tier_afinidad] ?? BADGE_TIER.baja}`}>
                    Afinidad {TIER_LABEL[r.tier_afinidad] ?? r.tier_afinidad}
                  </span>
                </div>

                {/* Nombre */}
                <h3 className="text-3xl md:text-4xl font-black text-[#213362] leading-tight mb-3">
                  {r.nombre_fondo}
                </h3>

                {/* Entidad */}
                {r.entidad_encargada && (
                  <p className="text-base text-gray-400 font-medium mb-3 leading-relaxed">
                    {r.entidad_encargada.length > 120
                      ? r.entidad_encargada.slice(0, 120) + '...'
                      : r.entidad_encargada}
                  </p>
                )}

                {/* Descripción funcional */}
                {summary && (
                  <p className="text-sm text-gray-500 leading-relaxed mb-5 line-clamp-2">
                    {summary}
                  </p>
                )}

                {/* Meta chips */}
                {chips.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {chips.map((chip, ci) => (
                      <span
                        key={ci}
                        className="bg-gray-50 text-gray-500 text-xs font-bold px-4 py-2 rounded-xl border border-gray-100 whitespace-nowrap"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Panel lateral */}
              <div className={`md:col-span-4 rounded-[2rem] p-8 md:p-10 flex flex-col justify-between min-h-[280px] md:min-h-[320px] ${panelBg}`}>
                <div className="flex-1">
                  <MetaRow label="Acceso"       value={r.acceso_modelo || r.como_acceder} light={light} />
                  <MetaRow label="Estado"       value={r.estado_modelo}                   light={light} />
                  <MetaRow label="Periodicidad" value={r.periodicidad_modelo}             light={light} />
                  <MetaRow label="Monto"        value={monto}                             light={light} />
                  {!r.acceso_modelo && !r.como_acceder && !r.estado_modelo && !r.periodicidad_modelo && !monto && (
                    <p className={`text-xs leading-relaxed ${light ? 'text-white/50' : 'text-gray-400'}`}>
                      Ver ficha completa para condiciones de acceso.
                    </p>
                  )}
                </div>
                <Link
                  href={`/fondo/${r.fondo_id}`}
                  className={`mt-8 w-full py-4 rounded-2xl font-black text-base text-center
                    hover:scale-[1.02] active:scale-95 transition-all shadow-xl block ${
                    idx % 2 === 0
                      ? 'bg-[#213362] text-white shadow-[#213362]/20'
                      : 'bg-white text-[#213362] hover:bg-[#FFCD00]'
                  }`}
                >
                  IR AL FONDO
                </Link>
              </div>

            </div>
          </div>
        )
      })}
    </div>
  )
}