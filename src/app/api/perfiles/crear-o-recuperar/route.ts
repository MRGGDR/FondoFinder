/**
 * POST /api/perfiles/crear-o-recuperar
 *
 * Crea un perfil de consulta o recupera uno existente por nombre normalizado + municipio.
 * Sistema sin auth tradicional (LightSession).
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

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

const CONECTORES_APELLIDO = new Set([
  'da', 'das', 'de', 'del', 'della', 'delle', 'dello', 'di', 'do', 'dos',
  'e', 'el', 'la', 'las', 'los', 'van', 'von', 'y',
])

function tokenizarNombre(nombreContacto: string): string[] {
  return normalizarTexto(nombreContacto)
    .split(' ')
    .map((p) => p.replace(/[^a-z0-9]/g, ''))
    .filter(Boolean)
}

function apellidoSignificativo(partes: string[]): string {
  for (let i = partes.length - 1; i >= 0; i--) {
    const p = partes[i]
    if (!CONECTORES_APELLIDO.has(p)) return p
  }
  return partes[partes.length - 1] ?? 'usuario'
}

function construirCodigoBase(nombreContacto: string): string {
  const partes = tokenizarNombre(nombreContacto)
  if (partes.length === 0) return 'u.usuario'

  const primerNombre = partes[0]
  const inicial = primerNombre[0] ?? 'u'

  if (partes.length === 1) {
    return `${inicial}.${primerNombre}`
  }

  return `${inicial}.${apellidoSignificativo(partes)}`
}

async function generarCodigoAccesoDisponible(
  db: ReturnType<typeof getDb>,
  nombreContacto: string,
): Promise<string> {
  const base = construirCodigoBase(nombreContacto)

  for (let n = 0; n < 200; n++) {
    const candidato = n === 0 ? base : `${base}${n + 1}`
    const { data, error } = await db
      .from('perfiles_consulta')
      .select('id')
      .eq('codigo_acceso', candidato)
      .limit(1)

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) return candidato
  }

  return `${base}${Date.now().toString().slice(-4)}`
}

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(req, RATE_POLICIES.perfilesCrear)
  if (!rate.allowed) {
    return jsonError(429, 'Demasiadas solicitudes. Intenta de nuevo mas tarde.', {
      code: 'rate_limited',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }

  try {
    const body = ensureObject(await parseJsonBody(req, { maxBytes: 12 * 1024 }))

    const nombre_contacto = asOptionalString(body.nombre_contacto, { minLen: 2, maxLen: 120 })
    const municipio_id = asOptionalUuid(body.municipio_id)
    const tipo_actor = asOptionalString(body.tipo_actor, { maxLen: 60 })
    const entidad = asOptionalString(body.entidad, { maxLen: 160 })
    const canal_registro = asOptionalString(body.canal_registro, { maxLen: 60 })
    const metadata_json = body.metadata_json ?? null

    if (!nombre_contacto) {
      throw new ValidationError('nombre_contacto es requerido (minimo 2 caracteres)')
    }

    if (metadata_json != null) {
      const metadataSize = Buffer.byteLength(JSON.stringify(metadata_json), 'utf8')
      if (metadataSize > 4096) {
        throw new ValidationError('metadata_json excede el tamano permitido (4KB)')
      }
    }

    const db = getDb()

    type PerfilRow = {
      id: string
      codigo_acceso: string
      nombre_contacto: string | null
      municipio_id: string | null
      tipo_actor: string | null
      entidad: string | null
    }

    let perfilExistente: PerfilRow | null = null

    if (municipio_id) {
      const nombreNorm = normalizarTexto(nombre_contacto)
      const { data: existentes } = await db
        .from('perfiles_consulta')
        .select('id, codigo_acceso, nombre_contacto, municipio_id, tipo_actor, entidad')
        .eq('municipio_id', municipio_id)
        .eq('nombre_normalizado', nombreNorm)
        .eq('activo', true)
        .limit(1)

      if (existentes && existentes.length > 0) {
        perfilExistente = existentes[0] as PerfilRow
      }
    }

    const fetchMunicipio = async (
      id: string | null,
    ): Promise<{ nombre: string | null; departamento: string | null }> => {
      if (!id) return { nombre: null, departamento: null }
      const { data: mRow } = await db
        .from('municipios')
        .select('nombre, departamento')
        .eq('id', id)
        .single()
      if (!mRow) return { nombre: null, departamento: null }
      return {
        nombre: (mRow as { nombre: string }).nombre,
        departamento: (mRow as { departamento: string }).departamento,
      }
    }

    if (perfilExistente) {
      await db
        .from('perfiles_consulta')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', perfilExistente.id)

      const { nombre: nombre_municipio, departamento } = await fetchMunicipio(perfilExistente.municipio_id)
      const respuesta = {
        perfil_id: perfilExistente.id,
        codigo_acceso: perfilExistente.codigo_acceso,
        es_admin: isAdminAccessCodeServer(perfilExistente.codigo_acceso),
        nombre_contacto: perfilExistente.nombre_contacto,
        municipio_id: perfilExistente.municipio_id,
        tipo_actor: perfilExistente.tipo_actor,
        entidad: perfilExistente.entidad,
        nombre_municipio,
        departamento,
        es_nuevo: false,
      }
      return jsonOk(respuesta, {
        status: 200,
        cacheControl: 'no-store',
        extraHeaders: rate.headers,
      })
    }

    const nombreNorm = normalizarTexto(nombre_contacto)

    type PerfilCreado = {
      id: string
      codigo_acceso: string
      nombre_contacto: string | null
      municipio_id: string | null
      tipo_actor: string | null
      entidad: string | null
    }

    let nuevoPerfil: PerfilCreado | null = null
    let errorCrear: { message: string; code?: string } | null = null

    for (let intento = 0; intento < 5; intento++) {
      const codigoAcceso = await generarCodigoAccesoDisponible(db, nombre_contacto)
      const { data, error } = await db
        .from('perfiles_consulta')
        .insert({
          nombre_contacto: nombre_contacto.trim(),
          nombre_normalizado: nombreNorm,
          codigo_acceso: codigoAcceso,
          municipio_id: municipio_id ?? null,
          tipo_actor: tipo_actor ?? null,
          entidad: entidad ?? null,
          canal_registro: canal_registro ?? 'web',
          metadata_json: metadata_json ?? null,
          activo: true,
        })
        .select('id, codigo_acceso, nombre_contacto, municipio_id, tipo_actor, entidad')
        .single()

      if (!error && data) {
        nuevoPerfil = data as PerfilCreado
        errorCrear = null
        break
      }

      errorCrear = error ?? { message: 'Respuesta vacia' }
      if (error?.code !== '23505') break
    }

    if (errorCrear || !nuevoPerfil) {
      console.error('[/api/perfiles/crear-o-recuperar]', errorCrear?.message, errorCrear)
      return jsonError(500, 'No se pudo crear el perfil', {
        code: 'profile_create_failed',
        cacheControl: 'no-store',
        extraHeaders: rate.headers,
      })
    }

    const { nombre: nombre_municipio, departamento } = await fetchMunicipio(nuevoPerfil.municipio_id)
    const respuesta = {
      perfil_id: nuevoPerfil.id,
      codigo_acceso: nuevoPerfil.codigo_acceso,
      es_admin: isAdminAccessCodeServer(nuevoPerfil.codigo_acceso),
      nombre_contacto: nuevoPerfil.nombre_contacto,
      municipio_id: nuevoPerfil.municipio_id,
      tipo_actor: nuevoPerfil.tipo_actor,
      entidad: nuevoPerfil.entidad,
      nombre_municipio,
      departamento,
      es_nuevo: true,
    }

    return jsonOk(respuesta, {
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

    console.error('[/api/perfiles/crear-o-recuperar] error', e)
    return jsonError(400, 'Solicitud invalida', {
      code: 'invalid_request',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }
}
