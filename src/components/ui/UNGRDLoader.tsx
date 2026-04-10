'use client'

import { useEffect } from 'react'

interface Props {
  visible: boolean
  contexto?: keyof typeof MENSAJES | string
  subTexto?: string
}

const MENSAJES = {
  dashboard:    { main: 'Cargando Dashboard',        sub: 'Preparando tu resumen de indicadores...' },
  estrategias:  { main: 'Cargando Estrategias',      sub: 'Obteniendo líneas de intervención...' },
  territorios:  { main: 'Cargando Territorios',      sub: 'Procesando datos geográficos...' },
  login:        { main: 'Verificando credenciales',  sub: 'Validando tu acceso al sistema...' },
  guardando:    { main: 'Guardando cambios',         sub: 'Almacenando la información...' },
  reporte:      { main: 'Generando reporte PDF',     sub: 'Esto puede tomar unos segundos...' },
  buscando:     { main: 'Buscando fondos',           sub: 'Consultando las fuentes disponibles...' },
  navegando:    { main: 'Cargando página',           sub: 'Un momento por favor...' },
  default:      { main: 'Cargando...',               sub: 'Un momento por favor' },
}

export function UNGRDLoader({ visible, contexto = 'default', subTexto }: Props) {
  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [visible])

  const msgs = MENSAJES[contexto as keyof typeof MENSAJES] ?? { main: contexto, sub: subTexto ?? '' }
  const mainText = msgs.main
  const subText  = subTexto ?? msgs.sub

  return (
    <>
      <style>{`
        @keyframes ungrdSpinOuter { to { transform: rotate(360deg); } }
        @keyframes ungrdSpinInner { to { transform: rotate(360deg); } }
        @keyframes ungrdDot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40%            { transform: scale(1.3); opacity: 1; }
        }
      `}</style>

      <div
        role="status"
        aria-live="polite"
        aria-label={mainText}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(21, 31, 58, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'all' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      >
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '32px 44px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '18px',
          minWidth: '220px',
          transform: visible ? 'scale(1)' : 'scale(0.88)',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          fontFamily: "'Nunito Sans', Verdana, sans-serif",
        }}>
          <span style={{
            background: '#213362',
            color: '#FFCD00',
            fontSize: '11px',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '6px',
            letterSpacing: '0.05em',
          }}>
            UNGRD
          </span>

          <div style={{ position: 'relative', width: '64px', height: '64px' }}>
            <div style={{
              position: 'absolute', inset: 0,
              borderRadius: '50%',
              border: '4px solid transparent',
              borderTopColor: '#213362',
              borderBottomColor: '#213362',
              animation: 'ungrdSpinOuter 1s linear infinite',
            }} />
            <div style={{
              position: 'absolute', inset: '10px',
              borderRadius: '50%',
              border: '4px solid transparent',
              borderLeftColor: '#FFCD00',
              borderRightColor: '#FFCD00',
              animation: 'ungrdSpinInner 0.65s linear infinite reverse',
            }} />
          </div>

          <p style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#213362',
            textAlign: 'center',
            margin: 0,
          }}>
            {mainText}
          </p>

          <p style={{
            fontSize: '12px',
            fontWeight: 400,
            color: '#8892a4',
            textAlign: 'center',
            marginTop: '-8px',
            margin: 0,
          }}>
            {subText}
          </p>

          <div aria-hidden="true" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {[
              { color: '#FFCD00', delay: '0s' },
              { color: '#213362', delay: '0.2s' },
              { color: '#FFCD00', delay: '0.4s' },
            ].map((dot, i) => (
              <div key={i} style={{
                width: '6px', height: '6px',
                borderRadius: '50%',
                background: dot.color,
                animation: `ungrdDot 1.2s ease-in-out infinite`,
                animationDelay: dot.delay,
              }} />
            ))}
          </div>

        </div>
      </div>
    </>
  )
}
