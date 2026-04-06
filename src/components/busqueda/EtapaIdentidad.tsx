'use client'
/**
 * EtapaIdentidad — captura o muestra perfil de consulta ligero
 *
 * Recibe las funciones del hook usePerfilConsulta desde el padre para
 * mantener una sola instancia del hook en FlujoBuscadorNarrativo.
 *
 * Estados visuales:
 *   A) Perfil ya activo  → muestra nombre + código + botón continuar
 *   B) Sin perfil        → tabs "Crear perfil" / "Ya tengo código"
 *
 * Props
 *   perfil, cargando, error  → del hook (ya evaluados)
 *   crearORecuperar          → POST /api/perfiles/crear-o-recuperar
 *   recuperarPorCodigo       → POST /api/perfiles/recuperar-por-codigo
 *   cerrarPerfil             → limpia localStorage
 *   onContinuar              → revela etapa sujeto
 *   onSaltar                 → revela etapa sujeto sin perfil
 */

import { useState } from 'react'
import type { PerfilLocal } from '@/hooks/usePerfilConsulta'
import type { CrearPerfilPayload } from '@/types/database'

// Re-export for FlujoBuscadorNarrativo to use as prop types
export type { PerfilLocal }

interface Props {
  perfil: PerfilLocal | null
  cargando: boolean
  error: string | null
  crearORecuperar: (payload: CrearPerfilPayload) => Promise<PerfilLocal | null>
  recuperarPorCodigo: (codigo: string) => Promise<PerfilLocal | null>
  cerrarPerfil: () => void
  onContinuar: () => void
  onSaltar: () => void
}

const TIPO_ACTOR_OPCIONES = [
  { value: '', label: 'Sin especificar' },
  { value: 'municipio', label: 'Municipio' },
  { value: 'gobernacion', label: 'Gobernación / Departamento' },
  { value: 'ong', label: 'ONG / Organización civil' },
  { value: 'empresa', label: 'Empresa privada' },
  { value: 'gobierno_nacional', label: 'Gobierno nacional / Entidad pública' },
  { value: 'academia', label: 'Academia / Universidad' },
  { value: 'otro', label: 'Otro' },
]

/** Vista A: perfil ya activo */
function PerfilActivo({
  perfil,
  onContinuar,
  onCambiar,
}: {
  perfil: PerfilLocal
  onContinuar: () => void
  onCambiar: () => void
}) {
  const inicial = (perfil.nombre_contacto ?? '?').charAt(0).toUpperCase()
  return (
    <section className="bg-[#1a2d55] py-10 border-b border-[#07519D]/40">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Avatar inicial */}
            <div className="w-12 h-12 bg-[#FFCD00] rounded-full flex items-center justify-center
              text-[#213362] font-black text-xl shrink-0">
              {inicial}
            </div>
            <div>
              <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-0.5">
                Perfil activo
              </p>
              <p className="text-white font-black text-lg leading-none">
                {perfil.nombre_contacto}
              </p>
              <p className="text-[#FFCD00] text-sm font-mono font-bold mt-0.5">
                {perfil.codigo_acceso}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onContinuar}
              className="bg-[#FFCD00] text-[#213362] font-black px-8 py-3 rounded-xl
                hover:bg-[#f0c000] transition-colors"
            >
              Continuar →
            </button>
            <button
              onClick={onCambiar}
              className="border-2 border-white/20 text-white/50 font-bold px-5 py-3
                rounded-xl hover:border-white/50 hover:text-white transition-colors text-sm"
            >
              Cambiar
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Vista B: formulario crear / recuperar */
function FormularioPerfil({
  cargando,
  error,
  crearORecuperar,
  recuperarPorCodigo,
  onContinuar,
  onSaltar,
}: Pick<Props, 'cargando' | 'error' | 'crearORecuperar' | 'recuperarPorCodigo' | 'onContinuar' | 'onSaltar'>) {
  const [modo, setModo] = useState<'crear' | 'recuperar'>('crear')
  const [nombre, setNombre] = useState('')
  const [tipoActor, setTipoActor] = useState('')
  const [codigo, setCodigo] = useState('')
  // intentado: si se hizo un intento en el modo actual. Se resetea al cambiar de tab
  // para no mostrar el error del modo anterior.
  const [intentado, setIntentado] = useState(false)

  function cambiarModo(m: 'crear' | 'recuperar') {
    setModo(m)
    setIntentado(false)  // el error de un tab no debe verse en el otro
  }

  async function handleCrear() {
    if (!nombre.trim()) return
    setIntentado(true)
    const resultado = await crearORecuperar({
      nombre_contacto: nombre.trim(),
      tipo_actor: tipoActor || null,
      canal_registro: 'web',
    })
    if (resultado) onContinuar()
  }

  async function handleRecuperar() {
    if (!codigo.trim()) return
    setIntentado(true)
    const resultado = await recuperarPorCodigo(codigo.trim())
    if (resultado) onContinuar()
  }

  // El error solo se muestra si en el modo actual se hizo al menos un intento
  const errorVisible = intentado ? error : null

  return (
    <section className="bg-[#213362] py-20 border-b border-[#07519D]/40" aria-labelledby="etapa-identidad-titulo">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row gap-16 items-start">

          {/* Texto izquierda */}
          <div className="w-full md:w-1/3 shrink-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FFCD00] mb-4">
              Opcional · Identidad
            </p>
            <h2 id="etapa-identidad-titulo" className="text-3xl font-black text-white leading-tight mb-4">
              ¿Con quién hablo?
            </h2>
            <p className="text-white/50 text-sm leading-relaxed mb-8">
              Tu nombre nos ayuda a guardar esta búsqueda y darte un código
              para retomar o compartir los resultados más tarde.
            </p>
            <button
              onClick={onSaltar}
              className="text-xs font-bold text-white/30 underline underline-offset-2
                hover:text-white/60 transition-colors"
            >
              Saltar este paso →
            </button>
          </div>

          {/* Formulario derecha */}
          <div className="flex-1 max-w-md">
            {/* Tabs */}
            <div className="flex gap-1 bg-white/10 p-1 rounded-xl mb-8 w-fit">
              {(['crear', 'recuperar'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => cambiarModo(m)}
                  className={[
                    'px-6 py-2 rounded-lg text-sm font-black transition-all',
                    modo === m ? 'bg-white text-[#213362]' : 'text-white/60 hover:text-white',
                  ].join(' ')}
                >
                  {m === 'crear' ? 'Crear perfil' : 'Ya tengo código'}
                </button>
              ))}
            </div>

            {modo === 'crear' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCrear()}
                    placeholder="Tu nombre o el de tu entidad"
                    className="w-full border-2 border-white/20 bg-white/10 rounded-xl px-4 py-3
                      text-white placeholder-white/30 font-bold
                      focus:outline-none focus:border-[#FFCD00] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">
                    Tipo de actor (opcional)
                  </label>
                  <select
                    value={tipoActor}
                    onChange={e => setTipoActor(e.target.value)}
                    className="w-full border-2 border-white/20 bg-[#213362] rounded-xl px-4 py-3
                      text-white font-bold focus:outline-none focus:border-[#FFCD00] transition-colors"
                  >
                    {TIPO_ACTOR_OPCIONES.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {errorVisible && (
                  <p className="text-red-400 text-sm font-bold">{errorVisible}</p>
                )}

                <button
                  onClick={handleCrear}
                  disabled={!nombre.trim() || cargando}
                  className="w-full bg-[#FFCD00] text-[#213362] font-black py-3 rounded-xl
                    hover:bg-[#f0c000] transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cargando ? 'Creando perfil...' : 'Crear y continuar →'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">
                    Código de acceso
                  </label>
                  <input
                    type="text"
                    value={codigo}
                    onChange={e => setCodigo(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleRecuperar()}
                    placeholder="ej. FF-ABCD"
                    className="w-full border-2 border-white/20 bg-white/10 rounded-xl px-4 py-3
                      text-white placeholder-white/30 font-black font-mono tracking-[0.2em] uppercase
                      focus:outline-none focus:border-[#FFCD00] transition-colors"
                  />
                </div>

                {errorVisible && (
                  <p className="text-red-400 text-sm font-bold">{errorVisible}</p>
                )}

                <button
                  onClick={handleRecuperar}
                  disabled={!codigo.trim() || cargando}
                  className="w-full bg-white text-[#213362] font-black py-3 rounded-xl
                    hover:bg-white/90 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cargando ? 'Buscando...' : 'Recuperar y continuar →'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Componente público — delega a PerfilActivo o FormularioPerfil */
export function EtapaIdentidad({
  perfil, cargando, error,
  crearORecuperar, recuperarPorCodigo, cerrarPerfil,
  onContinuar, onSaltar,
}: Props) {
  if (perfil) {
    return (
      <PerfilActivo
        perfil={perfil}
        onContinuar={onContinuar}
        onCambiar={cerrarPerfil}  // limpiar perfil vuelve a FormularioPerfil en siguiente render
      />
    )
  }

  return (
    <FormularioPerfil
      cargando={cargando}
      error={error}
      crearORecuperar={crearORecuperar}
      recuperarPorCodigo={recuperarPorCodigo}
      onContinuar={onContinuar}
      onSaltar={onSaltar}
    />
  )
}
