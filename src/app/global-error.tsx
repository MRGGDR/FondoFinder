'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body style={{ fontFamily: 'sans-serif', background: '#f9fafb', color: '#213362', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Algo salió mal</h2>
        <p style={{ marginTop: '0.5rem', color: '#6C7175' }}>{error.message}</p>
        <button
          onClick={reset}
          style={{
            marginTop: '1rem', padding: '0.5rem 1.25rem',
            background: '#213362', color: 'white', borderRadius: '0.5rem',
            border: 'none', cursor: 'pointer',
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  )
}
