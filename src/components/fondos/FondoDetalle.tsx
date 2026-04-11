'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { formatUSD, formatCOP } from '@/lib/utils'
import type { FondoConRelaciones, FondoInstructivo } from '@/types/database'
import Image from 'next/image'
import { UNGRDLoader } from '@/components/ui/UNGRDLoader'
import { useLoader } from '@/hooks/useLoader'
import { descargarPDF, descargarPasoPDF } from '@/lib/pdf'

/** Mapeo inline: fondos con ficha PDF estática precargada, indexados por fondo.id */
const FICHAS_PDF_POR_ID: Record<string, string> = {
  F17: '/fichas-fondos/adaptation-fund.pdf',
  F20: '/fichas-fondos/green-climate-fund.pdf',
  F21: '/fichas-fondos/sccf.pdf',
  F24: '/fichas-fondos/gfdrr.pdf',
  F25: '/fichas-fondos/eco-business-fund.pdf',
  F26: '/fichas-fondos/global-innovation-fund.pdf',
  F28: '/fichas-fondos/bid-lab.pdf',
  F29: '/fichas-fondos/iki.pdf',
  F31: '/fichas-fondos/fontagro.pdf',
}

/** Nombre legible para la descarga del PDF, indexado por fondo.id */
const NOMBRES_DESCARGA_PDF: Record<string, string> = {
  F17: 'Ficha Fondo de Financiamiento_Adaptation Fund.pdf',
  F20: 'Ficha Fondo de Financiamiento_Green Climate Fund.pdf',
  F21: 'Ficha Fondo de Financiamiento_Special Climate Change Fund.pdf',
  F24: 'Ficha Fondo de Financiamiento_Global Facility for Disaster Reduction and Recovery.pdf',
  F25: 'Ficha Fondo de Financiamiento_eco.business Fund.pdf',
  F26: 'Ficha Fondo de Financiamiento_Global Innovation Fund.pdf',
  F28: 'Ficha Fondo de Financiamiento_BID Lab.pdf',
  F29: 'Ficha Fondo de Financiamiento_IKI.pdf',
  F31: 'Ficha Fondo de Financiamiento_Fontagro.pdf',
}

async function descargarFichaEstatica(path: string, nombre: string) {
  const res = await fetch(path)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

interface Props {
  fondo: FondoConRelaciones
}

const ICONOS: Record<string, JSX.Element> = {
  objetivo: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
    </svg>
  ),
  dirigido: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="8" cy="8" r="3" />
      <circle cx="16" cy="8" r="3" />
      <path d="M2 20c0-3.3 2.7-6 6-6h0c3.3 0 6 2.7 6 6" />
      <path d="M10 14c2.8 0 5 2.2 5 5" />
    </svg>
  ),
  actividades: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 5h14v4H5zM5 11h10v4H5zM5 17h6v4H5z" />
    </svg>
  ),
  requisitos: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 4 7v6c0 5 3 7 8 8 5-1 8-3 8-8V7l-8-4Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  acceso: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  ),
  instrumentos: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="6" rx="1" />
      <rect x="3" y="11" width="18" height="10" rx="1" />
      <path d="M8 15h8" />
    </svg>
  ),
  normatividad: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 21h8" />
      <path d="M12 17V3" />
      <path d="M6 9h12" />
      <path d="M6 13h12" />
    </svg>
  ),
}

// Secciones del acordeón — mapeadas a campos reales del fondo
const SECCIONES = [
  { id: 'objetivo',     titulo: '¿Cuál es el objetivo?',        campo: 'objetivos_fondo',          iconKey: 'objetivo' },
  { id: 'dirigido',     titulo: '¿A quién va dirigido?',        campo: 'publico_objetivo',         iconKey: 'dirigido' },
  { id: 'actividades',  titulo: '¿Qué actividades financia?',   campo: 'actividades_apoyadas',     iconKey: 'actividades' },
  { id: 'requisitos',   titulo: '¿Cuáles son los requisitos?',  campo: 'condiciones_elegibilidad', iconKey: 'requisitos' },
  { id: 'acceso',       titulo: '¿Cómo accedo?',                campo: 'como_acceder',             iconKey: 'acceso' },
  { id: 'instrumentos', titulo: 'Instrumentos de financiación', campo: 'instrumentos',             iconKey: 'instrumentos' },
  { id: 'normatividad', titulo: 'Normatividad',                 campo: 'normatividad',             iconKey: 'normatividad' },
]

// ── Helpers para el encabezado ───────────────────────────────────────────────

/** Construye una frase funcional corta (máx ~2 líneas) que responde «¿para qué sirve?» */
function buildFundHeaderSummary(fondo: FondoConRelaciones): string | null {
  const extractFirst = (text: string | null, max = 160): string | null => {
    if (!text) return null
    // Quitar numeración de listas y saltos para tomar la primera idea
    const clean = text.replace(/^\d+\.\s*/gm, '').trim()
    const first = clean.split(/[.\n]/)[0]?.trim()
    if (!first || first.length < 15) return null
    return first.length > max ? first.slice(0, max).replace(/\s\S*$/, '…') : first
  }
  // Preferir objetivos_fondo, luego actividades_apoyadas
  return extractFirst(fondo.objetivos_fondo) ?? extractFirst(fondo.actividades_apoyadas)
}

/** Formatea el monto disponible en una cadena corta limpia */
function formatFundAmount(fondo: FondoConRelaciones): string | null {
  if (fondo.monto_min_usd && fondo.monto_max_usd) {
    const f = (n: number) => `USD ${(n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1_000 ? (n / 1_000).toFixed(0) + 'K' : n.toFixed(0))}`
    return `${f(fondo.monto_min_usd)} – ${f(fondo.monto_max_usd)}`
  }
  if (fondo.monto_min_usd) {
    const n = fondo.monto_min_usd
    return `Desde USD ${n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1_000 ? (n / 1_000).toFixed(0) + 'K' : n.toFixed(0)}`
  }
  if (fondo.monto_texto) {
    const noData = /no aparece|no se detalla|n\/a|sin información/i.test(fondo.monto_texto)
    if (!noData) {
      const short = fondo.monto_texto.split('.')[0]?.trim()
      if (short && short.length < 70) return short
    }
  }
  return null
}

/** Devuelve true solo si el valor de creación es util (no vacío/placeholder) */
function creacionValida(val: string | null | undefined): val is string {
  if (!val || val.trim() === '') return false
  return !/no se detalla|n\/a|sin información|no disponible/i.test(val)
}

export function FondoDetalle({ fondo }: Props) {
  // Primera sección abierta por defecto
  const [abierta, setAbierta] = useState<string>('objetivo')
  const { estado: loader, mostrar: mostrarLoader, ocultar: ocultarLoader } = useLoader()

  // Instructivo paso a paso
  const [instructivo, setInstructivo] = useState<FondoInstructivo | null>(null)
  const [instructivoLoaded, setInstructivoLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/fondos/${fondo.id}/instructivo`)
      .then(r => {
        if (r.ok) return r.json() as Promise<FondoInstructivo>
        return null
      })
      .then(data => {
        setInstructivo(data)
        setInstructivoLoaded(true)
      })
      .catch(() => setInstructivoLoaded(true))
  }, [fondo.id])

  const toggleSeccion = (id: string) => {
    setAbierta(prev => prev === id ? '' : id)
  }

  const colorTipo = fondo.tipo_fondo_categoria === 'Nacional'
    ? { bg: '#1B4472', text: '#fff' }
    : fondo.tipo_fondo_categoria === 'Territorial'
    ? { bg: '#07519D', text: '#fff' }
    : { bg: '#213362', text: '#FFCD00' }

  const bgDetalle =
    fondo.tipo_fondo_categoria === 'Nacional'
      ? 'linear-gradient(135deg, #f9fbff 0%, #e7eefc 100%)'
      : fondo.tipo_fondo_categoria === 'Territorial'
      ? 'linear-gradient(135deg, #f6fbff 0%, #e3f1ff 100%)'
      : 'linear-gradient(135deg, #f9f7ff 0%, #ebe6ff 100%)'

  return (
    <div style={{ background: '#f6fafe', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* Franja tricolor arriba */}
      <div style={{ display: 'flex', height: '4px', width: '100%' }}>
        <div style={{ flex: '0 0 50%', background: '#ffc800' }} />
        <div style={{ flex: '0 0 25%', background: '#223a7a' }} />
        <div style={{ flex: '0 0 25%', background: '#d80e25' }} />
      </div>

      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '28px 20px 0' }}>

        {/* Breadcrumb simple */}
        <div style={{ marginBottom: '18px' }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: '#213362', fontWeight: 700, fontSize: '14px',
            textDecoration: 'none',
          }}>
            ← Volver al inicio
          </Link>
        </div>

        {/* Header del fondo — refinado */}
        <div style={{
          background: bgDetalle,
          borderRadius: '18px',
          padding: '28px 32px 24px',
          marginBottom: '20px',
          border: '1px solid rgba(7,29,76,0.06)',
          boxShadow: '0 18px 40px -22px rgba(7,29,76,0.35)',
        }}>

          {/* A ─ Zona superior: tipo · ID · Fondo Activo · estado convocatoria */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span style={{
              background: colorTipo.bg, color: colorTipo.text,
              fontSize: '10px', fontWeight: 700,
              padding: '3px 12px', borderRadius: '20px',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {fondo.tipo_fondo_categoria}
            </span>
            <span style={{ color: '#c0c8d8', fontSize: '13px', lineHeight: 1 }}>·</span>
            <span style={{ color: '#8a94a6', fontSize: '11px', fontWeight: 600, letterSpacing: '0.3px' }}>
              {fondo.id}
            </span>
            <span style={{ color: '#c0c8d8', fontSize: '13px', lineHeight: 1 }}>·</span>
            <span style={{
              fontSize: '10px', fontWeight: 700, color: '#213362',
              letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>
              Fondo Activo
            </span>
            {instructivoLoaded && instructivo?.estado_convocatoria && (() => {
              const est = instructivo.estado_convocatoria
              const isAb = est.toUpperCase().includes('ABIERT')
              const isCe = est.toUpperCase().includes('CERRAD')
              if (!isAb && !isCe) return null
              return (
                <span style={{
                  background: isAb ? '#dcfce7' : '#fee2e2',
                  color: isAb ? '#15803d' : '#dc2626',
                  fontSize: '10px', fontWeight: 700,
                  padding: '3px 10px', borderRadius: '20px',
                  letterSpacing: '0.3px',
                }}>
                  Convocatoria {isAb ? 'ABIERTA' : 'CERRADA'}
                </span>
              )
            })()}
          </div>

          {/* B ─ Nombre */}
          <h1 style={{
            fontSize: '32px', fontWeight: 900, color: '#071d4c',
            lineHeight: 1.15, letterSpacing: '-1px', margin: '0 0 10px 0',
          }}>
            {fondo.nombre}
          </h1>

          {/* C ─ Meta: entidad · creación · vigencia */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 18px', marginBottom: '14px' }}>
            {fondo.entidad_encargada && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6C7175', fontSize: '13px', fontWeight: 500 }}>
                <Image src="/icons/entidad.png" alt="" width={14} height={14} style={{ width: 14, height: 14, objectFit: 'contain', opacity: 0.6 }} />
                {fondo.entidad_encargada}
              </span>
            )}
            {creacionValida(fondo.creacion) && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#8a94a6', fontSize: '12px', fontWeight: 500 }}>
                <Image src="/icons/calendario.png" alt="" width={13} height={13} style={{ width: 13, height: 13, objectFit: 'contain', opacity: 0.5 }} />
                Creado en {fondo.creacion}
              </span>
            )}
            {fondo.vigencia && !/no se detalla/i.test(fondo.vigencia) && (
              <span style={{
                fontSize: '11px', fontWeight: 600, color: '#4a5568',
                background: 'rgba(7,29,76,0.05)', padding: '2px 10px',
                borderRadius: '12px', letterSpacing: '0.2px',
              }}>
                {fondo.vigencia}
              </span>
            )}
          </div>

          {/* D ─ Frase funcional corta */}
          {(() => {
            const resumen = buildFundHeaderSummary(fondo)
            if (!resumen) return null
            return (
              <p style={{
                fontSize: '14px', color: '#454f6b',
                lineHeight: 1.65, margin: '0 0 18px 0',
                maxWidth: '700px',
              }}>
                {resumen}
              </p>
            )
          })()}

          {/* E ─ Franja rápida de información */}
          {(() => {
            const items: { label: string; value: string; accent?: string }[] = []
            const monto = formatFundAmount(fondo)
            if (monto) items.push({ label: 'Monto', value: monto })
            if (fondo.vigencia && !/no se detalla/i.test(fondo.vigencia))
              items.push({ label: 'Vigencia', value: fondo.vigencia })
            if (instructivoLoaded && instructivo?.ciclo_convocatoria) {
              const short = instructivo.ciclo_convocatoria.split(/[.\n]/)[0]?.trim()
              if (short && short.length < 80) items.push({ label: 'Ciclo', value: short })
            }
            if (instructivoLoaded && instructivo?.estado_convocatoria) {
              const est = instructivo.estado_convocatoria
              const isAb = est.toUpperCase().includes('ABIERT')
              const isCe = est.toUpperCase().includes('CERRAD')
              if (isAb || isCe)
                items.push({ label: 'Convocatoria', value: isAb ? '● Abierta' : '● Cerrada', accent: isAb ? '#15803d' : '#dc2626' })
            }
            if (items.length === 0) return null
            return (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '8px',
                borderTop: '1px solid rgba(7,29,76,0.07)',
                paddingTop: '16px', marginBottom: '20px',
              }}>
                {items.map((item, i) => (
                  <div key={i} style={{
                    background: 'rgba(7,29,76,0.04)', borderRadius: '10px',
                    padding: '8px 16px', minWidth: '80px',
                  }}>
                    <div style={{
                      fontSize: '9px', color: '#a0a8b8',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      marginBottom: '3px', fontWeight: 700,
                    }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: item.accent ?? '#213362' }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* F ─ Tags: procesos, beneficiarios (sin cambios) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {fondo.procesos?.map(p => (
              <span key={p.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: '#213362', color: '#FFCD00',
                fontSize: '11px', fontWeight: 800,
                padding: '5px 12px', borderRadius: '18px',
                textTransform: 'uppercase', letterSpacing: '0.4px',
                boxShadow: '0 8px 18px -12px rgba(7,29,76,0.55)',
                border: '1px solid rgba(255,205,0,0.35)',
              }}>
                {p.nombre}
              </span>
            ))}
            {fondo.beneficiarios?.map(b => (
              <span key={b.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: '#F4F6FA', color: '#6C7175',
                fontSize: '11px', fontWeight: 700,
                padding: '4px 12px', borderRadius: '20px',
                textTransform: 'uppercase', letterSpacing: '0.3px',
              }}>
                {b.nombre}
              </span>
            ))}
          </div>
        </div>

        {/* Acordeón de secciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {SECCIONES.map(seccion => {
            const contenido = (fondo as any)[seccion.campo]
            if (!contenido) return null  // No mostrar secciones vacías
            const estaAbierta = abierta === seccion.id

            return (
              <div key={seccion.id} id={seccion.id} style={{
                background: '#fff',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(7,29,76,0.08)',
                transition: 'box-shadow 0.15s',
                boxShadow: estaAbierta ? '0 4px 16px rgba(7,29,76,0.08)' : 'none',
              }}>
                <button
                  onClick={() => toggleSeccion(seccion.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '20px 24px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    fontSize: '16px', fontWeight: 700, color: '#071d4c',
                    display: 'flex', alignItems: 'center', gap: '10px',
                  }}>
                    <span style={{ fontSize: '14px', opacity: 0.6, display: 'inline-flex' }}>
                      {ICONOS[seccion.iconKey]}
                    </span>
                    {seccion.titulo}
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    borderRadius: '8px',
                    background: estaAbierta ? 'rgba(7,29,76,0.08)' : 'rgba(7,29,76,0.04)',
                    transition: 'transform 0.2s, background 0.2s',
                    transform: estaAbierta ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#213362"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </button>

                {estaAbierta && (
                  <div style={{
                    padding: '0 24px 24px',
                    color: '#555', fontSize: '14px', lineHeight: 1.75,
                    whiteSpace: 'pre-line',  // respeta saltos de línea del texto
                  }}>
                    {contenido}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Panel especial de Monto — solo si hay datos */}
        {(fondo.monto_texto || fondo.monto_min_usd || fondo.monto_max_usd) && (
          <div style={{
            background: '#213362',
            borderRadius: '16px',
            padding: '28px 32px',
            marginBottom: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
          }}>
            <div>
              <p style={{
                color: 'rgba(255,255,255,0.45)', fontSize: '10px',
                fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '1.5px', marginBottom: '8px',
              }}>
                Monto disponible
              </p>
              {fondo.monto_min_usd && fondo.monto_max_usd ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 900, color: '#fff', letterSpacing: '-1px', lineHeight: 1 }}>
                    {formatUSD(fondo.monto_min_usd)} – {formatUSD(fondo.monto_max_usd)}
                  </span>
                  <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>USD</span>
                </div>
              ) : (
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#fff', maxWidth: '100%', lineHeight: 1.5 }}>
                  {fondo.monto_texto ?? 'Información de monto no disponible.'}
                </p>
              )}
            </div>

            {fondo.monto_min_usd && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginBottom: '4px' }}>
                  Equivalente aprox.
                </p>
                <p style={{ color: '#FFCD00', fontSize: '18px', fontWeight: 900 }}>
                  {formatCOP(fondo.monto_min_usd)} – {formatCOP(fondo.monto_max_usd ?? fondo.monto_min_usd)} COP
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer — enlace y botón PDF */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '24px 32px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          border: '1px solid rgba(7,29,76,0.08)',
        }}>
          <div>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '6px' }}>
              Para más información oficial, visita el sitio de la entidad:
            </p>
            {fondo.pagina_web ? (
              <a href={fondo.pagina_web} target="_blank" rel="noopener noreferrer"
                style={{ color: '#213362', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {fondo.pagina_web.replace('https://', '').replace('http://', '')}
                <span style={{ fontSize: '12px' }}>↗</span>
              </a>
            ) : (
              <p style={{ color: '#aaa', fontSize: '13px' }}>Sitio web no disponible</p>
            )}
          </div>

          <button
            onClick={async () => {
              mostrarLoader('reporte')
              try {
                await descargarPDF(fondo, null, instructivo)
              } catch (e) {
                console.error('Error generando PDF', e)
              } finally {
                ocultarLoader()
              }
            }}
            style={{
              background: '#FFCD00', color: '#071d4c',
              padding: '14px 28px', borderRadius: '12px',
              fontWeight: 900, fontSize: '14px', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
            }}>
            ⇩ Descargar reporte PDF
          </button>

          {/* Botón paso a paso */}
          {(() => {
            const fichaEstatica = FICHAS_PDF_POR_ID[fondo.id] ?? null
            // eslint-disable-next-line no-console
            console.log('[PasoAPaso] fondo.id=', fondo.id, '| fichaEstatica=', fichaEstatica)
            const tieneContenido = fichaEstatica || (instructivoLoaded && !!instructivo)
            const cargando = !fichaEstatica && !instructivoLoaded

            const handleClick = async () => {
              if (fichaEstatica) {
                const nombreArchivo = NOMBRES_DESCARGA_PDF[fondo.id] ?? fichaEstatica.split('/').pop() ?? 'ficha.pdf'
                mostrarLoader('ficha paso a paso')
                try {
                  await descargarFichaEstatica(fichaEstatica, nombreArchivo)
                } catch (e) {
                  console.error('Error descargando ficha estática', e)
                } finally {
                  ocultarLoader()
                }
                return
              }
              if (!instructivo) return
              mostrarLoader('paso a paso')
              try {
                await descargarPasoPDF(fondo, instructivo)
              } catch (e) {
                console.error('Error generando PDF paso a paso', e)
              } finally {
                ocultarLoader()
              }
            }

            return (
              <button
                disabled={!tieneContenido || cargando}
                onClick={handleClick}
                title={
                  cargando
                    ? 'Cargando...'
                    : !tieneContenido
                    ? 'Este fondo no tiene un paso a paso definido'
                    : 'Descargar guía paso a paso'
                }
                style={{
                  background: tieneContenido ? '#213362' : '#e5e7eb',
                  color: tieneContenido ? '#FFCD00' : '#9ca3af',
                  padding: '14px 28px', borderRadius: '12px',
                  fontWeight: 900, fontSize: '14px',
                  border: tieneContenido ? 'none' : '1px solid #d1d5db',
                  cursor: tieneContenido ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                  opacity: !tieneContenido && !cargando ? 0.6 : 1,
                }}>
                {cargando ? '⌛ Paso a Paso' : tieneContenido ? '⇩ Paso a Paso' : '✕ Paso a Paso'}
              </button>
            )
          })()}
        </div>

      </div>
      <UNGRDLoader
        visible={loader.visible}
        contexto={loader.contexto}
        subTexto={loader.subTexto}
      />
    </div>
  )
}

