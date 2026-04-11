'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useLightSession } from '@/context/LightSessionContext'

const MapaAdminDashboard = dynamic(() => import('@/components/admin/MapaAdminDashboard'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[70vh] bg-[#f6fafe] flex items-center justify-center">
      <p className="text-sm text-[#213362] animate-pulse">Cargando panel territorial...</p>
    </div>
  ),
})

export default function MapaPage() {
  const { perfil, esAdmin } = useLightSession()

  if (!perfil) return null

  if (!esAdmin) {
    return (
      <div className="min-h-[70vh] bg-[#f6fafe]">
        <div className="max-w-3xl mx-auto px-6 py-14">
          <div className="bg-white border border-[#e4e9f1] rounded-3xl p-8 shadow-[0_10px_28px_-16px_rgba(7,29,76,0.25)]">
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.12em] bg-[#d80e25] text-white px-3 py-1 rounded-full mb-4">
              Restringido
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-[#213362] leading-tight mb-2">
              Acceso solo para administrador
            </h1>
            <p className="text-sm md:text-base text-[#5c6680] leading-relaxed mb-6">
              El mapa y la analitica territorial solo estan habilitados para el usuario admin.
            </p>
            <Link
              href="/"
              className="inline-flex items-center rounded-xl bg-[#213362] text-white font-bold text-sm px-4 py-2.5 hover:bg-[#1B4472] transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <MapaAdminDashboard />
}
