import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { jsonError, jsonOk } from '@/lib/http/apiResponse'
import { RATE_POLICIES } from '@/lib/http/ratePolicies'
import { consumeRateLimit } from '@/lib/http/rateLimit'

type FondoBase = {
  id: string
  nombre: string
  tipo_fondo_categoria: string | null
  monto_texto: string | null
  entidad_encargada: string | null
  tags_visibles: string[] | null
}

function normalizeCode(value: string): string {
  return value.replace(/\D+/g, '')
}

function mapFondos(rows: FondoBase[]): Array<{
  id: string
  nombre: string
  tipo_fondo_categoria: string
  monto_texto: string | null
  entidad_encargada: string | null
  tags_visibles: string[]
}> {
  return rows.map(row => ({
    id: String(row.id),
    nombre: String(row.nombre),
    tipo_fondo_categoria: row.tipo_fondo_categoria ?? 'N/A',
    monto_texto: row.monto_texto ?? null,
    entidad_encargada: row.entidad_encargada ?? null,
    tags_visibles: Array.isArray(row.tags_visibles) ? row.tags_visibles : [],
  }))
}

export async function GET(req: NextRequest) {
  const rate = consumeRateLimit(req, RATE_POLICIES.mapaFondosTerritorio)
  if (!rate.allowed) {
    return jsonError(429, 'Demasiadas solicitudes. Intenta de nuevo en unos segundos.', {
      code: 'rate_limited',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }

  const rawCode = req.nextUrl.searchParams.get('divipola')?.trim()

  if (!rawCode) {
    return jsonError(400, 'Parametro divipola requerido', {
      code: 'missing_divipola',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }

  const code = normalizeCode(rawCode)
  if (!code || !(code.length === 2 || code.length === 5)) {
    return jsonError(400, 'Codigo divipola invalido', {
      code: 'invalid_divipola',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }

  const db = getDb()

  try {
    const isMunicipio = code.length >= 4

    if (isMunicipio) {
      const muniCode = code.padStart(5, '0').slice(-5)

      const { data: municipioRows, error: municipioError } = await db
        .from('municipios')
        .select('id, nombre, departamento, codigo_departamento, codigo_divipola')
        .eq('codigo_divipola', muniCode)
        .limit(1)

      if (municipioError) {
        console.error('[/api/mapa/fondos-territorio] municipio error', municipioError)
        return jsonError(500, 'Error al consultar municipio', {
          code: 'db_query_failed',
          cacheControl: 'no-store',
          extraHeaders: rate.headers,
        })
      }

      const municipio = municipioRows?.[0] as {
        id: string
        nombre: string
        departamento: string
        codigo_departamento: string
        codigo_divipola: string
      } | undefined

      if (!municipio) {
        return jsonOk(
          { municipio: null, fondos: [], mensaje: 'Municipio no encontrado en la base de datos' },
          {
            cacheControl: 'public, s-maxage=120, stale-while-revalidate=600',
            extraHeaders: rate.headers,
          },
        )
      }

      const { data: coberturasRaw, error: coberturasError } = await db
        .from('fondos_cobertura_territorial')
        .select('fondo_id')
        .eq('municipio_id', municipio.id)

      if (coberturasError) {
        console.error('[/api/mapa/fondos-territorio] coberturas error', coberturasError)
        return jsonError(500, 'Error al consultar coberturas', {
          code: 'db_query_failed',
          cacheControl: 'no-store',
          extraHeaders: rate.headers,
        })
      }

      const fondoIds = Array.from(
        new Set((coberturasRaw ?? []).map(row => String((row as { fondo_id: string }).fondo_id)).filter(Boolean)),
      )

      if (fondoIds.length === 0) {
        return jsonOk(
          {
            municipio,
            fondos: [],
            mensaje: 'No hay fondos con cobertura explicita para este municipio',
          },
          {
            cacheControl: 'public, s-maxage=120, stale-while-revalidate=600',
            extraHeaders: rate.headers,
          },
        )
      }

      const { data: fondosRaw, error: fondosError } = await db
        .from('fondos')
        .select('id, nombre, tipo_fondo_categoria, monto_texto, entidad_encargada, tags_visibles')
        .in('id', fondoIds)
        .order('nombre', { ascending: true })
        .limit(12)

      if (fondosError) {
        console.error('[/api/mapa/fondos-territorio] fondos error', fondosError)
        return jsonError(500, 'Error al consultar fondos', {
          code: 'db_query_failed',
          cacheControl: 'no-store',
          extraHeaders: rate.headers,
        })
      }

      return jsonOk(
        {
          municipio,
          fondos: mapFondos((fondosRaw ?? []) as FondoBase[]),
        },
        {
          cacheControl: 'public, s-maxage=120, stale-while-revalidate=600',
          extraHeaders: rate.headers,
        },
      )
    }

    const deptCode = code.padStart(2, '0').slice(-2)

    const { data: deptSampleRaw, error: deptError } = await db
      .from('municipios')
      .select('departamento, codigo_departamento')
      .eq('codigo_departamento', deptCode)
      .limit(1)

    if (deptError) {
      console.error('[/api/mapa/fondos-territorio] dept error', deptError)
      return jsonError(500, 'Error al consultar departamento', {
        code: 'db_query_failed',
        cacheControl: 'no-store',
        extraHeaders: rate.headers,
      })
    }

    const deptName =
      (deptSampleRaw?.[0] as { departamento?: string } | undefined)?.departamento ??
      `Departamento ${deptCode}`

    const { data: coberturasRaw, error: coberturasError } = await db
      .from('fondos_cobertura_territorial')
      .select('fondo_id')
      .eq('codigo_departamento', deptCode)

    if (coberturasError) {
      console.error('[/api/mapa/fondos-territorio] dept coberturas error', coberturasError)
      return jsonError(500, 'Error al consultar coberturas', {
        code: 'db_query_failed',
        cacheControl: 'no-store',
        extraHeaders: rate.headers,
      })
    }

    const fondoIds = Array.from(
      new Set((coberturasRaw ?? []).map(row => String((row as { fondo_id: string }).fondo_id)).filter(Boolean)),
    )

    if (fondoIds.length === 0) {
      return jsonOk(
        {
          departamento: { nombre: deptName, codigo: deptCode },
          fondos: [],
          mensaje: 'No hay fondos con cobertura explicita para este departamento',
        },
        {
          cacheControl: 'public, s-maxage=120, stale-while-revalidate=600',
          extraHeaders: rate.headers,
        },
      )
    }

    const { data: fondosRaw, error: fondosError } = await db
      .from('fondos')
      .select('id, nombre, tipo_fondo_categoria, monto_texto, entidad_encargada, tags_visibles')
      .in('id', fondoIds)
      .order('nombre', { ascending: true })
      .limit(12)

    if (fondosError) {
      console.error('[/api/mapa/fondos-territorio] dept fondos error', fondosError)
      return jsonError(500, 'Error al consultar fondos', {
        code: 'db_query_failed',
        cacheControl: 'no-store',
        extraHeaders: rate.headers,
      })
    }

    return jsonOk(
      {
        departamento: { nombre: deptName, codigo: deptCode },
        fondos: mapFondos((fondosRaw ?? []) as FondoBase[]),
      },
      {
        cacheControl: 'public, s-maxage=120, stale-while-revalidate=600',
        extraHeaders: rate.headers,
      },
    )
  } catch (error) {
    console.error('[/api/mapa/fondos-territorio] unexpected', error)
    return jsonError(500, 'Error interno', {
      code: 'internal_error',
      cacheControl: 'no-store',
      extraHeaders: rate.headers,
    })
  }
}
