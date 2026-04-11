/**
 * GET /api/fondos/[id]/instructivo
 */

import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { jsonError, jsonOk } from '@/lib/http/apiResponse'
import { RATE_POLICIES } from '@/lib/http/ratePolicies'
import { consumeRateLimit } from '@/lib/http/rateLimit'

const FONDO_ID_RE = /^[a-zA-Z0-9._:-]{1,80}$/

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const rate = consumeRateLimit(req, RATE_POLICIES.fondosInstructivo)
  if (!rate.allowed) {
    return jsonError(429, 'Demasiadas solicitudes. Intenta de nuevo en unos segundos.', {
      code: 'rate_limited',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }

  const id = params.id?.trim()
  if (!id || !FONDO_ID_RE.test(id)) {
    return jsonError(400, 'id invalido', {
      code: 'invalid_id',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }

  try {
    const db = getDb()

    const { data, error } = await db
      .from('fondos_instructivos')
      .select('*')
      .eq('fondo_id', id)
      .single()

    if (error || !data) {
      if (error?.code === 'PGRST116') {
        return jsonError(404, 'Este fondo no tiene instructivo registrado', {
          code: 'not_found',
          cacheControl: 'public, s-maxage=300, stale-while-revalidate=900',
          extraHeaders: rate.headers,
        })
      }
      console.error(`[/api/fondos/${id}/instructivo]`, error)
      return jsonError(500, 'Error al obtener el instructivo', {
        code: 'db_query_failed',
        cacheControl: 'no-store',
        extraHeaders: rate.headers,
      })
    }

    return jsonOk(data as Record<string, unknown>, {
      cacheControl: 'public, s-maxage=600, stale-while-revalidate=3600',
      extraHeaders: rate.headers,
    })
  } catch (e) {
    console.error(`[/api/fondos/${id}/instructivo] error`, e)
    return jsonError(500, 'Error interno', {
      code: 'internal_error',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }
}
