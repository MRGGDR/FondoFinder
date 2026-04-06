'use client'
/**
 * ConsultaNarrativa — experiencia de búsqueda narrativa de párrafo fluido
 *
 * Reemplaza el wizard de 4 pasos (identidad → sujeto → predicado → contexto)
 * con una única frase interactiva donde cada variable se selecciona inline.
 *
 * Narrativa objetivo:
 *   "Soy [SUJETO] y necesito [VERBOS] de [PREDICADO] para [COMPLEMENTOS],
 *    frente a [DESASTRE] con afectación en [AFECTACIÓN].
 *    Busco fondos de alcance [TIPO_FONDO] con presupuesto de [PRESUPUESTO]."
 *
 * Componentes internos (no exportados):
 *   InlineChip       → selector inline single/multi con dropdown
 *   PresupuestoChip  → variante con input numérico
 *   PerfilBarCompacto → barra de perfil + modal de creación/recuperación
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import type { TerminoNarrativo, TipoFondo, CrearPerfilPayload, ActualizarPerfilPayload } from '@/types/database'
import type { PerfilLocal } from '@/hooks/usePerfilConsulta'
import { formatUSD } from '@/lib/utils'
import { NavBar } from '@/components/layout/NavBar'

// ── Tipos internos ────────────────────────────────────────────────────────────

interface InlineOption {
  id: string
  label: string
  description?: string | null
}

export interface ConsultaNarrativaProps {
  // Catálogo
  sujetos: TerminoNarrativo[]
  predicados: TerminoNarrativo[]
  verbos: TerminoNarrativo[]
  complementos: TerminoNarrativo[]
  desastres: TerminoNarrativo[]
  afectaciones: TerminoNarrativo[]
  cargandoCatalogo: boolean
  // Estado de selección
  sujetoId: string | null
  predicadoId: string | null
  verboIds: string[]
  complementoIds: string[]
  tipoDesastre: string | null
  afectacion: string | null
  tipoFondo: TipoFondo | null
  presupuestoUSD: number | null
  // Refinadores opcionales (chips temáticos, no territoriales)
  refinadores: string[]
  onRefinadores: (ids: string[]) => void
  // Callbacks de estado
  onSujeto: (id: string | null) => void
  onPredicado: (id: string | null) => void
  onVerbos: (ids: string[]) => void
  onComplementos: (ids: string[]) => void
  onTipoDesastre: (v: string | null) => void
  onAfectacion: (v: string | null) => void
  onTipoFondo: (v: TipoFondo | null) => void
  onPresupuesto: (v: number | null) => void
  // Búsqueda
  onBuscar: () => void
  cargandoBusqueda: boolean
  // Perfil ligero
  perfil: PerfilLocal | null
  cargandoPerfil: boolean
  errorPerfil: string | null
  crearORecuperar: (payload: CrearPerfilPayload) => Promise<PerfilLocal | null>
  recuperarPorCodigo: (codigo: string) => Promise<PerfilLocal | null>
  actualizarPerfil: (payload: ActualizarPerfilPayload) => Promise<PerfilLocal | null>
  cerrarPerfil: () => void
}

// ── Hook utilitario: cerrar al clicar fuera ───────────────────────────────────

function useClickFuera(
  ref: React.RefObject<HTMLSpanElement>,
  handler: () => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handler()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [ref, handler, enabled])
}

// ── Paleta de chips ───────────────────────────────────────────────────────────

type ChipColor = 'navy' | 'blue' | 'red' | 'yellow' | 'green'

const CHIP_ACTIVE: Record<ChipColor, string> = {
  navy:   'bg-[#FFCD00] text-[#213362] border-[#FFCD00]',
  blue:   'bg-[#00AEE3] text-white border-[#00AEE3]',
  red:    'bg-[#d80e25] text-white border-[#d80e25]',
  yellow: 'bg-[#FFCD00] text-[#213362] border-[#FFCD00]',
  green:  'bg-emerald-500 text-white border-emerald-500',
}

// ── InlineChip ────────────────────────────────────────────────────────────────

interface InlineChipProps {
  /** Texto cuando no hay selección */
  placeholder: string
  /** Texto ya resuelto para mostrar en el chip (puede ser null = sin selección) */
  displayValue: string | null
  options: InlineOption[]
  multi: boolean
  selectedIds: string[]
  color: ChipColor
  onSelect: (ids: string[]) => void
  disabled?: boolean
}

function InlineChip({
  placeholder,
  displayValue,
  options,
  multi,
  selectedIds,
  color,
  onSelect,
  disabled,
}: InlineChipProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)
  const closeHandler = useCallback(() => setOpen(false), [])
  useClickFuera(containerRef, closeHandler, open)

  const hasSelection = selectedIds.length > 0

  function toggle(id: string) {
    if (multi) {
      const next = selectedIds.includes(id)
        ? selectedIds.filter(x => x !== id)
        : [...selectedIds, id]
      onSelect(next)
    } else {
      onSelect(selectedIds[0] === id ? [] : [id])
      setOpen(false)
    }
  }

  return (
    <span ref={containerRef} className="relative inline-block align-baseline">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        onKeyDown={e => e.key === 'Escape' && setOpen(false)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          'inline-flex items-center gap-1 rounded-lg border-2 px-3 py-[3px]',
          'font-black transition-all align-middle cursor-pointer select-none',
          'text-[0.85em] leading-normal',
          hasSelection
            ? CHIP_ACTIVE[color]
            : 'border-dashed border-white/40 text-white/60 hover:border-white/70 hover:text-white/90',
          disabled ? 'opacity-40 cursor-not-allowed' : '',
        ].join(' ')}
      >
        {displayValue ?? placeholder}
        <svg
          className={`w-3 h-3 opacity-70 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <span
          role="listbox"
          aria-multiselectable={multi}
          className="absolute left-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 overflow-y-auto block"
          style={{ minWidth: '260px', maxWidth: '440px', maxHeight: '320px' }}
        >
          <span className="flex flex-wrap gap-2">
            {options.length === 0 && (
              <span className="text-xs text-gray-400 px-1 py-1">Sin opciones disponibles</span>
            )}
            {options.map(o => {
              const active = selectedIds.includes(o.id)
              return (
                <button
                  key={o.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => toggle(o.id)}
                  className={[
                    'px-3 py-2 rounded-lg text-xs font-bold border-2 transition-all text-left',
                    'whitespace-normal break-words leading-snug',
                    active
                      ? 'bg-[#213362] border-[#213362] text-white'
                      : 'bg-white border-gray-200 text-[#213362] hover:border-[#213362] hover:bg-[#f0f4ff]',
                  ].join(' ')}
                >
                  {o.label}
                  {o.description && (
                    <span
                      className={`block text-[10px] font-normal leading-tight mt-0.5 whitespace-normal ${active ? 'text-white/60' : 'text-gray-400'}`}
                    >
                      {o.description}
                    </span>
                  )}
                </button>
              )
            })}
          </span>
          {multi && selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => onSelect([])}
              className="mt-2 pt-2 border-t border-gray-100 w-full text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors text-left block"
            >
              ✕ Limpiar selección
            </button>
          )}
        </span>
      )}
    </span>
  )
}

// ── PresupuestoChip ───────────────────────────────────────────────────────────

function PresupuestoChip({
  presupuesto,
  onCambiar,
}: {
  presupuesto: number | null
  onCambiar: (v: number | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [inputVal, setInputVal] = useState(presupuesto != null ? String(presupuesto) : '')
  const containerRef = useRef<HTMLSpanElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const closeHandler = useCallback(() => setOpen(false), [])
  useClickFuera(containerRef, closeHandler, open)

  // Sync inputVal cuando el presupuesto se resetea externamente
  useEffect(() => {
    if (presupuesto == null) setInputVal('')
    else setInputVal(String(presupuesto))
  }, [presupuesto])

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [open])

  function confirmar() {
    const n = parseFloat(inputVal)
    onCambiar(isNaN(n) || n <= 0 ? null : n)
    setOpen(false)
  }

  return (
    <span ref={containerRef} className="relative inline-block align-baseline">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={[
          'inline-flex items-center gap-1 rounded-lg border-2 px-3 py-[3px]',
          'font-black transition-all align-middle cursor-pointer select-none text-[0.85em] leading-normal',
          presupuesto != null
            ? 'bg-emerald-500 text-white border-emerald-500'
            : 'border-dashed border-white/40 text-white/60 hover:border-white/70 hover:text-white/90',
        ].join(' ')}
      >
        {presupuesto != null ? formatUSD(presupuesto) : 'cualquier monto'}
        <svg
          className="w-3 h-3 opacity-70 shrink-0"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <span
          className="absolute left-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 block"
          style={{ minWidth: '220px' }}
        >
          <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
            Presupuesto máximo (USD)
          </span>
          <input
            ref={inputRef}
            type="number"
            min={0}
            step={10000}
            placeholder="ej. 500 000"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') confirmar()
              if (e.key === 'Escape') setOpen(false)
            }}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-[#213362]
              focus:outline-none focus:border-[#213362] transition-colors"
          />
          <span className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={confirmar}
              className="flex-1 bg-[#213362] text-white font-black text-xs py-2 rounded-lg hover:bg-[#07519D] transition-colors"
            >
              Aplicar
            </button>
            {presupuesto != null && (
              <button
                type="button"
                onClick={() => { onCambiar(null); setInputVal(''); setOpen(false) }}
                className="text-xs text-gray-400 hover:text-red-500 px-3 py-2 transition-colors"
              >
                Quitar
              </button>
            )}
          </span>
        </span>
      )}
    </span>
  )
}

// ── PerfilBarCompacto ─────────────────────────────────────────────────────────

const TIPOS_ACTOR = [
  'Alcaldía Municipal',
  'Gobernación',
  'Corporación Autónoma Regional',
  'Entidad del orden nacional',
  'Organización comunitaria / ONG',
  'Cooperación internacional',
  'Otro',
]

interface MuniRow { id: string; nombre: string }

/** Carga departamentos de la API (cacheado en memoria durante la sesión) */
let _deptoCache: string[] | null = null
async function fetchDepartamentos(): Promise<string[]> {
  if (_deptoCache !== null) return _deptoCache   // null = sin cargar; [] = cargado (aunque vacío)
  const res = await fetch('/api/municipios/departamentos')
  if (!res.ok) return []
  const json = await res.json() as { departamentos: string[] }
  _deptoCache = json.departamentos
  return json.departamentos
}

/** Carga municipios de un departamento */
async function fetchMunicipiosPorDepto(dep: string): Promise<MuniRow[]> {
  const res = await fetch(`/api/municipios/por-departamento?dep=${encodeURIComponent(dep)}`)
  if (!res.ok) return []
  const json = await res.json() as { municipios: MuniRow[] }
  return json.municipios
}

/** Subformulario de departamento + municipio, reutilizado en crear y en editar */
function DeptoMuniSelector({
  deptoValue,
  muniId,
  muniNombre,
  onChange,
  required,
}: {
  deptoValue: string
  muniId: string | null
  muniNombre: string
  onChange: (depto: string, muniId: string | null, muniNombre: string) => void
  required?: boolean
}) {
  const [departamentos, setDepartamentos] = useState<string[]>([])
  const [municipios, setMunicipios] = useState<MuniRow[]>([])
  const [cargandoDeptos, setCargandoDeptos] = useState(false)
  const [cargandoMunis, setCargandoMunis] = useState(false)

  useEffect(() => {
    setCargandoDeptos(true)
    fetchDepartamentos().then(d => { setDepartamentos(d); setCargandoDeptos(false) })
  }, [])

  useEffect(() => {
    if (!deptoValue) { setMunicipios([]); return }
    setCargandoMunis(true)
    fetchMunicipiosPorDepto(deptoValue).then(m => { setMunicipios(m); setCargandoMunis(false) })
  }, [deptoValue])

  function handleDepto(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange(e.target.value, null, '')
  }

  function handleMuni(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    const nombre = municipios.find(m => m.id === id)?.nombre ?? ''
    onChange(deptoValue, id || null, nombre)
  }

  const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1'
  const selectCls = 'w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-[#213362] focus:outline-none focus:border-[#213362] transition-colors bg-white disabled:opacity-50'

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Departamento{required && <span className="text-red-500 ml-0.5">*</span>}</label>
        <select
          value={deptoValue}
          onChange={handleDepto}
          disabled={cargandoDeptos}
          className={selectCls}
        >
          <option value="">{cargandoDeptos ? 'Cargando…' : 'Selecciona un departamento'}</option>
          {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Municipio{required && <span className="text-red-500 ml-0.5">*</span>}</label>
        <select
          value={muniId ?? ''}
          onChange={handleMuni}
          disabled={!deptoValue || cargandoMunis}
          className={selectCls}
        >
          <option value="">
            {!deptoValue ? 'Selecciona primero el departamento' : cargandoMunis ? 'Cargando…' : 'Selecciona un municipio'}
          </option>
          {municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
      </div>
    </div>
  )
}

interface PerfilBarProps {
  perfil: PerfilLocal | null
  cargando: boolean
  error: string | null
  crearORecuperar: (payload: CrearPerfilPayload) => Promise<PerfilLocal | null>
  recuperarPorCodigo: (codigo: string) => Promise<PerfilLocal | null>
  actualizarPerfil: (payload: ActualizarPerfilPayload) => Promise<PerfilLocal | null>
  cerrarPerfil: () => void
}

function PerfilBarCompacto({
  perfil, cargando, error,
  crearORecuperar, recuperarPorCodigo, actualizarPerfil, cerrarPerfil,
}: PerfilBarProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [modo, setModo] = useState<'crear' | 'recuperar'>('crear')
  const [intentado, setIntentado] = useState(false)

  // Campos del formulario de creación
  const [nombre, setNombre]           = useState('')
  const [tipoActor, setTipoActor]     = useState('')
  const [entidad, setEntidad]         = useState('')
  const [depto, setDepto]             = useState('')
  const [muniId, setMuniId]           = useState<string | null>(null)
  const [muniNombre, setMuniNombre]   = useState('')

  // Formulario de recuperación
  const [codigo, setCodigo] = useState('')

  // Modo edición (perfil existe pero se quiere modificar)
  const [editOpen, setEditOpen] = useState(false)
  const [editDepto, setEditDepto]         = useState(perfil?.departamento ?? '')
  const [editMuniId, setEditMuniId]       = useState<string | null>(perfil?.municipio_id ?? null)
  const [editMuniNombre, setEditMuniNombre] = useState(perfil?.nombre_municipio ?? '')
  const [editTipoActor, setEditTipoActor] = useState(perfil?.tipo_actor ?? '')
  const [editEntidad, setEditEntidad]     = useState(perfil?.entidad ?? '')

  // Sync edit state cuando el perfil cambia desde afuera (p.ej. recuperación)
  useEffect(() => {
    if (perfil) {
      setEditDepto(perfil.departamento ?? '')
      setEditMuniId(perfil.municipio_id)
      setEditMuniNombre(perfil.nombre_municipio ?? '')
      setEditTipoActor(perfil.tipo_actor ?? '')
      setEditEntidad(perfil.entidad ?? '')
    }
  }, [perfil])

  function resetCrear() {
    setNombre(''); setTipoActor(''); setEntidad('')
    setDepto(''); setMuniId(null); setMuniNombre('')
    setIntentado(false)
  }

  function abrirModal() { resetCrear(); setModo('crear'); setModalOpen(true) }

  const crearValido = nombre.trim().length >= 2 && tipoActor && entidad.trim().length >= 2 && muniId

  async function handleCrear() {
    setIntentado(true)
    if (!crearValido) return
    const r = await crearORecuperar({
      nombre_contacto: nombre.trim(),
      tipo_actor: tipoActor,
      entidad: entidad.trim(),
      municipio_id: muniId,
      canal_registro: 'web',
    })
    if (r) { setModalOpen(false); resetCrear() }
  }

  async function handleRecuperar() {
    if (!codigo.trim()) return
    setIntentado(true)
    const r = await recuperarPorCodigo(codigo.trim())
    if (r) { setModalOpen(false); setCodigo('') }
  }

  const editValido = editMuniId !== null

  async function handleEditar() {
    if (!perfil || !editValido) return
    const r = await actualizarPerfil({
      perfil_id: perfil.perfil_id,
      municipio_id: editMuniId,
      tipo_actor: editTipoActor || undefined,
      entidad: editEntidad.trim() || undefined,
    })
    if (r) { setEditOpen(false) }
  }

  const errorVisible = intentado ? error : null

  const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1'
  const inputCls = 'w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#213362] focus:outline-none focus:border-[#213362] transition-colors'
  const selectCls = 'w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#213362] focus:outline-none focus:border-[#213362] transition-colors bg-white'

  // ── Perfil activo ──────────────────────────────────────────────────────────
  if (perfil) {
    const perfilIncompleto = !perfil.municipio_id
    return (
      <>
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2.5 bg-white/10 border border-white/20 rounded-xl px-4 py-2">
            <div
              className="w-7 h-7 rounded-full bg-[#FFCD00] flex items-center justify-center text-[#213362] font-black text-sm shrink-0"
              aria-hidden="true"
            >
              {(perfil.nombre_contacto ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white font-bold text-sm">{perfil.nombre_contacto}</span>
              {perfil.nombre_municipio && (
                <span className="text-white/50 text-xs">{perfil.nombre_municipio}{perfil.departamento ? `, ${perfil.departamento}` : ''}</span>
              )}
            </div>
            <span className="text-[#FFCD00] font-mono text-xs">{perfil.codigo_acceso}</span>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              title="Editar perfil"
              aria-label="Editar perfil"
              className="ml-1 text-white/40 hover:text-white/80 transition-colors text-xs font-bold"
            >
              ✎
            </button>
            <button
              type="button"
              onClick={cerrarPerfil}
              title="Cambiar perfil"
              aria-label="Eliminar perfil activo"
              className="text-white/40 hover:text-white/80 transition-colors text-xl leading-none"
            >
              ×
            </button>
          </div>

          {perfilIncompleto && (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1 bg-[#FFCD00] text-[#213362] text-xs font-black px-3 py-1.5 rounded-lg hover:bg-[#f0c000] transition-colors"
            >
              ⚠ Completa tu perfil
            </button>
          )}
        </div>

        {/* Modal edición */}
        {editOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-editar-titulo"
            onClick={e => e.target === e.currentTarget && setEditOpen(false)}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-6">
                <h3 id="modal-editar-titulo" className="text-xl font-black text-[#213362]">
                  Editar perfil
                </h3>
                <button type="button" onClick={() => setEditOpen(false)} aria-label="Cerrar" className="text-gray-400 hover:text-gray-700 text-2xl font-light leading-none transition-colors">×</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Tipo de actor</label>
                  <select value={editTipoActor} onChange={e => setEditTipoActor(e.target.value)} className={selectCls}>
                    <option value="">Sin especificar</option>
                    {TIPOS_ACTOR.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Entidad</label>
                  <input type="text" value={editEntidad} onChange={e => setEditEntidad(e.target.value)} placeholder="Nombre de tu entidad" className={inputCls} />
                </div>
                <DeptoMuniSelector
                  deptoValue={editDepto}
                  muniId={editMuniId}
                  muniNombre={editMuniNombre}
                  required
                  onChange={(d, id, nombre) => { setEditDepto(d); setEditMuniId(id); setEditMuniNombre(nombre) }}
                />
                {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
                <button
                  type="button"
                  onClick={handleEditar}
                  disabled={!editValido || cargando}
                  className="w-full bg-[#213362] text-white font-black py-3 rounded-xl hover:bg-[#07519D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cargando ? 'Guardando…' : 'Guardar cambios →'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // ── Sin perfil ─────────────────────────────────────────────────────────────
  return (
    <>
      <button
        type="button"
        onClick={abrirModal}
        className="flex items-center gap-2 border border-dashed border-white/20 text-white/50
          hover:text-white/80 hover:border-white/40 rounded-xl px-4 py-2 text-sm font-bold transition-colors"
      >
        <span className="text-base leading-none" aria-hidden="true">+</span>
        Conectar perfil
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-perfil-titulo"
          onClick={e => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h3 id="modal-perfil-titulo" className="text-xl font-black text-[#213362]">
                Perfil de consulta
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Cerrar" className="text-gray-400 hover:text-gray-700 text-2xl font-light leading-none transition-colors">×</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
              {(['crear', 'recuperar'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setModo(m); setIntentado(false) }}
                  className={[
                    'px-5 py-2 rounded-lg text-sm font-black transition-all',
                    modo === m ? 'bg-white text-[#213362] shadow-sm' : 'text-gray-400 hover:text-gray-700',
                  ].join(' ')}
                >
                  {m === 'crear' ? 'Crear perfil' : 'Ya tengo código'}
                </button>
              ))}
            </div>

            {modo === 'crear' ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-400 leading-relaxed -mt-2 mb-2">
                  Tu perfil guarda tu contexto institucional y te da un código para retomar esta sesión.
                </p>

                <div>
                  <label className={labelCls}>Nombre o entidad <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCrear()}
                    placeholder="Tu nombre o el de tu equipo"
                    className={[inputCls, intentado && nombre.trim().length < 2 ? 'border-red-400' : ''].join(' ')}
                  />
                  {intentado && nombre.trim().length < 2 && <p className="text-red-500 text-xs mt-1">Requerido (mín. 2 caracteres)</p>}
                </div>

                <div>
                  <label className={labelCls}>Tipo de actor <span className="text-red-500">*</span></label>
                  <select
                    value={tipoActor}
                    onChange={e => setTipoActor(e.target.value)}
                    className={[selectCls, intentado && !tipoActor ? 'border-red-400' : ''].join(' ')}
                  >
                    <option value="">Selecciona el tipo de actor</option>
                    {TIPOS_ACTOR.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {intentado && !tipoActor && <p className="text-red-500 text-xs mt-1">Requerido</p>}
                </div>

                <div>
                  <label className={labelCls}>Nombre de la entidad <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={entidad}
                    onChange={e => setEntidad(e.target.value)}
                    placeholder="Ej. Alcaldía de Ibagué"
                    className={[inputCls, intentado && entidad.trim().length < 2 ? 'border-red-400' : ''].join(' ')}
                  />
                  {intentado && entidad.trim().length < 2 && <p className="text-red-500 text-xs mt-1">Requerido (mín. 2 caracteres)</p>}
                </div>

                <DeptoMuniSelector
                  deptoValue={depto}
                  muniId={muniId}
                  muniNombre={muniNombre}
                  required
                  onChange={(d, id, mNombre) => { setDepto(d); setMuniId(id); setMuniNombre(mNombre) }}
                />
                {intentado && !muniId && (
                  <p className="text-red-500 text-xs -mt-1">Selecciona tu municipio</p>
                )}

                {errorVisible && <p className="text-red-500 text-sm font-bold">{errorVisible}</p>}

                <button
                  type="button"
                  onClick={handleCrear}
                  disabled={cargando}
                  className="w-full bg-[#213362] text-white font-black py-3 rounded-xl hover:bg-[#07519D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cargando ? 'Creando…' : 'Crear perfil →'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-400 leading-relaxed -mt-2 mb-2">
                  Ingresa tu código de acceso para recuperar un perfil existente.
                </p>
                <input
                  type="text"
                  value={codigo}
                  onChange={e => setCodigo(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleRecuperar()}
                  placeholder="ej. FF-ABCD"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-black font-mono tracking-[0.2em] uppercase text-[#213362] focus:outline-none focus:border-[#213362] transition-colors"
                />
                {errorVisible && <p className="text-red-500 text-sm font-bold">{errorVisible}</p>}
                <button
                  type="button"
                  onClick={handleRecuperar}
                  disabled={!codigo.trim() || cargando}
                  className="w-full bg-[#213362] text-white font-black py-3 rounded-xl hover:bg-[#07519D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cargando ? 'Buscando…' : 'Recuperar perfil →'}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Continuar sin perfil →
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ── DeptoMuniTerritory ─────────────────────────────────────────────────────────
// Selector compacto de departamento→municipio para "Territorio de interés".
// Autocontrolado, carga municipios lazy cuando el usuario elige departamento.

function DeptoMuniTerritory({
  municipioId,
  onChange,
}: {
  municipioId: string | null
  onChange: (id: string | null) => void
}) {
  const [departamentos, setDepartamentos] = useState<string[]>([])
  const [municipios, setMunicipios]       = useState<MuniRow[]>([])
  const [depto, setDepto]                 = useState('')
  const [muniNombre, setMuniNombre]       = useState('')

  useEffect(() => {
    fetchDepartamentos().then(setDepartamentos)
  }, [])

  useEffect(() => {
    if (!depto) { setMunicipios([]); onChange(null); return }
    fetchMunicipiosPorDepto(depto).then(setMunicipios)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depto])

  // En Windows/Chrome el popup nativo del <select> siempre usa fondo blanco del SO —
  // no hereda estilos CSS del select padre. Usar text-white sobre ese fondo = invisible.
  // Solución: pastilla blanca con texto oscuro → funciona en el select Y en el popup nativo.
  const selectCls =
    'bg-white text-[#213362] text-xs font-bold rounded-lg px-3 py-1.5 border border-white/20 ' +
    'focus:outline-none focus:ring-2 focus:ring-[#FFCD00] transition-colors disabled:opacity-50 cursor-pointer'

  if (municipioId && muniNombre) {
    return (
      <div className="mt-5 border-t border-white/10 pt-4 flex items-center gap-3 flex-wrap">
        <span className="text-white/40 text-[10px] font-black uppercase tracking-widest shrink-0">
          Territorio de interés
        </span>
        <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-xs font-bold">
          📍 {muniNombre}
        </span>
        <button
          type="button"
          onClick={() => { setDepto(''); setMuniNombre(''); onChange(null) }}
          className="text-white/30 hover:text-white/60 text-xs transition-colors"
        >
          ✕ quitar
        </button>
      </div>
    )
  }

  return (
    <div className="mt-5 border-t border-white/10 pt-4 flex items-center gap-3 flex-wrap">
      <span className="text-white/40 text-[10px] font-black uppercase tracking-widest shrink-0">
        Territorio de interés
        <span className="ml-1 font-normal normal-case text-white/25">(opcional)</span>
      </span>
      <select
        value={depto}
        onChange={e => { setDepto(e.target.value); setMuniNombre(''); onChange(null) }}
        className={selectCls}
      >
        <option value="">Departamento…</option>
        {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
      <select
        value={municipioId ?? ''}
        onChange={e => {
          const id = e.target.value
          const nombre = municipios.find(m => m.id === id)?.nombre ?? ''
          setMuniNombre(nombre)
          onChange(id || null)
        }}
        disabled={!depto}
        className={selectCls}
      >
        <option value="">{depto ? 'Municipio…' : '—'}</option>
        {municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
      </select>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

const TIPOS_FONDO: TipoFondo[] = ['Nacional', 'Territorial', 'Internacional']
const REFINADORES_KEYWORDS = [
  'acueducto',
  'saneamiento',
  'agua potable',
  'vivienda',
  'salud',
  'infraestructura social',
  'desarrollo integral',
  'seguridad hídrica',
  'sostenibilidad hídrica',
  'cuencas abastecedoras',
  'fuentes de agua',
  'monitoreo hidrológico',
  'PSA',
  'predios estratégicos',
  'restauración ecológica',
  'conservación',
] as const

export function ConsultaNarrativa({
  sujetos, predicados, verbos, complementos, desastres, afectaciones,
  cargandoCatalogo,
  sujetoId, predicadoId, verboIds, complementoIds,
  tipoDesastre, afectacion, tipoFondo, presupuestoUSD,
  refinadores,
  onSujeto, onPredicado, onVerbos, onComplementos,
  onTipoDesastre, onAfectacion, onTipoFondo, onPresupuesto,
  onRefinadores,
  onBuscar, cargandoBusqueda,
  perfil, cargandoPerfil, errorPerfil, crearORecuperar, recuperarPorCodigo, actualizarPerfil, cerrarPerfil,
}: ConsultaNarrativaProps) {

  // Convertir TerminoNarrativo[] → InlineOption[] (usando id como clave)
  function toOptions(terms: TerminoNarrativo[]): InlineOption[] {
    return terms.map(t => ({ id: t.id, label: t.termino_canonico, description: t.descripcion }))
  }

  // Para desastre/afectacion el parámetro de búsqueda es el texto canónico, no el UUID
  function toCanonicalOptions(terms: TerminoNarrativo[]): InlineOption[] {
    return terms.map(t => ({
      id: t.termino_canonico,
      label: t.termino_canonico,
      description: t.descripcion,
    }))
  }

  const tiposFondoOptions: InlineOption[] = TIPOS_FONDO.map(tf => ({
    id: tf,
    label: tf,
    description: null,
  }))
  const refinadoresOptions: InlineOption[] = REFINADORES_KEYWORDS.map(r => ({
    id: r,
    label: r,
    description: null,
  }))

  // Textos resueltos para mostrar en los chips
  const sujetoLabel    = sujetos.find(t => t.id === sujetoId)?.termino_canonico ?? null
  const predicadoLabel = predicados.find(t => t.id === predicadoId)?.termino_canonico ?? null

  const verbosSelected      = verbos.filter(t => verboIds.includes(t.id))
  const complementosSelected = complementos.filter(t => complementoIds.includes(t.id))

  const verbosDisplay: string | null =
    verbosSelected.length === 0 ? null
    : verbosSelected.length === 1 ? verbosSelected[0].termino_canonico
    : `${verbosSelected.length} acciones`

  const complementosDisplay: string | null =
    complementosSelected.length === 0 ? null
    : complementosSelected.length === 1 ? complementosSelected[0].termino_canonico
    : `${complementosSelected.length} áreas`
  const refinadoresDisplay: string | null =
    refinadores.length === 0 ? null
      : refinadores.length === 1 ? refinadores[0]
      : `${refinadores.length} refinadores`

  return (
    <section
      className="bg-[#213362] min-h-screen flex flex-col justify-center px-6 pb-24 relative"
      style={{ paddingTop: '108px' }}
      aria-label="Constructor de consulta narrativa"
    >
      {/* NavBar */}
      <div style={{ position: 'absolute', top: 16, left: 0, right: 0 }}>
        <NavBar variant="hero" />
      </div>

      <div className="w-full max-w-4xl mx-auto">
        {/* Fila superior: chip versión + perfil */}
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div
            className="inline-flex items-center gap-2 bg-[#FFCD00]/10 border border-[#FFCD00]/20
              text-[#FFCD00] text-[10px] font-bold px-4 py-[5px] rounded-full tracking-[1px] uppercase"
          >
            <div className="w-[5px] h-[5px] bg-[#FFCD00] rounded-full shrink-0" aria-hidden="true" />
            Búsqueda narrativa · v2
          </div>
          <PerfilBarCompacto
            perfil={perfil}
            cargando={cargandoPerfil}
            error={errorPerfil}
            crearORecuperar={crearORecuperar}
            recuperarPorCodigo={recuperarPorCodigo}
            actualizarPerfil={actualizarPerfil}
            cerrarPerfil={cerrarPerfil}
          />
        </div>

        {/* Título */}
        <h1
          className="font-black text-white leading-tight tracking-[-2px] mb-3"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          Construye tu{' '}
          <span className="text-[#FFCD00] italic">consulta narrativa</span>
        </h1>
        <p className="text-white/50 text-base mb-10 max-w-xl leading-relaxed">
          Selecciona cada campo para armar tu búsqueda.
          Los campos vacíos buscan en todos los fondos disponibles.
        </p>

        {/* ── La frase narrativa ──────────────────────────────────────────── */}
        <div
          className={[
            'bg-white/5 border border-white/10 rounded-2xl px-7 py-8',
            'text-white font-bold transition-opacity duration-200',
            cargandoCatalogo ? 'opacity-40 pointer-events-none' : 'opacity-100',
          ].join(' ')}
          style={{ fontSize: 'clamp(1rem, 2vw, 1.3rem)', lineHeight: '2.5' }}
        >
          {/* Oración 1 */}
          <p>
            <span className="text-white/50">Soy{'\u00A0'}</span>
            <InlineChip
              placeholder="cualquier entidad"
              displayValue={sujetoLabel}
              options={toOptions(sujetos)}
              multi={false}
              selectedIds={sujetoId ? [sujetoId] : []}
              color="navy"
              onSelect={ids => onSujeto(ids[0] ?? null)}
              disabled={cargandoCatalogo}
            />
            <span className="text-white/50">{'\u00A0'}y necesito{'\u00A0'}</span>
            <InlineChip
              placeholder="realizar acciones"
              displayValue={verbosDisplay}
              options={toOptions(verbos)}
              multi={true}
              selectedIds={verboIds}
              color="blue"
              onSelect={onVerbos}
              disabled={cargandoCatalogo}
            />
            <span className="text-white/50">{'\u00A0'}de{'\u00A0'}</span>
            <InlineChip
              placeholder="cualquier objetivo"
              displayValue={predicadoLabel}
              options={toOptions(predicados)}
              multi={false}
              selectedIds={predicadoId ? [predicadoId] : []}
              color="blue"
              onSelect={ids => onPredicado(ids[0] ?? null)}
              disabled={cargandoCatalogo}
            />
            <span className="text-white/50">{'\u00A0'}para{'\u00A0'}</span>
            <InlineChip
              placeholder="cualquier área"
              displayValue={complementosDisplay}
              options={toOptions(complementos)}
              multi={true}
              selectedIds={complementoIds}
              color="blue"
              onSelect={onComplementos}
              disabled={cargandoCatalogo}
            />
            <span className="text-white/50">,{'\u00A0'}frente a{'\u00A0'}</span>
            <InlineChip
              placeholder="cualquier amenaza"
              displayValue={tipoDesastre}
              options={toCanonicalOptions(desastres)}
              multi={false}
              selectedIds={tipoDesastre ? [tipoDesastre] : []}
              color="red"
              onSelect={ids => onTipoDesastre(ids[0] ?? null)}
              disabled={cargandoCatalogo}
            />
            <span className="text-white/50">{'\u00A0'}con afectación en{'\u00A0'}</span>
            <InlineChip
              placeholder="cualquier afectación"
              displayValue={afectacion}
              options={toCanonicalOptions(afectaciones)}
              multi={false}
              selectedIds={afectacion ? [afectacion] : []}
              color="red"
              onSelect={ids => onAfectacion(ids[0] ?? null)}
              disabled={cargandoCatalogo}
            />
            <span className="text-white/50">.</span>
          </p>

          {/* Oración 2 */}
          <p className="mt-1">
            <span className="text-white/50">Busco fondos de alcance{'\u00A0'}</span>
            <InlineChip
              placeholder="cualquier alcance"
              displayValue={tipoFondo}
              options={tiposFondoOptions}
              multi={false}
              selectedIds={tipoFondo ? [tipoFondo] : []}
              color="yellow"
              onSelect={ids => onTipoFondo((ids[0] as TipoFondo) ?? null)}
              disabled={cargandoCatalogo}
            />
            <span className="text-white/50">{'\u00A0'}con presupuesto de{'\u00A0'}</span>
            <PresupuestoChip presupuesto={presupuestoUSD} onCambiar={onPresupuesto} />
            <span className="text-white/50">.</span>
          </p>

          {/* ── Refinadores opcionales (palabras clave no territoriales) ─── */}
          <div className="mt-4 border-t border-white/10 pt-4 flex items-center gap-3 flex-wrap">
            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest shrink-0">
              Refinadores
              <span className="ml-1 font-normal normal-case text-white/25">(opcional)</span>
            </span>
            <InlineChip
              placeholder="agregar refinadores"
              displayValue={refinadoresDisplay}
              options={refinadoresOptions}
              multi
              selectedIds={refinadores}
              color="green"
              onSelect={onRefinadores}
              disabled={cargandoCatalogo}
            />
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <div className="mt-10 flex items-center gap-5 flex-wrap">
          <button
            type="button"
            onClick={onBuscar}
            disabled={cargandoBusqueda || cargandoCatalogo}
            className="bg-[#FFCD00] text-[#213362] font-black px-10 py-4 rounded-xl text-base
              hover:bg-[#f0c000] transition-colors shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargandoBusqueda ? 'Buscando...' : 'Buscar fondos →'}
          </button>

          {cargandoCatalogo && (
            <span className="text-white/40 text-sm font-bold animate-pulse">
              Cargando opciones…
            </span>
          )}
        </div>

        {/* Indicador de scroll subtle */}
        <div className="mt-16 flex flex-col items-center gap-1 opacity-30 animate-bounce" aria-hidden="true">
          <span className="text-white text-[10px] font-bold tracking-widest uppercase">
            Resultados abajo
          </span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white">
            <path
              d="M8 3v10M4 9l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </section>
  )
}
