'use client'
/**
 * FlujoBuscadorNarrativo — orquesta la experiencia de búsqueda narrativa v2
 *
 * La UI principal es ConsultaNarrativa: una frase interactiva donde el usuario
 * construye su consulta seleccionando chips inline, sin pasar por un wizard
 * de formularios por pasos.
 *
 * Los resultados se revelan debajo de la frase al ejecutar la búsqueda.
 * Los hooks, el estado y la lógica de búsqueda permanecen sin cambios.
 */

import { useState, useRef, useCallback } from 'react'
import type { TipoFondo, BusquedaNarrativaParams, CatalogoNarrativa } from '@/types/database'
import { useCatalogoNarrativa } from '@/hooks/useCatalogoNarrativa'
import { useBusquedaNarrativa } from '@/hooks/useBusquedaNarrativa'
import { usePerfilConsulta } from '@/hooks/usePerfilConsulta'
import { useLightSession } from '@/context/LightSessionContext'
import { useLoader } from '@/hooks/useLoader'
import { UNGRDLoader } from '@/components/ui/UNGRDLoader'
import { ConsultaNarrativa } from './ConsultaNarrativa'
import { EtapaResultadosNarrativa } from './EtapaResultadosNarrativa'
import type { ResumenNarrativoData } from './EtapaResultadosNarrativa'

// ─── Estado narrativo completo ────────────────────────────────────────────────
interface EstadoNarrativo {
  sujetoId: string | null
  predicadoId: string | null
  verboIds: string[]
  complementoIds: string[]
  tipoDesastre: string | null
  afectacion: string | null
  tipoFondo: TipoFondo | null
  presupuestoUSD: number | null
  refinadores: string[]
}

const ESTADO_INICIAL: EstadoNarrativo = {
  sujetoId: null,
  predicadoId: null,
  verboIds: [],
  complementoIds: [],
  tipoDesastre: null,
  afectacion: null,
  tipoFondo: null,
  presupuestoUSD: null,
  refinadores: [],
}

// â”€â”€ HeurÃ­stica conservadora de inferencia territorial (solo fondos con restricciÃ³n fuerte) â”€â”€
// Devuelve el UUID del municipio a usar en municipio_consulta_id o null si la seÃ±al es ambigua.
const TERRITORIOS_FUERTES = {
  F09: 'ff95879e-7c4b-4d92-b8ab-039d9acd19ca', // Buenaventura
  F11: 'de8dd922-44b1-4998-ba8c-6df6400f4854', // Cali (Valle del Cauca)
  F12: 'abd47c2f-3dfa-4a4b-a302-c62a802b8952', // Manizales (Caldas)
  F13: '4fcb8441-7c32-4482-805d-93b141c264dc', // MedellÃ­n (Valle de AburrÃ¡)
  F14: '544bdd62-9646-455a-a398-7e1454259bc4', // Bucaramanga (Santander)
  F14_ALT: 'd757a8d0-33b9-426a-808b-a48fe2dc3bb4', // CÃºcuta (N. de Santander)
} as const

function normalizarPlano(txt: string) {
  return txt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function inferirTerritorio(
  estado: EstadoNarrativo,
  catalogo: CatalogoNarrativa | null,
): string | null {
  if (!catalogo) return null

  const sujetoNombre      = catalogo.sujeto.find(t => t.id === estado.sujetoId)?.termino_canonico ?? ''
  const predicadoNombre   = catalogo.predicado.find(t => t.id === estado.predicadoId)?.termino_canonico ?? ''
  const verboNombres      = catalogo.verbo.filter(t => estado.verboIds.includes(t.id)).map(t => t.termino_canonico)
  const complementoNombres = catalogo.complemento.filter(t => estado.complementoIds.includes(t.id)).map(t => t.termino_canonico)

  const textoCrudo = [
    sujetoNombre,
    predicadoNombre,
    ...verboNombres,
    ...complementoNombres,
    estado.tipoDesastre ?? '',
    estado.afectacion ?? '',
    estado.tipoFondo ?? '',
    ...estado.refinadores,
  ].join(' | ')

  const text = normalizarPlano(textoCrudo)
  const has = (words: string[]) => words.some(w => text.includes(normalizarPlano(w)))

  // Señales comunes
  const sAguaBasica   = has(['acueducto', 'agua potable', 'saneamiento', 'vivienda', 'salud'])
  const sContratoObra = has(['contratacion', 'secop', 'obra', 'proceso contractual'])
  const sInfra        = has(['infraestructura', 'desarrollo integral'])
  const sPSA          = has(['psa', 'pago por servicios', 'pagos por servicios'])
  const sCuencas      = has(['cuencas', 'cuenca', 'abastecedora'])
  const sRestauracion = has(['restauracion', 'revegetalizacion', 'bosques altoandinos'])
  const sSegHidrica   = has(['seguridad hidrica', 'sostenibilidad hidrica', 'monitoreo hidrico'])

  const puntuaciones: Array<{ id: string; muni: string; score: number }> = []

  // F09 â€” Buenaventura (infra + contrato + servicios bÃ¡sicos) o seÃ±al directa
  let scoreF09 = 0
  if (sInfra) scoreF09 += 2
  if (sContratoObra) scoreF09 += 2
  if (sAguaBasica) scoreF09 += 2
  if (has(['piedb', 'buenaventura'])) scoreF09 += 3
  if (estado.tipoFondo === 'Territorial') scoreF09 += 1
  if (scoreF09 >= 4) puntuaciones.push({ id: 'F09', muni: TERRITORIOS_FUERTES.F09, score: scoreF09 })

  // F11 â€” Valle del Cauca (agua + alianza territorial)
  let scoreF11 = 0
  if (has(['valle del cauca', 'cali'])) scoreF11 += 2
  if (sCuencas || sSegHidrica || sRestauracion || sPSA) scoreF11 += 2
  if (has(['alianza', 'articulacion', 'comunitaria', 'territorial'])) scoreF11 += 2
  if (estado.tipoFondo === 'Territorial') scoreF11 += 1
  if (scoreF11 >= 4) puntuaciones.push({ id: 'F11', muni: TERRITORIOS_FUERTES.F11, score: scoreF11 })

  // F12 â€” Caldas (PSA + pÃ¡ramos/cuencas + menciÃ³n Caldas)
  let scoreF12 = 0
  if (has(['caldas', 'manizales'])) scoreF12 += 2
  if (sPSA || sRestauracion || sSegHidrica || sCuencas) scoreF12 += 2
  if (has(['paramo', 'paramos', 'predios estrategicos'])) scoreF12 += 2
  if (estado.tipoFondo === 'Territorial') scoreF12 += 1
  if (scoreF12 >= 4) puntuaciones.push({ id: 'F12', muni: TERRITORIOS_FUERTES.F12, score: scoreF12 })

  // F13 â€” Valle de AburrÃ¡ (cuencas abastecedoras + PSA + AburrÃ¡)
  let scoreF13 = 0
  if (has(['aburra', 'valle de aburra', 'medellin'])) scoreF13 += 2
  if (sCuencas) scoreF13 += 2
  if (sPSA || sRestauracion || sSegHidrica) scoreF13 += 1
  if (estado.tipoFondo === 'Territorial') scoreF13 += 1
  if (scoreF13 >= 4) puntuaciones.push({ id: 'F13', muni: TERRITORIOS_FUERTES.F13, score: scoreF13 })

  // F14 â€” Santander / Norte de Santander (nororiente + seguridad hÃ­drica)
  let scoreF14 = 0
  const mNororiente = has(['nororiente', 'santander', 'norte de santander', 'bucaramanga', 'cucuta'])
  if (mNororiente) scoreF14 += 2
  if (sSegHidrica || sRestauracion || sPSA || sCuencas) scoreF14 += 2
  if (estado.tipoFondo === 'Territorial') scoreF14 += 1
  if (scoreF14 >= 4) {
    const muni = has(['norte de santander', 'cucuta', 'nororiente'])
      ? TERRITORIOS_FUERTES.F14_ALT
      : TERRITORIOS_FUERTES.F14
    puntuaciones.push({ id: 'F14', muni, score: scoreF14 })
  }

  if (puntuaciones.length === 0) return null
  const ordenadas = puntuaciones.sort((a, b) => b.score - a.score)
  // Regla de desempate conservadora: debe haber un ganador claro
  if (ordenadas.length > 1 && ordenadas[0].score - ordenadas[1].score < 2) return null

  return ordenadas[0].muni
}

// ─── Componente ──────────────────────────────────────────────────────────────
export function FlujoBuscadorNarrativo() {
  const [estado, setEstado] = useState<EstadoNarrativo>(ESTADO_INICIAL)
  const [mostrarResultados, setMostrarResultados] = useState(false)
  // Territorio de interés (opcional): para contexto de ranking futuro, no filtro duro
  const [municipioConsultaId, setMunicipioConsultaId] = useState<string | null>(null)

  const { catalogo, cargando: cargandoCatalogo, error: errorCatalogo } = useCatalogoNarrativa()
  const { resultados, total, cargando: cargandoBusqueda, error, buscar, limpiar } = useBusquedaNarrativa()
  const { perfil: perfilLegacy, cargando: cargandoPerfil, error: errorPerfil, crearORecuperar, recuperarPorCodigo, cerrarPerfil, actualizarPerfil } = usePerfilConsulta()
  // useLightSession siempre tiene el perfil actualizado (no depende del mount de usePerfilConsulta)
  const { perfil: perfilSession } = useLightSession()
  // Preferir perfil de LightSession (siempre sincronizado); caer a legacy si es necesario
  const perfil = perfilSession ?? perfilLegacy
  const { estado: loader, mostrar: mostrarLoader, ocultar: ocultarLoader } = useLoader()

  const refResultados = useRef<HTMLDivElement>(null)

  // Refs para "Cargar más" — no necesitan causar re-render
  const ultimosParamsRef = useRef<BusquedaNarrativaParams | null>(null)
  const offsetRef        = useRef<number>(0)
  const LIMIT            = 12

  function patchEstado(cambios: Partial<EstadoNarrativo>) {
    setEstado(prev => ({ ...prev, ...cambios }))
  }

  // ── ejecutar búsqueda ────────────────────────────────────────────────────
  const ejecutarBusqueda = useCallback(async (override?: Partial<EstadoNarrativo>) => {
    const e = override ? { ...estado, ...override } : estado

    // Inferencia territorial conservadora (solo fondos con restricciÃ³n fuerte)
    const inferido = inferirTerritorio(e, catalogo)
    const municipioActivo = municipioConsultaId ?? inferido ?? null
    if (inferido && inferido !== municipioConsultaId) {
      setMunicipioConsultaId(inferido)
    }

    const params: BusquedaNarrativaParams = {
      texto_narrativo:      e.refinadores.length ? e.refinadores.join(' | ') : null,
      sujeto_termino_id:    e.sujetoId,
      predicado_termino_id: e.predicadoId,
      verbo_ids:            e.verboIds.length > 0 ? e.verboIds : null,
      complemento_ids:      e.complementoIds.length > 0 ? e.complementoIds : null,
      tipo_desastre:        e.tipoDesastre,
      afectacion:           e.afectacion,
      tipo_fondo:           e.tipoFondo,
      presupuesto_usd:      e.presupuestoUSD,
      perfil_id:            perfil?.perfil_id ?? null,
      // Precedencia territorial (ver route.ts para la implementación):
      //   municipio_origen_id  = territorio del perfil → solo trazabilidad, nunca filtro duro
      //   municipio_consulta_id = "Territorio de interés" elegido → prioridad total si presente
      //   Si municipio_consulta_id es null, la búsqueda es territorialmente abierta.
      //   PROHIBIDO hacer: municipio_consulta_id: municipioConsultaId ?? perfil?.municipio_id
      municipio_origen_id:   perfil?.municipio_id ?? null,
      municipio_consulta_id: municipioActivo,
      limit:                LIMIT,
      offset:               0,
    }

    ultimosParamsRef.current = params
    offsetRef.current = 0

    setMostrarResultados(true)
    mostrarLoader('buscando', 'Analizando tu situación...')

    await buscar(params, false)

    ocultarLoader()
    setTimeout(() => {
      refResultados.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, municipioConsultaId, perfil, buscar, catalogo])

  // ── cargar más resultados (append) ───────────────────────────────────────
  const cargarMas = useCallback(async () => {
    if (!ultimosParamsRef.current || cargandoBusqueda) return
    offsetRef.current += LIMIT
    await buscar({ ...ultimosParamsRef.current, offset: offsetRef.current }, true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargandoBusqueda, buscar])

  // ── reset flujo ──────────────────────────────────────────────────────────
  function resetFlujo() {
    setEstado(ESTADO_INICIAL)
    setMunicipioConsultaId(null)
    limpiar()
    setMostrarResultados(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── catálogo por grupo ───────────────────────────────────────────────────
  const sujetos      = catalogo?.sujeto      ?? []
  const predicados   = catalogo?.predicado   ?? []
  const verbos       = catalogo?.verbo       ?? []
  const complementos = catalogo?.complemento ?? []
  const desastres    = catalogo?.desastre    ?? []
  const afectaciones = catalogo?.afectacion  ?? []

  // ── resumen para la barra sticky de resultados ────────────────────────────
  const resumen: ResumenNarrativoData = {
    sujetoNombre:        sujetos.find(t => t.id === estado.sujetoId)?.termino_canonico ?? null,
    predicadoNombre:     predicados.find(t => t.id === estado.predicadoId)?.termino_canonico ?? null,
    verbosNombres:       verbos.filter(t => estado.verboIds.includes(t.id)).map(t => t.termino_canonico),
    complementosNombres: complementos.filter(t => estado.complementoIds.includes(t.id)).map(t => t.termino_canonico),
    tipoDesastre:        estado.tipoDesastre,
    afectacion:          estado.afectacion,
    tipoFondo:           estado.tipoFondo,
    presupuestoUSD:      estado.presupuestoUSD,
  }
  const hayMas = total > 0 && resultados.length < total && !cargandoBusqueda

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      <UNGRDLoader visible={loader.visible} contexto={loader.contexto} subTexto={loader.subTexto} />

      {/* ── Error de catálogo ─────────────────────────────────────────── */}
      {errorCatalogo && (
        <div className="bg-red-600 text-white text-sm font-bold px-6 py-4 text-center">
          No se pudo cargar el catálogo de términos ({errorCatalogo}).
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="ml-3 underline hover:no-underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── Consulta Narrativa (frase interactiva + perfil) ─────────────── */}
      <ConsultaNarrativa
        sujetos={sujetos}
        predicados={predicados}
        verbos={verbos}
        complementos={complementos}
        desastres={desastres}
        afectaciones={afectaciones}
        cargandoCatalogo={cargandoCatalogo}
        sujetoId={estado.sujetoId}
        predicadoId={estado.predicadoId}
        verboIds={estado.verboIds}
        complementoIds={estado.complementoIds}
        tipoDesastre={estado.tipoDesastre}
        afectacion={estado.afectacion}
        tipoFondo={estado.tipoFondo}
        presupuestoUSD={estado.presupuestoUSD}
        refinadores={estado.refinadores}
        onSujeto={id => patchEstado({ sujetoId: id })}
        onPredicado={id => patchEstado({ predicadoId: id })}
        onVerbos={ids => patchEstado({ verboIds: ids })}
        onComplementos={ids => patchEstado({ complementoIds: ids })}
        onTipoDesastre={v => patchEstado({ tipoDesastre: v })}
        onAfectacion={v => patchEstado({ afectacion: v })}
        onTipoFondo={v => patchEstado({ tipoFondo: v })}
        onPresupuesto={v => patchEstado({ presupuestoUSD: v })}
        onRefinadores={ids => patchEstado({ refinadores: ids })}
        onBuscar={ejecutarBusqueda}
        cargandoBusqueda={cargandoBusqueda}
        perfil={perfil}
        cargandoPerfil={cargandoPerfil}
        errorPerfil={errorPerfil}
        crearORecuperar={crearORecuperar}
        recuperarPorCodigo={recuperarPorCodigo}
        actualizarPerfil={actualizarPerfil}
        cerrarPerfil={cerrarPerfil}
      />

      {/* ── Resultados ──────────────────────────────────────────────────── */}
      {mostrarResultados && (
        <div ref={refResultados} className="etapa-reveal">
          <EtapaResultadosNarrativa
            resultados={resultados}
            total={total}
            cargando={cargandoBusqueda}
            error={error}
            onNuevaBusqueda={resetFlujo}
            resumen={resumen}
            onEditar={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            hayMas={hayMas}
            onCargarMas={cargarMas}
            hayTerritorioConsulta={municipioConsultaId !== null}
          />
        </div>
      )}
    </>
  )
}
