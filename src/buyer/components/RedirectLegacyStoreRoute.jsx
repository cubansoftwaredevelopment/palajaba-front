import { Navigate, useParams } from 'react-router-dom'
import { storePublicPath } from '../../lib/storeSlug'

export default function RedirectLegacyStoreRoute() {
  const { storeSlug } = useParams()
  return <Navigate to={storePublicPath(storeSlug)} replace />
}
