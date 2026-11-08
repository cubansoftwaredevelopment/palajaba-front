import { Navigate, useLocation } from 'react-router-dom'
import { isSellerAuthenticated } from '../../lib/sellerAuth'

export default function RejectSellerMarketplace({ children }) {
  const location = useLocation()
  const preview = new URLSearchParams(location.search).get('vista') === 'preview'

  if (!preview && isSellerAuthenticated()) {
    return <Navigate to="/tienda" replace />
  }

  return children
}
