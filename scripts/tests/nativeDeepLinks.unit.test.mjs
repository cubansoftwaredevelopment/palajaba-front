import assert from 'node:assert/strict'
import test from 'node:test'

/**
 * Copia la lógica pura de deepLinkPathFromUrl para unit test sin Capacitor.
 * Mantener alineada con src/lib/nativeDeepLinks.js
 */
function deepLinkPathFromUrl(urlString, siteHostname) {
  if (!urlString || !siteHostname) return null
  try {
    const url = new URL(String(urlString))
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    if (url.hostname.toLowerCase() !== siteHostname) return null
    return `${url.pathname}${url.search}${url.hash}` || '/'
  } catch {
    return null
  }
}

test('deepLinkPathFromUrl acepta cualquier ruta del SITE_URL', () => {
  const host = 'palajaba.com'
  assert.equal(
    deepLinkPathFromUrl('https://palajaba.com/comprar?producto=1', host),
    '/comprar?producto=1',
  )
  assert.equal(deepLinkPathFromUrl('https://palajaba.com/tienda/pedidos', host), '/tienda/pedidos')
  assert.equal(deepLinkPathFromUrl('https://palajaba.com/mi-tienda', host), '/mi-tienda')
  assert.equal(deepLinkPathFromUrl('https://palajaba.com/', host), '/')
})

test('deepLinkPathFromUrl rechaza otro host', () => {
  assert.equal(
    deepLinkPathFromUrl('https://evil.example/comprar', 'palajaba.com'),
    null,
  )
})
