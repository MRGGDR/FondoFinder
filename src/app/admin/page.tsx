import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Admin — FondosFinder' }

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { count: totalFondos } = await supabase
    .from('fondos')
    .select('*', { count: 'exact', head: true })

  const { count: totalUsuarios } = await supabase
    .from('usuarios')
    .select('*', { count: 'exact', head: true })

  const stats = [
    { label: 'Fondos registrados', value: totalFondos ?? 32, color: '#213362' },
    { label: 'Municipios activos',  value: totalUsuarios ?? 0, color: '#1B4472' },
    { label: 'Búsquedas hoy',       value: '—',               color: '#07519D' },
  ]

  return (
    <div style={{ background: '#f6fafe', minHeight: '100vh' }}>
      <div style={{ background: '#213362', padding: '40px 48px 36px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ color: '#FFCD00', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            Panel de administración
          </p>
          <h1 style={{ color: '#fff', fontSize: '36px', fontWeight: 900, letterSpacing: '-1px' }}>
            Dashboard UNGRD
          </h1>
        </div>
      </div>

      {/* Franja tricolor */}
      <div style={{ display: 'flex', height: '5px' }}>
        <div style={{ flex: '0 0 50%', background: '#ffc800' }} />
        <div style={{ flex: '0 0 25%', background: '#223a7a' }} />
        <div style={{ flex: '0 0 25%', background: '#d80e25' }} />
      </div>

      {/* Stats + contenido */}
      <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px' }}>
          {stats.map(stat => (
            <div key={stat.label} style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px 28px',
              border: '1px solid rgba(7,29,76,0.08)',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#6C7175', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                {stat.label}
              </p>
              <p style={{ fontSize: '40px', fontWeight: 900, color: stat.color, letterSpacing: '-2px', lineHeight: 1 }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid rgba(7,29,76,0.08)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#213362', marginBottom: '20px' }}>
            Gestión de fondos
          </h2>
          <p style={{ color: '#6C7175', fontSize: '14px' }}>
            Próximamente: editar información de fondos, gestionar municipios registrados, ver logs de búsquedas.
          </p>
        </div>
      </div>
    </div>
  )
}
