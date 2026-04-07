# Changelog

Todos los cambios notables de este proyecto están documentados aquí.  
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [1.2.0] — 2026-04-07

### Agregado

#### Fichas PDF estáticas en botón "Paso a Paso" — 9 fondos internacionales
- **`public/fichas-fondos/`** — nueva carpeta con 9 PDFs preformateados listos para descarga directa:
  - `adaptation-fund.pdf` → F17 Adaptation Fund
  - `green-climate-fund.pdf` → F20 Green Climate Fund (GCF)
  - `sccf.pdf` → F21 Special Climate Change Fund (SCCF)
  - `gfdrr.pdf` → F24 Global Facility for Disaster Reduction and Recovery (GFDRR)
  - `eco-business-fund.pdf` → F25 eco.business Fund
  - `global-innovation-fund.pdf` → F26 Global Innovation Fund
  - `bid-lab.pdf` → F28 Fondo Multilateral de Inversiones (IDB Lab)
  - `iki.pdf` → F29 International Climate Initiative (IKI)
  - `fontagro.pdf` → F31 Fontagro

- **`src/config/fichasPDFEstaticas.ts`** — archivo de configuración con el mapeo `patron → path` y función `getFichaEstaticaPath()`; disponible como utilidad reutilizable

### Modificado

#### Botón "Paso a Paso" en detalle de fondo
- **`src/components/fondos/FondoDetalle.tsx`**
  - `FICHAS_PDF_POR_ID` — objeto de mapeo inline indexado por `fondo.id` (F17, F20, F21, F24, F25, F26, F28, F29, F31); lookup O(1) sin dependencia de nombres variables
  - `descargarFichaEstatica()` — función async que hace `fetch` del PDF estático y fuerza descarga via `blob URL`; muestra el loader UNGRD durante la operación
  - Para los 9 fondos con ficha estática: botón siempre habilitado (azul/amarillo) y descarga el PDF de `public/fichas-fondos/` sin llamar a `fondos_instructivos` ni generar PDF dinámico
  - Para los demás fondos: comportamiento anterior sin cambios (habilitado solo si tienen registro en `fondos_instructivos`)

---

## [1.1.0] — 2026-04-06

### Agregado

#### Microcopy y ayuda contextual en el Wizard Top 5
- **`src/components/buscador-top5/WizardTop5.tsx`**
  - Interfaz `OptionMeta` extendida con campo `ayuda: { cuando, cuandoNo }` para cada opción de los pasos 1, 2 y 4
  - `PASO2_LABEL_OVERRIDE` — mapeo de valores internos del catálogo a etiquetas visibles; `'Buscar financiamiento, crédito o regalías'` se muestra como **"Crédito, banca o regalías"** (el valor enviado al backend no cambia)
  - `PASO4_META` — nuevo objeto con descripciones cortas y textos de ayuda para las 5 opciones de la vía de acceso (Paso 4)
  - `ayudaAbierta` state — un solo panel de ayuda expandido a la vez; funciona con tap en móvil y clic/hover en desktop
  - Botón **"▼ ¿Cuándo usar esta opción?"** bajo cada tarjeta de los pasos 1, 2 y 4; muestra panel con "Cuándo escoger" y "Cuándo no escoger"
  - Todos los subtítulos de pasos 1–4 actualizados al copy maestro definitivo
  - Encabezado del Paso 5 actualizado: título "Fondos recomendados para ti" + subtítulo de afinidad
  - Passos 4 ahora muestran descripción corta debajo de cada opción de vía de acceso

- **`src/components/buscador-top5/ResultadosTop5.tsx`**
  - Labels de badges de afinidad actualizados: `alta` → **"Alta afinidad"**, `media` → **"Afinidad media"**, `baja` → **"Afinidad exploratoria"**
  - Eliminado prefijo `"Afinidad "` hardcodeado en el render; ahora usa el valor completo desde `TIER_LABEL`

#### Widget de comentarios flotante
- **`src/components/feedback/FeedbackWidget.tsx`** — botón flotante fijo en esquina inferior derecha; al pulsarlo abre un panel modal con:
  - Valoración emoji (1–5)
  - Tipo de comentario: Sugerencia / Reportar error / Opinión general / Otro
  - Campo de texto libre (máx. 1000 caracteres)
  - Confirmación visual tras envío exitoso
  - Funciona en todas las vistas (montado en el layout raíz)
- **`src/app/api/feedback/route.ts`** — `POST /api/feedback`; valida y persiste en tabla `feedback_herramienta` de Supabase via `getDb()`; requiere al menos valoración o mensaje
- **`src/app/layout.tsx`** — `<FeedbackWidget />` agregado al layout raíz; visible en todas las páginas y flujos

### SQL pendiente de ejecutar en Supabase
```sql
-- Tabla feedback_herramienta (ver instrucciones en sesión 2026-04-06)
-- Ejecutar en Supabase SQL Editor antes de usar el widget de comentarios
```

---

## [1.0.0] — 2026-04-05

### Resumen
Versión completa y funcional del sistema FondosFinder. Durante la semana del 30 de marzo al 5 de abril de 2026 se construyó la arquitectura backend v2, el motor de búsqueda narrativa guiada, el dashboard de analítica territorial con mapa de calor, el flujo de identidad pública sin contraseña, y la búsqueda avanzada. El sistema está desplegado y operativo.

---

### Agregado — Motor de búsqueda narrativa (semana 2026-03-30 / 2026-04-04)

#### API backend v2
- **`src/lib/db.ts`** — capa de acceso a base de datos portable; único punto de integración con Supabase (o futuro PostgreSQL puro); expone `getDb()` con cliente de servicio
- **`src/app/api/busqueda/catalogo/route.ts`** — POST; llama la función legacy `buscar_fondos()`; usada por `useBusqueda` y `FlujoBuscador`; no requiere sesión
- **`src/app/api/busqueda/narrativa/route.ts`** — POST; llama `buscar_fondos_narrativo_v2()`; persiste `search_events` + `search_event_results`; enriquece payload con `sujeto_ui`, `predicado_ui`, `verbos_ui`, `complementos_ui` haciendo `fetchTermNames()` en paralelo con la RPC
- **`src/app/api/busqueda/top5/route.ts`** — POST; retorna top 5 fondos por perfil y contexto de búsqueda
- **`src/app/api/catalogos/narrativa/route.ts`** — GET; devuelve `cat_narrativa_terminos` agrupados por categoría para poblar los selectores del flujo narrativo
- **`src/app/api/perfiles/crear-o-recuperar/route.ts`** — POST; crea o recupera `perfiles_consulta` sin contraseña; normalización NFD+unmark para aproximar `fn_normalizar_texto()` de la DB
- **`src/app/api/perfiles/recuperar-por-codigo/route.ts`** — POST; recupera perfil existente por código `FF-XXXX`
- **`src/app/api/fondos/[id]/route.ts`** — GET; retorna detalle completo del fondo desde `vista_fondo_detalle`
- **`src/app/api/fondos/[id]/instructivo/route.ts`** — GET; retorna `fondos_instructivos` del fondo
- **`src/app/api/fondos/[id]/modelo-aplicacion/route.ts`** — GET; retorna `fondos_modelos_aplicacion` del fondo
- **`src/app/api/municipios/route.ts`** — GET; búsqueda de municipios por nombre para el flujo de registro e identidad
- **`src/app/api/mapa/route.ts`** — GET; datos de municipios con coordenadas para `ColombiaMap`

#### API Admin — Analítica territorial
- **`src/app/api/admin/analytics/kpis/route.ts`** — GET; KPIs globales: total usuarios, total búsquedas, municipios activos, departamentos activos, top fondos consultados
- **`src/app/api/admin/analytics/mapa-origen/route.ts`** — GET; datos de heatmap con `?modo=busquedas|usuarios`; join defensivo con tabla de municipios para resolver `divipola → count`
- **`src/app/api/admin/analytics/territorio/route.ts`** — GET; detalle analítico por `?municipio_id=UUID` o `?dept_code=XX`; agregación TypeScript desde `search_events`
- **`src/app/api/admin/mapa/origen/route.ts`** — GET; alimenta vista `vw_busquedas_por_municipio_origen_v2`
- **`src/app/api/admin/mapa/consulta/route.ts`** — GET; alimenta vista `vw_busquedas_por_municipio_consulta_v2`
- **`src/app/api/admin/top-fondos/route.ts`** — GET; alimenta `vw_top_fondos_consultados_v2`

#### Flujo de búsqueda narrativa guiada (`/buscar`)
- **`src/app/buscar/page.tsx`** — Server Component; punto de entrada a la búsqueda narrativa; maneja SSR y paso inicial
- **`src/app/buscar/BuscarClient.tsx`** — wrapper cliente que monta el flujo narrativo
- **`src/components/busqueda/FlujoBuscadorNarrativo.tsx`** — orquestador del flujo de 5 etapas; maneja estado global de la búsqueda narrativa
- **`src/components/busqueda/EtapaSujeto.tsx`** — etapa 1: selección del sujeto (¿quién busca?)
- **`src/components/busqueda/EtapaPredicado.tsx`** — etapa 2: selección del predicado (¿qué necesita?)
- **`src/components/busqueda/EtapaContexto.tsx`** — etapa 3: contexto territorial y sectorial
- **`src/components/busqueda/EtapaIdentidad.tsx`** — etapa 4: captura de identidad pública (municipio, nombre) sin contraseña
- **`src/components/busqueda/EtapaResultadosNarrativa.tsx`** — etapa 5: resultados rankeados con score narrativo, etiquetas de relevancia y paginación
- **`src/components/busqueda/ConsultaNarrativa.tsx`** — resumen visual de la consulta construida en lenguaje natural
- **`src/components/busqueda/ResumenNarrativo.tsx`** — chip con el texto de la consulta formada
- **`src/components/fondos/PasoPDF.tsx`** — componente de descarga PDF dentro del flujo de resultados narrativos

#### Búsqueda avanzada (`/buscar-avanzado`)
- **`src/app/buscar-avanzado/page.tsx`** — página de búsqueda avanzada con filtros múltiples
- **`src/components/busqueda-avanzada/BuscadorAvanzado.tsx`** — formulario con filtros: tipo de fondo, sector, monto mínimo/máximo, palabras clave; resultados en tabla con ordenamiento
- **`src/types/buscador-avanzado.ts`** — tipos TypeScript para el buscador avanzado

#### Buscador Top 5
- **`src/components/buscador-top5/WizardTop5.tsx`** — wizard de 3 pasos para obtener las 5 mejores recomendaciones personalizadas
- **`src/components/buscador-top5/ResultadosTop5.tsx`** — tarjetas de resultado Top 5 con score de compatibilidad
- **`src/types/top5.ts`** — tipos TypeScript del sistema Top 5

#### Dashboard admin territorial — Mapa de calor
- **`src/app/mapa/page.tsx`** — **reemplazado**: ahora es panel de analítica territorial para admin; heatmap de origen de usuarios y búsquedas por municipio/departamento
- **`src/components/mapa/ColombiaMapAdmin.tsx`** — nuevo: heatmap D3 con prop `activityData` (divipola → count); escala de color `#E8F4FD → #213362` (intensidad de actividad); agrupación de municipios por departamento (primeros 2 dígitos divipola)
- **`src/components/mapa/ColombiaMap.tsx`** — mapa interactivo de Colombia preservado para uso público futuro
- **`public/col_departamentos.geojson`** — GeoJSON con polígonos de los 32 departamentos de Colombia
- **`public/col_municipios.geojson`** — GeoJSON con polígonos de todos los municipios de Colombia

#### Identidad pública y sesión ligera
- **`src/hooks/usePerfilConsulta.ts`** — hook de identidad pública; persiste `perfil_id` + código `FF-XXXX` en `localStorage`; no requiere autenticación Supabase
- **`src/hooks/useBusquedaNarrativa.ts`** — hook que gestiona el ciclo completo de una búsqueda narrativa; llama `/api/busqueda/narrativa`; expone estado de carga, error y resultados
- **`src/hooks/useCatalogoNarrativa.ts`** — hook que carga y cachea `cat_narrativa_terminos` desde `/api/catalogos/narrativa`
- **`src/lib/lightSession.ts`** — utilidades para la sesión ligera sin autenticación (lectura/escritura de `localStorage` con TTL)
- **`src/context/LightSessionContext.tsx`** — contexto React para propagar el perfil de consulta anónimo por el árbol de componentes

#### Control de acceso
- **`src/components/access/AccessGate.tsx`** — guard que verifica si el usuario tiene perfil activo; bloquea acceso a funcionalidades que lo requieren
- **`src/components/access/AccessModal.tsx`** — modal de identificación rápida (nombre + municipio) para obtener perfil sin registro formal

#### Configuración
- **`src/config/`** — constantes de configuración de la app (endpoints, timeouts, flags de feature)

---

### Modificado — Semana 2026-03-30 / 2026-04-05

#### Páginas existentes migradas a API interna
- **`src/app/fondos/page.tsx`** — migrado de cliente Supabase directo a `getDb()` server-side
- **`src/app/fondo/[id]/page.tsx`** — migrado a `getDb()`; llama `/api/fondos/[id]` para el detalle
- **`src/app/login/page.tsx`** — refinado: mejor manejo de errores de OTP, mensajes en español, UX mejorada
- **`src/app/layout.tsx`** — integrado `LightSessionContext`; `AppHeader` actualizado con links a `/buscar` y `/buscar-avanzado`

#### Componentes actualizados
- **`src/components/busqueda/FlujoBuscador.tsx`** — eliminado `createBrowserClient` directo; ahora consume `/api/busqueda/catalogo`
- **`src/components/busqueda/HeroBuscador.tsx`** — botón "Búsqueda guiada" lleva a `/buscar`; botón "Búsqueda avanzada" lleva a `/buscar-avanzado`
- **`src/components/fondos/FondoDetalle.tsx`** — acordeón actualizado con sección de modelos de aplicación; botón de descarga PDF refinado
- **`src/components/fondos/FondoPDF.tsx`** — template PDF actualizado con secciones de modelos de aplicación
- **`src/components/fondos/FondosGrid.tsx`** — mejoras de UI: skeleton loader, mensaje de "sin resultados", paginación
- **`src/components/layout/AppHeader.tsx`** — links de navegación ampliados con `/buscar` y `/buscar-avanzado`; indicador de perfil activo
- **`src/components/layout/NavBar.tsx`** — ítem "Buscar" ahora apunta a `/buscar`
- **`src/hooks/useBusqueda.ts`** — refactorizado para usar fetch sobre `/api/busqueda/catalogo`; eliminada dependencia directa de Supabase browser client
- **`src/lib/pdf.tsx`** — correcciones de tipado TypeScript strict
- **`src/middleware.ts`** — ajustado matcher: rutas `/perfil` protegidas; `/buscar` y `/buscar-avanzado` son públicas
- **`src/types/database.ts`** — extendido con tipos v2: `TerminoNarrativo`, `PerfilConsulta`, `SearchEvent`, `SearchEventResult`, `ResultadoBusquedaNarrativa`, `KpisAdmin`, `MapaOrigenItem`
- **`next.config.js`** — actualizado con headers CORS para rutas API; variable de entorno `NEXT_PUBLIC_APP_URL`
- **`package.json`** / **`package-lock.json`** — dependencias nuevas: `d3`, `d3-geo`, `topojson-client`, `@types/d3`, `@types/topojson-client`
- **`.env.example`** — añadida variable `SUPABASE_SERVICE_ROLE_KEY` y `NEXT_PUBLIC_APP_URL`

#### Iconos de navegación (PWA / móvil)
- **`public/icons/home.png`** + **`home_negro.png`** — ícono de inicio
- **`public/icons/Fondos.png`** + **`Fondos_negro.png`** — ícono de catálogo de fondos
- **`public/icons/mapa.png`** + **`mapa_negro.png`** — ícono de mapa / analítica
- **`public/icons/admin.png`** + **`admin_negro.png`** — ícono de administración

---

### Migraciones SQL ejecutadas en Supabase (referencia, no se suben al repo)
- `001` — extensión `buscar_fondos_narrativo_v2` con score ponderado
- `002` — políticas RLS para `perfiles_consulta`
- `003` — fix en cálculo de `score_total` en el ranking
- `004` — refinamiento del ranking municipal con peso por distancia
- `005` — score de sector operacional
- `006` — pesos configurables por perfil de consulta
- `007` — bridge entre sistema narrativo y catálogo legacy
- `009` — parche de vectores de búsqueda FTS
- `010` — RLS deshabilitado en `search_events` y `search_event_results` (escritura server-side)
- `011` — `perfil_id` nullable en `search_events` para búsquedas anónimas

---

## [0.3.0] — 2026-03-25

### Agregado
- **Navegación principal (`NavBar`)** — barra con 4 secciones (Inicio, Fondos, Mapa, Admin), dos variantes: `hero` (translúcida sobre fondo navy) y `light` (blanca sobre páginas internas)
- **`AppHeader`** — header sticky para páginas internas; se oculta automáticamente en `/` donde el hero maneja su propia navegación
- **`/fondos`** — catálogo completo cargado desde `vista_fondo_detalle`; filtros por tipo (chips Nacional/Territorial/Internacional) y búsqueda de texto; ordenamiento por nombre, mayor monto, menor monto; grid de `FondoCard`
- **`CatalogoFondos`** — componente cliente con filtrado y ordenamiento local (sin queries adicionales a Supabase)
- **`/mapa`** — placeholder bien diseñado con ícono SVG y enlace al catálogo
- **`/admin`** — dashboard protegido: redirige a `/login` si no hay sesión; muestra conteo de fondos y municipios
- **Franja tricolor** en `Footer` (amarillo 50% · navy 25% · rojo 25%, 10px de alto)

### Cambiado
- `HeroBuscador` ahora usa `<NavBar variant="hero" />` en lugar de inline HTML manual
- `layout.tsx` incluye `<AppHeader />` antes del `<main>`
- `.gitignore` ampliado con entradas para PWA generados, OS, editor y logs

---

## [0.2.0] — 2026-03-20

### Agregado
- **Flujo de búsqueda guiado** — 4 etapas: tipo de fondo → proceso UNGRD → presupuesto → resultados
- **`FondoDetalle`** — acordeón con 8 secciones, primera abierta por defecto
- **`FondoPDF`** — template con logo institucional, franja amarilla y footer fijo
- **`pdf.tsx`** — descarga PDF con import dinámico de `@react-pdf/renderer`
- **`/fondo/[id]`** — Server Component con metadata dinámica y vista `vista_fondo_detalle`
- **`/login`** — autenticación con Magic Link via Supabase `signInWithOtp`
- **`/registro`** — registro de municipio con búsqueda de nombre y dropdown
- **`middleware.ts`** — protege `/perfil`; redirige usuarios autenticados fuera de `/login` y `/registro`
- **PWA** — `next-pwa` con estrategia `NetworkFirst` para la API de Supabase; `manifest.json`
- **`useBusqueda`** — caché en `localStorage` de 24 horas con fallback offline
- **`useOnlineStatus`** — detector de conectividad con banner offline

### Cambiado
- `HeroBuscador` muestra banner de caché cuando no hay conexión

---

## [0.1.0] — 2026-03-15

### Agregado
- Configuración inicial del proyecto: Next.js 14, TypeScript strict, Tailwind 3, App Router, alias `@/*`
- Integración con Supabase: `client.ts` (browser) y `server.ts` (SSR con cookies)
- Tipos TypeScript completos en `src/types/database.ts` (`Fondo`, `ResultadoBusqueda`, `Database`, etc.)
- `tailwind.config.ts` con paleta de colores UNGRD (`ungrd.navy`, `ungrd.yellow`, etc.)
- `HeroBuscador` — hero con logo UNGRD, buscador grande y estadísticas (32 fondos, 12 nacionales, 5 territoriales, 15 internacionales)
- `FondoCard` — tarjeta con badge de tipo, monto, procesos y enlace al detalle
- `Footer` con información institucional UNGRD y redes sociales
- Utilidades: `formatUSD`, `formatCOP`, `colorTipoFondo`, `truncate`
