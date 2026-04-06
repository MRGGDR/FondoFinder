import { getDb } from '@/lib/db'
import { notFound } from 'next/navigation'
import { FondoDetalle } from '@/components/fondos/FondoDetalle'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const db = getDb()
  // MIGRATION NOTE: SELECT nombre FROM vista_fondo_detalle WHERE id = $1
  const { data, error } = await db
    .from('vista_fondo_detalle')
    .select('nombre')
    .eq('id', params.id)
    .single()
  const nombre = (!error && data) ? (data as { nombre: string }).nombre : null
  return { title: nombre ? `${nombre} — FondosFinder` : 'Fondo no encontrado' }
}

export default async function FondoPage({ params }: { params: { id: string } }) {
  const db = getDb()
  // MIGRATION NOTE: SELECT * FROM vista_fondo_detalle WHERE id = $1
  const { data: fondo } = await db
    .from('vista_fondo_detalle')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!fondo) notFound()

  return <FondoDetalle fondo={fondo} />
}
