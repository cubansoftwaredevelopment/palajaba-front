import { Navigate, useLocation } from 'react-router-dom'
import { isSellerAuthenticated } from '../../seller/utils/sellerAuth.js'

export default function RejectSellerMarketplace({ children }) {
  const location = useLocation()
  const preview = new URLSearchParams(location.search).get('vista') === 'preview'

  if (!preview && isSellerAuthenticated()) {
    return <Navigate to="/tienda" replace />
  }

  return children
}
