import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  buildReplaceSubscriptionBody,
  isKeepSelectionInvalid,
  listActiveGestores,
  needsGestorKeepPicker,
  toggleKeepGestorId,
} from '../../src/subscriptions/context.js'
import { STANDARD_GESTOR_LIMIT } from '../../src/lib/gestorPlanLimits.js'
import { gestorSetupStatus, isGestorActive } from '../../src/lib/sellerGestores.js'

const twelveGestores = Array.from({ length: 12 }, (_, index) => ({
  id: `g${index}`,
  username: `gestor_${index}`,
  is_active: true,
}))

test('listActiveGestores ignora desactivados', () => {
  const list = [
    { id: 'a', is_active: true },
    { id: 'b', is_active: false },
    { id: 'c' },
  ]
  assert.deepEqual(
    listActiveGestores(list).map((item) => item.id),
    ['a', 'c'],
  )
})

test('needsGestorKeepPicker solo si el nuevo plan no cabe', () => {
  assert.equal(needsGestorKeepPicker('premium', twelveGestores), false)
  assert.equal(needsGestorKeepPicker('pro', twelveGestores), false)
  assert.equal(needsGestorKeepPicker('standard', twelveGestores), true)
  assert.equal(needsGestorKeepPicker('standard', twelveGestores.slice(0, 10)), false)
})

test('toggleKeepGestorId no pasa el tope del plan', () => {
  let selected = []
  for (let i = 0; i < STANDARD_GESTOR_LIMIT + 2; i += 1) {
    selected = toggleKeepGestorId(selected, `g${i}`, STANDARD_GESTOR_LIMIT)
  }
  assert.equal(selected.length, STANDARD_GESTOR_LIMIT)
  selected = toggleKeepGestorId(selected, 'g0', STANDARD_GESTOR_LIMIT)
  assert.equal(selected.includes('g0'), false)
  assert.equal(selected.length, STANDARD_GESTOR_LIMIT - 1)
})

test('isKeepSelectionInvalid bloquea carga, error o exceso', () => {
  assert.equal(
    isKeepSelectionInvalid({ needsPick: false, selectedIds: ['a', 'b'], limit: 1 }),
    false,
  )
  assert.equal(
    isKeepSelectionInvalid({ needsPick: true, loading: true, selectedIds: [], limit: 10 }),
    true,
  )
  assert.equal(
    isKeepSelectionInvalid({ needsPick: true, loadError: 'falló', selectedIds: [], limit: 10 }),
    true,
  )
  assert.equal(
    isKeepSelectionInvalid({
      needsPick: true,
      selectedIds: Array.from({ length: 11 }, (_, i) => `g${i}`),
      limit: 10,
    }),
    true,
  )
  assert.equal(
    isKeepSelectionInvalid({ needsPick: true, selectedIds: ['g0', 'g1'], limit: 10 }),
    false,
  )
})

test('buildReplaceSubscriptionBody solo envía keep ids si hay que elegir', () => {
  assert.deepEqual(
    buildReplaceSubscriptionBody({
      planTier: 'standard',
      billingPeriod: 'monthly',
      keepGestorIds: ['g1', 'g2'],
      needsPick: true,
    }),
    {
      plan_tier: 'standard',
      billing_period: 'monthly',
      keep_gestor_ids: ['g1', 'g2'],
    },
  )
  assert.deepEqual(
    buildReplaceSubscriptionBody({
      planTier: 'premium',
      billingPeriod: 'yearly',
      keepGestorIds: ['g1'],
      needsPick: false,
    }),
    {
      plan_tier: 'premium',
      billing_period: 'yearly',
      keep_gestor_ids: [],
    },
  )
})

test('gestor desactivado no es elegible y se etiqueta como Desactivado', () => {
  const inactive = { id: 'x', has_password: true, phone: '51234567', is_active: false }
  assert.equal(isGestorActive(inactive), false)
  assert.equal(gestorSetupStatus(inactive).label, 'Desactivado')
})
