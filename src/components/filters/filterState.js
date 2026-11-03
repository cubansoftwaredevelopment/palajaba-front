import { rangeForPeriod } from '../admin/AdminDateRangeControls'

export function clearedDateFilter() {
  return {
    datePeriod: 'daily',
    dateRange: rangeForPeriod('daily'),
    dateEnabled: false,
  }
}

export function countActiveFilters(values, keys) {
  const selected = keys.reduce((total, key) => {
    const value = values[key]
    if (Array.isArray(value)) return total + value.length
    return total + (value ? 1 : 0)
  }, 0)
  return selected + (values.dateEnabled ? 1 : 0)
}
