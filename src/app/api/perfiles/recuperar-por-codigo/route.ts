/**
 * POST /api/perfiles/recuperar-por-codigo
 *
 * Recupera un perfil existente usando su código de acceso corto (ej: "FF-ABCD").
 * Actualiza last_seen_at al consultarlo.
 *
 * Payload: { codigo_acceso: string }
 *
 * MIGRACIÓN A POSTGRESQL PURO:
 *   SELECt ... FROM perfiles_consulta WHERE codigo_acceso = $1 AND activo = TRUE
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { PerfilConsultaRespuesta } from '@/types/database'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { codigo_acceso } = body

    if (!codigo_acceso || typeof codigo_acceso !== 'string' || codigo_acceso.trim().length < 3) {
      return NextResponse.json({ error: 'codigo_acceso es requerido' }, { status: 400 })
    }

    const db = getDb()

    // MIGRATION NOTE: SELECT id, codigo_acceso, nombre_contacto, municipio_id, tipo_actor
    //   FROM perfiles_consulta WHERE upper(codigo_acceso) = upper($1) AND activo = TRUE
    const { data, error } = await db
      .from('perfiles_consulta')
      .select('id, codigo_acceso, nombre_contacto, municipio_id, tipo_actor, entidad')
      .ilike('codigo_acceso', codigo_acceso.trim())
      .eq('activo', true)
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Código de acceso no encontrado' }, { status: 404 })
    }

    const p = data as { id: string; codigo_acceso: string; nombre_contacto: string | null; municipio_id: string | null; tipo_actor: string | null; entidad: string | null }

    // Actualizar last_seen_at
    // MIGRATION NOTE: UPDATE perfiles_consulta SET last_seen_at = now() WHERE id = $1
    await db
      .from('perfiles_consulta')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', p.id)

    // Fetch nombre + departamento del municipio
    let nombre_municipio: string | null = null
    let departamento: string | null = null
    if (p.municipio_id) {
      const { data: mRow } = await db.from('municipios').select('nombre, departamento').eq('id', p.municipio_id).single()
      if (mRow) {
        nombre_municipio = (mRow as { nombre: string }).nombre
        departamento = (mRow as { departamento: string }).departamento
      }
    }

    const respuesta = {
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
    console.error('[/api/perfiles/recuperar-por-codigo] error', e)
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }
}
