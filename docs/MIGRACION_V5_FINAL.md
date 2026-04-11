# MIGRACION V5 FINAL

## 1) Metodo aplicado (2 etapas obligatorias)

Se ejecuto el flujo solicitado: **construir limpio primero, reemplazar despues**.

1. **ETAPA 1 - Auditoria, extraccion y validacion**
   - Se identifico el flujo V5 real en uso.
   - Se aisló una version limpia V5.
   - Se validaron imports, tipado, lint, build y conexion Supabase `ng_`.
2. **ETAPA 2 - Reemplazo**
   - Solo despues de validar V5 limpia se reemplazo el contenido activo del repo.
   - Se eliminaron rutas/componentes/activos legacy y quedo una sola version funcional.

## 2) Respaldo previo

- Rama de respaldo creada antes del reemplazo:
  - `backup/pre-migracion-v5-2026-04-10`

## 3) Version final que queda en el repositorio

El repo final queda orientado a una sola app: **Buscador V5**.

### Flujo V5 operativo

1. Actor
2. Tipo de fondo
3. Procesos GRD
4. Objetivos PNGRD
5. Categoria
6. Actividad
7. Resultados
8. Panel lateral de resultados

### Backend Supabase conectado (validado)

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
- Tablas/catalogos usados por el frontend/API:
  - `public.ng_fondos_universo`
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

## 4) Archivos que quedaron (version final limpia)

### Raiz

- `README.md`
- `docs/MIGRACION_V5_FINAL.md`
- `package.json`
- `package-lock.json`
- `next.config.js`
- `tsconfig.json`
- `tailwind.config.ts`
- `postcss.config.js`
- `scripts/readlink-eisdir-workaround.cjs`

### Public

- `public/manifest.json`
- `public/favicon.ico`
- `public/logo-ungrd.png`
- `public/logo-ungrd-sinfondo.png`
- `public/icons/icon-192x192.png`
- `public/icons/icon-512x512.png`

### Codigo fuente

- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/error.tsx`
- `src/app/global-error.tsx`
- `src/app/buscar/page.tsx`
- `src/app/buscar/BuscarClient.tsx`
- `src/app/fondo/[id]/page.tsx`
- `src/app/api/ng/montos/route.ts`
- `src/app/api/ng/evento-busqueda/route.ts`
- `src/app/api/perfiles/crear-o-recuperar/route.ts`
- `src/app/api/perfiles/recuperar-por-codigo/route.ts`
- `src/app/api/perfiles/actualizar/route.ts`
- `src/app/api/municipios/departamentos/route.ts`
- `src/app/api/municipios/por-departamento/route.ts`
- `src/components/buscador-ng/BuscadorNgV5.tsx`
- `src/components/busqueda/HeroBuscador.tsx`
- `src/components/access/AccessGate.tsx`
- `src/components/access/AccessModal.tsx`
- `src/context/LightSessionContext.tsx`
- `src/services/ngBuscador.ts`
- `src/lib/db.ts`
- `src/lib/lightSession.ts`
- `src/lib/supabase/ngClient.ts`
- `src/lib/utils.ts`
- `src/types/ng-buscador.ts`
- `src/types/database.ts`

## 5) Archivos eliminados del repo

Se eliminaron rutas y logica legacy en bloque (sin reintroducciones).

### `root/otros` (12)

- `docs/CHANGELOG.md`
- `"PDF Fondo/Ficha Fondo de Financimiento_BID Lab.pdf"`
- `"PDF Fondo/Ficha Fondos de Financimiento_Adaptation Fund.pdf"`
- `"PDF Fondo/Ficha Fondos de Financimiento_eco business Fund.pdf"`
- `"PDF Fondo/Ficha Fondos de Financimiento_Fontagro.pdf"`
- `"PDF Fondo/Ficha Fondos de Financimiento_Global Facility for Disaster Reduction and Recovery.pdf"`
- `"PDF Fondo/Ficha Fondos de Financimiento_Global Innovation Fund.pdf"`
- `"PDF Fondo/Ficha Fondos de Financimiento_Green Climate Fund.pdf"`
- `"PDF Fondo/Ficha Fondos de Financimiento_IKI.pdf"`
- `"PDF Fondo/Ficha Fondos de Financimiento_Special Climate Change Fund.pdf"`
- `src/middleware.ts`
- `start-all.js`

### `public` (28)

- `public/col_departamentos.geojson`
- `public/col_municipios.geojson`
- `public/fichas-fondos/adaptation-fund.pdf`
- `public/fichas-fondos/bid-lab.pdf`
- `public/fichas-fondos/eco-business-fund.pdf`
- `public/fichas-fondos/fontagro.pdf`
- `public/fichas-fondos/gfdrr.pdf`
- `public/fichas-fondos/global-innovation-fund.pdf`
- `public/fichas-fondos/green-climate-fund.pdf`
- `public/fichas-fondos/iki.pdf`
- `public/fichas-fondos/sccf.pdf`
- `public/icons/admin.png`
- `public/icons/admin_negro.png`
- `public/icons/calendario.png`
- `public/icons/entidad.png`
- `public/icons/facebook.png`
- `public/icons/Fondos.png`
- `public/icons/Fondos_negro.png`
- `public/icons/home.png`
- `public/icons/home_negro.png`
- `public/icons/instagram.png`
- `public/icons/linkedin.png`
- `public/icons/mapa.png`
- `public/icons/mapa_negro.png`
- `public/icons/tik-tok.png`
- `public/icons/twitter.png`
- `public/icons/youtube.png`
- `public/logo-ungrd-blanco.png`

### `src/app` (27)

- `src/app/admin/page.tsx`
- `src/app/api/admin/analytics/kpis/route.ts`
- `src/app/api/admin/analytics/mapa-origen/route.ts`
- `src/app/api/admin/analytics/territorio/route.ts`
- `src/app/api/admin/mapa/consulta/route.ts`
- `src/app/api/admin/mapa/origen/route.ts`
- `src/app/api/admin/top-fondos/route.ts`
- `src/app/api/busqueda/catalogo/route.ts`
- `src/app/api/busqueda/narrativa/route.ts`
- `src/app/api/busqueda/top5/route.ts`
- `src/app/api/catalogos/municipios/route.ts`
- `src/app/api/catalogos/narrativa/route.ts`
- `src/app/api/feedback/route.ts`
- `src/app/api/fondos/[id]/instructivo/route.ts`
- `src/app/api/fondos/[id]/modelo-aplicacion/route.ts`
- `src/app/api/fondos/[id]/route.ts`
- `src/app/api/mapa/fondos-territorio/route.ts`
- `src/app/auth/callback/route.ts`
- `src/app/buscar-avanzado/page.tsx`
- `src/app/buscar-legacy/BuscarLegacyGuidedClient.tsx`
- `src/app/buscar-legacy/page.tsx`
- `src/app/buscar-legacy2/page.tsx`
- `src/app/buscar-legacy-narrativo/page.tsx`
- `src/app/fondos/page.tsx`
- `src/app/login/page.tsx`
- `src/app/mapa/page.tsx`
- `src/app/registro/page.tsx`

### `src/components` (42)

- `src/components/buscador-top5/ResultadosTop5.tsx`
- `src/components/buscador-top5/WizardTop5.tsx`
- `src/components/busqueda/BarraFiltrosActivos.tsx`
- `src/components/busqueda/Buscador.tsx`
- `src/components/busqueda/ConsultaNarrativa.tsx`
- `src/components/busqueda/EtapaContexto.tsx`
- `src/components/busqueda/EtapaIdentidad.tsx`
- `src/components/busqueda/EtapaPredicado.tsx`
- `src/components/busqueda/EtapaPresupuesto.tsx`
- `src/components/busqueda/EtapaProceso.tsx`
- `src/components/busqueda/EtapaResultados.tsx`
- `src/components/busqueda/EtapaResultadosNarrativa.tsx`
- `src/components/busqueda/EtapaSujeto.tsx`
- `src/components/busqueda/EtapaTipo.tsx`
- `src/components/busqueda/FiltroPanel.tsx`
- `src/components/busqueda/FlujoBuscador.tsx`
- `src/components/busqueda/FlujoBuscadorNarrativo.tsx`
- `src/components/busqueda/FondoDestacado.tsx`
- `src/components/busqueda/ResultadosGrid.tsx`
- `src/components/busqueda/ResumenNarrativo.tsx`
- `src/components/busqueda-avanzada/BuscadorAvanzado.tsx`
- `src/components/feedback/FeedbackWidget.tsx`
- `src/components/fondos/CatalogoFondos.tsx`
- `src/components/fondos/FondoCard.tsx`
- `src/components/fondos/FondoDetalle.tsx`
- `src/components/fondos/FondoPDF.tsx`
- `src/components/fondos/FondosGrid.tsx`
- `src/components/fondos/PasoPDF.tsx`
- `src/components/layout/AppHeader.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/LogoutButton.tsx`
- `src/components/layout/NavBar.tsx`
- `src/components/mapa/ColombiaMap.tsx`
- `src/components/mapa/ColombiaMapAdmin.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/NavigationLoader.tsx`
- `src/components/ui/PanelLateral.tsx`
- `src/components/ui/Skeleton.tsx`
- `src/components/ui/Tag.tsx`
- `src/components/ui/UNGRDLoader.tsx`

### Otros paquetes/archivos legacy

- `src/config/buscador-top5.generated.json`
- `src/config/buscador-top5.ts`
- `src/config/fichasPDFEstaticas.ts`
- `src/hooks/useBusqueda.ts`
- `src/hooks/useBusquedaNarrativa.ts`
- `src/hooks/useCatalogoNarrativa.ts`
- `src/hooks/useLoader.ts`
- `src/hooks/useOnlineStatus.ts`
- `src/hooks/usePerfilConsulta.ts`
- `src/lib/pdf.tsx`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/types/buscador-avanzado.ts`
- `src/types/top5.ts`

## 6) Reutilizado vs descartado

### Reutilizado (y limpiado)

- `src/components/buscador-ng/BuscadorNgV5.tsx`
- `src/services/ngBuscador.ts`
- `src/types/ng-buscador.ts`
- `src/lib/supabase/ngClient.ts`
- `src/lib/db.ts`
- `src/app/buscar/*`
- `src/app/fondo/[id]/page.tsx`
- `src/components/access/*`
- `src/context/LightSessionContext.tsx`
- `src/app/api/perfiles/*`
- `src/app/api/municipios/*`
- `src/app/api/ng/montos/route.ts`

### Descartado

- Todo el bloque narrativo/top5/legacy/avanzado/mapa/admin/autenticacion anterior.
- Assets no usados por V5 (PDF legacy, iconografia vieja, geojson no referenciado).
- Dependencias npm no usadas por V5:
  - `@react-pdf/renderer`
  - `d3`
  - `file-saver`
  - `@types/d3`
  - `@types/file-saver`
  - `@types/react-pdf`
  - `next-pwa`

## 7) Archivos dudosos y decision

- `src/app/api/ng/evento-busqueda/route.ts`
  - **Duda:** inicialmente aparecia nuevo/no trackeado.
  - **Decision:** se conserva porque V5 lo consume directamente para registrar eventos.
- `scripts/readlink-eisdir-workaround.cjs`
  - **Duda:** workaround de entorno.
  - **Decision:** se agrega para garantizar `dev/build/start` en Windows donde `fs.readlink` devuelve `EISDIR` en archivos normales.

## 8) Validaciones ejecutadas

### Calidad/compilacion

- `npm run lint` -> OK (sin errores)
- `npx tsc --noEmit` -> OK
- `npm run build` -> OK (Next 14.2.35)

### Supabase (backend `ng_`)

Verificacion ejecutada contra `.env.local`:

- `ng_fondos_universo` count = **31**
- `ng_actores` count = 5
- `cat_procesos` count = 4
- `cat_objetivos_pngrd` count = 5
- `ng_vw_busqueda_base` accesible
- RPC `ng_listar_tipos_fondo_v1` OK
- RPC `ng_listar_categorias_v1` OK
- RPC `ng_listar_actividades_v1` OK
- RPC `ng_listar_entidades_v1` OK
- RPC `ng_listar_vigencias_v1` OK
- RPC `ng_resumen_flags_v1` OK
- RPC `ng_buscar_fondos_v1` OK
- `ng_buscar_fondos_v1` unique fondos = **31**
- Consulta de detalle (`vista_fondo_detalle`) validada con fondo `F01`

## 9) Riesgos / pendientes

1. En este entorno Windows persiste warning de snapshot webpack (`Unable to snapshot resolve dependencies`), pero el build finaliza correctamente con el workaround de `readlink`.
2. No se ejecuto verificacion visual E2E en navegador en esta corrida (se priorizo validacion no interactiva + backend + build).
3. Si se desea, el siguiente paso recomendado es una prueba manual final en Vercel Preview para confirmar UX completa del wizard.

## 10) Estado final

Repositorio final limpio, con una sola version funcional (**V5**), sin mezclas legacy y listo para publicarse en GitHub/Vercel.
