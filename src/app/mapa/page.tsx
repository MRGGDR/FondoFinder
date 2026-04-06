'use client'

/**
 * /mapa — Panel ADMIN de Analítica Territorial
 *
 * Muestra DESDE DÓNDE se usa la plataforma FondosFinder:
 * municipio/departamento de ORIGEN del usuario (municipio_origen_id en search_events).
 *
 * NO muestra cobertura de fondos por territorio — para eso existe /api/mapa/fondos-territorio.
 *
 * Estructura:
 *   ┌─ Hero + KPI Bar ───────────────────────────────┐
 *   │  Mapa Colombia (heatmap)  │  Panel territorio   │
 *   └────────────────────────────────────────────────┘
 */

import dynamic from 'next/dynamic'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import type { TerritoryType } from '@/components/mapa/ColombiaMapAdmin'

/* ─────────────────────────────────────────────
   TIPOS
───────────────────────────────────────────── */
interface KpiData {
  total_usuarios: number
  total_busquedas: number
  municipios_activos: number
  departamentos_activos: number
  top_fondos: { fondo_id?: string; id?: string; nombre?: string; total_apariciones?: number }[]
  ultima_actividad: string | null
}

interface TerritorioResumen {
  municipio_id: string | null
  nombre: string
  departamento: string
  codigo_divipola: string | null
  codigo_departamento: string | null
  total_busquedas: number
  usuarios_unicos: number
  ultima_busqueda: string | null
}

interface TerritoryDetail {
  tipo: 'municipio' | 'departamento'
  nombre: string
  departamento: string
  codigo_divipola: string | null
  stats: { total_busquedas: number; usuarios_unicos: number; ultima_busqueda: string | null }
  actor_frecuente: string | null
  actores: { actor: string; usuarios: number }[]
  top_fondos: { fondo_id: string; nombre: string; tipo: string; veces: number }[]
  top_sujetos: { nombre: string; veces: number }[]
  top_predicados: { nombre: string; veces: number }[]
  actividad_reciente: {
    created_at: string
    sujeto_ui: string | null
    predicado_ui: string | null
    tipo_desastre: string | null
    cantidad_resultados: number | null
  }[]
  municipios_activos?: {
    nombre: string
    codigo_divipola: string | null
    total_busquedas: number
    usuarios_unicos: number
  }[]
}

/* ─────────────────────────────────────────────
   Dynamic import del mapa (browser-only)
───────────────────────────────────────────── */
const ColombiaMapAdmin = dynamic(
  () => import('@/components/mapa/ColombiaMapAdmin'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-80 text-[#213362] animate-pulse text-sm">
        Cargando mapa…
      </div>
    ),
  }
)

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso))
  } catch { return iso }
}

function fmtNum(n: number): string {
  return n.toLocaleString('es-CO')
}

/* ─────────────────────────────────────────────
   COMPONENTE PANEL VACÍO
───────────────────────────────────────────── */
function EmptyPanel() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-8">
      <div className="w-16 h-16 rounded-full bg-[#E8F4FD] flex items-center justify-center mb-4">
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#213362]" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
      </div>
      <p className="text-[#213362] font-semibold text-sm">Selecciona un territorio</p>
      <p className="text-gray-400 text-xs mt-1">Haz click en un departamento, luego en un municipio, para ver la analítica detallada.</p>
    </div>
  )
}

/* ─────────────────────────────────────────────
   KPI CARD
───────────────────────────────────────────── */
function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-3xl font-black text-[#213362]">{typeof value === 'number' ? fmtNum(value) : value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  )
}

/* ─────────────────────────────────────────────
   TERRITORIO PANEL COMPLETO
───────────────────────────────────────────── */
function TerritoryPanel({ data, onClose }: { data: TerritoryDetail; onClose: () => void }) {
  const isDepto = data.tipo === 'departamento'

  return (
    <div className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-280px)]">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDepto ? 'bg-[#213362] text-white' : 'bg-[#00AEE3] text-white'}`}>
              {isDepto ? 'Departamento' : 'Municipio'}
            </span>
            {data.codigo_divipola && (
              <span className="text-xs text-gray-400 font-mono">{data.codigo_divipola}</span>
            )}
          </div>
          <h2 className="text-xl font-black text-[#213362] mt-1 leading-tight">{data.nombre}</h2>
          {!isDepto && data.departamento && (
            <p className="text-xs text-gray-500">{data.departamento}</p>
          )}
        </div>
        <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-xl font-light mt-1 flex-shrink-0">
          ✕
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#f6fafe] rounded-lg p-3 text-center">
          <div className="text-2xl font-black text-[#213362]">{fmtNum(data.stats.total_busquedas)}</div>
          <div className="text-xs text-gray-400">Búsquedas</div>
        </div>
        <div className="bg-[#f6fafe] rounded-lg p-3 text-center">
          <div className="text-2xl font-black text-[#213362]">{fmtNum(data.stats.usuarios_unicos)}</div>
          <div className="text-xs text-gray-400">Usuarios</div>
        </div>
        <div className="bg-[#f6fafe] rounded-lg p-3 text-center">
          <div className="text-sm font-semibold text-[#213362] leading-tight">{fmtDate(data.stats.ultima_busqueda).split(' ')[0] ?? '—'}</div>
          <div className="text-xs text-gray-400">Última activ.</div>
        </div>
      </div>

      {/* Actor frecuente */}
      {data.actores.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Actores</h3>
          <div className="flex flex-col gap-1">
            {data.actores.slice(0, 5).map(a => (
              <div key={a.actor} className="flex items-center gap-2">
                <span className="text-xs text-gray-700 flex-1 truncate">{a.actor}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[80px]">
                  <div
                    className="bg-[#07519D] h-1.5 rounded-full"
                    style={{ width: `${Math.round((a.usuarios / data.actores[0].usuarios) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-6 text-right">{a.usuarios}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Fondos */}
      {data.top_fondos.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Top fondos consultados</h3>
          <div className="flex flex-col gap-1.5">
            {data.top_fondos.map((f, i) => (
              <div key={f.fondo_id} className="flex items-start gap-2">
                <span className="text-xs text-gray-300 w-4 flex-shrink-0 mt-0.5">{i + 1}.</span>
                <Link
                  href={`/fondo/${f.fondo_id}`}
                  className="text-xs text-[#07519D] hover:underline flex-1 leading-snug"
                >
                  {f.nombre}
                </Link>
                <span className="text-xs text-gray-400 flex-shrink-0">×{f.veces}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Sujetos y Predicados */}
      {(data.top_sujetos.length > 0 || data.top_predicados.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {data.top_sujetos.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">¿Quién busca?</h3>
              {data.top_sujetos.slice(0, 5).map(s => (
                <div key={s.nombre} className="flex justify-between text-xs py-0.5">
                  <span className="text-gray-600 truncate flex-1">{s.nombre}</span>
                  <span className="text-gray-400 ml-1">{s.veces}</span>
                </div>
              ))}
            </div>
          )}
          {data.top_predicados.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">¿Qué necesitan?</h3>
              {data.top_predicados.slice(0, 5).map(p => (
                <div key={p.nombre} className="flex justify-between text-xs py-0.5">
                  <span className="text-gray-600 truncate flex-1">{p.nombre}</span>
                  <span className="text-gray-400 ml-1">{p.veces}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actividad reciente */}
      {data.actividad_reciente.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Actividad reciente</h3>
          <div className="flex flex-col gap-2">
            {data.actividad_reciente.map((ev, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-gray-300 flex-shrink-0 mt-0.5 font-mono text-[10px]">
                  {fmtDate(ev.created_at).replace(',', '')}
                </span>
                <div className="flex-1 text-gray-600">
                  {[ev.sujeto_ui, ev.predicado_ui, ev.tipo_desastre].filter(Boolean).join(' · ') || '—'}
                  {ev.cantidad_resultados != null && (
                    <span className="text-gray-400 ml-1">({ev.cantidad_resultados} resultados)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Municipios dentro del departamento */}
      {isDepto && data.municipios_activos && data.municipios_activos.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            Municipios más activos
          </h3>
          <div className="flex flex-col gap-1">
            {data.municipios_activos.slice(0, 12).map((m, i) => (
              <div key={m.codigo_divipola ?? i} className="flex items-center gap-2 text-xs">
                <span className="text-gray-300 w-4">{i + 1}.</span>
                <span className="flex-1 text-gray-700 truncate">{m.nombre}</span>
                <span className="text-[#07519D] font-semibold">{fmtNum(m.total_busquedas)}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">{m.usuarios_unicos}u</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   PÁGINA PRINCIPAL
───────────────────────────────────────────── */
export default function MapaAdminPage() {
  // KPI state
  const [kpis, setKpis] = useState<KpiData | null>(null)
  const [kpisLoading, setKpisLoading] = useState(true)

  // Mapa origen state
  const [territorios, setTerritorios] = useState<TerritorioResumen[]>([])
  const [colorMode, setColorMode] = useState<'busquedas' | 'usuarios'>('busquedas')
  const [mapaLoading, setMapaLoading] = useState(true)

  // Territorio seleccionado
  const [selectedDivipola, setSelectedDivipola] = useState<string | null>(null)
  const [territoryDetail, setTerritoryDetail] = useState<TerritoryDetail | null>(null)
  const [territoryLoading, setTerritoryLoading] = useState(false)
  const [territoryError, setTerritoryError] = useState<string | null>(null)

  // Map de divipola → municipio_id (UUID) para llamar al endpoint territorio
  const divipolaToUuidRef = useRef<Record<string, string>>({})

  /* ── Carga inicial KPIs y mapa origen ───── */
  useEffect(() => {
    fetch('/api/admin/analytics/kpis')
      .then(r => r.json())
      .then(data => setKpis(data))
      .catch(console.error)
      .finally(() => setKpisLoading(false))

    fetch('/api/admin/analytics/mapa-origen')
      .then(r => r.json())
      .then(data => {
        const list: TerritorioResumen[] = data.territorios ?? []
        setTerritorios(list)
        // Construir mapa de divipola → uuid
        const map: Record<string, string> = {}
        for (const t of list) {
          if (t.codigo_divipola && t.municipio_id) {
            map[t.codigo_divipola] = t.municipio_id
          }
        }
        divipolaToUuidRef.current = map
      })
      .catch(console.error)
      .finally(() => setMapaLoading(false))
  }, [])

  /* ── Refetch mapa cuando cambia el modo ─── */
  useEffect(() => {
    fetch(`/api/admin/analytics/mapa-origen?modo=${colorMode}`)
      .then(r => r.json())
      .then(data => {
        setTerritorios(data.territorios ?? [])
      })
      .catch(console.error)
  }, [colorMode])

  /* ── Construir activityData para el mapa ── */
  const activityData: Record<string, number> = {}
  for (const t of territorios) {
    if (t.codigo_divipola) {
      activityData[t.codigo_divipola] = colorMode === 'usuarios' ? t.usuarios_unicos : t.total_busquedas
    }
  }

  /* ── Handler de selección de territorio ── */
  const onTerritorySelect = useCallback(async (
    divipola: string,
    nombre: string,
    tipo: TerritoryType,
    deptCode?: string,
  ) => {
    setSelectedDivipola(divipola)
    setTerritoryError(null)
    setTerritoryDetail(null)
    setTerritoryLoading(true)

    try {
      let url: string
      if (tipo === 'departamento') {
        // 2-digit dept code
        url = `/api/admin/analytics/territorio?dept_code=${encodeURIComponent(divipola)}`
      } else {
        // Try to get UUID from our map
        const uuid = divipolaToUuidRef.current[divipola]
        if (!uuid) {
          setTerritoryDetail(null)
          setTerritoryLoading(false)
          setTerritoryError(`${nombre} — sin datos de origen registrados aún.`)
          return
        }
        url = `/api/admin/analytics/territorio?municipio_id=${encodeURIComponent(uuid)}`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data: TerritoryDetail = await res.json()
      setTerritoryDetail(data)
    } catch (e) {
      setTerritoryError('No se pudo cargar la analítica del territorio.')
      console.error('[territorio select]', e)
    } finally {
      setTerritoryLoading(false)
    }
  }, [])

  const clearPanel = useCallback(() => {
    setSelectedDivipola(null)
    setTerritoryDetail(null)
    setTerritoryError(null)
  }, [])

  /* ─── RENDER ────────────────────────────────────── */
  return (
    <div style={{ background: '#f6fafe', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ background: '#213362', padding: '40px 48px 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ background: '#FFCD00', color: '#213362', fontSize: 10, fontWeight: 800, padding: '2px 10px', borderRadius: 99, letterSpacing: 1, textTransform: 'uppercase' }}>
              Admin
            </span>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
              Analítica Territorial
            </p>
          </div>
          <h1 style={{ color: '#fff', fontSize: 34, fontWeight: 900, letterSpacing: -1, lineHeight: 1.1 }}>
            ¿Desde dónde se usa FondosFinder?
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 8 }}>
            Heatmap basado en el municipio de origen de los usuarios. Haz click en un territorio para ver la analítica detallada.
          </p>
        </div>
      </div>

      {/* Franja tricolor */}
      <div style={{ display: 'flex', height: 5 }}>
        <div style={{ flex: '0 0 50%', background: '#ffc800' }} />
        <div style={{ flex: '0 0 25%', background: '#223a7a' }} />
        <div style={{ flex: '0 0 25%', background: '#d80e25' }} />
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 24px 64px' }}>

        {/* KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {kpisLoading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 h-24 animate-pulse" />
            ))
          ) : kpis ? (
            <>
              <KpiCard label="Usuarios registrados" value={kpis.total_usuarios} />
              <KpiCard label="Búsquedas totales" value={kpis.total_busquedas} />
              <KpiCard label="Municipios activos" value={kpis.municipios_activos} />
              <KpiCard
                label="Departamentos activos"
                value={kpis.departamentos_activos}
                sub={kpis.ultima_actividad ? `Última: ${fmtDate(kpis.ultima_actividad)}` : undefined}
              />
            </>
          ) : (
            <div className="col-span-4 text-xs text-red-400 py-4">Error al cargar KPIs</div>
          )}
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-[42%_1fr] gap-6">

          {/* ── Col izquierda: Mapa ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">

            {/* Modo toggle */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#213362]">Origen de los usuarios</h2>
              <div className="flex rounded-full border border-gray-200 overflow-hidden text-xs">
                <button
                  onClick={() => setColorMode('busquedas')}
                  className={`px-4 py-1.5 font-semibold transition-colors ${
                    colorMode === 'busquedas'
                      ? 'bg-[#213362] text-white'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Búsquedas
                </button>
                <button
                  onClick={() => setColorMode('usuarios')}
                  className={`px-4 py-1.5 font-semibold transition-colors ${
                    colorMode === 'usuarios'
                      ? 'bg-[#213362] text-white'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Usuarios
                </button>
              </div>
            </div>

            {mapaLoading ? (
              <div className="h-80 flex items-center justify-center text-[#213362] animate-pulse text-sm">
                Cargando datos…
              </div>
            ) : (
              <ColombiaMapAdmin
                activityData={activityData}
                colorMode={colorMode}
                onTerritorySelect={onTerritorySelect}
                selectedDivipola={selectedDivipola}
              />
            )}

            {/* Nota de territorios */}
            <p className="text-xs text-gray-400 text-center">
              {territorios.length > 0
                ? `${territorios.length} territorio${territorios.length !== 1 ? 's' : ''} con actividad registrada`
                : 'Sin datos de actividad aún'}
            </p>
          </div>

          {/* ── Col derecha: Panel de territorio ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
            <h2 className="text-sm font-bold text-[#213362] mb-4 flex-shrink-0">
              Analítica del territorio
            </h2>

            {territoryLoading && (
              <div className="flex flex-col gap-3 animate-pulse py-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl" />
                ))}
              </div>
            )}

            {!territoryLoading && territoryError && (
              <div className="flex flex-col items-center justify-center h-48 text-center px-8">
                <p className="text-gray-400 text-sm">{territoryError}</p>
              </div>
            )}

            {!territoryLoading && !territoryError && !territoryDetail && (
              <EmptyPanel />
            )}

            {!territoryLoading && !territoryError && territoryDetail && (
              <TerritoryPanel data={territoryDetail} onClose={clearPanel} />
            )}
          </div>
        </div>

        {/* Top Fondos globales */}
        {kpis && kpis.top_fondos.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-[#213362] mb-3">Top fondos globales</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {kpis.top_fondos.slice(0, 8).map((f, i) => {
                const id = f.fondo_id ?? f.id ?? ''
                const nombre = f.nombre ?? '—'
                const veces = f.total_apariciones ?? 0
                return (
                  <Link
                    key={id || i}
                    href={id ? `/fondo/${id}` : '#'}
                    className="flex flex-col gap-0.5 bg-[#f6fafe] rounded-lg p-3 hover:bg-[#E8F4FD] transition-colors"
                  >
                    <span className="text-xs font-semibold text-[#213362] leading-snug line-clamp-2">{nombre}</span>
                    <span className="text-xs text-gray-400">×{fmtNum(veces)} apariciones</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

