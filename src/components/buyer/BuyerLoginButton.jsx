import { Link, useLocation } from 'react-router-dom'
import { buyerLoginTrigger } from './buyerStyles'

export default function BuyerLoginButton() {
  const location = useLocation()
  const backTo = `${location.pathname}${location.search}${location.hash}`

  return (
    <Link
      to="/login"
      state={{ backTo }}
      className={buyerLoginTrigger}
      aria-label="Iniciar sesión"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden="true"
      >
        <circle cx="12" cy="8" r="3.25" />
        <path d="M6.5 19.25v-.5a5.5 5.5 0 0 1 11 0v.5" strokeLinecap="round" />
      </svg>
    </Link>
  )
}
