export const KPI_REVENUE_CURRENCIES = ['USD', 'MLC', 'EUR', 'CUP']

export const KPI_CURRENCY_COLORS = {
  CUP: '#59802c',
  USD: '#7b4c38',
  MLC: '#c9970a',
  EUR: '#225688',
}

function convertBetweenCurrencies(amount, fromCurrency, toCurrency, cupPerUnit = { CUP: 1 }) {
  if (fromCurrency === toCurrency) return amount
  const fromRate = cupPerUnit?.[fromCurrency]
  const toRate = cupPerUnit?.[toCurrency]
  if (!fromRate || !toRate) return null

  const inCup = amount * fromRate
  const converted = inCup / toRate

  if (toCurrency === 'CUP') {
    return Math.round(converted)
  }
  return Math.round(converted * 100) / 100
}

export function totalsArrayToMap(totals = []) {
  const map = Object.fromEntries(KPI_REVENUE_CURRENCIES.map((code) => [code, 0]))
  for (const entry of totals) {
    const code = String(entry?.currency ?? '').toUpperCase()
    if (!KPI_REVENUE_CURRENCIES.includes(code)) continue
    const amount = Number(entry?.amount)
    map[code] = Number.isFinite(amount) ? amount : 0
  }
  return map
}

export function formatKpiAmount(amount, currency) {
  if (amount == null || Number.isNaN(Number(amount))) {
    return '0'
  }
  const value = Number(amount)
  if (currency === 'CUP') {
    return Math.round(value).toLocaleString('es')
  }
  return value.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatKpiRevenue(amount, currency) {
  const formattedAmount = formatKpiAmount(amount, currency)
  if (formattedAmount === '0' && (amount == null || Number.isNaN(Number(amount)))) {
    return '0'
  }
  if (currency === 'CUP') {
    return `${formattedAmount} CUP`
  }
  return `${formattedAmount} ${currency}`
}

export function computeConsolidatedTotal(totalsByCurrency, targetCurrency, cupPerUnit) {
  if (!targetCurrency || !KPI_REVENUE_CURRENCIES.includes(targetCurrency)) {
    return null
  }

  let sum = 0
  for (const code of KPI_REVENUE_CURRENCIES) {
    const amount = Number(totalsByCurrency?.[code] ?? 0)
    if (!Number.isFinite(amount) || amount === 0) continue

    if (code === targetCurrency) {
      sum += amount
      continue
    }

    const converted = convertBetweenCurrencies(amount, code, targetCurrency, cupPerUnit)
    if (converted == null) {
      return null
    }
    sum += converted
  }

  if (targetCurrency === 'CUP') {
    return Math.round(sum)
  }
  return Math.round(sum * 100) / 100
}

export function buildKpiCardValues(totals = [], consolidatedCurrency, cupPerUnit) {
  const totalsMap = totalsArrayToMap(totals)
  const consolidatedAmount = computeConsolidatedTotal(totalsMap, consolidatedCurrency, cupPerUnit)

  return {
    totalsMap,
    consolidatedAmount,
    cards: KPI_REVENUE_CURRENCIES.map((currency) => ({
      id: currency,
      label: currency,
      amount: totalsMap[currency],
      formattedAmount: formatKpiAmount(totalsMap[currency], currency),
      formatted: formatKpiRevenue(totalsMap[currency], currency),
    })),
    consolidated: {
      label: 'Total consolidado',
      currency: consolidatedCurrency,
      amount: consolidatedAmount ?? 0,
      formattedAmount:
        consolidatedAmount == null ? '—' : formatKpiAmount(consolidatedAmount, consolidatedCurrency),
      formatted:
        consolidatedAmount == null
          ? '—'
          : formatKpiRevenue(consolidatedAmount, consolidatedCurrency),
      conversionUnavailable: consolidatedAmount == null,
    },
  }
}
