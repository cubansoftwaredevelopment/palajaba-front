import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  PLAN_GESTOR_FEATURES,
  PRO_GESTOR_LIMIT,
  STANDARD_GESTOR_LIMIT,
  canAddGestor,
  formatGestorUsage,
  gestorLimitFeatureLabel,
  maxGestoresForPlan,
} from '../../src/lib/gestorPlanLimits.js'

test('plan Básico limita a 1 gestor; Pro a 3; Premium ilimitado', () => {
  assert.equal(STANDARD_GESTOR_LIMIT, 1)
  assert.equal(PRO_GESTOR_LIMIT, 3)
  assert.equal(maxGestoresForPlan('standard'), 1)
  assert.equal(maxGestoresForPlan('pro'), 3)
  assert.equal(maxGestoresForPlan('premium'), null)
})

test('canAddGestor respeta el tope de cada plan', () => {
  assert.equal(canAddGestor('standard', 0), true)
  assert.equal(canAddGestor('standard', 1), false)
  assert.equal(canAddGestor('pro', 2), true)
  assert.equal(canAddGestor('pro', 3), false)
  assert.equal(canAddGestor('premium', 50), true)
})

test('etiquetas de uso y features de registro', () => {
  assert.equal(formatGestorUsage('standard', 1), '1 de 1 gestores')
  assert.equal(formatGestorUsage('pro', 2), '2 de 3 gestores')
  assert.equal(formatGestorUsage('premium', 4), '4 gestores')
  assert.equal(gestorLimitFeatureLabel('standard'), PLAN_GESTOR_FEATURES.standard)
  assert.equal(gestorLimitFeatureLabel('pro'), PLAN_GESTOR_FEATURES.pro)
  assert.equal(gestorLimitFeatureLabel('premium'), PLAN_GESTOR_FEATURES.premium)
  assert.equal(PLAN_GESTOR_FEATURES.standard, 'Hasta 1 gestor de venta')
  assert.equal(PLAN_GESTOR_FEATURES.pro, 'Hasta 3 gestores de venta')
  assert.equal(PLAN_GESTOR_FEATURES.premium, 'Gestores de venta ilimitados')
})
