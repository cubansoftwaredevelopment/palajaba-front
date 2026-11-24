export function isSavedMarketplaceOrder(value) {
  return Boolean(
    value
    && typeof value === 'object'
    && typeof value.id === 'string'
    && value.id.length > 0
    && typeof value.status === 'string'
    && value.status.length > 0,
  )
}
