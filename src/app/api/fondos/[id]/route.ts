/**
 * GET /api/fondos/[id]
 *
 * Devuelve el detalle completo de un fondo desde vista_fondo_detalle.
 * Incluye los campos v2: tags_visibles, tiene_instructivo, tiene_modelo_aplicacion.
 *
 * Este endpoint NO requiere autenticación (ruta pública).
 *
 * MIGRACIÓN A POSTGRESQL PURO:
 *   Reemplazar .from('vista_fondo_detalle') por:
 *     SELECT * FROM public.vista_fondo_detalle WHERE id = $1
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id es requerido' }, { status: 400 })
  }

  try {
    const db = getDb()

    // MIGRATION NOTE: SELECT * FROM public.vista_fondo_detalle WHERE id = $1 LIMIT 1
    const { data, error } = await db
      .from('vista_fondo_detalle')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      if (error?.code === 'PGRST116') {
        return NextResponse.json({ error: 'Fondo no encontrado' }, { status: 404 })
      }
      console.error(`[/api/fondos/${id}]`, error?.message)
      return NextResponse.json({ error: 'Error al obtener el fondo' }, { status: 500 })
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (e) {
    console.error(`[/api/fondos/${id}] error`, e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
