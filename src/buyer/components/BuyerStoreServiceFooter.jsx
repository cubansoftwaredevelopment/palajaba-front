import { Link } from 'react-router-dom'
import {
  STORE_PAGES,
  isStorePagePublished,
  storeCopyrightLine,
  storePagePublicPath,
} from '../../lib/storePages'
import { storePublicPath } from '../../lib/storeSlug'
import StoreMark from './StoreMark'

function storeFooterLine(provinceName, offersDelivery) {
  const place = String(provinceName || '').trim()
  const delivery = offersDelivery ? 'Entregas a domicilio' : ''
  return [place, delivery].filter(Boolean).join(' · ')
}

function FooterLink({ to, state, children }) {
  return (
    <Link
      to={to}
      state={state}
      className="block py-1.5 text-[0.95rem] leading-snug text-brand-carmelita transition-colors touch-manipulation hover:text-brand-green"
    >
      {children}
    </Link>
  )
}

export default function BuyerStoreServiceFooter({
  storeName,
  storeSlug,
  pages,
  linkState = null,
  photoUrl = null,
  provinceName = '',
  offersDelivery = false,
  homeTo = '',
  clearFab = false,
}) {
  const serviceLinks = STORE_PAGES.filter((page) => isStorePagePublished(pages, page.key))
  const home = homeTo || storePublicPath(storeSlug)
  const line = storeFooterLine(provinceName, offersDelivery)

  return (
    <footer
      className={`store-service-footer relative -mx-5 mt-auto px-5 pt-10 text-brand-carmelita sm:-mx-6 sm:px-8 lg:-mx-10 lg:px-10 ${
        clearFab
          ? 'pb-[calc(7.5rem+var(--safe-bottom))]'
          : 'pb-[max(4.5rem,calc(3.25rem+var(--safe-bottom)))]'
      }`}
      aria-label="Servicio al cliente"
    >
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        <StoreMark photoUrl={photoUrl} storeName={storeName} size="lg" />
        {line ? <p className="mt-4 text-center text-sm text-brand-carmelita/80">{line}</p> : null}
        <div className="mt-8 grid w-full grid-cols-2 gap-x-8">
          <div>
            {serviceLinks.length ? (
              <>
                <h2 className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-brand-carmelita">
                  Servicio al cliente
                </h2>
                <ul className="mt-3">
                  {serviceLinks.map((page) => (
                    <li key={page.key}>
                      <FooterLink to={storePagePublicPath(storeSlug, page.slug)} state={linkState}>
                        {page.label}
                      </FooterLink>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
          <div>
            <h2 className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-brand-carmelita">Otros</h2>
            <ul className="mt-3">
              <li>
                <FooterLink to={home}>Inicio</FooterLink>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-brand-carmelita/70">
          {storeCopyrightLine(storeName)}
        </p>
      </div>
    </footer>
  )
}
