import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthCard from '../components/auth/AuthCard'
import AuthShell from '../components/auth/AuthShell'
import { authCenteredBlock } from '../components/auth/authStyles'
import Button from '../components/Button'
import Logo from '../components/Logo'

export default function RegisterSuccess() {
  const navigate = useNavigate()
  const location = useLocation()
  const isLaunchPromo = Boolean(location.state?.launchPromo)

  return (
    <AuthShell backTo="/" backLabel="Inicio" contentWidth="narrow">
      <section className={`${authCenteredBlock} animate-fade-in`} aria-labelledby="success-title">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <Logo
            priority
            className="mb-5 h-20 w-20 drop-shadow-[0_12px_24px_rgba(89,128,44,0.2)] lg:h-24 lg:w-24"
          />

          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-carmelita">
            {isLaunchPromo ? 'Cuenta activa' : 'Solicitud enviada'}
          </p>
          <h1
            id="success-title"
            className="font-display text-2xl font-bold leading-tight text-brand-green sm:text-[1.65rem] lg:text-3xl"
          >
            {isLaunchPromo ? '¡Tu tienda Premium está lista!' : '¡Gracias por unirte!'}
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-brand-carmelita/90">
            {isLaunchPromo ? (
              <>
                Ya tienes <strong className="text-brand-green">Plan Premium gratis por 1 mes</strong>.
                Inicia sesión ahora con tu teléfono o nombre de tienda.
              </>
            ) : (
              <>
                Revisaremos tu pago en un plazo de{' '}
                <strong className="text-brand-green">24 horas</strong>. Cuando aprueben tu cuenta,
                podrás entrar con tu teléfono o nombre de tienda.
              </>
            )}
          </p>
        </div>

        <AuthCard className="mt-6 w-full text-left">
          <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-brand-green">
            Próximos pasos
          </h2>
          <ol className="flex flex-col gap-2.5 text-sm text-brand-carmelita/90">
            {isLaunchPromo ? (
              <>
                <li className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-yellow/25 text-[0.65rem] font-bold text-brand-green">
                    1
                  </span>
                  Inicia sesión en{' '}
                  <Link to="/login" className="font-semibold text-brand-green hover:underline">
                    Entrar
                  </Link>
                  .
                </li>
                <li className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-yellow/25 text-[0.65rem] font-bold text-brand-green">
                    2
                  </span>
                  Completa el perfil de tu tienda y publica tu catálogo.
                </li>
                <li className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-yellow/25 text-[0.65rem] font-bold text-brand-green">
                    3
                  </span>
                  Disfruta las estadísticas y el boost Premium durante tu mes gratis.
                </li>
              </>
            ) : (
              <>
                <li className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-yellow/25 text-[0.65rem] font-bold text-brand-green">
                    1
                  </span>
                  Espera la confirmación del pago por nuestro equipo.
                </li>
                <li className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-yellow/25 text-[0.65rem] font-bold text-brand-green">
                    2
                  </span>
                  Recibirás acceso cuando tu tienda sea aprobada.
                </li>
                <li className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-yellow/25 text-[0.65rem] font-bold text-brand-green">
                    3
                  </span>
                  Inicia sesión en{' '}
                  <Link to="/login" className="font-semibold text-brand-green hover:underline">
                    Entrar
                  </Link>
                  .
                </li>
              </>
            )}
          </ol>
        </AuthCard>

        <div className="mt-6 flex w-full flex-col gap-2.5">
          <Button onClick={() => navigate('/login')}>Ir a iniciar sesión</Button>
          <Button variant="ghost" onClick={() => navigate('/')}>
            Volver al inicio
          </Button>
        </div>
      </section>
    </AuthShell>
  )
}
