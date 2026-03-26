import { createClient } from '@/lib/supabase/server'
import FondosGrid from '@/components/fondos/FondosGrid'

export const metadata = { title: 'Fondos - FondosFinder' }

export default async function FondosPage() {
  const supabase = createClient()
  const { data: fondos } = await supabase
    .from('vista_fondo_detalle')
    .select('id, nombre, tipo_fondo_categoria, entidad_encargada, monto_min_usd, monto_max_usd, procesos')
    .order('nombre')

  return (
    <div className="min-h-screen bg-[#f6fafe] pb-20">

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#213362]">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,#4f8ecf,transparent_35%),radial-gradient(circle_at_80%_10%,#ffcd00,transparent_28%)]" />
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-14 relative">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60 mb-3">
            Catálogo completo
          </p>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
            {fondos?.length ?? 32} Fuentes de Financiamiento
          </h1>
          <p className="text-white/60 text-sm md:text-base mt-3 max-w-3xl leading-relaxed">
            Nacionales, territoriales e internacionales para la gestión del riesgo de desastres.
          </p>
        </div>
        <div className="h-1.5 flex">
          <div className="w-1/2 bg-[#FFCD00]" />
          <div className="w-1/4 bg-[#223a7a]" />
          <div className="w-1/4 bg-[#d80e25]" />
        </div>
      </section>

      {/* Grid con filtros flotantes */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 mt-10">
        <FondosGrid fondos={fondos ?? []} />
      </section>
    </div>
  )
}
