/**
 * GET /api/admin/analytics/mapa-origen
 *
 * Datos para colorear el mapa admin por actividad de ORIGEN del usuario.
 * El origen es municipio_origen_id en search_events (municipio del perfil).
 *
 * Devuelve lista de territorios con:
 *   municipio_id, nombre, departamento, codigo_divipola,
 *   codigo_departamento, total_busquedas, usuarios_unicos, ultima_busqueda
 *
 * Usado por el mapa admin para construir el heatmap de calor.
 *
 * NOTAS TÉCNICAS:
 *   La vista vw_busquedas_por_municipio_origen_v2 puede no incluir codigo_divipola.
 *   Este endpoint fuerza la unión con municipios para garantizar el código DIVIPOLA
 *   necesario para colorear el GeoJSON.
 *
 *   Vista sugerida para implementar en SQL (si se quiere mejor rendimiento):
 *   CREATE OR REPLACE VIEW vw_analytics_mapa_origen AS
 *   SELECT
 *     se.municipio_origen_id as municipio_id,
 *     m.nombre, m.departamento, m.codigo_divipola, m.codigo_departamento,
 *     COUNT(DISTINCT se.perfil_id) as usuarios_unicos,
 *     COUNT(*) as total_busquedas,
 *     MAX(se.created_at) as ultima_busqueda
 *   FROM search_events se
 *   JOIN municipios m ON m.id = se.municipio_origen_id
 *   WHERE se.municipio_origen_id IS NOT NULL
 *   GROUP BY se.municipio_origen_id, m.nombre, m.departamento, m.codigo_divipola, m.codigo_departamento
 *   ORDER BY total_busquedas DESC;
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { authorizeAdminRequest } from '@/lib/adminGuardServer'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  // ?modo=busquedas|usuarios (para el toggle del mapa)
  const modo = searchParams.get('modo') === 'usuarios' ? 'usuarios' : 'busquedas'
  const noStore = { 'Cache-Control': 'no-store' }

  try {
    const auth = await authorizeAdminRequest(req)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: noStore })
    }

    const db = getDb()

    // Siempre necesitamos el mapa de municipios para código DIVIPOLA
    // Colombia tiene ~1122 municipios > límite 1000 de Supabase → dos páginas en paralelo
    const [muniRes1, muniRes2] = await Promise.all([
      db.from('municipios').select('id, codigo_divipola, codigo_departamento, nombre, departamento').range(0, 999),
      db.from('municipios').select('id, codigo_divipola, codigo_departamento, nombre, departamento').range(1000, 1999),
    ])

    const allMunicipios = [
      ...((muniRes1.data ?? []) as Array<{ id: string; codigo_divipola: string; codigo_departamento: string; nombre: string; departamento: string }>),
      ...((muniRes2.data ?? []) as Array<{ id: string; codigo_divipola: string; codigo_departamento: string; nombre: string; departamento: string }>),
    ]
    const muniMap = Object.fromEntries(allMunicipios.map(m => [m.id, m]))

    // Modo USUARIOS: leer de perfiles_consulta agrupado por municipio
    if (modo === 'usuarios') {
      const perfilesRes = await db
        .from('perfiles_consulta')
        .select('municipio_id, created_at')
        .not('municipio_id', 'is', null)

      const perfiles = (perfilesRes.data ?? []) as Array<{
        municipio_id: string
        created_at: string
      }>

      // Agrupar por municipio
      const porMunicipio = new Map<string, { count: number; ultimo: string }>()
      for (const p of perfiles) {
        const prev = porMunicipio.get(p.municipio_id)
        const ultimo = prev?.ultimo
          ? p.created_at > prev.ultimo ? p.created_at : prev.ultimo
          : p.created_at
        porMunicipio.set(p.municipio_id, { count: (prev?.count ?? 0) + 1, ultimo })
      }

      const territoryList = Array.from(porMunicipio.entries()).map(([municipio_id, stats]) => {
        const muni = muniMap[municipio_id]
        return {
          municipio_id,
          nombre: muni?.nombre ?? '',
          departamento: muni?.departamento ?? '',
          codigo_divipola: muni?.codigo_divipola ?? null,
          codigo_departamento: muni?.codigo_departamento ?? null,
          total_busquedas: stats.count,
          usuarios_unicos: stats.count,
          ultima_busqueda: stats.ultimo,
        }
      }).filter(t => t.codigo_divipola)
        .sort((a, b) => b.usuarios_unicos - a.usuarios_unicos)

      const maxUsuarios = Math.max(...territoryList.map(t => t.usuarios_unicos), 1)

      return NextResponse.json({
        modo,
        max_busquedas: maxUsuarios,
        max_usuarios: maxUsuarios,
        territorios: territoryList,
      }, { headers: noStore })
    }

    // Modo BÚSQUEDAS (default): agregar desde ng_search_events
    const ngRes = await db
      .from('ng_search_events')
      .select('municipio_origen_id, perfil_id, created_at')
      .not('municipio_origen_id', 'is', null)

    const ngRows = (ngRes.data ?? []) as Array<{
      municipio_origen_id: string
      perfil_id: string | null
      created_at: string
    }>

    // Agrupar por municipio
    const porMunicipio = new Map<string, { count: number; perfiles: Set<string>; ultimo: string }>()
    for (const r of ngRows) {
      const mid = r.municipio_origen_id
      const prev = porMunicipio.get(mid)
      const perfilesSet = prev?.perfiles ?? new Set<string>()
      if (r.perfil_id) perfilesSet.add(r.perfil_id)
      const ultimo = prev?.ultimo
        ? r.created_at > prev.ultimo ? r.created_at : prev.ultimo
        : r.created_at
      porMunicipio.set(mid, { count: (prev?.count ?? 0) + 1, perfiles: perfilesSet, ultimo })
    }

    const territoryList = Array.from(porMunicipio.entries()).map(([municipio_id, stats]) => {
      const muni = muniMap[municipio_id]
      return {
        municipio_id,
        nombre:              muni?.nombre ?? '',
        departamento:        muni?.departamento ?? '',
        codigo_divipola:     muni?.codigo_divipola ?? null,
        codigo_departamento: muni?.codigo_departamento ?? null,
        total_busquedas:     stats.count,
        usuarios_unicos:     stats.perfiles.size,
        ultima_busqueda:     stats.ultimo,
      }
    }).filter(t => t.codigo_divipola)
      .sort((a, b) => b.total_busquedas - a.total_busquedas)

    // Calcular el máximo para normalizar intensidad en el cliente
    const maxBusquedas = Math.max(...territoryList.map(t => t.total_busquedas), 1)
    const maxUsuarios  = Math.max(...territoryList.map(t => t.usuarios_unicos), 1)

    return NextResponse.json({
      modo,
      max_busquedas: maxBusquedas,
      max_usuarios: maxUsuarios,
      territorios: territoryList,
    }, { headers: noStore })
  } catch (e) {
    console.error('[/api/admin/analytics/mapa-origen]', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500, headers: noStore })
  }
}
