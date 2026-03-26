# Changelog

Todos los cambios notables de este proyecto están documentados aquí.  
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

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
