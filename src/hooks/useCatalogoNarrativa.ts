'use client'
/**
 * useCatalogoNarrativa — carga y cachea GET /api/catalogos/narrativa
 *
 * La API ya devuelve el catálogo agrupado por grupo (sujeto, verbo, predicado,
 * complemento, desastre, afectacion, alcance). Se cachea en memoria de módulo
 * para toda la sesión (los catálogos no cambian durante la visita).
 *
 * Uso:
 *   const { catalogo, cargando, error } = useCatalogoNarrativa()
 *   catalogo.sujeto        → TerminoNarrativo[]
 *   catalogo.predicado     → TerminoNarrativo[]
 *   ...
 */

import { useState, useEffect } from 'react'
import type { CatalogoNarrativa } from '@/types/database'

// Caché en memoria de módulo — persiste mientras la pestaña esté abierta.
// El servidor ya añade Cache-Control: s-maxage=3600 en la respuesta.
let _cache: CatalogoNarrativa | null = null
let _promesa: Promise<CatalogoNarrativa> | null = null

async function fetchCatalogo(): Promise<CatalogoNarrativa> {
  if (_promesa) return _promesa
  _promesa = fetch('/api/catalogos/narrativa')
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json() as Promise<CatalogoNarrativa>
    })
    .then(data => {
      _cache = data
      return data
    })
    .catch(err => {
      // Resetear promesa para permitir reintento en siguiente render
      _promesa = null
      throw err
    })
  return _promesa
}

interface UseCatalogoNarrativaResult {
  catalogo: CatalogoNarrativa | null
  cargando: boolean
  error: string | null
}

export function useCatalogoNarrativa(): UseCatalogoNarrativaResult {
  const [catalogo, setCatalogo] = useState<CatalogoNarrativa | null>(_cache)
  const [cargando, setCargando] = useState(!_cache)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (_cache) {
      setCatalogo(_cache)
      setCargando(false)
      return
    }
    let cancelado = false
    setCargando(true)
    fetchCatalogo()
      .then(data => {
        if (!cancelado) {
          setCatalogo(data)
          setCargando(false)
        }
      })
      .catch(err => {
        if (!cancelado) {
          setError((err as Error).message ?? 'Error al cargar catálogo')
          setCargando(false)
        }
      })
    return () => { cancelado = true }
  }, [])

  return { catalogo, cargando, error }
}
