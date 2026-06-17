import QRCode from 'qrcode'
import { useEffect, useMemo, useState } from 'react'

import { BRAND_NAME } from '../../constants/branding'
import { downloadBlob } from '../../lib/downloadFile'
import { isNativeAppShell, openExternalUrl } from '../../lib/nativeApp'
import {
  buildTelegramShareUrl,
  buildWhatsAppShareUrl,
  getStoreCatalogUrl,
  getStoreShareMessage,
} from '../../lib/storeShare'
import SellerModalPortal from './SellerModalPortal'
import { TelegramIcon, WhatsAppIcon } from './ShareBrandIcons'
import {
  sellerAlertSuccess,
  sellerBtnSecondary,
  sellerFocusRing,
  sellerHint,
  sellerModalOverlay,
  sellerModalSheet,
  sellerModalTitle,
} from './sellerStyles'

function ShareOption({ icon, label, hint, onClick, iconWrapClassName, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-2xl border border-brand-green/12 bg-brand-white px-3.5 py-3 text-left transition-colors touch-manipulation active:border-brand-green/25 active:bg-brand-green/[0.03] disabled:cursor-not-allowed disabled:opacity-60 ${sellerFocusRing}`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconWrapClassName}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-brand-green">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-brand-carmelita/85">{hint}</span> : null}
      </span>
      <svg
        className="h-4 w-4 shrink-0 text-brand-carmelita/45"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  )
}

export default function ShareCatalogModal({ profile, onClose }) {
  const [view, setView] = useState('options')
  const [copyStatus, setCopyStatus] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState('')

  const catalogUrl = useMemo(() => getStoreCatalogUrl(profile), [profile])
  const shareMessage = useMemo(() => getStoreShareMessage(profile), [profile])
  const telegramText = useMemo(() => {
    const storeName = profile?.store_name?.trim() || 'mi tienda'
    return `Mira el catálogo de ${storeName} en ${BRAND_NAME}`
  }, [profile?.store_name])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        if (view === 'qr') {
          setView('options')
          return
        }
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, view])

  async function handleCopyLink() {
    setCopyStatus('')

    try {
      await navigator.clipboard.writeText(catalogUrl)
      setCopyStatus('Enlace copiado al portapapeles.')
    } catch {
      setCopyStatus('No se pudo copiar el enlace. Inténtalo de nuevo.')
    }
  }

  async function handleShowQr() {
    setQrError('')
    setQrLoading(true)

    try {
      const dataUrl = await QRCode.toDataURL(catalogUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#59802c',
          light: '#fdfbf2',
        },
      })
      setQrDataUrl(dataUrl)
      setView('qr')
    } catch {
      setQrError('No se pudo generar el código QR.')
    } finally {
      setQrLoading(false)
    }
  }

  function handleWhatsAppShare() {
    openExternalUrl(buildWhatsAppShareUrl(shareMessage))
  }

  function handleTelegramShare() {
    openExternalUrl(buildTelegramShareUrl(catalogUrl, telegramText))
  }

  async function handleDownloadQr() {
    if (!qrDataUrl) return

    const filename = `catalogo-${profile?.store_name?.trim() || 'tienda'}.png`

    if (isNativeAppShell()) {
      const response = await fetch(qrDataUrl)
      const blob = await response.blob()
      await downloadBlob(blob, filename, 'image/png')
      return
    }

    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = filename
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <SellerModalPortal>
      <div
        className={sellerModalOverlay}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-catalog-title"
        onClick={onClose}
      >
        <div className={sellerModalSheet} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-3 border-b border-brand-green/8 px-5 py-4">
            <div className="min-w-0">
              <h2 id="share-catalog-title" className={sellerModalTitle}>
                {view === 'qr' ? 'Código QR' : 'Compartir catálogo'}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-brand-carmelita/85">
                {view === 'qr'
                  ? 'Escanea o descarga el QR para abrir tu tienda.'
                  : 'Elige cómo quieres enviar el enlace de tu tienda.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-carmelita/55 transition-colors touch-manipulation active:bg-brand-green/8 active:text-brand-carmelita ${sellerFocusRing}`}
              aria-label="Cerrar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-5 py-4">
            {view === 'options' ? (
              <>
                <p className={`break-all ${sellerHint}`}>{catalogUrl}</p>

                <div className="mt-4 flex flex-col gap-2.5">
                  <ShareOption
                    label="WhatsApp"
                    hint="Enviar enlace por chat"
                    onClick={handleWhatsAppShare}
                    iconWrapClassName="bg-[#25D366]/12 text-[#25D366]"
                    icon={<WhatsAppIcon className="h-6 w-6" />}
                  />

                  <ShareOption
                    label="Telegram"
                    hint="Compartir en Telegram"
                    onClick={handleTelegramShare}
                    iconWrapClassName="bg-[#229ED9]/12 text-[#229ED9]"
                    icon={<TelegramIcon className="h-6 w-6" />}
                  />

                  <ShareOption
                    label="Copiar enlace"
                    hint="Pegar donde quieras"
                    onClick={handleCopyLink}
                    iconWrapClassName="bg-brand-green/10 text-brand-green"
                    icon={
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    }
                  />

                  <ShareOption
                    label={qrLoading ? 'Generando QR…' : 'Generar QR'}
                    hint="Mostrar código para escanear"
                    onClick={handleShowQr}
                    disabled={qrLoading}
                    iconWrapClassName="bg-brand-yellow/20 text-brand-green"
                    icon={
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                        <path d="M4 4h4v4H4zM16 4h4v4h-4zM4 16h4v4H4z" />
                        <path d="M10 4h4M4 10v4M20 10v4M10 20h4M14 14h2v2h-2zM16 16h2v2h-2z" />
                      </svg>
                    }
                  />
                </div>

                {copyStatus ? (
                  <p
                    className={`mt-3 ${sellerAlertSuccess}`}
                    role={copyStatus.includes('copiado') ? 'status' : 'alert'}
                  >
                    {copyStatus}
                  </p>
                ) : null}

                {qrError ? (
                  <p className="mt-3 rounded-xl border border-brand-carmelita/15 bg-brand-carmelita/8 px-3 py-2.5 text-center text-xs text-brand-carmelita sm:text-sm" role="alert">
                    {qrError}
                  </p>
                ) : null}
              </>
            ) : (
              <div className="flex flex-col items-center text-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Código QR del catálogo de ${profile?.store_name || 'tu tienda'}`}
                    className="h-60 w-60 rounded-2xl border border-brand-green/12 bg-brand-white p-3 shadow-[0_8px_24px_rgba(89,128,44,0.08)]"
                  />
                ) : null}

                <p className={`mt-4 max-w-full break-all ${sellerHint}`}>{catalogUrl}</p>

                <div className="mt-5 flex w-full flex-col gap-2">
                  {qrDataUrl ? (
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className={`${sellerBtnSecondary} !w-full`}
                    >
                      Descargar QR
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setView('options')}
                    className={`${sellerBtnSecondary} !w-full`}
                  >
                    Volver
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SellerModalPortal>
  )
}
