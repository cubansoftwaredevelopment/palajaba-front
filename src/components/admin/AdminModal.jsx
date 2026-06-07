import { useEffect } from 'react'
import { adminFocusRing } from './adminStyles'

export default function AdminModal({ title, subtitle, children, onClose, centered }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="admin-theme fixed inset-0 z-50 flex items-end justify-center bg-[#0b0e0a]/75 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'admin-modal-title' : undefined}
      onClick={onClose}
    >
      <div
        className={`relative max-h-[90dvh] w-full max-w-md animate-fade-in overflow-y-auto rounded-2xl border border-brand-green/15 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)] ${centered ? 'text-center' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 id="admin-modal-title" className="text-lg font-semibold text-zinc-50">
                {title}
              </h2>
              {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100 ${adminFocusRing}`}
              aria-label="Cerrar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className={`absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100 ${adminFocusRing}`}
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
