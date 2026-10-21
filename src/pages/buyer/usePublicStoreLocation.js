import { useEffect, useState } from 'react'
import { fetchMarketplaceStore } from '../../lib/api'
import {
  getBuyerLocation,
  hasCompleteBuyerLocation,
  readSharedZoneFromSearch,
  setBuyerLocation,
} from '../../lib/buyerLocation'

function businessAreaToLocation(area) {
  if (!area?.province_id || !area?.municipality_id) return null
  return {
    province: { id: area.province_id, name: area.province_name },
    municipality: { id: area.municipality_id, name: area.municipality_name },
  }
}

export function usePublicStoreLocation(storeSlug) {
  const sharedLocation =
    typeof window === 'undefined' ? null : readSharedZoneFromSearch(window.location.search)
  if (sharedLocation) setBuyerLocation(sharedLocation.province, sharedLocation.municipality)

  const buyerLocation = sharedLocation ?? (hasCompleteBuyerLocation() ? getBuyerLocation() : null)
  const [fallbackLocation, setFallbackLocation] = useState(null)
  const [resolvingLocation, setResolvingLocation] = useState(!buyerLocation)
  const [locationError, setLocationError] = useState(false)

  useEffect(() => {
    if (buyerLocation) return undefined

    let cancelled = false
    setResolvingLocation(true)
    setLocationError(false)

    fetchMarketplaceStore(storeSlug)
      .then((store) => {
        if (cancelled) return
        const nextLocation = businessAreaToLocation(store.business_area)
        if (!nextLocation) {
          setLocationError(true)
          setFallbackLocation(null)
          return
        }
        setFallbackLocation(nextLocation)
      })
      .catch(() => {
        if (!cancelled) {
          setLocationError(true)
          setFallbackLocation(null)
        }
      })
      .finally(() => {
        if (!cancelled) setResolvingLocation(false)
      })

    return () => {
      cancelled = true
    }
  }, [buyerLocation, storeSlug])

  return {
    location: buyerLocation ?? fallbackLocation,
    resolvingLocation: buyerLocation ? false : resolvingLocation,
    locationError,
  }
}
