import { pdf } from '@react-pdf/renderer'

export async function descargarPDF(
  fondo: any,
  municipio: { municipio_nombre: string; municipio_departamento: string } | null
) {
  const { FondoPDF } = await import('@/components/fondos/FondoPDF')
  const { default: React } = await import('react')

  const blob = await pdf(
    React.createElement(FondoPDF, { fondo, municipio })
  ).toBlob()

  const nombreLimpio = fondo.nombre
    .slice(0, 40)
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fondo-${fondo.id}-${nombreLimpio}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
