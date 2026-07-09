import { Link } from 'react-router-dom'
import Logo from '../Logo'
import { BRAND_NAME } from '../../constants/branding'
import {
  buyerCatalogPoweredFooter,
  buyerCatalogPoweredFooterCta,
  buyerCatalogPoweredFooterEyebrow,
  buyerCatalogPoweredFooterShell,
  buyerCatalogPoweredFooterSubtitle,
  buyerCatalogPoweredFooterTitle,
} from './buyerStyles'

const ARROW_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export default function BuyerCatalogPoweredFooter() {
  return (
    <footer className={buyerCatalogPoweredFooter} aria-label={`Catálogo creado con ${BRAND_NAME}`}>
      <div className={buyerCatalogPoweredFooterShell}>
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-brand-yellow/10 to-transparent"
          aria-hidden="true"
        />

        <div className="relative flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
            <Logo className="h-9 w-9 shrink-0 sm:h-12 sm:w-12 lg:h-14 lg:w-14" />

            <div className="min-w-0 flex-1">
              <span className={`${buyerCatalogPoweredFooterEyebrow} hidden sm:inline-flex`}>
                Catálogo digital
              </span>
              <h2 className={buyerCatalogPoweredFooterTitle}>
                Creado con {BRAND_NAME}
              </h2>
              <p className={buyerCatalogPoweredFooterSubtitle}>
                <span className="sm:hidden">¿Tienes un negocio? Monta tu catálogo y vende por WhatsApp.</span>
                <span className="hidden sm:inline">
                  ¿Tienes un negocio? Publica productos, recibe pedidos por WhatsApp y comparte tu tienda en un solo
                  enlace.
                </span>
              </p>
            </div>
          </div>

          <Link to="/registro" className={buyerCatalogPoweredFooterCta}>
            Crear mi catálogo
            {ARROW_ICON}
          </Link>
        </div>
      </div>
    </footer>
  )
}
