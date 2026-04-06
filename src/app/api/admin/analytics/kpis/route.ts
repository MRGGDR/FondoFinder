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

import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()

    // Paralelo: usuarios, búsquedas totales, mapa origen (para contar municipios/depts), top fondos, última actividad
    const [perfilesRes, searchesRes, mapaOrigenRes, topFondosRes, ultimaActividadRes] =
      await Promise.all([
        db
          .from('perfiles_consulta')
          .select('id', { count: 'exact', head: true })
          .eq('activo', true),
        db
          .from('search_events')
          .select('id', { count: 'exact', head: true }),
        // Obtener todos los territorios con actividad (para contar municipios y depts)
        db
          .from('vw_busquedas_por_municipio_origen_v2')
          .select('*'),
        db
          .from('vw_top_fondos_consultados_v2')
          .select('*')
          .order('total_apariciones', { ascending: false })
          .limit(8),
        db
          .from('search_events')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1),
      ])

    // Contar departamentos únicos desde los datos del mapa
    const mapaRows = (mapaOrigenRes.data ?? []) as Array<Record<string, unknown>>
    const departamentosSet = new Set<string>()
    for (const row of mapaRows) {
      const dept = (row.departamento ?? row.codigo_departamento ?? '') as string
      if (dept) departamentosSet.add(dept)
    }

    const municipiosActivos = mapaRows.length
    const departamentosActivos = departamentosSet.size

    const ultimaActividad =
      (ultimaActividadRes.data?.[0] as { created_at?: string } | undefined)?.created_at ?? null

    return NextResponse.json({
      total_usuarios: perfilesRes.count ?? 0,
      total_busquedas: searchesRes.count ?? 0,
      municipios_activos: municipiosActivos,
      departamentos_activos: departamentosActivos,
      top_fondos: topFondosRes.data ?? [],
      ultima_actividad: ultimaActividad,
    })
  } catch (e) {
    console.error('[/api/admin/analytics/kpis]', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
