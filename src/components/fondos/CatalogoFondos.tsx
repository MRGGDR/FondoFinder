'use client'

import { useState, useMemo } from 'react'
import type { FondoConRelaciones, CatProceso, CatBeneficiario, TipoFondo } from '@/types/database'
import FondoCard from '@/components/fondos/FondoCard'

interface CatalogoFondosProps {
  fondos: FondoConRelaciones[]
  procesos: CatProceso[]
  beneficiarios: CatBeneficiario[]
}

const TIPOS: TipoFondo[] = ['Nacional', 'Territorial', 'Internacional']

type Orden = 'nombre' | 'monto_max' | 'monto_min'

export function CatalogoFondos({ fondos }: CatalogoFondosProps) {
  const [query, setQuery] = useState('')
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoFondo | null>(null)
  const [orden, setOrden] = useState<Orden>('nombre')

  const resultado = useMemo(() => {
    let lista = [...fondos]

    if (query.trim()) {
      const q = query.toLowerCase()
      lista = lista.filter(f =>
        f.nombre.toLowerCase().includes(q) ||
        (f.entidad_encargada ?? '').toLowerCase().includes(q)
      )
    }

    if (tipoSeleccionado) {
      lista = lista.filter(f => f.tipo_fondo_categoria === tipoSeleccionado)
    }

    lista.sort((a, b) => {
      if (orden === 'nombre') return a.nombre.localeCompare(b.nombre)
      if (orden === 'monto_max') return (b.monto_max_usd ?? 0) - (a.monto_max_usd ?? 0)
      if (orden === 'monto_min') return (a.monto_min_usd ?? 0) - (b.monto_min_usd ?? 0)
      return 0
    })

    return lista
  }, [fondos, query, tipoSeleccionado, orden])

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 48px 64px' }}>
      {/* Barra de filtros */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
      }}>
        {/* Búsqueda */}
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar fondo..."
          style={{
            flex: '1 1 220px',
            padding: '10px 16px',
            borderRadius: '10px',
            border: '1px solid rgba(7,29,76,0.15)',
            fontSize: '13px',
            outline: 'none',
            background: '#fff',
          }}
        />

        {/* Chips de tipo */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {TIPOS.map(tipo => (
            <button
              key={tipo}
              onClick={() => setTipoSeleccionado(tipoSeleccionado === tipo ? null : tipo)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid ' + (tipoSeleccionado === tipo ? '#213362' : 'rgba(7,29,76,0.2)'),
                background: tipoSeleccionado === tipo ? '#213362' : '#fff',
                color: tipoSeleccionado === tipo ? '#fff' : '#213362',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tipo}
            </button>
          ))}
        </div>

        {/* Ordenar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <span style={{ fontSize: '12px', color: 'rgba(7,29,76,0.5)', fontWeight: 600 }}>
            {resultado.length} fondos
          </span>
          <select
            value={orden}
            onChange={e => setOrden(e.target.value as Orden)}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid rgba(7,29,76,0.15)',
              fontSize: '12px',
              background: '#fff',
              color: '#213362',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="nombre">Nombre A–Z</option>
            <option value="monto_max">Mayor monto</option>
            <option value="monto_min">Menor monto</option>
          </select>
        </div>
      </div>

      {/* Grid de resultados */}
      {resultado.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(7,29,76,0.4)', fontSize: '14px' }}>
          No se encontraron fondos con esos filtros.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}>
          {resultado.map(fondo => (
            <FondoCard key={fondo.id} fondo={fondo as any} />
          ))}
        </div>
      )}
    </div>
  )
}
