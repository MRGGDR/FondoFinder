'use client'

import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { UNGRDLoader } from '@/components/ui/UNGRDLoader'
import { useLoader } from '@/hooks/useLoader'
import { useLightSession } from '@/context/LightSessionContext'

export function NavBar({ variant = 'hero' }: { variant?: 'hero' | 'light' }) {
  const isHero = variant === 'hero'
  const router = useRouter()
  const pathname = usePathname()
  const { estado: loader, mostrar: mostrarLoader, ocultar: ocultarLoader } = useLoader()
  const { esAdmin } = useLightSession()

  const navItems = [
    { title: 'Inicio', href: '/', heroIcon: '/icons/home.png' as string | null, lightIcon: '/icons/home_negro.png' as string | null, adminOnly: false },
    { title: 'Fondos', href: '/buscar-avanzado', heroIcon: '/icons/Fondos.png' as string | null, lightIcon: '/icons/Fondos_negro.png' as string | null, adminOnly: false },
    { title: 'Mapa', href: '/mapa', heroIcon: '/icons/mapa.png' as string | null, lightIcon: '/icons/mapa_negro.png' as string | null, adminOnly: true },
    { title: 'Admin', href: '/admin', heroIcon: '/icons/admin.png' as string | null, lightIcon: '/icons/admin_negro.png' as string | null, adminOnly: true },
  ].filter((item) => !item.adminOnly || esAdmin)

  useEffect(() => {
    ocultarLoader()
  }, [pathname, ocultarLoader])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingLeft: '48px',
        paddingRight: '64px',
        paddingTop: '18px',
        height: '92px',
      }}
    >
      <Image
        src={isHero ? '/logo-ungrd-blanco.png' : '/logo-ungrd.png'}
        alt="UNGRD"
        height={isHero ? 78 : 64}
        width={210}
        style={{
          objectFit: 'contain',
          objectPosition: 'left center',
          marginTop: '0px',
          display: 'block',
          filter: 'none',
        }}
        priority
      />

      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 6px',
        }}
      >
        {navItems.map((item, idx) => {
          const activo = pathname === item.href || (item.href === '/buscar-avanzado' && pathname === '/fondos')
          const activeDrop = isHero ? 'drop-shadow(0 6px 12px rgba(255,200,0,0.55))' : 'drop-shadow(0 6px 12px rgba(7,29,76,0.35))'
          const iconSrc = isHero ? item.heroIcon : item.lightIcon
          return (
            <button
              key={idx}
              type="button"
              aria-label={item.title}
              style={{
                border: '0',
                backgroundColor: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                padding: '6px 10px',
                borderRadius: '12px',
                transition: 'transform 0.2s ease, filter 0.2s ease, opacity 0.2s ease',
                cursor: 'pointer',
                opacity: activo ? 1 : 0.65,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.filter = activeDrop
                e.currentTarget.style.opacity = '1'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.filter = 'none'
                e.currentTarget.style.opacity = activo ? '1' : '0.65'
              }}
              onClick={() => {
                if (pathname === item.href) return
                mostrarLoader('navegando')
                router.push(item.href)
              }}
            >
              <Image
                src={iconSrc!}
                alt={item.title}
                width={26}
                height={26}
                style={{
                  filter: activo ? activeDrop : 'none',
                  objectFit: 'contain',
                }}
                priority={idx === 0}
              />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: activo ? 800 : 600,
                  color: isHero ? (activo ? '#FFCD00' : 'rgba(255,255,255,0.85)') : (activo ? '#213362' : '#555'),
                  letterSpacing: '0.01em',
                  lineHeight: 1,
                }}
              >
                {item.title}
              </span>
            </button>
          )
        })}
      </div>

      <div style={{ width: '180px' }} />
      <UNGRDLoader
        visible={loader.visible}
        contexto={loader.contexto}
        subTexto={loader.subTexto}
      />
    </div>
  )
}
