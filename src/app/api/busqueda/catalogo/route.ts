/**
 * POST /api/busqueda/catalogo
 *
 * Wrapper de la función legacy buscar_fondos(). Usada por:
 *   - useBusqueda.ts  → página /fondos (catálogo con filtros)
 *   - FlujoBuscador.tsx → búsqueda principal del home (flujo por etapas)
 *
 * MIGRACIÓN A POSTGRESQL PURO:
 *   Reemplazar getDb().rpc('buscar_fondos', ...) por:
 *     SELECT * FROM public.buscar_fondos($1, $2, ...) LIMIT $n OFFSET $m
 *
 * Se mantiene usando buscar_fondos() legacy porque el frontend todavía
 * usa los IDs numéricos de cat_procesos / cat_beneficiarios / cat_objetivos.
 * Cuando la interfaz migre a la taxonomía narrativa v2, este endpoint
 * puede deprecarse en favor de /api/busqueda/narrativa.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      query,
      tipo_fondo,
      proceso_ids,
      beneficiario_ids,
      objetivo_ids,
      presupuesto_usd,
      limit = 12,
      offset = 0,
    } = body

    // Validación mínima de tipos
    if (limit !== undefined && typeof limit !== 'number') {
      return NextResponse.json({ error: 'limit debe ser un número' }, { status: 400 })
    }
    if (offset !== undefined && typeof offset !== 'number') {
      return NextResponse.json({ error: 'offset debe ser un número' }, { status: 400 })
    }

    const db = getDb()

    // MIGRATION NOTE: reemplazar por SQL directo cuando se migre a PostgreSQL
    const { data, error } = await db.rpc('buscar_fondos', {
      p_query: query ?? null,
      p_tipo_fondo: tipo_fondo ?? null,
      p_proceso_ids: proceso_ids?.length ? proceso_ids : null,
      p_beneficiario_ids: beneficiario_ids?.length ? beneficiario_ids : null,
      p_objetivo_ids: objetivo_ids?.length ? objetivo_ids : null,
      p_presupuesto_usd: presupuesto_usd ?? null,
      p_limit: limit,
      p_offset: offset,
    })

    if (error) {
      console.error('[/api/busqueda/catalogo]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ resultados: data ?? [], total_count: (data as { total_count?: number }[])?.[0]?.total_count ?? 0 })
  } catch (e) {
    console.error('[/api/busqueda/catalogo] parse error', e)
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }
}
