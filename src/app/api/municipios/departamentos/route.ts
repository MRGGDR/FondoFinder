/**
 * GET /api/municipios/departamentos
 *
 * Devuelve la lista de departamentos únicos presentes en public.municipios,
 * ordenados alfabéticamente.
 *
 * Respuesta: { departamentos: string[] }
 */

import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()

    // Colombia tiene ~1122 municipios; Supabase PostgREST devuelve máximo 1000 por defecto.
    // Se hacen dos páginas en paralelo para cubrir todos los registros sin importar max_rows.
    const [res1, res2] = await Promise.all([
      db.from('municipios').select('departamento').order('departamento').range(0, 999),
      db.from('municipios').select('departamento').order('departamento').range(1000, 1999),
    ])

    if (res1.error) {
      console.error('[/api/municipios/departamentos] página 1', res1.error)
      return NextResponse.json({ error: 'Error al consultar departamentos' }, { status: 500 })
    }

    const allRows = [...(res1.data ?? []), ...(res2.data ?? [])]

    // Deduplicate — Supabase no tiene SELECT DISTINCT en el SDK v2
    const set = new Set<string>()
    for (const row of allRows) {
      if (row.departamento) set.add(row.departamento as string)
    }

    return NextResponse.json(
      { departamentos: [...set].sort((a, b) => a.localeCompare(b, 'es')) },
      {
        status: 200,
        headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
      },
    )
  } catch (e) {
    console.error('[/api/municipios/departamentos] unexpected', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
