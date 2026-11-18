import { Navigate } from 'react-router-dom'
import { getSellerToken } from '../lib/sellerAuth'
import { resolveBuyerEntryPath } from '../lib/buyerLocation'

export default function WelcomeGate() {
  if (getSellerToken()) {
    return <Navigate to="/tienda" replace />
  }

  return <Navigate to={resolveBuyerEntryPath()} replace />
}
