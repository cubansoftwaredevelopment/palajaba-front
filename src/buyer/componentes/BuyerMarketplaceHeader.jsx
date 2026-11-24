import { Link } from 'react-router-dom'
import Logo from '../../shared/componentes/Logo.jsx'
import { setDeliveryOnly, useDeliveryOnly } from '../utils/buyerDeliveryFilter.js'
import BuyerLocationDisplay from './BuyerLocationDisplay.jsx'

export function BuyerMarketplaceBrand() {
  return (
    <Link to="/comprar" className="inline-flex min-w-0 items-center" aria-label="Pa' La Jaba">
      <Logo className="h-12 w-auto max-w-[12rem]" priority />
    </Link>
  )
}

export function BuyerMarketplaceLocationRow({ province, municipality, extraMunicipalityCount = 0 }) {
  const deliveryOnly = useDeliveryOnly()

  return (
    <div className="flex items-center justify-between gap-3">
      <BuyerLocationDisplay
        province={province}
        municipality={municipality}
        extraMunicipalityCount={extraMunicipalityCount}
      />
      <button
        type="button"
        aria-pressed={deliveryOnly}
        onClick={() => setDeliveryOnly(!deliveryOnly)}
        className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 ${
          deliveryOnly
            ? 'bg-brand-green text-brand-white shadow-[0_4px_12px_rgba(89,128,44,0.28)]'
            : 'border border-brand-green/15 bg-brand-white text-brand-carmelita active:bg-brand-green/8'
        }`}
        aria-label={deliveryOnly ? 'Quitar el filtro de domicilio' : 'Ver tiendas con domicilio en esta zona'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 7h11v8H3z" />
          <path d="M14 10h4l3 3v2h-7" />
          <circle cx="7.5" cy="17.5" r="1.5" />
          <circle cx="17.5" cy="17.5" r="1.5" />
        </svg>
        Domicilio
      </button>
    </div>
  )
}
