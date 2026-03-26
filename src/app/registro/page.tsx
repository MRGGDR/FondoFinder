'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Municipio } from '@/types/database'

export default function RegistroPage() {
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [busquedaMunicipio, setBusquedaMunicipio] = useState('')
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState<Municipio | null>(null)
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const [buscandoMunicipios, setBuscandoMunicipios] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Buscar municipios con debounce
  useEffect(() => {
    if (busquedaMunicipio.trim().length < 2) {
      setMunicipios([])
      return
    }
    const timer = setTimeout(async () => {
      setBuscandoMunicipios(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('municipios')
        .select('*')
        .ilike('nombre', `%${busquedaMunicipio}%`)
        .limit(20)
      setMunicipios(data ?? [])
      setBuscandoMunicipios(false)
      setMostrarDropdown(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [busquedaMunicipio])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMostrarDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!municipioSeleccionado) {
      setError('Selecciona un municipio de la lista.')
      return
    }
    setCargando(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password: crypto.randomUUID(),
      options: {
        data: {
          municipio_id: municipioSeleccionado.id,
          nombre_contacto: nombre,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
    } else {
      setEnviado(true)
    }
    setCargando(false)
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-lg p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-extrabold text-ungrd-navy">Registro de municipio</h1>
          <p className="text-sm text-ungrd-gray">Una cuenta por municipio</p>
        </div>

        {enviado ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-1">
            <p className="text-green-700 font-semibold text-sm">✅ Cuenta creada</p>
            <p className="text-green-600 text-sm">
              Revisa tu correo en <span className="font-semibold">{email}</span> para confirmar
              tu cuenta.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-ungrd-navy mb-1">
                Email institucional
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@entidad.gov.co"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-ungrd-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ungrd-blue-light text-sm"
              />
            </div>

            <div>
              <label htmlFor="nombre" className="block text-sm font-semibold text-ungrd-navy mb-1">
                Nombre del contacto
              </label>
              <input
                id="nombre"
                type="text"
                required
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Nombre completo"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-ungrd-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ungrd-blue-light text-sm"
              />
            </div>

            {/* Selector de municipio */}
            <div ref={dropdownRef} className="relative">
              <label htmlFor="municipio" className="block text-sm font-semibold text-ungrd-navy mb-1">
                Municipio
              </label>
              {municipioSeleccionado ? (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-ungrd-blue-mid bg-blue-50 text-sm">
                  <span className="text-ungrd-navy font-medium">
                    {municipioSeleccionado.nombre} — {municipioSeleccionado.departamento}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMunicipioSeleccionado(null)
                      setBusquedaMunicipio('')
                    }}
                    className="text-ungrd-gray hover:text-red-500 ml-2 font-bold"
                    aria-label="Cambiar municipio"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ungrd-gray pointer-events-none text-sm">
                      🔍
                    </span>
                    <input
                      id="municipio"
                      type="text"
                      value={busquedaMunicipio}
                      onChange={e => setBusquedaMunicipio(e.target.value)}
                      onFocus={() => municipios.length > 0 && setMostrarDropdown(true)}
                      placeholder="Buscar municipio..."
                      autoComplete="off"
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-ungrd-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ungrd-blue-light text-sm"
                    />
                  </div>
                  {mostrarDropdown && municipios.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto text-sm">
                      {municipios.map(m => (
                        <li
                          key={m.id}
                          onClick={() => {
                            setMunicipioSeleccionado(m)
                            setBusquedaMunicipio('')
                            setMostrarDropdown(false)
                          }}
                          className="px-4 py-2.5 hover:bg-ungrd-navy/5 cursor-pointer text-ungrd-navy"
                        >
                          <span className="font-medium">{m.nombre}</span>
                          <span className="text-ungrd-gray"> — {m.departamento}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {buscandoMunicipios && (
                    <p className="text-xs text-ungrd-gray mt-1 px-1">Buscando...</p>
                  )}
                  {!buscandoMunicipios && busquedaMunicipio.length >= 2 && municipios.length === 0 && (
                    <p className="text-xs text-ungrd-gray mt-1 px-1">Sin resultados para &ldquo;{busquedaMunicipio}&rdquo;</p>
                  )}
                </>
              )}
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={cargando || !municipioSeleccionado}
              className="w-full py-3 rounded-xl bg-ungrd-yellow text-ungrd-navy font-bold text-sm hover:bg-yellow-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        )}

        <div className="border-t border-gray-100 pt-4 text-center text-sm text-ungrd-gray">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-ungrd-blue-mid hover:underline font-medium">
            Inicia sesión
          </Link>
        </div>
      </div>
    </main>
  )
}
