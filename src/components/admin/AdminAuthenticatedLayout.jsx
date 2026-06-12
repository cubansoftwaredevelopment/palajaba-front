import { Navigate, useLocation } from 'react-router-dom'
import { isAdminAuthenticated } from '../../lib/adminAuth'
import AdminLayout from './AdminLayout'

export default function AdminAuthenticatedLayout() {
  const location = useLocation()

  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin" replace state={{ from: location.pathname }} />
  }

  return <AdminLayout />
}
