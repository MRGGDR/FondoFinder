import type { RateLimitPolicy } from '@/lib/http/rateLimit'

export const RATE_POLICIES = {
  ngEventoBusqueda: { id: 'api:ng:evento-busqueda', limit: 30, windowMs: 60_000 },
  ngMontos: { id: 'api:ng:montos', limit: 40, windowMs: 60_000 },
  perfilesCrear: { id: 'api:perfiles:crear-o-recuperar', limit: 8, windowMs: 10 * 60_000 },
  perfilesRecuperar: { id: 'api:perfiles:recuperar-por-codigo', limit: 12, windowMs: 10 * 60_000 },
  perfilesActualizar: { id: 'api:perfiles:actualizar', limit: 40, windowMs: 10 * 60_000 },
  feedback: { id: 'api:feedback', limit: 6, windowMs: 10 * 60_000 },
  municipios: { id: 'api:municipios', limit: 120, windowMs: 60_000 },
  mapaFondosTerritorio: { id: 'api:mapa:fondos-territorio', limit: 60, windowMs: 60_000 },
  adminAnalytics: { id: 'api:admin:analytics', limit: 120, windowMs: 60_000 },
  fondosInstructivo: { id: 'api:fondos:instructivo', limit: 60, windowMs: 60_000 },
} satisfies Record<string, RateLimitPolicy>
