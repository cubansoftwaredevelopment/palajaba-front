import { fetchExchangeRates as fetchExchangeRatesApi } from './api'

let cupPerUnit = null
let ratesAvailable = false
let cachePromise = null
let lastMeta = null

function hasValidRates(nextRates) {
  if (!nextRates || typeof nextRates !== 'object') return false
  return ['USD', 'EUR', 'MLC'].every((code) => Number.isFinite(Number(nextRates[code])))
}

export function areExchangeRatesAvailable() {
  return ratesAvailable
}

export function getCupPerUnit() {
  if (!ratesAvailable || !cupPerUnit) {
    return { CUP: 1 }
  }
  return cupPerUnit
}

export function getExchangeRatesMeta() {
  return lastMeta
}

export function setCupPerUnit(nextRates, { available = true } = {}) {
  if (!available || !hasValidRates(nextRates)) {
    ratesAvailable = false
    cupPerUnit = null
    return
  }

  ratesAvailable = true
  cupPerUnit = {
    CUP: 1,
    USD: Number(nextRates.USD),
    EUR: Number(nextRates.EUR),
    MLC: Number(nextRates.MLC),
  }
}

export function loadExchangeRates({ force = false } = {}) {
  if (!force && cachePromise) {
    return cachePromise
  }

  cachePromise = fetchExchangeRatesApi()
    .then((data) => {
      const available = Boolean(data?.rates_available)
      if (available && data?.cup_per_unit) {
        setCupPerUnit(data.cup_per_unit, { available: true })
      } else {
        setCupPerUnit(null, { available: false })
      }
      lastMeta = {
        updatedAt: data?.updated_at ?? null,
        source: data?.source ?? 'elTOQUE',
        attribution: data?.attribution ?? 'Tasas de elTOQUE (TRMI)',
        referenceDate: data?.reference_date ?? null,
        referenceTime: data?.reference_time ?? null,
        stale: Boolean(data?.stale),
        available,
      }
      return data
    })
    .catch((error) => {
      cachePromise = null
      setCupPerUnit(null, { available: false })
      throw error
    })

  return cachePromise
}

export function resetExchangeRatesCache() {
  cachePromise = null
}
