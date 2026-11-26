import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isSellerAuthenticated } from '../utils/sellerAuth.js'

export default function SellerRoute() {
  const location = useLocation()

  if (!isSellerAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
