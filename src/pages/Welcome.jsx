import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Logo from '../components/Logo'
import { LOGO_HERO_CLASS } from '../constants/branding'

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-brand-white px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8">
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
          <Button variant="ghost" onClick={() => navigate('/comprar/provincia')}>
            Continuar a comprar
          </Button>
        </nav>
      </section>
    </main>
  )
}
