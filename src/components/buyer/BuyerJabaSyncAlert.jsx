import { useEffect } from 'react'
import { JABA_BAG } from '../../constants/branding'
import { useBuyerJaba } from '../../context/BuyerJabaContext'
import Button from '../Button'
import BuyerModalPortal from './BuyerModalPortal'
import { reasonMeta, ReasonIcon } from './buyerJabaSyncReason'
import {
  buyerJabaSyncBody,
  buyerJabaSyncCountBadge,
  buyerJabaSyncFooter,
  buyerJabaSyncHeader,
  buyerJabaSyncHero,
  buyerJabaSyncHeroImage,
  buyerJabaSyncItem,
  buyerJabaSyncItemBadge,
  buyerJabaSyncItemIcon,
  buyerJabaSyncItemMessage,
  buyerJabaSyncItemName,
  buyerJabaSyncList,
  buyerJabaSyncModal,
  buyerJabaSyncOverlay,
  buyerJabaSyncSubtitle,
  buyerJabaSyncSummary,
  buyerJabaSyncTitle,
} from './buyerStyles'

export default function BuyerJabaSyncAlert({ removed, onClose }) {
  const { count, openPanel } = useBuyerJaba()

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!removed?.length) return null

  const removedCount = removed.length
  const title =
    removedCount === 1
      ? 'Quitamos 1 producto de tu jaba'
      : `Quitamos ${removedCount} productos de tu jaba`

  function handleReviewJaba() {
    onClose()
    openPanel()
  }

  return (
    <BuyerModalPortal>
      <div
        className={buyerJabaSyncOverlay}
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose()
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="buyer-jaba-sync-title"
          aria-describedby="buyer-jaba-sync-desc"
          className={buyerJabaSyncModal}
        >
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand-yellow/25 blur-2xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-brand-green/10 blur-2xl"
            aria-hidden="true"
          />

          <div className={buyerJabaSyncHeader}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-green/15 sm:hidden" aria-hidden="true" />
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full text-brand-carmelita touch-manipulation active:bg-brand-green/8"
                aria-label="Cerrar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className={buyerJabaSyncBody}>
            <div className={buyerJabaSyncHero}>
              <div className={buyerJabaSyncHeroImage}>
                <img src={JABA_BAG.src} alt="" className="h-16 w-16 object-contain opacity-90" decoding="async" />
                <span className={buyerJabaSyncCountBadge} aria-hidden="true">
                  −{removedCount}
                </span>
              </div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-brand-carmelita/75">
                Tu jaba se actualizó
              </p>
              <h2 id="buyer-jaba-sync-title" className={buyerJabaSyncTitle}>
                {title}
              </h2>
              <p id="buyer-jaba-sync-desc" className={buyerJabaSyncSubtitle}>
                Verificamos el catálogo al cargar la página. Estos artículos ya no se pueden comprar y los
                retiramos para que no te lleves sorpresas al pagar.
              </p>
              <p className={buyerJabaSyncSummary} role="status">
                {count > 0
                  ? `Te quedan ${count} ${count === 1 ? 'producto' : 'productos'} listos para comprar.`
                  : 'Tu jaba quedó vacía. Puedes seguir explorando el catálogo.'}
              </p>
            </div>

            <ul className={buyerJabaSyncList} aria-label="Productos retirados de tu jaba">
              {removed.map((entry) => {
                const meta = reasonMeta(entry.reason)
                return (
                  <li key={entry.product_id} className={buyerJabaSyncItem}>
                    <div className={`${buyerJabaSyncItemIcon} ${meta.iconClass}`}>
                      <ReasonIcon reason={entry.reason} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={buyerJabaSyncItemName}>{entry.name}</p>
                      <span className={`${buyerJabaSyncItemBadge} ${meta.badgeClass}`}>{meta.label}</span>
                      <p className={buyerJabaSyncItemMessage}>{entry.message}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className={buyerJabaSyncFooter}>
            <Button type="button" variant="primary" className="w-full" onClick={onClose}>
              Entendido, continuar
            </Button>
            {count > 0 ? (
              <Button type="button" variant="secondary" className="w-full" onClick={handleReviewJaba}>
                Ver mi jaba
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </BuyerModalPortal>
  )
}
