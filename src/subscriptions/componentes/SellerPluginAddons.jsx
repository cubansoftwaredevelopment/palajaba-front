import { Link } from 'react-router-dom'
import { LOGO } from '../../shared/utils/branding.js'

export default function SellerPluginAddons() {
  return (
    <Link
      to="/tienda/perfil/personalizacion"
      className="flex flex-col rounded-2xl border border-brand-green/12 bg-brand-white p-5 text-left transition hover:border-brand-green/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40"
    >
      <img src={LOGO.png} alt="" className="h-12 w-12 object-contain" />
      <span className="mt-3 block font-display text-2xl font-bold text-brand-green">Personalización de plan</span>
      <span className="mt-2 block text-sm leading-relaxed text-brand-carmelita/85">Arma tu plan eligiendo solo lo que tu tienda va a usar.</span>
    </Link>
  )
}
