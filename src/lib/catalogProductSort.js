import { getCupPerUnit } from './exchangeRates'
import {
  PRODUCT_SORT_MODES,
  getProductSortModeLabel,
  productPriceInCup,
  sortProductsForPreview as sortProductsForPreviewCore,
} from './productPriceSort'

export { PRODUCT_SORT_MODES, getProductSortModeLabel, productPriceInCup }

export function sortProductsForPreview(products, mode, cupPerUnit = getCupPerUnit()) {
  return sortProductsForPreviewCore(products, mode, cupPerUnit)
}
