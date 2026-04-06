import {
  Document, Page, Text, View, StyleSheet, Image
} from '@react-pdf/renderer'
import type { FondoConRelaciones } from '@/types/database'
import type { FondoInstructivo } from '@/types/database'

// ── Colores UNGRD ──────────────────────────────────────
const C = {
  navy:      '#213362',
  navyDark:  '#071d4c',
  yellow:    '#FFCD00',
  gray:      '#6C7175',
  grayLight: '#F4F6FA',
  grayMid:   '#E8ECF2',
  white:     '#FFFFFF',
  text:      '#1a1a2e',
  textMid:   '#555566',
  red:       '#d80e25',
  blue:      '#223a7a',
}

const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.text,
    backgroundColor: C.white,
    paddingBottom: 80,
  },
  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 36,
    paddingTop: 28,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  logo: {
    width: 140,
    height: 44,
    objectFit: 'contain',
    objectPosition: 'left center',
  },
  headerMeta: {
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerDate: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Helvetica-Bold',
  },
  tricolor: {
    flexDirection: 'row',
    height: 5,
  },
  tcYellow: { flex: 2, backgroundColor: '#ffc800' },
  tcNavy:   { flex: 1, backgroundColor: '#223a7a' },
  tcRed:    { flex: 1, backgroundColor: '#d80e25' },
  body: {
    paddingHorizontal: 36,
    paddingTop: 24,
  },
  fondoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  tipoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fondoNombre: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
    lineHeight: 1.2,
    marginBottom: 6,
  },
  entidad: {
    fontSize: 9,
    color: C.gray,
    marginBottom: 10,
  },
  // Estado convocatoria block
  estadoBlock: {
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
  },
  estadoLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  estadoTexto: {
    fontSize: 9,
    lineHeight: 1.5,
  },
  divisor: {
    height: 1,
    backgroundColor: C.grayMid,
    marginVertical: 14,
  },
  seccion: {
    marginBottom: 14,
  },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.grayLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 4,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: C.yellow,
  },
  seccionTitulo: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  seccionContenido: {
    fontSize: 10,
    color: C.textMid,
    lineHeight: 1.6,
    paddingHorizontal: 4,
  },
  paso: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 8,
  },
  pasoNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.navy,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pasoNumText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.yellow,
  },
  pasoTexto: {
    flex: 1,
    fontSize: 10,
    color: C.textMid,
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerTricolor: {
    flexDirection: 'row',
    height: 4,
  },
  footerBar: {
    backgroundColor: C.navyDark,
    paddingHorizontal: 36,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
  },
  footerRight: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
  },
})

// ── Helpers ────────────────────────────────────────────
function colorTipo(tipo: string) {
  if (tipo === 'Nacional')    return { backgroundColor: '#1B4472', color: '#fff' }
  if (tipo === 'Territorial') return { backgroundColor: '#07519D', color: '#fff' }
  return { backgroundColor: '#213362', color: '#FFCD00' }
}

function fechaHoy(): string {
  return new Date().toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function parsePasos(pasosJson: unknown): string[] | null {
  if (!pasosJson) return null
  try {
    const arr = typeof pasosJson === 'string' ? JSON.parse(pasosJson) : pasosJson
    if (Array.isArray(arr)) {
      return arr.map((p: unknown) => {
        if (typeof p === 'string') return p
        if (p && typeof p === 'object') {
          const obj = p as Record<string, unknown>
          // 'detalle' has the full step text; 'titulo' is truncated
          return String(obj.detalle ?? obj.descripcion ?? obj.texto ?? obj.paso ?? obj.text ?? obj.titulo ?? obj.title ?? '')
        }
        return String(p)
      }).filter(Boolean)
    }
  } catch {
    // ignore
  }
  return null
}

interface Props {
  fondo: Pick<FondoConRelaciones, 'id' | 'nombre' | 'tipo_fondo_categoria' | 'entidad_encargada'>
  instructivo: FondoInstructivo
}

export function PasoPDF({ fondo, instructivo }: Props) {
  const tipColor = colorTipo(fondo.tipo_fondo_categoria)
  const pasos = parsePasos(instructivo.pasos_json)

  const isAbierta = instructivo.estado_convocatoria?.toUpperCase().includes('ABIERT')
  const isCerrada = instructivo.estado_convocatoria?.toUpperCase().includes('CERRAD')
  const estadoColor = isAbierta ? '#006633' : isCerrada ? '#d80e25' : C.gray
  const estadoBg    = isAbierta ? '#e6f4ee'  : isCerrada ? '#fdecea'  : C.grayLight
  const estadoBorder = isAbierta ? '#16a34a' : isCerrada ? '#d80e25'  : C.grayMid

  return (
    <Document
      title={`Paso a Paso — ${fondo.nombre}`}
      author="UNGRD - FondosFinder"
      subject="Guía paso a paso de acceso a financiamiento"
    >
      <Page size="A4" style={S.page}>

        {/* ── HEADER ── */}
        <View style={S.header} fixed>
          <View style={S.headerTop}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src="/logo-ungrd-blanco.png" style={S.logo} />
            <View style={S.headerMeta}>
              <Text style={S.headerTitle}>Guía Paso a Paso — Acceso a Financiamiento</Text>
              <Text style={S.headerDate}>Fecha: {fechaHoy()}</Text>
            </View>
          </View>
        </View>

        {/* Franja tricolor */}
        <View style={S.tricolor} fixed>
          <View style={S.tcYellow} />
          <View style={S.tcNavy} />
          <View style={S.tcRed} />
        </View>

        {/* ── BODY ── */}
        <View style={S.body}>

          {/* Tipo + ID */}
          <View style={S.fondoMeta}>
            <View style={[S.tipoBadge, tipColor]}>
              <Text>{fondo.tipo_fondo_categoria}</Text>
            </View>
            <Text style={{ fontSize: 9, color: C.gray, fontFamily: 'Helvetica-Bold' }}>
              {fondo.id}
            </Text>
          </View>

          {/* Nombre */}
          <Text style={S.fondoNombre}>{fondo.nombre}</Text>

          {/* Entidad */}
          {fondo.entidad_encargada && (
            <Text style={S.entidad}>{fondo.entidad_encargada}</Text>
          )}

          {/* Estado convocatoria — bloque que envuelve texto largo */}
          {instructivo.estado_convocatoria && (
            <View style={[
              S.estadoBlock,
              { backgroundColor: estadoBg, borderLeftColor: estadoBorder },
            ]}>
              <Text style={[S.estadoLabel, { color: estadoColor }]}>Estado de convocatoria</Text>
              <Text style={[S.estadoTexto, { color: estadoColor }]}>
                {instructivo.estado_convocatoria}
              </Text>
            </View>
          )}

          <View style={S.divisor} />

          {/* ── Pasos numerados ── */}
          {pasos && pasos.length > 0 ? (
            <View style={S.seccion}>
              <View style={S.seccionHeader}>
                <Text style={S.seccionTitulo}>Pasos para Acceder</Text>
              </View>
              {pasos.map((texto, i) => (
                <View key={i} style={S.paso}>
                  <View style={S.pasoNum}>
                    <Text style={S.pasoNumText}>{i + 1}</Text>
                  </View>
                  <Text style={S.pasoTexto}>{texto}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 10, color: C.gray, fontStyle: 'italic' }}>
              No hay pasos definidos para este fondo.
            </Text>
          )}

        </View>

        {/* ── FOOTER FIJO ── */}
        <View style={S.footer} fixed>
          <View style={S.footerTricolor}>
            <View style={[S.tcYellow, { flex: 2 }]} />
            <View style={[S.tcNavy, { flex: 1 }]} />
            <View style={[S.tcRed, { flex: 1 }]} />
          </View>
          <View style={S.footerBar}>
            <Text style={S.footerLeft}>www.gestiondelriesgo.gov.co</Text>
            <Text style={S.footerRight}>
              FondosFinder — UNGRD  {new Date().getFullYear()}
            </Text>
          </View>
        </View>

      </Page>
    </Document>
  )
}
