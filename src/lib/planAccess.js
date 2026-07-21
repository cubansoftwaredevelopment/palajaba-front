import { SELLER_NAV } from '../constants/sellerNav.js'

export function sellerHasGestores(profile) {
  return Boolean(profile?.gestores_enabled)
}

export function getSellerNavItems(profile) {
  if (!sellerHasGestores(profile)) {
    return SELLER_NAV.filter((item) => item.id !== 'gestores')
  }
  return SELLER_NAV
}

export function getSellerDefaultPath() {
  return '/tienda/catalogo'
}
