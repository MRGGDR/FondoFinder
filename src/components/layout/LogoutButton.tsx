'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-1.5 rounded-lg border border-white/30 text-white/80 hover:border-ungrd-yellow hover:text-ungrd-yellow transition-colors font-semibold text-xs"
    >
      Salir
    </button>
  )
}
