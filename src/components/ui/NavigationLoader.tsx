'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { UNGRDLoader } from './UNGRDLoader'
import { useLoader } from '@/hooks/useLoader'

/**
 * Muestra el UNGRDLoader durante navegaciones entre páginas.
 * Detecta clics en enlaces internos → activa el loader.
 * Cuando usePathname() cambia (nueva página cargada) → oculta.
 */
export function NavigationLoader() {
  const pathname = usePathname()
  const { estado, mostrar, ocultar } = useLoader()
  const prevPathRef = useRef(pathname)
  const loadingRef = useRef(false)

  // Ocultar cuando la ruta efectivamente cambió
  useEffect(() => {
    if (loadingRef.current && prevPathRef.current !== pathname) {
      loadingRef.current = false
      ocultar()
    }
    prevPathRef.current = pathname
  }, [pathname, ocultar])

  // Mostrar al hacer clic en un enlace interno
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Ignorar si hay modificadores (abrir en pestaña, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      // Solo rutas internas que realmente naveguen a otra página
      const isInternal = href.startsWith('/') && !href.startsWith('//')
      if (!isInternal) return

      // No activar loader en links de descarga (PDF, etc.)
      if (anchor.hasAttribute('download')) return

      // No mostrar si es la misma ruta
      const targetPath = href.split('?')[0].split('#')[0]
      if (targetPath === pathname) return

      loadingRef.current = true
      mostrar('navegando')
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [pathname, mostrar])

  return <UNGRDLoader visible={estado.visible} contexto={estado.contexto} />
}
