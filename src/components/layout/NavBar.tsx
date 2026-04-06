'use client'

import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { UNGRDLoader } from '@/components/ui/UNGRDLoader'
import { useLoader } from '@/hooks/useLoader'

export function NavBar({ variant = 'hero' }: { variant?: 'hero' | 'light' }) {
  const isHero = variant === 'hero'
  const router = useRouter()
  const pathname = usePathname()
  const { estado: loader, mostrar: mostrarLoader, ocultar: ocultarLoader } = useLoader()

  // Apagar el loader cuando la ruta cambia (la navegación terminó)
  useEffect(() => {
    ocultarLoader()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingLeft: '48px',
      paddingRight: '64px',
      paddingTop: '18px',
      height: '92px',
    }}>
      {/* Logo */}
      <Image
        src={isHero ? "/logo-ungrd-blanco.png" : "/logo-ungrd.png"}
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

      {/* Botonera de iconos sueltos */}
      <div style={{
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '0 6px',
      }}>
        {[
          { title: 'Inicio', href: '/', heroIcon: '/icons/home.png' as string | null, lightIcon: '/icons/home_negro.png' as string | null },
          { title: 'Fondos', href: '/buscar-avanzado', heroIcon: '/icons/Fondos.png' as string | null, lightIcon: '/icons/Fondos_negro.png' as string | null },
          { title: 'Mapa', href: '/mapa', heroIcon: '/icons/mapa.png' as string | null, lightIcon: '/icons/mapa_negro.png' as string | null },
          { title: 'Admin', href: '/admin', heroIcon: '/icons/admin.png' as string | null, lightIcon: '/icons/admin_negro.png' as string | null },
        ].map((item, idx) => {
          const activo = pathname === item.href || (item.href === '/buscar-avanzado' && pathname === '/fondos')
          const baseColor = isHero ? '#ffffff' : '#071d4c'
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
              color: baseColor,
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
              mostrarLoader('cargando')
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
        )})}
      </div>

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
