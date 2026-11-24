import { Navigate } from 'react-router-dom'
import { getSellerToken } from '../../seller/utils/sellerAuth.js'
import { resolveBuyerEntryPath } from '../../buyer/utils/buyerLocation.js'

export default function WelcomeGate() {
  if (getSellerToken()) {
    return <Navigate to="/tienda" replace />
  }

  return <Navigate to={resolveBuyerEntryPath()} replace />
}
