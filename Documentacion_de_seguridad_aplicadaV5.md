# Seguridad aplicada a FondoFinder V5 — estado actual

## Alcance
Este endurecimiento se aplicó al buscador V5, manteniendo operativo el frontend público con `anon key` y reduciendo el perímetro de exposición directa en Supabase.

## Cambios ya aplicados

### 1. Pre-ajuste en código server-side
Se eliminó el fallback silencioso a `anon` en server-side.
Ahora:
- el cliente público/browser usa `anon/publishable key`
- el cliente server-side privilegiado exige `SUPABASE_SERVICE_ROLE_KEY`
- si falta `SUPABASE_SERVICE_ROLE_KEY`, falla explícitamente

Objetivo:
evitar que rutas server-side sigan operando con permisos públicos por accidente.

### 2. Cierre inicial de `PUBLIC`
Se aplicó cierre de permisos existentes del rol `PUBLIC` sobre:
- schema `public`
- tablas
- sequences
- functions

Importante:
no fue posible modificar `ALTER DEFAULT PRIVILEGES FOR ROLE postgres/supabase_admin` por falta de permisos del entorno. Eso quedó como riesgo residual documentado.

### 3. Perímetro mínimo de lectura directa del frontend V5
Se dejó acceso directo público únicamente a estas 4 fuentes:

1. `public.ng_actores`
   Columnas:
   - `actor_id`
   - `actor_nombre`
   - `actor_orden`
   - `activo`

2. `public.cat_procesos`
   Columnas:
   - `id`
   - `nombre`

3. `public.cat_objetivos_pngrd`
   Columnas:
   - `id`
   - `nombre_corto`
   - `descripcion`

4. `public.fondos_modelos_aplicacion`
   Columnas:
   - `fondo_id`
   - `acceso`
   - `estado_convocatoria`
   - `periodicidad`

### 4. RLS y policies mínimas
Se activó / aseguró RLS en las 4 tablas públicas del V5 y se dejaron policies mínimas de solo lectura para `anon` y `authenticated`.

### 5. Cierre de objetos internos
Quedó bloqueado el acceso directo desde `anon` a:
- `public.ng_vw_busqueda_base`
- `public.ng_fondos_universo`
- `public.perfiles_consulta`
- y, por diseño, a la estructura interna `ng_*` no destinada al browser

### 6. Hardening de RPC del V5
Las 7 RPC del V5 quedaron en:
- `SECURITY DEFINER`
- `search_path = pg_catalog, pg_temp`

Funciones endurecidas:
1. `ng_buscar_fondos_v1`
2. `ng_listar_tipos_fondo_v1`
3. `ng_listar_categorias_v1`
4. `ng_listar_actividades_v1`
5. `ng_listar_entidades_v1`
6. `ng_listar_vigencias_v1`
7. `ng_resumen_flags_v1`

### 7. Validaciones exitosas
Se confirmó que:
- `anon` sí puede ejecutar RPC públicas del V5
- `anon` ya no puede leer `ng_vw_busqueda_base`
- `anon` ya no puede leer `ng_fondos_universo`
- `anon` ya no puede leer `perfiles_consulta`
- el frontend V5 siguió funcionando después del endurecimiento

## Riesgos residuales conocidos

### A. Default privileges abiertos a nivel de owner
No se pudieron corregir los `ALTER DEFAULT PRIVILEGES FOR ROLE postgres/supabase_admin` por permisos insuficientes del entorno.
Implicación:
si en el futuro se crean objetos nuevos en `public`, podrían heredar grants más abiertos de lo deseado.

Mitigación:
- revisar permisos después de crear nuevos objetos
- incluir chequeo de grants en checklist de despliegue
- volver a intentar corregir default privileges si el entorno/rol lo permite más adelante

### B. Funciones legacy todavía no cerradas globalmente
No se aplicó aún un cierre total de `EXECUTE` para todas las funciones legacy del negocio.
Esto se dejó así por prudencia para no romper piezas no auditadas del proyecto actual.

### C. Admin ligero
El acceso a `/mapa` y `/admin` sigue siendo funcional/liviano, no auth robusto.
Para este proyecto eso es aceptable porque el objetivo es operativo, no proteger datos altamente sensibles.

## Estado recomendado
La seguridad del V5 ya está en un punto razonable para continuar con:
1. rate limiting
2. debounce/deduplicación
3. validación de inputs
4. endurecimiento de rutas pesadas
5. monitoreo básico