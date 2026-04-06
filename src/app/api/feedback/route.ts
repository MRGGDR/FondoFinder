import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const tipo: string = typeof body.tipo === 'string' ? body.tipo.trim() : 'opinion'
    const valoracion: number | null =
      typeof body.valoracion === 'number' &&
      body.valoracion >= 1 &&
      body.valoracion <= 5
        ? body.valoracion
        : null
    const mensaje: string | null =
      typeof body.mensaje === 'string' && body.mensaje.trim().length > 0
        ? body.mensaje.trim().slice(0, 1000)
        : null
    const url_origen: string | null =
      typeof body.url_origen === 'string' ? body.url_origen.slice(0, 500) : null

    // Requerir al menos valoración o mensaje
    if (valoracion === null && !mensaje) {
      return NextResponse.json(
        { error: 'Se requiere valoración o mensaje.' },
        { status: 400 }
      )
    }

    const db = getDb()
    const { error } = await db.from('feedback_herramienta').insert({
      tipo,
      valoracion,
      mensaje,
      url_origen,
    })

    if (error) throw error

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
