import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Logo from '../../components/Logo'
import { BRAND_NAME } from '../../constants/branding'
import { getAdditionalMunicipalities, getBuyerLocation } from '../../lib/buyerLocation'
import { openExternalUrl } from '../../lib/nativeApp'
import { buildWhatsAppUrl } from '../../lib/whatsappOrder'
import { PLATFORM_TERMS_PATH } from '../../lib/platformTerms'
import { fetchRenewalContactPhone } from '../../subscriptions/api.js'

const SUPPORT_MESSAGE = 'Hola, necesito ayuda con Pa\' La Jaba.'
const QVAPAY_REGISTER_URL = 'https://www.qvapay.com/register'
const FAQ_PATH = '/preguntas'

const headingClass = 'whitespace-nowrap text-[0.68rem] font-bold uppercase tracking-[0.1em] text-brand-carmelita'
const linkClass = 'block py-1.5 text-left text-[0.95rem] leading-snug text-brand-carmelita transition-colors touch-manipulation hover:text-brand-green focus-visible:outline-none focus-visible:text-brand-green'

function placeLine(location) {
  const municipality = location?.municipality?.name
  if (!municipality) return ''
  const extraCount = getAdditionalMunicipalities(location?.province?.id)
    .filter((id) => id !== location?.municipality?.id)
    .length
  return extraCount > 0 ? `${municipality} +${extraCount}` : municipality
}

export default function BuyerFeedFooter() {
  const location = useLocation()
  const [supportPhone, setSupportPhone] = useState('')
  const returnTo = `${location.pathname}${location.search}`
  const place = placeLine(getBuyerLocation())

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

  const supportUrl = buildWhatsAppUrl(supportPhone, SUPPORT_MESSAGE)

  function contactSupport() {
    if (supportUrl) openExternalUrl(supportUrl)
  }

  return (
    <footer className="pb-6 pt-10 text-brand-carmelita" aria-label="Pa' La Jaba">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        <Logo className="h-16 w-16" />
        <p className="mt-3 font-display text-lg font-bold text-brand-green">{BRAND_NAME}</p>
        {place ? <p className="mt-4 text-center text-sm text-brand-carmelita/80">{place}</p> : null}
        <div className="mt-8 grid w-full grid-cols-2 gap-x-8">
          <div>
            <h2 className={headingClass}>Servicio al cliente</h2>
            <ul className="mt-3">
              <li>
                <Link to={FAQ_PATH} state={{ returnTo }} className={linkClass}>Preguntas y respuestas</Link>
              </li>
              <li>
                <Link to={PLATFORM_TERMS_PATH} state={{ returnTo }} className={linkClass}>Términos y condiciones</Link>
              </li>
              <li>
                <button type="button" onClick={contactSupport} disabled={!supportUrl} className={`${linkClass} disabled:cursor-not-allowed disabled:opacity-40`}>
                  Contactar soporte
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h2 className={headingClass}>Otros</h2>
            <ul className="mt-3">
              <li>
                <Link to="/comprar" className={linkClass}>Inicio</Link>
              </li>
              <li>
                <Link to="/registro/planes" state={{ returnTo }} className={linkClass}>Crear un catálogo</Link>
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
          © {new Date().getFullYear()} Pa&apos; La Jaba. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
