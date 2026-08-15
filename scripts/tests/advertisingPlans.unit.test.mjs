import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  ADVERTISING_PLANS,
  buildAdvertisingPlanMessage,
  getAdvertisingPlan,
  getAdvertisingPlanHireLabel,
  getAdvertisingPlans,
} from '../../src/constants/advertisingPlans.js'

test('getAdvertisingPlans expone la lista contratables', () => {
  const plans = getAdvertisingPlans()
  assert.equal(Array.isArray(plans), true)
  assert.equal(plans, ADVERTISING_PLANS)
  assert.equal(plans.length, 3)
  assert.deepEqual(
    plans.map((plan) => ({ id: plan.id, amountUsd: plan.amountUsd, name: plan.name })),
    [
      { id: 'ads-10', amountUsd: 15, name: '10 días' },
      { id: 'ads-20', amountUsd: 20, name: '20 días' },
      { id: 'ads-30', amountUsd: 25, name: '30 días' },
    ],
  )
})

test('getAdvertisingPlan encuentra por id y devuelve null si no existe', () => {
  assert.equal(getAdvertisingPlan('ads-20')?.amountUsd, 20)
  assert.equal(getAdvertisingPlan('no-existe'), null)
})

test('el plan de 30 días incluye banner, reels, posts e historias', () => {
  const plan = getAdvertisingPlan('ads-30')
  assert.equal(plan.recommended, true)
  assert.ok(plan.features.includes('Banner promocional por 30 días'))
  assert.ok(plan.features.includes('2 reels en colaboración'))
  assert.ok(plan.features.includes('2 posts en colaboración'))
  assert.ok(plan.features.includes('4 historias'))
})

test('el mensaje de contratación nombra la tienda y el plan', () => {
  const label = getAdvertisingPlanHireLabel(getAdvertisingPlan('ads-10'))
  assert.equal(label, 'Plan 1 — 10 días (15 USD)')
  const message = buildAdvertisingPlanMessage('Panadería El Trigal', label)
  assert.match(message, /Panadería El Trigal/)
  assert.match(message, /Plan 1 — 10 días \(15 USD\)/)
})
