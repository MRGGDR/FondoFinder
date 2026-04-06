import type { AfinidadTier } from '@/types/top5'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — Next.js soporta resolveJsonModule
import rowsJson from './buscador-top5.generated.json'

export interface CatalogoFila {
  fondo_id: string
  ruta_id: string
  paso_1_bucket_ui: string
  paso_2_ui: string
  paso_3_tema_principal: string
  paso_4_ui: string
  paso_5_visibilidad_ui: string
  paso_6_refinadores: string
  nivel_confianza: string
  actor_buckets: string[]
  refinadores: string[]
}

// Utilidades
function splitAndTrim(val?: string): string[] {
  if (!val) return []
  return val
    .split('|')
    .map(v => v.trim())
    .filter(Boolean)
}

const rows: any[] = rowsJson as any[]

const filas: CatalogoFila[] = rows.map(r => ({
  fondo_id: r.fondo_id,
  ruta_id: r.ruta_id,
  paso_1_bucket_ui: r.paso_1_bucket_ui,
  paso_2_ui: r.paso_2_ui,
  paso_3_tema_principal: r.paso_3_tema_principal,
  paso_4_ui: r.paso_4_ui,
  paso_5_visibilidad_ui: r.paso_5_visibilidad_ui,
  paso_6_refinadores: r.paso_6_refinadores,
  nivel_confianza: r.nivel_confianza,
  actor_buckets: splitAndTrim(r.paso_1_bucket_ui),
  refinadores: splitAndTrim(r.paso_6_refinadores),
}))

export const BUSCADOR_ROWS: CatalogoFila[] = filas

export const ACTORES = Array.from(
  new Set(filas.flatMap(f => f.actor_buckets))
).sort((a, b) => a.localeCompare(b, 'es'))

export const PASO2_OPCIONES = Array.from(
  new Set(filas.map(f => f.paso_2_ui.trim()))
).sort((a, b) => a.localeCompare(b, 'es'))

export const PASO4_OPCIONES = Array.from(
  new Set(filas.map(f => f.paso_4_ui.trim()))
).sort((a, b) => a.localeCompare(b, 'es'))

export const TEMAS_OPCIONES = Array.from(
  new Set(filas.map(f => f.paso_3_tema_principal.trim()))
).sort((a, b) => a.localeCompare(b, 'es'))

// Chips por tema principal
const chipsMap = new Map<string, string[]>()
for (const fila of filas) {
  const tema = fila.paso_3_tema_principal.trim()
  const chips = splitAndTrim(fila.paso_6_refinadores)
  if (!chips.length) continue
  const prev = chipsMap.get(tema) ?? []
  chipsMap.set(tema, Array.from(new Set([...prev, ...chips])))
}

export const CHIPS_POR_TEMA = chipsMap

// Combinaciones que requieren territorio (paso 5 condicional)
const condicionalKeys = new Set<string>()
for (const fila of filas) {
  if (fila.paso_5_visibilidad_ui?.toLowerCase() === 'condicional') {
    condicionalKeys.add(`${fila.paso_2_ui}|||${fila.paso_4_ui}`)
  }
}

export function requiereTerritorio(paso2: string | null, paso4: string | null): boolean {
  if (!paso2 || !paso4) return false
  return condicionalKeys.has(`${paso2}|||${paso4}`)
}

export type TierAfinidad = AfinidadTier

// Helpers para el wizard contextual
export function filterRows(params: {
  actor?: string | null
  paso2?: string | null
  tema?: string | null
  via?: string | null
}) {
  const { actor, paso2, tema, via } = params
  return BUSCADOR_ROWS.filter(row => {
    if (actor && !row.actor_buckets.includes(actor)) return false
    if (paso2 && row.paso_2_ui !== paso2) return false
    if (tema && row.paso_3_tema_principal !== tema) return false
    if (via && row.paso_4_ui !== via) return false
    return true
  })
}

export function distinct<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}
