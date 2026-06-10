import { sellerHasStatistics } from '../constants/plan'
import { SELLER_NAV } from '../constants/sellerNav'

export function getSellerNavItems(profile) {
  if (sellerHasStatistics(profile)) {
    return SELLER_NAV
  }

  return SELLER_NAV.filter((item) => item.id !== 'general')
}

export function getSellerDefaultPath(profile) {
  return sellerHasStatistics(profile) ? '/tienda' : '/tienda/catalogo'
}
