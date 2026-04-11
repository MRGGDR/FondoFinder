export function normalizeAccessCode(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

function readServerAdminCode(): string | null {
  const code = normalizeAccessCode(process.env.ADMIN_ACCESS_CODE)
  return code || null
}

export function getAdminAccessCodeServer(): string | null {
  return readServerAdminCode()
}

export function isAdminAccessCodeServer(value: string | null | undefined): boolean {
  const expected = readServerAdminCode()
  if (!expected) return false
  return normalizeAccessCode(value) === expected
}

export function isAdminPerfil(
  perfil: { es_admin?: boolean | null } | null | undefined,
): boolean {
  return perfil?.es_admin === true
}

export function getAdminRequestHeaders(
  perfil: { perfil_id?: string | null; codigo_acceso?: string | null } | null | undefined,
): Record<string, string> {
  if (!perfil?.perfil_id || !perfil?.codigo_acceso) return {}
  return {
    'x-perfil-id': perfil.perfil_id,
    'x-admin-code': perfil.codigo_acceso,
  }
}
