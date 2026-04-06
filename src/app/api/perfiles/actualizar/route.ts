/**
 * PATCH /api/perfiles/actualizar
 *
 * Actualiza campos editables de un perfil de consulta existente.
 * Identificado por perfil_id (UUID del localStorage).
 *
 * No requiere autenticación fuerte — los perfil_id son UUIDs no adivinables.
 * Los datos almacenados son preferencias de consulta, no información sensible.
 *
 * Payload (ActualizarPerfilPayload):
 *   perfil_id (requerido), municipio_id?, tipo_actor?, entidad?
 *
 * Respuesta: PerfilConsultaRespuesta
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { ActualizarPerfilPayload, PerfilConsultaRespuesta } from '@/types/database'

export async function PATCH(req: NextRequest) {
  try {
    const body: ActualizarPerfilPayload = await req.json()

    const { perfil_id, municipio_id, tipo_actor, entidad } = body

    if (!perfil_id || typeof perfil_id !== 'string') {
      return NextResponse.json({ error: 'perfil_id es requerido' }, { status: 400 })
    }

    // Construir solo los campos que vienen en el payload
    const updates: Record<string, unknown> = {
      last_seen_at: new Date().toISOString(),
    }
    if (municipio_id !== undefined) updates.municipio_id = municipio_id
    if (tipo_actor   !== undefined) updates.tipo_actor   = tipo_actor
    if (entidad      !== undefined) updates.entidad      = entidad

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
      return NextResponse.json(
        {
          error: 'No se pudo actualizar el perfil',
          detail: process.env.NODE_ENV !== 'production' ? error?.message : undefined,
        },
        { status: 404 },
      )
    }

    const p = data as {
      id: string
      codigo_acceso: string
      nombre_contacto: string | null
      municipio_id: string | null
      tipo_actor: string | null
      entidad: string | null
    }

    // Fetch nombre del municipio si existe para devolverlo al cliente
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

    const respuesta: PerfilConsultaRespuesta & {
      entidad: string | null
      nombre_municipio: string | null
      departamento: string | null
    } = {
      perfil_id: p.id,
      codigo_acceso: p.codigo_acceso,
      nombre_contacto: p.nombre_contacto,
      municipio_id: p.municipio_id,
      tipo_actor: p.tipo_actor,
      entidad: p.entidad,
      nombre_municipio,
      departamento,
      es_nuevo: false,
    }

    return NextResponse.json(respuesta, { status: 200 })
  } catch (e) {
    console.error('[/api/perfiles/actualizar] error', e)
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }
}
