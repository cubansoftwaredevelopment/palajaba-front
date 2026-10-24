import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

import {
  needsGestorKeepPicker,
  simulateAdminPlanReplace,
  toggleKeepGestorId,
} from '../../src/subscriptions/context.js'
import { STANDARD_GESTOR_LIMIT } from '../../src/lib/gestorPlanLimits.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const modalSource = readFileSync(
  join(__dirname, '../../src/subscriptions/components/SubscriptionModal.jsx'),
  'utf8',
)
const planSource = readFileSync(join(__dirname, '../../src/subscriptions/constants.js'), 'utf8')

function makeGestores(count, { inactive = 0 } = {}) {
  const gestores = []
  for (let i = 0; i < count; i += 1) {
    gestores.push({
      id: `g${i}`,
      username: `gestor_${i}`,
      is_active: i >= count - inactive ? false : true,
    })
  }
  return gestores
}

test('flujo integrado: Premium a Básico pide elegir 10 y desactiva el resto', () => {
  const gestores = makeGestores(12)
  assert.equal(needsGestorKeepPicker('standard', gestores), true)

  let keep = []
  for (const gestor of gestores) {
    keep = toggleKeepGestorId(keep, gestor.id, STANDARD_GESTOR_LIMIT)
  }
  assert.equal(keep.length, STANDARD_GESTOR_LIMIT)

  const result = simulateAdminPlanReplace({
    planTier: 'standard',
    gestores,
    keepGestorIds: keep,
  })
  assert.equal(result.needsPick, true)
  assert.equal(result.limit, 10)
  assert.equal(result.activeBefore, 12)
  assert.equal(result.activeAfter, 10)
  assert.deepEqual(result.deactivatedIds, ['g10', 'g11'])
  assert.deepEqual(result.body.keep_gestor_ids, keep)
  assert.equal(result.invalid, false)
})

test('flujo integrado: Pro a Básico con 25 gestores deja 10 activos', () => {
  const gestores = makeGestores(25)
  const keep = gestores.slice(0, 10).map((gestor) => gestor.id)
  const result = simulateAdminPlanReplace({
    planTier: 'standard',
    gestores,
    keepGestorIds: keep,
  })
  assert.equal(result.activeAfter, 10)
  assert.equal(result.deactivatedIds.length, 15)
})

test('flujo integrado: si no hay exceso, el plan se reemplaza sin desactivar', () => {
  const gestores = makeGestores(8)
  const result = simulateAdminPlanReplace({
    planTier: 'standard',
    gestores,
    keepGestorIds: ['g0'],
  })
  assert.equal(result.needsPick, false)
  assert.equal(result.activeAfter, 8)
  assert.deepEqual(result.deactivatedIds, [])
  assert.deepEqual(result.body.keep_gestor_ids, [])
})

test('flujo integrado: tienda en Prueba puede pasar a Básico, Pro o Premium', () => {
  assert.match(planSource, /name: 'Prueba'/)
  assert.match(planSource, /if \(isTrialSeller\(profileOrTier\)\)/)
  assert.match(planSource, /return PLAN_TIER_ORDER\.map\(\(id\) => PLAN_TIERS\[id\]\)/)
})

test('flujo integrado: el modal admin usa el módulo de reemplazo', () => {
  assert.match(modalSource, /from '\.\.\/context\.js'/)
  assert.match(modalSource, /needsGestorKeepPicker/)
  assert.match(modalSource, /buildReplaceSubscriptionBody/)
  assert.match(modalSource, /toggleKeepGestorId/)
})
