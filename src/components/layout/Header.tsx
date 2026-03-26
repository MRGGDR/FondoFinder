import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './LogoutButton'

export default async function Header() {
  let user = null
  let municipioLabel: string | null = null

  try {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user

    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: municipioData } = await (supabase as any)
        .from('vista_usuario_municipio')
        .select('municipio_nombre, municipio_departamento')
        .eq('id', user.id)
        .single()
      if (municipioData) {
        municipioLabel = `${municipioData.municipio_nombre}, ${municipioData.municipio_departamento}`
      }
    }
  } catch {
    // Si Supabase no está disponible, el Header igual renderiza sin info de usuario
  }

  return (
    <header className="fixed top-0 w-full z-50 h-[60px] flex items-center
      justify-between px-10 bg-[#213362]/60 backdrop-blur-md
      border-b border-white/[0.06]">

      {/* Logo + nombre */}
      <Link href="/" className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#FFCD00] rounded-[7px] flex items-center
          justify-center font-black text-[13px] text-[#213362] select-none">
          F
        </div>
        <span className="text-white font-extrabold text-base tracking-tight">
          Fondos<span className="text-[#FFCD00]">Finder</span>
        </span>
      </Link>

      {/* Derecha */}
      <div className="flex items-center gap-3">
        {user && municipioLabel ? (
          <div className="hidden md:flex items-center gap-2 text-[#FFCD00]
            text-[10px] font-bold tracking-wide">
            📍 {municipioLabel}
          </div>
        ) : (
          <span className="hidden md:block bg-white/[0.08] border border-white/[0.12]
            text-white/50 text-[10px] font-bold px-3 py-1 rounded-full
            tracking-wide">
            UNGRD Colombia
          </span>
        )}
        {user ? (
          <LogoutButton />
        ) : (
          <Link
            href="/login"
            className="bg-[#FFCD00] text-[#213362] text-[11px] font-black
              px-5 py-[7px] rounded-full uppercase tracking-[0.5px]
              hover:brightness-110 transition-all"
          >
            Ingresar
          </Link>
        )}
      </div>
    </header>
  )
}
