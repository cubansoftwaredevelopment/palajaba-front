import { Link, useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { JABA_BAG } from '../../constants/branding'
import { badgeSpring } from '../../motion/presets'
import { useBuyerJaba } from '../context.js'
import { buyerJabaBadge, buyerJabaTrigger } from './buyerStyles'

export default function BuyerJabaButton() {
  const reduced = useReducedMotion()
  const { count } = useBuyerJaba()
  const location = useLocation()
  const onCart = location.pathname === '/cart'

  return (
    <Link
      to="/cart"
      className={buyerJabaTrigger}
      aria-label={count > 0 ? `Tu jaba, ${count} productos` : 'Abrir tu jaba'}
      aria-current={onCart ? 'page' : undefined}
    >
      <img
        src={JABA_BAG.src}
        alt=""
        width={44}
        height={44}
        className="h-10 w-10 object-contain lg:h-11 lg:w-11"
        decoding="async"
      />
      {count > 0 ? (
        <motion.span
          key={count}
          className={buyerJabaBadge}
          aria-hidden="true"
          initial={reduced ? false : { scale: 0.4, rotate: -16 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={reduced ? { duration: 0 } : badgeSpring}
        >
          {count > 99 ? '99+' : count}
        </motion.span>
      ) : null}
    </Link>
  )
}
