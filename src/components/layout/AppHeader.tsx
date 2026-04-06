'use client'

import { usePathname } from 'next/navigation'
import { NavBar } from './NavBar'

export function AppHeader() {
  const pathname = usePathname()
  // Páginas con hero propio y nav interna (no muestran el AppHeader global)
  if (pathname === '/' || pathname === '/buscar') return null

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: '#fff',
      borderBottom: '1px solid rgba(7,29,76,0.08)',
      boxShadow: '0 1px 12px rgba(7,29,76,0.06)',
    }}>
      <NavBar variant="light" />
    </header>
  )
}
