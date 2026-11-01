import { request } from '../lib/api'
import { subscriptionCheckoutPayload } from './qvapay.js'

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

export function fetchRenewalContactPhone() {
  return request('/api/platform/renewal-contact')
}

export function fetchPlanPrices() {
  return request('/api/platform/plan-prices')
}

export function createSubscriptionQvaPayCheckout(token, { planTier, billingPeriod }) {
  return request('/api/auth/me/subscriptions/qvapay', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(subscriptionCheckoutPayload(planTier, billingPeriod)),
  })
}

export function fetchSubscriptionQvaPayCheckout(token, purchaseId) {
  return request(`/api/auth/me/subscriptions/qvapay/${encodeURIComponent(purchaseId)}`, {
    headers: authHeaders(token),
  })
}

export function createInitialSubscriptionQvaPayCheckout({ planTier, billingPeriod }) {
  return request('/api/register/qvapay', {
    method: 'POST',
    body: JSON.stringify({ plan_tier: planTier, billing_period: billingPeriod }),
  })
}

export function fetchInitialSubscriptionQvaPayCheckout(purchaseId) {
  return request(`/api/register/qvapay/${encodeURIComponent(purchaseId)}`)
}

export function approveRegistration(token, id, subscriptionEndsAt, paymentAmountCup) {
  const params = new URLSearchParams()
  params.set('payment_amount_cup', String(paymentAmountCup))
  if (subscriptionEndsAt) {
    params.set('subscription_ends_at', subscriptionEndsAt)
  }

  return request(`/api/admin/registrations/${id}/approve?${params.toString()}`, {
    method: 'POST',
    headers: authHeaders(token),
  })
}

export function updateRegistrationPayment(token, id, paymentAmountCup) {
  const params = new URLSearchParams()
  params.set('payment_amount_cup', String(paymentAmountCup))

  return request(`/api/admin/registrations/${id}/payment?${params.toString()}`, {
    method: 'PATCH',
    headers: authHeaders(token),
  })
}

export function fetchAdminRegistrationGestores(token, id) {
  return request(`/api/admin/registrations/${id}/gestores`, {
    headers: authHeaders(token),
  })
}

export function updateRegistrationSubscription(
  token,
  id,
  { planTier, billingPeriod, keepGestorIds } = {},
) {
  return request(`/api/admin/registrations/${id}/subscription`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({
      plan_tier: planTier,
      billing_period: billingPeriod,
      keep_gestor_ids: keepGestorIds ?? [],
    }),
  })
}

/** @deprecated Use updateRegistrationSubscription */
export function updateSubscriptionEnd(token, id, _subscriptionEndsAt) {
  void _subscriptionEndsAt
  return updateRegistrationSubscription(token, id, {})
}

export function renewRegistration(
  token,
  id,
  { subscriptionEndsAt, paymentAmountCup, planTier, billingPeriod, keepGestorIds } = {},
) {
  const params = new URLSearchParams()
  params.set('payment_amount_cup', String(paymentAmountCup))
  if (subscriptionEndsAt) params.set('subscription_ends_at', subscriptionEndsAt)
  if (planTier) params.set('plan_tier', planTier)
  if (billingPeriod) params.set('billing_period', billingPeriod)
  for (const gestorId of keepGestorIds ?? []) {
    if (gestorId) params.append('keep_gestor_ids', String(gestorId))
  }

  return request(`/api/admin/registrations/${id}/renew?${params.toString()}`, {
    method: 'POST',
    headers: authHeaders(token),
  })
}
