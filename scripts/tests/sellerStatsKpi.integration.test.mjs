import assert from 'node:assert/strict'
import { test } from 'node:test'

import { buildKpiCardValues } from '../../src/lib/sellerStatsKpi.js'

const TEST_RATES = { CUP: 1, USD: 400, EUR: 450, MLC: 300 }

function simulateApiResponse() {
  return {
    year: 2026,
    month: 3,
    orders_count: 2,
    totals: [
      { currency: 'USD', amount: 100 },
      { currency: 'CUP', amount: 500 },
      { currency: 'MLC', amount: 0 },
      { currency: 'EUR', amount: 0 },
    ],
  }
}

function renderDashboardCards(apiResponse, consolidatedCurrency, cupPerUnit = TEST_RATES) {
  return buildKpiCardValues(apiResponse.totals, consolidatedCurrency, cupPerUnit)
}

test('flujo integrado: respuesta HTTP → tarjetas fijas + consolidado en USD', () => {
  const apiResponse = simulateApiResponse()
  const view = renderDashboardCards(apiResponse, 'USD')

  assert.equal(view.cards.length, 4)
  assert.equal(view.cards[0].id, 'USD')
  assert.equal(view.cards[0].formattedAmount, '100,00')
  assert.equal(view.cards[3].id, 'CUP')
  assert.equal(view.cards[3].formattedAmount, '500')
  assert.equal(view.consolidated.formattedAmount, '101,25')
})

test('flujo integrado: cambiar selector de moneda actualiza tarjeta consolidada', () => {
  const apiResponse = simulateApiResponse()
  const usdView = renderDashboardCards(apiResponse, 'USD')
  const cupView = renderDashboardCards(apiResponse, 'CUP')

  assert.notEqual(usdView.consolidated.formattedAmount, cupView.consolidated.formattedAmount)
  assert.equal(cupView.consolidated.currency, 'CUP')
  assert.equal(cupView.consolidated.amount, 40500)
  assert.equal(cupView.consolidated.conversionUnavailable, false)
})

test('flujo integrado: vendedor sin ventas muestra ceros sin romper tarjetas', () => {
  const apiResponse = {
    year: 2026,
    month: 1,
    orders_count: 0,
    totals: [
      { currency: 'USD', amount: 0 },
      { currency: 'MLC', amount: 0 },
      { currency: 'EUR', amount: 0 },
      { currency: 'CUP', amount: 0 },
    ],
  }
  const view = renderDashboardCards(apiResponse, 'EUR')

  assert.equal(view.consolidated.amount, 0)
  assert.equal(view.consolidated.formattedAmount, '0,00')
  assert.equal(view.consolidated.conversionUnavailable, false)
})
