'use client'
/**
 * /login — Redirige al inicio.
 * La identificación ahora ocurre a través del modal de acceso global (AccessGate).
 * Esta página se mantiene para no romper enlaces existentes.
 */
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/') }, [router])
  return null
}
