# FondosFinder — UNGRD

Buscador de fuentes de financiamiento para la gestión del riesgo de desastres en Colombia.  
Desarrollado para la **Unidad Nacional para la Gestión del Riesgo de Desastres (UNGRD)**.

---

## Descripción

FondosFinder permite a los municipios colombianos encontrar y explorar las **32 fuentes de financiamiento** disponibles para proyectos de gestión del riesgo: nacionales, territoriales e internacionales.

**Funcionalidades principales:**

- Búsqueda guiada paso a paso (tipo → proceso → presupuesto → resultados)
- Búsqueda directa por texto libre
- Catálogo completo con filtros y ordenamiento
- Ficha detallada por fondo con 8 secciones en acordeón
- Descarga de PDF por fondo
- Mapa de cobertura territorial (próximamente)
- Panel de administración protegido por autenticación
- Autenticación con Magic Link (Supabase)
- Progressive Web App (PWA) con soporte offline

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript (strict) |
| Estilos | Tailwind CSS 3 |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth (Magic Link) |
| PDF | @react-pdf/renderer |
| PWA | next-pwa |
| Deploy | Vercel |

---

## Primeros pasos

### 1. Clonar el repositorio

```bash
git clone https://github.com/MRGGDR/FondoFinder.git
cd FondoFinder
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copiar `.env.example` como `.env.local` y completar con las credenciales de Supabase:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Las credenciales se obtienen en el dashboard de Supabase → **Project Settings → API**.

### 4. Iniciar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Estructura del proyecto

```
src/
├── app/                    # Rutas App Router
│   ├── page.tsx            # Página principal (buscador hero)
│   ├── fondos/page.tsx     # Catálogo completo
│   ├── mapa/page.tsx       # Mapa territorial (placeholder)
│   ├── admin/page.tsx      # Panel de administración
│   ├── fondo/[id]/page.tsx # Ficha detallada de fondo
│   ├── login/page.tsx      # Inicio de sesión (Magic Link)
│   └── registro/page.tsx   # Registro de municipio
├── components/
│   ├── busqueda/           # Flujo de búsqueda guiada
│   ├── fondos/             # Tarjetas, detalle, PDF, catálogo
│   ├── layout/             # NavBar, AppHeader, Footer
│   └── ui/                 # Componentes reutilizables
├── hooks/                  # useBusqueda, useOnlineStatus
├── lib/
│   ├── supabase/           # Clientes server y browser
│   ├── pdf.tsx             # Lógica de descarga PDF
│   └── utils.ts            # Utilidades (formatUSD, etc.)
├── middleware.ts            # Protección de rutas
└── types/database.ts       # Tipos TypeScript completos
```

---

## Despliegue en Vercel

1. Importar el repositorio en [vercel.com](https://vercel.com)
2. En **Settings → Environment Variables**, agregar:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. El build se ejecuta automáticamente con `npm run build`
4. No se requiere configuración adicional — Next.js App Router es compatible nativamente con Vercel

> **Importante:** Nunca subir `.env.local` al repositorio. Las variables de entorno deben configurarse directamente en el dashboard de Vercel.

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Construye para producción |
| `npm run start` | Inicia el servidor de producción |
| `npm run lint` | Ejecuta ESLint |

---

## Licencia

Proyecto institucional — UNGRD, Gobierno de Colombia.
