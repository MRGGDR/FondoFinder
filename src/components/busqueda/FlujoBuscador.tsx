'use client'

import { useState, useRef, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { ResultadoBusqueda, TipoFondo } from '@/types/database'
import { HeroBuscador } from './HeroBuscador'
import { EtapaTipo } from './EtapaTipo'
import { EtapaProceso } from './EtapaProceso'
import { EtapaPresupuesto } from './EtapaPresupuesto'
import { EtapaResultados } from './EtapaResultados'
import { UNGRDLoader } from '@/components/ui/UNGRDLoader'
import { useLoader } from '@/hooks/useLoader'

type Etapa = 'hero' | 'tipo' | 'proceso' | 'presupuesto' | 'resultados'

interface EstadoFiltros {
  query: string
  tipoFondo: TipoFondo | null
  procesoIds: number[]
  objetivoIds: number[]
  presupuestoCOP: string
}

const FILTROS_INICIALES: EstadoFiltros = {
  query: '',
  tipoFondo: null,
  procesoIds: [],
  objetivoIds: [],
  presupuestoCOP: '',
}

const TODAS_ETAPAS: Etapa[] = ['hero', 'tipo', 'proceso', 'presupuesto', 'resultados']

const PROCESO_LABELS: Record<number, string> = {
  1: 'Conocimiento del riesgo',
  2: 'Reducción del riesgo',
  3: 'Manejo – Respuesta',
  4: 'Manejo – Recuperación',
}

const OBJETIVO_LABELS: Record<number, string> = {
  1: 'Conocimiento riesgo',
  2: 'Reducción riesgo',
  3: 'Acción comunitaria',
  4: 'Gobernanza',
  5: 'Preparación y respuesta',
}

export function FlujoBuscador() {
  const [etapasVisibles, setEtapasVisibles] = useState<Set<Etapa>>(
    new Set<Etapa>(['hero'])
  )
  const [filtros, setFiltros] = useState<EstadoFiltros>(FILTROS_INICIALES)
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([])
  const [totalResultados, setTotalResultados] = useState(0)
  const { estado: loader, mostrar: mostrarLoader, ocultar: ocultarLoader } = useLoader()

  const refTipo = useRef<HTMLDivElement>(null)
  const refProceso = useRef<HTMLDivElement>(null)
  const refPresupuesto = useRef<HTMLDivElement>(null)
  const refResultados = useRef<HTMLDivElement>(null)

  const mostrarResultados = etapasVisibles.has('resultados')

  const [mostrarSubir, setMostrarSubir] = useState(false)
  useEffect(() => {
    function onScroll() { setMostrarSubir(window.scrollY > 400) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function revelarEtapa(etapa: Etapa, ref: React.RefObject<HTMLDivElement>) {
    setEtapasVisibles(prev => new Set<Etapa>(Array.from(prev).concat([etapa])))
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  async function ejecutarBusqueda(overrides?: Partial<EstadoFiltros>) {
    const f: EstadoFiltros = overrides ? { ...filtros, ...overrides } : filtros

    mostrarLoader('buscando')
    revelarEtapa('resultados', refResultados)

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const presupuestoNum = f.presupuestoCOP
      ? parseFloat(f.presupuestoCOP.replace(/\./g, '')) / 4200
      : null

    const { data, error } = await supabase.rpc('buscar_fondos', {
      p_query: f.query || null,
      p_tipo_fondo: f.tipoFondo ?? null,
      p_proceso_ids: f.procesoIds.length > 0 ? f.procesoIds : null,
      p_objetivo_ids: f.objetivoIds.length > 0 ? f.objetivoIds : null,
      p_presupuesto_usd: presupuestoNum,
      p_limit: 12,
      p_offset: 0,
    })

    const rows = (data as ResultadoBusqueda[]) ?? []
    if (!error) {
      setResultados(rows)
      setTotalResultados(rows[0]?.total_count ?? rows.length)
    } else {
      setResultados([])
      setTotalResultados(0)
    }
    ocultarLoader()
  }

  function aplicarFiltro(cambios: Partial<EstadoFiltros>) {
    setFiltros(prev => ({ ...prev, ...cambios }))
    ejecutarBusqueda(cambios)
  }

  function busquedaDirecta(query: string) {
    setFiltros(prev => ({ ...prev, query }))
    setEtapasVisibles(new Set<Etapa>(['hero', 'resultados']))
    ejecutarBusqueda({ query })
  }

  function resetFlujo() {
    setFiltros(FILTROS_INICIALES)
    setResultados([])
    setTotalResultados(0)
    ocultarLoader()
    setEtapasVisibles(new Set<Etapa>(['hero']))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES)
    ejecutarBusqueda(FILTROS_INICIALES)
  }

  return (
    <>
      <HeroBuscador
        query={filtros.query}
        onQueryChange={q => setFiltros(prev => ({ ...prev, query: q }))}
        onComenzar={() => revelarEtapa('tipo', refTipo)}
        onBusquedaDirecta={busquedaDirecta}
        onReset={resetFlujo}
      />

      {etapasVisibles.has('tipo') && (
        <div ref={refTipo} className="etapa-reveal">
          <EtapaTipo
            seleccionado={filtros.tipoFondo}
            onSeleccionar={tipo => {
              setFiltros(prev => ({ ...prev, tipoFondo: tipo }))
              revelarEtapa('proceso', refProceso)
            }}
            onSaltar={() => revelarEtapa('proceso', refProceso)}
          />
        </div>
      )}

      {etapasVisibles.has('proceso') && (
        <div ref={refProceso} className="etapa-reveal">
          <EtapaProceso
            seleccionados={filtros.procesoIds}
            onCambiar={ids => setFiltros(prev => ({ ...prev, procesoIds: ids }))}
            onContinuar={() => revelarEtapa('presupuesto', refPresupuesto)}
          />
        </div>
      )}

      {etapasVisibles.has('presupuesto') && (
        <div ref={refPresupuesto} className="etapa-reveal">
          <EtapaPresupuesto
            presupuestoCOP={filtros.presupuestoCOP}
            onCambiar={val => setFiltros(prev => ({ ...prev, presupuestoCOP: val }))}
            objetivoIds={filtros.objetivoIds}
            onCambiarObjetivos={ids => setFiltros(prev => ({ ...prev, objetivoIds: ids }))}
            onBuscar={ejecutarBusqueda}
          />
        </div>
      )}

      {mostrarResultados && (
        <div ref={refResultados} className="etapa-reveal">
      <EtapaResultados
        resultados={resultados}
        total={totalResultados}
        cargando={loader.visible}
        filtros={filtros}
        onLimpiarFiltros={limpiarFiltros}
      />
        </div>
      )}

      {/* Bot�n subir al inicio */}
      {mostrarSubir && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Volver arriba"
          className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full
            bg-[#213362] text-white shadow-2xl shadow-[#213362]/40
            flex items-center justify-center
            hover:bg-[#FFCD00] hover:text-[#213362] hover:scale-110
            active:scale-95 transition-all duration-200"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 15V5M5 10l5-5 5 5" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      <UNGRDLoader
        visible={loader.visible}
        contexto={loader.contexto}
        subTexto={loader.subTexto}
      />
    </>
  )
}

