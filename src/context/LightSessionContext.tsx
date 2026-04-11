'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  leerPerfilLocal,
  esPerfilLocalValido,
  limpiarPerfilLocal,
  type PerfilLocal,
} from '@/lib/lightSession'

interface LightSessionState {
  perfil: PerfilLocal | null
  esAdmin: boolean
  abrirModal: () => void
  cerrarModal: () => void
  modalAbierto: boolean
  onPerfilConfirmado: (perfil: PerfilLocal) => void
  cerrarSesion: () => void
}

const LightSessionContext = createContext<LightSessionState | null>(null)

export function LightSessionProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<PerfilLocal | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const esAdmin = perfil?.es_admin === true

  // Al montar en el cliente: verificar localStorage
  useEffect(() => {
    try {
      const local = leerPerfilLocal()
      if (esPerfilLocalValido(local)) {
        setPerfil(local)
      } else {
        limpiarPerfilLocal()
        setModalAbierto(true)
      }
    } catch {
      setModalAbierto(true)
    }
  }, [])

  const abrirModal = useCallback(() => setModalAbierto(true), [])

  const cerrarModal = useCallback(() => {
    if (perfil) setModalAbierto(false)
  }, [perfil])

  const onPerfilConfirmado = useCallback((nuevoPerfil: PerfilLocal) => {
    setPerfil(nuevoPerfil)
    setModalAbierto(false)
  }, [])

  const cerrarSesion = useCallback(() => {
    limpiarPerfilLocal()
    setPerfil(null)
    setModalAbierto(true)
  }, [])

  return (
    <LightSessionContext.Provider value={{
      perfil,
      esAdmin,
      abrirModal,
      cerrarModal,
      modalAbierto,
      onPerfilConfirmado,
      cerrarSesion,
    }}>
      {children}
    </LightSessionContext.Provider>
  )
}

export function useLightSession(): LightSessionState {
  const ctx = useContext(LightSessionContext)
  if (!ctx) throw new Error('useLightSession debe usarse dentro de LightSessionProvider')
  return ctx
}
