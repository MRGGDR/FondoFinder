'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import {
  ACTORES,
  filterRows,
  distinct,
} from '@/config/buscador-top5'
import type { Top5Result } from '@/types/top5'
import { ResultadosTop5 } from './ResultadosTop5'

type Paso = 1 | 2 | 3 | 4 | 5

interface WizardState {
  actor: string | null
  paso2: string | null
  tema: string | null
  paso4: string | null
  chips: string[]
}

const INICIAL: WizardState = {
  actor: null,
  paso2: null,
  tema: null,
  paso4: null,
  chips: [],
}

const TERRITORIAL_WORDS = [
  'buenaventura',
  'valle del cauca',
  'valle de aburra',
  'valle de aburrá',
  'caldas',
  'santander',
  'norte de santander',
  'nororiente',
  'pacífico',
  'pacifico',
]

const TERRITORIAL_CODES: Record<string, string> = {
  F09: '76109', // Buenaventura
  F11: '76001', // Cali (Valle del Cauca)
  F12: '17001', // Manizales (Caldas)
  F13: '05001', // Medellín (Valle de Aburrá)
  F14: '68001', // Bucaramanga (Santander)
}

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function formatChipLabel(text: string): string {
  const trimmed = text.trim()
  // Mantener siglas en mayúsculas
  if (/^[A-Z0-9]{2,}$/.test(trimmed)) return trimmed
  // Capitalizar primera letra
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

function cleanRefinadores(raw: string[], tema: string | null): string[] {
  const temaNorm = normalize(tema ?? '')
  const cleaned = raw
    .map(ch => {
      let t = normalize(ch)
      // Quitar palabras territoriales
      TERRITORIAL_WORDS.forEach(w => { t = t.replace(w, '') })
      t = t.replace(/\s+/g, ' ').trim()
      return { orig: ch, norm: t }
    })
    .filter(({ norm }) => norm.length >= 3) // evitar “norte de”, etc.
    .filter(({ norm }) => {
      if (!norm) return false
      if (norm.startsWith('norte de')) return false
      if (temaNorm && (norm === temaNorm || temaNorm.includes(norm) || norm.includes(temaNorm))) return false
      return true
    })
    .map(({ norm, orig }) => {
      // Conservar PSA / PIEDB en mayúsculas
      const upper = orig.trim().toUpperCase()
      if (upper === 'PSA' || upper === 'PIEDB') return upper
      return formatChipLabel(norm)
    })

  const uniq = Array.from(new Set(cleaned))
  return uniq.sort((a, b) => a.localeCompare(b, 'es'))
}

function inferTerritorioCodigo(
  estado: WizardState,
  rowsVia: ReturnType<typeof filterRows>,
): string | null {
  const tTema = normalize(estado.tema ?? '')
  const chips = estado.chips.map(normalize)
  const has = (kw: string) => tTema.includes(kw) || chips.some(c => c.includes(kw))

  // 1) Si la ruta activa contiene un fondo territorial claro, usarlo
  const fondosTerritoriales = rowsVia
    .map(r => r.fondo_id)
    .filter(fid => fid && fid in TERRITORIAL_CODES) as Array<keyof typeof TERRITORIAL_CODES>
  if (fondosTerritoriales.length === 1) {
    return TERRITORIAL_CODES[fondosTerritoriales[0]]
  }

  // 2) Señales textuales explícitas en el tema o chips
  if (has('buenaventura')) return TERRITORIAL_CODES.F09
  if (has('valle del cauca') || has('cali')) return TERRITORIAL_CODES.F11
  if (has('caldas') || has('manizales') || has('paramo') || has('páramo')) return TERRITORIAL_CODES.F12
  if (has('aburra')) return TERRITORIAL_CODES.F13
  if (has('santander') || has('nororiente')) return TERRITORIAL_CODES.F14

  return null
}



// ── Icons & metadata ──────────────────────────────────────────────────────────

function WizardIcon({ type, className = 'w-6 h-6' }: { type: string; className?: string }) {
  const s: React.SVGProps<SVGSVGElement> = {
    viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round',
    className, 'aria-hidden': true,
  }
  switch (type) {
    case 'building':   return <svg {...s}><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-5h6v5"/><path d="M9 10h.01M15 10h.01M9 14h.01M15 14h.01"/></svg>
    case 'briefcase':  return <svg {...s}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><path d="M2 12a20 20 0 0020 0"/></svg>
    case 'flag':       return <svg {...s}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
    case 'users':      return <svg {...s}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
    case 'academic':   return <svg {...s}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
    case 'shield':     return <svg {...s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    case 'wrench':     return <svg {...s}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
    case 'leaf':       return <svg {...s}><path d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
    case 'currency':   return <svg {...s}><circle cx="12" cy="12" r="10"/><path d="M12 6v12M9.5 9.5c0-1.1 1.12-2 2.5-2s2.5.9 2.5 2-1.12 2-2.5 2-2.5.9-2.5 2 1.12 2 2.5 2 2.5-.9 2.5-2"/></svg>
    case 'lightbulb':  return <svg {...s}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 006 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/></svg>
    case 'globe':      return <svg {...s}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
    case 'water':      return <svg {...s}><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
    case 'tree':       return <svg {...s}><path d="M17 22V2L7 12l8 1-8 9"/></svg>
    case 'cloud':      return <svg {...s}><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>
    case 'map':        return <svg {...s}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
    case 'flask':      return <svg {...s}><path d="M6 2v6l-2 10h16L18 8V2"/><path d="M6 2h12"/><path d="M5 12h14"/></svg>
    case 'grain':      return <svg {...s}><path d="M2.27 21.7s9.87-3.5 12.73-6.36a4.5 4.5 0 00-6.36-6.37C5.77 11.84 2.27 21.7 2.27 21.7z"/><path d="M8.12 8.12A2 2 0 0113 6"/><path d="M22 20a9 9 0 00-9-8"/></svg>
    default:           return <svg {...s}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
  }
}

interface OptionMeta {
  icon: string
  desc: string
  ayuda?: {
    cuando: string
    cuandoNo: string
  }
}

/** Mapeo de valores internos del catálogo → etiqueta visible al usuario. No modificar los valores internos. */
const PASO2_LABEL_OVERRIDE: Record<string, string> = {
  'Buscar financiamiento, crédito o regalías': 'Crédito, banca o regalías',
}

const ACTOR_META: Record<string, OptionMeta> = {
  'Alcaldía / Municipio / Gobernación': {
    icon: 'building',
    desc: 'Para entidades territoriales que buscan recursos, apoyo o rutas para responder, recuperar, formular o ejecutar iniciativas.',
    ayuda: {
      cuando: 'Representas una alcaldía, una gobernación o una entidad pública territorial. La necesidad nace desde el territorio y la gestión se haría desde la administración pública local o departamental.',
      cuandoNo: 'Actúas principalmente como contratista, empresa privada, universidad o entidad financiera.',
    },
  },
  'Empresa / Entidad financiera / Cooperativa': {
    icon: 'briefcase',
    desc: 'Para empresas, cooperativas, operadores, entidades financieras y actores privados con interés en financiar, implementar o escalar soluciones.',
    ayuda: {
      cuando: 'La gestión se haría desde una empresa, una cooperativa, una entidad financiera, un operador o un aliado privado. Aplica cuando el interés está en crédito, inversión, negocios sostenibles, ejecución, articulación o instrumentos financieros.',
      cuandoNo: 'El actor principal es una entidad pública, una ONG o una universidad.',
    },
  },
  'Ministerio / Entidad nacional': {
    icon: 'flag',
    desc: 'Para ministerios, agencias, entidades del orden nacional y otras instituciones públicas con alcance nacional.',
    ayuda: {
      cuando: 'La gestión la lidera una entidad pública nacional o una institución con competencias nacionales. Sirve para buscar fondos, cooperación, convocatorias o mecanismos en los que aplica una entidad habilitada del orden nacional.',
      cuandoNo: 'La ruta principal corresponde a una alcaldía, una ONG, una universidad o una empresa privada.',
    },
  },
  'ONG / Fundación / Organización comunitaria': {
    icon: 'users',
    desc: 'Para fundaciones, asociaciones, organizaciones sociales, comunitarias y entidades sin ánimo de lucro.',
    ayuda: {
      cuando: 'La iniciativa la presentaría o implementaría una organización comunitaria, una fundación, una corporación o una ONG. Aplica especialmente en cooperación, proyectos territoriales, biodiversidad, adaptación y trabajo con comunidades.',
      cuandoNo: 'El actor principal es una entidad pública, una empresa o una universidad.',
    },
  },
  'Universidad / Investigación': {
    icon: 'academic',
    desc: 'Para universidades, centros de investigación, laboratorios, grupos académicos y actores de ciencia, tecnología e innovación.',
    ayuda: {
      cuando: 'La iniciativa la formulará o liderará una universidad, centro de investigación o actor del ecosistema de CTeI. Aplica especialmente para innovación, pilotos, investigación aplicada, ciencia del clima, tecnología y fortalecimiento técnico.',
      cuandoNo: 'La ruta principal corresponde a contratación pública, ejecución de obra o atención directa de emergencia desde una entidad territorial.',
    },
  },
}

const PASO2_META: Record<string, OptionMeta> = {
  'Atender emergencia o recuperación': {
    icon: 'shield',
    desc: 'Para respuesta, rehabilitación o recuperación frente a desastres ya ocurridos.',
    ayuda: {
      cuando: 'Ya existe una afectación y necesitas recursos, apoyo o mecanismos para responder, rehabilitar o recuperar. Aquí entran ayuda humanitaria, atención inmediata, rehabilitación de servicios esenciales o recuperación postevento.',
      cuandoNo: 'Todavía estás formulando un proyecto ambiental, una innovación o una ruta de financiamiento de mediano plazo.',
    },
  },
  'Ejecutar obra o contrato': {
    icon: 'wrench',
    desc: 'Para participar como contratista, operador, consultor o aliado en procesos financiados o por contratar.',
    ayuda: {
      cuando: 'Tu interés principal no es encontrar la fuente de recursos, sino ejecutar una obra, una consultoría, una interventoría, un suministro o un servicio. El foco está en procesos contractuales y mecanismos de contratación.',
      cuandoNo: 'Tu prioridad es estructurar o conseguir financiamiento para una iniciativa propia.',
    },
  },
  'Presentar proyecto ambiental o territorial': {
    icon: 'leaf',
    desc: 'Para iniciativas de conservación, adaptación, ordenamiento o desarrollo territorial.',
    ayuda: {
      cuando: 'Ya tienes una idea, iniciativa o proyecto y quieres encontrar fondos o mecanismos compatibles para presentarlo. Sirve para proyectos ambientales, territoriales, de cuencas, restauración, resiliencia, infraestructura local o desarrollo sostenible.',
      cuandoNo: 'Tu objetivo principal es investigación, contratación o atención inmediata de una emergencia.',
    },
  },
  'Buscar financiamiento, crédito o regalías': {
    icon: 'currency',
    desc: 'Para encontrar cómo estructurar o canalizar recursos hacia una iniciativa, proyecto o programa.',
    ayuda: {
      cuando: 'Tu prioridad es conseguir o estructurar recursos para que una iniciativa pueda avanzar. Aquí caben rutas como banca de desarrollo, crédito verde, regalías, cofinanciación, entidades acreditadas o mecanismos financieros similares.',
      cuandoNo: 'Lo que buscas es competir por una convocatoria o participar en un contrato ya financiado.',
    },
  },
  'Aplicar a convocatoria o cooperación': {
    icon: 'globe',
    desc: 'Para postular una iniciativa a convocatorias competitivas, cooperación internacional o programas de apoyo técnico y financiero.',
    ayuda: {
      cuando: 'Buscas un mecanismo competitivo de acceso: convocatorias abiertas, cooperación internacional, llamados temáticos o ventanas de aplicación directa. La lógica es postularse, competir, cumplir requisitos y presentar documentos.',
      cuandoNo: 'El acceso esperado es por solicitud institucional, banca, intermediación o contratación.',
    },
  },
  'Buscar innovación o investigación': {
    icon: 'lightbulb',
    desc: 'Para pilotos, investigación aplicada, tecnología, ciencia del clima o fortalecimiento técnico.',
    ayuda: {
      cuando: 'Buscas desarrollar, probar, investigar o escalar soluciones innovadoras. Aplica cuando la iniciativa tiene un componente fuerte de ciencia, tecnología, experimentación, conocimiento o validación técnica.',
      cuandoNo: 'El objetivo principal es responder a una emergencia, ejecutar una obra o buscar una convocatoria general sin foco en innovación.',
    },
  },
}

const PASO4_META: Record<string, OptionMeta> = {
  'Solicitud institucional': {
    icon: 'flag',
    desc: 'Para rutas que dependen de una solicitud, gestión o articulación formal entre entidades.',
    ayuda: {
      cuando: 'El acceso se da por gestión institucional, solicitud oficial, convenio, transferencia o articulación entre entidades. Aplica más cuando una entidad pública debe activar la ruta formalmente.',
      cuandoNo: 'La lógica principal es convocatoria abierta, banca o contratación.',
    },
  },
  'Contratación / SECOP': {
    icon: 'wrench',
    desc: 'Para procesos en los que la entrada real ocurre mediante contratación pública o selección de operadores.',
    ayuda: {
      cuando: 'La participación ocurrirá a través de un proceso contractual, convocatoria de proveedor, pliego, licitación o SECOP. Aplica para contratistas, operadores, consultores, interventores y empresas.',
      cuandoNo: 'La lógica es presentar un proyecto para financiamiento o aplicar a cooperación.',
    },
  },
  'Convocatoria o aplicación directa': {
    icon: 'globe',
    desc: 'Para fondos o programas a los que se accede postulando una propuesta bajo términos y fechas definidas.',
    ayuda: {
      cuando: 'El mecanismo implica una postulación, convocatoria abierta, formulario de aplicación o evaluación competitiva. Hay ventanas, requisitos, fechas y términos de referencia.',
      cuandoNo: 'La ruta depende más de banca, intermediación o convenio institucional.',
    },
  },
  'Intermediario / entidad acreditada / banca': {
    icon: 'currency',
    desc: 'Para rutas donde el acceso real pasa por una entidad financiera, un intermediario o una entidad acreditada.',
    ayuda: {
      cuando: 'No se accede directamente al recurso, sino a través de banca de desarrollo, una entidad acreditada, un fideicomiso, una institución financiera o un intermediario habilitado. Es clave en crédito, inversión, fondos climáticos y mecanismos financieros complejos.',
      cuandoNo: 'La lógica principal es un convenio directo, una convocatoria abierta o contratación pública.',
    },
  },
  'Alianza o articulación territorial/comunitaria': {
    icon: 'users',
    desc: 'Para rutas donde la clave está en asociarse con comunidades, organizaciones, autoridades o alianzas territoriales.',
    ayuda: {
      cuando: 'El proyecto necesita una alianza territorial, comunitaria, regional o multi-actor para poder ser presentado o implementado con más fuerza. Aplica bien en cuencas, conservación, restauración, trabajo comunitario y gobernanza territorial.',
      cuandoNo: 'El acceso real depende sobre todo de banca, convocatoria o contratación.',
    },
  },
}

function getTemaIcon(tema: string): string {
  const t = tema.toLowerCase()
  if (t.includes('humanitaria') || t.includes('emergencia') || t.includes('riesgo') || t.includes('rehabilitación') || t.includes('perdidas') || t.includes('pérdidas') || t.includes('daños')) return 'shield'
  if (t.includes('agua') || t.includes('hídrica') || t.includes('cuenca')) return 'water'
  if (t.includes('bosque') || t.includes('carbono') || t.includes('redd') || t.includes('forestal')) return 'tree'
  if (t.includes('agricultura') || t.includes('agropecuario')) return 'grain'
  if (t.includes('innovación') || t.includes('innovacion') || t.includes('ciencia') || t.includes('tecnología') || t.includes('preparación')) return 'lightbulb'
  if (t.includes('infraestructura') || t.includes('servicios públicos')) return 'building'
  if (t.includes('clima') || t.includes('climático') || t.includes('climática') || t.includes('emisiones') || t.includes('resiliencia')) return 'cloud'
  if (t.includes('social') || t.includes('etnocultura') || t.includes('negocios')) return 'briefcase'
  if (t.includes('cooperación') || t.includes('cooperacion') || t.includes('internacional')) return 'globe'
  if (t.includes('territorial') || t.includes('buenaventura') || t.includes('integral')) return 'map'
  if (t.includes('biodiversidad') || t.includes('restauración') || t.includes('ambiental')) return 'leaf'
  return 'leaf'
}

function getTemaDesc(tema: string): string {
  const t = tema.toLowerCase()
  if (t.includes('ayudas humanitarias')) return 'Atención directa de emergencias, albergues y recuperación temprana.'
  if (t.includes('gestión del riesgo')) return 'Reducción de riesgos, preparativos y atención de desastres.'
  if (t.includes('respuesta y rehabilitación')) return 'Atención, rehabilitación y recuperación ante emergencias locales.'
  if (t.includes('infraestructura y desarrollo integral')) return 'Proyectos de infraestructura y desarrollo integral para Buenaventura.'
  if (t.includes('infraestructura')) return 'Obras, redes, equipamientos y mejoras para servicios esenciales.'
  if (t.includes('adaptación climática sectorial')) return 'Acciones de adaptación en sectores específicos ante el cambio climático.'
  if (t.includes('adaptación climática')) return 'Proyectos que fortalecen la resiliencia frente al cambio climático.'
  if (t.includes('agricultura climáticamente')) return 'Prácticas agrícolas sostenibles y resistentes al clima.'
  if (t.includes('agricultura familiar')) return 'Apoyo a pequeños productores frente a variabilidad climática.'
  if (t.includes('agua y cuencas')) return 'Conservación y gestión sostenible de cuencas y fuentes hídricas.'
  if (t.includes('cuencas abastecedoras')) return 'Pagos por servicios ambientales e incentivos para conservar cuencas.'
  if (t.includes('cuencas y seguridad')) return 'Proyectos integrales de gestión del agua y seguridad hídrica.'
  if (t.includes('seguridad hídrica y restauración')) return 'Restauración ecosistémica combinada con seguridad del agua.'
  if (t.includes('biodiversidad')) return 'Protección de ecosistemas, especies y restauración ecológica.'
  if (t.includes('bosques') || t.includes('redd')) return 'Reducción de deforestación, manejo forestal y carbono.'
  if (t.includes('cambio climático y comunidad')) return 'Adaptación y mitigación climática a nivel comunitario.'
  if (t.includes('ciencia, tecnología')) return 'Investigación, innovación y desarrollo de capacidades técnicas.'
  if (t.includes('cooperación climática internacional')) return 'Acceso a fondos multilaterales y mecanismos de cooperación global.'
  if (t.includes('cooperación climática y desarrollo')) return 'Financiamiento climático internacional con enfoque de desarrollo sostenible.'
  if (t.includes('desarrollo resiliente')) return 'Iniciativas que combinan desarrollo sostenible y resiliencia climática.'
  if (t.includes('desarrollo territorial e innovación')) return 'Ordenamiento territorial con componente tecnológico e innovador.'
  if (t.includes('etnocultura')) return 'Desarrollo social e identidad cultural para comunidades étnicas.'
  if (t.includes('gestión ambiental')) return 'Gestión integrada del ambiente, cuencas y servicios ecosistémicos.'
  if (t.includes('innovación agropecuaria')) return 'Tecnología e innovación aplicadas al agro con enfoque climático.'
  if (t.includes('innovación e inclusión')) return 'Soluciones innovadoras con enfoque de resiliencia e inclusión social.'
  if (t.includes('innovación para resiliencia')) return 'Tecnología y conocimiento para fortalecer la resiliencia climática.'
  if (t.includes('negocios sostenibles')) return 'Crédito verde, finanzas sostenibles y modelos de negocio responsables.'
  if (t.includes('pérdidas y daños') || t.includes('perdidas y daños')) return 'Compensación y recuperación frente a pérdidas climáticas irreversibles.'
  if (t.includes('preparación de proyectos')) return 'Asistencia técnica para estructurar y formular proyectos climáticos.'
  if (t.includes('proyecto ambiental territorial')) return 'Iniciativas de conservación y ordenamiento ambiental local.'
  if (t.includes('resiliencia climática programática')) return 'Programas de largo plazo para aumentar la resiliencia sistémica.'
  if (t.includes('innovación')) return 'Soluciones tecnológicas e innovación para la resiliencia climática.'
  return 'Ver fondos disponibles para esta área temática.'
}

interface WizardTop5Props {
  /**
   * Modo de uso: standalone (página completa) o embedded (widget).
   * Solo afecta layout; la lógica de pasos y búsqueda permanece igual.
   */
  variant?: 'standalone' | 'embedded'
  /**
   * Forzar encabezado introductorio cuando variant=embedded.
   */
  showHeader?: boolean
}

export function WizardTop5({ variant = 'standalone', showHeader }: WizardTop5Props = {}) {
  const isEmbedded = variant === 'embedded'
  const showIntro = showHeader ?? !isEmbedded
  const topRef = useRef<HTMLDivElement>(null)
  const stepRefs = useRef<{ [K in Paso]: HTMLDivElement | null }>({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
  })
  const prevPasoRef = useRef<Paso>(1)

  const [paso, setPaso] = useState<Paso>(1)
  const [estado, setEstado] = useState<WizardState>(INICIAL)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultados, setResultados] = useState<Top5Result[]>([])
  const [ayudaAbierta, setAyudaAbierta] = useState<string | null>(null)

  // Subconjuntos activos
  const rowsActor   = useMemo(() => filterRows({ actor: estado.actor }), [estado.actor])
  const rowsPaso2   = useMemo(() => filterRows({ actor: estado.actor, paso2: estado.paso2 }), [estado.actor, estado.paso2])
  const rowsTema    = useMemo(() => filterRows({ actor: estado.actor, paso2: estado.paso2, tema: estado.tema }), [estado.actor, estado.paso2, estado.tema])
  const rowsVia     = useMemo(() => filterRows({ actor: estado.actor, paso2: estado.paso2, tema: estado.tema, via: estado.paso4 }), [estado.actor, estado.paso2, estado.tema, estado.paso4])

  const opcionesPaso2 = useMemo(() => distinct(rowsActor.map(r => r.paso_2_ui)), [rowsActor])
  const opcionesTema  = useMemo(() => distinct(rowsPaso2.map(r => r.paso_3_tema_principal)), [rowsPaso2])
  const opcionesVia   = useMemo(() => distinct(rowsTema.map(r => r.paso_4_ui)), [rowsTema])

  const chipsDisponibles = useMemo(
    () => cleanRefinadores(distinct(rowsVia.flatMap(r => r.refinadores)), estado.tema),
    [rowsVia, estado.tema],
  )

  const totalPasos = 4

  function setActor(val: string) {
    setEstado({ ...INICIAL, actor: val })
    setPaso(2)
    setResultados([])
    setError(null)
  }
  function setPaso2(val: string) {
    setEstado(prev => ({ ...prev, paso2: val, tema: null, paso4: null, chips: [] }))
    setPaso(3)
    setResultados([])
    setError(null)
  }
  function setTema(val: string) {
    setEstado(prev => ({ ...prev, tema: val, paso4: null, chips: [] }))
    setPaso(4)
    setResultados([])
    setError(null)
  }
  function setVia(val: string) {
    setEstado(prev => ({ ...prev, paso4: val, chips: [] }))
    // paso se mantiene en 4, refinadores + buscar se manejan en el mismo paso
    setResultados([])
    setError(null)
  }

  async function ejecutarBusqueda() {
    if (!estado.actor || !estado.paso2 || !estado.paso4) return
    setCargando(true)
    setError(null)
    try {
      const territorioCodigo = inferTerritorioCodigo(estado, rowsVia)
      const payload = {
        p_actor_ui: estado.actor,
        p_paso2_ui: estado.paso2,
        p_paso4_ui: estado.paso4,
        p_territorio_codigo: territorioCodigo,
        p_chips: estado.chips.length ? estado.chips : null,
        p_texto_libre: null,
      }

      const res = await fetch('/api/busqueda/top5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }
      const json = await res.json() as { resultados: Top5Result[] }
      setResultados(json.resultados ?? [])
      setPaso(5)

    } catch (e) {
      setError((e as Error).message ?? 'Error desconocido')
      setResultados([])
    } finally {
      setCargando(false)
    }
  }

  const resumen = useMemo(() => {
    const items: string[] = []
    if (estado.actor) items.push(estado.actor)
    if (estado.paso2) items.push(estado.paso2)
    if (estado.tema) items.push(estado.tema)
    if (estado.paso4) items.push(estado.paso4)
    const terr = inferTerritorioCodigo(estado, rowsVia)
    if (terr) items.push(`DIVIPOLA ${terr}`)
    return items
  }, [estado, rowsVia])

  useEffect(() => {
    // scroll al inicio solo cuando el usuario reinicia (venía de paso > 1)
    if (paso === 1 && prevPasoRef.current > 1 && topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    // desplaza al siguiente bloque cuando avanzamos
    if (paso > prevPasoRef.current) {
      const target = stepRefs.current[paso]
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    prevPasoRef.current = paso
  }, [paso])

  return (
    <div ref={topRef}>

      {/* ── PASO 1 — ¿Quién eres? (estilo EtapaTipo) ─────────────────────── */}
      {paso >= 1 && (
        <div ref={el => { stepRefs.current[1] = el }} className="etapa-reveal">
          <section className="bg-[#f6fafe] py-24 border-b border-gray-100"
            aria-labelledby="paso1-titulo">
            <div className="max-w-6xl mx-auto px-6 md:px-12">
              <div className="flex flex-col md:flex-row gap-16 items-center">

                {/* Texto izquierda */}
                <div className="w-full md:w-1/3 shrink-0">
                  <span className="text-6xl font-black text-[#FFCD00] block mb-2">01</span>
                  <h2 id="paso1-titulo"
                    className="text-4xl font-black text-[#213362] mb-6">
                    ¿Quién eres?
                  </h2>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    Selecciona el perfil que mejor representa a la entidad, organización o tipo de actor que haría la gestión.
                  </p>
                </div>

                {/* Cards de actores */}
                <div className="w-full md:w-2/3">
                  <div className="flex flex-wrap justify-center gap-4">
                    {ACTORES.map(actor => {
                      const isSelected = estado.actor === actor
                      const helpKey = `p1:${actor}`
                      const helpOpen = ayudaAbierta === helpKey
                      return (
                        <div key={actor} className="w-full sm:w-[calc(50%-8px)] max-w-[460px]">
                          <button
                            onClick={() => setActor(actor)}
                            className={[
                              'rounded-2xl px-7 py-6 flex flex-row items-start gap-5 transition-all text-left w-full',
                              isSelected
                                ? 'bg-[#213362] text-white shadow-2xl shadow-[#213362]/30 border-2 border-[#213362]'
                                : 'bg-white border-2 border-gray-200 hover:border-[#213362] hover:shadow-xl',
                            ].join(' ')}
                          >
                            <WizardIcon
                              type={ACTOR_META[actor]?.icon ?? 'building'}
                              className={`w-5 h-5 mt-0.5 shrink-0 ${isSelected ? 'text-[#FFCD00]' : 'text-[#07519D]'}`}
                            />
                            <div>
                              <h4 className={`text-base font-black mb-1.5 leading-snug ${isSelected ? 'text-white' : 'text-[#213362]'}`}>
                                {actor}
                              </h4>
                              {ACTOR_META[actor]?.desc && (
                                <p className={`text-xs font-medium leading-snug ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
                                  {ACTOR_META[actor].desc}
                                </p>
                              )}
                              {isSelected && (
                                <span className="mt-2 inline-block bg-[#FFCD00] text-[#213362] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                  Activo
                                </span>
                              )}
                            </div>
                          </button>
                          {ACTOR_META[actor]?.ayuda && (
                            <button
                              type="button"
                              onClick={() => setAyudaAbierta(helpOpen ? null : helpKey)}
                              className="mt-1.5 text-xs text-[#07519D] hover:text-[#213362] font-medium px-2 transition-colors"
                            >
                              {helpOpen ? '▲ Cerrar ayuda' : '▼ ¿Cuándo usar esta opción?'}
                            </button>
                          )}
                          {helpOpen && ACTOR_META[actor]?.ayuda && (
                            <div className="mt-1 p-4 bg-[#f0f7ff] rounded-xl text-xs text-gray-600 border border-[#cce0f5] leading-relaxed">
                              <p className="font-bold text-[#213362] mb-1">Cuándo escoger esta opción</p>
                              <p className="mb-3">{ACTOR_META[actor].ayuda!.cuando}</p>
                              <p className="font-bold text-[#213362] mb-1">Cuándo no escogerla</p>
                              <p>{ACTOR_META[actor].ayuda!.cuandoNo}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── PASO 2 — ¿Qué necesitas? (estilo EtapaProceso) ───────────────── */}
      {paso >= 2 && (
        <div ref={el => { stepRefs.current[2] = el }} className="etapa-reveal">
          <section className="bg-[#f0f4f9] py-32 border-y border-gray-200"
            aria-labelledby="paso2-titulo">
            <div className="max-w-6xl mx-auto px-6 md:px-12">

              <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="text-6xl font-black text-[#FFCD00] block mb-2">02</span>
                <h2 id="paso2-titulo" className="text-4xl font-black text-[#213362] mb-6">
                  ¿Qué necesitas?
                </h2>
                <p className="text-gray-500 font-medium leading-relaxed">
                  Elige la opción que mejor describe tu necesidad principal en este momento.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-8"
                role="radiogroup" aria-label="Tipo de necesidad">
                {opcionesPaso2.map(opt => {
                  const isSelected = estado.paso2 === opt
                  const displayLabel = PASO2_LABEL_OVERRIDE[opt] ?? opt
                  const helpKey = `p2:${opt}`
                  const helpOpen = ayudaAbierta === helpKey
                  return (
                    <div key={opt} className="w-full md:w-[calc(50%-16px)] max-w-[480px]">
                      <button
                        onClick={() => setPaso2(opt)}
                        role="radio"
                        aria-checked={isSelected}
                        className={[
                          'relative bg-white rounded-[2rem] p-10 border-2 text-left transition-all w-full',
                          isSelected
                            ? 'border-[#213362] bg-[#213362]/5 shadow-xl'
                            : 'border-transparent hover:shadow-xl hover:border-gray-200',
                        ].join(' ')}
                      >
                        <WizardIcon
                          type={PASO2_META[opt]?.icon ?? 'lightbulb'}
                          className={`w-6 h-6 mb-4 ${isSelected ? 'text-[#213362]' : 'text-[#07519D]'}`}
                        />
                        <h4 className="text-xl font-black text-[#213362] mb-2">{displayLabel}</h4>
                        {PASO2_META[opt]?.desc && (
                          <p className="text-sm text-gray-400 font-medium leading-snug">
                            {PASO2_META[opt].desc}
                          </p>
                        )}
                        {isSelected && (
                          <span className="absolute -top-3 -right-3 bg-[#213362] text-white
                            p-2 rounded-full shadow-lg flex items-center justify-center
                            w-8 h-8 text-sm font-black">✓</span>
                        )}
                      </button>
                      {PASO2_META[opt]?.ayuda && (
                        <button
                          type="button"
                          onClick={() => setAyudaAbierta(helpOpen ? null : helpKey)}
                          className="mt-1.5 text-xs text-[#07519D] hover:text-[#213362] font-medium px-2 transition-colors"
                        >
                          {helpOpen ? '▲ Cerrar ayuda' : '▼ ¿Cuándo usar esta opción?'}
                        </button>
                      )}
                      {helpOpen && PASO2_META[opt]?.ayuda && (
                        <div className="mt-1 p-4 bg-[#f0f7ff] rounded-xl text-xs text-gray-600 border border-[#cce0f5] leading-relaxed">
                          <p className="font-bold text-[#213362] mb-1">Cuándo escoger esta opción</p>
                          <p className="mb-3">{PASO2_META[opt].ayuda!.cuando}</p>
                          <p className="font-bold text-[#213362] mb-1">Cuándo no escogerla</p>
                          <p>{PASO2_META[opt].ayuda!.cuandoNo}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="text-center mt-10">
                <button
                  onClick={() => setPaso(1)}
                  className="text-sm text-gray-400 hover:text-[#213362] font-medium transition-colors underline-offset-4 hover:underline"
                >
                  ← Cambiar perfil
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── PASO 3 — ¿Sobre qué tema? (estilo EtapaProceso variante) ──────── */}
      {paso >= 3 && (
        <div ref={el => { stepRefs.current[3] = el }} className="etapa-reveal">
          <section className="bg-[#f6fafe] py-32 border-b border-gray-100"
            aria-labelledby="paso3-titulo">
            <div className="max-w-6xl mx-auto px-6 md:px-12">

              <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="text-6xl font-black text-[#FFCD00] block mb-2">03</span>
                <h2 id="paso3-titulo" className="text-4xl font-black text-[#213362] mb-6">
                  ¿Sobre qué tema?
                </h2>
                <p className="text-gray-500 font-medium leading-relaxed">
                  Selecciona el tema que más se parece al núcleo de tu iniciativa o necesidad.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-6"
                role="radiogroup" aria-label="Tema principal">
                {opcionesTema.map(opt => {
                  const isSelected = estado.tema === opt
                  return (
                    <button
                      key={opt}
                      onClick={() => setTema(opt)}
                      role="radio"
                      aria-checked={isSelected}
                      className={[
                        'relative bg-white rounded-3xl p-8 text-left border-2 transition-all w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-[360px]',
                        isSelected
                          ? 'bg-[#213362] border-[#213362] shadow-2xl shadow-[#213362]/30 text-white'
                          : 'border-gray-200 hover:border-[#213362] hover:shadow-xl',
                      ].join(' ')}
                    >
                      <WizardIcon
                        type={getTemaIcon(opt)}
                        className={`w-5 h-5 mb-3 ${isSelected ? 'text-[#FFCD00]' : 'text-[#07519D]'}`}
                      />
                      <h4 className={`text-lg font-black mb-2 ${isSelected ? 'text-white' : 'text-[#213362]'}`}>{opt}</h4>
                      <p className={`text-xs font-medium leading-snug ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
                        {getTemaDesc(opt)}
                      </p>
                      {isSelected && (
                        <span className="mt-3 inline-block bg-[#FFCD00] text-[#213362] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                          Activo
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="text-center mt-10">
                <button
                  onClick={() => setPaso(2)}
                  className="text-sm text-gray-400 hover:text-[#213362] font-medium transition-colors underline-offset-4 hover:underline"
                >
                  ← Cambiar necesidad
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── PASO 4 — ¿Cómo acceder? + Refinadores (estilo EtapaPresupuesto) ─ */}
      {paso >= 4 && (
        <div ref={el => { stepRefs.current[4] = el }} className="etapa-reveal">
          <section className="bg-[#213362] text-white py-32 relative overflow-hidden"
            aria-labelledby="paso4-titulo">
            <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
              <div className="grid md:grid-cols-2 gap-16 items-start">

                {/* Izquierda — selección de vía */}
                <div>
                  <span className="text-6xl font-black text-[#FFCD00] block mb-4">04</span>
                  <h2 id="paso4-titulo" className="text-5xl font-black mb-8">
                    ¿Cómo esperas{' '}
                    <br />
                    <span className="text-[#FFCD00]">acceder?</span>
                  </h2>
                  <p className="text-xl text-white/60 mb-10 leading-relaxed">
                    Selecciona la vía por la que crees que esa necesidad podría convertirse en recursos, apoyo o implementación.
                  </p>
                  <div className="space-y-4" role="radiogroup" aria-label="Vía de acceso">
                    {opcionesVia.map(opt => {
                      const isSelected = estado.paso4 === opt
                      const helpKey = `p4:${opt}`
                      const helpOpen = ayudaAbierta === helpKey
                      return (
                        <div key={opt}>
                          <button
                            onClick={() => setVia(opt)}
                            role="radio"
                            aria-checked={isSelected}
                            className={[
                              'w-full text-left p-6 rounded-2xl border-2 transition-all',
                              isSelected
                                ? 'bg-[#FFCD00] text-[#213362] border-[#FFCD00]'
                                : 'bg-white/10 border-white/20 text-white hover:bg-white/20',
                            ].join(' ')}
                          >
                            <p className="font-black text-lg leading-snug">{opt}</p>
                            {PASO4_META[opt]?.desc && (
                              <p className={`text-xs font-medium mt-1 leading-snug ${isSelected ? 'text-[#213362]/70' : 'text-white/50'}`}>
                                {PASO4_META[opt].desc}
                              </p>
                            )}
                          </button>
                          {PASO4_META[opt]?.ayuda && (
                            <button
                              type="button"
                              onClick={() => setAyudaAbierta(helpOpen ? null : helpKey)}
                              className="mt-1.5 text-xs text-white/50 hover:text-white font-medium px-2 transition-colors"
                            >
                              {helpOpen ? '▲ Cerrar ayuda' : '▼ ¿Cuándo usar esta opción?'}
                            </button>
                          )}
                          {helpOpen && PASO4_META[opt]?.ayuda && (
                            <div className="mt-1 p-4 bg-white/10 rounded-xl text-xs text-white/80 border border-white/20 leading-relaxed">
                              <p className="font-bold text-[#FFCD00] mb-1">Cuándo escoger esta opción</p>
                              <p className="mb-3">{PASO4_META[opt].ayuda!.cuando}</p>
                              <p className="font-bold text-[#FFCD00] mb-1">Cuándo no escogerla</p>
                              <p>{PASO4_META[opt].ayuda!.cuandoNo}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => setPaso(3)}
                    className="mt-8 text-sm text-white/40 hover:text-white font-medium transition-colors underline-offset-4 hover:underline"
                  >
                    ← Cambiar tema
                  </button>
                </div>

                {/* Derecha — refinadores + CTA */}
                <div className="bg-white/5 rounded-[3rem] p-12 border border-white/10">
                  <h3 className="text-2xl font-black mb-2">Refinar búsqueda</h3>
                  <p className="text-white/40 text-sm mb-8">Opcional · añade detalles para priorizar mejor.</p>

                  {chipsDisponibles.length === 0 ? (
                    <p className="text-white/30 text-sm italic mb-8">
                      No hay refinadores disponibles para esta combinación.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-3 mb-8">
                      {chipsDisponibles.map(chip => {
                        const active = estado.chips.includes(chip)
                        return (
                          <button
                            key={chip}
                            onClick={() =>
                              setEstado(prev => ({
                                ...prev,
                                chips: active
                                  ? prev.chips.filter(c => c !== chip)
                                  : [...prev.chips, chip],
                              }))
                            }
                            className={[
                              'px-4 py-2 rounded-full text-sm font-bold border-2 transition-all',
                              active
                                ? 'bg-[#FFCD00] text-[#213362] border-[#FFCD00]'
                                : 'bg-white/10 border-white/20 text-white hover:bg-white/20',
                            ].join(' ')}
                          >
                            {chip}
                          </button>
                        )
                      })}
                      {estado.chips.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setEstado(prev => ({ ...prev, chips: [] }))}
                          className="text-xs font-semibold text-white/30 hover:text-white self-center"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={ejecutarBusqueda}
                    disabled={!estado.paso4 || cargando}
                    className="w-full mt-2 py-5 bg-[#FFCD00] text-[#213362] rounded-2xl font-black
                      text-lg shadow-2xl shadow-[#FFCD00]/20 hover:brightness-110 transition-all
                      uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {cargando ? 'Buscando...' : 'Encontrar fondos →'}
                  </button>
                </div>

              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── PASO 5 — Resultados (estilo EtapaResultados) ─────────────────── */}
      {paso === 5 && (
        <div
          ref={el => { stepRefs.current[5] = el as HTMLDivElement | null }}
          className="etapa-reveal"
        >
          <section className="bg-[#f6fafe] min-h-screen">
            <div className="bg-[#f6fafe] border-b border-gray-100 py-8">
              <div className="max-w-6xl mx-auto px-6 md:px-12 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-3xl font-black text-[#213362]">
                    {cargando ? 'Buscando...' : `${resultados.length} fondos recomendados para ti`}
                  </h2>
                  <p className="text-gray-400 font-medium mt-1 text-sm">
                    Estos resultados se ordenan por afinidad con lo que seleccionaste en el buscador.
                  </p>
                </div>
                <button
                  onClick={() => { setEstado(INICIAL); setPaso(1); setResultados([]); setError(null) }}
                  className="text-sm font-bold text-[#07519D] underline underline-offset-2 hover:text-[#213362] transition-colors"
                >
                  ← Nueva búsqueda
                </button>
              </div>
            </div>
            <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
              <ResultadosTop5
                resultados={resultados}
                cargando={cargando}
                error={error}
                onRetry={ejecutarBusqueda}
              />
            </div>
          </section>
        </div>
      )}

      {/* Error fuera del paso 5 */}
      {error && paso < 5 && (
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4 text-sm">{error}</div>
        </div>
      )}

    </div>
  )
}
