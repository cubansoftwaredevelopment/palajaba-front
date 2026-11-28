import { Navigate } from 'react-router-dom'
import { isCustomerAuthenticated } from '../../customer/utils/customerAuth.js'
import { hasCompleteBuyerLocation, resolveBuyerEntryPath } from '../../buyer/utils/buyerLocation.js'

export default function WelcomeGate() {
  if (isCustomerAuthenticated() || hasCompleteBuyerLocation()) {
    return <Navigate to={resolveBuyerEntryPath()} replace />
  }

  return <Navigate to="/inicio" replace />
}
