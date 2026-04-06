import BuscarClient from './BuscarClient'

export const metadata = {
  title: 'Búsqueda guiada — FondosFinder',
  description: 'Wizard estructurado conectado a buscar_fondos_top5_v1.',
}

export default function BuscarPage() {
  return <BuscarClient />
}
