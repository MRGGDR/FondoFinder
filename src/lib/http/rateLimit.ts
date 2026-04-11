import type { NextRequest } from 'next/server'
import { getClientIp } from '@/lib/http/clientIp'

type Bucket = {
  count: number
  resetAt: number
}

type RateLimitStore = Map<string, Bucket>

declare global {
  // eslint-disable-next-line no-var
  var __ffRateLimitStore: RateLimitStore | undefined
}

const store: RateLimitStore = globalThis.__ffRateLimitStore ?? new Map<string, Bucket>()
if (!globalThis.__ffRateLimitStore) {
  globalThis.__ffRateLimitStore = store
}

export interface RateLimitPolicy {
  id: string
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  headers: Headers
  retryAfterSec: number
}

function cleanupStore(now: number) {
  if (store.size < 2000) return
  store.forEach((bucket, key) => {
    if (bucket.resetAt <= now) {
      store.delete(key)
    }
  })
}

export function consumeRateLimit(
  req: NextRequest,
  policy: RateLimitPolicy,
  keyParts: Array<string | null | undefined> = [],
): RateLimitResult {
  const now = Date.now()
  cleanupStore(now)

  const ip = getClientIp(req)
  const extra = keyParts.map(v => (v ?? '').trim()).filter(Boolean)
  const key = [policy.id, ip, ...extra].join(':')

  const current = store.get(key)
  const resetAt = current && current.resetAt > now ? current.resetAt : now + policy.windowMs
  const count = current && current.resetAt > now ? current.count + 1 : 1

  store.set(key, { count, resetAt })

  const allowed = count <= policy.limit
  const remaining = Math.max(0, policy.limit - count)
  const retryAfterSec = Math.max(1, Math.ceil((resetAt - now) / 1000))

  const headers = new Headers()
  headers.set('X-RateLimit-Limit', String(policy.limit))
  headers.set('X-RateLimit-Remaining', String(remaining))
  headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)))
  if (!allowed) {
    headers.set('Retry-After', String(retryAfterSec))
  }

  return { allowed, headers, retryAfterSec }
}
