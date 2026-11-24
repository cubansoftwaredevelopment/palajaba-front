import { Navigate, useParams } from 'react-router-dom'
import { isMensajeroAuthenticated, mensajeroLoginPath } from '../utils/session.js'

export default function MensajeroRouteGuard({ children }) {
  const { alias } = useParams()
  if (!isMensajeroAuthenticated()) return <Navigate to={mensajeroLoginPath(alias)} replace />
  return children
}
