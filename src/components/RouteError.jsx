import { isRouteErrorResponse, useRouteError, Link } from 'react-router-dom'
import DeadState from './ui/DeadState'

export default function RouteError() {
  const error = useRouteError()
  const is404 = isRouteErrorResponse(error) && error.status === 404
  const title = is404 ? 'Página no encontrada' : 'Algo salió mal'
  const message = is404
    ? 'La ruta que buscas no existe o ya no está disponible.'
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
    <main className="flex min-h-dvh flex-col items-center justify-center bg-brand-white px-6 py-12 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-carmelita">Pa&apos; La Jaba</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-brand-green">{title}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-brand-carmelita/90">{message}</p>
      <Link
        to="/"
        className="mt-6 rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-brand-white"
      >
        Volver al inicio
      </Link>
    </main>
  )
}
