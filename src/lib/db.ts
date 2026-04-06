/**
 * db.ts — Capa de acceso a base de datos (portable)
 *
 * Este es el ÚNICO lugar del proyecto que conoce el mecanismo de conexión.
 * Hoy usa Supabase como base PostgreSQL alojada.
 *
 * GUÍA DE MIGRACIÓN A POSTGRESQL INSTITUCIONAL:
 *   1. Agregar dep: npm install postgres
 *   2. Agregar env: DATABASE_URL=postgresql://user:pass@host:5432/db
 *   3. Reemplazar la implementación de getDb() por:
 *        import postgres from 'postgres'
 *        const sql = postgres(process.env.DATABASE_URL!)
 *        export { sql as getDb }
 *   4. Actualizar llamadas .rpc() y .from() en las rutas API a SQL crudo
 *      (ver comentarios MIGRATION en cada route.ts)
 *
 * NO usar este módulo en componentes cliente. Solo en:
 *   - src/app/api/* (route handlers)
 *   - src/app/[ruta]/page.tsx con async/await de Server Components (legacy aceptable)
 */

import { createClient as createSupabaseServerClient } from '@supabase/supabase-js'

/**
 * Devuelve un cliente de base de datos server-side.
 * Usa la service-role key si está disponible para bypassear RLS en escrituras.
 * Cae al anon key (suficiente para lecturas públicas actuales).
 *
 * PORTABILIDAD: cuando se migre, este retorno cambia a un objeto `sql` de `postgres`.
 */
export function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Faltan variables de entorno SUPABASE: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (o SUPABASE_SERVICE_ROLE_KEY)'
    )
  }

  return createSupabaseServerClient(url, key, {
    auth: { persistSession: false },
  })
}
