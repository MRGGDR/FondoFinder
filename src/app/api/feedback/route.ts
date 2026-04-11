import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { jsonError, jsonOk } from '@/lib/http/apiResponse'
import { RATE_POLICIES } from '@/lib/http/ratePolicies'
import { consumeRateLimit } from '@/lib/http/rateLimit'
import {
  ValidationError,
  asOptionalInt,
  asOptionalString,
  ensureObject,
  parseJsonBody,
} from '@/lib/http/validation'

const FEEDBACK_TIPOS = new Set(['sugerencia', 'error', 'opinion', 'otro'])

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(req, RATE_POLICIES.feedback)
  if (!rate.allowed) {
    return jsonError(429, 'Demasiados envios. Intenta de nuevo en unos minutos.', {
      code: 'rate_limited',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }

  try {
    const body = ensureObject(await parseJsonBody(req, { maxBytes: 8 * 1024 }))

    const tipoRaw = asOptionalString(body.tipo, { maxLen: 20 }) ?? 'opinion'
    const tipo = FEEDBACK_TIPOS.has(tipoRaw) ? tipoRaw : 'opinion'
    const valoracion = asOptionalInt(body.valoracion, { min: 1, max: 5 })
    const mensaje = asOptionalString(body.mensaje, { maxLen: 1000 })
    const url_origen_raw = asOptionalString(body.url_origen, { maxLen: 500 })
    const url_origen = url_origen_raw?.startsWith('/') ? url_origen_raw : null

    if (valoracion === null && !mensaje) {
      throw new ValidationError('Se requiere valoracion o mensaje.')
    }

    const db = getDb()
    const { error } = await db.from('feedback_herramienta').insert({
      tipo,
      valoracion,
      mensaje,
      url_origen,
    })

    if (error) {
      console.error('[/api/feedback] db error', error)
      return jsonError(500, 'No se pudo registrar el feedback.', {
        code: 'feedback_insert_failed',
        cacheControl: 'no-store',
        extraHeaders: rate.headers,
      })
    }

    return jsonOk({ ok: true }, {
      status: 201,
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  } catch (e) {
    if (e instanceof ValidationError) {
      return jsonError(400, e.message, {
        code: 'invalid_input',
        cacheControl: 'no-store',
        extraHeaders: rate.headers,
      })
    }

    console.error('[/api/feedback] unexpected', e)
    return jsonError(500, 'Error interno', {
      code: 'internal_error',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }
}
