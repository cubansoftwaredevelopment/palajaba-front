import { useEffect } from 'react'
import { sellerBtnPrimary, sellerBtnSecondary, sellerFocusRing, sellerModalTitle } from './sellerStyles'

export default function SellerLogoutModal({ onClose, onConfirm }) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-green/20 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="seller-logout-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[18rem] animate-fade-in rounded-2xl border border-brand-green/12 bg-brand-white p-5 shadow-[0_16px_40px_rgba(89,128,44,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-yellow/25 text-brand-green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
          </div>

          <h2 id="seller-logout-title" className={sellerModalTitle}>
            ¿Cerrar sesión?
          </h2>

          <div className="mt-5 flex w-full flex-col gap-2">
            <button type="button" onClick={onConfirm} className={`${sellerBtnPrimary} !w-full min-h-10 py-2 text-sm`}>
              Sí, cerrar sesión
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`${sellerBtnSecondary} !w-full min-h-10 py-2 text-sm ${sellerFocusRing}`}
            >
              No, quedarme
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
