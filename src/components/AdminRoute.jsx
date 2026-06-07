import { Navigate, useLocation } from 'react-router-dom'
import { isAdminAuthenticated } from '../lib/adminAuth'

export default function AdminRoute({ children }) {
  const location = useLocation()

  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin" replace state={{ from: location.pathname }} />
  }

  return children
}
