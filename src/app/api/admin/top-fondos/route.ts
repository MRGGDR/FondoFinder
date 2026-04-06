/**
 * GET /api/admin/top-fondos
 *
 * Devuelve los fondos más consultados en búsquedas narrativas.
 * Fuente: vw_top_fondos_consultados_v2
 *
 * Acepta query param ?limit=N (default 20).
 *
 * MIGRACIÓN A POSTGRESQL PURO:
 *   SELECT * FROM public.vw_top_fondos_consultados_v2 LIMIT $1
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 100) : 20

    const db = getDb()

    // MIGRATION NOTE: SELECT * FROM public.vw_top_fondos_consultados_v2 LIMIT $1
    const { data, error } = await db
      .from('vw_top_fondos_consultados_v2')
      .select('*')
      .order('total_apariciones', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[/api/admin/top-fondos]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ fondos: data ?? [] })
  } catch (e) {
    console.error('[/api/admin/top-fondos] error', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
