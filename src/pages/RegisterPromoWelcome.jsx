import AuthCard from '../components/auth/AuthCard'
import AuthHeader from '../components/auth/AuthHeader'
import AuthShell from '../components/auth/AuthShell'
import { authCenteredBlock, authPageIntro } from '../components/auth/authStyles'
import Button from '../components/Button'

const PROMO_MASCOT = {
  image: '/images/welcome/jabi.png',
  imageAlt: 'Jabi celebrando tu regalo de bienvenida en Pa\' La Jaba',
  name: 'Jabi',
}

export default function RegisterPromoWelcome({ onContinue }) {
  return (
    <AuthShell backTo="/" backLabel="Inicio" contentWidth="narrow">
      <section className="animate-fade-in" aria-labelledby="promo-title">
        <div className={authPageIntro}>
          <AuthHeader
            eyebrow="Promoción de lanzamiento"
            title="¡Felicidades!"
            description="Eres de los primeros en unirte a Pa' La Jaba."
            layout="desktop-left"
          />
        </div>

        <div className={`${authCenteredBlock} flex flex-col items-center gap-6`}>
          <div className="relative">
            <div
              className="pointer-events-none absolute inset-0 rounded-full bg-brand-yellow/25 blur-2xl"
              aria-hidden="true"
            />
            <div className="relative overflow-hidden rounded-[2rem] border border-brand-yellow/35 bg-brand-white p-4 shadow-[0_16px_40px_rgba(89,128,44,0.12)] ring-4 ring-brand-yellow/20">
              <img
                src={PROMO_MASCOT.image}
                alt={PROMO_MASCOT.imageAlt}
                width={220}
                height={220}
                className="mx-auto h-44 w-44 object-contain sm:h-52 sm:w-52"
              />
            </div>
          </div>

          <AuthCard className="w-full text-center lg:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-carmelita/80">
              {PROMO_MASCOT.name} te lo cuenta
            </p>
            <h2 id="promo-title" className="mt-2 font-display text-2xl font-bold text-brand-green">
              Plan Premium gratis por 1 mes
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-carmelita/90">
              Te has ganado acceso inmediato al plan <strong className="text-brand-green">Premium</strong>{' '}
              durante 30 días, sin transferencia ni espera de aprobación.
            </p>
          </AuthCard>

          <div className="flex w-full flex-col gap-2.5">
            <Button onClick={onContinue}>Comenzar registro</Button>
            <p className="text-center text-xs leading-relaxed text-brand-carmelita/80">
              Solo necesitas el nombre de tu tienda, teléfono y contraseña.
            </p>
          </div>
        </div>
      </section>
    </AuthShell>
  )
}
