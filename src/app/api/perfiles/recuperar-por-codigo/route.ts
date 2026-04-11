/**
 * POST /api/perfiles/recuperar-por-codigo
 */

import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { jsonError, jsonOk } from '@/lib/http/apiResponse'
import { RATE_POLICIES } from '@/lib/http/ratePolicies'
import { consumeRateLimit } from '@/lib/http/rateLimit'
import {
  ValidationError,
  assertRegex,
  asOptionalString,
  ensureObject,
  parseJsonBody,
} from '@/lib/http/validation'
import { isAdminAccessCodeServer } from '@/lib/adminAccess'

const CODIGO_ACCESO_RE = /^[a-z0-9._-]{3,40}$/i

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(req, RATE_POLICIES.perfilesRecuperar)
  if (!rate.allowed) {
    return jsonError(429, 'Demasiadas solicitudes. Intenta de nuevo mas tarde.', {
      code: 'rate_limited',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }

  try {
    const body = ensureObject(await parseJsonBody(req, { maxBytes: 4096 }))
    const codigo = asOptionalString(body.codigo_acceso, { minLen: 3, maxLen: 40 })
    if (!codigo) {
      throw new ValidationError('codigo_acceso es requerido')
    }
    const codigo_acceso = assertRegex(codigo, CODIGO_ACCESO_RE, 'codigo_acceso invalido')

    const db = getDb()

    const { data, error } = await db
      .from('perfiles_consulta')
      .select('id, codigo_acceso, nombre_contacto, municipio_id, tipo_actor, entidad')
      .ilike('codigo_acceso', codigo_acceso)
      .eq('activo', true)
      .limit(1)
      .single()

    if (error || !data) {
      return jsonError(404, 'Codigo de acceso no encontrado', {
        code: 'profile_not_found',
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

    await db
      .from('perfiles_consulta')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', p.id)

    let nombre_municipio: string | null = null
    let departamento: string | null = null
    if (p.municipio_id) {
      const { data: mRow } = await db
        .from('municipios')
        .select('nombre, departamento')
        .eq('id', p.municipio_id)
        .single()
      if (mRow) {
        nombre_municipio = (mRow as { nombre: string }).nombre
        departamento = (mRow as { departamento: string }).departamento
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
        extraHeaders: rate.headers,
      })
    }

    console.error('[/api/perfiles/recuperar-por-codigo] error', e)
    return jsonError(400, 'Solicitud invalida', {
      code: 'invalid_request',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }
}
