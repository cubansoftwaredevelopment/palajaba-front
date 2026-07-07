import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  buildKpiCardValues,
  computeConsolidatedTotal,
  formatKpiRevenue,
  KPI_REVENUE_CURRENCIES,
  totalsArrayToMap,
} from '../../src/lib/sellerStatsKpi.js'

const TEST_RATES = { CUP: 1, USD: 400, EUR: 450, MLC: 300 }

test('totalsArrayToMap devuelve 0 para monedas sin ventas', () => {
  const map = totalsArrayToMap([{ currency: 'USD', amount: 120 }])
  assert.equal(map.USD, 120)
  assert.equal(map.CUP, 0)
  assert.equal(map.MLC, 0)
  assert.equal(map.EUR, 0)
})

test('formatKpiRevenue muestra 0 legible para valores nulos', () => {
  assert.equal(formatKpiRevenue(null, 'USD'), '0')
  assert.equal(formatKpiRevenue(1500.5, 'CUP'), `${Math.round(1500.5).toLocaleString('es')} CUP`)
})

test('computeConsolidatedTotal convierte todas las monedas al destino', () => {
  const totals = { USD: 10, CUP: 400, MLC: 0, EUR: 0 }
  const consolidated = computeConsolidatedTotal(totals, 'USD', TEST_RATES)
  assert.equal(consolidated, 11)
})

test('computeConsolidatedTotal devuelve null si faltan tasas', () => {
  const totals = { USD: 10, CUP: 400, MLC: 0, EUR: 0 }
  const consolidated = computeConsolidatedTotal(totals, 'USD', { CUP: 1 })
  assert.equal(consolidated, null)
})

test('buildKpiCardValues arma cinco valores de tarjeta', () => {
  const result = buildKpiCardValues(
    [
      { currency: 'USD', amount: 100 },
      { currency: 'CUP', amount: 500 },
    ],
    'USD',
    TEST_RATES,
  )

  assert.equal(result.cards.length, 4)
  assert.equal(result.cards[0].formattedAmount, '100,00')
  assert.equal(result.cards.find((card) => card.id === 'CUP').formattedAmount, '500')
  assert.equal(result.consolidated.currency, 'USD')
  assert.equal(result.consolidated.formattedAmount, '101,25')
  assert.equal(result.consolidated.conversionUnavailable, false)
})

test('buildKpiCardValues tolera respuesta vacía con ceros', () => {
  const result = buildKpiCardValues([], 'CUP', TEST_RATES)
  assert.deepEqual(
    result.cards.map((card) => card.amount),
    [0, 0, 0, 0],
  )
  assert.equal(result.consolidated.amount, 0)
  assert.equal(result.consolidated.formattedAmount, '0')
})

test('cambiar moneda consolidada recalcula el total', () => {
  const totals = [
    { currency: 'USD', amount: 10 },
    { currency: 'CUP', amount: 400 },
  ]
  const usd = buildKpiCardValues(totals, 'USD', TEST_RATES)
  const cup = buildKpiCardValues(totals, 'CUP', TEST_RATES)
  assert.notEqual(usd.consolidated.amount, cup.consolidated.amount)
  assert.equal(cup.consolidated.amount, 4400)
})

test('KPI_REVENUE_CURRENCIES mantiene el orden del dashboard', () => {
  assert.deepEqual(KPI_REVENUE_CURRENCIES, ['USD', 'MLC', 'EUR', 'CUP'])
})
