/**
 * GET /api/municipios/por-departamento?dep=[nombre_departamento]
 *
 * Devuelve los municipios de un departamento, ordenados por nombre.
 *
 * Query params:
 *   dep (string, requerido) — nombre exacto del departamento
 *
 * Respuesta: { municipios: { id: string; nombre: string }[] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const dep = req.nextUrl.searchParams.get('dep')?.trim()

  if (!dep) {
    return NextResponse.json({ error: 'Parámetro "dep" requerido' }, { status: 400 })
  }

  try {
    const db = getDb()

    const { data, error } = await db
      .from('municipios')
      .select('id, nombre')
      .eq('departamento', dep)
      .order('nombre')
      .limit(200)

    if (error) {
      console.error('[/api/municipios/por-departamento]', error)
      return NextResponse.json({ error: 'Error al consultar municipios' }, { status: 500 })
    }

    return NextResponse.json(
      { municipios: data ?? [] },
      {
        status: 200,
        headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
      },
    )
  } catch (e) {
    console.error('[/api/municipios/por-departamento] unexpected', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
