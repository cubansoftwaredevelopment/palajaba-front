import { Navigate, useParams } from 'react-router-dom'
import { isMensajeroAuthenticated, mensajeroLoginPath } from '../lib/session'

export default function MensajeroRouteGuard({ children }) {
  const { alias } = useParams()
  if (!isMensajeroAuthenticated()) return <Navigate to={mensajeroLoginPath(alias)} replace />
  return children
}
