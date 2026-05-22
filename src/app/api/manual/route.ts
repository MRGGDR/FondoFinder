/**
 * GET /api/manual
 * Sirve el PDF del instructivo/manual de usuario forzando descarga directa.
 * Evita problemas con espacios en la URL y el diálogo abrir/descargar
 * en navegadores móviles (Samsung Browser, Chrome Android, etc.).
 */

import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      'public',
      'fichas-fondos',
      'guia_usuario_financiamiento_PNGRD.pdf',
    )

    const buffer = await readFile(filePath)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Manual_Herramienta_Financiamiento.pdf"',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return new NextResponse('Manual no encontrado', { status: 404 })
  }
}
