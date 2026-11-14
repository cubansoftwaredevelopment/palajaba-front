import { useEffect, useId } from 'react'
import BuyerModalPortal from '../../buyer/components/BuyerModalPortal'
import {
  buyerProductDetailBody,
  buyerProductDetailModal,
  buyerProductDetailName,
  buyerProductDetailOverlay,
  buyerProductDetailStickyBar,
} from '../../buyer/components/buyerStyles'
import { useDismissibleModal } from '../../buyer/components/useOrderModalPresence'
import { platformLabel } from '../lib/releases.js'

function AndroidIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.6 9.48 19.1 6.9a.5.5 0 0 0-.86-.5l-1.55 2.68A8.2 8.2 0 0 0 12 8c-1.7 0-3.27.5-4.69 1.35L5.76 6.4a.5.5 0 1 0-.86.5l1.5 2.58A8 8 0 0 0 4 15.5V16a1 1 0 0 0 1 1h1v2.5a1.5 1.5 0 0 0 3 0V17h6v2.5a1.5 1.5 0 0 0 3 0V17h1a1 1 0 0 0 1-1v-.5a8 8 0 0 0-2.4-5.52ZM9.25 13.25a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm5.5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.7 12.2c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.7-1.7-3.3-1.7-1.4-.1-2.7.8-3.4.8s-1.8-.8-3-.8c-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.3 1.1 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.2-2.6-.1 0-2.4-.9-2.5-3.7Zm-2.4-7c.6-.8 1.1-1.8.9-2.9-1 0-2.1.6-2.7 1.4-.5.7-1.1 1.8-.9 2.8 1.1.1 2.1-.5 2.7-1.3Z" />
    </svg>
  )
}

export function UpdateModal({ onClose, nativeVersion, mainRelease, platform, busy, onUpdate }) {
  const titleId = useId()
  const { dismiss, motionClass } = useDismissibleModal(onClose)
  const label = platformLabel(platform || mainRelease?.platform)
  const isApple = (platform || mainRelease?.platform) === 'ios'

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [dismiss])

  return (
    <BuyerModalPortal>
      <div
        className={`${buyerProductDetailOverlay} z-[110] ${motionClass}`}
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) dismiss()
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`${buyerProductDetailModal} max-h-[min(92dvh,28rem)]`}
        >
          <div className="shrink-0 px-5 pt-3">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-green/15 sm:hidden" aria-hidden="true" />
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-brand-green/8 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.06em] text-brand-green">
                {label}
              </span>
              <button
                type="button"
                onClick={dismiss}
                className="flex h-10 w-10 items-center justify-center rounded-full text-brand-carmelita touch-manipulation active:bg-brand-green/8"
                aria-label="Cerrar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className={buyerProductDetailBody}>
            <div className="flex flex-col items-center px-5 pb-5 pt-2 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green text-brand-white shadow-[0_8px_24px_rgba(89,128,44,0.22)]">
                {isApple ? <AppleIcon /> : <AndroidIcon />}
              </div>
              <h2 id={titleId} className={`${buyerProductDetailName} !mt-0`}>
                Actualización para {label}
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-brand-carmelita/90">
                En este dispositivo tienes la versión {nativeVersion || '—'}. Ya está disponible la{' '}
                {mainRelease.version} para {label}.
              </p>
            </div>
          </div>

          <div className={buyerProductDetailStickyBar}>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={onUpdate}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-green px-4 text-sm font-semibold text-brand-white touch-manipulation disabled:opacity-50"
              >
                {isApple ? <AppleIcon /> : <AndroidIcon />}
                {busy ? 'Descargando…' : `Actualizar ${label} · ${mainRelease.version}`}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-brand-green/20 bg-brand-white px-4 text-sm font-semibold text-brand-carmelita/90 touch-manipulation"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      </div>
    </BuyerModalPortal>
  )
}

/** @deprecated El aviso automático vive en AppReleasePromptGate. */
export default function AppUpdatePrompt() {
  return null
}
