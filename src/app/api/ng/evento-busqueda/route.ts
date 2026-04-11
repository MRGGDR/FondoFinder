/**
 * POST /api/ng/evento-busqueda
 *
 * Registra un evento de búsqueda del wizard guiado (BuscadorNgV5) en search_events.
 * El sistema de identidad es LightSession (perfiles_consulta + localStorage),
 * NO Supabase Auth. El cliente pasa perfil_id y municipio_origen_id directamente.
 *
 * El payload_json almacena el estado del wizard: fuente, actor, tipo_fondo,
 * procesos, objetivos, categoría, actividades y cantidad de resultados.
 */

import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { jsonError, jsonOk } from '@/lib/http/apiResponse'
import { RATE_POLICIES } from '@/lib/http/ratePolicies'
import { consumeRateLimit } from '@/lib/http/rateLimit'
import {
  ValidationError,
  asIntArray,
  asOptionalInt,
  asOptionalString,
  asOptionalUuid,
  ensureObject,
  parseJsonBody,
} from '@/lib/http/validation'

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(req, RATE_POLICIES.ngEventoBusqueda)
  if (!rate.allowed) {
    return jsonError(429, 'Demasiadas solicitudes. Intenta de nuevo en unos segundos.', {
      code: 'rate_limited',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }

  try {
    const body = ensureObject(await parseJsonBody(req, { maxBytes: 64 * 1024 }))

    const perfilId = asOptionalUuid(body.perfil_id)
    const municipioOrigenId = asOptionalUuid(body.municipio_origen_id)
    const actorId = asOptionalInt(body.actor_id, { min: 1, max: 32767 })
    const tipoFondoId = asOptionalInt(body.tipo_fondo_id, { min: 1, max: 32767 })
    const procesoIds = asIntArray(body.proceso_ids, { maxItems: 30, min: 1, max: 32767 })
    const objetivoIds = asIntArray(body.objetivo_ids, { maxItems: 30, min: 1, max: 32767 })
    const categoriaId = asOptionalInt(body.categoria_id, { min: 1, max: 32767 })
    const actividadIds = asIntArray(body.actividad_ids, { maxItems: 80, min: 1, max: 32767 })
    const resultadosCount = asOptionalInt(body.resultados_count, { min: 0, max: 2000 }) ?? 0

    const resultadosRaw = body.resultados
    if (resultadosRaw != null && !Array.isArray(resultadosRaw)) {
      throw new ValidationError('resultados debe ser un arreglo')
    }
    if (Array.isArray(resultadosRaw) && resultadosRaw.length > 300) {
      throw new ValidationError('resultados excede el maximo permitido (300)')
    }

    const resultados = (Array.isArray(resultadosRaw) ? resultadosRaw : [])
      .map((item) => {
        const row = ensureObject(item, 'resultado')
        const fondoId = asOptionalString(row.fondo_id, { minLen: 1, maxLen: 80 })
        const posicion = asOptionalInt(row.posicion, { min: 1, max: 5000 })
        return {
          fondo_id: fondoId,
          posicion,
        }
      })
      .filter((item): item is { fondo_id: string; posicion: number } => {
        return Boolean(item.fondo_id && Number.isInteger(item.posicion))
      })

    const db = getDb()

    const { data: eventoCreado, error } = await db.from('ng_search_events').insert({
      perfil_id: perfilId,
      municipio_origen_id: municipioOrigenId,
      actor_id: actorId,
      tipo_fondo_id: tipoFondoId,
      proceso_ids: procesoIds,
      objetivo_ids: objetivoIds,
      categoria_id: categoriaId,
      actividad_ids: actividadIds,
      resultados_count: resultadosCount,
    }).select('id').single()

    if (error) {
      console.error('[/api/ng/evento-busqueda] insert error:', error.message)
      return jsonError(500, 'No se pudo registrar el evento de busqueda.', {
        code: 'db_insert_failed',
        cacheControl: 'no-store',
        extraHeaders: rate.headers,
      })
    }

    // Insertar resultados en search_event_results si hay fondos
    const eventoId = (eventoCreado as { id: string } | null)?.id
    if (eventoId && resultados.length > 0) {
      const rows = resultados
        .map(r => ({
          search_event_id: eventoId,
          fondo_id: String(r.fondo_id),
          posicion: r.posicion,
        }))
      if (rows.length > 0) {
        await db.from('ng_search_event_results').insert(rows)
      }
    }

    return jsonOk({ ok: true }, {
      status: 201,
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  } catch (e: unknown) {
    if (e instanceof ValidationError) {
      return jsonError(400, e.message, {
        code: 'invalid_input',
        cacheControl: 'no-store',
        extraHeaders: rate.headers,
      })
    }
    console.error('[/api/ng/evento-busqueda] unexpected', e)
    return jsonError(500, 'Error interno', {
      code: 'internal_error',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }
}
