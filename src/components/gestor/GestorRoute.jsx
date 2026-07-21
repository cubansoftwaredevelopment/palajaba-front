import { Navigate, useLocation, useParams } from 'react-router-dom'
import { gestorLoginPath, isGestorAuthenticated } from '../../lib/gestorAuth'

export default function GestorRoute({ children }) {
  const location = useLocation()
  const { storeSlug } = useParams()

  if (!isGestorAuthenticated()) {
    return (
      <Navigate
        to={gestorLoginPath(storeSlug)}
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return children
}
