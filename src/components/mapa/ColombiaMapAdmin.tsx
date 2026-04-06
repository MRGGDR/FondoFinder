'use client'

/**
 * ColombiaMapAdmin
 *
 * Variante del mapa de Colombia orientada al panel admin de analítica territorial.
 * En lugar de mostrar fondos por territorio, aplica un heatmap según la actividad
 * de los usuarios (municipio_origen_id de search_events).
 *
 * Props:
 *   activityData   — Record<divipola_5dig, número de actividad>
 *   colorMode      — 'busquedas' | 'usuarios' (controla qué métrica se colorea)
 *   onTerritorySelect — callback cuando el usuario hace click en dept o municipio
 *   selectedDivipola  — divipola actualmente seleccionado (para highlight)
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { Feature, FeatureCollection, Geometry } from 'geojson'

/* ─────────────────────────────────────────────
   TIPOS
───────────────────────────────────────────── */
interface GeoProps {
  COD_DEPTO_DIVIPOLA?: string
  DPTO_CCDGO?: string
  DPTO_CCNCT?: string
  DEPTO_OFICIAL?: string
  NAME_1?: string
  NAME?: string
  COD_MPIO_DIVIPOLA?: string
  MPIO_CCDGO?: string
  MPIO_CCNCT?: string
  MUNICIPIO_OFICIAL?: string
  NAME_2?: string
}

type GeoFeature = Feature<Geometry, GeoProps>
type GeoFC = FeatureCollection<Geometry, GeoProps>

export type TerritoryType = 'municipio' | 'departamento'

export interface ColombiaMapAdminProps {
  /** divipola (5 dígitos municipio, 2 dígitos departamento) → conteo de actividad */
  activityData: Record<string, number>
  colorMode?: 'busquedas' | 'usuarios'
  /** Callback al seleccionar un territorio */
  onTerritorySelect?: (divipola: string, nombre: string, tipo: TerritoryType, deptCode?: string) => void
  /** Divipola actualmente seleccionado (para borde activo) */
  selectedDivipola?: string | null
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const safe = (v: unknown): string => ((v ?? '') as string).toString().trim()
const pad2 = (v: unknown): string => safe(v).replace(/\D+/g, '').padStart(2, '0')
const pad5 = (v: unknown): string => safe(v).replace(/\D+/g, '').padStart(5, '0')

function deptName(d: GeoFeature): string {
  return d.properties?.DEPTO_OFICIAL || d.properties?.NAME_1 || d.properties?.NAME || 'Departamento'
}
function deptCode(d: GeoFeature): string {
  return pad2(d.properties?.COD_DEPTO_DIVIPOLA || d.properties?.DPTO_CCDGO || d.properties?.DPTO_CCNCT)
}
function muniName(f: GeoFeature): string {
  return f.properties?.MUNICIPIO_OFICIAL || f.properties?.NAME_2 || f.properties?.NAME || 'Municipio'
}
function muniCode(f: GeoFeature): string {
  return pad5(f.properties?.COD_MPIO_DIVIPOLA || f.properties?.MPIO_CCDGO || f.properties?.MPIO_CCNCT)
}
function muniDeptCode(f: GeoFeature): string {
  return pad2(f.properties?.COD_DEPTO_DIVIPOLA || f.properties?.DPTO_CCDGO || f.properties?.DPTO_CCNCT)
}

/** Suma la actividad de todos los municipios de un departamento */
function deptActivity(dCode: string, activityData: Record<string, number>): number {
  let total = 0
  for (const [divipola, count] of Object.entries(activityData)) {
    if (divipola.length === 5 && divipola.startsWith(dCode)) {
      total += count
    }
  }
  return total
}

/* ─────────────────────────────────────────────
   ESCALA DE COLOR HEATMAP
   Blanco / azul pálido → azul UNGRD oscuro
   #E8F4FD → #213362
───────────────────────────────────────────── */
function makeColorScale(max: number) {
  if (max <= 0) return () => '#E8F4FD'
  const scale = d3.scaleSequential()
    .domain([0, max])
    .interpolator(d3.interpolateRgb('#E8F4FD', '#213362'))
  return (v: number) => v <= 0 ? '#E8F4FD' : scale(v)
}

/* ─────────────────────────────────────────────
   COMPONENTE
───────────────────────────────────────────── */
export default function ColombiaMapAdmin({
  activityData,
  colorMode = 'busquedas',
  onTerritorySelect,
  selectedDivipola,
}: ColombiaMapAdminProps) {

  const containerRef   = useRef<HTMLDivElement>(null)
  const tooltipRef     = useRef<HTMLDivElement>(null)
  const dataDepts      = useRef<GeoFC | null>(null)
  const dataMunis      = useRef<GeoFC | null>(null)
  const mapLevel       = useRef<'country' | 'dept'>('country')
  const activeNode     = useRef<SVGPathElement | null>(null)
  const currentDeptRef = useRef<string>('')

  // Exponer activityData y colorScale a D3 handlers via ref so they're always fresh
  const activityRef = useRef(activityData)
  activityRef.current = activityData

  const [showBack, setShowBack] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  /* ── Trigger recolor on activityData/colorMode change ── */
  const [recolorTick, setRecolorTick] = useState(0)
  useEffect(() => {
    setRecolorTick(t => t + 1)
  }, [activityData, colorMode])

  /* ── Recolor paths when data changes ──────────────────── */
  useEffect(() => {
    if (!containerRef.current || !loaded) return
    const svg = d3.select(containerRef.current).select('svg')

    if (mapLevel.current === 'country') {
      // Color per dept
      const maxVal = Math.max(1, ...Object.values(activityRef.current))
      const colorScale = makeColorScale(maxVal)

      svg.selectAll<SVGPathElement, GeoFeature>('.dept-shape')
        .attr('fill', d => {
          const code = deptCode(d)
          return colorScale(deptActivity(code, activityRef.current))
        })
    } else {
      // Color per muni
      const maxVal = Math.max(1, ...Object.values(activityRef.current))
      const colorScale = makeColorScale(maxVal)

      svg.selectAll<SVGPathElement, GeoFeature>('.muni-shape')
        .attr('fill', d => colorScale(activityRef.current[muniCode(d)] ?? 0))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recolorTick, loaded])

  /* ── Highlight selectedDivipola ───────────────────────── */
  useEffect(() => {
    if (!containerRef.current || !loaded) return
    const svg = d3.select(containerRef.current).select('svg')
    svg.selectAll<SVGPathElement, GeoFeature>('.dept-shape, .muni-shape')
      .classed('admin-selected', function(d) {
        const code = mapLevel.current === 'country'
          ? (this.classList.contains('dept-shape') ? deptCode(d as GeoFeature) : muniCode(d as GeoFeature))
          : muniCode(d as GeoFeature)
        return code === selectedDivipola
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDivipola, loaded])

  /* ── D3 initialization ────────────────────────────────── */
  useEffect(() => {
    if (!containerRef.current || !tooltipRef.current) return
    const cont   = containerRef.current
    const tooltip = tooltipRef.current
    const W = 400, H = 500

    d3.select(cont).selectAll('svg').remove()

    const svg = d3.select(cont)
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%')
      .style('height', '100%')
      .style('background', 'white')
      .style('display', 'block')
      .style('outline', 'none')

    const rootG      = svg.append('g').attr('class', 'root')
    const munisLayer = rootG.append('g').attr('class', 'munis').attr('opacity', 0)
    const deptsLayer = rootG.append('g').attr('class', 'depts')

    const projection = d3.geoMercator()
    const path       = d3.geoPath(projection as d3.GeoProjection)

    /* Tooltip */
    function showTip(html: string, e: MouseEvent) {
      tooltip.innerHTML = html
      tooltip.style.left = e.clientX + 'px'
      tooltip.style.top  = e.clientY + 'px'
      tooltip.classList.add('show')
    }
    function hideTip() { tooltip.classList.remove('show') }

    /* Zoom to feature */
    function zoomToFeature(feat: GeoFeature, padding = 0.88, duration = 500) {
      try {
        const b = path.bounds(feat as d3.GeoPermissibleObjects)
        const dx = b[1][0] - b[0][0], dy = b[1][1] - b[0][1]
        const cx = (b[0][0] + b[1][0]) / 2, cy = (b[0][1] + b[1][1]) / 2
        const k  = Math.min((padding * W) / dx, (padding * H) / dy)
        const tx = W / 2 - k * cx, ty = H / 2 - k * cy
        rootG.transition().duration(duration).attr('transform', `translate(${tx},${ty}) scale(${k})`)
      } catch (_) { /* ignore */ }
    }

    /* Reset to country view */
    function resetView() {
      mapLevel.current = 'country'
      currentDeptRef.current = ''
      if (activeNode.current) {
        activeNode.current.classList.remove('is-active')
        activeNode.current = null
      }
      deptsLayer.style('display', 'block').transition().duration(250).attr('opacity', 1)
      munisLayer.transition().duration(250).attr('opacity', 0).on('end', function () {
        munisLayer.selectAll('*').remove()
      })
      rootG.transition().duration(500).attr('transform', 'translate(0,0) scale(1)')

      if (dataDepts.current) {
        const continental = {
          ...dataDepts.current,
          features: dataDepts.current.features.filter(d => deptCode(d) !== '88'),
        }
        const pad = 30
        projection.fitSize([W - pad * 2, H - pad * 2], continental as FeatureCollection)
        const [tx, ty] = projection.translate()
        projection.translate([tx + pad, ty + pad])
        deptsLayer.selectAll<SVGPathElement, GeoFeature>('path').attr('d', path as unknown as string)
      }
      setShowBack(false)
    }
    ;(cont as HTMLDivElement & { _resetView?: () => void })._resetView = resetView

    /* Enter department (drill-down) — carga municipios lazy la primera vez */
    async function enterDepartment(node: SVGPathElement, dptoFeat: GeoFeature) {
      const dCode = deptCode(dptoFeat)
      const dName = deptName(dptoFeat)
      mapLevel.current = 'dept'
      currentDeptRef.current = dCode

      if (activeNode.current) activeNode.current.classList.remove('is-active')
      node.classList.add('is-active')
      activeNode.current = node

      // Carga lazy del GeoJSON de municipios (4 MB) — solo la primera vez
      if (!dataMunis.current) {
        try {
          const gjMunis = await fetch('/col_municipios.geojson').then(r => {
            if (!r.ok) throw new Error('GeoJSON munis: HTTP ' + r.status)
            return r.json() as Promise<GeoFC>
          })
          dataMunis.current = gjMunis
        } catch (err) {
          console.error('[ColombiaMapAdmin] municipios lazy load', err)
          return
        }
      }

      const filtered = dataMunis.current.features.filter(f => muniDeptCode(f) === dCode)

      const maxVal     = Math.max(1, ...Object.values(activityRef.current))
      const colorScale = makeColorScale(maxVal)

      munisLayer.selectAll('path').remove()
      munisLayer.selectAll<SVGPathElement, GeoFeature>('path')
        .data(filtered, f => muniCode(f) || muniName(f))
        .enter().append('path')
        .attr('class', 'shape muni-shape')
        .attr('d', path as unknown as string)
        .attr('fill', f => colorScale(activityRef.current[muniCode(f)] ?? 0))
        .attr('stroke', '#E8F4FD')
        .attr('stroke-width', '0.5')
        .attr('tabindex', 0)
        .attr('aria-label', f => muniName(f))
        .on('mousemove', (e: MouseEvent, f: GeoFeature) => {
          const code = muniCode(f)
          const count = activityRef.current[code] ?? 0
          showTip(`<strong>${muniName(f)}</strong>${count > 0 ? `<br/>${count} búsqueda${count !== 1 ? 's' : ''}` : ''}`, e)
        })
        .on('mouseleave', hideTip)
        .on('focus', (e: MouseEvent, f: GeoFeature) => showTip(muniName(f), e))
        .on('blur', hideTip)
        .on('click', function (_: MouseEvent, f: GeoFeature) {
          munisLayer.selectAll('path').classed('admin-selected', false)
          d3.select(this).classed('admin-selected', true)
          onTerritorySelect?.(muniCode(f), muniName(f), 'municipio', dCode)
        })

      // Notify dept selection too
      onTerritorySelect?.(dCode, dName, 'departamento')

      deptsLayer.style('display', 'none')
      munisLayer.transition().duration(250).attr('opacity', 1)
      setShowBack(true)
      zoomToFeature(dptoFeat, 0.9, 500)
    }

    /* Draw departments */
    function drawDepartments(depts: GeoFC) {
      const maxVal     = Math.max(1, ...Object.values(activityRef.current))
      const colorScale = makeColorScale(maxVal)

      deptsLayer.selectAll<SVGPathElement, GeoFeature>('path')
        .data(depts.features, d => deptCode(d) || deptName(d))
        .enter().append('path')
        .attr('class', 'shape dept-shape')
        .attr('d', path as unknown as string)
        .attr('fill', d => colorScale(deptActivity(deptCode(d), activityRef.current)))
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', '0.7')
        .attr('tabindex', 0)
        .attr('aria-label', d => deptName(d))
        .on('mousemove', (e: MouseEvent, d: GeoFeature) => {
          const code  = deptCode(d)
          const count = deptActivity(code, activityRef.current)
          showTip(`<strong>${deptName(d)}</strong>${count > 0 ? `<br/>${count} búsqueda${count !== 1 ? 's' : ''}` : ''}`, e)
        })
        .on('mouseleave', hideTip)
        .on('focus', (e: MouseEvent, d: GeoFeature) => showTip(deptName(d), e))
        .on('blur', hideTip)
        .on('click', function (_: MouseEvent, d: GeoFeature) {
          enterDepartment(this as SVGPathElement, d)
        })
        .on('keydown', function (e: KeyboardEvent, d: GeoFeature) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            enterDepartment(this as SVGPathElement, d)
          }
        })
    }

    /* Load and init — solo departamentos al inicio (municipios se cargan lazy al hacer drill-down) */
    async function loadMap() {
      try {
        const gjDepts = await fetch('/col_departamentos.geojson').then(r => {
          if (!r.ok) throw new Error('GeoJSON depts: HTTP ' + r.status)
          return r.json() as Promise<GeoFC>
        })

        dataDepts.current = gjDepts

        const continental = {
          ...gjDepts,
          features: gjDepts.features.filter(d => deptCode(d) !== '88'),
        }
        const pad = 30
        projection.fitSize([W - pad * 2, H - pad * 2], continental as FeatureCollection)
        const [tx, ty] = projection.translate()
        projection.translate([tx + pad, ty + pad])

        drawDepartments(gjDepts)
        setLoaded(true)
      } catch (err) {
        console.error('[ColombiaMapAdmin]', err)
        setMapError('Error al cargar el mapa.')
      }
    }

    loadMap()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') resetView()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      d3.select(cont).selectAll('svg').remove()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Back button handler ─────────────────────── */
  const handleBack = useCallback(() => {
    const cont = containerRef.current as (HTMLDivElement & { _resetView?: () => void }) | null
    cont?._resetView?.()
  }, [])

  /* ── Render ──────────────────────────────────── */
  const maxActivity = Math.max(1, ...Object.values(activityData))

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Controles superiores */}
      {showBack && (
        <button
          onClick={handleBack}
          className="self-start text-xs px-3 py-1 rounded-full bg-[#213362] text-white hover:bg-[#1B4472] transition-colors"
        >
          ← Volver a Colombia
        </button>
      )}

      {/* Mapa SVG */}
      <div className="relative flex-1 min-h-[320px]">
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center text-red-500 text-sm p-4 text-center">
            {mapError}
          </div>
        )}
        {!loaded && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-[#213362] text-sm animate-pulse">Cargando mapa…</div>
          </div>
        )}
        <div
          ref={containerRef}
          className="w-full h-full bg-white"
          style={{ minHeight: '320px' }}
        />
        {/* Tooltip flotante (portal fuera del SVG) */}
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            background: 'rgba(33,51,98,0.93)',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 9999,
            display: 'none',
            maxWidth: '200px',
          }}
          className="map-tooltip"
        />
      </div>

      {/* Leyenda del heatmap */}
      <div className="flex items-center gap-2 text-xs text-gray-500 px-1">
        <span>Sin actividad</span>
        <div
          className="flex-1 h-2 rounded-full"
          style={{
            background: 'linear-gradient(to right, #E8F4FD, #213362)',
          }}
        />
        <span>Máx ({maxActivity.toLocaleString('es-CO')} {colorMode === 'busquedas' ? 'búsquedas' : 'usuarios'})</span>
      </div>

      {/* CSS para paths */}
      <style jsx global>{`
        .map-tooltip.show { display: block !important; }
        .shape {
          cursor: pointer;
          transition: filter 0.12s;
          outline: none;
        }
        .shape:focus {
          outline: none;
        }
        .shape:hover {
          filter: brightness(0.8);
        }
        .shape.is-active {
          stroke: #FFCD00 !important;
          stroke-width: 0.6px;
        }
        .shape.admin-selected {
          stroke: #FFCD00 !important;
          stroke-width: 0.8px;
          filter: brightness(0.85);
        }
      `}</style>
    </div>
  )
}
