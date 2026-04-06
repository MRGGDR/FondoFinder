'use client'
/**
 * useBusquedaNarrativa — ejecuta POST /api/busqueda/narrativa
 *
 * Expone:
 *   buscar(params)  → dispara la búsqueda
 *   resultados      → ResultadoBusquedaNarrativa[]
 *   total           → bigint mapeado a number
 *   search_event_id → trazabilidad (puede ser null)
 *   cargando        → boolean
 *   error           → string | null
 *   limpiar()       → resetea resultados y error
 *
 * Integración con perfil: el caller pasa perfil_id desde usePerfilConsulta.
 * No gestiona el perfil internamente — responsabilidad única.
 */

import { useState, useCallback } from 'react'
import type { BusquedaNarrativaParams, ResultadoBusquedaNarrativa } from '@/types/database'

interface RespuestaNarrativa {
  resultados: ResultadoBusquedaNarrativa[]
  total_count: number
  search_event_id: string | null
}

interface UseBusquedaNarrativaResult {
  resultados: ResultadoBusquedaNarrativa[]
  total: number
  search_event_id: string | null
  cargando: boolean
  error: string | null
  buscar: (params: BusquedaNarrativaParams, append?: boolean) => Promise<void>
  limpiar: () => void
}

export function useBusquedaNarrativa(): UseBusquedaNarrativaResult {
  const [resultados, setResultados] = useState<ResultadoBusquedaNarrativa[]>([])
  const [total, setTotal] = useState(0)
  const [search_event_id, setSearchEventId] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buscar = useCallback(async (params: BusquedaNarrativaParams, append = false) => {
    setCargando(true)
    setError(null)

    try {
      const res = await fetch('/api/busqueda/narrativa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          limit: params.limit ?? 12,
          offset: params.offset ?? 0,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }

      const json = await res.json() as RespuestaNarrativa
      if (append) {
        setResultados(prev => [...prev, ...(json.resultados ?? [])])
      } else {
        setResultados(json.resultados ?? [])
      }
      setTotal(json.total_count ?? 0)
      setSearchEventId(json.search_event_id ?? null)
    } catch (err) {
      setError((err as Error).message ?? 'Error al buscar fondos')
      // En modo append no borramos los resultados ya cargados
      if (!append) {
        setResultados([])
        setTotal(0)
      }
      setSearchEventId(null)
    } finally {
      setCargando(false)
    }
  }, [])

  const limpiar = useCallback(() => {
    setResultados([])
    setTotal(0)
    setSearchEventId(null)
    setError(null)
  }, [])

  return { resultados, total, search_event_id, cargando, error, buscar, limpiar }
}
