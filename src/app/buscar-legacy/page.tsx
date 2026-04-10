import BuscarLegacyGuidedClient from './BuscarLegacyGuidedClient'

export const metadata = {
  title: 'Buscador guiado legacy - FondosFinder',
  description: 'Flujo guiado anterior conectado a buscar_fondos_top5_v1.',
}

export default function BuscarLegacyPage() {
  return <BuscarLegacyGuidedClient />
}
