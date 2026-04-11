import { NextResponse } from 'next/server'

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

interface ResponseOptions {
  status?: number
  cacheControl?: string
  extraHeaders?: HeadersInit
}

const BASE_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

function buildHeaders(options?: ResponseOptions): Headers {
  const headers = new Headers(BASE_HEADERS)
  if (options?.cacheControl) headers.set('Cache-Control', options.cacheControl)
  if (options?.extraHeaders) {
    const extra = new Headers(options.extraHeaders)
    extra.forEach((value, key) => headers.set(key, value))
  }
  return headers
}

export function jsonOk<T extends JsonValue | Record<string, unknown>>(
  payload: T,
  options?: ResponseOptions,
) {
  return NextResponse.json(payload, {
    status: options?.status ?? 200,
    headers: buildHeaders(options),
  })
}

export function jsonError(
  status: number,
  message: string,
  options?: Omit<ResponseOptions, 'status'> & { code?: string },
) {
  const body: Record<string, string> = { error: message }
  if (options?.code) body.code = options.code
  return NextResponse.json(body, {
    status,
    headers: buildHeaders(options),
  })
}
