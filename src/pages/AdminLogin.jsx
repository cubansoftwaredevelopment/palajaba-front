import { Navigate, useLocation } from 'react-router-dom'
import { isAdminAuthenticated } from '../lib/adminAuth'
import { isSellerAuthenticated } from '../lib/sellerAuth'

export default function AdminLogin() {
  const location = useLocation()
  const redirectTo = location.state?.from ?? '/admin/estadisticas'

  if (isAdminAuthenticated()) {
    return <Navigate to={redirectTo} replace />
  }

  if (!isSellerAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to="/tienda" replace />
}
