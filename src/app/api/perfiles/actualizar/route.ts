/**
 * PATCH /api/perfiles/actualizar
 */

import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { jsonError, jsonOk } from '@/lib/http/apiResponse'
import { RATE_POLICIES } from '@/lib/http/ratePolicies'
import { consumeRateLimit } from '@/lib/http/rateLimit'
import {
  ValidationError,
  asOptionalString,
  asOptionalUuid,
  ensureObject,
  parseJsonBody,
} from '@/lib/http/validation'
import { isAdminAccessCodeServer } from '@/lib/adminAccess'

export async function PATCH(req: NextRequest) {
  try {
    const body = ensureObject(await parseJsonBody(req, { maxBytes: 8192 }))

    const perfil_id = asOptionalUuid(body.perfil_id)
    if (!perfil_id) {
      throw new ValidationError('perfil_id es requerido')
    }

    const municipio_id = body.municipio_id === null ? null : asOptionalUuid(body.municipio_id)
    const tipo_actor = body.tipo_actor === null ? null : asOptionalString(body.tipo_actor, { maxLen: 60 })
    const entidad = body.entidad === null ? null : asOptionalString(body.entidad, { maxLen: 160 })

    const rate = consumeRateLimit(req, RATE_POLICIES.perfilesActualizar, [perfil_id])
    if (!rate.allowed) {
      return jsonError(429, 'Demasiadas solicitudes. Intenta de nuevo mas tarde.', {
        code: 'rate_limited',
        cacheControl: 'no-store',
        extraHeaders: rate.headers,
      })
    }

    const updates: Record<string, unknown> = {
      last_seen_at: new Date().toISOString(),
    }
    if (body.municipio_id !== undefined) updates.municipio_id = municipio_id
    if (body.tipo_actor !== undefined) updates.tipo_actor = tipo_actor
    if (body.entidad !== undefined) updates.entidad = entidad

    const db = getDb()

    const { data, error } = await db
      .from('perfiles_consulta')
      .update(updates)
      .eq('id', perfil_id)
      .eq('activo', true)
      .select('id, codigo_acceso, nombre_contacto, municipio_id, tipo_actor, entidad')
      .single()

    if (error || !data) {
      console.error('[/api/perfiles/actualizar]', error)
      return jsonError(404, 'No se pudo actualizar el perfil', {
        code: 'profile_not_found_or_update_failed',
        cacheControl: 'no-store',
        extraHeaders: rate.headers,
      })
    }

    const p = data as {
      id: string
      codigo_acceso: string
      nombre_contacto: string | null
      municipio_id: string | null
      tipo_actor: string | null
      entidad: string | null
    }

    let nombre_municipio: string | null = null
    let departamento: string | null = null
    if (p.municipio_id) {
      const { data: mRow } = await db
        .from('municipios')
        .select('nombre, departamento')
        .eq('id', p.municipio_id)
        .single()
      if (mRow) {
        nombre_municipio = (mRow as { nombre: string; departamento: string }).nombre
        departamento = (mRow as { nombre: string; departamento: string }).departamento
      }
    }

    return jsonOk(
      {
        perfil_id: p.id,
        codigo_acceso: p.codigo_acceso,
        es_admin: isAdminAccessCodeServer(p.codigo_acceso),
        nombre_contacto: p.nombre_contacto,
        municipio_id: p.municipio_id,
        tipo_actor: p.tipo_actor,
        entidad: p.entidad,
        nombre_municipio,
        departamento,
        es_nuevo: false,
      },
      {
        status: 200,
        cacheControl: 'no-store',
        extraHeaders: rate.headers,
      },
    )
  } catch (e) {
    if (e instanceof ValidationError) {
      return jsonError(400, e.message, {
        code: 'invalid_input',
        cacheControl: 'no-store',
      })
    }

    console.error('[/api/perfiles/actualizar] error', e)
    return jsonError(400, 'Solicitud invalida', {
      code: 'invalid_request',
      cacheControl: 'no-store',
    })
  }
}
