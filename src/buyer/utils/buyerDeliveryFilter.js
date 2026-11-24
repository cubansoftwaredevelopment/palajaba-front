import { useEffect, useState } from 'react'

const KEY = 'pala-jaba-delivery-only'
export const DELIVERY_FILTER_EVENT = 'pala-jaba-delivery-filter'

export function isDeliveryOnly() {
  try {
    return window.sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function setDeliveryOnly(value) {
  try {
    window.sessionStorage.setItem(KEY, value ? '1' : '0')
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(DELIVERY_FILTER_EVENT))
}

export function useDeliveryOnly() {
  const [enabled, setEnabled] = useState(isDeliveryOnly)

  useEffect(() => {
    const sync = () => setEnabled(isDeliveryOnly())
    window.addEventListener(DELIVERY_FILTER_EVENT, sync)
    return () => window.removeEventListener(DELIVERY_FILTER_EVENT, sync)
  }, [])

  return enabled
}
