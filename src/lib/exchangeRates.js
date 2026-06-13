import { fetchExchangeRates as fetchExchangeRatesApi } from './api'

export const FALLBACK_CUP_PER_UNIT = {
  CUP: 1,
  USD: 250,
  EUR: 275,
  MLC: 250,
}

let cupPerUnit = { ...FALLBACK_CUP_PER_UNIT }
let cachePromise = null
let lastMeta = null

export function getCupPerUnit() {
  return cupPerUnit
}

export function getExchangeRatesMeta() {
  return lastMeta
}

export function setCupPerUnit(nextRates) {
  if (!nextRates || typeof nextRates !== 'object') return
  cupPerUnit = {
    CUP: 1,
    USD: Number(nextRates.USD) || FALLBACK_CUP_PER_UNIT.USD,
    EUR: Number(nextRates.EUR) || FALLBACK_CUP_PER_UNIT.EUR,
    MLC: Number(nextRates.MLC) || FALLBACK_CUP_PER_UNIT.MLC,
  }
}

export function loadExchangeRates({ force = false } = {}) {
  if (!force && cachePromise) {
    return cachePromise
  }

  cachePromise = fetchExchangeRatesApi()
    .then((data) => {
      if (data?.cup_per_unit) {
        setCupPerUnit(data.cup_per_unit)
      }
      lastMeta = {
        updatedAt: data?.updated_at ?? null,
        source: data?.source ?? 'elTOQUE',
        attribution: data?.attribution ?? 'Tasas de elTOQUE (TRMI)',
        referenceDate: data?.reference_date ?? null,
        referenceTime: data?.reference_time ?? null,
        stale: Boolean(data?.stale),
      }
      return data
    })
    .catch((error) => {
      cachePromise = null
      throw error
    })

  return cachePromise
}

export function resetExchangeRatesCache() {
  cachePromise = null
}
