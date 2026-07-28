import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  PLAN_GESTOR_FEATURES,
  STANDARD_GESTOR_LIMIT,
  canAddGestor,
  formatGestorUsage,
  gestorLimitFeatureLabel,
  maxGestoresForPlan,
} from '../../src/lib/gestorPlanLimits.js'

test('plan Básico limita a 3 gestores; Premium ilimitado', () => {
  assert.equal(STANDARD_GESTOR_LIMIT, 3)
  assert.equal(maxGestoresForPlan('standard'), 3)
  assert.equal(maxGestoresForPlan('premium'), null)
})

test('canAddGestor bloquea el 4.º en Básico y nunca en Premium', () => {
  assert.equal(canAddGestor('standard', 2), true)
  assert.equal(canAddGestor('standard', 3), false)
  assert.equal(canAddGestor('premium', 50), true)
})

test('etiquetas de uso y features de registro', () => {
  assert.equal(formatGestorUsage('standard', 1), '1 de 3 gestores')
  assert.equal(formatGestorUsage('premium', 4), '4 gestores')
  assert.equal(gestorLimitFeatureLabel('standard'), PLAN_GESTOR_FEATURES.standard)
  assert.equal(gestorLimitFeatureLabel('premium'), PLAN_GESTOR_FEATURES.premium)
  assert.equal(PLAN_GESTOR_FEATURES.standard, 'Hasta 3 gestores de venta')
  assert.equal(PLAN_GESTOR_FEATURES.premium, 'Gestores de venta ilimitados')
})
