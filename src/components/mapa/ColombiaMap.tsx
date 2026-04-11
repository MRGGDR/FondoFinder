'use client'

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

interface FondoResumen {
  id: string
  nombre: string
  tipo_fondo_categoria: string
  monto_texto: string | null
  entidad_encargada: string | null
  tags_visibles: string[]
}

interface PanelData {
  tipo: 'municipio' | 'departamento' | null
  nombre: string
  departamento?: string
  codigo: string
  fondos: FondoResumen[]
  cargando: boolean
  error: string | null
}

/* ─────────────────────────────────────────────
   HELPERS DE EXTRACCIÓN DE PROPIEDADES
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

const COLOR_TIPO: Record<string, string> = {
  Infraestructura: '#1B4472',
  Social: '#07519D',
  Ambiental: '#00AEE3',
  Productivo: '#213362',
  Humanitario: '#FFCD00',
}

function colorTipo(tipo: string): string {
  return COLOR_TIPO[tipo] ?? '#213362'
}

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
export default function ColombiaMap() {
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Referencias a datos D3 (no estado React para evitar re-renders)
  const dataDepts = useRef<GeoFC | null>(null)
  const dataMunis = useRef<GeoFC | null>(null)
  const activeNode = useRef<SVGPathElement | null>(null)
  const mapLevel = useRef<'country' | 'dept'>('country')

  // Refs para dropdowns
  const deptDropRef = useRef<HTMLDivElement>(null)
  const muniDropRef = useRef<HTMLDivElement>(null)

  // Refs para los textos de los toggles
  const deptToggleTextRef = useRef<HTMLSpanElement>(null)
  const muniToggleTextRef = useRef<HTMLSpanElement>(null)
  const selectedDeptCode = useRef<string>('')
  const selectedMuniCode = useRef<string>('')

  // Estado para el panel lateral
  const [panel, setPanel] = useState<PanelData>({
    tipo: null,
    nombre: '',
    codigo: '',
    fondos: [],
    cargando: false,
    error: null,
  })

  // Estado para mostrar / ocultar el botón Volver
  const [showBack, setShowBack] = useState(false)

  // Para re-dibujar dropdowns después de carga
  const [deptList, setDeptList] = useState<{ code: string; name: string }[]>([])
  const [muniListAll, setMuniListAll] = useState<{ code: string; name: string; deptCode: string }[]>([])
  const [muniListFiltered, setMuniListFiltered] = useState<{ code: string; name: string; deptCode: string }[]>([])
  const [deptSearch, setDeptSearch] = useState('')
  const [muniSearch, setMuniSearch] = useState('')
  const [deptDropOpen, setDeptDropOpen] = useState(false)
  const [muniDropOpen, setMuniDropOpen] = useState(false)

  /* ── Fetch fondos para territorio seleccionado ─────────── */
  const fetchFondos = useCallback(async (divipola: string, nombre: string, tipo: 'municipio' | 'departamento', departamento?: string) => {
    setPanel(prev => ({ ...prev, tipo, nombre, departamento, codigo: divipola, cargando: true, error: null, fondos: [] }))
    try {
      const res = await fetch(`/api/mapa/fondos-territorio?divipola=${encodeURIComponent(divipola)}`)
      if (!res.ok) throw new Error('Error ' + res.status)
      const json = await res.json()
      setPanel(prev => ({
        ...prev,
        cargando: false,
        fondos: json.fondos ?? [],
        error: json.mensaje && !json.fondos?.length ? json.mensaje : null,
      }))
    } catch (e) {
      setPanel(prev => ({ ...prev, cargando: false, error: 'No se pudo cargar la información' }))
    }
  }, [])

  /* ── Inicialización del mapa D3 ─────────────────────────── */
  useEffect(() => {
    if (!svgContainerRef.current || !tooltipRef.current) return

    const cont = svgContainerRef.current
    const tooltip = tooltipRef.current
    const W = 400, H = 500

    // Limpiar SVG previo si existe
    d3.select(cont).selectAll('svg').remove()

    const svg = d3.select(cont)
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%')
      .style('height', '100%')
      .style('display', 'block')

    const rootG = svg.append('g').attr('class', 'root')
    const munisLayer = rootG.append('g').attr('class', 'munis').attr('opacity', 0)
    const deptsLayer = rootG.append('g').attr('class', 'depts')

    const projection = d3.geoMercator()
    const path = d3.geoPath(projection as d3.GeoProjection)

    /* ── Tooltip helpers ── */
    function showTip(text: string, e: MouseEvent) {
      tooltip.textContent = text
      tooltip.style.left = e.clientX + 'px'
      tooltip.style.top = e.clientY + 'px'
      tooltip.classList.add('show')
    }
    function hideTip() {
      tooltip.classList.remove('show')
    }

    /* ── Zoom to feature ── */
    function zoomToFeature(feat: GeoFeature, padding = 0.88, duration = 500) {
      try {
        const b = path.bounds(feat as d3.GeoPermissibleObjects)
        const dx = b[1][0] - b[0][0], dy = b[1][1] - b[0][1]
        const cx = (b[0][0] + b[1][0]) / 2, cy = (b[0][1] + b[1][1]) / 2
        const k = Math.min((padding * W) / dx, (padding * H) / dy)
        const tx = W / 2 - k * cx, ty = H / 2 - k * cy
        rootG.transition().duration(duration).attr('transform', `translate(${tx},${ty}) scale(${k})`)
      } catch (_) { /* ignore */ }
    }

    /* ── Reset view ── */
    function resetView() {
      mapLevel.current = 'country'
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
      selectedDeptCode.current = ''
      selectedMuniCode.current = ''
      setPanel({ tipo: null, nombre: '', codigo: '', fondos: [], cargando: false, error: null })
    }
    // Exponer resetView para el botón React
    ;(cont as HTMLDivElement & { _resetView?: () => void })._resetView = resetView

    /* ── Enter department ── */
    function enterDepartment(node: SVGPathElement, dptoFeat: GeoFeature) {
      const dCode = deptCode(dptoFeat)
      mapLevel.current = 'dept'

      if (activeNode.current) activeNode.current.classList.remove('is-active')
      node.classList.add('is-active')
      activeNode.current = node

      const filtered = dataMunis.current!.features.filter(f => muniDeptCode(f) === dCode)

      munisLayer.selectAll('path').remove()
      munisLayer.selectAll<SVGPathElement, GeoFeature>('path')
        .data(filtered, f => muniCode(f) || muniName(f))
        .enter().append('path')
        .attr('class', 'shape muni-shape')
        .attr('d', path as unknown as string)
        .attr('tabindex', 0)
        .attr('aria-label', f => muniName(f))
        .on('mousemove', (e: MouseEvent, f: GeoFeature) =>
          showTip(`${muniCode(f) ? muniCode(f) + ' — ' : ''}${muniName(f)}`, e))
        .on('mouseleave', hideTip)
        .on('focus', (e: MouseEvent, f: GeoFeature) => showTip(muniName(f), e))
        .on('blur', hideTip)
        .on('click', function (e: MouseEvent, f: GeoFeature) {
          const mCode = muniCode(f)
          const mName = muniName(f)
          munisLayer.selectAll('path').classed('selected-muni', false)
          d3.select(this).classed('selected-muni', true)
          selectedMuniCode.current = mCode
          fetchFondos(mCode, mName, 'municipio', deptName(dptoFeat))
        })

      deptsLayer.style('display', 'none')
      munisLayer.transition().duration(250).attr('opacity', 1)
      setShowBack(true)
      zoomToFeature(dptoFeat, 0.9, 500)

      // Actualizar panel de dept selection text
      selectedDeptCode.current = dCode
      selectedMuniCode.current = ''
    }

    /* ── Draw departments ── */
    function drawDepartments(depts: GeoFC) {
      deptsLayer.selectAll<SVGPathElement, GeoFeature>('path')
        .data(depts.features, d => deptCode(d) || deptName(d))
        .enter().append('path')
        .attr('class', 'shape dept-shape')
        .attr('d', path as unknown as string)
        .attr('tabindex', 0)
        .attr('aria-label', d => deptName(d))
        .on('mousemove', (e: MouseEvent, d: GeoFeature) => showTip(deptName(d), e))
        .on('mouseleave', hideTip)
        .on('focus', (e: MouseEvent, d: GeoFeature) => showTip(deptName(d), e))
        .on('blur', hideTip)
        .on('click', function (e: MouseEvent, d: GeoFeature) {
          enterDepartment(this as SVGPathElement, d)
        })
        .on('keydown', function (e: KeyboardEvent, d: GeoFeature) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            enterDepartment(this as SVGPathElement, d)
          }
        })
    }

    /* ── Load GeoJSON and init ── */
    async function loadMap() {
      try {
        const [gjDepts, gjMunis] = await Promise.all([
          fetch('/col_departamentos.geojson').then(r => {
            if (!r.ok) throw new Error('GeoJSON departamentos: HTTP ' + r.status)
            return r.json() as Promise<GeoFC>
          }),
          fetch('/col_municipios.geojson').then(r => {
            if (!r.ok) throw new Error('GeoJSON municipios: HTTP ' + r.status)
            return r.json() as Promise<GeoFC>
          }),
        ])

        dataDepts.current = gjDepts
        dataMunis.current = gjMunis

        const continental = {
          ...gjDepts,
          features: gjDepts.features.filter(d => deptCode(d) !== '88'),
        }
        const pad = 30
        projection.fitSize([W - pad * 2, H - pad * 2], continental as FeatureCollection)
        const [tx, ty] = projection.translate()
        projection.translate([tx + pad, ty + pad])

        drawDepartments(gjDepts)

        // Poblar listas para dropdowns
        const depts = gjDepts.features
          .map(d => ({ code: deptCode(d), name: deptName(d) }))
          .sort((a, b) => a.name.localeCompare(b.name, 'es'))
        setDeptList(depts)

        const munis = gjMunis.features
          .map(f => ({ code: muniCode(f), name: muniName(f), deptCode: muniDeptCode(f) }))
          .sort((a, b) => a.name.localeCompare(b.name, 'es'))
        setMuniListAll(munis)
        setMuniListFiltered(munis)

      } catch (err) {
        console.error('[ColombiaMap]', err)
        cont.innerHTML = `<p style="color:#ef4444;padding:40px;text-align:center;">Error al cargar el mapa. Verifica los archivos GeoJSON en /public/.</p>`
      }
    }

    loadMap()

    // Escape key
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

  /* ── Filtrar depts en dropdown ─────────────── */
  useEffect(() => {
    // nothing — filtering is done inline in render
  }, [deptSearch])

  /* ── Filtrar munis en dropdown ──────────────── */
  useEffect(() => {
    const term = muniSearch.toLowerCase()
    const filtered = muniListAll.filter(m =>
      (!selectedDeptCode.current || m.deptCode === selectedDeptCode.current) &&
      m.name.toLowerCase().includes(term)
    )
    setMuniListFiltered(filtered)
  }, [muniSearch, muniListAll])

  /* ── Selección desde dropdown de departamento ── */
  const onSelectDept = useCallback((code: string, name: string) => {
    selectedDeptCode.current = code
    selectedMuniCode.current = ''
    setDeptDropOpen(false)

    const munis = muniListAll.filter(m => m.deptCode === code)
    setMuniListFiltered(munis)
    setMuniSearch('')

    // Disparar click en la capa D3
    const cont = svgContainerRef.current
    if (!cont) return
    const depts = dataDepts.current
    if (!depts) return

    const svgEl = cont.querySelector('svg')
    if (!svgEl) return

    // Buscar el path del departamento por código y simular click
    const paths = svgEl.querySelectorAll<SVGPathElement>('.dept-shape')
    paths.forEach(p => {
      const d3data = (p as unknown as { __data__?: GeoFeature }).__data__
      if (d3data && deptCode(d3data) === code) {
        ;(p as SVGPathElement).dispatchEvent(new MouseEvent('click', { bubbles: true }))
      }
    })
  }, [muniListAll])

  /* ── Selección desde dropdown de municipio ── */
  const onSelectMuni = useCallback((code: string, name: string, dCode: string) => {
    selectedMuniCode.current = code
    setMuniDropOpen(false)

    const cont = svgContainerRef.current
    if (!cont) return

    // Si estamos en vista de país, primero entrar al dept
    if (mapLevel.current === 'country') {
      // Seleccionar dept primero
      const paths = cont.querySelectorAll<SVGPathElement>('.dept-shape')
      paths.forEach(p => {
        const d3data = (p as unknown as { __data__?: GeoFeature }).__data__
        if (d3data && deptCode(d3data) === dCode) {
          ;(p as SVGPathElement).dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
      })
      // Luego seleccionar muni después de la transición
      setTimeout(() => {
        highlightMuni(code, name, dCode)
      }, 600)
    } else {
      highlightMuni(code, name, dCode)
    }
  }, [fetchFondos]) // eslint-disable-line react-hooks/exhaustive-deps

  function highlightMuni(code: string, name: string, dCode: string) {
    const cont = svgContainerRef.current
    if (!cont) return
    const muniPaths = cont.querySelectorAll<SVGPathElement>('.muni-shape')
    muniPaths.forEach(p => p.classList.remove('selected-muni'))
    muniPaths.forEach(p => {
      const d3data = (p as unknown as { __data__?: GeoFeature }).__data__
      if (d3data && muniCode(d3data) === code) {
        p.classList.add('selected-muni')
      }
    })
    // Buscar nombre del departamento
    const deptFeat = dataDepts.current?.features.find(d => deptCode(d) === dCode)
    const dName = deptFeat ? deptName(deptFeat) : ''
    fetchFondos(code, name, 'municipio', dName)
  }

  /* ── Volver ── */
  function handleVolver() {
    const cont = svgContainerRef.current
    if (!cont) return
    const resetFn = (cont as HTMLDivElement & { _resetView?: () => void })._resetView
    if (resetFn) resetFn()
    setDeptSearch('')
    setMuniSearch('')
    setMuniListFiltered(muniListAll)
  }

  /* ── Cerrar dropdowns al clickear fuera ── */
  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      if (deptDropRef.current && !deptDropRef.current.contains(e.target as Node)) {
        setDeptDropOpen(false)
      }
      if (muniDropRef.current && !muniDropRef.current.contains(e.target as Node)) {
        setMuniDropOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOut)
    return () => document.removeEventListener('mousedown', onClickOut)
  }, [])

  const filteredDepts = deptList.filter(d => d.name.toLowerCase().includes(deptSearch.toLowerCase()))
  const selectedDeptName = deptList.find(d => d.code === selectedDeptCode.current)?.name ?? ''
  const selectedMuniName = muniListAll.find(m => m.code === selectedMuniCode.current)?.name ?? ''

  /* ── RENDER ── */
  return (
    <div className="col-map-wrapper">
      {/* Tooltip flotante */}
      <div ref={tooltipRef} className="col-map-tooltip" />

      <div className="col-map-layout">
        {/* ═══ COLUMNA IZQUIERDA: MAPA ═══ */}
        <div className="col-map-left">
          <div className="col-map-card">
            <div className="col-map-card-head">
              <div>
                <p className="col-map-meta">Mapa interactivo</p>
                <h2 className="col-map-title">Colombia</h2>
              </div>
              {showBack && (
                <button
                  onClick={handleVolver}
                  className="col-map-back-btn"
                  aria-label="Volver a vista completa"
                >
                  ← Volver
                </button>
              )}
            </div>

            {/* Canvas del mapa */}
            <div ref={svgContainerRef} className="col-map-canvas" />

            {/* Dropdowns */}
            <div className="col-map-selectors">
              {/* Departamento */}
              <div ref={deptDropRef} className={`col-map-dropdown${deptDropOpen ? ' open' : ''}`}>
                <button
                  type="button"
                  className="col-map-dropdown-toggle"
                  aria-haspopup="listbox"
                  aria-expanded={deptDropOpen}
                  onClick={() => { setDeptDropOpen(v => !v); setMuniDropOpen(false) }}
                >
                  <span className={`col-map-dropdown-text${selectedDeptName ? '' : ' placeholder'}`}>
                    {selectedDeptName || 'Departamento'}
                  </span>
                  <span className="col-map-dropdown-arrow">▾</span>
                </button>
                {deptDropOpen && (
                  <div className="col-map-dropdown-menu" role="listbox">
                    <input
                      type="text"
                      className="col-map-dropdown-search"
                      placeholder="Buscar departamento…"
                      value={deptSearch}
                      onChange={e => setDeptSearch(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      autoFocus
                    />
                    <div className="col-map-dropdown-list">
                      {filteredDepts.map(d => (
                        <div
                          key={d.code}
                          role="option"
                          aria-selected={d.code === selectedDeptCode.current}
                          className={`col-map-dropdown-item${d.code === selectedDeptCode.current ? ' selected' : ''}`}
                          onClick={() => onSelectDept(d.code, d.name)}
                        >
                          {d.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Municipio */}
              <div ref={muniDropRef} className={`col-map-dropdown${muniDropOpen ? ' open' : ''}`}>
                <button
                  type="button"
                  className="col-map-dropdown-toggle"
                  aria-haspopup="listbox"
                  aria-expanded={muniDropOpen}
                  onClick={() => { setMuniDropOpen(v => !v); setDeptDropOpen(false) }}
                >
                  <span className={`col-map-dropdown-text${selectedMuniName ? '' : ' placeholder'}`}>
                    {selectedMuniName || 'Municipio'}
                  </span>
                  <span className="col-map-dropdown-arrow">▾</span>
                </button>
                {muniDropOpen && (
                  <div className="col-map-dropdown-menu" role="listbox">
                    <input
                      type="text"
                      className="col-map-dropdown-search"
                      placeholder="Buscar municipio…"
                      value={muniSearch}
                      onChange={e => setMuniSearch(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      autoFocus
                    />
                    <div className="col-map-dropdown-list">
                      {muniListFiltered.slice(0, 200).map(m => (
                        <div
                          key={m.code}
                          role="option"
                          aria-selected={m.code === selectedMuniCode.current}
                          className={`col-map-dropdown-item${m.code === selectedMuniCode.current ? ' selected' : ''}`}
                          onClick={() => onSelectMuni(m.code, m.name, m.deptCode)}
                        >
                          {selectedDeptCode.current ? m.name : `${m.name} (${deptList.find(d => d.code === m.deptCode)?.name ?? m.deptCode})`}
                        </div>
                      ))}
                      {muniListFiltered.length > 200 && (
                        <div className="col-map-dropdown-hint">
                          Filtra por nombre para ver más resultados
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Helper */}
            <div className="col-map-helper">
              <span className="col-map-helper-icon">i</span>
              <span>
                {showBack
                  ? 'Haz clic en un municipio para ver fondos disponibles. Presiona Esc para volver.'
                  : 'Haz clic en un departamento o usa los selectores para explorar el territorio.'}
              </span>
            </div>
          </div>
        </div>

        {/* ═══ COLUMNA DERECHA: PANEL ═══ */}
        <div className="col-map-right">
          <div className="col-map-panel">
            {panel.tipo === null ? (
              <div className="col-map-panel-empty">
                <svg width="48" height="48" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                  <path d="M32 8C20.95 8 12 16.95 12 28c0 14 20 32 20 32s20-18 20-32C52 16.95 43.05 8 32 8z"
                    stroke="#213362" strokeWidth="2" fill="#EEF2FF" />
                  <circle cx="32" cy="28" r="6" stroke="#213362" strokeWidth="2" fill="#FFCD00" />
                </svg>
                <h3>Selecciona un territorio</h3>
                <p>Haz clic en un departamento y luego en un municipio para ver los fondos disponibles.</p>
              </div>
            ) : (
              <>
                <div className="col-map-panel-header">
                  <span className="col-map-panel-badge">
                    {panel.tipo === 'municipio' ? 'Municipio' : 'Departamento'}
                  </span>
                  <h3 className="col-map-panel-name">{panel.nombre}</h3>
                  {panel.departamento && panel.tipo === 'municipio' && (
                    <p className="col-map-panel-dept">{panel.departamento}</p>
                  )}
                  <p className="col-map-panel-code">DIVIPOLA: {panel.codigo}</p>
                </div>

                <div className="col-map-panel-section">
                  <h4 className="col-map-panel-section-title">Fondos disponibles</h4>

                  {panel.cargando && (
                    <div className="col-map-panel-loading">
                      <div className="col-map-spinner" />
                      <span>Consultando fondos…</span>
                    </div>
                  )}

                  {panel.error && !panel.cargando && (
                    <p className="col-map-panel-error">{panel.error}</p>
                  )}

                  {!panel.cargando && !panel.error && panel.fondos.length === 0 && (
                    <p className="col-map-panel-empty-text">No se encontraron fondos específicos para este territorio.</p>
                  )}

                  {!panel.cargando && panel.fondos.length > 0 && (
                    <ul className="col-map-fondos-list">
                      {panel.fondos.map(f => (
                        <li key={f.id} className="col-map-fondo-item">
                          <a href={`/fondo/${f.id}`} className="col-map-fondo-link">
                            <div className="col-map-fondo-top">
                              <span
                                className="col-map-fondo-tipo"
                                style={{ background: colorTipo(f.tipo_fondo_categoria) }}
                              >
                                {f.tipo_fondo_categoria}
                              </span>
                              {f.monto_texto && (
                                <span className="col-map-fondo-monto">{f.monto_texto}</span>
                              )}
                            </div>
                            <p className="col-map-fondo-nombre">{f.nombre}</p>
                            {f.entidad_encargada && (
                              <p className="col-map-fondo-entidad">{f.entidad_encargada}</p>
                            )}
                            {f.tags_visibles?.length > 0 && (
                              <div className="col-map-fondo-tags">
                                {f.tags_visibles.slice(0, 3).map(t => (
                                  <span key={t} className="col-map-fondo-tag">{t}</span>
                                ))}
                              </div>
                            )}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="col-map-panel-actions">
                  <a
                    href={`/buscar?municipio_divipola=${panel.codigo}`}
                    className="col-map-btn-primary"
                  >
                    Buscar fondos en este territorio →
                  </a>
                  <a href="/buscar-avanzado" className="col-map-btn-secondary">
                    Ver catálogo completo
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        /* ── LAYOUT ── */
        .col-map-wrapper {
          width: 100%;
          position: relative;
        }

        .col-map-tooltip {
          position: fixed;
          z-index: 9999;
          pointer-events: none;
          background: rgba(30,41,59,.95);
          color: #f8fafc;
          border: 1px solid rgba(148,163,184,.3);
          padding: 7px 13px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(0,0,0,.2);
          opacity: 0;
          transform: translate(-50%, calc(-100% - 40px));
          transition: opacity .15s, transform .15s;
          backdrop-filter: blur(4px);
        }
        .col-map-tooltip.show {
          opacity: 1;
          transform: translate(-50%, calc(-100% - 38px));
        }

        .col-map-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          max-width: 1100px;
          margin: 0 auto;
          align-items: start;
        }

        @media (max-width: 768px) {
          .col-map-layout {
            grid-template-columns: 1fr;
          }
        }

        /* ── CARD DEL MAPA ── */
        .col-map-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,.08);
          padding: 20px;
        }

        .col-map-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .col-map-meta {
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 2px;
        }

        .col-map-title {
          font-size: 22px;
          font-weight: 800;
          color: #213362;
          letter-spacing: -0.5px;
        }

        .col-map-back-btn {
          background: #fff;
          border: 2px solid #07519D;
          color: #07519D;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all .2s;
        }
        .col-map-back-btn:hover {
          background: #07519D;
          color: #fff;
        }

        /* ── CANVAS SVG ── */
        .col-map-canvas {
          background: #faf8f3;
          border-radius: 12px;
          width: 100%;
          aspect-ratio: 4/5;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          box-shadow: inset 0 2px 8px rgba(0,0,0,.15);
          position: relative;
        }

        /* ── FORMAS D3 ── */
        .col-map-canvas .dept-shape {
          fill: #cfe2f3;
          stroke: #94b8d4;
          stroke-width: 1;
          cursor: pointer;
          outline: none;
          transition: fill .2s, stroke .2s;
        }
        .col-map-canvas .dept-shape:hover,
        .col-map-canvas .dept-shape:focus {
          fill: #90bede;
          stroke: #5a93c0;
          stroke-width: 1.4;
          filter: drop-shadow(0 2px 8px rgba(7,81,157,.3));
        }
        .col-map-canvas .dept-shape.is-active {
          fill: #07519D;
          stroke: #1B4472;
          stroke-width: 1.6;
          filter: drop-shadow(0 3px 10px rgba(7,81,157,.4));
        }
        .col-map-canvas .muni-shape {
          fill: #deeef9;
          stroke: #9dbfd8;
          stroke-width: 0.5;
          cursor: pointer;
          outline: none;
          transition: fill .18s, stroke .18s;
        }
        .col-map-canvas .muni-shape:hover,
        .col-map-canvas .muni-shape:focus {
          fill: #90bede;
          stroke: #5a93c0;
          stroke-width: 1.2;
          filter: drop-shadow(0 2px 6px rgba(7,81,157,.3));
        }
        .col-map-canvas .muni-shape.selected-muni {
          fill: #FFCD00;
          stroke: #213362;
          stroke-width: 1.8;
          filter: drop-shadow(0 3px 10px rgba(255,200,0,.5));
        }

        /* ── DROPDOWNS ── */
        .col-map-selectors {
          margin-top: 16px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 480px) {
          .col-map-selectors { grid-template-columns: 1fr; }
        }

        .col-map-dropdown {
          position: relative;
          z-index: 100;
        }
        .col-map-dropdown.open { z-index: 9000; }

        .col-map-dropdown-toggle {
          width: 100%;
          padding: 10px 14px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          color: #1e293b;
          font-size: 13px;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: border-color .2s;
          min-height: 42px;
          font-family: inherit;
        }
        .col-map-dropdown-toggle:hover,
        .col-map-dropdown.open .col-map-dropdown-toggle {
          border-color: #07519D;
        }
        .col-map-dropdown-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .col-map-dropdown-text.placeholder { color: #94a3b8; font-weight: 400; }
        .col-map-dropdown-arrow {
          flex-shrink: 0;
          margin-left: 6px;
          transition: transform .2s;
          color: #64748b;
          font-size: 11px;
        }
        .col-map-dropdown.open .col-map-dropdown-arrow { transform: rotate(180deg); color: #07519D; }

        .col-map-dropdown-menu {
          position: absolute;
          top: calc(100% - 2px);
          left: 0;
          right: 0;
          background: white;
          border: 2px solid #07519D;
          border-top: none;
          border-radius: 0 0 10px 10px;
          box-shadow: 0 8px 16px rgba(0,0,0,.12);
          z-index: 9001;
          display: flex;
          flex-direction: column;
          max-height: 300px;
          overflow: hidden;
        }
        .col-map-dropdown-search {
          width: 100%;
          padding: 10px 14px;
          border: none;
          border-bottom: 2px solid #e2e8f0;
          font-size: 13px;
          color: #1e293b;
          background: #f8fafc;
          flex-shrink: 0;
          box-sizing: border-box;
          font-family: inherit;
        }
        .col-map-dropdown-search:focus { outline: none; }
        .col-map-dropdown-list {
          overflow-y: auto;
          flex: 1;
          padding: 6px;
        }
        .col-map-dropdown-list::-webkit-scrollbar { width: 6px; }
        .col-map-dropdown-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .col-map-dropdown-item {
          padding: 10px 12px;
          cursor: pointer;
          border-radius: 7px;
          font-size: 13px;
          color: #1e293b;
          transition: background .12s;
          user-select: none;
        }
        .col-map-dropdown-item:hover { background: #e0f2fe; color: #07519D; }
        .col-map-dropdown-item.selected {
          background: #07519D;
          color: white;
          font-weight: 600;
        }
        .col-map-dropdown-hint {
          padding: 8px 12px;
          font-size: 12px;
          color: #94a3b8;
          text-align: center;
          border-top: 1px solid #f1f5f9;
        }

        /* ── HELPER ── */
        .col-map-helper {
          margin-top: 14px;
          padding: 10px 14px;
          background: #f1f5f9;
          border-radius: 8px;
          font-size: 12px;
          color: #64748b;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          line-height: 1.5;
        }
        .col-map-helper-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          min-width: 18px;
          background: #07519D;
          color: white;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 700;
          margin-top: 1px;
        }

        /* ── PANEL DERECHO ── */
        .col-map-right { position: sticky; top: 20px; }

        .col-map-panel {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,.08);
          overflow: hidden;
          min-height: 200px;
        }

        .col-map-panel-empty {
          padding: 48px 32px;
          text-align: center;
          color: #64748b;
        }
        .col-map-panel-empty svg { margin: 0 auto 16px; display: block; }
        .col-map-panel-empty h3 { font-size: 18px; font-weight: 700; color: #213362; margin-bottom: 8px; }
        .col-map-panel-empty p { font-size: 14px; line-height: 1.6; max-width: 280px; margin: 0 auto; }

        .col-map-panel-header {
          padding: 20px 20px 16px;
          background: linear-gradient(135deg, #213362 0%, #07519D 100%);
          color: white;
        }
        .col-map-panel-badge {
          display: inline-block;
          background: rgba(255,255,255,.2);
          border: 1px solid rgba(255,255,255,.3);
          border-radius: 20px;
          padding: 3px 10px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .col-map-panel-name {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }
        .col-map-panel-dept {
          font-size: 14px;
          opacity: .75;
          margin-bottom: 2px;
        }
        .col-map-panel-code {
          font-size: 12px;
          opacity: .55;
          font-family: monospace;
        }

        .col-map-panel-section {
          padding: 16px 20px;
          min-height: 120px;
        }
        .col-map-panel-section-title {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          margin-bottom: 12px;
        }

        .col-map-panel-loading {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #64748b;
          font-size: 14px;
          padding: 16px 0;
        }
        .col-map-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid #e2e8f0;
          border-top-color: #07519D;
          border-radius: 50%;
          animation: spin .7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .col-map-panel-error {
          font-size: 13px;
          color: #ef4444;
          background: #fef2f2;
          padding: 12px;
          border-radius: 8px;
        }
        .col-map-panel-empty-text {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
        }

        /* ── LISTA DE FONDOS ── */
        .col-map-fondos-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .col-map-fondo-item { }
        .col-map-fondo-link {
          display: block;
          padding: 12px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          text-decoration: none;
          color: inherit;
          transition: border-color .2s, box-shadow .2s;
        }
        .col-map-fondo-link:hover {
          border-color: #07519D;
          box-shadow: 0 2px 10px rgba(7,81,157,.1);
        }
        .col-map-fondo-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 6px;
        }
        .col-map-fondo-tipo {
          color: white;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 3px 8px;
          border-radius: 20px;
        }
        .col-map-fondo-monto {
          font-size: 11px;
          color: #64748b;
          text-align: right;
        }
        .col-map-fondo-nombre {
          font-size: 14px;
          font-weight: 700;
          color: #213362;
          line-height: 1.3;
          margin-bottom: 4px;
        }
        .col-map-fondo-entidad {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 6px;
        }
        .col-map-fondo-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .col-map-fondo-tag {
          font-size: 11px;
          background: #f1f5f9;
          color: #475569;
          border-radius: 5px;
          padding: 2px 7px;
        }

        /* ── ACCIONES DEL PANEL ── */
        .col-map-panel-actions {
          padding: 0 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .col-map-btn-primary {
          display: block;
          background: #213362;
          color: #fff;
          text-align: center;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          transition: background .2s;
        }
        .col-map-btn-primary:hover { background: #07519D; }
        .col-map-btn-secondary {
          display: block;
          background: #f8fafc;
          color: #213362;
          text-align: center;
          padding: 11px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          border: 1px solid #e2e8f0;
          transition: border-color .2s;
        }
        .col-map-btn-secondary:hover { border-color: #213362; }
      `}</style>
    </div>
  )
}
