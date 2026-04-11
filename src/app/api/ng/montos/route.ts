import { getDb } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonError, jsonOk } from '@/lib/http/apiResponse'
import { RATE_POLICIES } from '@/lib/http/ratePolicies'
import { consumeRateLimit } from '@/lib/http/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FONDO_ID_RE = /^[a-zA-Z0-9._:-]{1,80}$/

export async function GET(req: NextRequest) {
  const rate = consumeRateLimit(req, RATE_POLICIES.ngMontos)
  if (!rate.allowed) {
    return jsonError(429, 'Demasiadas solicitudes. Intenta de nuevo en unos segundos.', {
      code: 'rate_limited',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }

  try {
    const idsRaw = req.nextUrl.searchParams.get('ids')?.trim() ?? ''
    if (!idsRaw) {
      return jsonError(400, 'Parametro ids requerido', {
        code: 'missing_ids',
        cacheControl: 'no-store',
        extraHeaders: rate.headers,
      })
    }

    const ids = Array.from(
      new Set(
        idsRaw
          .split(',')
          .map(id => id.trim())
          .filter(Boolean),
      ),
    )

    if (ids.length === 0 || ids.length > 200) {
      return jsonError(400, 'La lista de ids debe contener entre 1 y 200 elementos.', {
        code: 'invalid_ids_count',
        cacheControl: 'no-store',
        extraHeaders: rate.headers,
      })
    }

    if (ids.some(id => !FONDO_ID_RE.test(id))) {
      return jsonError(400, 'Uno o mas ids tienen formato invalido.', {
        code: 'invalid_ids_format',
        cacheControl: 'no-store',
        extraHeaders: rate.headers,
      })
    }

    const db = getDb()
    const { data, error } = await (db as any)
      .from('fondos')
      .select('id, monto_min_usd, monto_max_usd')
      .in('id', ids)

    if (error) {
      console.error('[/api/ng/montos] db error', error)
      return jsonError(500, 'No se pudieron consultar los montos.', {
        code: 'db_query_failed',
        cacheControl: 'no-store',
        extraHeaders: rate.headers,
      })
    }

    return jsonOk(data ?? [], {
      cacheControl: 'public, s-maxage=60, stale-while-revalidate=300',
      extraHeaders: rate.headers,
    })
  } catch (err: unknown) {
    console.error('[/api/ng/montos] unexpected', err)
    return jsonError(500, 'Error interno', {
      code: 'internal_error',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }
}
