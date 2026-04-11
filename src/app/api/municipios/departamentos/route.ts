/**
 * GET /api/municipios/departamentos
 */

import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { jsonError, jsonOk } from '@/lib/http/apiResponse'
import { RATE_POLICIES } from '@/lib/http/ratePolicies'
import { consumeRateLimit } from '@/lib/http/rateLimit'

export async function GET(req: NextRequest) {
  const rate = consumeRateLimit(req, RATE_POLICIES.municipios)
  if (!rate.allowed) {
    return jsonError(429, 'Demasiadas solicitudes. Intenta de nuevo en unos segundos.', {
      code: 'rate_limited',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }

  try {
    const db = getDb()

    const [res1, res2] = await Promise.all([
      db.from('municipios').select('departamento').order('departamento').range(0, 999),
      db.from('municipios').select('departamento').order('departamento').range(1000, 1999),
    ])

    if (res1.error || res2.error) {
      console.error('[/api/municipios/departamentos]', res1.error ?? res2.error)
      return jsonError(500, 'Error al consultar departamentos', {
        code: 'db_query_failed',
        cacheControl: 'no-store',
        extraHeaders: rate.headers,
      })
    }

    const allRows = [...(res1.data ?? []), ...(res2.data ?? [])]
    const set = new Set<string>()
    for (const row of allRows) {
      if (row.departamento) set.add(row.departamento as string)
    }

    return jsonOk(
      { departamentos: Array.from(set).sort((a, b) => a.localeCompare(b, 'es')) },
      {
        cacheControl: 'public, s-maxage=3600, stale-while-revalidate=86400',
        extraHeaders: rate.headers,
      },
    )
  } catch (e) {
    console.error('[/api/municipios/departamentos] unexpected', e)
    return jsonError(500, 'Error interno', {
      code: 'internal_error',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }
}
