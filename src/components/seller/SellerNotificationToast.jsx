import { useEffect, useState } from 'react'
import { LOADING_MASCOT } from '../../constants/branding'
import { resolveMediaUrl } from '../../lib/media'
import {
  sellerNoticeToastEnter,
  sellerNoticeToastLeave,
  sellerNoticeToastShellNav,
  sellerNoticeToastShellPage,
  sellerNoticeToastShellTop,
} from './sellerStyles'

const VISIBLE_MS = 4200
const EXIT_MS = 260

function NoticeToastCard({ toast, onDone, onOpen, paused, onPress }) {
  const [leaving, setLeaving] = useState(false)
  const isError = toast?.tone === 'error'

  useEffect(() => {
    if (paused) return undefined
    setLeaving(false)
    const hideTimer = window.setTimeout(() => setLeaving(true), VISIBLE_MS)
    return () => window.clearTimeout(hideTimer)
  }, [toast.id, paused])

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
        if (onPress?.()) return
        if (onOpen) onOpen(toast)
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

export default function SellerNotificationToast({ toast, toasts, aboveNav = false, placement = 'bottom', className = '', onDone, onOpen }) {
  const items = toasts ?? (toast ? [toast] : [])
  const [open, setOpen] = useState(false)
  if (!items.length) return null

  const isError = items.some((item) => item.tone === 'error')
  const stacked = items.length > 1 && !open
  const shell = placement === 'top'
    ? sellerNoticeToastShellTop
    : aboveNav
      ? sellerNoticeToastShellNav
      : sellerNoticeToastShellPage

  return (
    <div
      className={`${shell} flex-col items-center ${className}`}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div
        className={`pointer-events-auto w-[min(22rem,calc(100vw-2rem))] ${open ? 'flex flex-col gap-2' : 'grid'}`}
        onMouseEnter={() => {
          if (items.length > 1) setOpen(true)
        }}
        onMouseLeave={() => setOpen(false)}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`w-full origin-bottom transition-transform duration-200 ease-out ${stacked ? 'col-start-1 row-start-1' : ''}`}
            style={stacked ? {
              zIndex: items.length - index,
              transform: `translateY(${-Math.min(index, 3) * 8}px) scale(${1 - Math.min(index, 3) * 0.04})`,
            } : undefined}
          >
            <NoticeToastCard
              toast={item}
              onDone={onDone}
              onOpen={onOpen}
              paused={open}
              onPress={() => {
                if (items.length > 1 && !open) {
                  setOpen(true)
                  return true
                }
                return false
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
