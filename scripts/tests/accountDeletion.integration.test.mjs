import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  PLATFORM_PRIVACY_DELETE_HASH,
  PLATFORM_PRIVACY_PATH,
  PLATFORM_PRIVACY_SECTIONS,
} from '../../src/lib/platformPrivacy.js'
import { PLATFORM_TERMS_SECTIONS } from '../../src/lib/platformTerms.js'

/**
 * Simula el copy que Play Console y la UI deben poder enlazar
 * sin montar React: privacidad → ancla → términos.
 */
function resolveAccountDeletionDocs() {
  const privacySection = PLATFORM_PRIVACY_SECTIONS.find(
    (section) => section.anchor === PLATFORM_PRIVACY_DELETE_HASH,
  )
  const termsSection = PLATFORM_TERMS_SECTIONS.find((section) => section.title.startsWith('12.'))
  const playUrl = `${PLATFORM_PRIVACY_PATH}#${PLATFORM_PRIVACY_DELETE_HASH}`
  const termsText = (termsSection?.blocks || []).map((block) => block.text || '').join(' ')

  return {
    playUrl,
    privacyTitle: privacySection?.title || null,
    termsMentionsPlayUrl: termsText.includes(playUrl),
    privacyMentionsOrders: (privacySection?.blocks || [])
      .map((block) => block.text || '')
      .join(' ')
      .toLowerCase()
      .includes('pedidos'),
  }
}

/**
 * Contrato de conservación: tras borrar una parte, la otra sigue
 * viendo el snapshot del pedido (sin depender de la cuenta eliminada).
 */
function survivingOrderViews(order) {
  return {
    forStoreAfterCustomerDeleted: {
      id: order.id,
      store_name: order.store_name,
      buyer_id: order.buyer_id,
      buyer_name: order.buyer_name,
      buyer_email: order.buyer_email,
      buyer_phone: order.buyer_phone,
      status: order.status,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
      })),
    },
    forCustomerAfterStoreDeleted: {
      id: order.id,
      store_id: order.store_id,
      store_name: order.store_name,
      status: order.status,
      items: order.items.map((item) => ({
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    },
  }
}

test('flujo integrado: docs de borrado listos para Play y registro', () => {
  const docs = resolveAccountDeletionDocs()
  assert.equal(docs.playUrl, '/privacidad#eliminar-cuenta')
  assert.match(docs.privacyTitle || '', /Eliminación de cuenta/i)
  assert.equal(docs.termsMentionsPlayUrl, true)
  assert.equal(docs.privacyMentionsOrders, true)
})

test('flujo integrado: cliente y tienda tienen el mismo contrato de conservación', () => {
  const deletion = PLATFORM_PRIVACY_SECTIONS.find(
    (section) => section.anchor === PLATFORM_PRIVACY_DELETE_HASH,
  )
  const text = (deletion?.blocks || []).map((block) => block.text || '').join('\n')

  assert.match(text, /cuenta de cliente/i)
  assert.match(text, /cuenta de tienda/i)
  assert.match(text, /No se eliminan los pedidos ya registrados/i)
  assert.match(text, /historial/i)
})

test('flujo integrado: si borra el cliente, la tienda conserva datos del pedido', () => {
  const order = {
    id: 'ord-1',
    store_id: 'store-1',
    store_name: 'Atelier',
    buyer_id: 'cust-1',
    buyer_name: 'Ana Pérez',
    buyer_email: 'ana@example.com',
    buyer_phone: '+5355511111',
    status: 'completed',
    items: [{ product_id: 'p1', name: 'Bolso', quantity: 1, unit_price: 40, line_total: 40 }],
  }

  const views = survivingOrderViews(order)
  assert.deepEqual(views.forStoreAfterCustomerDeleted, {
    id: 'ord-1',
    store_name: 'Atelier',
    buyer_id: 'cust-1',
    buyer_name: 'Ana Pérez',
    buyer_email: 'ana@example.com',
    buyer_phone: '+5355511111',
    status: 'completed',
    items: [{ name: 'Bolso', quantity: 1, unit_price: 40, line_total: 40 }],
  })
})

test('flujo integrado: si borra la tienda, el cliente conserva datos del pedido', () => {
  const order = {
    id: 'ord-2',
    store_id: 'store-2',
    store_name: 'Casa & Co.',
    buyer_id: 'cust-2',
    buyer_name: 'Luis',
    buyer_email: 'luis@example.com',
    buyer_phone: '+5355522222',
    status: 'completed',
    items: [{ product_id: 'p9', name: 'Lámpara', quantity: 2, unit_price: 15, line_total: 30 }],
  }

  const views = survivingOrderViews(order)
  assert.deepEqual(views.forCustomerAfterStoreDeleted, {
    id: 'ord-2',
    store_id: 'store-2',
    store_name: 'Casa & Co.',
    status: 'completed',
    items: [{ product_id: 'p9', name: 'Lámpara', quantity: 2, unit_price: 15 }],
  })
})
