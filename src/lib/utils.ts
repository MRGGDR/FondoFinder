import type { TipoFondo } from '@/types/database'

// Formatear montos
export function formatUSD(amount: number | null): string {
  if (!amount) return 'No especificado'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCOP(amount: number | null): string {
  if (!amount) return 'No especificado'
  const cop = amount * 4200
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(cop)
}

export function usdToCOP(usd: number): number {
  return usd * 4200
}

export function copToUSD(cop: number): number {
  return cop / 4200
}

// Color por tipo de fondo (colores UNGRD)
export function colorTipoFondo(tipo: TipoFondo | string): string {
  const map: Record<string, string> = {
    'Nacional':       'bg-ungrd-blue-dark text-white',
    'Territorial':    'bg-ungrd-blue-mid text-white',
    'Internacional':  'bg-ungrd-navy text-white',
  }
  return map[tipo] ?? 'bg-ungrd-gray text-white'
}

// Truncar texto
export function truncate(text: string | null, length = 150): string {
  if (!text) return ''
  return text.length > length ? text.slice(0, length) + '…' : text
}
