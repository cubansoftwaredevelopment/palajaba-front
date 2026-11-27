import { Navigate, useLocation } from 'react-router-dom'
import { isCustomerAccountPath } from '../../motion/RouteMotion.jsx'
import { isCustomerAuthenticated } from '../../customer/utils/customerAuth.js'

export default function CustomerRoute({ children }) {
  const location = useLocation()
  if (isCustomerAuthenticated()) return children
  // La cuenta se conserva oculta al cambiar de pantalla. Si la sesión ya
  // se cerró, no redirijas desde esa copia: la ruta visible ya es otra.
  if (!isCustomerAccountPath(location.pathname)) return null
  return <Navigate to="/login" replace state={{ accountType: 'customer', backTo: location.pathname }} />
}
