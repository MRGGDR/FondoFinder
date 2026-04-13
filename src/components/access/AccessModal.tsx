'use client'
/**
 * AccessModal
 *
 * Modal de identificación ligera de la herramienta.
 * Aparece cuando el usuario no tiene perfil válido en localStorage.
 * NO usa Supabase Auth ni contraseñas.
 *
 * Flujos:
 *   A. "Ya tengo usuario" → recuperar perfil por usuario
 *   B. "Es mi primera vez" → crear perfil ligero con datos mínimos
 *   C. Confirmación → mostrar código al usuario recién registrado
 */

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { respuestaAPerfilLocal, type PerfilLocal } from '@/lib/lightSession'

/* ─────────────────────────────────────────────
   TIPOS
───────────────────────────────────────────── */
type Flujo = 'seleccion' | 'codigo' | 'registro' | 'confirmacion'

interface AccessModalProps {
  onConfirmado: (perfil: PerfilLocal) => void
}

/* ─────────────────────────────────────────────
   CONSTANTES
───────────────────────────────────────────── */
const TIPO_ACTOR_OPCIONES = [
  { value: 'municipio',          label: 'Alcaldía / Municipio' },
  { value: 'gobernacion',        label: 'Gobernación / Departamento' },
  { value: 'gobierno_nacional',  label: 'Entidad pública nacional' },
  { value: 'ong',                label: 'ONG / Organización civil' },
  { value: 'empresa',            label: 'Empresa privada' },
  { value: 'academia',           label: 'Academia / Universidad' },
  { value: 'otro',               label: 'Otro' },
]

let cachedDepartamentos: string[] | null = null
const cachedMunicipiosByDep = new Map<string, { id: string; nombre: string }[]>()

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function InputField({
  label, id, type = 'text', value, onChange, placeholder, required, autoFocus,
}: {
  label: string; id: string; type?: string; value: string
  onChange: (v: string) => void; placeholder?: string; required?: boolean; autoFocus?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-bold text-[#213362] uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#213362] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00AEE3] text-sm bg-white"
      />
    </div>
  )
}

function SelectField({
  label, id, value, onChange, options, required,
}: {
  label: string; id: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-bold text-[#213362] uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#213362] focus:outline-none focus:ring-2 focus:ring-[#00AEE3] text-sm bg-white"
      >
        <option value="">Selecciona una opción…</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

/* ─────────────────────────────────────────────
   PANTALLA A — Ya tengo código
───────────────────────────────────────────── */
function FlujoCodigo({
  onConfirmado,
  onVolver,
}: {
  onConfirmado: (perfil: PerfilLocal) => void
  onVolver: () => void
}) {
  const [codigo, setCodigo] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = codigo.trim()
    if (!trimmed) { setError('Ingresa tu usuario.'); return }
    setCargando(true)
    setError(null)
    try {
      const res = await fetch('/api/perfiles/recuperar-por-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo_acceso: trimmed }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? 'Usuario no encontrado.')
      }
      const data = await res.json()
      const perfil = respuestaAPerfilLocal(data)
      onConfirmado(perfil)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo verificar el usuario.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-black text-[#213362] leading-tight">Ya tengo usuario</h2>
        <p className="text-sm text-gray-400 mt-1">
          Usa tu usuario registrado para recuperar tu perfil.
        </p>
      </div>

      <InputField
        label="Usuario"
        id="codigo_acceso"
        value={codigo}
        onChange={v => { setCodigo(v); setError(null) }}
        placeholder="usuario"
        required
        autoFocus
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={cargando || !codigo.trim()}
        className="w-full py-3 rounded-xl bg-[#213362] text-white font-bold text-sm hover:bg-[#1B4472] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {cargando ? 'Verificando…' : 'Continuar →'}
      </button>

      <button type="button" onClick={onVolver} className="text-xs text-gray-400 hover:text-gray-600 text-center transition-colors">
        ← Volver
      </button>
    </form>
  )
}

/* ─────────────────────────────────────────────
   PANTALLA B — Es mi primera vez
───────────────────────────────────────────── */
function FlujoRegistro({
  onConfirmado,
  onVolver,
}: {
  onConfirmado: (perfil: PerfilLocal, esNuevo: boolean) => void
  onVolver: () => void
}) {
  const [nombre, setNombre]       = useState('')
  const [tipoActor, setTipoActor] = useState('')
  const [entidad, setEntidad]     = useState('')

  // Selector en cascada: departamento → municipio
  const [departamentos, setDepartamentos] = useState<string[]>([])
  const [departamento, setDepartamento]   = useState('')
  const [municipiosLista, setMunicipiosLista] = useState<{ id: string; nombre: string }[]>([])
  const [municipioId, setMunicipioId]     = useState('')
  const [municipioNombre, setMunicipioNombre] = useState('')
  const [cargandoDepts, setCargandoDepts] = useState(false)
  const [cargandoMunis, setCargandoMunis] = useState(false)

  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Cargar lista de departamentos al montar
  useEffect(() => {
    if (cachedDepartamentos) {
      setDepartamentos(cachedDepartamentos)
      return
    }

    const controller = new AbortController()
    setCargandoDepts(true)
    fetch('/api/municipios/departamentos', { signal: controller.signal })
      .then(r => r.json())
      .then((d: { departamentos?: string[] }) => {
        const rows = d.departamentos ?? []
        cachedDepartamentos = rows
        setDepartamentos(rows)
      })
      .catch(() => { /* ignorar */ })
      .finally(() => setCargandoDepts(false))

    return () => {
      controller.abort()
    }
  }, [])

  // Cargar municipios cuando cambia el departamento
  useEffect(() => {
    if (!departamento) { setMunicipiosLista([]); setMunicipioId(''); setMunicipioNombre(''); return }
    const cached = cachedMunicipiosByDep.get(departamento)
    if (cached) {
      setMunicipiosLista(cached)
      setMunicipioId('')
      setMunicipioNombre('')
      return
    }

    const controller = new AbortController()
    setCargandoMunis(true)
    fetch(`/api/municipios/por-departamento?dep=${encodeURIComponent(departamento)}`, {
      signal: controller.signal,
    })
      .then(r => r.json())
      .then((d: { municipios?: { id: string; nombre: string }[] }) => {
        const rows = d.municipios ?? []
        cachedMunicipiosByDep.set(departamento, rows)
        setMunicipiosLista(rows)
      })
      .catch(() => setMunicipiosLista([]))
      .finally(() => setCargandoMunis(false))
    setMunicipioId('')
    setMunicipioNombre('')
    return () => {
      controller.abort()
    }
  }, [departamento])

  function handleMunicipioChange(id: string) {
    setMunicipioId(id)
    const found = municipiosLista.find(m => m.id === id)
    setMunicipioNombre(found?.nombre ?? '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { setError('El nombre es requerido.'); return }
    if (!tipoActor) { setError('Selecciona tu tipo de actor.'); return }
    setCargando(true)
    setError(null)
    try {
      const res = await fetch('/api/perfiles/crear-o-recuperar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_contacto: nombre.trim(),
          municipio_id:    municipioId || null,
          tipo_actor:      tipoActor || null,
          entidad:         entidad.trim() || null,
          canal_registro:  'modal_acceso_v2',
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json() as {
        perfil_id: string; codigo_acceso: string; nombre_contacto: string | null
        municipio_id: string | null; tipo_actor: string | null; es_nuevo: boolean
        nombre_municipio?: string | null; departamento?: string | null; entidad?: string | null
      }
      const perfil = respuestaAPerfilLocal({
        ...data,
        nombre_municipio: data.nombre_municipio ?? municipioNombre ?? null,
        departamento:     data.departamento ?? departamento ?? null,
        entidad:          (data.entidad ?? null) || entidad.trim() || null,
      })
      onConfirmado(perfil, data.es_nuevo)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al registrar el acceso.')
    } finally {
      setCargando(false)
    }
  }

  const selectCls = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#213362] focus:outline-none focus:ring-2 focus:ring-[#00AEE3] text-sm bg-white disabled:opacity-50"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-black text-[#213362] leading-tight">Es mi primera vez</h2>
        <p className="text-sm text-gray-400 mt-1">
          Completa estos datos para generar tu usuario.
        </p>
      </div>

      <InputField label="Nombre y Apellido" id="nombre" value={nombre} onChange={setNombre} placeholder="Tu nombre o el de tu equipo" required autoFocus />

      <SelectField
        label="Tipo de actor"
        id="tipo_actor"
        value={tipoActor}
        onChange={setTipoActor}
        options={TIPO_ACTOR_OPCIONES}
        required
      />

      <InputField label="Entidad u organización" id="entidad" value={entidad} onChange={setEntidad} placeholder="Ej. Alcaldía de Palmira" />

      {/* Selector cascada: Departamento */}
      <div className="flex flex-col gap-1">
        <label htmlFor="departamento" className="text-xs font-bold text-[#213362] uppercase tracking-wide">
          Departamento
        </label>
        <select
          id="departamento"
          value={departamento}
          onChange={e => setDepartamento(e.target.value)}
          disabled={cargandoDepts}
          className={selectCls}
        >
          <option value="">{cargandoDepts ? 'Cargando…' : 'Selecciona un departamento'}</option>
          {departamentos.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Selector cascada: Municipio (aparece solo si hay departamento) */}
      {departamento && (
        <div className="flex flex-col gap-1">
          <label htmlFor="municipio" className="text-xs font-bold text-[#213362] uppercase tracking-wide">
            Municipio
          </label>
          <select
            id="municipio"
            value={municipioId}
            onChange={e => handleMunicipioChange(e.target.value)}
            disabled={cargandoMunis}
            className={selectCls}
          >
            <option value="">{cargandoMunis ? 'Cargando municipios…' : 'Selecciona un municipio'}</option>
            {municipiosLista.map(m => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={cargando || !nombre.trim() || !tipoActor}
        className="w-full py-3 rounded-xl bg-[#FFCD00] text-[#213362] font-bold text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
      >
        {cargando ? 'Creando acceso…' : 'Crear mi acceso →'}
      </button>

      <button type="button" onClick={onVolver} className="text-xs text-gray-400 hover:text-gray-600 text-center transition-colors">
        ← Volver
      </button>
    </form>
  )
}

/* ─────────────────────────────────────────────
   PANTALLA C — Confirmación / Código generado
───────────────────────────────────────────── */
function FlujoCConfirmacion({
  perfil,
  onContinuar,
}: {
  perfil: PerfilLocal
  onContinuar: () => void
}) {
  const [copiado, setCopiado] = useState(false)

  function copiar() {
    navigator.clipboard.writeText(perfil.codigo_acceso).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }).catch(() => { /* fallback ignorado */ })
  }

  return (
    <div className="flex flex-col gap-5 text-center">
      {/* Ícono de éxito */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-[#FFCD00]/20 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#213362]" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Usuario creado</p>
        <h2 className="text-xl font-black text-[#213362] leading-tight">
          Bienvenido a la herramienta
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Tu acceso a la herramienta está listo.
        </p>
      </div>

      {/* Código destacado */}
      <div className="bg-[#f6fafe] border border-[#213362]/15 rounded-2xl px-6 py-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Tu usuario</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl font-black text-[#213362] tracking-widest font-mono">
            {perfil.codigo_acceso}
          </span>
          <button
            type="button"
            onClick={copiar}
            title="Copiar usuario"
            className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {copiado ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
          Guarda este usuario para identificarte desde otro dispositivo.<br />
          Es tu única forma de recuperar tu perfil.
        </p>
      </div>

      <button
        type="button"
        onClick={onContinuar}
        className="w-full py-3 rounded-xl bg-[#213362] text-white font-bold text-sm hover:bg-[#1B4472] transition-colors"
      >
        Accede a la herramienta →
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────
   PANTALLA 0 — Selección de flujo
───────────────────────────────────────────── */
function FlujoSeleccion({
  onCodigo,
  onRegistro,
}: {
  onCodigo: () => void
  onRegistro: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Herramienta</p>
        <h2 className="text-2xl font-black text-[#213362] leading-tight">
          Identifica tu usuario
        </h2>
        <p className="text-sm text-gray-400 mt-2">
          Para usar la herramienta necesitas un perfil ligero de acceso.<br />
          Solo toma unos segundos.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {/* Opción A — ya tengo código */}
        <button
          type="button"
          onClick={onCodigo}
          className="w-full flex items-start gap-4 p-5 rounded-2xl border-2 border-[#213362] hover:bg-[#213362] hover:text-white group transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[#213362] group-hover:bg-white flex items-center justify-center flex-shrink-0 transition-colors">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white group-hover:text-[#213362] transition-colors" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>
          <div>
            <p className="font-black text-[#213362] group-hover:text-white text-sm transition-colors">Ya tengo usuario</p>
            <p className="text-xs text-gray-400 group-hover:text-white/70 mt-0.5 transition-colors">
              Ingresa tu usuario para recuperar tu perfil
            </p>
          </div>
        </button>

        {/* Opción B — primera vez */}
        <button
          type="button"
          onClick={onRegistro}
          className="w-full flex items-start gap-4 p-5 rounded-2xl border-2 border-[#FFCD00] hover:bg-[#FFCD00] group transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FFCD00] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#213362]" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-black text-[#213362] text-sm">Es mi primera vez</p>
            <p className="text-xs text-gray-400 mt-0.5 group-hover:text-[#213362]/70 transition-colors">
              Crea tu perfil ligero en menos de un minuto
            </p>
          </div>
        </button>
      </div>

      <p className="text-center text-xs text-gray-300">
        No se requiere contraseña ni correo electrónico
      </p>
    </div>
  )
}

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL — AccessModal
───────────────────────────────────────────── */
export default function AccessModal({ onConfirmado }: AccessModalProps) {
  const [flujo, setFlujo] = useState<Flujo>('seleccion')
  const [perfilConfirmado, setPerfilConfirmado] = useState<PerfilLocal | null>(null)

  // Bloquear scroll mientras el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function handlePerfilConfirmado(perfil: PerfilLocal) {
    onConfirmado(perfil)
  }

  function handleRegistroOk(perfil: PerfilLocal, esNuevo: boolean) {
    if (esNuevo) {
      setPerfilConfirmado(perfil)
      setFlujo('confirmacion')
    } else {
      // Perfil recuperado (ya existía) → entrar directamente
      onConfirmado(perfil)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
        style={{ background: 'rgba(7, 29, 76, 0.6)', backdropFilter: 'blur(6px)' }}
        aria-modal="true"
        role="dialog"
      >
        {/* Card del modal */}
        <div
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          style={{ animation: 'modalEntrada 0.25s cubic-bezier(0.34,1.56,0.64,1) both' }}
        >
          {/* Franja tricolor superior */}
          <div className="flex h-1.5">
            <div className="flex-1 bg-[#FFCD00]" />
            <div className="flex-[0.5] bg-[#213362]" />
            <div className="flex-[0.5] bg-[#d80e25]" />
          </div>

          <div className="p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Image
                src="/logo-ungrd.png"
                alt="UNGRD — Herramienta"
                width={140}
                height={44}
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>

            {/* Contenido del flujo activo */}
            {flujo === 'seleccion' && (
              <FlujoSeleccion
                onCodigo={() => setFlujo('codigo')}
                onRegistro={() => setFlujo('registro')}
              />
            )}

            {flujo === 'codigo' && (
              <FlujoCodigo
                onConfirmado={handlePerfilConfirmado}
                onVolver={() => setFlujo('seleccion')}
              />
            )}

            {flujo === 'registro' && (
              <FlujoRegistro
                onConfirmado={handleRegistroOk}
                onVolver={() => setFlujo('seleccion')}
              />
            )}

            {flujo === 'confirmacion' && perfilConfirmado && (
              <FlujoCConfirmacion
                perfil={perfilConfirmado}
                onContinuar={() => onConfirmado(perfilConfirmado)}
              />
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalEntrada {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}
