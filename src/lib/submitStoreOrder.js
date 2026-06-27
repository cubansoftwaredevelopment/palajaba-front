import { createMarketplaceOrder, ApiError } from './api'
import { getBuyerLocation } from './buyerLocation'
import { CHECKOUT_SAVE_FAILED_MESSAGE } from './checkoutMessages.js'
import { isSavedMarketplaceOrder } from './marketplaceOrder.js'
import { inferOrderPaymentCurrency, resolveOrderLineItems } from './orderPricing'

function buildBuyerZone() {
  const location = getBuyerLocation()
  if (!location?.province?.id || !location?.municipality?.id) return null

  return {
    province_id: location.province.id,
    province_name: location.province.name,
    municipality_id: location.municipality.id,
    municipality_name: location.municipality.name,
  }
}

function buildDeliveryPayload(delivery) {
  if (!delivery) return null

  return {
    recipient_name: delivery.recipient_name,
    address: delivery.address,
    phone_primary: delivery.phone_primary,
    phone_secondary: delivery.phone_secondary || null,
    notes: delivery.notes || null,
  }
}

export async function submitStoreOrder({
  storeId,
  items,
  delivery = null,
  displayCurrency = 'CUP',
  cupPerUnit,
}) {
  if (!storeId || !items?.length) return null

  const lineItems = resolveOrderLineItems(items, displayCurrency, cupPerUnit)
  const paymentCurrency = inferOrderPaymentCurrency(lineItems)

  const order = await createMarketplaceOrder({
    store_id: storeId,
    items: lineItems,
    payment_currency: paymentCurrency,
    delivery: buildDeliveryPayload(delivery),
    buyer_zone: buildBuyerZone(),
  })

  if (!isSavedMarketplaceOrder(order)) {
    throw new ApiError(CHECKOUT_SAVE_FAILED_MESSAGE)
  }

  return order
}
