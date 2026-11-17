import { useReducedMotion } from 'framer-motion'

/** Desplazamiento de pantalla de palajaba-v8. */
export const stepShift = {
  initial: { opacity: 0, x: 46 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -54 },
  transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
}

export function monthPageShift(direction, reduced) {
  if (reduced) {
    return {
      initial: false,
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 1, x: 0 },
      transition: { duration: 0 },
    }
  }
  const enter = direction < 0 ? -46 : 46
  const leave = direction < 0 ? 54 : -54
  return {
    initial: { opacity: 0, x: enter },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: leave },
    transition: stepShift.transition,
  }
}

export const sheetSpring = { type: 'spring', stiffness: 260, damping: 29 }
export const detailSpring = { type: 'spring', stiffness: 280, damping: 32 }
export const dialogSpring = { type: 'spring', stiffness: 180, damping: 22 }
export const backdropFade = { duration: 0.2 }

export const SHEET_EXIT_MS = 640

export const jabaItemMotion = {
  initial: { opacity: 0, x: 28, scale: 0.96 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 140, scale: 0.8, rotate: 4 },
  transition: { type: 'spring', stiffness: 340, damping: 30 },
}

export const jabaStoreMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
}

export const badgeSpring = { type: 'spring', stiffness: 520, damping: 16 }
export const addTap = { scale: 0.78, rotate: -12 }
export const addPop = { scale: [1, 1.28, 0.92, 1], rotate: [0, -10, 8, 0] }
export const qtyTick = { duration: 0.22 }

/** Entrada de cada oferta al abrir el listado, como en palajaba-v8. */
export const offerPop = {
  hidden: { opacity: 0, scale: 0.72, y: 35, rotate: -4 },
  show: { opacity: 1, scale: 1, y: 0, rotate: 0 },
  spring: { type: 'spring', stiffness: 180, damping: 16 },
}

export function offerEnterTransition(index, reduced) {
  if (reduced) return { duration: 0 }
  return { ...offerPop.spring, delay: Math.min(index, 6) * 0.045 }
}

export function useSheetExitMs() {
  const reduced = useReducedMotion()
  return reduced ? 0 : SHEET_EXIT_MS
}
