/**
 * GET /api/admin/analytics/usuarios-mapa
 *
 * Perfiles de consulta agrupados por municipio y departamento.
 * Lee desde `perfiles_consulta` (sistema LightSession, poblado en AccessModal)
 * haciendo JOIN con `municipios` para obtener divipola y departamento.
 *
 * Devuelve:
 *   municipios: lista con municipio_id, nombre, departamento, codigo_divipola,
 *               codigo_departamento, total_usuarios, ultimo_registro
 *   departamentos: lista agrupada por departamento con total_usuarios
 *   total: conteo global de perfiles con municipio registrado
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { authorizeAdminRequest } from '@/lib/adminGuardServer'

interface UsuarioMunicipioRow {
  municipio_id: string
  nombre: string
  departamento: string
  codigo_divipola: string | null
  codigo_departamento: string | null
  total_usuarios: number
  ultimo_registro: string | null
}

interface DeptoResumen {
  departamento: string
  codigo_departamento: string | null
  total_usuarios: number
}

export async function GET(req: NextRequest) {
  const noStore = { 'Cache-Control': 'no-store' }
  try {
    const auth = await authorizeAdminRequest(req)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: noStore })
    }

    const db = getDb()

    // Traer perfiles_consulta con municipio en paralelo con la tabla municipios y total global
    // Nota: Colombia tiene ~1122 municipios > límite 1000 de Supabase → dos páginas
    const [perfilesRes, muniRes1, muniRes2, totalRes] = await Promise.all([
      db
        .from('perfiles_consulta')
        .select('municipio_id, created_at')
        .not('municipio_id', 'is', null),
      db
        .from('municipios')
        .select('id, nombre, departamento, codigo_divipola, codigo_departamento')
        .range(0, 999),
      db
        .from('municipios')
        .select('id, nombre, departamento, codigo_divipola, codigo_departamento')
        .range(1000, 1999),
      db
        .from('perfiles_consulta')
        .select('id', { count: 'exact', head: true }),
    ])

    const perfiles = (perfilesRes.data ?? []) as Array<{
      municipio_id: string
      created_at: string
    }>

    const allMunicipios = [
      ...((muniRes1.data ?? []) as Array<{ id: string; nombre: string; departamento: string; codigo_divipola: string | null; codigo_departamento: string | null }>),
      ...((muniRes2.data ?? []) as Array<{ id: string; nombre: string; departamento: string; codigo_divipola: string | null; codigo_departamento: string | null }>),
    ]
    const municipiosLookup = Object.fromEntries(allMunicipios.map(m => [m.id, m]))

    // Agrupar por municipio_id
    const porMunicipio = new Map<string, { count: number; ultimo: string | null }>()
    for (const u of perfiles) {
      const prev = porMunicipio.get(u.municipio_id)
      const ultimo = prev?.ultimo
        ? u.created_at > prev.ultimo ? u.created_at : prev.ultimo
        : u.created_at
      porMunicipio.set(u.municipio_id, {
        count: (prev?.count ?? 0) + 1,
        ultimo,
      })
    }

    // Construir lista de municipios
    const municipios: UsuarioMunicipioRow[] = []
    for (const [municipio_id, stats] of Array.from(porMunicipio.entries())) {
      const m = municipiosLookup[municipio_id]
      municipios.push({
        municipio_id,
        nombre: m?.nombre ?? `(ID: ${municipio_id.slice(0, 8)}…)`,
        departamento: m?.departamento ?? 'Sin información',
        codigo_divipola: m?.codigo_divipola ?? null,
        codigo_departamento: m?.codigo_departamento ?? null,
        total_usuarios: stats.count,
        ultimo_registro: stats.ultimo,
      })
    }
    municipios.sort((a, b) => b.total_usuarios - a.total_usuarios)

    // Agrupar por departamento
    const porDepto = new Map<string, { codigo: string | null; count: number }>()
    for (const row of municipios) {
      const prev = porDepto.get(row.departamento)
      porDepto.set(row.departamento, {
        codigo: prev?.codigo ?? row.codigo_departamento,
        count: (prev?.count ?? 0) + row.total_usuarios,
      })
    }
    const departamentos: DeptoResumen[] = Array.from(porDepto.entries())
      .map(([departamento, v]) => ({
        departamento,
        codigo_departamento: v.codigo,
        total_usuarios: v.count,
      }))
      .sort((a, b) => b.total_usuarios - a.total_usuarios)

    return NextResponse.json({
      total: totalRes.count ?? perfiles.length,
      municipios,
      departamentos,
    }, { headers: noStore })
  } catch (e: unknown) {
    console.error('[/api/admin/analytics/usuarios-mapa] unexpected', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500, headers: noStore })
  }
}
