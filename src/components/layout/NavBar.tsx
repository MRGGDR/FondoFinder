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
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '0',
                backgroundColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s ease, filter 0.2s ease, opacity 0.2s ease',
                cursor: 'pointer',
                opacity: activo ? 1 : 0.7,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.filter = activeDrop
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.filter = 'none'
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
                width={28}
                height={28}
                style={{
                  filter: activo ? activeDrop : 'none',
                  objectFit: 'contain',
                }}
                priority={idx === 0}
              />
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
