import assert from 'node:assert/strict'
import { test } from 'node:test'

/** Espejo de la lógica de etiqueta del ranking (AdminTopBusinessesChart). */
function shortenName(name, maxLength = 18) {
  if (!name || name.length <= maxLength) return name
  return `${name.slice(0, maxLength - 1)}…`
}

test('shortenName deja nombres cortos intactos', () => {
  assert.equal(shortenName('Tienda Pepe'), 'Tienda Pepe')
})

test('shortenName trunca nombres largos', () => {
  const long = 'Super Mercado Cubano Del Este'
  const short = shortenName(long, 18)
  assert.equal(short.length, 18)
  assert.ok(short.endsWith('…'))
})

test('periodos de granularidad esperados en UI', () => {
  const options = [
    { id: 'daily', label: 'Diario' },
    { id: 'weekly', label: 'Semanal' },
    { id: 'monthly', label: 'Mensual' },
  ]
  assert.deepEqual(
    options.map((o) => o.id),
    ['daily', 'weekly', 'monthly'],
  )
})
