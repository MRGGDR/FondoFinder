import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { Top5Request, Top5Response, Top5Result, AfinidadTier } from '@/types/top5'

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<Top5Request>
    const { p_actor_ui, p_paso2_ui, p_paso4_ui } = body

    if (!p_actor_ui || !p_paso2_ui || !p_paso4_ui) {
      return badRequest('Campos requeridos: p_actor_ui, p_paso2_ui, p_paso4_ui')
    }

    const payload: Top5Request = {
      p_actor_ui,
      p_paso2_ui,
      p_paso4_ui,
      p_territorio_codigo: body.p_territorio_codigo || null,
      p_chips: body.p_chips?.length ? body.p_chips : null,
      p_texto_libre: body.p_texto_libre || null,
    }

    const usingServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
    const db = getDb()

    // Debug server-side (no PII): log payload and key type
    if (process.env.TOP5_DEBUG === '1') {
      console.info('[top5] payload', payload)
      console.info('[top5] key', usingServiceKey ? 'service_role' : 'anon')
    }

    const { data, error } = await db.rpc('buscar_fondos_top5_v1', payload)

    if (error) {
      console.error('[/api/busqueda/top5] RPC error', error)
      return NextResponse.json({ error: 'Error al consultar fondos' }, { status: 500 })
    }

    if (process.env.TOP5_DEBUG === '1') {
      console.info('[top5] raw data', data)
    }

    const resultados: Top5Result[] = (data ?? []).map((row: Record<string, unknown>) => {
      return {
        fondo_id: String(row.fondo_id ?? row.id ?? ''),
        nombre_fondo: String(row.nombre ?? row.nombre_fondo ?? row.fondo_nombre ?? ''),
        entidad_encargada: row.entidad_encargada != null ? String(row.entidad_encargada) : null,
        pagina_web: row.pagina_web != null ? String(row.pagina_web) : null,
        vigencia: row.vigencia != null ? String(row.vigencia) : null,
        tier_afinidad: (row.tier_afinidad as AfinidadTier | undefined) ?? 'alta',
        mostrar_badge: typeof row.mostrar_badge === 'boolean'
          ? (row.mostrar_badge as boolean)
          : false,
        // Enrichment placeholders — filled below
        tipo_fondo_categoria: null,
        como_acceder: null,
        monto_texto: null,
        monto_min_usd: null,
        monto_max_usd: null,
        actividades_apoyadas: null,
        objetivos_fondo: null,
        publico_objetivo: null,
        acceso_modelo: null,
        estado_modelo: null,
        periodicidad_modelo: null,
      }
    })

    // Enrich with fondos table data
    const ids = resultados.map(r => r.fondo_id).filter(Boolean)
    if (ids.length) {
      const [fondosRes, modelosRes] = await Promise.all([
        db.from('fondos')
          .select('id, tipo_fondo_categoria, como_acceder, monto_texto, monto_min_usd, monto_max_usd, actividades_apoyadas, objetivos_fondo, publico_objetivo')
          .in('id', ids),
        db.from('fondos_modelos_aplicacion')
          .select('fondo_id, acceso, estado_convocatoria, periodicidad')
          .in('fondo_id', ids),
      ])

      const fondosMap: Record<string, Record<string, unknown>> = {}
      for (const f of (fondosRes.data ?? [])) {
        fondosMap[String(f.id)] = f as Record<string, unknown>
      }
      const modelosMap: Record<string, Record<string, unknown>> = {}
      for (const m of (modelosRes.data ?? [])) {
        const fid = String((m as Record<string, unknown>).fondo_id)
        if (!modelosMap[fid]) modelosMap[fid] = m as Record<string, unknown>
      }

      for (const r of resultados) {
        const f = fondosMap[r.fondo_id]
        const m = modelosMap[r.fondo_id]
        if (f) {
          r.tipo_fondo_categoria = f.tipo_fondo_categoria != null ? String(f.tipo_fondo_categoria) : null
          r.como_acceder = f.como_acceder != null ? String(f.como_acceder) : null
          r.monto_texto = f.monto_texto != null ? String(f.monto_texto) : null
          r.monto_min_usd = f.monto_min_usd != null ? Number(f.monto_min_usd) : null
          r.monto_max_usd = f.monto_max_usd != null ? Number(f.monto_max_usd) : null
          r.actividades_apoyadas = f.actividades_apoyadas != null ? String(f.actividades_apoyadas) : null
          r.objetivos_fondo = f.objetivos_fondo != null ? String(f.objetivos_fondo) : null
          r.publico_objetivo = f.publico_objetivo != null ? String(f.publico_objetivo) : null
        }
        if (m) {
          r.acceso_modelo = m.acceso != null ? String(m.acceso) : null
          r.estado_modelo = m.estado_convocatoria != null ? String(m.estado_convocatoria) : null
          r.periodicidad_modelo = m.periodicidad != null ? String(m.periodicidad) : null
        }
      }
    }

    const response: Top5Response = { resultados }
    return NextResponse.json(response)
  } catch (e) {
    console.error('[/api/busqueda/top5] unexpected', e)
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }
}
