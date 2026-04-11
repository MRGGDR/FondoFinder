/**
 * db.ts - Server-side Supabase access layer.
 *
 * Use only in server contexts:
 * - src/app/api/* route handlers
 * - src/app/[route]/page.tsx server components
 */

import { createClient as createSupabaseServerClient } from '@supabase/supabase-js'

/**
 * Privileged server client.
 * Requires SUPABASE_SERVICE_ROLE_KEY (fail-fast, no silent fallback).
 */
export function getDbPrivileged() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL for server-side Supabase client')
  }
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY for server-side privileged client')
  }

  return createSupabaseServerClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  })
}

/**
 * Non-privileged server client (public reads / public RPCs).
 * Explicitly separated from privileged server access.
 */
export function getDbPublicServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL for server-side public client')
  }
  if (!anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY for server-side public client')
  }

  return createSupabaseServerClient(url, anonKey, {
    auth: { persistSession: false },
  })
}

/**
 * Backward-compatible alias used by current server routes/components.
 * It is now always privileged (service role required).
 */
export function getDb() {
  return getDbPrivileged()
}
