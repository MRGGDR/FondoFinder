/**
 * GET /api/admin/mapa/consulta
 *
 * Devuelve datos agrupados de búsquedas por municipio CONSULTADO en el formulario.
 * Fuente: vw_busquedas_por_municipio_consulta_v2
 *
 * MIGRACIÓN A POSTGRESQL PURO:
 *   SELECT * FROM public.vw_busquedas_por_municipio_consulta_v2
 */

import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()

    // MIGRATION NOTE: SELECT * FROM public.vw_busquedas_por_municipio_consulta_v2
    const { data, error } = await db
      .from('vw_busquedas_por_municipio_consulta_v2')
      .select('*')
      .order('total_busquedas', { ascending: false })

    if (error) {
      console.error('[/api/admin/mapa/consulta]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ datos: data ?? [] })
  } catch (e) {
    console.error('[/api/admin/mapa/consulta] error', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
