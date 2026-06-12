import { isRouteErrorResponse, useRouteError, Link } from 'react-router-dom'
import DeadState from './ui/DeadState'
import ErrorState from './ui/ErrorState'

export default function RouteError() {
  const error = useRouteError()
  const is404 = isRouteErrorResponse(error) && error.status === 404
  const isServerFailure = isRouteErrorResponse(error) && error.status >= 500
  const title = is404
    ? 'Página no encontrada'
    : isServerFailure
      ? 'Servicio no disponible'
      : 'Algo salió mal'
  const message = is404
    ? 'La ruta que buscas no existe o ya no está disponible.'
    : isServerFailure
      ? 'El servidor no respondió correctamente. Inténtalo de nuevo en un momento.'
      : isRouteErrorResponse(error)
        ? error.statusText || 'Ocurrió un error inesperado.'
        : error?.message || 'Ocurrió un error inesperado.'

  if (is404) {
    return (
      <DeadState variant="fullscreen" size="lg" title={title} message={message}>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-brand-white touch-manipulation"
        >
          Volver al inicio
        </Link>
      </DeadState>
    )
  }

  return (
    <ErrorState variant="fullscreen" size="lg" title={title} message={message}>
      <Link
        to="/"
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-brand-white touch-manipulation"
      >
        Volver al inicio
      </Link>
    </ErrorState>
  )
}
