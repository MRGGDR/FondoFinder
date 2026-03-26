'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { UNGRDLoader } from '@/components/ui/UNGRDLoader'
import { useLoader } from '@/hooks/useLoader'

const LINKS = [
  { href: '/',       label: 'Inicio' },
  { href: '/fondos', label: 'Fondos' },
  { href: '/mapa',   label: 'Mapa' },
  { href: '/admin',  label: 'Admin' },
]

export function NavBar({ variant = 'hero' }: { variant?: 'hero' | 'light' }) {
  const pathname = usePathname()
  const isHero = variant === 'hero'
  const router = useRouter()
  const { estado: loader, mostrar: mostrarLoader, ocultar: ocultarLoader } = useLoader()

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      paddingLeft: '48px',
      paddingRight: '64px',
      paddingTop: '0px',
      height: '72px',
    }}>
      {/* Logo */}
      <Image
        src={isHero ? "/logo-ungrd-blanco.png" : "/logo-ungrd.png"}
        alt="UNGRD"
        height={64}
        width={210}
        style={{
          objectFit: 'contain',
          objectPosition: 'left center',
          marginTop: '4px',
          display: 'block',
          filter: 'none',
        }}
        priority
      />

      {/* Links de navegación */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        gap: '4px',
        marginLeft: 'auto',
      }}>
        {LINKS.map(link => {
          const isActive = pathname === link.href
          const baseColor = isHero ? 'rgba(255,255,255,0.45)' : 'rgba(7,29,76,0.4)'
          const activeColor = isHero ? '#ffffff' : '#071d4c'
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => {
                e.preventDefault()
                if (pathname === link.href) return
                mostrarLoader('buscando')
                router.push(link.href)
                // loader se desmonta al cambiar de página; no se necesita ocultar aquí
              }}
              style={{
                color: isActive ? activeColor : baseColor,
                fontSize: '13px',
                fontWeight: 600,
                padding: '0 18px 16px',
                borderBottom: isActive
                  ? '2px solid #FFCD00'
                  : '2px solid transparent',
                background: 'none',
                borderRadius: '0',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                letterSpacing: '0.3px',
                transition: 'color 0.15s',
                display: 'block',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = activeColor
                e.currentTarget.style.borderBottomColor = '#FFCD00'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = isActive ? activeColor : baseColor
                e.currentTarget.style.borderBottomColor = isActive ? '#FFCD00' : 'transparent'
              }}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* Espacio derecho — sin botón de ingresar */}
      <div style={{ width: '180px' }} />
      <UNGRDLoader
        visible={loader.visible}
        contexto={loader.contexto}
        subTexto={loader.subTexto}
      />
    </div>
  )
}
