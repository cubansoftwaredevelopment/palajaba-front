import { Navigate, useParams } from 'react-router-dom'
import { storePublicPath } from '../../seller/utils/storeSlug.js'

export default function RedirectLegacyStoreRoute() {
  const { storeSlug } = useParams()
  return <Navigate to={storePublicPath(storeSlug)} replace />
}
