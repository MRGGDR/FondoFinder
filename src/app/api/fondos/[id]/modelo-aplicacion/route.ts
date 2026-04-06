/**
 * GET /api/fondos/[id]/modelo-aplicacion
 *
 * Devuelve todos los modelos de aplicación del fondo desde fondos_modelos_aplicacion.
 * Un fondo puede tener más de un modelo (ej: "Solicitud directa" y "Proceso SECOP"),
 * por eso se devuelve un array.
 *
 * Devuelve 404 si el fondo no tiene ningún modelo registrado.
 *
 * MIGRACIÓN A POSTGRESQL PURO:
 *   SELECT * FROM public.fondos_modelos_aplicacion WHERE fondo_id = $1
 *   ORDER BY modelo_aplicacion
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

    // MIGRATION NOTE: SELECT * FROM public.fondos_modelos_aplicacion WHERE fondo_id = $1 ORDER BY modelo_aplicacion
    const { data, error } = await db
      .from('fondos_modelos_aplicacion')
      .select('*')
      .eq('fondo_id', id)
      .order('modelo_aplicacion', { ascending: true })

    if (error) {
      console.error(`[/api/fondos/${id}/modelo-aplicacion]`, error.message)
      return NextResponse.json({ error: 'Error al obtener el modelo de aplicación' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Este fondo no tiene modelo de aplicación registrado' }, { status: 404 })
    }

    return NextResponse.json({ modelos: data }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
      },
    })
  } catch (e) {
    console.error(`[/api/fondos/${id}/modelo-aplicacion] error`, e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
