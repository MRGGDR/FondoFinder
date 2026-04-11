import type { NextRequest } from 'next/server'

function pickForwardedIp(value: string | null): string | null {
  if (!value) return null
  const first = value.split(',')[0]?.trim()
  return first || null
}

export function getClientIp(req: NextRequest): string {
  const forwarded = pickForwardedIp(req.headers.get('x-forwarded-for'))
  const realIp = req.headers.get('x-real-ip')?.trim()
  return forwarded || realIp || 'unknown'
}
