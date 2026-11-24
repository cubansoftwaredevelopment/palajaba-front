import { getCupPerUnit } from '../../shared/utils/exchangeRates.js'
import { sortProductsForPreview as sortProductsForPreviewCore } from '../context/context.js'

export function sortProductsForPreview(products, mode, cupPerUnit = getCupPerUnit()) {
  return sortProductsForPreviewCore(products, mode, cupPerUnit)
}
