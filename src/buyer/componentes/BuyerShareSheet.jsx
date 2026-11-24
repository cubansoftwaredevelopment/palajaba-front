import { useEffect, useState } from 'react'
import { canUseSystemShare, shareWithSystem } from '../utils/buyerShare.js'
import BuyerModalPortal from './BuyerModalPortal.jsx'
import { buyerProductDetailModal } from './buyerStyles.js'
import { useDismissibleModal } from './useOrderModalPresence.js'
import BuyerMotionFrame from '../../motion/BuyerMotionFrame'
import { useSheetExitMs } from '../../motion/presets'

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  )
}

export function BuyerShareButton({ label = 'Compartir', className = '', onClick, iconOnly = false }) {
  return (
    <button type="button" onClick={onClick} className={className} aria-label={label}>
      <ShareIcon />
      {iconOnly ? <span className="sr-only">{label}</span> : <span>{label}</span>}
    </button>
  )
}

function shareWasCancelled(error) {
  const text = String(error?.name || error?.message || error || '').toLowerCase()
  return text.includes('cancel') || text.includes('abort')
}

export default function BuyerShareSheet({ title, message, url, onClose: requestClose }) {
  const exitMs = useSheetExitMs()
  const { dismiss: onClose, closing, sheetProps } = useDismissibleModal(requestClose, exitMs, { motion: true })
  const [copyStatus, setCopyStatus] = useState('')

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  async function copyLink() {
    setCopyStatus('')
    try {
      await navigator.clipboard.writeText(url)
      setCopyStatus('Enlace copiado.')
    } catch {
      setCopyStatus('No se pudo copiar el enlace.')
    }
  }

  async function sendVia() {
    setCopyStatus('')
    if (!canUseSystemShare()) {
      setCopyStatus('Tu dispositivo no tiene disponible el panel para compartir.')
      return
    }
    try {
      await shareWithSystem({ title, text: message, url })
      onClose()
    } catch (error) {
      if (shareWasCancelled(error)) return
      setCopyStatus('No se pudo abrir el panel para compartir.')
    }
  }

  return (
    <BuyerModalPortal>
      <BuyerMotionFrame
        variant="detail"
        closing={closing}
        sheetProps={sheetProps}
        overlayClassName="fixed inset-0 z-[110] flex items-end justify-center bg-brand-green/25 p-0 backdrop-blur-[3px] sm:items-center sm:p-4"
        panelClassName={`${buyerProductDetailModal} h-auto`}
        overlayProps={{
          role: 'presentation',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) onClose()
          },
        }}
        panelProps={{ role: 'dialog', 'aria-modal': true, 'aria-labelledby': 'buyer-share-title' }}
      >
          <div className="px-5 pt-3 pb-[max(1.25rem,var(--safe-bottom))] sm:pb-5">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-green/15 sm:hidden" aria-hidden="true" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="buyer-share-title" className="font-display text-lg font-bold text-brand-green">
                  {title}
                </h2>
                <p className="mt-1 text-sm text-brand-carmelita/90">El enlace incluye la zona en la que lo estás viendo.</p>
              </div>
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
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={copyLink}
                className="min-h-11 rounded-full border border-brand-green/20 px-4 text-sm font-bold text-brand-green touch-manipulation active:bg-brand-green/8"
              >
                Copiar enlace
              </button>
              <button
                type="button"
                onClick={sendVia}
                className="min-h-11 rounded-full bg-brand-green px-4 text-sm font-bold text-brand-white touch-manipulation active:scale-[0.99]"
              >
                Enviar por…
              </button>
            </div>
            {copyStatus ? <p className="mt-3 text-sm text-brand-carmelita">{copyStatus}</p> : null}
          </div>
      </BuyerMotionFrame>
    </BuyerModalPortal>
  )
}
