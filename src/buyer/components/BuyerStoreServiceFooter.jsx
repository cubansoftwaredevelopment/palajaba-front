import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BRAND_NAME } from '../../constants/branding'
import { openExternalUrl } from '../../lib/nativeApp'
import { PLATFORM_TERMS_PATH } from '../../lib/platformTerms'
import { buildWhatsAppUrl } from '../../lib/whatsappOrder'
import { fetchRenewalContactPhone } from '../../subscriptions/api.js'
import {
  STORE_PAGES,
  isStorePagePublished,
  storeCopyrightLine,
  storePagePublicPath,
} from '../../lib/storePages'
import { storePublicPath } from '../../lib/storeSlug'
import StoreMark from './StoreMark'

const SUPPORT_MESSAGE = 'Hola, necesito ayuda con Pa\' La Jaba.'
const QVAPAY_REGISTER_URL = 'https://www.qvapay.com/register'
const FAQ_PATH = '/preguntas'
const CATALOG_PATH = '/registro/planes'
const linkClass = 'block w-full py-1.5 text-left text-[0.95rem] leading-snug text-brand-carmelita transition-colors touch-manipulation hover:text-brand-green'

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
      className={linkClass}
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
  const route = useLocation()
  const [supportPhone, setSupportPhone] = useState('')
  const serviceLinks = STORE_PAGES.filter((page) => isStorePagePublished(pages, page.key))
  const home = homeTo || storePublicPath(storeSlug)
  const line = storeFooterLine(provinceName, offersDelivery)
  const termsState = { ...(linkState || {}), returnTo: `${route.pathname}${route.search}` }
  const supportUrl = buildWhatsAppUrl(supportPhone, SUPPORT_MESSAGE)

  useEffect(() => {
    let cancelled = false
    fetchRenewalContactPhone()
      .then((data) => {
        if (!cancelled) setSupportPhone(data?.renewal_contact_phone || '')
      })
      .catch(() => {
        if (!cancelled) setSupportPhone('')
      })
    return () => {
      cancelled = true
    }
  }, [])

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
            <h2 className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-brand-carmelita">
              Servicio al cliente
            </h2>
            <ul className="mt-3">
              <li>
                <FooterLink to={FAQ_PATH} state={termsState}>Preguntas y respuestas</FooterLink>
              </li>
              {serviceLinks.map((page) => (
                <li key={page.key}>
                  <FooterLink to={storePagePublicPath(storeSlug, page.slug)} state={linkState}>
                    {page.label}
                  </FooterLink>
                </li>
              ))}
              <li>
                <FooterLink to={PLATFORM_TERMS_PATH} state={termsState}>
                  Términos de {BRAND_NAME}
                </FooterLink>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => supportUrl && openExternalUrl(supportUrl)}
                  disabled={!supportUrl}
                  className={`${linkClass} disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  Contactar soporte
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-brand-carmelita">Otros</h2>
            <ul className="mt-3">
              <li>
                <FooterLink to={home}>Inicio</FooterLink>
              </li>
              <li>
                <FooterLink to={CATALOG_PATH} state={termsState}>Crear un catálogo</FooterLink>
              </li>
              <li>
                <button type="button" onClick={() => openExternalUrl(QVAPAY_REGISTER_URL)} className={linkClass}>
                  Crear cuenta en QvaPay
                </button>
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
