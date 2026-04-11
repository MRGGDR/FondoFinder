import {
  Document, Page, Text, View, StyleSheet, Image, Link
} from '@react-pdf/renderer'
import type { FondoConRelaciones, FondoInstructivo } from '@/types/database'

// ── Colores UNGRD ──────────────────────────────────────
const C = {
  navy:    '#213362',
  navyDark:'#071d4c',
  yellow:  '#FFCD00',
  gray:    '#6C7175',
  grayLight:'#F4F6FA',
  grayMid: '#E8ECF2',
  white:   '#FFFFFF',
  text:    '#1a1a2e',
  textMid: '#555566',
  red:     '#d80e25',
  blue:    '#223a7a',
}

// ── Estilos ────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.text,
    backgroundColor: C.white,
    paddingBottom: 80, // espacio para footer fijo
  },

  // ── HEADER ──
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
  // Franja tricolor
  tricolor: {
    flexDirection: 'row',
    height: 5,
  },
  tcYellow: { flex: 2, backgroundColor: '#ffc800' },
  tcNavy:   { flex: 1, backgroundColor: '#223a7a' },
  tcRed:    { flex: 1, backgroundColor: '#d80e25' },

  // ── BODY ──
  body: {
    paddingHorizontal: 36,
    paddingTop: 24,
  },

  // Tipo + ID
  fondoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
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
  fondoId: {
    fontSize: 9,
    color: C.gray,
    fontFamily: 'Helvetica-Bold',
  },

  // Nombre del fondo
  fondoNombre: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
    lineHeight: 1.2,
    marginBottom: 8,
  },

  // Entidad
  entidad: {
    fontSize: 9,
    color: C.gray,
    marginBottom: 4,
  },

  // Tags de procesos/beneficiarios
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 6,
  },
  tagLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    fontSize: 8,
    color: '#1B4472',
    fontFamily: 'Helvetica-Bold',
  },

  // Divisor
  divisor: {
    height: 1,
    backgroundColor: C.grayMid,
    marginVertical: 16,
  },

  // Secciones de acordeón
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

  // Panel de monto
  montoPanel: {
    backgroundColor: C.navy,
    borderRadius: 8,
    padding: 20,
    marginVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  montoLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  montoValor: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    letterSpacing: -0.5,
  },
  montoUSD: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginLeft: 4,
  },
  montoConversion: {
    alignItems: 'flex-end',
  },
  montoConvLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 4,
  },
  montoConvValor: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: C.yellow,
  },

  // Footer con enlace
  webRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.grayMid,
  },
  webLabel: {
    fontSize: 9,
    color: C.gray,
  },
  webLink: {
    fontSize: 9,
    color: C.navy,
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
  },

  // ── FOOTER FIJO ──
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
  footerPage: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.3)',
  },
})

// ── Helpers ────────────────────────────────────────────
function colorTipo(tipo: string) {
  if (tipo === 'Nacional')      return { backgroundColor: '#1B4472', color: '#fff' }
  if (tipo === 'Territorial')   return { backgroundColor: '#07519D', color: '#fff' }
  return { backgroundColor: '#213362', color: '#FFCD00' }
}

function formatNum(n: number | null): string {
  if (!n) return ''
  if (n >= 1_000_000) return `USD ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `USD ${(n / 1_000).toFixed(0)}K`
  return `USD ${n.toFixed(0)}`
}

function fechaHoy(): string {
  return new Date().toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

// ── Componente principal ───────────────────────────────
interface Props {
  fondo: FondoConRelaciones
  municipio?: { municipio_nombre: string; municipio_departamento: string } | null
  instructivo?: FondoInstructivo | null
}

const SECCIONES_PDF = [
  { titulo: 'Objetivo',                   campo: 'objetivos_fondo' },
  { titulo: 'Actividades que financia',   campo: 'actividades_apoyadas' },
  { titulo: 'Requisitos',                 campo: 'condiciones_elegibilidad' },
  { titulo: 'Cómo acceder',               campo: 'como_acceder' },
  { titulo: 'Monto disponible',           campo: 'monto_texto' },
  { titulo: 'Instrumentos',               campo: 'instrumentos' },
  { titulo: 'Normatividad',               campo: 'normatividad' },
]

export function FondoPDF({ fondo, municipio, instructivo }: Props) {
  const tipColor = colorTipo(fondo.tipo_fondo_categoria)

  return (
    <Document
      title={fondo.nombre}
      author="UNGRD - Herramienta"
      subject="Reporte de Fuente de Financiamiento"
    >
      <Page size="A4" style={S.page}>

        {/* ── HEADER ── */}
        <View style={S.header} fixed>
          <View style={S.headerTop}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image
              src="/logo-ungrd-blanco.png"
              style={S.logo}
            />
            <View style={S.headerMeta}>
              <Text style={S.headerTitle}>Reporte de Fuente de Financiamiento</Text>
              <Text style={S.headerDate}>Fecha: {fechaHoy()}</Text>
              {municipio && (
                <Text style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                  Municipio: {municipio.municipio_nombre} — {municipio.municipio_departamento}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Franja tricolor bajo el header */}
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
            <Text style={S.fondoId}>{fondo.id}</Text>
          </View>

          {/* Nombre */}
          <Text style={S.fondoNombre}>{fondo.nombre}</Text>

          {/* Entidad */}
          {fondo.entidad_encargada && (
            <Text style={S.entidad}>{fondo.entidad_encargada}</Text>
          )}

          {/* Procesos GRD */}
          {fondo.procesos && fondo.procesos.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={S.tagLabel}>Procesos GRD:</Text>
              <View style={S.tagsRow}>
                {fondo.procesos.map(p => (
                  <View key={p.id} style={S.tag}>
                    <Text>{p.nombre}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Beneficiarios */}
          {fondo.beneficiarios && fondo.beneficiarios.length > 0 && (
            <View style={{ marginTop: 6 }}>
              <Text style={S.tagLabel}>Dirigido a:</Text>
              <View style={S.tagsRow}>
                {fondo.beneficiarios.map(b => (
                  <View key={b.id} style={[S.tag, { backgroundColor: '#F4F6FA', color: C.gray }]}>
                    <Text style={{ color: C.gray }}>{b.nombre}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={S.divisor} />

          {/* ── Secciones ── */}
          {SECCIONES_PDF.map(sec => {
            const contenido = (fondo as any)[sec.campo]
            if (!contenido || (typeof contenido === 'string' && contenido.trim() === '')) return null
            if (sec.campo === 'monto_texto') return null
            return (
              <View key={sec.campo} style={S.seccion} wrap={false}>
                <View style={S.seccionHeader}>
                  <Text style={S.seccionTitulo}>{sec.titulo}</Text>
                </View>
                <Text style={S.seccionContenido}>{contenido}</Text>
              </View>
            )
          })}

          {/* ── Panel de monto ── */}
          {(fondo.monto_min_usd || fondo.monto_max_usd || fondo.monto_texto) && (
            <View style={S.montoPanel} wrap={false}>
              <View>
                <Text style={S.montoLabel}>Monto disponible</Text>
                {fondo.monto_min_usd ? (
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={S.montoValor}>
                      {formatNum(fondo.monto_min_usd)}
                      {fondo.monto_max_usd ? ` – ${formatNum(fondo.monto_max_usd)}` : ''}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 11, color: C.white, maxWidth: 300, lineHeight: 1.4 }}>
                    {fondo.monto_texto && fondo.monto_texto.length > 150
                      ? fondo.monto_texto.slice(0, 150) + '...'
                      : fondo.monto_texto}
                  </Text>
                )}
              </View>
              {fondo.monto_min_usd && (
                <View style={S.montoConversion}>
                  <Text style={S.montoConvLabel}>Equivalente aprox. COP</Text>
                  <Text style={S.montoConvValor}>
                    ~{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(fondo.monto_min_usd * 4200)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── Enlace web ── */}
          {fondo.pagina_web && (
            <View style={S.webRow} wrap={false}>
              <Text style={S.webLabel}>Sitio oficial:</Text>
              <Link src={fondo.pagina_web} style={S.webLink}>
                {fondo.pagina_web.replace('https://', '').replace('http://', '')}
              </Link>
            </View>
          )}

          {/* ── Paso a paso / Instructivo ── */}
          <View style={[S.divisor, { marginTop: 20 }]} />
          <View style={S.seccion} wrap={false}>
            <View style={[S.seccionHeader, { borderLeftColor: instructivo ? '#006633' : C.gray }]}>
              <Text style={S.seccionTitulo}>
                {instructivo ? 'Instructivo Paso a Paso' : 'Paso a Paso'}
              </Text>
            </View>
            {instructivo ? (
              <View>
                {instructivo.estado_convocatoria && (
                  <View style={{
                    backgroundColor: instructivo.estado_convocatoria.toUpperCase().includes('ABIERT')
                      ? '#e6f4ee'
                      : instructivo.estado_convocatoria.toUpperCase().includes('CERRAD')
                      ? '#fdecea'
                      : C.grayLight,
                    borderLeftWidth: 3,
                    borderLeftColor: instructivo.estado_convocatoria.toUpperCase().includes('ABIERT')
                      ? '#16a34a'
                      : instructivo.estado_convocatoria.toUpperCase().includes('CERRAD')
                      ? C.red
                      : C.grayMid,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 4,
                    marginBottom: 8,
                  }}>
                    <Text style={{
                      fontSize: 8,
                      fontFamily: 'Helvetica-Bold',
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      marginBottom: 3,
                      color: instructivo.estado_convocatoria.toUpperCase().includes('ABIERT')
                        ? '#006633'
                        : instructivo.estado_convocatoria.toUpperCase().includes('CERRAD')
                        ? C.red
                        : C.gray,
                    }}>Estado de convocatoria</Text>
                    <Text style={{ fontSize: 9, color: C.textMid, lineHeight: 1.5 }}>
                      {instructivo.estado_convocatoria}
                    </Text>
                  </View>
                )}
                {instructivo.descripcion && (
                  <Text style={[S.seccionContenido, { marginBottom: 6 }]}>
                    {instructivo.descripcion}
                  </Text>
                )}
                {instructivo.proceso_formulacion && (
                  <Text style={[S.seccionContenido, { marginBottom: 4 }]}>
                    <Text style={{ fontFamily: 'Helvetica-Bold', color: C.navy }}>Proceso: </Text>
                    {instructivo.proceso_formulacion}
                  </Text>
                )}
                {instructivo.fechas_clave && (
                  <Text style={[S.seccionContenido, { marginBottom: 4 }]}>
                    <Text style={{ fontFamily: 'Helvetica-Bold', color: C.navy }}>Fechas clave: </Text>
                    {instructivo.fechas_clave}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={[S.seccionContenido, { color: C.gray, fontStyle: 'italic' }]}>
                No hay un paso a paso definido para este fondo.
              </Text>
            )}
          </View>

        </View>

        {/* ── FOOTER FIJO ── */}
        <View style={S.footer} fixed>
          {/* Franja tricolor */}
          <View style={S.footerTricolor}>
            <View style={[S.tcYellow, { flex: 2 }]} />
            <View style={[S.tcNavy, { flex: 1 }]} />
            <View style={[S.tcRed, { flex: 1 }]} />
          </View>
          {/* Barra oscura */}
          <View style={S.footerBar}>
            <Text style={S.footerLeft}>www.gestiondelriesgo.gov.co</Text>
            <Text style={S.footerRight}>Herramienta — UNGRD  {new Date().getFullYear()}</Text>
          </View>
        </View>

      </Page>
    </Document>
  )
}
