import { Link } from 'react-router-dom'
import Checkbox from './ui/Checkbox'
import { PLATFORM_TERMS_PATH } from '../lib/platformTerms'

const linkClass = 'font-semibold underline underline-offset-2'

export function PlatformTermsAnchor({ className = '', children = 'Términos y condiciones' }) {
  return (
    <a href={PLATFORM_TERMS_PATH} className={`${linkClass} text-brand-green ${className}`} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}

export default function PlatformTermsLink({ className = '' }) {
  return (
    <Link to={PLATFORM_TERMS_PATH} className={className}>
      Términos y condiciones
    </Link>
  )
}

export function PlatformTermsFooter({ className = '' }) {
  return (
    <p className={`text-center text-xs text-brand-carmelita/70 ${className}`}>
      <PlatformTermsLink className={`${linkClass} text-current`} />
    </p>
  )
}

export function AcceptPlatformTerms({ id, checked, onChange }) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox id={id} checked={checked} onChange={onChange} className="mt-0.5" />
      <p className="text-sm leading-relaxed text-brand-carmelita">
        <label htmlFor={id} className="cursor-pointer">He leído y acepto los</label>{' '}
        <PlatformTermsAnchor>Términos y condiciones</PlatformTermsAnchor>.
      </p>
    </div>
  )
}
