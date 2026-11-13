import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

import {
  PLATFORM_PRIVACY_DELETE_HASH,
  PLATFORM_PRIVACY_PATH,
  PLATFORM_PRIVACY_SECTIONS,
} from '../../src/lib/platformPrivacy.js'
import { PLATFORM_TERMS_SECTIONS } from '../../src/lib/platformTerms.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

function readSrc(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8')
}

test('la política de privacidad documenta la eliminación de cuenta con ancla Play', () => {
  assert.equal(PLATFORM_PRIVACY_PATH, '/privacidad')
  assert.equal(PLATFORM_PRIVACY_DELETE_HASH, 'eliminar-cuenta')

  const deletion = PLATFORM_PRIVACY_SECTIONS.find((section) => section.anchor === PLATFORM_PRIVACY_DELETE_HASH)
  assert.ok(deletion, 'falta la sección de eliminación de cuenta')
  assert.match(deletion.title, /Eliminación de cuenta/i)

  const text = deletion.blocks.map((block) => block.text || '').join(' ')
  assert.match(text, /cliente/i)
  assert.match(text, /tienda/i)
  assert.match(text, /pedidos/i)
  assert.match(text, /no se eliminan/i)
})

test('los términos remiten a /privacidad#eliminar-cuenta y a la conservación de pedidos', () => {
  const section = PLATFORM_TERMS_SECTIONS.find((item) => item.title.startsWith('12.'))
  assert.ok(section)
  const text = section.blocks.map((block) => block.text || '').join(' ')
  assert.match(text, /\/privacidad#eliminar-cuenta/)
  assert.match(text, /no elimina los pedidos/i)
})

test('el front expone DELETE de cuenta para cliente y tienda', () => {
  const customerApi = readSrc('src/customer/api.js')
  const sellerApi = readSrc('src/auth/api.js')
  const customerPage = readSrc('src/customer/pages/CustomerAccount.jsx')
  const sellerPage = readSrc('src/components/seller/SellerAdvancedProfileSettings.jsx')
  const appRoutes = readSrc('src/App.jsx')
  const footer = readSrc('src/buyer/components/BuyerFeedFooter.jsx')

  assert.match(customerApi, /export function deleteCustomerAccount/)
  assert.match(customerApi, /method:\s*'DELETE'/)
  assert.match(customerApi, /\/api\/customers\/me/)

  assert.match(sellerApi, /export function deleteSellerAccount/)
  assert.match(sellerApi, /method:\s*'DELETE'/)
  assert.match(sellerApi, /\/api\/auth\/me/)

  assert.match(customerPage, /Eliminar cuenta/)
  assert.match(customerPage, /deleteCustomerAccount/)
  assert.match(sellerPage, /Eliminar cuenta/)
  assert.match(sellerPage, /deleteSellerAccount/)

  assert.match(appRoutes, /path:\s*'privacidad'/)
  assert.match(footer, /PLATFORM_PRIVACY_PATH/)
  assert.match(footer, /Política de privacidad/)
})
