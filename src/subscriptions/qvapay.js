export function subscriptionCheckoutPayload(planTier, billingPeriod) {
  return { plan_tier: planTier, billing_period: billingPeriod }
}

export function isSubscriptionCheckoutPaid(checkout) {
  return String(checkout?.status ?? '').trim().toLowerCase() === 'paid'
}

export function isSubscriptionCheckoutClosed(checkout) {
  return ['paid', 'cancelled', 'failed'].includes(String(checkout?.status ?? '').trim().toLowerCase())
}

export function subscriptionCheckoutStatusMessage(checkout) {
  if (isSubscriptionCheckoutPaid(checkout)) {
    return 'Pago confirmado. Tu tienda ya está activa.'
  }
  if (checkout?.status === 'cancelled' || checkout?.status === 'failed') {
    return 'La factura no se completó. Puedes volver a solicitar el pago.'
  }
  return 'Esperando confirmación de QvaPay. La tienda se activará automáticamente al confirmarse el pago.'
}
