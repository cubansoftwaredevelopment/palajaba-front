import { Navigate } from 'react-router-dom'
import { isCustomerAuthenticated } from '../../customer/utils/customerAuth.js'
import { getSellerToken } from '../../seller/utils/sellerAuth.js'
import { hasCompleteBuyerLocation, resolveBuyerEntryPath } from '../../buyer/utils/buyerLocation.js'

export default function WelcomeGate() {
  if (getSellerToken()) {
    return <Navigate to="/tienda" replace />
  }

  if (isCustomerAuthenticated() || hasCompleteBuyerLocation()) {
    return <Navigate to={resolveBuyerEntryPath()} replace />
  }

  return <Navigate to="/inicio" replace />
}
