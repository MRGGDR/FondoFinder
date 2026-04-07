/**
 * Mapeo de fondos con ficha PDF estática precargada.
 * La búsqueda se hace por substring del nombre (case-insensitive).
 * Si el nombre del fondo contiene la clave, se usa el PDF indicado.
 *
 * Fondos cubiertos (todos internacionales):
 *   F17 - Adaptation Fund
 *   F20 - Green Climate Fund (GCF)
 *   F21 - Special Climate Change Fund (SCCF)
 *   F24 - Global Facility for Disaster Reduction and Recovery (GFDRR)
 *   F25 - eco.business Fund
 *   F26 - Global Innovation Fund
 *   F28 - Fondo Multilateral de Inversiones (IDB Lab)
 *   F29 - International Climate Initiative (IKI)
 *   F31 - Fontagro
 */
export const FICHAS_PDF_ESTATICAS: Array<{ patron: string; path: string }> = [
  { patron: 'Adaptation Fund',                                path: '/fichas-fondos/adaptation-fund.pdf' },
  { patron: 'Green Climate Fund',                             path: '/fichas-fondos/green-climate-fund.pdf' },
  { patron: 'Special Climate Change Fund',                    path: '/fichas-fondos/sccf.pdf' },
  { patron: 'Global Facility for Disaster Reduction',        path: '/fichas-fondos/gfdrr.pdf' },
  { patron: 'eco.business',                                   path: '/fichas-fondos/eco-business-fund.pdf' },
  { patron: 'Global Innovation Fund',                         path: '/fichas-fondos/global-innovation-fund.pdf' },
  { patron: 'IDB Lab',                                        path: '/fichas-fondos/bid-lab.pdf' },
  { patron: 'International Climate Initiative',               path: '/fichas-fondos/iki.pdf' },
  { patron: 'Fontagro',                                       path: '/fichas-fondos/fontagro.pdf' },
]

/**
 * Devuelve el path del PDF estático si el nombre del fondo coincide,
 * o null si no hay ficha estática disponible.
 */
export function getFichaEstaticaPath(nombreFondo: string): string | null {
  const lower = nombreFondo.toLowerCase()
  for (const entrada of FICHAS_PDF_ESTATICAS) {
    if (lower.includes(entrada.patron.toLowerCase())) {
      return entrada.path
    }
  }
  return null
}
