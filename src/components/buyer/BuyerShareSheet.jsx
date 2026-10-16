import { useEffect, useState } from 'react'
import { canUseSystemShare, shareWithSystem } from '../../lib/buyerShare'
import { buildTelegramShareUrl, buildWhatsAppShareUrl } from '../../lib/storeShare'
import { openExternalUrl } from '../../lib/nativeApp'
import { TelegramIcon, WhatsAppIcon } from '../seller/ShareBrandIcons'
import BuyerModalPortal from './BuyerModalPortal'
import { useDismissibleModal } from './useOrderModalPresence'

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
  const { dismiss: onClose, motionClass } = useDismissibleModal(requestClose)
  const [copyStatus, setCopyStatus] = useState('')
  const [destinationsOpen, setDestinationsOpen] = useState(false)

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
    if (canUseSystemShare()) {
      try {
        await shareWithSystem({ title, text: message, url })
        onClose()
        return
      } catch (error) {
        if (shareWasCancelled(error)) return
      }
    }
    setDestinationsOpen(true)
  }

  function sendWhatsApp() {
    openExternalUrl(buildWhatsAppShareUrl(message))
  }

  function sendTelegram() {
    const text = message.replace(url, '').replace(/:\s*$/, '').trim()
    openExternalUrl(buildTelegramShareUrl(url, text || title))
  }

  return (
    <BuyerModalPortal>
      <div
        className={`fixed inset-0 z-[110] flex items-end justify-center bg-brand-green/25 p-3 sm:items-center ${motionClass}`}
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose()
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="buyer-share-title"
          className="w-full max-w-md rounded-3xl border border-brand-green/10 bg-brand-white p-5 shadow-[0_16px_48px_rgba(89,128,44,0.2)]"
        >
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
          {destinationsOpen ? (
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-sm text-brand-carmelita/90">Enviar por…</p>
              <button
                type="button"
                onClick={sendWhatsApp}
                className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-bold text-white touch-manipulation active:scale-[0.99]"
              >
                <span aria-hidden="true" className="flex">
                  <WhatsAppIcon className="h-5 w-5" />
                </span>
                WhatsApp
              </button>
              <button
                type="button"
                onClick={sendTelegram}
                className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#229ED9] px-4 text-sm font-bold text-white touch-manipulation active:scale-[0.99]"
              >
                <span aria-hidden="true" className="flex">
                  <TelegramIcon className="h-5 w-5" />
                </span>
                Telegram
              </button>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
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
          )}
          {copyStatus ? <p className="mt-3 text-sm text-brand-carmelita">{copyStatus}</p> : null}
        </div>
      </div>
    </BuyerModalPortal>
  )
}
