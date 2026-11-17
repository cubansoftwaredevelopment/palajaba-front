import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useOutlet, useLocation } from 'react-router-dom'
import { stepShift } from './presets'

const RESERVED = new Set([
  'sucess',
  'success',
  'cancel',
  'tienda',
  'aplicacion',
  'admin',
  'g',
])

const MOTION_PREFIXES = ['/comprar', '/cliente', '/preguntas', '/terminos', '/privacidad', '/registro/planes']

export function isBuyerMotionPath(pathname) {
  if (pathname === '/' || pathname === '/login' || pathname === '/crear-cuenta') return true
  if (MOTION_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return true
  const [first] = pathname.split('/').filter(Boolean)
  if (!first || RESERVED.has(first)) return false
  return true
}

const reducedShift = {
  initial: false,
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 1, x: 0 },
  transition: { duration: 0 },
}

export default function RouteMotion() {
  const location = useLocation()
  const outlet = useOutlet()
  const reduced = useReducedMotion()
  const shift = reduced ? reducedShift : stepShift

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={location.pathname}
          className={reduced ? 'absolute inset-0 h-full w-full overflow-hidden' : 'screen-step absolute inset-0 h-full w-full overflow-hidden'}
          {...shift}
        >
          {outlet}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
