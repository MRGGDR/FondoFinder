import type { NextRequest } from 'next/server'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export async function parseJsonBody(
  req: NextRequest,
  options?: { maxBytes?: number },
): Promise<unknown> {
  const maxBytes = options?.maxBytes ?? 16 * 1024
  const contentLength = req.headers.get('content-length')
  if (contentLength) {
    const declared = Number(contentLength)
    if (Number.isFinite(declared) && declared > maxBytes) {
      throw new ValidationError(`Payload demasiado grande (max ${maxBytes} bytes)`)
    }
  }

  const text = await req.text()
  if (!text) return {}

  const actualBytes = Buffer.byteLength(text, 'utf8')
  if (actualBytes > maxBytes) {
    throw new ValidationError(`Payload demasiado grande (max ${maxBytes} bytes)`)
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new ValidationError('JSON invalido')
  }
}

export function ensureObject(value: unknown, label = 'payload'): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError(`${label} invalido`)
  }
  return value as Record<string, unknown>
}

export function asOptionalString(
  value: unknown,
  options?: { trim?: boolean; maxLen?: number; minLen?: number },
): string | null {
  if (value == null) return null
  if (typeof value !== 'string') {
    throw new ValidationError('Campo de texto invalido')
  }
  const trim = options?.trim ?? true
  const parsed = trim ? value.trim() : value
  if (options?.minLen != null && parsed.length < options.minLen) {
    throw new ValidationError(`Texto demasiado corto (min ${options.minLen})`)
  }
  if (options?.maxLen != null && parsed.length > options.maxLen) {
    throw new ValidationError(`Texto demasiado largo (max ${options.maxLen})`)
  }
  return parsed
}

export function asOptionalUuid(value: unknown): string | null {
  const parsed = asOptionalString(value, { minLen: 1, maxLen: 64 })
  if (parsed === null) return null
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRe.test(parsed)) {
    throw new ValidationError('UUID invalido')
  }
  return parsed
}

export function asOptionalInt(
  value: unknown,
  options?: { min?: number; max?: number },
): number | null {
  if (value == null) return null
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed)) {
    throw new ValidationError('Entero invalido')
  }
  if (options?.min != null && parsed < options.min) {
    throw new ValidationError(`Valor minimo permitido: ${options.min}`)
  }
  if (options?.max != null && parsed > options.max) {
    throw new ValidationError(`Valor maximo permitido: ${options.max}`)
  }
  return parsed
}

export function asIntArray(
  value: unknown,
  options?: { maxItems?: number; min?: number; max?: number },
): number[] {
  if (value == null) return []
  if (!Array.isArray(value)) {
    throw new ValidationError('Se esperaba un arreglo de enteros')
  }
  const maxItems = options?.maxItems ?? 100
  if (value.length > maxItems) {
    throw new ValidationError(`Arreglo demasiado grande (max ${maxItems})`)
  }

  const values = value.map(item => asOptionalInt(item, options))
  return Array.from(
    new Set(values.filter((n): n is number => Number.isInteger(n))),
  )
}

export function assertRegex(value: string, regex: RegExp, message: string): string {
  if (!regex.test(value)) {
    throw new ValidationError(message)
  }
  return value
}
