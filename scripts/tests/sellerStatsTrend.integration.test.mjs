import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  getTrendPresentation,
  resolveComparisonForGranularity,
  resolveRevenueSeriesComparisons,
} from '../../src/lib/sellerStatsTrend.js'

function simulateProductsSoldResponse(granularity) {
  const comparisons = {
    daily: {
      comparison_available: true,
      change_percent: 100,
      direction: 'up',
      comparison_label: 'vs ayer',
    },
    weekly: {
      comparison_available: true,
      change_percent: 50,
      direction: 'up',
      comparison_label: 'vs semana pasada',
    },
    monthly: {
      comparison_available: true,
      change_percent: -10,
      direction: 'down',
      comparison_label: 'vs mes pasado',
    },
  }

  return {
    granularity,
    total: 24,
    comparison: comparisons[granularity],
    points: [],
  }
}

function simulateRevenueResponse(granularity) {
  return {
    granularity,
    series: [
      {
        currency: 'USD',
        total: 300,
        comparison: {
          comparison_available: true,
          change_percent: granularity === 'monthly' ? -5 : 25,
          direction: granularity === 'monthly' ? 'down' : 'up',
          comparison_label:
            granularity === 'daily'
              ? 'vs ayer'
              : granularity === 'weekly'
                ? 'vs semana pasada'
                : 'vs mes pasado',
        },
        points: [],
      },
    ],
  }
}

function renderProductsTrend(chart, selectedGranularity) {
  const comparison = resolveComparisonForGranularity(chart, selectedGranularity)
  return getTrendPresentation(comparison)
}

test('flujo integrado: cambiar granularidad actualiza comparativa de productos', () => {
  const dailyView = renderProductsTrend(simulateProductsSoldResponse('daily'), 'daily')
  const weeklyView = renderProductsTrend(simulateProductsSoldResponse('weekly'), 'weekly')
  const monthlyView = renderProductsTrend(simulateProductsSoldResponse('monthly'), 'monthly')

  assert.equal(dailyView.text, '+100,0%')
  assert.equal(dailyView.label, 'vs ayer')
  assert.equal(weeklyView.text, '+50,0%')
  assert.equal(weeklyView.label, 'vs semana pasada')
  assert.equal(monthlyView.text, '-10,0%')
  assert.equal(monthlyView.icon, 'down')
})

test('flujo integrado: cambiar granularidad actualiza comparativa de recaudación', () => {
  const dailyMap = resolveRevenueSeriesComparisons(simulateRevenueResponse('daily'), 'daily')
  const monthlyMap = resolveRevenueSeriesComparisons(
    simulateRevenueResponse('monthly'),
    'monthly',
  )

  assert.equal(getTrendPresentation(dailyMap.USD).text, '+25,0%')
  assert.equal(getTrendPresentation(monthlyMap.USD).text, '-5,0%')
})

test('flujo integrado: respuesta desfasada no muestra comparativa incorrecta', () => {
  const staleChart = simulateProductsSoldResponse('daily')
  const view = renderProductsTrend(staleChart, 'weekly')

  assert.equal(view.text, 'Sin datos previos')
  assert.equal(view.showPercent, false)
})
