/**
 * GET /api/admin/mapa/origen
 *
 * Devuelve datos agrupados de búsquedas por municipio de ORIGEN del perfil.
 * Fuente: vw_busquedas_por_municipio_origen_v2
 *
 * Requiere autenticación (protegido por middleware, igual que /admin).
 * En este bloque el middleware existente ya protege /admin pero no /api/admin.
 * TODO: Agregar validación de sesión administrativa cuando se construya
 *       la capa de auth de administradores.
 *
 * MIGRACIÓN A POSTGRESQL PURO:
 *   SELECT * FROM public.vw_busquedas_por_municipio_origen_v2
 */

import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()

    // MIGRATION NOTE: SELECT * FROM public.vw_busquedas_por_municipio_origen_v2
    const { data, error } = await db
      .from('vw_busquedas_por_municipio_origen_v2')
      .select('*')
      .order('total_busquedas', { ascending: false })

    if (error) {
      console.error('[/api/admin/mapa/origen]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ datos: data ?? [] })
  } catch (e) {
    console.error('[/api/admin/mapa/origen] error', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
