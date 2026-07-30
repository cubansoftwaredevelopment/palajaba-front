import { BUSINESSES_LABEL, MARKETPLACE_LABEL } from './branding'

/**
 * Flag temporal: desactiva la sección Negocios y la bottom nav del hub de compra.
 * La página, rutas y entradas de nav se conservan; pon `true` para reactivar.
 */
export const BUYER_BUSINESSES_SECTION_ENABLED = false

/** Nav completa del hub (Marketplace + Negocios). No filtrar este array al editar ítems. */
export const BUYER_MARKETPLACE_NAV = [
  {
    id: 'marketplace',
    label: MARKETPLACE_LABEL,
    path: '/comprar',
    end: true,
  },
  {
    id: 'negocios',
    label: BUSINESSES_LABEL,
    path: '/comprar/negocios',
    end: true,
  },
]

/** Ítems visibles según el flag temporal. */
export function getVisibleBuyerMarketplaceNav() {
  if (!BUYER_BUSINESSES_SECTION_ENABLED) return []
  return BUYER_MARKETPLACE_NAV
}

/** La bottom nav solo se muestra cuando Negocios está activo (2 secciones). */
export function isBuyerMarketplaceNavVisible() {
  return BUYER_BUSINESSES_SECTION_ENABLED
}
