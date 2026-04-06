import { pdf } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement, JSXElementConstructor } from 'react'
import type { FondoInstructivo } from '@/types/database'

function slugNombre(nombre: string): string {
  return nombre
    .slice(0, 40)
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
}

export async function descargarPDF(
  fondo: any,
  municipio: { municipio_nombre: string; municipio_departamento: string } | null,
  instructivo?: FondoInstructivo | null
) {
  const { FondoPDF } = await import('@/components/fondos/FondoPDF')
  const { default: React } = await import('react')

  const blob = await pdf(
    React.createElement(FondoPDF, { fondo, municipio, instructivo: instructivo ?? null }) as ReactElement<DocumentProps, string | JSXElementConstructor<any>>
  ).toBlob()

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fondo-${fondo.id}-${slugNombre(fondo.nombre)}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

export async function descargarPasoPDF(
  fondo: any,
  instructivo: FondoInstructivo
) {
  const { PasoPDF } = await import('@/components/fondos/PasoPDF')
  const { default: React } = await import('react')

  const blob = await pdf(
    React.createElement(PasoPDF, { fondo, instructivo }) as ReactElement<DocumentProps, string | JSXElementConstructor<any>>
  ).toBlob()

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `paso-a-paso-${fondo.id}-${slugNombre(fondo.nombre)}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
