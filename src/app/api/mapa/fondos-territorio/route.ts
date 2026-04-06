/**
 * GET /api/mapa/fondos-territorio?divipola=XXXXX
 *
 * Devuelve el municipio (nombre, departamento) y los fondos disponibles
 * para ese territorio, usando buscar_fondos_narrativo_v2 con el UUID del municipio.
 *
 * Parámetros:
 *   divipola  — código DIVIPOLA de 5 dígitos del municipio (ej. "05001")
 *              también acepta código de departamento de 2 dígitos (ej. "05")
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const divipola = req.nextUrl.searchParams.get('divipola')?.trim()

  if (!divipola) {
    return NextResponse.json({ error: 'Parámetro divipola requerido' }, { status: 400 })
  }

  try {
    const db = getDb()

    // Determinar si es código de municipio (5 dígitos) o departamento (2 dígitos)
    const esMunicipio = divipola.length >= 4

    if (esMunicipio) {
      // Buscar municipio por código DIVIPOLA
      const codigoPadded = divipola.replace(/\D+/g, '').padStart(5, '0')

      const { data: municipios, error: mError } = await db
        .from('municipios')
        .select('id, nombre, departamento, codigo_departamento, codigo_divipola')
        .eq('codigo_divipola', codigoPadded)
        .limit(1)

      if (mError) {
        console.error('[/api/mapa/fondos-territorio] municipio error', mError.message)
        return NextResponse.json({ error: mError.message }, { status: 500 })
      }

      const municipio = municipios?.[0] ?? null

      if (!municipio) {
        return NextResponse.json(
          { municipio: null, fondos: [], mensaje: 'Municipio no encontrado en la base de datos' },
          { status: 200 }
        )
      }

      // Buscar fondos usando buscar_fondos_narrativo_v2 con territorio de interés
      const { data: fondos, error: fError } = await db.rpc('buscar_fondos_narrativo_v2', {
        p_texto_narrativo: null,
        p_sujeto_termino_id: null,
        p_predicado_termino_id: null,
        p_verbo_ids: null,
        p_complemento_ids: null,
        p_tipo_desastre: null,
        p_afectacion: null,
        p_tipo_fondo: null,
        p_presupuesto_usd: null,
        p_municipio_origen_id: null,
        p_municipio_consulta_id: municipio.id,
        p_perfil_id: null,
        p_limit: 10,
        p_offset: 0,
      })

      if (fError) {
        console.error('[/api/mapa/fondos-territorio] fondos error', fError.message)
        // Devolver municipio igual, sin fondos
        return NextResponse.json({
          municipio,
          fondos: [],
          mensaje: 'Error al consultar fondos: ' + fError.message,
        })
      }

      // Ordenar por score_total desc (ya viene ordenado del RPC pero asegurar)
      const fondosOrdenados = (fondos ?? [])
        .sort((a: { score_total: number }, b: { score_total: number }) => b.score_total - a.score_total)
        .slice(0, 8)
        .map((f: {
          id: string; nombre: string; tipo_fondo_categoria: string;
          monto_texto: string | null; entidad_encargada: string | null;
          tags_visibles: string[]; score_total: number;
        }) => ({
          id: f.id,
          nombre: f.nombre,
          tipo_fondo_categoria: f.tipo_fondo_categoria,
          monto_texto: f.monto_texto,
          entidad_encargada: f.entidad_encargada,
          tags_visibles: f.tags_visibles ?? [],
          score_total: f.score_total,
        }))

      return NextResponse.json({ municipio, fondos: fondosOrdenados })
    } else {
      // Solo departamento — retornar info del departamento y fondos generales
      const codigoDept = divipola.replace(/\D+/g, '').padStart(2, '0')

      const { data: muniSample, error: dError } = await db
        .from('municipios')
        .select('departamento, codigo_departamento')
        .eq('codigo_departamento', codigoDept)
        .limit(1)

      if (dError) {
        return NextResponse.json({ error: dError.message }, { status: 500 })
      }

      const deptInfo = muniSample?.[0] ?? null
      const nombreDept = deptInfo?.departamento ?? `Departamento ${codigoDept}`

      // Devolver fondos nacionales (sin territorio específico) para el departamento
      const { data: fondos, error: fError } = await db.rpc('buscar_fondos_narrativo_v2', {
        p_texto_narrativo: null,
        p_sujeto_termino_id: null,
        p_predicado_termino_id: null,
        p_verbo_ids: null,
        p_complemento_ids: null,
        p_tipo_desastre: null,
        p_afectacion: null,
        p_tipo_fondo: null,
        p_presupuesto_usd: null,
        p_municipio_origen_id: null,
        p_municipio_consulta_id: null,
        p_perfil_id: null,
        p_limit: 8,
        p_offset: 0,
      })

      if (fError) {
        return NextResponse.json({
          departamento: { nombre: nombreDept, codigo: codigoDept },
          fondos: [],
          mensaje: 'Error al consultar fondos',
        })
      }

      const fondosMapped = (fondos ?? [])
        .slice(0, 8)
        .map((f: {
          id: string; nombre: string; tipo_fondo_categoria: string;
          monto_texto: string | null; entidad_encargada: string | null;
          tags_visibles: string[]; score_total: number;
        }) => ({
          id: f.id,
          nombre: f.nombre,
          tipo_fondo_categoria: f.tipo_fondo_categoria,
          monto_texto: f.monto_texto,
          entidad_encargada: f.entidad_encargada,
          tags_visibles: f.tags_visibles ?? [],
          score_total: f.score_total,
        }))

      return NextResponse.json({
        departamento: { nombre: nombreDept, codigo: codigoDept },
        fondos: fondosMapped,
      })
    }
  } catch (e) {
    console.error('[/api/mapa/fondos-territorio] error', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
