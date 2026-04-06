'use client'
/**
 * EtapaResultadosNarrativa — muestra resultados de buscar_fondos_narrativo_v2
 *
 * Características:
 *   - Barra de resumen narrativo sticky (ResumenNarrativo) arriba del grid
 *   - Tarjetas con nombre, tipo, entidad, monto, tags_visibles
 *   - Botones interactivos para abrir PanelLateral con instructivo o modelo
 *   - Indicador de score_total como barra de relevancia
 *   - Link a /fondo/[id] para el detalle completo
 *   - Estado vacío y de carga con skeletons
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PanelLateral } from '@/components/ui/PanelLateral'
import { ResumenNarrativo } from '@/components/busqueda/ResumenNarrativo'
import { formatUSD } from '@/lib/utils'
import type { ResultadoBusquedaNarrativa, FondoInstructivo, FondoModeloAplicacion } from '@/types/database'
import type { ResumenNarrativoData } from '@/components/busqueda/ResumenNarrativo'

// Re-export so FlujoBuscadorNarrativo can import both from one place
export type { ResumenNarrativoData }

interface PanelState {
  tipo: 'instructivo' | 'modelo'
  fondoId: string
  fondoNombre: string
}

interface Props {
  resultados: ResultadoBusquedaNarrativa[]
  total: number
  cargando: boolean
  error: string | null
  onNuevaBusqueda: () => void
  resumen?: ResumenNarrativoData | null
  onEditar?: () => void
  hayMas?: boolean
  onCargarMas?: () => void
  /** true si el usuario seleccionó un "Territorio de interés" en esta búsqueda */
  hayTerritorioConsulta?: boolean
}

// ─── Sub-componentes de contenido del panel ──────────────────────────────────

/** Renderiza un ítem de checklist (texto plano o array de strings en JSON) */
function ChecklistItem({ texto }: { texto: string }) {
  return (
    <li className="flex items-start gap-2 text-sm text-gray-600">
      <span className="text-green-600 mt-0.5 shrink-0">✓</span>
      {texto}
    </li>
  )
}

/** Sección colapsable dentro del panel */
function SeccionPanel({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{titulo}</h3>
      <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
    </div>
  )
}

/** Carga y muestra el instructivo del fondo */
function ContenidoInstructivo({ fondoId }: { fondoId: string }) {
  const [datos, setDatos] = useState<FondoInstructivo | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError(null)
    fetch(`/api/fondos/${encodeURIComponent(fondoId)}/instructivo`)
      .then(r => r.json())
      .then(d => {
        if (!activo) return
        if (d.error) setError(d.error)
        else setDatos(d as FondoInstructivo)
      })
      .catch(() => { if (activo) setError('Error de red al cargar el instructivo') })
      .finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [fondoId])

  if (cargando) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-4 bg-gray-100 rounded" />)}
      </div>
    )
  }
  if (error || !datos) {
    return <p className="text-sm text-gray-400 italic py-8 text-center">{error ?? 'Sin instructivo'}</p>
  }

  return (
    <div>
      {datos.descripcion && (
        <SeccionPanel titulo="Descripción">
          <p>{datos.descripcion}</p>
        </SeccionPanel>
      )}
      {datos.elegibilidad_organizacion && (
        <SeccionPanel titulo="Elegibilidad de la organización">
          <p>{datos.elegibilidad_organizacion}</p>
        </SeccionPanel>
      )}
      {datos.elegibilidad_proyecto && (
        <SeccionPanel titulo="Elegibilidad del proyecto">
          <p>{datos.elegibilidad_proyecto}</p>
        </SeccionPanel>
      )}
      {datos.financiamiento && (
        <SeccionPanel titulo="Financiamiento">
          <p>{datos.financiamiento}</p>
        </SeccionPanel>
      )}
      {datos.proceso_formulacion && (
        <SeccionPanel titulo="Proceso de formulación">
          <p>{datos.proceso_formulacion}</p>
        </SeccionPanel>
      )}
      {datos.otros_requerimientos && (
        <SeccionPanel titulo="Otros requerimientos">
          <p>{datos.otros_requerimientos}</p>
        </SeccionPanel>
      )}
      {Array.isArray(datos.checklist_documentos) && datos.checklist_documentos.length > 0 && (
        <SeccionPanel titulo="Documentos requeridos">
          <ul className="space-y-2 mt-1">
            {(datos.checklist_documentos as string[]).map((doc, i) => (
              <ChecklistItem key={i} texto={doc} />
            ))}
          </ul>
        </SeccionPanel>
      )}
      {datos.fechas_clave && (
        <SeccionPanel titulo="Fechas clave">
          <p>{datos.fechas_clave}</p>
        </SeccionPanel>
      )}
      {datos.contactos_clave && (
        <SeccionPanel titulo="Contactos">
          <p>{datos.contactos_clave}</p>
        </SeccionPanel>
      )}
      {datos.marco_normativo && (
        <SeccionPanel titulo="Marco normativo">
          <p>{datos.marco_normativo}</p>
        </SeccionPanel>
      )}
    </div>
  )
}

/** Carga y muestra los modelos de aplicación del fondo */
function ContenidoModelo({ fondoId }: { fondoId: string }) {
  const [modelos, setModelos] = useState<FondoModeloAplicacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError(null)
    fetch(`/api/fondos/${encodeURIComponent(fondoId)}/modelo-aplicacion`)
      .then(r => r.json())
      .then(d => {
        if (!activo) return
        if (d.error) setError(d.error)
        else setModelos((d.modelos ?? []) as FondoModeloAplicacion[])
      })
      .catch(() => { if (activo) setError('Error de red al cargar el modelo') })
      .finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [fondoId])

  if (cargando) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2].map(i => <div key={i} className="h-4 bg-gray-100 rounded" />)}
      </div>
    )
  }
  if (error || modelos.length === 0) {
    return <p className="text-sm text-gray-400 italic py-8 text-center">{error ?? 'Sin modelos registrados'}</p>
  }

  return (
    <div className="space-y-6">
      {modelos.map((m, i) => (
        <div key={m.id ?? i} className="border border-gray-100 rounded-xl p-4">
          <p className="font-black text-[#213362] text-sm mb-2">{m.modelo_aplicacion}</p>
          {m.descripcion && <p className="text-sm text-gray-600 mb-2">{m.descripcion}</p>}
          {m.acceso && (
            <div className="mt-2">
              <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Cómo acceder</p>
              <p className="text-sm text-gray-600">{m.acceso}</p>
            </div>
          )}
          {m.estado_convocatoria && (
            <span className="inline-block mt-3 text-[10px] font-bold bg-[#f0f4ff] text-[#07519D] px-3 py-1 rounded-full">
              {m.estado_convocatoria}
            </span>
          )}
          {m.fechas_convocatoria && (
            <p className="text-xs text-gray-400 mt-2">Fechas: {m.fechas_convocatoria}</p>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Helpers visuales ─────────────────────────────────────────────────────────

/** Barra visual de relevancia relativa.
 * maxScore = score más alto del conjunto actual de resultados.
 * Así la barra muestra qué tan relevante es este fondo RESPECTO al mejor resultado,
 * en lugar de contra un tope fijo que inflaba casi todo al 100%.
 */
function BarraScore({ score, maxScore }: { score: number; maxScore: number }) {
  if (maxScore <= 0 || score <= 0) return null
  const pct = Math.min(100, Math.round((score / maxScore) * 100))
  if (pct === 0) return null

  // Color semafórico según posición relativa
  const barColor =
    pct >= 80 ? 'bg-[#FFCD00]'    // alta relevancia
    : pct >= 50 ? 'bg-[#00AEE3]'  // media
    : 'bg-gray-300'               // baja

  const label =
    pct === 100 ? 'Mejor coincidencia'
    : pct >= 80  ? 'Alta relevancia'
    : pct >= 50  ? 'Relevancia media'
    : 'Relevancia baja'

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-bold text-gray-400">{label}</span>
    </div>
  )
}

// ─── Explicabilidad del ranking ───────────────────────────────────────────────
// 100% client-side. Reutiliza datos ya presentes en ResultadoBusquedaNarrativa
// + ResumenNarrativoData. Sin llamadas extra al backend.

interface ContextoConsulta {
  resumen: ResumenNarrativoData
  hayTerritorioConsulta: boolean
}

interface DebugRanking {
  score_total: number
  score_texto: number
  score_sujeto: number
  score_predicado: number
  score_terminos: number
  score_instructivo: number
  /** Reconstruido deterministamente con la misma lógica que el SQL */
  score_sector_op_reconstruido: number
  /** score_contexto + score_proceso_aportes: no expuestos individualmente por el RPC */
  score_residual_ctx_proceso: number
  /** Calculado en backend desde fondos_cobertura_territorial */
  score_territorial_bonus: number
  /** municipio_consulta_id si está activo / ninguno */
  territorio_activo: string
}

// Keywords que identifican orientación a conocimiento/innovación/monitoreo
// Derivadas de las opciones de verbo/complemento del catálogo narrativo
const KW_CONOCIMIENTO = [
  'conocimiento', 'monitoreo', 'diagnóstico', 'diagnóstico del riesgo', 'innovar',
  'investigar', 'sensores', 'sig', 'sistemas de información', 'capacitar',
  'fortalecimiento', 'capacidad institucional', 'tecnología', 'ciencia',
  'innovación', 'datos', 'cartografía', 'modelación', 'investigación',
]

/** true si algún verbo o complemento seleccionado apunta a conocimiento/innovación */
function esConsultaConocimiento(resumen: ResumenNarrativoData): boolean {
  const haystack = [
    ...resumen.verbosNombres,
    ...resumen.complementosNombres,
    resumen.predicadoNombre ?? '',
  ].map(s => s.toLowerCase()).join(' ')
  return KW_CONOCIMIENTO.some(kw => haystack.includes(kw))
}

/** Reconstruye score_sector_operacional deterministamente (misma lógica que la función SQL v5) */
function calcSectorOp(afectacion: string | null, tipoFondo: string): number {
  if (!afectacion) return 0
  const sectorial = [
    'Infraestructura y transporte', 'Agua y saneamiento', 'Vivienda y hábitat',
    'Agricultura y medios de vida', 'Salud y bienestar social',
  ]
  if (sectorial.includes(afectacion) && (tipoFondo === 'Nacional' || tipoFondo === 'Territorial')) return 0.20
  if (afectacion === 'Ecosistemas y ambiente' && tipoFondo === 'Internacional') return 0.20
  return 0
}

/**
 * Construye razones legibles desde señales REALES del ranking.
 * Cada razón requiere score > 0 o condición verificable.
 * - No se genera razón territorial si score_territorial_bonus == 0
 * - No se mezclan señales inventadas con el resultado real
 */
function buildExplicacion(
  fondo: ResultadoBusquedaNarrativa,
  resumen: ResumenNarrativoData,
  hayTerritorioConsulta: boolean,
): { razones: string[]; debug: DebugRanking } {
  const razones: string[] = []
  const sectorOp     = calcSectorOp(resumen.afectacion, fondo.tipo_fondo_categoria)
  const bonusT       = fondo.score_territorial_bonus ?? 0
  const esConocim    = esConsultaConocimiento(resumen)

  if (fondo.score_sujeto > 0 && resumen.sujetoNombre) {
    razones.push(`Apto para ${resumen.sujetoNombre}`)
  }
  if (fondo.score_predicado > 0 && resumen.predicadoNombre) {
    razones.push(`Apoya "${resumen.predicadoNombre.toLowerCase()}"`)
  }
  if (fondo.score_terminos > 0) {
    const etiquetas = [
      ...resumen.verbosNombres.slice(0, 2),
      ...resumen.complementosNombres.slice(0, 1),
    ]
    if (esConocim) {
      razones.push(
        etiquetas.length > 0
          ? `Alineado con áreas de ${etiquetas.join(', ')}`
          : 'Coincide con acciones de conocimiento o innovación',
      )
    } else {
      razones.push(
        etiquetas.length > 0
          ? `Coincide con: ${etiquetas.join(', ')}`
          : 'Coincide con las acciones o áreas indicadas',
      )
    }
  }
  if (fondo.score_texto > 0) {
    if (esConocim && (resumen.verbosNombres.length > 0 || resumen.complementosNombres.length > 0)) {
      // El texto FTS incluye expansión semántica de términos de conocimiento/innovación
      razones.push('Relevante por términos de conocimiento o tecnología en su descripción')
    } else if (resumen.tipoDesastre || resumen.afectacion) {
      const ctx = [resumen.tipoDesastre, resumen.afectacion].filter(Boolean).join(' / ')
      razones.push(`Relevante para: ${ctx}`)
    } else {
      razones.push('Alta similitud con la descripción de la consulta')
    }
  }
  if (sectorOp > 0) {
    razones.push(
      `Tipo de fondo (${fondo.tipo_fondo_categoria}) adecuado para la afectación consultada`,
    )
  }
  if (fondo.score_instructivo > 0) {
    razones.push('Cuenta con guía de acceso detallada')
  }
  // Territorial: solo si hubo un bonus REAL calculado en el backend
  if (bonusT > 0) {
    razones.push('Compatible con el territorio de interés consultado')
  } else if (bonusT < 0) {
    razones.push('Nota: cobertura regional limitada para este territorio')
  } else if (hayTerritorioConsulta) {
    // Se seleccionó territorio pero el fondo no tiene cobertura registrada → neutro
    razones.push('Sin restricción territorial registrada (aplica abiertamente)')
  }
  if (razones.length === 0) {
    razones.push('Mayor relevancia compuesta para esta consulta')
  }

  const residual = Math.max(
    0,
    fondo.score_total
      - fondo.score_texto
      - fondo.score_terminos
      - fondo.score_instructivo
      - fondo.score_sujeto
      - fondo.score_predicado
      - sectorOp,
  )

  return {
    razones,
    debug: {
      score_total:                fondo.score_total,
      score_texto:                fondo.score_texto,
      score_sujeto:               fondo.score_sujeto,
      score_predicado:            fondo.score_predicado,
      score_terminos:             fondo.score_terminos,
      score_instructivo:          fondo.score_instructivo,
      score_sector_op_reconstruido: sectorOp,
      score_residual_ctx_proceso: residual,
      score_territorial_bonus:    bonusT,
      territorio_activo:          hayTerritorioConsulta ? 'municipio_consulta_id' : 'ninguno',
    },
  }
}

/** Bloque expandible "¿Por qué apareció?" — montado únicamente en la mejor coincidencia */
function PorQueAparecio({
  fondo, resumen, hayTerritorioConsulta, modoDebug,
}: {
  fondo: ResultadoBusquedaNarrativa
  resumen: ResumenNarrativoData
  hayTerritorioConsulta: boolean
  modoDebug: boolean
}) {
  const [abierto, setAbierto] = useState(false)
  const { razones, debug } = buildExplicacion(fondo, resumen, hayTerritorioConsulta)

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setAbierto(p => !p)}
        aria-expanded={abierto}
        className="text-[10px] font-bold text-[#07519D] hover:text-[#213362] transition-colors
          inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-[#FFCD00] rounded"
      >
        <span className="text-[8px]">{abierto ? '▲' : '▼'}</span>
        {abierto ? 'Ocultar razones' : '¿Por qué apareció?'}
      </button>

      {abierto && (
        <div className="mt-2 bg-[#f0f4ff] border border-[#d0dcf0] rounded-lg p-3">
          {/* Razones en lenguaje humano */}
          <ul className="space-y-1.5">
            {razones.map((r, i) => (
              <li key={i} className="text-xs text-[#213362] flex items-start gap-1.5 leading-snug">
                <span className="text-[#07519D] shrink-0 mt-0.5 select-none">·</span>
                {r}
              </li>
            ))}
          </ul>

          {/* Tabla técnica — solo cuando ?debug=1 */}
          {modoDebug && (
            <div className="mt-3 pt-3 border-t border-[#c0cce8]">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#7a8fb5] mb-2">
                debug · ?debug=1
              </p>
              <table className="w-full text-[10px] font-mono border-collapse">
                <tbody>
                  {(Object.entries(debug) as [string, string | number][]).map(([k, v]) => (
                    <tr key={k} className="align-top">
                      <td className="pr-3 text-[#7a8fb5] py-0.5 whitespace-nowrap">{k}</td>
                      <td className="text-[#213362] font-bold">
                        {typeof v === 'number' ? v.toFixed(4) : v}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tarjeta ──────────────────────────────────────────────────────────────────

const BADGE_TIPO: Record<string, string> = {
  Nacional: 'bg-[#213362] text-white',
  Territorial: 'bg-[#07519D] text-white',
  Internacional: 'bg-[#223a7a] text-white',
}

function TarjetaResultadoNarrativo({
  fondo,
  index,
  maxScore,
  esMejorCoincidencia = false,
  contexto,
  modoDebug = false,
  onAbrirInstructivo,
  onAbrirModelo,
}: {
  fondo: ResultadoBusquedaNarrativa
  index: number
  maxScore: number
  esMejorCoincidencia?: boolean
  contexto?: ContextoConsulta
  modoDebug?: boolean
  onAbrirInstructivo: () => void
  onAbrirModelo: () => void
}) {
  const montoDisplay =
    fondo.monto_min_usd && fondo.monto_max_usd
      ? `USD ${formatUSD(fondo.monto_min_usd)} – ${formatUSD(fondo.monto_max_usd)}`
      : fondo.monto_min_usd
      ? `Desde USD ${formatUSD(fondo.monto_min_usd)}`
      : fondo.monto_texto && fondo.monto_texto.length < 120
      ? fondo.monto_texto
      : 'Variable, caso a caso'
  const montoLargo = montoDisplay.length > 28

  return (
    <article
      className={[
        'bg-white rounded-3xl p-8 md:p-12 mb-12 last:mb-0',
        'shadow-[0_12px_40px_-28px_rgba(33,51,98,0.45)]',
        'border-l-[10px]',
        index % 2 === 0 ? 'border-l-[#213362]' : 'border-l-[#FFCD00]',
      ].join(' ')}
    >
      <div className="grid md:grid-cols-12 gap-8 md:gap-16 items-start">

        {/* Número decorativo */}
        <div className="hidden md:flex md:col-span-1 flex-col items-center pt-2">
          <span className="text-6xl font-black text-[#FFCD00] leading-none">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="w-px h-24 bg-gray-100 mt-4" />
        </div>

        {/* Info del fondo */}
        <div className="md:col-span-7">
          {/* Badges */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            {esMejorCoincidencia && (
              <span className="px-4 py-1 rounded-full bg-[#FFCD00] text-[#213362] text-[10px] font-black uppercase tracking-[0.2em]">
                Mejor coincidencia
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
              BADGE_TIPO[fondo.tipo_fondo_categoria] ?? 'bg-gray-200 text-gray-600'
            }`}>
              {fondo.tipo_fondo_categoria}
            </span>
          </div>

          {/* Nombre */}
          <h3 className="text-3xl md:text-4xl font-black text-[#213362] leading-tight mb-5">
            {fondo.nombre}
          </h3>

          {/* Entidad */}
          {fondo.entidad_encargada && (
            <p className="text-lg text-gray-400 font-medium mb-6 leading-relaxed">
              {fondo.entidad_encargada.length > 200
                ? fondo.entidad_encargada.slice(0, 200) + '...'
                : fondo.entidad_encargada}
            </p>
          )}

          {/* Público objetivo */}
          {fondo.publico_objetivo && (
            <p className="text-sm text-gray-500 mb-5 leading-relaxed line-clamp-3">
              {fondo.publico_objetivo}
            </p>
          )}

          {/* Tags visibles */}
          {fondo.tags_visibles?.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {fondo.tags_visibles.slice(0, 5).map(tag => (
                <span
                  key={tag}
                  className="bg-gray-50 text-gray-500 text-xs font-bold px-4 py-2 rounded-xl border border-gray-100"
                >
                  {tag}
                </span>
              ))}
              {fondo.tags_visibles.length > 5 && (
                <span className="text-xs text-gray-400 self-center">+{fondo.tags_visibles.length - 5}</span>
              )}
            </div>
          )}

          {/* Barra de relevancia */}
          <BarraScore score={fondo.score_total} maxScore={maxScore} />

          {/* ¿Por qué apareció? — solo en la mejor coincidencia */}
          {esMejorCoincidencia && contexto && (
            <PorQueAparecio
              fondo={fondo}
              resumen={contexto.resumen}
              hayTerritorioConsulta={contexto.hayTerritorioConsulta}
              modoDebug={modoDebug}
            />
          )}

          {/* Botones instructivo / modelo */}
          {(fondo.tiene_instructivo || fondo.tiene_modelo_aplicacion) && (
            <div className="flex flex-wrap gap-3 mt-5">
              {fondo.tiene_instructivo && (
                <button
                  onClick={onAbrirInstructivo}
                  className="text-xs font-bold bg-green-50 text-green-700 border border-green-200
                    px-4 py-2 rounded-xl hover:bg-green-100 transition-colors"
                >
                  Ver instructivo
                </button>
              )}
              {fondo.tiene_modelo_aplicacion && (
                <button
                  onClick={onAbrirModelo}
                  className="text-xs font-bold bg-[#f0f4ff] text-[#07519D] border border-[#d0dcf0]
                    px-4 py-2 rounded-xl hover:bg-[#e4ecff] transition-colors"
                >
                  Modelo de aplicación
                </button>
              )}
            </div>
          )}
        </div>

        {/* Panel de monto + CTA */}
        <div className={`md:col-span-4 rounded-[2rem] p-8 md:p-10 flex flex-col justify-between min-h-[280px] md:min-h-[340px] ${
          index % 2 === 0
            ? 'bg-[#eaeef3]'
            : 'bg-[#213362] text-white'
        }`}>
          <div>
            <p className={`text-xs font-black uppercase tracking-[0.2em] mb-4 ${
              index % 2 === 0 ? 'text-gray-400' : 'text-white/40'
            }`}>
              Inversión disponible
            </p>
            <p className={`font-black tracking-tight leading-snug break-words ${
              montoLargo ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'
            } ${index % 2 === 0 ? 'text-[#213362]' : 'text-[#FFCD00]'}`}>
              {montoDisplay}
            </p>
          </div>
          <Link
            href={`/fondo/${fondo.id}`}
            className={`mt-8 w-full py-4 rounded-2xl font-black text-base text-center
              hover:scale-[1.02] active:scale-95 transition-all shadow-xl block ${
              index % 2 === 0
                ? 'bg-[#213362] text-white shadow-[#213362]/20'
                : 'bg-white text-[#213362] hover:bg-[#FFCD00]'
            }`}
          >
            CONOCER MÁS
          </Link>
        </div>

      </div>
    </article>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function EtapaResultadosNarrativa({
  resultados, total, cargando, error, onNuevaBusqueda,
  resumen, onEditar,
  hayMas, onCargarMas,
  hayTerritorioConsulta = false,
}: Props) {
  const [panel, setPanel] = useState<PanelState | null>(null)
  // Activar modo diagnóstico técnico con ?debug=1 en la URL — sin roles ni admin.
  // Muestra sub-scores y señales reconstruidas solo en la mejor coincidencia.
  const [modoDebug] = useState(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1'
  )

  return (
    <>
      {/* Barra de resumen pegajosa */}
      {resumen && onEditar && (
        <ResumenNarrativo datos={resumen} onEditar={onEditar} />
      )}

      <section className="bg-[#f6fafe] min-h-[50vh] py-16" aria-labelledby="resultados-narrativa-titulo">

        {/* Header */}
        <div className="max-w-6xl mx-auto px-6 md:px-12 mb-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 id="resultados-narrativa-titulo" className="text-3xl font-black text-[#213362]">
              {cargando ? 'Buscando fondos...' : `${total} resultado${total !== 1 ? 's' : ''}`}
            </h2>
            {!cargando && total > 0 && (
              <p className="text-gray-400 text-sm mt-1">Ordenados por relevancia narrativa</p>
            )}
          </div>
          <button
            onClick={onNuevaBusqueda}
            className="text-xs font-bold text-[#07519D] underline underline-offset-2 hover:text-[#213362] transition-colors"
          >
            ← Nueva búsqueda
          </button>
        </div>

        {/* Error */}
        {error && !cargando && (
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-sm font-bold text-red-700 mb-3">Error al buscar: {error}</p>
              <button onClick={onNuevaBusqueda} className="text-xs font-bold text-red-600 underline">
                Intentar de nuevo
              </button>
            </div>
          </div>
        )}

        {/* Skeletons — solo en carga inicial (sin resultados previos) */}
        {cargando && resultados.length === 0 && (
          <div className="max-w-6xl mx-auto px-6 md:px-12 space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-3xl p-8 md:p-12 shadow-[0_12px_40px_-28px_rgba(33,51,98,0.18)] border-l-[10px] border-l-gray-200">
                <div className="grid md:grid-cols-12 gap-8 md:gap-16 items-start">
                  <div className="hidden md:flex md:col-span-1 flex-col items-center pt-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg" />
                  </div>
                  <div className="md:col-span-7 space-y-4">
                    <div className="flex gap-3">
                      <div className="h-6 w-24 bg-gray-100 rounded-full" />
                      <div className="h-6 w-20 bg-gray-100 rounded-full" />
                    </div>
                    <div className="h-10 bg-gray-100 rounded-xl w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-full" />
                    <div className="h-4 bg-gray-100 rounded w-4/5" />
                    <div className="flex gap-2">
                      <div className="h-8 w-24 bg-gray-100 rounded-xl" />
                      <div className="h-8 w-24 bg-gray-100 rounded-xl" />
                    </div>
                  </div>
                  <div className="md:col-span-4 bg-gray-100 rounded-[2rem] min-h-[200px]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {!cargando && !error && total === 0 && resultados.length === 0 && (
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-20 text-center">
            <p className="text-6xl font-black text-gray-100 mb-4">0</p>
            <p className="text-gray-400 text-lg font-bold mb-2">No encontramos fondos con esos criterios</p>
            <p className="text-gray-400 text-sm mb-8">Intenta ampliar la búsqueda o eliminar algunos filtros.</p>
            <button
              onClick={onNuevaBusqueda}
              className="bg-[#213362] text-white font-black px-8 py-3 rounded-xl hover:bg-[#07519D] transition-colors"
            >
              Nueva búsqueda
            </button>
          </div>
        )}

        {/* Grid de resultados */}
        {resultados.length > 0 && (() => {
          // Normalización relativa: el mejor resultado del conjunto es la referencia.
          // Evita que todos muestren "100%" cuando score_sujeto y score_predicado
          // inflaban uniformemente todos los resultados filtrados.
          const maxScore = Math.max(...resultados.map(r => r.score_total), 0.001)
          return (
            <div className="max-w-6xl mx-auto px-6 md:px-12">
              {resultados.map((f, i) => (
                <TarjetaResultadoNarrativo
                  key={f.id}
                  index={i}
                  fondo={f}
                  maxScore={maxScore}
                  esMejorCoincidencia={i === 0}
                  contexto={i === 0 && resumen ? { resumen, hayTerritorioConsulta } : undefined}
                  modoDebug={modoDebug}
                  onAbrirInstructivo={() => setPanel({ tipo: 'instructivo', fondoId: f.id, fondoNombre: f.nombre })}
                  onAbrirModelo={() => setPanel({ tipo: 'modelo', fondoId: f.id, fondoNombre: f.nombre })}
                />
              ))}
            </div>
          )
        })()}

        {/* Cargar más */}
        {resultados.length > 0 && (
          <div className="max-w-6xl mx-auto px-6 md:px-12 mt-10 flex justify-center">
            {cargando ? (
              <p className="text-sm text-gray-400 font-bold animate-pulse">Cargando más resultados...</p>
            ) : hayMas && onCargarMas ? (
              <button
                onClick={onCargarMas}
                className="border-2 border-[#213362] text-[#213362] font-black px-10 py-3 rounded-xl
                  hover:bg-[#f0f4ff] transition-colors"
              >
                Cargar más resultados
              </button>
            ) : total > 0 ? (
              <p className="text-xs text-gray-400 font-bold">
                Mostrando {resultados.length} de {total} resultado{total !== 1 ? 's' : ''}
              </p>
            ) : null}
          </div>
        )}
      </section>

      {/* Panel lateral — instructivo o modelo */}
      <PanelLateral
        abierto={panel !== null}
        titulo={
          panel?.tipo === 'instructivo'
            ? `Instructivo: ${panel.fondoNombre}`
            : `Modelo de aplicación: ${panel?.fondoNombre ?? ''}`
        }
        onCerrar={() => setPanel(null)}
      >
        {panel?.tipo === 'instructivo' && <ContenidoInstructivo fondoId={panel.fondoId} />}
        {panel?.tipo === 'modelo' && <ContenidoModelo fondoId={panel.fondoId} />}
      </PanelLateral>
    </>
  )
}

