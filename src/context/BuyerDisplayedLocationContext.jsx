import { createContext, useContext } from 'react'
import { getBuyerLocation } from '../lib/buyerLocation'

const BuyerDisplayedLocationContext = createContext(null)

export function BuyerDisplayedLocationProvider({ location, children }) {
  return (
    <BuyerDisplayedLocationContext.Provider value={location ?? null}>
      {children}
    </BuyerDisplayedLocationContext.Provider>
  )
}

export function useDisplayedLocation() {
  return useContext(BuyerDisplayedLocationContext) ?? getBuyerLocation()
}
