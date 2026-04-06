/**
 * lightSession.ts
 *
 * Helpers para la sesión ligera de FondosFinder.
 * NO usa Supabase Auth. Solo localStorage + API de perfiles.
 *
 * Clave de almacenamiento: 'ff_perfil_consulta'
 * Tiempo de validez local (sin re-verificar): 7 días
 */

export const STORAGE_KEY = 'ff_perfil_consulta'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 días

export interface PerfilLocal {
  perfil_id: string
  codigo_acceso: string
  nombre_contacto: string | null
  municipio_id: string | null
  nombre_municipio: string | null
  departamento: string | null
  tipo_actor: string | null
  entidad: string | null
  guardado_en: number
}

/** Lee el perfil del localStorage. Devuelve null si no existe o está corrupto. */
export function leerPerfilLocal(): PerfilLocal | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PerfilLocal
    if (!parsed.perfil_id || !parsed.codigo_acceso) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Decide si el perfil local sigue siendo válido sin hacer llamada al servidor.
 * Reglas:
 *  - debe tener perfil_id y codigo_acceso
 *  - no debe haber expirado (7 días)
 */
export function esPerfilLocalValido(perfil: PerfilLocal | null): boolean {
  if (!perfil) return false
  if (!perfil.perfil_id || !perfil.codigo_acceso) return false
  if (Date.now() - (perfil.guardado_en ?? 0) > MAX_AGE_MS) return false
  return true
}

/** Persiste el perfil en localStorage. */
export function persistirPerfilLocal(datos: Omit<PerfilLocal, 'guardado_en'>): PerfilLocal {
  const local: PerfilLocal = { ...datos, guardado_en: Date.now() }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(local))
  } catch {
    // localStorage lleno — no crítico
  }
  return local
}

/** Limpia el perfil del localStorage. */
export function limpiarPerfilLocal(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

/** Convierte la respuesta de la API de perfiles a PerfilLocal. */
export function respuestaAPerfilLocal(
  resp: {
    perfil_id: string
    codigo_acceso: string
    nombre_contacto?: string | null
    municipio_id?: string | null
    nombre_municipio?: string | null
    departamento?: string | null
    tipo_actor?: string | null
    entidad?: string | null
  }
): PerfilLocal {
  return persistirPerfilLocal({
    perfil_id:       resp.perfil_id,
    codigo_acceso:   resp.codigo_acceso,
    nombre_contacto: resp.nombre_contacto ?? null,
    municipio_id:    resp.municipio_id ?? null,
    nombre_municipio: resp.nombre_municipio ?? null,
    departamento:    resp.departamento ?? null,
    tipo_actor:      resp.tipo_actor ?? null,
    entidad:         resp.entidad ?? null,
  })
}
