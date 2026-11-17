import { useEffect, useState } from 'react'
import {
  sellerNoticeToastEnter,
  sellerNoticeToastLeave,
  sellerNoticeToastShellNav,
  sellerNoticeToastShellPage,
} from './sellerStyles'

const VISIBLE_MS = 4200
const EXIT_MS = 260

function NoticeToastCard({ toast, onDone, onOpen }) {
  const [leaving, setLeaving] = useState(false)
  const isError = toast?.tone === 'error'

  useEffect(() => {
    setLeaving(false)
    const hideTimer = window.setTimeout(() => setLeaving(true), VISIBLE_MS)
    return () => window.clearTimeout(hideTimer)
  }, [toast.id])

  useEffect(() => {
    if (!leaving) return undefined
    const doneTimer = window.setTimeout(() => onDone?.(toast.id), EXIT_MS)
    return () => window.clearTimeout(doneTimer)
  }, [leaving, onDone, toast.id])

  return (
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
  )
}

export default function SellerNotificationToast({ toast, toasts, aboveNav = false, onDone, onOpen }) {
  const items = toasts ?? (toast ? [toast] : [])
  if (!items.length) return null

  const isError = items.some((item) => item.tone === 'error')

  return (
    <div
      className={`${aboveNav ? sellerNoticeToastShellNav : sellerNoticeToastShellPage} flex-col items-center gap-2`}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className="pointer-events-auto flex max-h-[min(70dvh,32rem)] w-[min(22rem,calc(100vw-2rem))] flex-col gap-2 overflow-y-auto">
        {items.map((item) => (
          <NoticeToastCard key={item.id} toast={item} onDone={onDone} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}
