'use client'

import { useState } from 'react'

type Vista = 'boton' | 'formulario' | 'enviado'

const TIPO_OPTIONS = [
  { value: 'sugerencia', label: 'Mejora' },
  { value: 'error', label: 'Reportar un error' },
  { value: 'opinion', label: 'Opinión general' },
  { value: 'otro', label: 'Otro' },
]

const VALORACION_OPTIONS = [
  { value: 5, emoji: '😄', label: 'Muy útil' },
  { value: 4, emoji: '🙂', label: 'Útil' },
  { value: 3, emoji: '😐', label: 'Regular' },
  { value: 2, emoji: '🙁', label: 'Poco útil' },
  { value: 1, emoji: '😞', label: 'No me sirvió' },
]

export function FeedbackWidget() {
  const [vista, setVista] = useState<Vista>('boton')
  const [tipo, setTipo] = useState('opinion')
  const [valoracion, setValoracion] = useState<number | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function abrir() {
    setVista('formulario')
    setErrorMsg(null)
  }

  function cerrar() {
    setVista('boton')
    setTipo('opinion')
    setValoracion(null)
    setMensaje('')
    setErrorMsg(null)
  }

  async function enviar() {
    if (!mensaje.trim() && valoracion === null) {
      setErrorMsg('Escribe un comentario o selecciona una valoración.')
      return
    }
    setEnviando(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          valoracion,
          mensaje: mensaje.trim() || null,
          url_origen: typeof window !== 'undefined' ? window.location.pathname : null,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }
      setVista('enviado')
    } catch (e) {
      setErrorMsg((e as Error).message ?? 'No se pudo enviar. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  // ── Botón flotante ──────────────────────────────────────────────────────
  if (vista === 'boton') {
    return (
      <button
        onClick={abrir}
        aria-label="Dejar comentario o sugerencia"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#213362] text-white
          pl-4 pr-5 py-3 rounded-full shadow-2xl shadow-[#213362]/40
          hover:bg-[#07519D] active:scale-95 transition-all text-sm font-black
          border-2 border-white/10"
      >
        {/* Icono burbuja de chat */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0" aria-hidden>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        Comentarios
      </button>
    )
  }

  // ── Formulario / Confirmación ──────────────────────────────────────────
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={cerrar}
        aria-hidden
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Deja tu comentario"
        className="fixed bottom-6 right-6 z-50 w-[340px] max-w-[calc(100vw-24px)]
          bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="bg-[#213362] px-6 pt-5 pb-4 flex items-start justify-between">
          <div>
            <h2 className="text-white font-black text-base leading-tight">
              {vista === 'enviado' ? '¡Gracias por tu opinión!' : '¿Cómo te fue con la herramienta?'}
            </h2>
            {vista !== 'enviado' && (
              <p className="text-white/60 text-xs mt-1">Tu comentario nos ayuda a mejorar.</p>
            )}
          </div>
          <button
            onClick={cerrar}
            aria-label="Cerrar"
            className="text-white/50 hover:text-white transition-colors ml-4 mt-0.5 shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
              strokeLinecap="round" className="w-5 h-5" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Cuerpo enviado */}
        {vista === 'enviado' && (
          <div className="p-6 text-center">
            <div className="text-5xl mb-3">🙌</div>
            <p className="text-[#213362] font-bold text-sm leading-relaxed">
              Tu comentario fue registrado correctamente. Lo usaremos para seguir mejorando la herramienta.
            </p>
            <button
              onClick={cerrar}
              className="mt-5 w-full bg-[#213362] text-white rounded-2xl py-3 font-black text-sm
                hover:bg-[#07519D] transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Cuerpo formulario */}
        {vista === 'formulario' && (
          <div className="p-5 space-y-4">
            {/* Valoración */}
            <div>
              <p className="text-xs font-black text-[#213362] uppercase tracking-wide mb-2">
                ¿Cómo valoras la herramienta?
              </p>
              <div className="flex gap-2 justify-between">
                {VALORACION_OPTIONS.map(op => (
                  <button
                    key={op.value}
                    type="button"
                    onClick={() => setValoracion(op.value)}
                    title={op.label}
                    className={[
                      'flex-1 py-2 rounded-xl text-xl border-2 transition-all',
                      valoracion === op.value
                        ? 'border-[#213362] bg-[#213362]/10 scale-110'
                        : 'border-gray-100 hover:border-gray-300 bg-gray-50',
                    ].join(' ')}
                  >
                    {op.emoji}
                  </button>
                ))}
              </div>
              {valoracion !== null && (
                <p className="text-xs text-gray-400 mt-1 text-center">
                  {VALORACION_OPTIONS.find(o => o.value === valoracion)?.label}
                </p>
              )}
            </div>

            {/* Tipo */}
            <div>
              <p className="text-xs font-black text-[#213362] uppercase tracking-wide mb-2">
                Tipo de comentario
              </p>
              <div className="flex flex-wrap gap-2">
                {TIPO_OPTIONS.map(op => (
                  <button
                    key={op.value}
                    type="button"
                    onClick={() => setTipo(op.value)}
                    className={[
                      'px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all',
                      tipo === op.value
                        ? 'bg-[#213362] text-white border-[#213362]'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-[#213362]',
                    ].join(' ')}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mensaje */}
            <div>
              <p className="text-xs font-black text-[#213362] uppercase tracking-wide mb-2">
                Cuéntanos más (opcional)
              </p>
              <textarea
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="¿Qué te gustó, qué mejorarías o qué fallo encontraste?"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm
                  focus:outline-none focus:border-[#213362] resize-none text-gray-700
                  placeholder:text-gray-300"
              />
              <p className="text-right text-[10px] text-gray-300 mt-0.5">{mensaje.length}/1000</p>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
            )}

            <button
              type="button"
              onClick={enviar}
              disabled={enviando}
              className="w-full bg-[#213362] text-white rounded-2xl py-3 font-black text-sm
                hover:bg-[#07519D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? 'Enviando...' : 'Enviar comentario →'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

