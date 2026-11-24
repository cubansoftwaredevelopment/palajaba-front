import { Navigate, useLocation } from 'react-router-dom'
import { isAdminAuthenticated } from '../utils/adminAuth.js'
import AdminLayout from './AdminLayout.jsx'

export default function AdminAuthenticatedLayout() {
  const location = useLocation()

  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin" replace state={{ from: location.pathname }} />
  }

  return <AdminLayout />
}
