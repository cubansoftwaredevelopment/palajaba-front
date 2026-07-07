import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  formatChangePercent,
  getTrendPresentation,
  resolveComparisonForGranularity,
  resolveRevenueSeriesComparisons,
} from '../../src/lib/sellerStatsTrend.js'

test('formatChangePercent agrega signo y una decimal', () => {
  assert.equal(formatChangePercent(5.4), '+5,4%')
  assert.equal(formatChangePercent(-2.1), '-2,1%')
  assert.equal(formatChangePercent(0), '0,0%')
  assert.equal(formatChangePercent(null), null)
})

test('getTrendPresentation positivo usa verde y flecha arriba', () => {
  const view = getTrendPresentation({
    comparison_available: true,
    change_percent: 12.5,
    direction: 'up',
    comparison_label: 'vs ayer',
  })

  assert.equal(view.text, '+12,5%')
  assert.equal(view.textClass, 'text-brand-green')
  assert.equal(view.icon, 'up')
  assert.equal(view.label, 'vs ayer')
})

test('getTrendPresentation negativo usa rojo y flecha abajo', () => {
  const view = getTrendPresentation({
    comparison_available: true,
    change_percent: -3.2,
    direction: 'down',
    comparison_label: 'vs semana pasada',
  })

  assert.equal(view.text, '-3,2%')
  assert.equal(view.textClass, 'text-[#c0392b]')
  assert.equal(view.icon, 'down')
})

test('getTrendPresentation sin datos previos', () => {
  const view = getTrendPresentation({
    comparison_available: false,
    change_percent: null,
    direction: 'unavailable',
  })

  assert.equal(view.text, 'Sin datos previos')
  assert.equal(view.showPercent, false)
})

test('resolveComparisonForGranularity ignora chart de otra granularidad', () => {
  const chart = {
    granularity: 'weekly',
    comparison: { change_percent: 10, comparison_available: true },
  }

  assert.equal(resolveComparisonForGranularity(chart, 'daily'), null)
  assert.deepEqual(resolveComparisonForGranularity(chart, 'weekly'), chart.comparison)
})

test('resolveRevenueSeriesComparisons mapea por moneda', () => {
  const chart = {
    granularity: 'daily',
    series: [
      { currency: 'USD', comparison: { change_percent: 100 } },
      { currency: 'CUP', comparison: { change_percent: -5 } },
    ],
  }

  const map = resolveRevenueSeriesComparisons(chart, 'daily')
  assert.equal(map.USD.change_percent, 100)
  assert.equal(map.CUP.change_percent, -5)
})
