import { Navigate, useLocation } from 'react-router-dom'
import { isSellerAuthenticated } from '../lib/sellerAuth'

export default function SellerRoute({ children }) {
  const location = useLocation()

  if (!isSellerAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
