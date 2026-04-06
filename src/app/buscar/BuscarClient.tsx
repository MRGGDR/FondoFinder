'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WizardTop5 } from '@/components/buscador-top5/WizardTop5'
import { HeroBuscador } from '@/components/busqueda/HeroBuscador'

export default function BuscarClient() {
  const router = useRouter()
  const [iniciado, setIniciado] = useState(false)
  const wizardRef = useRef<HTMLDivElement>(null)

  const comenzar = () => {
    setIniciado(true)
    setTimeout(() => {
      wizardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  return (
    <div className="min-h-screen bg-[#f6fafe]">
      <HeroBuscador
        onComenzar={comenzar}
        ctaVariant="triple"
        onBuscadorAvanzado={() => router.push('/buscar-avanzado')}
      />

      <div ref={wizardRef}>
        {iniciado && <WizardTop5 variant="embedded" showHeader={false} />}
      </div>
    </div>
  )
}
