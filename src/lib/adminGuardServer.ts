import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getAdminAccessCodeServer, normalizeAccessCode } from '@/lib/adminAccess'
import { consumeRateLimit } from '@/lib/http/rateLimit'
import { RATE_POLICIES } from '@/lib/http/ratePolicies'

type AdminGuardResult =
  | { ok: true }
  | { ok: false; status: number; error: string }

/**
 * Valida que la solicitud venga del perfil admin real en perfiles_consulta.
 * Requiere headers:
 * - x-perfil-id
 * - x-admin-code
 */
export async function authorizeAdminRequest(req: NextRequest): Promise<AdminGuardResult> {
  const perfilId = req.headers.get('x-perfil-id')?.trim() ?? ''
  const adminCode = req.headers.get('x-admin-code')?.trim() ?? ''
  const configuredAdminCode = getAdminAccessCodeServer()
  const rate = consumeRateLimit(req, RATE_POLICIES.adminAnalytics, [perfilId || 'anon'])

  if (!rate.allowed) {
    return { ok: false, status: 429, error: 'Demasiadas solicitudes. Intenta de nuevo en unos segundos.' }
  }

  if (!configuredAdminCode) {
    return { ok: false, status: 503, error: 'Configuracion admin incompleta en servidor' }
  }

  if (!perfilId || !adminCode) {
    return { ok: false, status: 401, error: 'Credenciales admin requeridas' }
  }
  if (normalizeAccessCode(adminCode) !== configuredAdminCode) {
    return { ok: false, status: 403, error: 'Acceso denegado' }
  }

  const db = getDb()
  const { data, error } = await db
    .from('perfiles_consulta')
    .select('id, codigo_acceso, activo')
    .eq('id', perfilId)
    .eq('activo', true)
    .maybeSingle()

  if (error || !data) {
    return { ok: false, status: 403, error: 'Acceso denegado' }
  }

  const row = data as { codigo_acceso: string | null }
  if (normalizeAccessCode(row.codigo_acceso) !== normalizeAccessCode(adminCode)) {
    return { ok: false, status: 403, error: 'Acceso denegado' }
  }
  if (normalizeAccessCode(row.codigo_acceso) !== configuredAdminCode) {
    return { ok: false, status: 403, error: 'Acceso denegado' }
  }

  return { ok: true }
}
