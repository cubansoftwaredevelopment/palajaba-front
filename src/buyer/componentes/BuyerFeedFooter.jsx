import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Logo from '../../shared/componentes/Logo.jsx'
import { BRAND_NAME } from '../../shared/utils/branding.js'
import { getAdditionalMunicipalities, getBuyerLocation } from '../utils/buyerLocation.js'
import { openExternalUrl } from '../../appReleases/utils/nativeApp.js'
import { buildWhatsAppUrl } from '../../orders/utils/whatsappOrder.js'
import { PLATFORM_PRIVACY_PATH } from '../../platform/utils/platformPrivacy.js'
import { PLATFORM_TERMS_PATH } from '../../platform/utils/platformTerms.js'
import { fetchRenewalContactPhone } from '../../subscriptions/api.js'

const SUPPORT_MESSAGE = 'Hola, necesito ayuda con Pa\' La Jaba.'
const QVAPAY_REGISTER_URL = 'https://www.qvapay.com/register'
const FAQ_PATH = '/preguntas'

const headingClass = 'font-script text-3xl leading-[1.15] text-brand-carmelita'
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

  async function contactSupport() {
    let phone = supportPhone
    if (!phone) {
      try {
        const data = await fetchRenewalContactPhone()
        phone = data?.renewal_contact_phone || ''
        setSupportPhone(phone)
      } catch {
        return
      }
    }
    const url = buildWhatsAppUrl(phone, SUPPORT_MESSAGE)
    if (url) openExternalUrl(url)
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
                <Link to={PLATFORM_PRIVACY_PATH} state={{ returnTo }} className={linkClass}>Política de privacidad</Link>
              </li>
              <li>
                <button type="button" onClick={contactSupport} className={linkClass}>
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
