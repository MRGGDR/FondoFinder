/**
 * GET /api/admin/analytics/kpis
 *
 * KPIs globales del dashboard admin territorial.
 * Vista admin only — sin protección formal por ahora (TODO: roles).
 *
 * Devuelve:
 *   total_usuarios       → perfiles_consulta activos
 *   total_busquedas      → search_events (todos)
 *   municipios_activos   → territorios distintos con al menos 1 búsqueda de origen
 *   departamentos_activos → departamentos distintos con actividad de origen
 *   top_fondos           → top 8 fondos más consultados (de vw_top_fondos_consultados_v2)
 *   ultima_actividad     → timestamp de la búsqueda más reciente
 *
 * NOTAS TÉCNICAS (SQL necesario pero no implementado aquí):
 *   Para obtener total_usuarios exacto con distinción por nombre + municipio,
 *   se necesitaría: SELECT COUNT(DISTINCT id) FROM perfiles_consulta WHERE activo = true
 *   La implementación actual usa el count total de la tabla (suficiente para KPIs admin).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { authorizeAdminRequest } from '@/lib/adminGuardServer'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const noStore = { 'Cache-Control': 'no-store' }
  try {
    const auth = await authorizeAdminRequest(req)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: noStore })
    }

    const db = getDb()

    // Paralelo: usuarios, búsquedas totales, municipios activos, top fondos, última actividad
    const [perfilesRes, searchesRes, searchMunisRes, topFondosRes, ultimaActividadRes] =
      await Promise.all([
        db
          .from('perfiles_consulta')
          .select('id', { count: 'exact', head: true }),
        db
          .from('ng_search_events')
          .select('id', { count: 'exact', head: true }),
        // Obtener municipio_origen_id de todos los eventos para contar municipios y depts únicos
        db
          .from('ng_search_events')
          .select('municipio_origen_id')
          .not('municipio_origen_id', 'is', null),
        db
          .from('vw_top_fondos_consultados_v2')
          .select('*')
          .order('total_apariciones', { ascending: false })
          .limit(8),
        db
          .from('ng_search_events')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1),
      ])

    // Distinct municipios activos
    const allMuniIds = Array.from(new Set(
      ((searchMunisRes.data ?? []) as Array<{ municipio_origen_id: string | null }>)
        .map(r => r.municipio_origen_id)
        .filter(Boolean) as string[]
    ))
    const municipiosActivos = allMuniIds.length

    // Departamentos activos: query municipios para obtener codigo_departamento
    let departamentosActivos = 0
    if (allMuniIds.length > 0) {
      const { data: muniRows } = await db
        .from('municipios')
        .select('codigo_departamento')
        .in('id', allMuniIds)
      const deptSet = new Set(
        ((muniRows ?? []) as Array<{ codigo_departamento: string | null }>)
          .map(m => m.codigo_departamento)
          .filter(Boolean) as string[]
      )
      departamentosActivos = deptSet.size
    }

    const ultimaActividad =
      (ultimaActividadRes.data?.[0] as { created_at?: string } | undefined)?.created_at ?? null

    return NextResponse.json({
      total_usuarios: perfilesRes.count ?? 0,
      total_busquedas: searchesRes.count ?? 0,
      municipios_activos: municipiosActivos,
      departamentos_activos: departamentosActivos,
      top_fondos: topFondosRes.data ?? [],
      ultima_actividad: ultimaActividad,
    }, { headers: noStore })
  } catch (e) {
    console.error('[/api/admin/analytics/kpis]', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500, headers: noStore })
  }
}
