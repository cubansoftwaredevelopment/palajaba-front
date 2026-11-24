export const SELLER_PRODUCTS_REFRESH_EVENT = 'seller-products-refresh'

export function requestSellerProductsRefresh() {
  window.dispatchEvent(new CustomEvent(SELLER_PRODUCTS_REFRESH_EVENT))
}
