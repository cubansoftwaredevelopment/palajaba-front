import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

import {
  PLAN_GESTOR_FEATURES,
  canAddGestor,
  maxGestoresForPlan,
} from '../../src/lib/gestorPlanLimits.js'
import {
  PROFILE_PANEL_IDS,
  getProfileMenuSections,
  isProfileFormPanel,
  openProfilePanel,
  resolveProfileMenuAction,
} from '../../src/lib/sellerProfileHub.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const planSource = readFileSync(join(__dirname, '../../src/constants/plan.js'), 'utf8')

/**
 * Simula crear gestores hasta el tope del plan Básico.
 */
function simulateCreateUntilLimit(planTier, existingCount = 0) {
  let count = existingCount
  const created = []
  while (canAddGestor(planTier, count)) {
    count += 1
    created.push(`gestor_${count}`)
  }
  return { count, created, blocked: !canAddGestor(planTier, count) }
}

test('flujo integrado: Básico crea 3 y bloquea el siguiente', () => {
  const result = simulateCreateUntilLimit('standard')
  assert.equal(result.created.length, 3)
  assert.equal(result.count, 3)
  assert.equal(result.blocked, true)
  assert.equal(maxGestoresForPlan('standard'), 3)
})

test('flujo integrado: Premium no se bloquea al crear muchos', () => {
  let count = 0
  for (let i = 0; i < 25; i += 1) {
    assert.equal(canAddGestor('premium', count), true)
    count += 1
  }
  assert.equal(count, 25)
  assert.equal(maxGestoresForPlan('premium'), null)
})

test('flujo integrado: tarjetas de registro usan PLAN_GESTOR_FEATURES', () => {
  assert.match(planSource, /PLAN_GESTOR_FEATURES\.standard/)
  assert.match(planSource, /PLAN_GESTOR_FEATURES\.premium/)
  assert.equal(PLAN_GESTOR_FEATURES.standard, 'Hasta 3 gestores de venta')
  assert.equal(PLAN_GESTOR_FEATURES.premium, 'Gestores de venta ilimitados')
})

test('flujo integrado: hub de perfil abre Gestores de venta aparte', () => {
  const general = getProfileMenuSections().find((section) => section.id === 'general')
  assert.ok(general.items.some((item) => item.id === PROFILE_PANEL_IDS.gestores))
  assert.deepEqual(resolveProfileMenuAction(PROFILE_PANEL_IDS.gestores), {
    type: 'open',
    panelId: PROFILE_PANEL_IDS.gestores,
  })
  assert.equal(openProfilePanel(null, PROFILE_PANEL_IDS.gestores), PROFILE_PANEL_IDS.gestores)
  assert.equal(isProfileFormPanel(PROFILE_PANEL_IDS.gestores), true)
})
