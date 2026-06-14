import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Logo from '../components/Logo'
import SellerLoadingScreen from '../components/seller/SellerLoadingScreen'
import { LOGO_HERO_CLASS, MARKETPLACE_LABEL } from '../constants/branding'
import { ApiError, fetchSellerProfile } from '../lib/api'
import { resolveBuyerEntryPath } from '../lib/buyerLocation'
import { clearSellerSession, getSellerToken, setSellerSession } from '../lib/sellerAuth'
import { isSessionError } from '../lib/userFacingError'

export default function Welcome() {
  const navigate = useNavigate()
  const [checkingSession, setCheckingSession] = useState(() => Boolean(getSellerToken()))

  useEffect(() => {
    const token = getSellerToken()
    if (!token) return undefined

    let cancelled = false

    async function restoreSession() {
      try {
        const seller = await fetchSellerProfile(token)
        if (cancelled) return
        setSellerSession(token, seller)
        navigate('/tienda', { replace: true })
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.code === 'subscription_expired') {
          clearSellerSession()
          navigate('/login', { replace: true })
          return
        }
        if (isSessionError(err)) {
          clearSellerSession()
        }
        setCheckingSession(false)
      }
    }

    restoreSession()
    return () => {
      cancelled = true
    }
  }, [navigate])

  function goToBuy() {
    navigate(resolveBuyerEntryPath())
  }

  if (checkingSession) {
    return <SellerLoadingScreen message="Entrando…" />
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-brand-white px-5 pt-[max(1.5rem,var(--safe-top))] pb-[max(1.5rem,var(--safe-bottom))] sm:px-8">
      <div
        className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-brand-yellow/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-16 h-72 w-72 rounded-full bg-brand-green/10 blur-3xl"
        aria-hidden="true"
      />

      <section
        className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center animate-fade-in"
        aria-labelledby="welcome-title"
      >
        <header className="mb-10 flex w-full flex-col items-center text-center sm:mb-12">
          <h1 id="welcome-title" className="sr-only">
            Pa&apos; La Jaba
          </h1>
          <Logo
            priority
            className={`mb-1 drop-shadow-[0_16px_32px_rgba(89,128,44,0.18)] ${LOGO_HERO_CLASS}`}
          />
          <p className="max-w-xs font-display text-sm leading-relaxed text-brand-carmelita/90 sm:text-base">
            Compra, vende y descubre lo mejor de Cuba.
          </p>
        </header>

        <nav className="flex w-full flex-col gap-3" aria-label="Opciones de acceso">
          <Button variant="primary" onClick={() => navigate('/login')}>
            Iniciar sesión
          </Button>
          <Button variant="secondary" onClick={() => navigate('/registro')}>
            Crear cuenta
          </Button>
          <Button variant="ghost" onClick={goToBuy}>
            Ir al {MARKETPLACE_LABEL.toLowerCase()}
          </Button>
        </nav>
      </section>
    </main>
  )
}
