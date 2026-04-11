'use client'

import { usePathname } from 'next/navigation'
import { NavBar } from '@/components/layout/NavBar'

export function AppHeader() {
  const pathname = usePathname()

  if (pathname === '/' || pathname === '/buscar' || pathname === '/buscar-legacy') return null

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: '#fff',
        borderBottom: '1px solid rgba(7,29,76,0.08)',
        boxShadow: '0 1px 12px rgba(7,29,76,0.06)',
      }}
    >
      <NavBar variant="light" />
    </header>
  )
}
