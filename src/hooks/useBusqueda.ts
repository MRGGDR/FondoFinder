'use client'
import { useState, useEffect, useCallback } from 'react'
import type { ResultadoBusqueda } from '@/types/database'

export interface FiltrosBusqueda {
  query: string
  tipoFondo: string | null
  procesoIds: number[]
  beneficiarioIds: number[]
  objetivoIds: number[]
  presupuestoUSD: number | null
  pagina: number
}

const FILTROS_INICIALES: FiltrosBusqueda = {
  query: '',
  tipoFondo: null,
  procesoIds: [],
  beneficiarioIds: [],
  objetivoIds: [],
  presupuestoUSD: null,
  pagina: 1,
}

const LIMIT = 12
const CACHE_KEY = 'fondos_cache'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

function esFiltroInicial(filtros: FiltrosBusqueda): boolean {
  return (
    !filtros.query &&
    !filtros.tipoFondo &&
    filtros.procesoIds.length === 0 &&
    filtros.beneficiarioIds.length === 0 &&
    filtros.objetivoIds.length === 0 &&
    !filtros.presupuestoUSD &&
    filtros.pagina === 1
  )
}

export function useBusqueda() {
  const [filtros, setFiltrosState] = useState<FiltrosBusqueda>(FILTROS_INICIALES)
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([])
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usandoCache, setUsandoCache] = useState(false)

  // Debounce de 300ms solo en el campo query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filtros.query)
    }, 300)
    return () => clearTimeout(timer)
  }, [filtros.query])

  const buscar = useCallback(async () => {
    setCargando(true)
    setError(null)
    setUsandoCache(false)

    // Si es búsqueda inicial y no hay conexión, intentar usar caché
    if (esFiltroInicial(filtros) && typeof window !== 'undefined' && !navigator.onLine) {
      try {
        const raw = localStorage.getItem(CACHE_KEY)
        if (raw) {
          const { data, timestamp } = JSON.parse(raw) as { data: ResultadoBusqueda[]; timestamp: number }
          if (Date.now() - timestamp < CACHE_TTL_MS) {
            setResultados(data)
            setTotal(data[0]?.total_count ?? data.length)
            setUsandoCache(true)
            setCargando(false)
            return
          }
        }
      } catch { /* caché inválido, continuar con fetch */ }
    }

    try {
      const res = await fetch('/api/busqueda/catalogo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: debouncedQuery || null,
          tipo_fondo: filtros.tipoFondo || null,
          proceso_ids: filtros.procesoIds.length ? filtros.procesoIds : undefined,
          beneficiario_ids: filtros.beneficiarioIds.length ? filtros.beneficiarioIds : undefined,
          objetivo_ids: filtros.objetivoIds.length ? filtros.objetivoIds : undefined,
          presupuesto_usd: filtros.presupuestoUSD ?? null,
          limit: LIMIT,
          offset: (filtros.pagina - 1) * LIMIT,
        }),
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const json = await res.json() as { resultados: ResultadoBusqueda[]; total_count: number }
      const rows = json.resultados ?? []
      setResultados(rows)
      setTotal(json.total_count ?? rows[0]?.total_count ?? 0)

      // Guardar caché solo en búsqueda sin filtros (página 1)
      if (esFiltroInicial(filtros) && rows.length > 0 && typeof window !== 'undefined') {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: rows, timestamp: Date.now() }))
        } catch { /* localStorage puede estar lleno */ }
      }
      setCargando(false)
    } catch (fetchError) {
      // Si falla la red, intentar caché aunque sea la búsqueda inicial
      if (esFiltroInicial(filtros) && typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(CACHE_KEY)
          if (raw) {
            const { data: cachedData, timestamp } = JSON.parse(raw) as { data: ResultadoBusqueda[]; timestamp: number }
            if (Date.now() - timestamp < CACHE_TTL_MS) {
              setResultados(cachedData)
              setTotal(cachedData[0]?.total_count ?? cachedData.length)
              setUsandoCache(true)
              setCargando(false)
              return
            }
          }
        } catch { /* caché inválido */ }
      }
      setError(fetchError instanceof Error ? fetchError.message : 'Error de red')
      setResultados([])
      setTotal(0)
      setCargando(false)
    }
  }, [
    debouncedQuery,
    filtros,
  ])

  useEffect(() => {
    buscar()
  }, [buscar])

  // Actualiza un campo del estado; resetea la página a 1 excepto cuando se cambia la propia pagina
  const setFiltro = useCallback(
    <K extends keyof FiltrosBusqueda>(key: K, value: FiltrosBusqueda[K]) => {
      setFiltrosState(prev => ({
        ...prev,
        [key]: value,
        ...(key !== 'pagina' ? { pagina: 1 } : {}),
      }))
    },
    []
  )

  const resetFiltros = useCallback(() => {
    setFiltrosState(FILTROS_INICIALES)
    setDebouncedQuery('')
  }, [])

  const totalPaginas = Math.max(1, Math.ceil(total / LIMIT))

  return {
    resultados,
    total,
    cargando,
    error,
    filtros,
    setFiltro,
    resetFiltros,
    totalPaginas,
    usandoCache,
  }
}
