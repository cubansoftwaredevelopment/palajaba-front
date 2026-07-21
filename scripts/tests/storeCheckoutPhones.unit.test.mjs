import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  _resetStoreCheckoutPhonesForTests,
  getStoreCheckoutPhones,
  setStoreCheckoutPhones,
} from '../../src/lib/storeCheckoutPhones.js'

test('setStoreCheckoutPhones guarda y filtra opciones inválidas', () => {
  _resetStoreCheckoutPhonesForTests()
  setStoreCheckoutPhones('store1', [
    { key: 'store', kind: 'store', label: 'Mi Tienda', phone: '51230000' },
    { key: 'g1', kind: 'gestor', label: '@ana', phone: '51231111' },
    { key: 'bad', kind: 'gestor', label: 'x', phone: '' },
  ])
  const phones = getStoreCheckoutPhones('store1')
  assert.equal(phones.length, 2)
  assert.equal(phones[0].key, 'store')
  assert.equal(phones[1].username ?? phones[1].label, phones[1].label)
})

test('setStoreCheckoutPhones vacío limpia la cache', () => {
  _resetStoreCheckoutPhonesForTests()
  setStoreCheckoutPhones('store2', [
    { key: 'store', kind: 'store', label: 'T', phone: '1' },
  ])
  setStoreCheckoutPhones('store2', [])
  assert.equal(getStoreCheckoutPhones('store2'), null)
})
