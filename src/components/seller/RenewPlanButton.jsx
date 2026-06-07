import { useState } from 'react'
import { sellerBtnPrimary } from './sellerStyles'

export default function RenewPlanButton({ className = '', size = 'default' }) {
  const [showNotice, setShowNotice] = useState(false)
  const sizeClass = size === 'compact' ? 'min-h-9 py-2 text-xs' : 'min-h-10 py-2.5 text-sm'

  return (
    <>
      <button
        type="button"
        onClick={() => setShowNotice(true)}
        className={`${sellerBtnPrimary} ${sizeClass} ${className}`}
      >
        Renovar plan
      </button>

      {showNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-green/20 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="renew-plan-title"
          onClick={() => setShowNotice(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-brand-green/12 bg-brand-white p-5 shadow-[0_16px_40px_rgba(89,128,44,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="renew-plan-title" className="font-display text-lg font-bold text-brand-green">
              Renovación de plan
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-carmelita/90">
              Estamos preparando el proceso de renovación. Muy pronto podrás reactivar tu tienda
              desde aquí.
            </p>
            <button
              type="button"
              onClick={() => setShowNotice(false)}
              className={`${sellerBtnPrimary} mt-4 min-h-10 py-2.5 text-sm`}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  )
}
