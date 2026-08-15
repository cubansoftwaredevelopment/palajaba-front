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

test('el plan de 20 días es el recomendado y lista beneficios compactos', () => {
  const plan = getAdvertisingPlan('ads-20')
  assert.equal(plan.recommended, true)
  assert.equal(getAdvertisingPlan('ads-30').recommended, false)
  assert.deepEqual(plan.features, ['Banner 20 días', '2 reels', '1 post', '3 historias'])
})

test('el mensaje de contratación nombra la tienda y el plan', () => {
  const label = getAdvertisingPlanHireLabel(getAdvertisingPlan('ads-10'))
  assert.equal(label, 'Plan 1 — 10 días (15 USD)')
  const message = buildAdvertisingPlanMessage('Panadería El Trigal', label)
  assert.match(message, /Panadería El Trigal/)
  assert.match(message, /Plan 1 — 10 días \(15 USD\)/)
})
