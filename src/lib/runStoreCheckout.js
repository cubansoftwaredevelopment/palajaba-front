import {
  CHECKOUT_RATES_MESSAGE,
  CHECKOUT_SAVE_FAILED_MESSAGE,
  CHECKOUT_WHATSAPP_FAILED_MESSAGE,
} from './checkoutMessages.js'
import { isSavedMarketplaceOrder } from './marketplaceOrder.js'

export const CHECKOUT_INVALID_PAYLOAD = 'invalid_payload'
export const CHECKOUT_BLOCKED_RATES = 'blocked_rates'
export const CHECKOUT_ORDER_SAVE_FAILED = 'order_save_failed'
export const CHECKOUT_WHATSAPP_FAILED = 'whatsapp_failed'

export {
  CHECKOUT_RATES_MESSAGE,
  CHECKOUT_SAVE_FAILED_MESSAGE,
  CHECKOUT_WHATSAPP_FAILED_MESSAGE,
} from './checkoutMessages.js'

function resolveCheckoutErrorMessage(error) {
  if (error?.message) return error.message
  return CHECKOUT_SAVE_FAILED_MESSAGE
}

/**
 * Guarda el pedido en el backend y solo abre WhatsApp si el guardado fue exitoso.
 */
export async function runStoreCheckout({
  payload,
  delivery = null,
  displayCurrency,
  cupPerUnit,
  ratesReady,
  areExchangeRatesAvailable,
  needsExchangeRatesForDisplay,
  submitStoreOrder,
  openWhatsAppCheckout,
}) {
  if (!payload?.items?.length || !payload.storePhone) {
    return { ok: false, code: CHECKOUT_INVALID_PAYLOAD }
  }

  const needsRates = payload.items.some((item) =>
    needsExchangeRatesForDisplay(item, displayCurrency),
  )
  if (needsRates && !ratesReady && !areExchangeRatesAvailable()) {
    return {
      ok: false,
      code: CHECKOUT_BLOCKED_RATES,
      message: CHECKOUT_RATES_MESSAGE,
    }
  }

  let order
  try {
    order = await submitStoreOrder({
      storeId: payload.storeId,
      items: payload.items,
      delivery,
      displayCurrency,
      cupPerUnit,
      gestorId: payload.gestorId ?? null,
      gestorUsername: payload.gestorUsername ?? null,
    })
  } catch (error) {
    return {
      ok: false,
      code: CHECKOUT_ORDER_SAVE_FAILED,
      message: resolveCheckoutErrorMessage(error),
      error,
    }
  }

  if (!isSavedMarketplaceOrder(order)) {
    return {
      ok: false,
      code: CHECKOUT_ORDER_SAVE_FAILED,
      message: CHECKOUT_SAVE_FAILED_MESSAGE,
    }
  }

  const whatsappOpened = openWhatsAppCheckout({
    storeName: payload.storeName,
    storePhone: payload.storePhone,
    items: payload.items,
    delivery,
    displayCurrency,
    cupPerUnit,
  })

  if (!whatsappOpened) {
    return {
      ok: true,
      order,
      whatsappOpened: false,
      warning: CHECKOUT_WHATSAPP_FAILED_MESSAGE,
    }
  }

  return {
    ok: true,
    order,
    whatsappOpened: true,
  }
}
