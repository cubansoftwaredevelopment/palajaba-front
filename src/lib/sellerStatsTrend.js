export function formatChangePercent(changePercent) {
  if (changePercent == null || Number.isNaN(Number(changePercent))) {
    return null
  }
  const value = Number(changePercent)
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toLocaleString('es', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

export function getTrendPresentation(comparison) {
  if (!comparison?.comparison_available) {
    return {
      text: 'Sin datos previos',
      textClass: 'text-brand-carmelita/70',
      icon: null,
      ariaLabel: 'Comparativa no disponible',
      showPercent: false,
    }
  }

  const formatted = formatChangePercent(comparison.change_percent)
  const label = comparison.comparison_label || 'vs periodo anterior'

  if (comparison.direction === 'up') {
    return {
      text: formatted,
      textClass: 'text-brand-green',
      icon: 'up',
      ariaLabel: `Crecimiento de ${formatted} ${label}`,
      showPercent: true,
      label,
    }
  }

  if (comparison.direction === 'down') {
    return {
      text: formatted,
      textClass: 'text-[#c0392b]',
      icon: 'down',
      ariaLabel: `Disminución de ${formatted} ${label}`,
      showPercent: true,
      label,
    }
  }

  return {
    text: formatted ?? '0,0%',
    textClass: 'text-brand-carmelita/80',
    icon: 'flat',
    ariaLabel: `Sin cambio ${label}`,
    showPercent: true,
    label,
  }
}

export function resolveComparisonForGranularity(chart, granularity) {
  if (!chart || chart.granularity !== granularity) {
    return null
  }
  return chart.comparison ?? null
}

export function resolveRevenueSeriesComparisons(chart, granularity) {
  if (!chart || chart.granularity !== granularity || !Array.isArray(chart.series)) {
    return {}
  }

  return Object.fromEntries(
    chart.series.map((series) => [series.currency, series.comparison ?? null]),
  )
}
