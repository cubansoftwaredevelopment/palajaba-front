import { useEffect, useState } from 'react'
import { buyerJabaToastEnter, buyerJabaToastLeave, buyerJabaToastShell } from './buyerStyles'

const VISIBLE_MS = 1800
const EXIT_MS = 260

export default function BuyerJabaToast({ toast, onDone }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!toast) return undefined

    setLeaving(false)
    const hideTimer = window.setTimeout(() => setLeaving(true), VISIBLE_MS)
    return () => window.clearTimeout(hideTimer)
  }, [toast])

  useEffect(() => {
    if (!toast || !leaving) return undefined

    const doneTimer = window.setTimeout(() => onDone?.(toast.id), EXIT_MS)
    return () => window.clearTimeout(doneTimer)
  }, [leaving, onDone, toast])

  if (!toast) return null

  return (
    <div className={buyerJabaToastShell} aria-live="polite" aria-atomic="true">
      <div role="status" className={leaving ? buyerJabaToastLeave : buyerJabaToastEnter}>
        {toast.message}
      </div>
    </div>
  )
}
