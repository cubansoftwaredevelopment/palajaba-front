import { Navigate, useParams } from 'react-router-dom'
import { isReservedStoreSlug } from '../../lib/storeSlug'
import BuyerStorePage from '../../pages/buyer/BuyerStorePage'

export default function PublicStoreRoute() {
  const { storeSlug } = useParams()

  if (isReservedStoreSlug(storeSlug)) {
    return <Navigate to="/" replace />
  }

  return <BuyerStorePage />
}
