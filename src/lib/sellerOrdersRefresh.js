export const SELLER_ORDERS_REFRESH_EVENT = 'seller-orders-refresh'

export function requestSellerOrdersRefresh() {
  window.dispatchEvent(new CustomEvent(SELLER_ORDERS_REFRESH_EVENT))
}
