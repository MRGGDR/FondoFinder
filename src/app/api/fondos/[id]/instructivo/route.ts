/**
 * GET /api/fondos/[id]/instructivo
 *
 * Devuelve la ficha paso a paso del fondo desde fondos_instructivos.
 * Incluye pasos_json, requisitos_json y checklist_documentos.
 *
 * Devuelve 404 si el fondo no tiene instructivo registrado.
 *
 * MIGRACIÓN A POSTGRESQL PURO:
 *   Reemplazar .from('fondos_instructivos') por:
 *     SELECT * FROM public.fondos_instructivos WHERE fondo_id = $1
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

    // MIGRATION NOTE: SELECT * FROM public.fondos_instructivos WHERE fondo_id = $1
    const { data, error } = await db
      .from('fondos_instructivos')
      .select('*')
      .eq('fondo_id', id)
      .single()

    if (error || !data) {
      if (error?.code === 'PGRST116') {
        return NextResponse.json({ error: 'Este fondo no tiene instructivo registrado' }, { status: 404 })
      }
      console.error(`[/api/fondos/${id}/instructivo]`, error?.message)
      return NextResponse.json({ error: 'Error al obtener el instructivo' }, { status: 500 })
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
      },
    })
  } catch (e) {
    console.error(`[/api/fondos/${id}/instructivo] error`, e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
