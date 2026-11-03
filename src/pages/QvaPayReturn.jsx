import { Link } from 'react-router-dom'
import AuthCard from '../auth/components/AuthCard'
import AuthShell from '../auth/components/AuthShell'
import Logo from '../components/Logo'
import { authCenteredBlock } from '../auth/components/authStyles'

function getMarketplaceReturnPath() {
  try {
    const savedPath = window.localStorage.getItem('pala_jaba_last_marketplace_location')
    if (savedPath?.startsWith('/comprar')) return savedPath
  } catch {
    // Si el almacenamiento está deshabilitado, se usa la ruta principal del marketplace.
  }
  return '/comprar'
}

export default function QvaPayReturn({ result }) {
  const successful = result === 'success'
  const returnPath = getMarketplaceReturnPath()

  return (
    <AuthShell backTo="/" backLabel="Inicio" contentWidth="narrow">
      <section className={`${authCenteredBlock} animate-fade-in`} aria-labelledby="qvapay-return-title">
        <div className="flex flex-col items-center text-center">
          <Logo priority className="mb-5 h-20 w-20 drop-shadow-[0_12px_24px_rgba(89,128,44,0.2)]" />
          <div
            className={`mb-3 grid h-14 w-14 place-items-center rounded-full ${successful ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-carmelita/10 text-brand-carmelita'}`}
            aria-hidden="true"
          >
            {successful ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="m7 7 10 10M17 7 7 17" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-carmelita">
            Pago con QvaPay
          </p>
          <h1 id="qvapay-return-title" className="font-display text-2xl font-bold leading-tight text-brand-green sm:text-3xl">
            {successful ? '¡Pago exitoso!' : 'Pago cancelado'}
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-brand-carmelita/90">
            {successful
              ? 'QvaPay indica que tu transacción se completó correctamente. La confirmación puede tardar unos momentos en reflejarse.'
              : 'La transacción fue cancelada y no se completó el pago. Puedes volver e intentarlo nuevamente cuando quieras.'}
          </p>
        </div>

        <AuthCard className="mt-6 w-full">
          <p className="text-sm leading-relaxed text-brand-carmelita/90">
            {successful
              ? 'Si el estado de tu compra o pedido no se actualiza, espera un momento y revisa de nuevo.'
              : 'Si todavía deseas realizar la compra, regresa a Pa’ La Jaba y vuelve a iniciar el pago.'}
          </p>
        </AuthCard>

        <div className="mt-6 w-full">
          <Link
            to={returnPath}
            className="flex min-h-11 w-full items-center justify-center rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-brand-white shadow-[0_6px_20px_rgba(89,128,44,0.3)] transition-all touch-manipulation hover:bg-[#4d7026] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-white"
          >
            Volver al marketplace
          </Link>
        </div>
      </section>
    </AuthShell>
  )
}

