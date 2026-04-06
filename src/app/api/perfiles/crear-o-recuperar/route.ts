/**
 * POST /api/perfiles/crear-o-recuperar
 *
 * Crea un perfil de consulta nuevo (sin password) o recupera uno existente
 * por nombre normalizado + municipio (para evitar duplicidos del mismo usuario).
 * Devuelve perfil_id, codigo_acceso y si es nuevo o recuperado.
 *
 * El frontend debe guardar { perfil_id, codigo_acceso } en localStorage.
 *
 * Payload esperado (CrearPerfilPayload):
 *   nombre_contacto (requerido), municipio_id?, tipo_actor?, entidad?,
 *   canal_registro?, metadata_json?
 *
 * MIGRACIÓN A POSTGRESQL PURO:
 *   Reemplazar llamadas .from('perfiles_consulta') por SQL directo.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { CrearPerfilPayload, PerfilConsultaRespuesta } from '@/types/database'

/**
 * Aproxima fn_normalizar_texto() de PostgreSQL en JS puro.
 * La función SQL hace: lower(unaccent(trim(x))) + colapso de espacios.
 * NFD decomposition + strip combining marks ≈ unaccent para texto latino.
 */
function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip diacritics (≈ unaccent)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * Genera un código de acceso corto estilo "FF-ABCD".
 * 4 chars alfanuméricos en mayúsculas → 36^4 = 1.6M combinaciones,
 * suficiente para el volumen esperado de perfiles de consulta.
 */
function generarCodigoAcceso(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin 0/O/1/I para legibilidad
  let sufijo = ''
  for (let i = 0; i < 4; i++) {
    sufijo += chars[Math.floor(Math.random() * chars.length)]
  }
  return `FF-${sufijo}`
}

export async function POST(req: NextRequest) {
  try {
    const body: CrearPerfilPayload = await req.json()

    const { nombre_contacto, municipio_id, tipo_actor, entidad, canal_registro, metadata_json } = body

    if (!nombre_contacto || typeof nombre_contacto !== 'string' || nombre_contacto.trim().length < 2) {
      return NextResponse.json({ error: 'nombre_contacto es requerido (mínimo 2 caracteres)' }, { status: 400 })
    }

    const db = getDb()

    type PerfilRow = { id: string; codigo_acceso: string; nombre_contacto: string | null; municipio_id: string | null; tipo_actor: string | null; entidad: string | null }

    // Intentar recuperar un perfil existente con el mismo municipio y nombre normalizado.
    // normalizarTexto() aproxima fn_normalizar_texto(BD) con NFD+lowercase+trim.
    // MIGRATION NOTE: SELECT ... FROM perfiles_consulta WHERE nombre_normalizado = fn_normalizar_texto($1)
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

    // Helper: fetch nombre + departamento del municipio
    const fetchMunicipio = async (
      id: string | null,
    ): Promise<{ nombre: string | null; departamento: string | null }> => {
      if (!id) return { nombre: null, departamento: null }
      const { data: mRow } = await db.from('municipios').select('nombre, departamento').eq('id', id).single()
      if (!mRow) return { nombre: null, departamento: null }
      return { nombre: (mRow as { nombre: string }).nombre, departamento: (mRow as { departamento: string }).departamento }
    }

    if (perfilExistente) {
      // Actualizar last_seen_at
      // MIGRATION NOTE: UPDATE perfiles_consulta SET last_seen_at = now() WHERE id = $1
      await db
        .from('perfiles_consulta')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', perfilExistente.id)

      const { nombre: nombre_municipio, departamento } = await fetchMunicipio(perfilExistente.municipio_id)
      const respuesta = {
        perfil_id: perfilExistente.id,
        codigo_acceso: perfilExistente.codigo_acceso,
        nombre_contacto: perfilExistente.nombre_contacto,
        municipio_id: perfilExistente.municipio_id,
        tipo_actor: perfilExistente.tipo_actor,
        entidad: perfilExistente.entidad,
        nombre_municipio,
        departamento,
        es_nuevo: false,
      }
      return NextResponse.json(respuesta, { status: 200 })
    }

    // Crear perfil nuevo — generamos codigo_acceso y nombre_normalizado en JS
    // por si el trigger trg_biu_perfiles_consulta no existe en este entorno.
    // MIGRATION NOTE: INSERT INTO perfiles_consulta (...) RETURNING id, codigo_acceso
    const nombreNorm = normalizarTexto(nombre_contacto)

    // Intentar INSERT; en caso de colisión de codigo_acceso (unique), reintentar una vez
    type PerfilCreado = { id: string; codigo_acceso: string; nombre_contacto: string | null; municipio_id: string | null; tipo_actor: string | null; entidad: string | null }
    let nuevoPerfil: PerfilCreado | null = null
    let errorCrear: { message: string; code?: string } | null = null

    for (let intento = 0; intento < 2; intento++) {
      const codigoAcceso = generarCodigoAcceso()
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
        nuevoPerfil = data as unknown as PerfilCreado
        errorCrear = null
        break
      }
      // Si el error es de colisión de código (23505 unique_violation), reintentar
      errorCrear = error ?? { message: 'Respuesta vacía' }
      if (error?.code !== '23505') break
    }

    if (errorCrear || !nuevoPerfil) {
      console.error('[/api/perfiles/crear-o-recuperar]', errorCrear?.message, errorCrear)
      return NextResponse.json(
        {
          error: 'No se pudo crear el perfil',
          // Expuesto en dev para diagnóstico. No purgar hasta confirmar fix en producción.
          detail: process.env.NODE_ENV !== 'production' ? errorCrear?.message : undefined,
          hint: process.env.NODE_ENV !== 'production'
            ? 'Verifica que SUPABASE_SERVICE_ROLE_KEY esté en .env.local (anon key no puede INSERT si RLS está activo).'
            : undefined,
        },
        { status: 500 }
      )
    }

    const { nombre: nombre_municipio, departamento } = await fetchMunicipio(nuevoPerfil.municipio_id)
    const respuesta = {
      perfil_id: nuevoPerfil.id,
      codigo_acceso: nuevoPerfil.codigo_acceso,
      nombre_contacto: nuevoPerfil.nombre_contacto,
      municipio_id: nuevoPerfil.municipio_id,
      tipo_actor: nuevoPerfil.tipo_actor,
      entidad: nuevoPerfil.entidad,
      nombre_municipio,
      departamento,
      es_nuevo: true,
    }
    return NextResponse.json(respuesta, { status: 201 })
  } catch (e) {
    console.error('[/api/perfiles/crear-o-recuperar] error', e)
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }
}
