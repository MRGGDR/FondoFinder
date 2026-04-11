# SECURITY_HARDENING_V5

## 1) Estado de hardening Supabase (ya aplicado antes)
- Vista base `ng_vw_busqueda_base` cerrada para acceso directo publico.
- Tablas internas `ng_*` cerradas salvo las estrictamente necesarias para lectura minima.
- Perimetro publico del V5 reducido a:
  - 4 tablas publicas minimas
  - 7 RPC `ng_*` endurecidas y en funcionamiento
- Frontend V5 operando con `anon key`.

## 2) Hardening aplicado en la app (esta etapa)
- Rate limiting por endpoint en capa API.
- Validacion estricta de payloads y query params.
- Respuestas de error consistentes (`error` + `code`) sin filtrar mensajes internos de BD.
- Headers base en API (`X-Content-Type-Options`, `Referrer-Policy`).
- `Cache-Control` ajustado por tipo de ruta (`no-store` para admin/escrituras).
- Anti-spam frontend en wizard V5:
  - debounce de consultas dinamicas
  - cancelacion con `AbortController`
  - dedupe de requests en vuelo
  - cache de catalogos estaticos
- Admin ligero:
  - codigo admin movido de hardcode a `ADMIN_ACCESS_CODE` (solo servidor)
  - frontend envia el codigo ingresado y el backend decide acceso admin
  - guard server-side con validacion contra DB + rate limit
  - carga pesada de `/mapa` diferida para no-admin (dynamic import condicionado)

## 3) Inventario de superficie HTTP
| Ruta | Metodo(s) | Tipo de cliente | Escritura | Costo | Rate limit | Riesgo |
|---|---|---|---|---|---|---|
| `/api/ng/evento-busqueda` | POST | browser -> server privileged | Si | Medio | 30/min por IP | Alto (spam de eventos) |
| `/api/ng/montos` | GET | browser -> server privileged | No | Medio | 40/min por IP | Medio (scraping) |
| `/api/perfiles/crear-o-recuperar` | POST | browser -> server privileged | Si | Medio | 8/10min por IP | Alto (abuso de creacion) |
| `/api/perfiles/recuperar-por-codigo` | POST | browser -> server privileged | No (actualiza last_seen) | Bajo | 12/10min por IP | Alto (fuerza bruta codigo) |
| `/api/perfiles/actualizar` | PATCH | browser -> server privileged | Si | Bajo | 40/10min por IP+perfil | Medio |
| `/api/feedback` | POST | browser -> server privileged | Si | Bajo | 6/10min por IP | Medio |
| `/api/municipios/departamentos` | GET | browser -> server privileged | No | Bajo | 120/min por IP | Bajo |
| `/api/municipios/por-departamento` | GET | browser -> server privileged | No | Bajo | 120/min por IP | Bajo |
| `/api/mapa/fondos-territorio` | GET | browser -> server privileged | No | Medio | 60/min por IP | Medio |
| `/api/fondos/[id]/instructivo` | GET | browser -> server privileged | No | Bajo | 60/min por IP | Bajo |
| `/api/admin/analytics/kpis` | GET | browser admin -> server privileged | No | Medio | 120/min por IP+perfil (guard) | Alto |
| `/api/admin/analytics/usuarios-mapa` | GET | browser admin -> server privileged | No | Medio | 120/min por IP+perfil (guard) | Alto |
| `/api/admin/analytics/mapa-origen` | GET | browser admin -> server privileged | No | Alto | 120/min por IP+perfil (guard) | Alto |
| `/api/admin/analytics/territorio` | GET | browser admin -> server privileged | No | Alto | 120/min por IP+perfil (guard) | Alto |

## 4) Politica de rate limiting implementada
- Implementacion: in-memory best-effort (`src/lib/http/rateLimit.ts`).
- Clave principal: IP (`x-forwarded-for`/`x-real-ip`) + key adicional por ruta cuando aplica.
- Respuesta al exceder:
  - HTTP `429`
  - body `{ "error": "...", "code": "rate_limited" }`
  - headers `X-RateLimit-*` + `Retry-After`.

### Nota operativa
- En despliegue serverless/multi-instancia, este limit es **best-effort por instancia**.
- Para enforcement global real en produccion: mover contador a backend compartido (ej. Upstash Redis, Vercel KV/Edge Config + token bucket, o gateway dedicado).

## 5) Validaciones de input aplicadas
- JSON body con limite de tamano por ruta (`parseJsonBody` + bytes max).
- Strings:
  - trimming
  - longitudes max/min
  - regex en campos sensibles (`codigo_acceso`, `fondo_id`).
- Arrays de IDs:
  - solo enteros
  - deduplicacion
  - maximo de elementos por payload.
- UUIDs:
  - validacion estricta para `perfil_id`, `municipio_id`, `municipio_origen_id`.
- Query params:
  - `divipola` solo 2 o 5 digitos
  - `ids` en montos limitado (1..200)
  - `dep` con longitud maxima.
- Admin code:
  - validacion server-side contra variable de entorno + valor persistido en DB.

## 6) Frontend anti-spam aplicado (V5)
- Wizard (`BuscadorNgV5`):
  - debounce en cargas dependientes (tipos/categorias/actividades)
  - abort de requests previos al cambiar filtros
  - dedupe por clave de filtro para evitar llamadas repetidas por mismo estado
  - bloqueo de doble submit en busqueda principal
  - cancelacion de busqueda previa si el usuario dispara otra
- Servicio (`ngBuscador`):
  - dedupe de requests identicos en vuelo
  - cache temporal de catalogos estaticos (`ng_actores`, `cat_procesos`, `cat_objetivos_pngrd`)
  - soporte `AbortSignal` en RPC/queries/fetch
  - `/api/ng/montos` ahora consume solo lote de IDs (no tabla completa)
- Modal de acceso:
  - cache local de departamentos y municipios por departamento
  - abort en fetches de cascada.

## 7) Admin ligero (sin auth pesada)
- `ADMIN_ACCESS_CODE` removido de hardcode y usado solo en servidor.
- Flujo vigente:
  1. El usuario ingresa codigo de acceso en cliente.
  2. El cliente envia codigo + perfil al backend.
  3. El backend compara contra `ADMIN_ACCESS_CODE` y valida perfil activo en DB.
  4. El backend responde si el perfil tiene acceso admin.
- `authorizeAdminRequest` ahora:
  - valida headers admin
  - valida codigo contra variable server
  - valida perfil activo en `perfiles_consulta`
  - aplica rate limit para todo `/api/admin/analytics/*`.
- `/mapa`:
  - dashboard pesado movido a chunk dinamico
  - no-admin no descarga el dashboard completo.

## 8) Cache-control y respuestas
- `no-store`:
  - endpoints admin analytics
  - endpoints de escritura (`perfiles`, `feedback`, `evento-busqueda`)
- Cache corta/publica:
  - catalogos territoriales (`municipios/*`)
  - mapa fondos por territorio (TTL corto)
  - instructivo de fondo (TTL medio)
- Errores uniformes:
  - shape base: `{ error: string, code?: string }`
  - sin mensajes internos de SQL al cliente.

## 9) Variables de entorno obligatorias

### Local (`.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_ACCESS_CODE`
- Para mantener el comportamiento actual en desarrollo local: `ADMIN_ACCESS_CODE=admin.ungrd`.

### Vercel (Project Settings -> Environment Variables)
- mismas 4 variables en `Production` y `Preview` segun corresponda.

## 10) Riesgos residuales
- Rate limit actual es best-effort por instancia; no global distribuido.
- Admin ligero depende de codigo compartido (no MFA, no session auth robusta).
- Si `ADMIN_ACCESS_CODE` se expone fuera del servidor, se compromete el acceso admin.
- Algunas rutas legacy server-side con `service_role` siguen siendo potentes por diseno (controlado por validacion API, no por auth usuario final).

## 11) Checklist antes de deploy (Vercel)
1. Confirmar env vars obligatorias (4/4) en Production.
2. Verificar que no exista `NEXT_PUBLIC_ADMIN_ACCESS_CODE` en Environment Variables.
3. Probar manualmente `/buscar` (flujo completo V5) con anon.
4. Probar rate-limit en rutas criticas (`perfiles`, `feedback`, `ng/evento-busqueda`).
5. Probar acceso denegado en `/mapa` con perfil no admin.
6. Probar `/mapa` y `/api/admin/analytics/*` con perfil admin valido.
7. Revisar que errores API no filtren mensajes internos de BD.
8. Revisar headers `Cache-Control` esperados por ruta.

## 12) Checklist de prueba local (post-cambios)
1. `npm run lint` (debe pasar).
2. `npx tsc --noEmit` (debe pasar).
3. Flujo AccessModal:
   - crear perfil
   - recuperar por codigo
   - actualizar perfil.
4. Wizard V5:
   - actor -> tipo -> proceso/objetivo -> categoria -> actividad -> resultados.
   - cambios rapidos de filtros sin errores ni parpadeos por race conditions.
5. Validar que `/api/ng/montos` rechaza llamadas sin `ids`.
6. Confirmar 429 al exceder limites en endpoints configurados.
7. Confirmar `no-store` en respuestas admin analytics.
