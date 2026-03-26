'use client'
import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
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

    // createBrowserClient without Database generic so rpc() accepts Record<string, unknown>
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error: rpcError } = await supabase.rpc('buscar_fondos', {
      p_query: debouncedQuery || null,
      p_tipo_fondo: filtros.tipoFondo || null,
      p_proceso_ids: filtros.procesoIds.length ? filtros.procesoIds : null,
      p_beneficiario_ids: filtros.beneficiarioIds.length ? filtros.beneficiarioIds : null,
      p_objetivo_ids: filtros.objetivoIds.length ? filtros.objetivoIds : null,
      p_presupuesto_usd: filtros.presupuestoUSD,
      p_limit: LIMIT,
      p_offset: (filtros.pagina - 1) * LIMIT,
    })

    if (rpcError) {
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
      setError(rpcError.message)
      setResultados([])
      setTotal(0)
    } else {
      const rows = (data as ResultadoBusqueda[]) ?? []
      setResultados(rows)
      setTotal(rows[0]?.total_count ?? 0)

      // Guardar caché solo en búsqueda sin filtros (página 1)
      if (esFiltroInicial(filtros) && rows.length > 0 && typeof window !== 'undefined') {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: rows, timestamp: Date.now() }))
        } catch { /* localStorage puede estar lleno */ }
      }
    }
    setCargando(false)
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
