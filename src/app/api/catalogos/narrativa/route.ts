/**
 * GET /api/catalogos/narrativa
 *
 * Fuente de verdad: public.narrative_catalog / public.get_narrative_catalog()
 *
 * Lee el catálogo narrativo desde Supabase y lo devuelve agrupado por grupo
 * como CatalogoNarrativa. Los términos vienen ordenados alfabéticamente
 * por el RPC get_narrative_catalog().
 *
 * Mapeado de dimensión narrative_catalog → GrupoTermino del frontend:
 *   amenaza  → desastre
 *   afectación / afectacion → afectacion
 *   (resto iguales)
 *
 * Fallback: si el RPC falla, intenta leer de cat_narrativa_terminos (tabla legacy).
 *
 * Incluye cache HTTP de 1h.
 */

import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { TerminoNarrativo, GrupoTermino, CatalogoNarrativa } from '@/types/database'

// Mapeo dimension (narrative_catalog) → GrupoTermino (frontend)
const DIMENSION_TO_GRUPO: Record<string, GrupoTermino> = {
  sujeto:      'sujeto',
  verbo:       'verbo',
  predicado:   'predicado',
  complemento: 'complemento',
  amenaza:     'desastre',   // narrative_catalog usa "amenaza"
  desastre:    'desastre',
  afectacion:  'afectacion',
  'afectación':'afectacion', // acento
  alcance:     'alcance',
}

const GRUPOS: GrupoTermino[] = ['sujeto', 'verbo', 'predicado', 'complemento', 'desastre', 'afectacion', 'alcance']

type RawRow = Record<string, unknown>

function mapRow(row: RawRow): TerminoNarrativo | null {
  // Detectar dimensión con varios nombres de columna posibles
  const dimRaw = String(row.dimension ?? row.grupo ?? row.category ?? '').toLowerCase().trim()
  const grupo = DIMENSION_TO_GRUPO[dimRaw]
  if (!grupo) return null

  // Label: varios nombres posibles
  const label = String(row.label ?? row.termino_canonico ?? row.name ?? '').trim()
  if (!label) return null

  // Normalizado: derivar del label si no viene explícito
  const normalizado = String(
    row.label_normalized ?? row.label_slug ?? row.termino_normalizado ?? label
  )
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  return {
    id:                  String(row.id),
    grupo,
    termino_canonico:    label,
    termino_normalizado: normalizado,
    descripcion:         row.description != null ? String(row.description) : (row.descripcion != null ? String(row.descripcion) : null),
    orden_visual:        Number(row.display_order ?? row.orden_visual ?? 0),
    activo:              Boolean(row.active ?? row.activo ?? true),
  }
}

function buildCatalogo(rows: TerminoNarrativo[]): CatalogoNarrativa {
  return Object.fromEntries(
    GRUPOS.map(g => [g, rows.filter(t => t.grupo === g)])
  ) as CatalogoNarrativa
}

export async function GET() {
  const db = getDb()

  // ── Intento 1: nueva tabla narrative_catalog vía get_narrative_catalog() ──
  try {
    const { data: rpcData, error: rpcError } = await db.rpc('get_narrative_catalog')

    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      const terminos = (rpcData as RawRow[])
        .map(r => mapRow(r))
        .filter((t): t is TerminoNarrativo => t !== null)
        .filter(t => t.activo)

      return NextResponse.json(buildCatalogo(terminos), {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
      })
    }

    if (rpcError) {
      console.warn('[/api/catalogos/narrativa] get_narrative_catalog RPC falló, usando fallback:', rpcError.message)
    }
  } catch (e) {
    console.warn('[/api/catalogos/narrativa] error llamando RPC, usando fallback:', e)
  }

  // ── Fallback: cat_narrativa_terminos (tabla legacy) ────────────────────────
  try {
    const { data, error } = await db
      .from('cat_narrativa_terminos')
      .select('id, grupo, termino_canonico, termino_normalizado, descripcion, orden_visual, activo')
      .eq('activo', true)
      .order('orden_visual', { ascending: true })
      .order('termino_canonico', { ascending: true })

    if (error) {
      console.error('[/api/catalogos/narrativa] fallback error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const terminos = (data ?? []) as TerminoNarrativo[]

    return NextResponse.json(buildCatalogo(terminos), {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (e) {
    console.error('[/api/catalogos/narrativa] error inesperado en fallback:', e)
    return NextResponse.json({ error: 'Error interno al cargar catálogo' }, { status: 500 })
  }
}
