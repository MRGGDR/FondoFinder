import { createBrowserClient } from '@supabase/ssr'
import type { NgDatabase } from '@/types/ng-buscador'

export function createNgClient() {
  return createBrowserClient<NgDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
