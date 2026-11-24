import { createContext, useContext } from 'react'

export const SellerReadOnlyContext = createContext(false)

export function useSellerReadOnly() {
  return useContext(SellerReadOnlyContext)
}
