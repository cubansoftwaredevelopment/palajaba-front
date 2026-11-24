import { useRef } from 'react'
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

export function isCustomerAccountPath(pathname) {
  if (pathname === '/cliente') return true
  if (!pathname.startsWith('/cliente/')) return false
  return !pathname.startsWith('/cliente/registro') && !pathname.startsWith('/cliente/recuperar')
}

function motionFrameKey(pathname) {
  if (isCustomerAccountPath(pathname)) return '/cliente'
  return pathname
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
  const frameKey = motionFrameKey(location.pathname)
  const accountActive = frameKey === '/cliente'
  const accountPane = useRef(null)
  if (accountActive) accountPane.current = outlet

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {accountPane.current ? (
        <div
          className={`absolute inset-0 h-full w-full overflow-hidden ${accountActive ? 'z-10' : 'hidden'}`}
          inert={accountActive ? undefined : true}
          aria-hidden={accountActive ? undefined : true}
        >
          {accountPane.current}
        </div>
      ) : null}
      <AnimatePresence mode="popLayout" initial={false}>
        {accountActive ? null : (
          <motion.div
            key={frameKey}
            className={reduced ? 'absolute inset-0 z-20 h-full w-full overflow-hidden' : 'screen-step absolute inset-0 z-20 h-full w-full overflow-hidden'}
            {...shift}
          >
            {outlet}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
