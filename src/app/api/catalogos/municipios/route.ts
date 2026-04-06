/**
 * GET /api/catalogos/municipios?q=TEXTO&limit=15
 *
 * Búsqueda de municipios por nombre (ilike) para el autocomplete de registro.
 * Devuelve: { municipios: [{ id, nombre, departamento }] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '15', 10), 50)

  if (q.length < 2) {
    return NextResponse.json({ municipios: [] })
  }

  try {
    const db = getDb()
    const { data, error } = await db
      .from('municipios')
      .select('id, nombre, departamento')
      .ilike('nombre', `%${q}%`)
      .order('nombre', { ascending: true })
      .limit(limit)

    if (error) throw error
    return NextResponse.json({ municipios: data ?? [] })
  } catch (e) {
    console.error('[/api/catalogos/municipios]', e)
    return NextResponse.json({ municipios: [] }, { status: 500 })
  }
}
