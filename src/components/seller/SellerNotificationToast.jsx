import { useEffect, useState } from 'react'
import { LOADING_MASCOT } from '../../constants/branding'
import { resolveMediaUrl } from '../../lib/media'
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

  const logo = toast.senderMascot ? '' : resolveMediaUrl(toast.senderLogo)
  const initials = Array.from(String(toast.senderName || '').trim()).slice(0, 2).join('').toUpperCase()

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
      <span className="flex items-start gap-3">
        {toast.senderMascot ? (
          <img src={LOADING_MASCOT.src} alt="" className="h-11 w-11 shrink-0 object-contain" />
        ) : logo ? (
          <img src={logo} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
        ) : initials ? (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-green/10 text-xs font-bold text-brand-green">{initials}</span>
        ) : null}
        <span className="min-w-0 flex-1">
          {toast.senderName ? (
            <span className="block text-[0.65rem] font-semibold uppercase tracking-wide text-brand-carmelita/70">{toast.senderName}</span>
          ) : null}
          <span
            className={`block font-display text-sm font-bold leading-snug ${
              isError ? 'text-brand-carmelita' : 'text-brand-green'
            }`}
          >
            {toast.title}
          </span>
          {toast.content ? (
            <span className="mt-1 block text-xs leading-relaxed text-brand-carmelita/90">{toast.content}</span>
          ) : null}
        </span>
      </span>
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
