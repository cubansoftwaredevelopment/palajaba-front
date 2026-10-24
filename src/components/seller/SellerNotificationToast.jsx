import { useEffect, useState } from 'react'
import {
  sellerNoticeToastEnter,
  sellerNoticeToastLeave,
  sellerNoticeToastShellNav,
  sellerNoticeToastShellPage,
} from './sellerStyles'

const VISIBLE_MS = 4200
const EXIT_MS = 260

export default function SellerNotificationToast({ toast, aboveNav = false, onDone, onOpen }) {
  const [leaving, setLeaving] = useState(false)
  const isError = toast?.tone === 'error'

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
    <div
      className={aboveNav ? sellerNoticeToastShellNav : sellerNoticeToastShellPage}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <button
        type="button"
        className={`${leaving ? sellerNoticeToastLeave : sellerNoticeToastEnter} ${
          isError ? 'border-brand-carmelita/25' : ''
        }`}
        onClick={() => {
          if (onOpen) onOpen()
          else setLeaving(true)
        }}
      >
        <p
          className={`font-display text-sm font-bold leading-snug ${
            isError ? 'text-brand-carmelita' : 'text-brand-green'
          }`}
        >
          {toast.title}
        </p>
        {toast.content ? (
          <p className="mt-1 text-xs leading-relaxed text-brand-carmelita/90">{toast.content}</p>
        ) : null}
      </button>
    </div>
  )
}
