import { notFound } from 'next/navigation'
import { getDb } from '@/lib/db'
import { FondoDetalle } from '@/components/fondos/FondoDetalle'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const db = getDb()
  const { data } = await db
    .from('vista_fondo_detalle')
    .select('nombre')
    .eq('id', params.id)
    .single()

  return {
    title: data?.nombre ? `${data.nombre} | Financiamiento PNGRD` : 'Fondo no encontrado | Financiamiento PNGRD',
  }
}

export default async function FondoPage({ params }: { params: { id: string } }) {
  const db = getDb()
  const { data: fondo } = await db
    .from('vista_fondo_detalle')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!fondo) notFound()

  return <FondoDetalle fondo={fondo as any} />
}
