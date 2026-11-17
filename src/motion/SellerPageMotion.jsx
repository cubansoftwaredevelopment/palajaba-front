import { AnimatePresence, PresenceContext, motion, useReducedMotion } from 'framer-motion'
import { useOutlet, useLocation } from 'react-router-dom'
import { stepShift } from './presets'

const reducedShift = {
  initial: false,
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 1, x: 0 },
  transition: { duration: 0 },
}

export function useStepShift() {
  const reduced = useReducedMotion()
  return { reduced, shift: reduced ? reducedShift : stepShift }
}

export default function SellerPageMotion({ context, fill = false, scroll = false, contentClassName = '' }) {
  const location = useLocation()
  const outlet = useOutlet(context)
  const { reduced, shift } = useStepShift()
  const frameClass = fill
    ? 'absolute inset-0 overflow-hidden'
    : scroll
      ? 'absolute inset-0 overflow-hidden'
      : 'relative min-h-dvh w-full overflow-x-hidden'
  const pageClass = fill
    ? 'absolute inset-0 flex min-h-0 w-full flex-col overflow-hidden'
    : scroll
      ? 'seller-scroll page-scroll absolute inset-0 w-full overflow-x-hidden overflow-y-auto overscroll-y-contain [touch-action:pan-y]'
      : 'relative w-full'
  const page = <PresenceContext.Provider value={null}>{outlet}</PresenceContext.Provider>

  return (
    <div className={frameClass}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={location.pathname}
          className={`${reduced ? '' : 'screen-step'} ${pageClass}`}
          {...shift}
        >
          {contentClassName ? <div className={contentClassName}>{page}</div> : page}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
