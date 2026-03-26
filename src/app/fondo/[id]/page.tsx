import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { FondoDetalle } from '@/components/fondos/FondoDetalle'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data } = await supabase
    .from('vista_fondo_detalle')
    .select('nombre')
    .eq('id', params.id)
    .single()
  return { title: data ? `${data.nombre} — FondosFinder` : 'Fondo no encontrado' }
}

export default async function FondoPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: fondo } = await supabase
    .from('vista_fondo_detalle')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!fondo) notFound()

  return <FondoDetalle fondo={fondo} />
}
