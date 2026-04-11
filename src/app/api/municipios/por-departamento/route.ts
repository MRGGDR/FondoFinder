/**
 * GET /api/municipios/por-departamento?dep=[nombre_departamento]
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

  const dep = req.nextUrl.searchParams.get('dep')?.trim() ?? ''

  if (!dep) {
    return jsonError(400, 'Parametro dep requerido', {
      code: 'missing_dep',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }
  if (dep.length > 80) {
    return jsonError(400, 'Parametro dep invalido', {
      code: 'invalid_dep',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }

  try {
    const db = getDb()

    const { data, error } = await db
      .from('municipios')
      .select('id, nombre')
      .eq('departamento', dep)
      .order('nombre')
      .limit(200)

    if (error) {
      console.error('[/api/municipios/por-departamento]', error)
      return jsonError(500, 'Error al consultar municipios', {
        code: 'db_query_failed',
        cacheControl: 'no-store',
        extraHeaders: rate.headers,
      })
    }

    return jsonOk(
      { municipios: data ?? [] },
      {
        cacheControl: 'public, s-maxage=3600, stale-while-revalidate=86400',
        extraHeaders: rate.headers,
      },
    )
  } catch (e) {
    console.error('[/api/municipios/por-departamento] unexpected', e)
    return jsonError(500, 'Error interno', {
      code: 'internal_error',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }
}
