export const metadata = { title: 'Mapa — FondosFinder' }

export default function MapaPage() {
  return (
    <div style={{ background: '#f6fafe', minHeight: '100vh' }}>
      {/* Mini hero */}
      <div style={{ background: '#213362', padding: '40px 48px 36px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            Cobertura territorial
          </p>
          <h1 style={{ color: '#fff', fontSize: '36px', fontWeight: 900, letterSpacing: '-1px' }}>
            Mapa de Financiamiento
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '8px' }}>
            Fondos disponibles por departamento y municipio
          </p>
        </div>
      </div>

      {/* Franja tricolor */}
      <div style={{ display: 'flex', height: '5px' }}>
        <div style={{ flex: '0 0 50%', background: '#ffc800' }} />
        <div style={{ flex: '0 0 25%', background: '#223a7a' }} />
        <div style={{ flex: '0 0 25%', background: '#d80e25' }} />
      </div>

      {/* Placeholder */}
      <div style={{ maxWidth: '1100px', margin: '60px auto', padding: '0 48px', textAlign: 'center' }}>
        <div style={{
          background: '#fff',
          border: '2px dashed rgba(7,29,76,0.15)',
          borderRadius: '24px',
          padding: '80px 40px',
        }}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ margin: '0 auto 20px', display: 'block' }}>
            <path d="M32 8C20.95 8 12 16.95 12 28c0 14 20 32 20 32s20-18 20-32C52 16.95 43.05 8 32 8z" stroke="#213362" strokeWidth="2" fill="#EEF2FF" />
            <circle cx="32" cy="28" r="6" stroke="#213362" strokeWidth="2" fill="#FFCD00" />
          </svg>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#213362', marginBottom: '12px' }}>
            Mapa interactivo próximamente
          </h2>
          <p style={{ color: '#6C7175', fontSize: '14px', maxWidth: '400px', margin: '0 auto 28px', lineHeight: 1.6 }}>
            Podrás explorar los 32 fondos de financiamiento filtrados por departamento y municipio en Colombia.
          </p>
          <a href="/fondos" style={{
            background: '#213362',
            color: '#fff',
            padding: '12px 32px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '13px',
            textDecoration: 'none',
            display: 'inline-block',
          }}>
            Ver catálogo completo →
          </a>
        </div>
      </div>
    </div>
  )
}
