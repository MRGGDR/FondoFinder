'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HeroBuscador } from '@/components/busqueda/HeroBuscador'
import {
  buscarFondosNg,
  getNgActividades,
  getNgActores,
  getNgCategorias,
  getNgModeloInfoBatch,
  getNgResumenFlags,
  getNgTiposFondo,
  getNgVigencias,
  getObjetivosPngrd,
  getProcesosGrd,
} from '@/services/ngBuscador'
import type {
  NgActividad,
  NgActor,
  NgBusquedaFilters,
  NgCategoria,
  NgObjetivoPngrd,
  NgProcesoGrd,
  NgResultadoBusqueda,
  NgResumenFlags,
  NgTipoFondo,
  NgVigenciaResumen,
  NgWizardState,
} from '@/types/ng-buscador'

type Paso = 1 | 2 | 3 | 4 | 5 | 6 | 7

const INITIAL_STATE: NgWizardState = {
  actorId: null,
  tipoFondoId: null,
  procesoIds: [],
  objetivoIds: [],
  categoriaId: null,
  actividadIds: [],
  entidadesSeleccionadas: [],
  vigenciasSeleccionadas: [],
}

const EMPTY_FLAGS: NgResumenFlags = {
  fondos_total: 0,
  fondos_con_instructivo: 0,
  fondos_sin_instructivo: 0,
  fondos_con_modelo_aplicacion: 0,
  fondos_sin_modelo_aplicacion: 0,
  fondos_con_monto_numerico: 0,
  fondos_sin_monto_numerico: 0,
}

function toggleIds(ids: number[], id: number): number[] {
  return ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id]
}

function toggleText(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter(item => item !== value) : [...values, value]
}

function buildFilters(state: NgWizardState): NgBusquedaFilters {
  return {
    actorId: state.actorId,
    tipoFondoId: state.tipoFondoId,
    procesoIds: state.procesoIds,
    objetivoIds: state.objetivoIds,
    categoriaId: state.categoriaId,
    actividadIds: state.actividadIds,
    limite: 200,
  }
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function WizardIcon({ type, className = 'w-6 h-6' }: { type: string; className?: string }) {
  const s: React.SVGProps<SVGSVGElement> = {
    viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round',
    className, 'aria-hidden': true,
  }
  switch (type) {
    // Actors
    case 'building':    return <svg {...s}><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-5h6v5"/><path d="M9 10h.01M15 10h.01M9 14h.01M15 14h.01"/></svg>
    case 'briefcase':   return <svg {...s}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><path d="M2 12a20 20 0 0020 0"/></svg>
    case 'flag':        return <svg {...s}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
    case 'users':       return <svg {...s}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
    case 'academic':    return <svg {...s}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
    // Tipos de fondo
    case 'coins':       return <svg {...s}><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1110.34 18"/><path d="M7 6h1v4"/><path d="M16.71 13.88l.7.71-2.82 2.82"/></svg>
    case 'credit-card': return <svg {...s}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
    case 'globe':       return <svg {...s}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z"/></svg>
    case 'megaphone':   return <svg {...s}><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
    case 'lightbulb':   return <svg {...s}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 006 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/></svg>
    case 'leaf':        return <svg {...s}><path d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
    case 'bank':        return <svg {...s}><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>
    // Procesos GRD
    case 'search':      return <svg {...s}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    case 'shield-off':  return <svg {...s}><path d="M19.69 14a6.9 6.9 0 00.31-2V5l-8-3-3.16 1.18"/><path d="M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 005.62-4.38"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    case 'shield':      return <svg {...s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    case 'alert-triangle': return <svg {...s}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    case 'refresh-cw':  return <svg {...s}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
    case 'home':        return <svg {...s}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    // Objetivos PNGRD / Categorías comunes
    case 'target':      return <svg {...s}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
    case 'zap':         return <svg {...s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    case 'cloud-rain':  return <svg {...s}><line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25"/></svg>
    case 'tree':        return <svg {...s}><path d="M12 22v-5"/><path d="M6 17l6-7 6 7"/><path d="M4 13l8-11 8 11"/></svg>
    case 'map-pin':     return <svg {...s}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
    case 'heart':       return <svg {...s}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
    case 'cpu':         return <svg {...s}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
    case 'droplets':    return <svg {...s}><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0014 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 01-11.91 4.97"/></svg>
    case 'layers':      return <svg {...s}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
    case 'trending-up': return <svg {...s}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
    case 'tool':        return <svg {...s}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
    case 'file-text':   return <svg {...s}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
    case 'activity':    return <svg {...s}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    case 'tag':         return <svg {...s}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
    default:            return <svg {...s}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
  }
}

// ── Icon mapping by keyword ────────────────────────────────────────────────────
function n(text: string) { return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() }

function getActorIcon(name: string): string {
  const t = n(name)
  if (t.includes('alcaldia') || t.includes('municipio') || t.includes('gobernacion')) return 'building'
  if (t.includes('empresa') || t.includes('financiera') || t.includes('cooperativa')) return 'briefcase'
  if (t.includes('ministerio') || t.includes('nacional')) return 'flag'
  if (t.includes('ong') || t.includes('fundacion') || t.includes('comunitaria')) return 'users'
  if (t.includes('universidad') || t.includes('investigacion')) return 'academic'
  return 'building'
}

function getTipoIcon(name: string): string {
  const t = n(name)
  if (t.includes('internacional') || t.includes('cooperacion')) return 'globe'
  if (t.includes('nacional')) return 'flag'
  if (t.includes('territorial') || t.includes('regional') || t.includes('local') || t.includes('municipal')) return 'map-pin'
  if (t.includes('credito') || t.includes('banca') || t.includes('prestamo')) return 'credit-card'
  if (t.includes('regalia')) return 'coins'
  if (t.includes('convocatoria') || t.includes('concurso')) return 'megaphone'
  if (t.includes('innovacion') || t.includes('investigacion')) return 'lightbulb'
  if (t.includes('ambiental') || t.includes('biodiversidad') || t.includes('forestal')) return 'leaf'
  if (t.includes('fondo') && t.includes('publico')) return 'bank'
  if (t.includes('transferencia') || t.includes('presupuesto')) return 'trending-up'
  return 'coins'
}

function getProcesoIcon(name: string): string {
  const t = n(name)
  if (t.includes('conocimiento')) return 'search'
  if (t.includes('reduccion') || t.includes('prevencion')) return 'shield'
  if (t.includes('respuesta') || t.includes('atencion')) return 'alert-triangle'
  if (t.includes('recuperacion') || t.includes('rehabilitacion')) return 'refresh-cw'
  if (t.includes('manejo')) return 'zap'
  return 'shield'
}

function getObjetivoIcon(name: string): string {
  const t = n(name)
  if (t.includes('conocimiento') || t.includes('informacion')) return 'search'
  if (t.includes('reduccion') || t.includes('reducir')) return 'shield'
  if (t.includes('respuesta') || t.includes('atencion') || t.includes('manejo')) return 'alert-triangle'
  if (t.includes('recuperacion') || t.includes('rehabilitacion')) return 'refresh-cw'
  if (t.includes('gobernanza') || t.includes('gestion') || t.includes('politica')) return 'flag'
  if (t.includes('financiero') || t.includes('inversión') || t.includes('inversion')) return 'coins'
  if (t.includes('comunicacion') || t.includes('participacion')) return 'users'
  if (t.includes('fortalecimiento') || t.includes('capacidad')) return 'cpu'
  if (t.includes('ambiental') || t.includes('ecosistema')) return 'leaf'
  if (t.includes('agua') || t.includes('hidrico')) return 'droplets'
  return 'target'
}

function getCategoriaIcon(name: string): string {
  const t = n(name)
  if (t.includes('agua') || t.includes('hidrico') || t.includes('cuenca')) return 'droplets'
  if (t.includes('ecosistema') || t.includes('naturaleza') || t.includes('biodiversidad') || t.includes('soluciones basadas')) return 'leaf'
  if (t.includes('bosque') || t.includes('forestal')) return 'tree'
  if (t.includes('clima') || t.includes('adaptacion') || t.includes('mitigacion')) return 'cloud-rain'
  if (t.includes('infraestructura') || t.includes('obra')) return 'tool'
  if (t.includes('agricultura') || t.includes('agropecuario')) return 'leaf'
  if (t.includes('estudio') || t.includes('monitoreo') || t.includes('alerta') || t.includes('alertas')) return 'activity'
  if (t.includes('innovacion') || t.includes('tecnologia') || t.includes('investigacion')) return 'lightbulb'
  if (t.includes('gobernanza') || t.includes('institucional') || t.includes('fortalecimiento')) return 'flag'
  if (t.includes('comunidad') || t.includes('comunidades') || t.includes('comunitario') || t.includes('humanitario')) return 'users'
  if (t.includes('social')) return 'heart'
  if (t.includes('cooperacion') || t.includes('internacional')) return 'globe'
  if (t.includes('territorial') || t.includes('municipal') || t.includes('regional')) return 'map-pin'
  if (t.includes('financiero') || t.includes('credito') || t.includes('inversion')) return 'coins'
  if (t.includes('conocimiento') || t.includes('educacion') || t.includes('formacion')) return 'academic'
  if (t.includes('riesgo') || t.includes('desastre')) return 'shield'
  if (t.includes('energia') || t.includes('electrico')) return 'zap'
  if (t.includes('residuos') || t.includes('saneamiento')) return 'layers'
  return 'tag'
}

function getActividadIcon(name: string): string {
  const t = n(name)
  if (t.includes('estudio') || t.includes('investigacion') || t.includes('analisis')) return 'search'
  if (t.includes('plan') || t.includes('programa') || t.includes('formulacion')) return 'file-text'
  if (t.includes('obra') || t.includes('construccion') || t.includes('infraestructura')) return 'tool'
  if (t.includes('capacitacion') || t.includes('formacion') || t.includes('educa')) return 'academic'
  if (t.includes('monitoreo') || t.includes('seguimiento') || t.includes('evaluacion')) return 'activity'
  if (t.includes('agua') || t.includes('hidrico')) return 'droplets'
  if (t.includes('bosque') || t.includes('restauracion') || t.includes('ambiental')) return 'tree'
  if (t.includes('comunidad') || t.includes('social') || t.includes('participacion')) return 'users'
  if (t.includes('tecnologia') || t.includes('innovacion') || t.includes('sistema')) return 'cpu'
  if (t.includes('financiero') || t.includes('credito')) return 'coins'
  return 'activity'
}

// ── Result cards (legacy visual style, V5 data) ───────────────────────────────
function ResultadosNg({
  resultados,
  cargando,
  error,
  onRetry,
}: {
  resultados: NgResultadoBusqueda[]
  cargando: boolean
  error: string | null
  onRetry?: () => void
}) {
  if (cargando) {
    return (
      <div className="space-y-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-white rounded-3xl p-8 md:p-12 border-l-[10px] border-l-gray-200 shadow-[0_12px_40px_-28px_rgba(33,51,98,0.18)]">
            <div className="grid md:grid-cols-12 gap-8 md:gap-16 items-start">
              <div className="hidden md:flex md:col-span-1 flex-col items-center pt-2">
                <div className="w-12 h-12 bg-gray-100 rounded-lg" />
              </div>
              <div className="md:col-span-7 space-y-4">
                <div className="flex gap-3">
                  <div className="h-6 w-24 bg-gray-100 rounded-full" />
                  <div className="h-6 w-16 bg-gray-100 rounded-full" />
                </div>
                <div className="h-10 bg-gray-100 rounded-xl w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-full" />
              </div>
              <div className="md:col-span-4 bg-gray-100 rounded-[2rem] min-h-[200px]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-12 text-center">
        <p className="text-xl font-black text-red-700 mb-3">No pudimos completar la búsqueda.</p>
        <p className="text-sm text-red-600 mb-8">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-[#213362] text-white font-black px-10 py-4 rounded-2xl hover:bg-[#07519D] transition-colors"
          >
            Reintentar
          </button>
        )}
      </div>
    )
  }

  if (!resultados.length) {
    return (
      <div className="py-32 text-center">
        <p className="text-6xl font-black text-gray-100 mb-4">0</p>
        <p className="text-xl font-black text-[#213362] mb-2">Sin resultados</p>
        <p className="text-gray-400 mb-8">No encontramos fondos con estos criterios.</p>
      </div>
    )
  }

  return (
    <div>
      {resultados.map((r, idx) => {
        const borderColor = idx % 2 === 0 ? 'border-l-[#213362]' : 'border-l-[#FFCD00]'
        const panelBg = idx % 2 === 0 ? 'bg-[#eaeef3]' : 'bg-[#213362] text-white'
        const light = idx % 2 !== 0
        const matchTags = [
          ...r.categorias_match,
          ...r.procesos_match,
          ...r.objetivos_match,
          ...r.actividades_match,
        ].slice(0, 4)

        return (
          <div
            key={r.fondo_id || idx}
            className={`bg-white rounded-3xl p-6 md:p-8 mb-8 last:mb-0
              shadow-[0_12px_40px_-28px_rgba(33,51,98,0.45)] border-l-[10px] ${borderColor}`}
          >
            <div className="grid md:grid-cols-12 gap-6 md:gap-10 items-start">

              {/* Número decorativo */}
              <div className="hidden md:flex md:col-span-1 flex-col items-center pt-2">
                <span className="text-5xl font-black text-[#FFCD00] leading-none">{idx + 1}.</span>
                <div className="w-px h-16 bg-gray-100 mt-3" />
              </div>

              {/* Info del fondo */}
              <div className="md:col-span-7">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  {r.tiene_instructivo && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-[#a5f3c7] text-[#0f5132]">
                      Instructivo disponible
                    </span>
                  )}
                  {r.tiene_modelo_aplicacion && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-[#fde68a] text-[#92400e]">
                      Modelo de aplicación
                    </span>
                  )}

                </div>

                <h3 className="text-2xl md:text-3xl font-black text-[#213362] leading-tight mb-2">
                  {r.fondo_nombre}
                </h3>

                {r.entidad_encargada && (
                  <p className="text-base text-gray-400 font-medium mb-3 leading-relaxed">
                    {r.entidad_encargada.length > 120 ? r.entidad_encargada.slice(0, 120) + '...' : r.entidad_encargada}
                  </p>
                )}

                {r.tipo_fondo_nombre && (
                  <p className="text-sm text-gray-500 leading-relaxed mb-5">{r.tipo_fondo_nombre}</p>
                )}

                {matchTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {matchTags.map((tag, ci) => (
                      <span
                        key={ci}
                        className="bg-gray-50 text-gray-500 text-xs font-bold px-4 py-2 rounded-xl border border-gray-100 whitespace-nowrap"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Panel lateral */}
              <div className={`md:col-span-4 rounded-2xl p-5 md:p-6 flex flex-col justify-between ${panelBg}`}>
                <div className="flex-1 space-y-2">
                  {/* Estado de convocatoria */}
                  {r.estado_convocatoria && (() => {
                    const isOpen = /abierta|activa|vigente/i.test(r.estado_convocatoria)
                    const isClosed = /cerrada|vencida|inactiva/i.test(r.estado_convocatoria)
                    const chipCls = isOpen
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : isClosed
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : light ? 'bg-white/10 text-white border-white/20' : 'bg-white text-[#213362] border-gray-200'
                    return (
                      <div>
                        <p className={`text-[8px] font-black uppercase tracking-[0.15em] mb-1 ${light ? 'text-white/40' : 'text-gray-400'}`}>Estado</p>
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg border inline-block ${chipCls}`}>{r.estado_convocatoria}</span>
                      </div>
                    )
                  })()}

                  {/* Periodicidad */}
                  {r.periodicidad && (
                    <div>
                      <p className={`text-[8px] font-black uppercase tracking-[0.15em] mb-1 ${light ? 'text-white/40' : 'text-gray-400'}`}>Periodicidad</p>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border inline-block ${light ? 'bg-white/10 text-white border-white/20' : 'bg-white text-[#213362] border-gray-200'}`}>{r.periodicidad}</span>
                    </div>
                  )}

                  {/* Modalidad de acceso */}
                  {r.acceso_modalidad && (
                    <div>
                      <p className={`text-[8px] font-black uppercase tracking-[0.15em] mb-1 ${light ? 'text-white/40' : 'text-gray-400'}`}>Modalidad</p>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border inline-block ${light ? 'bg-white/10 text-white border-white/20' : 'bg-white text-[#213362] border-gray-200'}`}>{r.acceso_modalidad}</span>
                    </div>
                  )}

                  {/* Vigencia */}
                  {r.vigencia && (
                    <div>
                      <p className={`text-[8px] font-black uppercase tracking-[0.15em] mb-1 ${light ? 'text-white/40' : 'text-gray-400'}`}>Vigencia</p>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border inline-block ${light ? 'bg-white/10 text-white border-white/20' : 'bg-white text-[#213362] border-gray-200'}`}>
                        {r.vigencia.length > 35 ? r.vigencia.slice(0, 35) + '…' : r.vigencia}
                      </span>
                    </div>
                  )}

                  {/* Monto */}
                  {r.monto_texto && (
                    <div>
                      <p className={`text-[8px] font-black uppercase tracking-[0.15em] mb-1 ${light ? 'text-white/40' : 'text-gray-400'}`}>Monto</p>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border inline-block ${light ? 'bg-[#FFCD00]/20 text-[#FFCD00] border-[#FFCD00]/30' : 'bg-[#FFCD00]/10 text-[#92400e] border-[#FFCD00]/40'}`}>
                        {r.monto_texto.length > 40 ? r.monto_texto.slice(0, 40) + '…' : r.monto_texto}
                      </span>
                    </div>
                  )}

                  {!r.estado_convocatoria && !r.periodicidad && !r.acceso_modalidad && !r.vigencia && !r.monto_texto && (
                    <p className={`text-xs leading-relaxed ${light ? 'text-white/50' : 'text-gray-400'}`}>
                      Ver ficha completa para condiciones de acceso.
                    </p>
                  )}
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  {r.pagina_web && (
                    <a
                      href={r.pagina_web}
                      target="_blank"
                      rel="noreferrer"
                      className={`w-full py-3 rounded-2xl font-black text-sm text-center border-2 transition-all block ${
                        light
                          ? 'border-white/30 text-white hover:bg-white/10'
                          : 'border-[#213362]/20 text-[#213362] hover:bg-[#f6fafe]'
                      }`}
                    >
                      Página web
                    </a>
                  )}
                  <Link
                    href={`/fondo/${r.fondo_id}`}
                    className={`w-full py-3 rounded-2xl font-black text-sm text-center
                      hover:scale-[1.02] active:scale-95 transition-all shadow-xl block ${
                      idx % 2 === 0
                        ? 'bg-[#213362] text-white shadow-[#213362]/20'
                        : 'bg-white text-[#213362] hover:bg-[#FFCD00]'
                    }`}
                  >
                    IR AL FONDO
                  </Link>
                </div>
              </div>

            </div>
          </div>
        )
      })}
    </div>
  )
}

export function BuscadorNgV5() {
  const router = useRouter()
  const wizardRef = useRef<HTMLDivElement>(null)
  const stepRefs = useRef<Record<number, HTMLElement | null>>({})

  const [iniciado, setIniciado] = useState(false)
  const [paso, setPaso] = useState<Paso>(1)
  const [state, setState] = useState<NgWizardState>(INITIAL_STATE)

  const [actores, setActores] = useState<NgActor[]>([])
  const [tipos, setTipos] = useState<NgTipoFondo[]>([])
  const [procesos, setProcesos] = useState<NgProcesoGrd[]>([])
  const [objetivos, setObjetivos] = useState<NgObjetivoPngrd[]>([])
  const [categorias, setCategorias] = useState<NgCategoria[]>([])
  const [actividades, setActividades] = useState<NgActividad[]>([])

  const [resultados, setResultados] = useState<NgResultadoBusqueda[]>([])
  const [vigencias, setVigencias] = useState<NgVigenciaResumen[]>([])  
  const [flags, setFlags] = useState<NgResumenFlags>(EMPTY_FLAGS)

  const [loadingCatalogos, setLoadingCatalogos] = useState(false)
  const [loadingTipos, setLoadingTipos] = useState(false)
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  const [loadingActividades, setLoadingActividades] = useState(false)
  const [loadingResultados, setLoadingResultados] = useState(false)

  const [errorCatalogos, setErrorCatalogos] = useState<string | null>(null)
  const [errorResultados, setErrorResultados] = useState<string | null>(null)

  // Filtros post-búsqueda
  const [filtroInstructivo, setFiltroInstructivo] = useState<boolean | null>(null)
  const [filtroModelo, setFiltroModelo] = useState<boolean | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string[]>([])
  const [filtroPeriodicidad, setFiltroPeriodicidad] = useState<string[]>([])
  const [filtroAcceso, setFiltroAcceso] = useState<string[]>([])

  const canSearch = Boolean(state.actorId && state.tipoFondoId)

  useEffect(() => {
    if (!iniciado) return
    const node = stepRefs.current[paso]
    if (!node) return
    const timer = setTimeout(() => {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 90)
    return () => clearTimeout(timer)
  }, [iniciado, paso])

  useEffect(() => {
    let active = true
    setLoadingCatalogos(true)
    setErrorCatalogos(null)

    Promise.all([getNgActores(), getProcesosGrd(), getObjetivosPngrd()])
      .then(([rowsActores, rowsProcesos, rowsObjetivos]) => {
        if (!active) return
        setActores(rowsActores)
        setProcesos(rowsProcesos)
        setObjetivos(rowsObjetivos)
      })
      .catch(error => {
        if (!active) return
        setErrorCatalogos(error instanceof Error ? error.message : 'No se pudo cargar catalogo base.')
      })
      .finally(() => {
        if (active) setLoadingCatalogos(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    if (!state.actorId) {
      setTipos([])
      return () => {
        active = false
      }
    }

    setLoadingTipos(true)
    getNgTiposFondo(state.actorId)
      .then(rows => {
        if (!active) return
        setTipos(rows)
      })
      .catch(error => {
        if (!active) return
        setErrorCatalogos(error instanceof Error ? error.message : 'No se pudieron cargar tipos de fondo.')
      })
      .finally(() => {
        if (active) setLoadingTipos(false)
      })

    return () => {
      active = false
    }
  }, [state.actorId])

  useEffect(() => {
    let active = true

    if (!state.actorId || !state.tipoFondoId) {
      setCategorias([])
      return () => {
        active = false
      }
    }

    setLoadingCategorias(true)
    getNgCategorias({
      actorId: state.actorId,
      tipoFondoId: state.tipoFondoId,
      procesoIds: state.procesoIds,
      objetivoIds: state.objetivoIds,
      categoriaId: null,
      actividadIds: [],
    })
      .then(rows => {
        if (!active) return
        setCategorias(rows)
      })
      .catch(error => {
        if (!active) return
        setErrorCatalogos(error instanceof Error ? error.message : 'No se pudieron cargar categorias.')
      })
      .finally(() => {
        if (active) setLoadingCategorias(false)
      })

    return () => {
      active = false
    }
  }, [state.actorId, state.tipoFondoId, state.procesoIds, state.objetivoIds])

  useEffect(() => {
    let active = true

    if (!state.actorId || !state.tipoFondoId || !state.categoriaId) {
      setActividades([])
      setState(prev => (prev.actividadIds.length > 0 ? { ...prev, actividadIds: [] } : prev))
      return () => {
        active = false
      }
    }

    setLoadingActividades(true)
    getNgActividades({
      actorId: state.actorId,
      tipoFondoId: state.tipoFondoId,
      procesoIds: state.procesoIds,
      objetivoIds: state.objetivoIds,
      categoriaId: state.categoriaId,
      actividadIds: [],
    })
      .then(rows => {
        if (!active) return
        setActividades(rows)
        setState(prev => ({
          ...prev,
          actividadIds: prev.actividadIds.filter(id => rows.some(item => item.actividad_id === id)),
        }))
      })
      .catch(error => {
        if (!active) return
        setErrorCatalogos(error instanceof Error ? error.message : 'No se pudieron cargar actividades.')
      })
      .finally(() => {
        if (active) setLoadingActividades(false)
      })

    return () => {
      active = false
    }
  }, [state.actorId, state.tipoFondoId, state.procesoIds, state.objetivoIds, state.categoriaId])

  async function ejecutarBusqueda() {
    if (!canSearch) {
      setErrorResultados('Selecciona actor y tipo de fondo antes de buscar.')
      return
    }

    setLoadingResultados(true)
    setErrorResultados(null)

    try {
      const filters = buildFilters(state)
      const [rows, vigenciasRows, flagsRow] = await Promise.all([
        buscarFondosNg(filters),
        getNgVigencias(filters),
        getNgResumenFlags(filters),
      ])

      // Enriquecer con datos de fondos_modelos_aplicacion
      const fondoIds = rows.map(r => r.fondo_id)
      const modeloMap: Awaited<ReturnType<typeof getNgModeloInfoBatch>> =
        await getNgModeloInfoBatch(fondoIds).catch(() => ({}))
      const rowsEnriquecidos = rows.map(r => ({
        ...r,
        ...(modeloMap[r.fondo_id] ?? {}),
      }))

      setResultados(rowsEnriquecidos)
      setVigencias(vigenciasRows)
      setFlags(flagsRow)
      setPaso(7)
    } catch (error) {
      setErrorResultados(error instanceof Error ? error.message : 'Error ejecutando la busqueda V5.')
    } finally {
      setLoadingResultados(false)
    }
  }

  function comenzar() {
    setIniciado(true)
    setPaso(1)
    setTimeout(() => {
      wizardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function reiniciarTodo() {
    setState(INITIAL_STATE)
    setResultados([])
    setVigencias([])
    setFlags(EMPTY_FLAGS)
    setErrorResultados(null)
    setFiltroInstructivo(null)
    setFiltroModelo(null)
    setFiltroEstado([])
    setFiltroPeriodicidad([])
    setFiltroAcceso([])
    setPaso(1)
  }

  const resultadosVisibles = resultados.filter(item => {
    const vigenciaOk =
      state.vigenciasSeleccionadas.length === 0 ||
      (item.vigencia ? state.vigenciasSeleccionadas.includes(item.vigencia) : false)
    const instructivoOk = filtroInstructivo === null || item.tiene_instructivo === filtroInstructivo
    const modeloOk = filtroModelo === null || item.tiene_modelo_aplicacion === filtroModelo
    const estadoOk = filtroEstado.length === 0 || (item.estado_convocatoria ? filtroEstado.includes(item.estado_convocatoria) : false)
    const periodicidadOk = filtroPeriodicidad.length === 0 || (item.periodicidad ? filtroPeriodicidad.includes(item.periodicidad) : false)
    const accesoOk = filtroAcceso.length === 0 || (item.acceso_modalidad ? filtroAcceso.includes(item.acceso_modalidad) : false)
    return vigenciaOk && instructivoOk && modeloOk && estadoOk && periodicidadOk && accesoOk
  })

  return (
    <div className="min-h-screen bg-[#f6fafe]">
      <HeroBuscador
        onComenzar={comenzar}
        ctaVariant="triple"
        onBuscadorAvanzado={() => router.push('/buscar-avanzado')}
      />

      <div ref={wizardRef}>
        {!iniciado ? null : (
          <>
            {errorCatalogos && (
              <div className="max-w-6xl mx-auto px-6 py-4">
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorCatalogos}</div>
              </div>
            )}

            {/* ── PASO 1 — ¿Quién eres? ───────────────────────────────────── */}
            {paso >= 1 && (
              <section
                ref={el => { stepRefs.current[1] = el }}
                className="bg-[#f6fafe] py-24 border-b border-gray-100"
                aria-labelledby="ng-paso1-titulo"
              >
                <div className="max-w-6xl mx-auto px-6 md:px-12">
                  <div className="flex flex-col md:flex-row gap-16 items-center">

                    <div className="w-full md:w-1/3 shrink-0">
                      <span className="text-6xl font-black text-[#FFCD00] block mb-2">01</span>
                      <h2 id="ng-paso1-titulo" className="text-4xl font-black text-[#213362] mb-6">
                        ¿Quién eres?
                      </h2>
                      <p className="text-gray-500 font-medium leading-relaxed">
                        Selecciona el tipo de actor o entidad que realizará la gestión de recursos.
                      </p>
                    </div>

                    <div className="w-full md:w-2/3">
                      {loadingCatalogos ? (
                        <p className="text-sm text-gray-500">Cargando actores...</p>
                      ) : (
                        <div className="flex flex-wrap justify-center gap-4">
                          {[...actores].sort((a, b) => a.actor_nombre.localeCompare(b.actor_nombre, 'es')).map(actor => {
                            const isSelected = state.actorId === actor.actor_id
                            return (
                              <button
                                key={actor.actor_id}
                                onClick={() => {
                                  setState(prev => ({
                                    ...prev,
                                    actorId: actor.actor_id,
                                    tipoFondoId: null,
                                    procesoIds: [],
                                    objetivoIds: [],
                                    categoriaId: null,
                                    actividadIds: [],
                                    entidadesSeleccionadas: [],
                                    vigenciasSeleccionadas: [],
                                  }))
                                  setPaso(2)
                                }}
                                className={[
                                  'rounded-2xl px-7 py-6 flex flex-row items-start gap-5 transition-all text-left w-full sm:w-[calc(50%-8px)] max-w-[460px]',
                                  isSelected
                                    ? 'bg-[#213362] text-white shadow-2xl shadow-[#213362]/30 border-2 border-[#213362]'
                                    : 'bg-white border-2 border-gray-200 hover:border-[#213362] hover:shadow-xl',
                                ].join(' ')}
                              >
                                <WizardIcon
                                  type={getActorIcon(actor.actor_nombre)}
                                  className={`w-5 h-5 mt-0.5 shrink-0 ${isSelected ? 'text-[#FFCD00]' : 'text-[#07519D]'}`}
                                />
                                <div>
                                  <h4 className={`text-base font-black mb-1.5 leading-snug ${isSelected ? 'text-white' : 'text-[#213362]'}`}>
                                    {actor.actor_nombre}
                                  </h4>
                                  {isSelected && (
                                    <span className="mt-2 inline-block bg-[#FFCD00] text-[#213362] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                      Activo
                                    </span>
                                  )}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </section>
            )}

            {/* ── PASO 2 — ¿Qué tipo de fondo? ────────────────────────────── */}
            {paso >= 2 && (
              <section
                ref={el => { stepRefs.current[2] = el }}
                className="bg-[#f0f4f9] py-16 border-y border-gray-200"
                aria-labelledby="ng-paso2-titulo"
              >
                <div className="max-w-4xl mx-auto px-6 md:px-12">
                  <div className="text-center max-w-2xl mx-auto mb-10">
                    <span className="text-5xl font-black text-[#FFCD00] block mb-1">02</span>
                    <h2 id="ng-paso2-titulo" className="text-3xl font-black text-[#213362] mb-4">
                      ¿Qué tipo de fondo?
                    </h2>
                    <p className="text-gray-500 font-medium leading-relaxed text-sm">
                      Elige el tipo de instrumento de financiamiento que mejor se ajusta a tu iniciativa.
                    </p>
                  </div>

                  {!state.actorId ? (
                    <p className="text-center text-sm text-gray-500">Selecciona un actor para ver las opciones.</p>
                  ) : loadingTipos ? (
                    <p className="text-center text-sm text-gray-500">Cargando tipos...</p>
                  ) : (
                    <div className="flex flex-wrap justify-center gap-4" role="radiogroup">
                      {[...tipos].sort((a, b) => a.tipo_fondo_nombre.localeCompare(b.tipo_fondo_nombre, 'es')).map(tipo => {
                        const isSelected = state.tipoFondoId === tipo.tipo_fondo_id
                        return (
                          <button
                            key={tipo.tipo_fondo_id}
                            onClick={() => {
                              setState(prev => ({
                                ...prev,
                                tipoFondoId: tipo.tipo_fondo_id,
                                procesoIds: [],
                                objetivoIds: [],
                                categoriaId: null,
                                actividadIds: [],
                                entidadesSeleccionadas: [],
                                vigenciasSeleccionadas: [],
                              }))
                              setPaso(3)
                            }}
                            role="radio"
                            aria-checked={isSelected}
                            className={[
                              'rounded-2xl px-7 py-5 flex flex-row items-center gap-4 transition-all text-left w-full sm:w-[calc(50%-8px)] max-w-[360px]',
                              isSelected
                                ? 'bg-[#213362] text-white shadow-2xl shadow-[#213362]/30 border-2 border-[#213362]'
                                : 'bg-white border-2 border-gray-200 hover:border-[#213362] hover:shadow-xl',
                            ].join(' ')}
                          >
                            <WizardIcon
                              type={getTipoIcon(tipo.tipo_fondo_nombre)}
                              className={`w-5 h-5 shrink-0 ${isSelected ? 'text-[#FFCD00]' : 'text-[#07519D]'}`}
                            />
                            <div>
                              <h4 className={`text-base font-black leading-snug ${isSelected ? 'text-white' : 'text-[#213362]'}`}>
                                {tipo.tipo_fondo_nombre}
                              </h4>
                              {isSelected && (
                                <span className="mt-1.5 inline-block bg-[#FFCD00] text-[#213362] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                  Activo
                                </span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <div className="text-center mt-10">
                    <button
                      onClick={() => setPaso(1)}
                      className="text-sm text-gray-400 hover:text-[#213362] font-medium transition-colors underline-offset-4 hover:underline"
                    >
                      ← Cambiar actor
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* ── PASO 3 — Procesos GRD ─────────────────────────────────────── */}
            {paso >= 3 && (
              <section
                ref={el => { stepRefs.current[3] = el }}
                className="bg-[#f6fafe] py-16 border-b border-gray-100"
                aria-labelledby="ng-paso3-titulo"
              >
                <div className="max-w-4xl mx-auto px-6 md:px-12">
                  <div className="text-center max-w-2xl mx-auto mb-10">
                    <span className="text-5xl font-black text-[#FFCD00] block mb-1">03</span>
                    <h2 id="ng-paso3-titulo" className="text-3xl font-black text-[#213362] mb-4">
                      ¿Procesos GRD?
                    </h2>
                    <p className="text-gray-500 font-medium leading-relaxed text-sm">
                      Selecciona uno o más procesos de gestión del riesgo relacionados con tu iniciativa. Opcional.
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-4" role="group">
                    {[...procesos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map(proceso => {
                      const isSelected = state.procesoIds.includes(proceso.id)
                      return (
                        <button
                          key={proceso.id}
                          onClick={() => {
                            setState(prev => ({
                              ...prev,
                              procesoIds: toggleIds(prev.procesoIds, proceso.id),
                              categoriaId: null,
                              actividadIds: [],
                              entidadesSeleccionadas: [],
                              vigenciasSeleccionadas: [],
                            }))
                          }}
                          className={[
                            'relative rounded-2xl p-5 text-left border-2 transition-all w-full md:w-[calc(50%-8px)] lg:w-[calc(25%-12px)] max-w-[280px]',
                            isSelected
                              ? 'bg-[#213362] border-[#213362] shadow-xl shadow-[#213362]/30 text-white'
                              : 'bg-white border-gray-200 hover:border-[#213362] hover:shadow-xl',
                          ].join(' ')}
                        >
                          <WizardIcon
                            type={getProcesoIcon(proceso.nombre)}
                            className={`w-4 h-4 mb-2 ${isSelected ? 'text-[#FFCD00]' : 'text-[#07519D]'}`}
                          />
                          <h4 className={`text-sm font-black ${isSelected ? 'text-white' : 'text-[#213362]'}`}>
                            {proceso.nombre}
                          </h4>
                        </button>
                      )
                    })}
                  </div>

                  <div className="text-center mt-8 flex justify-center gap-8">
                    <button
                      onClick={() => setPaso(2)}
                      className="text-sm text-gray-400 hover:text-[#213362] font-medium transition-colors underline-offset-4 hover:underline"
                    >
                      ← Cambiar tipo
                    </button>
                    <button
                      onClick={() => setPaso(4)}
                      className="px-8 py-4 rounded-2xl bg-[#213362] text-white font-black hover:bg-[#07519D] transition-colors"
                    >
                      Continuar →
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* ── PASO 4 — Objetivos PNGRD ──────────────────────────────────── */}
            {paso >= 4 && (
              <section
                ref={el => { stepRefs.current[4] = el }}
                className="bg-[#213362] text-white py-32 relative overflow-hidden"
                aria-labelledby="ng-paso4-titulo"
              >
                <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
                  <div className="grid md:grid-cols-2 gap-16 items-start">

                    <div>
                      <span className="text-6xl font-black text-[#FFCD00] block mb-4">04</span>
                      <h2 id="ng-paso4-titulo" className="text-5xl font-black mb-8">
                        Objetivos{' '}
                        <br />
                        <span className="text-[#FFCD00]">PNGRD</span>
                      </h2>
                      <p className="text-xl text-white/60 mb-10 leading-relaxed">
                        Selecciona los objetivos del Plan Nacional de Gestión del Riesgo que aplican. Opcional.
                      </p>
                      <button
                        onClick={() => setPaso(3)}
                        className="mt-4 text-sm text-white/40 hover:text-white font-medium transition-colors underline-offset-4 hover:underline"
                      >
                        ← Cambiar procesos
                      </button>
                    </div>

                    <div className="space-y-4">
                      {[...objetivos].sort((a, b) => (a.nombre_corto ?? a.nombre).localeCompare(b.nombre_corto ?? b.nombre, 'es')).map(objetivo => {
                        const isSelected = state.objetivoIds.includes(objetivo.id)
                        return (
                          <button
                            key={objetivo.id}
                            onClick={() => {
                              setState(prev => ({
                                ...prev,
                                objetivoIds: toggleIds(prev.objetivoIds, objetivo.id),
                                categoriaId: null,
                                actividadIds: [],
                                entidadesSeleccionadas: [],
                                vigenciasSeleccionadas: [],
                              }))
                            }}
                            className={[
                              'w-full text-left p-6 rounded-2xl border-2 transition-all flex items-start gap-4',
                              isSelected
                                ? 'bg-[#FFCD00] text-[#213362] border-[#FFCD00]'
                                : 'bg-white/10 border-white/20 text-white hover:bg-white/20',
                            ].join(' ')}
                          >
                            <WizardIcon
                              type={getObjetivoIcon(objetivo.nombre_corto ?? objetivo.nombre)}
                              className={`w-5 h-5 shrink-0 mt-0.5 ${isSelected ? 'text-[#213362]' : 'text-[#FFCD00]'}`}
                            />
                            <div>
                            <p className="font-black text-lg leading-snug">
                              {objetivo.nombre_corto ?? objetivo.nombre}
                            </p>
                            {objetivo.descripcion && (
                              <p className={`text-xs font-medium mt-1 leading-snug ${isSelected ? 'text-[#213362]/70' : 'text-white/50'}`}>
                                {objetivo.descripcion.length > 100
                                  ? objetivo.descripcion.slice(0, 100) + '...'
                                  : objetivo.descripcion}
                              </p>
                            )}
                            </div>
                          </button>
                        )
                      })}
                      <div className="pt-4">
                        <button
                          onClick={() => setPaso(5)}
                          className="w-full py-5 bg-[#FFCD00] text-[#213362] rounded-2xl font-black text-lg shadow-2xl shadow-[#FFCD00]/20 hover:brightness-110 transition-all uppercase tracking-wide"
                        >
                          Continuar →
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </section>
            )}

            {/* ── PASO 5 — Categoría ────────────────────────────────────────── */}
            {paso >= 5 && (
              <section
                ref={el => { stepRefs.current[5] = el }}
                className="bg-[#f6fafe] py-32 border-b border-gray-100"
                aria-labelledby="ng-paso5-titulo"
              >
                <div className="max-w-6xl mx-auto px-6 md:px-12">
                  <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="text-6xl font-black text-[#FFCD00] block mb-2">05</span>
                    <h2 id="ng-paso5-titulo" className="text-4xl font-black text-[#213362] mb-6">
                      ¿Categoría?
                    </h2>
                    <p className="text-gray-500 font-medium leading-relaxed">
                      Selecciona la categoría temática de tu iniciativa. Opcional.
                    </p>
                  </div>

                  {loadingCategorias ? (
                    <p className="text-center text-sm text-gray-500">Cargando categorías...</p>
                  ) : categorias.length === 0 ? (
                    <p className="text-center text-sm text-gray-500">No hay categorías para esta combinación.</p>
                  ) : (
                    <div className="flex flex-wrap justify-center gap-6" role="radiogroup">
                      {[...categorias].sort((a, b) => {
                        const numA = parseInt((a.categoria_codigo ?? '').replace(/\D/g, '') || '999', 10)
                        const numB = parseInt((b.categoria_codigo ?? '').replace(/\D/g, '') || '999', 10)
                        return numA - numB
                      }).map(categoria => {
                        const isSelected = state.categoriaId === categoria.categoria_id
                        const label = `${categoria.categoria_codigo ? `${categoria.categoria_codigo} · ` : ''}${categoria.categoria_nombre}`
                        return (
                          <button
                            key={categoria.categoria_id}
                            onClick={() => {
                              setState(prev => ({
                                ...prev,
                                categoriaId: categoria.categoria_id,
                                actividadIds: [],
                                entidadesSeleccionadas: [],
                                vigenciasSeleccionadas: [],
                              }))
                              setPaso(6)
                            }}
                            role="radio"
                            aria-checked={isSelected}
                            className={[
                              'relative rounded-3xl p-8 text-left border-2 transition-all w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-[360px]',
                              isSelected
                                ? 'bg-[#213362] border-[#213362] shadow-2xl shadow-[#213362]/30 text-white'
                                : 'bg-white border-gray-200 hover:border-[#213362] hover:shadow-xl',
                            ].join(' ')}
                          >
                            <WizardIcon
                              type={getCategoriaIcon(categoria.categoria_nombre)}
                              className={`w-5 h-5 mb-3 ${isSelected ? 'text-[#FFCD00]' : 'text-[#07519D]'}`}
                            />
                            <h4 className={`text-lg font-black mb-2 ${isSelected ? 'text-white' : 'text-[#213362]'}`}>
                              {label}
                            </h4>
                            {isSelected && (
                              <span className="mt-3 inline-block bg-[#FFCD00] text-[#213362] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                Activo
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <div className="text-center mt-10 flex justify-center gap-8">
                    <button
                      onClick={() => setPaso(4)}
                      className="text-sm text-gray-400 hover:text-[#213362] font-medium transition-colors underline-offset-4 hover:underline"
                    >
                      ← Cambiar objetivos
                    </button>
                    <button
                      onClick={() => setPaso(6)}
                      className="px-8 py-4 rounded-2xl border-2 border-[#213362] text-[#213362] font-black hover:bg-[#213362] hover:text-white transition-colors"
                    >
                      Continuar sin categoría
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* ── PASO 6 — Actividad + CTA Buscar ──────────────────────────── */}
            {paso >= 6 && (
              <section
                ref={el => { stepRefs.current[6] = el }}
                className="bg-[#213362] text-white py-32 relative overflow-hidden"
                aria-labelledby="ng-paso6-titulo"
              >
                <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
                  <div className="grid md:grid-cols-2 gap-16 items-start">

                    <div>
                      <span className="text-6xl font-black text-[#FFCD00] block mb-4">06</span>
                      <h2 id="ng-paso6-titulo" className="text-5xl font-black mb-8">
                        ¿Actividad?
                        <br />
                        <span className="text-[#FFCD00]">Opcional</span>
                      </h2>
                      <p className="text-xl text-white/60 mb-10 leading-relaxed">
                        Refina por actividad específica si necesitas resultados más precisos.
                      </p>
                      <button
                        onClick={() => setPaso(5)}
                        className="mt-4 text-sm text-white/40 hover:text-white font-medium transition-colors underline-offset-4 hover:underline"
                      >
                        ← Cambiar categoría
                      </button>
                    </div>

                    <div className="bg-white/5 rounded-[3rem] p-12 border border-white/10">
                      {!state.categoriaId ? (
                        <p className="text-white/50 text-sm italic mb-8">
                          No se seleccionó categoría. Puedes buscar sin actividad.
                        </p>
                      ) : loadingActividades ? (
                        <p className="text-white/50 text-sm mb-8">Cargando actividades...</p>
                      ) : actividades.length === 0 ? (
                        <p className="text-white/50 text-sm italic mb-8">
                          No hay actividades disponibles para esta categoría.
                        </p>
                      ) : (
                        <div className="space-y-3 mb-8 max-h-[400px] overflow-y-auto pr-1">
                          {[...actividades].sort((a, b) => a.actividad_nombre.localeCompare(b.actividad_nombre, 'es')).map(actividad => {
                            const isSelected = state.actividadIds.includes(actividad.actividad_id)
                            return (
                              <button
                                key={actividad.actividad_id}
                                onClick={() => {
                                  setState(prev => ({
                                    ...prev,
                                    actividadIds: toggleIds(prev.actividadIds, actividad.actividad_id),
                                    entidadesSeleccionadas: [],
                                    vigenciasSeleccionadas: [],
                                  }))
                                }}
                                className={[
                                  'w-full text-left p-5 rounded-2xl border-2 transition-all flex items-start gap-3',
                                  isSelected
                                    ? 'bg-[#FFCD00] text-[#213362] border-[#FFCD00]'
                                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20',
                                ].join(' ')}
                              >
                                <WizardIcon
                                  type={getActividadIcon(actividad.actividad_nombre)}
                                  className={`w-4 h-4 shrink-0 mt-1 ${isSelected ? 'text-[#213362]' : 'text-[#FFCD00]'}`}
                                />
                                <p className="font-black leading-snug">{actividad.actividad_nombre}</p>
                              </button>
                            )
                          })}
                          {state.actividadIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setState(prev => ({ ...prev, actividadIds: [] }))}
                              className="text-xs font-semibold text-white/30 hover:text-white"
                            >
                              Limpiar selección
                            </button>
                          )}
                        </div>
                      )}

                      <button
                        onClick={ejecutarBusqueda}
                        disabled={!canSearch || loadingResultados}
                        className="w-full mt-2 py-5 bg-[#FFCD00] text-[#213362] rounded-2xl font-black
                          text-lg shadow-2xl shadow-[#FFCD00]/20 hover:brightness-110 transition-all
                          uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {loadingResultados ? 'Buscando...' : 'Encontrar fondos →'}
                      </button>
                    </div>

                  </div>
                </div>
              </section>
            )}

            {/* ── PASO 7 — Resultados ───────────────────────────────────────── */}
            {paso >= 7 && (
              <section
                ref={el => { stepRefs.current[7] = el }}
                className="bg-[#f6fafe] min-h-screen"
                aria-labelledby="ng-paso7-titulo"
              >
                {/* Header */}
                <div className="bg-[#f6fafe] border-b border-gray-100 py-8">
                  <div className="max-w-6xl mx-auto px-6 md:px-12 flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h2 id="ng-paso7-titulo" className="text-3xl font-black text-[#213362]">
                        {loadingResultados
                          ? 'Buscando...'
                          : resultadosVisibles.length < resultados.length
                            ? `${resultadosVisibles.length} de ${resultados.length} fondos`
                            : `${resultados.length} fondos recomendados para ti`}
                      </h2>
                      <p className="text-gray-400 font-medium mt-1 text-sm">
                        Estos resultados se ordenan por afinidad con lo que seleccionaste en el buscador.
                      </p>
                    </div>
                    <button
                      onClick={reiniciarTodo}
                      className="text-sm font-bold text-[#07519D] underline underline-offset-2 hover:text-[#213362] transition-colors"
                    >
                      ← Nueva búsqueda
                    </button>
                  </div>
                </div>

                {/* ── Filtros + Resultados ──────────────────────────────────────── */}
                <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
                  {(() => {
                    const hasInstructivo = flags.fondos_con_instructivo > 0 && flags.fondos_sin_instructivo > 0
                    const hasModelo = flags.fondos_con_modelo_aplicacion > 0 && flags.fondos_sin_modelo_aplicacion > 0

                    const estadoOpciones = Array.from(
                      new Set(resultados.map(r => r.estado_convocatoria).filter(Boolean) as string[])
                    ).sort()
                    const periodicidadOpciones = Array.from(
                      new Set(resultados.map(r => r.periodicidad).filter(Boolean) as string[])
                    ).sort()
                    const accesoOpciones = Array.from(
                      new Set(resultados.map(r => r.acceso_modalidad).filter(Boolean) as string[])
                    ).sort()

                    const hasEstado = estadoOpciones.length > 1
                    const hasPeriodicidad = periodicidadOpciones.length > 1
                    const hasAcceso = accesoOpciones.length > 1

                    const hasAnyFilter = hasInstructivo || hasModelo || hasEstado || hasPeriodicidad || hasAcceso

                    const activeCount =
                      (filtroInstructivo !== null ? 1 : 0) +
                      (filtroModelo !== null ? 1 : 0) +
                      filtroEstado.length +
                      filtroPeriodicidad.length +
                      filtroAcceso.length

                    const clearAll = () => {
                      setFiltroInstructivo(null)
                      setFiltroModelo(null)
                      setFiltroEstado([])
                      setFiltroPeriodicidad([])
                      setFiltroAcceso([])
                    }

                    return (
                      <div>
                        {/* Barra de filtros sutil */}
                        {!loadingResultados && resultados.length > 0 && hasAnyFilter && (
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 shrink-0">Afinar</span>

                            {hasEstado && estadoOpciones.map(opt => {
                              const sel = filtroEstado.includes(opt)
                              const color = /abierta|activa|vigente/i.test(opt)
                                ? sel ? 'bg-[#a5f3c7] text-[#0f5132] border-[#a5f3c7]' : 'bg-white text-gray-500 border-gray-200 hover:border-green-300 hover:text-green-700'
                                : /cerrada|vencida|inactiva/i.test(opt)
                                  ? sel ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white text-gray-500 border-gray-200 hover:border-red-200 hover:text-red-600'
                                  : sel ? 'bg-[#213362] text-white border-[#213362]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#213362] hover:text-[#213362]'
                              return (
                                <button key={opt} onClick={() => setFiltroEstado(sel ? filtroEstado.filter(x => x !== opt) : [...filtroEstado, opt])}
                                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${color}`}>
                                  {opt}
                                </button>
                              )
                            })}

                            {hasAcceso && accesoOpciones.map(opt => {
                              const sel = filtroAcceso.includes(opt)
                              return (
                                <button key={opt} onClick={() => setFiltroAcceso(sel ? filtroAcceso.filter(x => x !== opt) : [...filtroAcceso, opt])}
                                  className={['px-3 py-1 rounded-full text-xs font-semibold border transition-all', sel ? 'bg-[#213362] text-white border-[#213362]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#213362] hover:text-[#213362]'].join(' ')}>
                                  {opt}
                                </button>
                              )
                            })}

                            {hasPeriodicidad && periodicidadOpciones.map(opt => {
                              const sel = filtroPeriodicidad.includes(opt)
                              return (
                                <button key={opt} onClick={() => setFiltroPeriodicidad(sel ? filtroPeriodicidad.filter(x => x !== opt) : [...filtroPeriodicidad, opt])}
                                  className={['px-3 py-1 rounded-full text-xs font-semibold border transition-all', sel ? 'bg-[#213362] text-white border-[#213362]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#213362] hover:text-[#213362]'].join(' ')}>
                                  {opt}
                                </button>
                              )
                            })}

                            {hasInstructivo && (
                              <>
                                <button onClick={() => setFiltroInstructivo(filtroInstructivo === true ? null : true)}
                                  className={['px-3 py-1 rounded-full text-xs font-semibold border transition-all', filtroInstructivo === true ? 'bg-[#a5f3c7] text-[#0f5132] border-[#a5f3c7]' : 'bg-white text-gray-500 border-gray-200 hover:border-green-300 hover:text-green-700'].join(' ')}>
                                  Con instructivo
                                </button>
                                <button onClick={() => setFiltroInstructivo(filtroInstructivo === false ? null : false)}
                                  className={['px-3 py-1 rounded-full text-xs font-semibold border transition-all', filtroInstructivo === false ? 'bg-gray-200 text-gray-700 border-gray-400' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'].join(' ')}>
                                  Sin instructivo
                                </button>
                              </>
                            )}

                            {hasModelo && (
                              <>
                                <button onClick={() => setFiltroModelo(filtroModelo === true ? null : true)}
                                  className={['px-3 py-1 rounded-full text-xs font-semibold border transition-all', filtroModelo === true ? 'bg-[#fde68a] text-[#92400e] border-[#fde68a]' : 'bg-white text-gray-500 border-gray-200 hover:border-yellow-300 hover:text-yellow-700'].join(' ')}>
                                  Con modelo de aplicación
                                </button>
                                <button onClick={() => setFiltroModelo(filtroModelo === false ? null : false)}
                                  className={['px-3 py-1 rounded-full text-xs font-semibold border transition-all', filtroModelo === false ? 'bg-gray-200 text-gray-700 border-gray-400' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'].join(' ')}>
                                  Sin modelo
                                </button>
                              </>
                            )}

                            {activeCount > 0 && (
                              <button onClick={clearAll}
                                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#213362] underline underline-offset-2 transition-colors shrink-0">
                                Limpiar ({activeCount})
                              </button>
                            )}
                          </div>
                        )}

                        {/* Resultados */}
                        <ResultadosNg
                          resultados={resultadosVisibles}
                          cargando={loadingResultados}
                          error={errorResultados}
                          onRetry={ejecutarBusqueda}
                        />
                      </div>
                    )
                  })()}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
