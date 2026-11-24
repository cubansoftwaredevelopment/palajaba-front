import { Navigate, useLocation } from 'react-router-dom'
import { isCustomerAuthenticated } from '../../customer/utils/customerAuth.js'

export default function CustomerRoute({ children }) {
  const location = useLocation()
  if (!isCustomerAuthenticated()) {
    return <Navigate to="/login" replace state={{ accountType: 'customer', backTo: location.pathname }} />
  }
  return children
}
