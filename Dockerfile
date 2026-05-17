# ============================================================
# Stage 1: deps — instalar dependencias
# ============================================================
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ============================================================
# Stage 2: builder — compilar la aplicación Next.js
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias del stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables públicas baked en el bundle de cliente durante el build.
# Se pasan como ARG (no como ENV) para que no queden expuestas en la imagen final.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_TELEMETRY_DISABLED=1

# Build con next directamente (el workaround readlink-eisdir es solo para Windows)
RUN npx next build

# ============================================================
# Stage 3: runner — imagen de producción mínima
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar assets estáticos públicos (incluye GeoJSON, PDFs, imágenes)
COPY --from=builder /app/public ./public

# Copiar build standalone (autocontenido, incluye server.js + dependencias mínimas)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Variables de runtime (secretas, no baked — se pasan al arrancar el contenedor)
# SUPABASE_SERVICE_ROLE_KEY
# ADMIN_ACCESS_CODE

CMD ["node", "server.js"]
