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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  // ?modo=busquedas|usuarios (para el toggle del mapa)
  const modo = searchParams.get('modo') === 'usuarios' ? 'usuarios' : 'busquedas'

  try {
    const db = getDb()

    // Paralelo: datos del mapa origen + mapa de municipios (para divipola codes)
    const [vistaRes, municipiosRes] = await Promise.all([
      db
        .from('vw_busquedas_por_municipio_origen_v2')
        .select('*')
        .order('total_busquedas', { ascending: false }),
      db
        .from('municipios')
        .select('id, codigo_divipola, codigo_departamento, nombre, departamento'),
    ])

    // Mapa uuid → municipio row para enriquecer la vista con divipola
    const muniMap = Object.fromEntries(
      ((municipiosRes.data ?? []) as Array<{
        id: string
        codigo_divipola: string
        codigo_departamento: string
        nombre: string
        departamento: string
      }>).map(m => [m.id, m])
    )

    const rows = (vistaRes.data ?? []) as Array<Record<string, unknown>>

    // Normalizar a estructura uniforme, inferir divipola si la vista no lo incluye
    const territoryList = rows.map(row => {
      const municipioId = String(row.municipio_id ?? row.id ?? '')
      const muni = municipioId ? muniMap[municipioId] : null
      return {
        municipio_id:      municipioId || null,
        nombre:            (row.nombre ?? row.municipio_nombre ?? muni?.nombre ?? '') as string,
        departamento:      (row.departamento ?? muni?.departamento ?? '') as string,
        codigo_divipola:   (row.codigo_divipola ?? muni?.codigo_divipola ?? null) as string | null,
        codigo_departamento: (row.codigo_departamento ?? muni?.codigo_departamento ?? null) as string | null,
        total_busquedas:   Number(row.total_busquedas ?? 0),
        usuarios_unicos:   Number(row.usuarios_unicos ?? 0),
        ultima_busqueda:   (row.ultima_busqueda ?? null) as string | null,
      }
    })

    // Calcular el máximo para normalizar intensidad en el cliente
    const maxBusquedas = Math.max(...territoryList.map(t => t.total_busquedas), 1)
    const maxUsuarios  = Math.max(...territoryList.map(t => t.usuarios_unicos), 1)

    return NextResponse.json({
      modo,
      max_busquedas: maxBusquedas,
      max_usuarios: maxUsuarios,
      territorios: territoryList,
    })
  } catch (e) {
    console.error('[/api/admin/analytics/mapa-origen]', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
