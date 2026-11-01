import { Link, useLocation } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import AuthHeader from '../components/AuthHeader'
import AuthShell from '../components/AuthShell'

export default function CreateAccount() {
  const location = useLocation()
  const backTo = location.state?.backTo || '/login'

  return (
    <AuthShell backTo={backTo} backLabel="Volver" contentWidth="narrow">
      <section className="animate-fade-in lg:mx-auto lg:max-w-xl" aria-label="Crear cuenta">
        <AuthHeader
          eyebrow="Crear cuenta"
          title="¿Qué tipo de cuenta necesitas?"
          description="Elige cómo quieres usar Pa’ La Jaba."
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <AuthCard className="flex flex-col">
            <h2 className="font-display text-xl font-bold text-brand-green">Cuenta de negocio</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-carmelita/80">
              Crea el perfil de tu tienda, publica tu catálogo y gestiona tus pedidos.
            </p>
            <Link to="/registro" className="mt-5 flex min-h-11 w-full items-center justify-center rounded-full bg-brand-green px-5 py-2.5 text-center text-sm font-semibold text-brand-white shadow-[0_6px_20px_rgba(89,128,44,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25">
              Crear cuenta de negocio
            </Link>
          </AuthCard>
          <AuthCard className="flex flex-col">
            <h2 className="font-display text-xl font-bold text-brand-green">Cuenta de cliente</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-carmelita/80">
              Guarda tus pedidos, favoritos y direcciones para comprar más fácilmente.
            </p>
            <Link to="/cliente/registro" state={{ backTo: location.state?.backTo || '/cliente' }} className="mt-5 flex min-h-11 w-full items-center justify-center rounded-full bg-brand-green px-5 py-2.5 text-center text-sm font-semibold text-brand-white shadow-[0_6px_20px_rgba(89,128,44,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25">
              Crear cuenta de cliente
            </Link>
          </AuthCard>
        </div>
      </section>
    </AuthShell>
  )
}
