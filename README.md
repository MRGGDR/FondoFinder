# FondosFinder V5 (Repositorio Final Limpio)

Aplicación Next.js con un solo flujo productivo: **Buscador V5** conectado al backend `ng_` de Supabase.

## Alcance actual

- Wizard V5 único:
  1. Actor
  2. Tipo de fondo
  3. Procesos GRD
  4. Objetivos PNGRD
  5. Categoría
  6. Actividad
  7. Resultados + panel lateral
- Sin rutas ni lógica legacy (narrativa/top5/scoring/afinidad/chips).
- Sin mezcla con buscadores antiguos.

## Backend Supabase usado por V5

- RPC:
  - `public.ng_buscar_fondos_v1`
  - `public.ng_listar_tipos_fondo_v1`
  - `public.ng_listar_categorias_v1`
  - `public.ng_listar_actividades_v1`
  - `public.ng_listar_entidades_v1`
  - `public.ng_listar_vigencias_v1`
  - `public.ng_resumen_flags_v1`
- Vista:
  - `public.ng_vw_busqueda_base`
- Tablas/catálogos consultados:
  - `public.ng_actores`
  - `public.cat_procesos`
  - `public.cat_objetivos_pngrd`
  - `public.fondos`
  - `public.fondos_modelos_aplicacion`
  - `public.vista_fondo_detalle`
  - `public.ng_search_events`
  - `public.ng_search_event_results`
  - `public.municipios`
  - `public.perfiles_consulta`

## Requisitos

- Node.js 20+ (LTS recomendado).
- Variables de entorno de Supabase.

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Scripts

- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm run start`
- `npm run clean`

Nota: `dev/build/start` cargan `scripts/readlink-eisdir-workaround.cjs` para evitar errores `EISDIR` de `readlink` en algunos entornos Windows.

## Estructura principal

```text
src/
  app/
    buscar/
    fondo/[id]/
    api/ng/
    api/perfiles/
    api/municipios/
  components/
    buscador-ng/
    busqueda/HeroBuscador.tsx
    access/
  services/
    ngBuscador.ts
  lib/
    db.ts
    lightSession.ts
    supabase/ngClient.ts
  types/
    ng-buscador.ts
    database.ts
```
