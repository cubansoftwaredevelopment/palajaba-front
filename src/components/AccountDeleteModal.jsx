import { useEffect } from 'react'
import { useDismissibleModal } from '../buyer/components/useOrderModalPresence'

export default function AccountDeleteModal({
  onClose: requestClose,
  onConfirm,
  loading = false,
  error = '',
  title = '¿Eliminar cuenta?',
  description = 'Se borrarán tus datos de cuenta de forma permanente. Los pedidos ya registrados se conservan como historial.',
  confirmLabel = 'Sí, eliminar cuenta',
  cancelLabel = 'Cancelar',
}) {
  const { dismiss: onClose, motionClass } = useDismissibleModal(requestClose)

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [loading, onClose])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-brand-green/20 p-4 backdrop-blur-sm ${motionClass}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-delete-title"
      onClick={() => {
        if (!loading) onClose()
      }}
    >
      <div
        className="relative w-full max-w-[20rem] animate-fade-in rounded-2xl border border-brand-green/12 bg-brand-white p-5 shadow-[0_16px_40px_rgba(89,128,44,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-700">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </div>

          <h2 id="account-delete-title" className="font-display text-xl font-bold text-brand-green">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-carmelita">{description}</p>
          {error ? (
            <p className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-left text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex w-full flex-col gap-2">
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="min-h-10 w-full rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {loading ? 'Eliminando…' : confirmLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="min-h-10 w-full rounded-xl border border-brand-green/20 bg-white px-4 py-2 text-sm font-semibold text-brand-green disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
