'use client'
/**
 * usePerfilConsulta — hook para gestionar el perfil público sin password.
 *
 * Flujo:
 *   1. Al montar, busca en localStorage si hay un perfil guardado.
 *   2. Expone crearORecuperar(payload) → llama POST /api/perfiles/crear-o-recuperar
 *      y persiste el resultado en localStorage.
 *   3. Expone recuperarPorCodigo(codigo) → llama POST /api/perfiles/recuperar-por-codigo
 *      y también persiste en localStorage si hay match.
 *   4. Expone cerrarPerfil() → limpia el localStorage.
 *
 * El hook NO depende de Supabase Auth.
 * El perfil guardado en localStorage se usa en BusquedaNarrativaParams.perfil_id.
 */

import { useState, useEffect, useCallback } from 'react'
import type { CrearPerfilPayload, PerfilConsultaRespuesta, ActualizarPerfilPayload } from '@/types/database'
import { STORAGE_KEY, persistirPerfilLocal, limpiarPerfilLocal, type PerfilLocal } from '@/lib/lightSession'

// Re-export for backward compatibility with components that import from this hook
export type { PerfilLocal } from '@/lib/lightSession'

export function usePerfilConsulta() {
  const [perfil, setPerfil] = useState<PerfilLocal | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Leer perfil del localStorage al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as PerfilLocal
        if (parsed.perfil_id && parsed.codigo_acceso) {
          setPerfil(parsed)
        }
      }
    } catch {
      // localStorage corrupto o no disponible
    }
  }, [])

  type RespuestaExtendida = PerfilConsultaRespuesta & {
    entidad?: string | null
    nombre_municipio?: string | null
    departamento?: string | null
  }

  const persistirPerfil = useCallback((respuesta: RespuestaExtendida): PerfilLocal => {
    const local = persistirPerfilLocal({
      perfil_id:        respuesta.perfil_id,
      codigo_acceso:    respuesta.codigo_acceso,
      nombre_contacto:  respuesta.nombre_contacto,
      municipio_id:     respuesta.municipio_id ?? null,
      nombre_municipio: respuesta.nombre_municipio ?? null,
      departamento:     respuesta.departamento ?? null,
      tipo_actor:       respuesta.tipo_actor,
      entidad:          respuesta.entidad ?? null,
    })
    setPerfil(local)
    return local
  }, [])

  const crearORecuperar = useCallback(
    async (payload: CrearPerfilPayload): Promise<PerfilLocal | null> => {
      setCargando(true)
      setError(null)
      try {
        const res = await fetch('/api/perfiles/crear-o-recuperar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string; detail?: string }
          const msg = [body.error, body.detail].filter(Boolean).join(' — ')
          throw new Error(msg || `HTTP ${res.status}`)
        }
        const respuesta = (await res.json()) as PerfilConsultaRespuesta
        return persistirPerfil(respuesta)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al crear perfil')
        return null
      } finally {
        setCargando(false)
      }
    },
    [persistirPerfil]
  )

  const recuperarPorCodigo = useCallback(
    async (codigo_acceso: string): Promise<PerfilLocal | null> => {
      setCargando(true)
      setError(null)
      try {
        const res = await fetch('/api/perfiles/recuperar-por-codigo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo_acceso }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(body.error ?? 'Código no encontrado')
        }
        const respuesta = (await res.json()) as PerfilConsultaRespuesta
        return persistirPerfil(respuesta)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al recuperar perfil')
        return null
      } finally {
        setCargando(false)
      }
    },
    [persistirPerfil]
  )

  const cerrarPerfil = useCallback(() => {
    limpiarPerfilLocal()
    setPerfil(null)
  }, [])

  const actualizarPerfil = useCallback(
    async (payload: ActualizarPerfilPayload): Promise<PerfilLocal | null> => {
      setCargando(true)
      setError(null)
      try {
        const res = await fetch('/api/perfiles/actualizar', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string; detail?: string }
          const msg = [body.error, body.detail].filter(Boolean).join(' — ')
          throw new Error(msg || `HTTP ${res.status}`)
        }
        const respuesta = await res.json()
        return persistirPerfil(respuesta)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al actualizar perfil')
        return null
      } finally {
        setCargando(false)
      }
    },
    [persistirPerfil]
  )

  return {
    perfil,
    cargando,
    error,
    crearORecuperar,
    recuperarPorCodigo,
    cerrarPerfil,
    actualizarPerfil,
    tienePerfil: perfil !== null,
  }
}
