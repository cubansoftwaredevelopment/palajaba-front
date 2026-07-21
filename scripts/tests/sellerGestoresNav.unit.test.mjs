import assert from 'node:assert/strict'
import { test } from 'node:test'

import { getSellerNavItems, sellerHasGestores } from '../../src/lib/planAccess.js'

test('sellerHasGestores solo con flag activo', () => {
  assert.equal(sellerHasGestores(null), false)
  assert.equal(sellerHasGestores({}), false)
  assert.equal(sellerHasGestores({ gestores_enabled: false }), false)
  assert.equal(sellerHasGestores({ gestores_enabled: true }), true)
})

test('getSellerNavItems oculta Gestores si no está habilitado', () => {
  const without = getSellerNavItems({ gestores_enabled: false })
  assert.equal(without.some((item) => item.id === 'gestores'), false)

  const withFlag = getSellerNavItems({ gestores_enabled: true })
  assert.equal(withFlag.some((item) => item.id === 'gestores'), true)
})
