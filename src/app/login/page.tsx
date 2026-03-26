'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
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
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/logo-ungrd.png"
            alt="Logo UNGRD"
            width={56}
            height={56}
            className="object-contain"
          />
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-xl font-extrabold text-ungrd-navy">Ingresa a FondosFinder</h1>
          <p className="text-sm text-ungrd-gray">Acceso con enlace mágico — sin contraseña</p>
        </div>

        {enviado ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-1">
            <p className="text-green-700 font-semibold text-sm">✅ Enlace enviado</p>
            <p className="text-green-600 text-sm">
              Revisa tu correo — enviamos un enlace de acceso a{' '}
              <span className="font-semibold">{email}</span>.
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

            {error && (
              <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 rounded-xl bg-ungrd-yellow text-ungrd-navy font-bold text-sm hover:bg-yellow-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cargando ? 'Enviando...' : 'Enviar enlace de acceso'}
            </button>
          </form>
        )}

        <div className="border-t border-gray-100 pt-4 text-center text-sm text-ungrd-gray">
          ¿Primera vez?{' '}
          <Link href="/registro" className="text-ungrd-blue-mid hover:underline font-medium">
            Regístrate aquí
          </Link>
        </div>
      </div>
    </main>
  )
}
