import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { buyerJabaToastCard, buyerJabaToastCardWarning, buyerJabaToastShell } from './buyerStyles.js'

const VISIBLE_MS = 1800
const EXIT_MS = 320

export default function BuyerJabaToast({ toast, onDone }) {
  const reduced = useReducedMotion()
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!toast) return undefined

    setLeaving(false)
    const hideTimer = window.setTimeout(() => setLeaving(true), reduced ? 0 : VISIBLE_MS)
    return () => window.clearTimeout(hideTimer)
  }, [reduced, toast])

  useEffect(() => {
    if (!toast || !leaving) return undefined

    const doneTimer = window.setTimeout(() => onDone?.(toast.id), reduced ? 0 : EXIT_MS)
    return () => window.clearTimeout(doneTimer)
  }, [leaving, onDone, reduced, toast])

  if (!toast || typeof document === 'undefined') return null

  return createPortal(
    <div className={buyerJabaToastShell} aria-live="polite" aria-atomic="true">
      <motion.div
        role={toast.tone === 'warning' ? 'alert' : 'status'}
        className={toast.tone === 'warning' ? buyerJabaToastCardWarning : buyerJabaToastCard}
        initial={reduced ? false : { opacity: 0, y: 18, scale: 0.9 }}
        animate={leaving ? { opacity: 0, y: 12, scale: 0.92 } : { opacity: 1, y: 0, scale: 1 }}
        transition={reduced ? { duration: 0 } : undefined}
      >
        {toast.message}
      </motion.div>
    </div>,
    document.body,
  )
}
