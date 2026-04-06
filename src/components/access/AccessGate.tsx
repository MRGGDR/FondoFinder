'use client'

import { useLightSession } from '@/context/LightSessionContext'
import AccessModal from '@/components/access/AccessModal'

export default function AccessGate({ children }: { children: React.ReactNode }) {
  const { modalAbierto, onPerfilConfirmado } = useLightSession()

  return (
    <>
      {children}
      {modalAbierto && <AccessModal onConfirmado={onPerfilConfirmado} />}
    </>
  )
}
