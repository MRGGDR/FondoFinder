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

import React from 'react'
import dynamic from 'next/dynamic'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import type { TerritoryType } from '@/components/mapa/ColombiaMapAdmin'
import { useLightSession } from '@/context/LightSessionContext'
import { getAdminRequestHeaders } from '@/lib/adminAccess'

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

interface UsuarioMunicipioResumen {
  municipio_id: string
  nombre: string
  departamento: string
  codigo_divipola: string | null
  codigo_departamento: string | null
  total_usuarios: number
  ultimo_registro: string | null
}

interface UsuariosMapaData {
  total: number
  municipios: UsuarioMunicipioResumen[]
  departamentos: { departamento: string; codigo_departamento: string | null; total_usuarios: number }[]
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
  top_objetivos: { nombre: string; veces: number }[]
  top_categorias: { nombre: string; veces: number }[]
  top_actividades: { nombre: string; veces: number }[]
  avg_resultados: number | null
  actividad_reciente: {
    created_at: string
    actor_ui: string | null
    tipo_fondo_ui: string | null
    procesos_ui: string[]
    objetivos_ui: string[]
    categoria_ui: string | null
    actividades_ui: string[]
    cantidad_resultados: number | null
    // legacy
    sujeto_ui: string | null
    predicado_ui: string | null
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

function fmtDateShort(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
  } catch { return iso }
}

function fmtRelative(iso: string | null): string {
  if (!iso) return '—'
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 5) return 'Hace un momento'
    if (mins < 60) return `Hace ${mins} min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `Hace ${hrs}h`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `Hace ${days} ${days === 1 ? 'día' : 'días'}`
    return fmtDateShort(iso)
  } catch { return iso ?? '—' }
}

function fmtTimeOnly(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
  } catch { return iso }
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
function BarRow({ nombre, veces, max, color = '#07519D' }: { nombre: string; veces: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.max(4, Math.round((veces / max) * 100)) : 4
  return (
    <div className="flex items-center gap-2 group">
      <span className="text-xs text-gray-700 flex-1 truncate leading-snug">{nombre}</span>
      <div className="w-20 bg-gray-100 rounded-full h-1.5 flex-shrink-0">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold text-gray-500 w-5 text-right flex-shrink-0">{veces}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
      {children}
    </h3>
  )
}

function TerritoryPanel({ data, onClose }: { data: TerritoryDetail; onClose: () => void }) {
  const isDepto = data.tipo === 'departamento'

  const maxActores    = data.actores[0]?.usuarios ?? 1
  const maxTipos      = data.top_sujetos[0]?.veces ?? 1
  const maxProcesos   = data.top_predicados[0]?.veces ?? 1
  const maxObjetivos  = data.top_objetivos?.[0]?.veces ?? 1
  const maxCategorias = data.top_categorias?.[0]?.veces ?? 1
  const maxActividades = data.top_actividades?.[0]?.veces ?? 1

  return (
    <div className="flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">

      {/* ── Cabecera ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full tracking-wide ${isDepto ? 'bg-[#213362] text-white' : 'bg-[#00AEE3] text-white'}`}>
              {isDepto ? 'Departamento' : 'Municipio'}
            </span>
            {data.codigo_divipola && (
              <span className="text-[10px] text-gray-300 font-mono bg-gray-50 px-1.5 py-0.5 rounded">{data.codigo_divipola}</span>
            )}
          </div>
          <h2 className="text-2xl font-black text-[#213362] mt-1.5 leading-tight">{data.nombre}</h2>
          {!isDepto && data.departamento && (
            <p className="text-xs text-gray-400 font-medium mt-0.5">{data.departamento}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-1 text-sm"
        >
          ✕
        </button>
      </div>

      {/* ── Stats 4-grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-[#213362] to-[#07519D] rounded-xl p-3 text-center">
          <div className="text-3xl font-black text-white leading-none">{fmtNum(data.stats.total_busquedas)}</div>
          <div className="text-[10px] text-blue-200 font-semibold mt-1 uppercase tracking-wide">Búsquedas</div>
        </div>
        <div className="bg-gradient-to-br from-[#00AEE3] to-[#0089c0] rounded-xl p-3 text-center">
          <div className="text-3xl font-black text-white leading-none">{fmtNum(data.stats.usuarios_unicos)}</div>
          <div className="text-[10px] text-sky-100 font-semibold mt-1 uppercase tracking-wide">Usuarios</div>
        </div>
        <div className="bg-[#f6fafe] rounded-xl p-3 text-center border border-gray-100">
          <div className="text-sm font-black text-[#213362] leading-tight">{fmtRelative(data.stats.ultima_busqueda)}</div>
          <div className="text-[10px] text-gray-400 font-semibold mt-1 uppercase tracking-wide">Última actividad</div>
          {data.stats.ultima_busqueda && (
            <div className="text-[9px] text-gray-300 mt-0.5">{fmtDateShort(data.stats.ultima_busqueda)}</div>
          )}
        </div>
        <div className="bg-[#f6fafe] rounded-xl p-3 text-center border border-gray-100">
          <div className="text-3xl font-black text-[#FFCD00] leading-none drop-shadow-sm">
            {data.avg_resultados != null ? data.avg_resultados : '—'}
          </div>
          <div className="text-[10px] text-gray-400 font-semibold mt-1 uppercase tracking-wide">Prom. resultados</div>
        </div>
      </div>

      {/* ── Actores ───────────────────────────────────────────────────── */}
      {data.actores.length > 0 && (
        <div>
          <SectionTitle>Actores</SectionTitle>
          <div className="flex flex-col gap-2">
            {data.actores.slice(0, 5).map((a, i) => (
              <div key={a.actor} className="flex items-center gap-2">
                {i === 0 && (
                  <span className="text-[9px] font-black px-1.5 rounded-full flex-shrink-0 bg-[#FFCD00]" style={{ color: '#213362' }}>
                    #1
                  </span>
                )}
                {i > 0 && <span className="text-[10px] text-gray-300 w-5 text-center flex-shrink-0">{i + 1}</span>}
                <span className="text-xs text-gray-700 flex-1 truncate">{a.actor}</span>
                <div className="w-16 bg-gray-100 rounded-full h-1.5 flex-shrink-0">
                  <div
                    className="bg-[#07519D] h-1.5 rounded-full"
                    style={{ width: `${Math.max(4, Math.round((a.usuarios / maxActores) * 100))}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-[#213362] w-5 text-right">{a.usuarios}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Top Fondos ────────────────────────────────────────────────── */}
      {data.top_fondos.length > 0 && (
        <div>
          <SectionTitle>Top fondos consultados</SectionTitle>
          <div className="flex flex-col gap-2">
            {data.top_fondos.map((f, i) => (
              <div key={f.fondo_id} className="flex items-start gap-2">
                <span className="text-[10px] text-gray-300 w-4 flex-shrink-0 mt-0.5 font-mono">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/fondo/${f.fondo_id}`}
                    className="text-xs text-[#07519D] hover:underline leading-snug line-clamp-2"
                  >
                    {f.nombre}
                  </Link>
                  {f.tipo && (
                    <span className="inline-block text-[9px] font-semibold text-gray-400 bg-gray-100 rounded px-1.5 py-px mt-0.5">
                      {f.tipo}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-black text-gray-400 flex-shrink-0 mt-0.5">×{f.veces}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Grilla de pasos del wizard ────────────────────────────────── */}
      {/* Fila 1: Tipos de fondo + Procesos GRD */}
      {(data.top_sujetos.length > 0 || data.top_predicados.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {data.top_sujetos.length > 0 && (
            <div>
              <SectionTitle>Tipos de fondo</SectionTitle>
              <div className="flex flex-col gap-2">
                {data.top_sujetos.slice(0, 5).map(s => (
                  <BarRow key={s.nombre} nombre={s.nombre} veces={s.veces} max={maxTipos} color="#213362" />
                ))}
              </div>
            </div>
          )}
          {data.top_predicados.length > 0 && (
            <div>
              <SectionTitle>Procesos GRD</SectionTitle>
              <div className="flex flex-col gap-2">
                {data.top_predicados.slice(0, 5).map(p => (
                  <BarRow key={p.nombre} nombre={p.nombre} veces={p.veces} max={maxProcesos} color="#00AEE3" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fila 2: Objetivos PNGRD + Categorías */}
      {(data.top_objetivos?.length > 0 || data.top_categorias?.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {data.top_objetivos?.length > 0 && (
            <div>
              <SectionTitle>Objetivos PNGRD</SectionTitle>
              <div className="flex flex-col gap-2">
                {data.top_objetivos.slice(0, 5).map(o => (
                  <BarRow key={o.nombre} nombre={o.nombre} veces={o.veces} max={maxObjetivos} color="#FFCD00" />
                ))}
              </div>
            </div>
          )}
          {data.top_categorias?.length > 0 && (
            <div>
              <SectionTitle>Categorías</SectionTitle>
              <div className="flex flex-col gap-2">
                {data.top_categorias.slice(0, 5).map(c => (
                  <BarRow key={c.nombre} nombre={c.nombre} veces={c.veces} max={maxCategorias} color="#07519D" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fila 3: Actividades más buscadas (ancho completo) */}
      {data.top_actividades?.length > 0 && (
        <div>
          <SectionTitle>Actividades más buscadas</SectionTitle>
          <div className="flex flex-col gap-2">
            {data.top_actividades.slice(0, 6).map(a => (
              <BarRow key={a.nombre} nombre={a.nombre} veces={a.veces} max={maxActividades} color="#213362" />
            ))}
          </div>
        </div>
      )}

      {/* ── Actividad reciente — desglose completo ────────────────────── */}
      {data.actividad_reciente.length > 0 && (
        <div>
          <SectionTitle>Actividad reciente</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {data.actividad_reciente.map((ev, i) => {
              const steps: { label: string; value: string; color: string }[] = []
              if (ev.actor_ui)       steps.push({ label: 'Actor',     value: ev.actor_ui,            color: '#213362' })
              if (ev.tipo_fondo_ui)  steps.push({ label: 'Tipo',      value: ev.tipo_fondo_ui,       color: '#07519D' })
              if (ev.procesos_ui?.length) ev.procesos_ui.forEach(p => steps.push({ label: 'Proceso', value: p, color: '#00AEE3' }))
              if (ev.objetivos_ui?.length) ev.objetivos_ui.forEach(o => steps.push({ label: 'Objetivo', value: o, color: '#22BB66' }))
              if (ev.categoria_ui)   steps.push({ label: 'Categoría', value: ev.categoria_ui,        color: '#8B5CF6' })
              if (ev.actividades_ui?.length) ev.actividades_ui.forEach(a => steps.push({ label: 'Actividad', value: a, color: '#F59E0B' }))

              return (
                <div key={i} className="bg-[#f9fbff] rounded-xl px-3 py-2.5 border border-gray-100">
                  {/* Time + results header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-400 font-mono">{fmtTimeOnly(ev.created_at)}</span>
                    {ev.cantidad_resultados != null && (
                      <span className="text-[10px] bg-[#E8F4FD] text-[#07519D] font-bold px-2 py-0.5 rounded-full">
                        {ev.cantidad_resultados} resultado{ev.cantidad_resultados !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {/* Steps chips */}
                  {steps.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {steps.map((s, j) => (
                        <span
                          key={j}
                          className="inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 leading-snug"
                          style={{ background: `${s.color}18`, color: s.color }}
                        >
                          <span className="font-bold opacity-70">{s.label}</span>
                          <span className="opacity-90 max-w-[120px] truncate">{s.value}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400 italic">Sin desglose disponible</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Municipios más activos (solo departamento) ────────────────── */}
      {isDepto && data.municipios_activos && data.municipios_activos.length > 0 && (
        <div>
          <SectionTitle>Municipios más activos</SectionTitle>
          {(() => {
            const maxMuni = data.municipios_activos![0]?.total_busquedas ?? 1
            return (
              <div className="flex flex-col gap-1.5">
                {data.municipios_activos!.slice(0, 12).map((m, i) => (
                  <div key={m.codigo_divipola ?? i} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-300 w-5 text-right flex-shrink-0 font-mono">{i + 1}.</span>
                    <span className="text-xs text-gray-700 flex-1 truncate">{m.nombre}</span>
                    <div className="w-16 bg-gray-100 rounded-full h-1.5 flex-shrink-0">
                      <div
                        className="h-1.5 rounded-full bg-[#213362]"
                        style={{ width: `${Math.max(4, Math.round((m.total_busquedas / maxMuni) * 100))}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[#213362] w-6 text-right">{fmtNum(m.total_busquedas)}</span>
                    <span className="text-[10px] text-gray-400">{m.usuarios_unicos}u</span>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   PÁGINA PRINCIPAL
───────────────────────────────────────────── */
export default function MapaAdminPage() {
  const { perfil, esAdmin } = useLightSession()
  const adminHeaders = useMemo(() => getAdminRequestHeaders(perfil), [perfil])

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

  // Usuarios registrados por territorio
  const [usuariosMapa, setUsuariosMapa] = useState<UsuariosMapaData | null>(null)
  const [usuariosLoading, setUsuariosLoading] = useState(true)

  // Map de divipola → municipio_id (UUID) para llamar al endpoint territorio
  const divipolaToUuidRef = useRef<Record<string, string>>({})

  /* ── Carga inicial KPIs y mapa origen ───── */
  useEffect(() => {
    if (!esAdmin || !perfil) {
      setKpisLoading(false)
      setUsuariosLoading(false)
      setMapaLoading(false)
      return
    }

    fetch('/api/admin/analytics/kpis', { headers: adminHeaders })
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .then(data => setKpis(data))
      .catch(console.error)
      .finally(() => setKpisLoading(false))

    fetch('/api/admin/analytics/usuarios-mapa', { headers: adminHeaders })
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .then(data => setUsuariosMapa(data))
      .catch(console.error)
      .finally(() => setUsuariosLoading(false))

    fetch('/api/admin/analytics/mapa-origen', { headers: adminHeaders })
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
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
  }, [esAdmin, perfil, adminHeaders])

  /* ── Refetch mapa cuando cambia el modo ─── */
  useEffect(() => {
    if (!esAdmin || !perfil) return
    fetch(`/api/admin/analytics/mapa-origen?modo=${colorMode}`, { headers: adminHeaders })
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .then(data => {
        setTerritorios(data.territorios ?? [])
      })
      .catch(console.error)
  }, [colorMode, esAdmin, perfil, adminHeaders])

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
    if (!esAdmin || !perfil) {
      setTerritoryError('Acceso restringido para este perfil.')
      return
    }

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

      const res = await fetch(url, { headers: adminHeaders })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data: TerritoryDetail = await res.json()
      setTerritoryDetail(data)
    } catch (e) {
      setTerritoryError('No se pudo cargar la analítica del territorio.')
      console.error('[territorio select]', e)
    } finally {
      setTerritoryLoading(false)
    }
  }, [esAdmin, perfil, adminHeaders])

  const clearPanel = useCallback(() => {
    setSelectedDivipola(null)
    setTerritoryDetail(null)
    setTerritoryError(null)
  }, [])

  /* ─── RENDER ────────────────────────────────────── */
  if (!perfil) return null

  if (!esAdmin) {
    return (
      <div className="min-h-[70vh] bg-[#f6fafe]">
        <div className="max-w-3xl mx-auto px-6 py-14">
          <div className="bg-white border border-[#e4e9f1] rounded-3xl p-8 shadow-[0_10px_28px_-16px_rgba(7,29,76,0.25)]">
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.12em] bg-[#d80e25] text-white px-3 py-1 rounded-full mb-4">
              Restringido
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-[#213362] leading-tight mb-2">
              Acceso solo para administrador
            </h1>
            <p className="text-sm md:text-base text-[#5c6680] leading-relaxed mb-6">
              El mapa y la analítica territorial solo están habilitados para el usuario admin.
            </p>
            <Link
              href="/"
              className="inline-flex items-center rounded-xl bg-[#213362] text-white font-bold text-sm px-4 py-2.5 hover:bg-[#1B4472] transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

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
            ¿Desde dónde se usa la herramienta?
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

        {/* Usuarios registrados por territorio */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#213362]">Usuarios registrados por territorio</h2>
            {!usuariosLoading && usuariosMapa && (
              <span className="text-xs font-black text-[#FFCD00] bg-[#213362] px-3 py-1 rounded-full">
                {usuariosMapa.total} usuario{usuariosMapa.total !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {usuariosLoading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          )}

          {!usuariosLoading && (!usuariosMapa || usuariosMapa.total === 0) && (
            <p className="text-xs text-gray-400 text-center py-4">Sin usuarios registrados aún.</p>
          )}

          {!usuariosLoading && usuariosMapa && usuariosMapa.total > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Departamentos */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Por departamento
                  <span className="ml-2 font-normal text-gray-400 normal-case">({usuariosMapa.departamentos.length})</span>
                </h3>
                <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
                  {usuariosMapa.departamentos.map((d, i) => (
                    <div key={d.departamento} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-300 w-4 flex-shrink-0">{i + 1}.</span>
                      <span className="flex-1 text-gray-700 truncate">{d.departamento}</span>
                      <span className="font-black text-[#213362]">{d.total_usuarios}</span>
                      <span className="text-gray-300">usuario{d.total_usuarios !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Municipios */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Por municipio
                  <span className="ml-2 font-normal text-gray-400 normal-case">({usuariosMapa.municipios.length})</span>
                </h3>
                <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
                  {usuariosMapa.municipios.map((m, i) => (
                    <div key={m.municipio_id} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-300 w-4 flex-shrink-0">{i + 1}.</span>
                      <span className="flex-1 text-gray-700 truncate">{m.nombre}</span>
                      <span className="text-gray-400 truncate max-w-[90px]">{m.departamento}</span>
                      <span className="font-black text-[#07519D]">{m.total_usuarios}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top Fondos globales */}
        {kpis && (kpis.top_fondos?.length ?? 0) > 0 && (
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

