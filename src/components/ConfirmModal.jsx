import { useEffect } from 'react'
import Button from './Button'

export default function ConfirmModal({
  title,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'primary',
  icon,
  onConfirm,
  onClose,
}) {
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-brand-green/25 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm animate-fade-in overflow-hidden rounded-3xl border border-brand-green/15 bg-brand-white p-6 shadow-[0_24px_60px_rgba(89,128,44,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-yellow/30 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-brand-green/10 blur-2xl"
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-brand-carmelita/50 transition-colors touch-manipulation active:bg-brand-green/8 active:text-brand-carmelita focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 sm:hover:bg-brand-green/8 sm:hover:text-brand-carmelita"
          aria-label="Cerrar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="relative flex flex-col items-center text-center">
          {icon && (
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-yellow/30 text-brand-green shadow-inner">
              {icon}
            </div>
          )}

          <h2 id="confirm-modal-title" className="font-display text-2xl font-bold text-brand-green">
            {title}
          </h2>

          <div className="mt-6 flex w-full flex-col gap-2.5">
            <Button type="button" variant={confirmVariant} onClick={onConfirm}>
              {confirmLabel}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              {cancelLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
