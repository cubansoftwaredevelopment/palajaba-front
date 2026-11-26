import { SELLER_NAV } from '../../seller/utils/sellerNav.js'

export function sellerHasGestores(profile) {
  return Boolean(profile?.gestores_enabled)
}

export function getSellerNavItems() {
  return SELLER_NAV
}

export function getSellerDefaultPath() {
  return '/tienda/catalogo'
}
