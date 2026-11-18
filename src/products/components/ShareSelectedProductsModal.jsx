import { useEffect, useMemo, useState } from 'react'

import { BRAND_NAME } from '../../constants/branding'
import {
  buildJabaShareUrl,
  buildSellerCheckoutShareMessage,
  canUseSystemShare,
  locationFromBusinessArea,
  shareWithSystem,
} from '../../lib/buyerShare'
import { storeServiceAreas } from '../../lib/businessArea'
import { getBusinessAreaFromSelection } from '../../components/seller/SellerBusinessAreaFields'
import SellerBusinessAreaFields from '../../components/seller/SellerBusinessAreaFields'
import SellerModalPortal from '../../components/seller/SellerModalPortal'
import SellerMotionSheet, { useSellerSheet } from '../../motion/SellerMotionSheet'
import {
  sellerAlertError,
  sellerAlertSuccess,
  sellerFocusRing,
  sellerHint,
  sellerModalBody,
  sellerModalFooter,
  sellerModalTitle,
} from '../../components/seller/sellerStyles'

function shareWasCancelled(error) {
  const text = String(error?.name || error?.message || error || '').toLowerCase()
  return text.includes('cancel') || text.includes('abort')
}

export default function ShareSelectedProductsModal({
  profile,
  products,
  categoryName,
  onClose: requestClose,
}) {
  const { dismiss: onClose, closing, sheetProps } = useSellerSheet(requestClose)
  const allowedAreas = useMemo(() => storeServiceAreas(profile), [profile])
  const [provinceId, setProvinceId] = useState(profile?.business_area?.province_id || allowedAreas[0]?.province_id || '')
  const [municipalityId, setMunicipalityId] = useState(
    profile?.business_area?.municipality_id || allowedAreas[0]?.municipality_id || '',
  )
  const [copyStatus, setCopyStatus] = useState('')
  const [copyError, setCopyError] = useState('')

  const items = useMemo(
    () => (products ?? []).filter((product) => product?.id).map((product) => ({ id: product.id, quantity: 1 })),
    [products],
  )
  const area = useMemo(
    () => getBusinessAreaFromSelection(provinceId, municipalityId),
    [municipalityId, provinceId],
  )
  const locationAllowed = allowedAreas.some(
    (item) => item.province_id === provinceId && item.municipality_id === municipalityId,
  )
  const location = useMemo(
    () => (locationAllowed ? locationFromBusinessArea(area) : null),
    [area, locationAllowed],
  )
  const checkoutReady = Boolean(location && items.length)
  const checkoutUrl = checkoutReady ? buildJabaShareUrl(items, location) : ''
  const shareMessage = checkoutReady
    ? buildSellerCheckoutShareMessage({
        storeName: profile?.store_name,
        items,
        location,
      })
    : ''

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

  useEffect(() => {
    setCopyStatus('')
    setCopyError('')
  }, [provinceId, municipalityId])

  async function handleCopyLink() {
    if (!checkoutReady) return
    setCopyStatus('')
    setCopyError('')
    try {
      await navigator.clipboard.writeText(checkoutUrl)
      setCopyStatus('Enlace copiado.')
    } catch {
      setCopyError('No se pudo copiar el enlace.')
    }
  }

  async function handleSendVia() {
    if (!checkoutReady) return
    setCopyStatus('')
    setCopyError('')
    if (!canUseSystemShare()) {
      setCopyError('Tu dispositivo no tiene disponible el panel para compartir.')
      return
    }
    try {
      await shareWithSystem({
        title: `Productos de ${profile?.store_name?.trim() || BRAND_NAME}`,
        text: shareMessage,
        url: checkoutUrl,
      })
      onClose()
    } catch (error) {
      if (shareWasCancelled(error)) return
      setCopyError('No se pudo abrir el panel para compartir.')
    }
  }

  return (
    <SellerModalPortal>
      <SellerMotionSheet
        onClose={onClose}
        closing={closing}
        sheetProps={sheetProps}
        labelledBy="share-selected-products-title"
      >
          <div className="flex items-start justify-between gap-3 border-b border-brand-green/8 px-5 py-4">
            <div className="min-w-0">
              <h2 id="share-selected-products-title" className={sellerModalTitle}>
                Compartir productos
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-brand-carmelita/85">
                {items.length} producto{items.length === 1 ? '' : 's'} de {categoryName || 'esta categoría'}.
                Elige una zona permitida de tu tienda.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-carmelita/55 transition-colors touch-manipulation active:bg-brand-green/8 ${sellerFocusRing}`}
              aria-label="Cerrar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className={sellerModalBody}>
            {allowedAreas.length === 0 ? (
              <p className={sellerAlertError} role="alert">
                Completa la ubicación de tu tienda para compartir un checkout.
              </p>
            ) : (
              <SellerBusinessAreaFields
                provinceId={provinceId}
                municipalityId={municipalityId}
                onProvinceChange={setProvinceId}
                onMunicipalityChange={setMunicipalityId}
                provinceInputId="share-products-province"
                municipalityInputId="share-products-municipality"
                municipalityHint="Solo aparecen las zonas donde opera tu tienda."
                dropdownZIndex={240}
                allowedAreas={allowedAreas}
              />
            )}

            {copyStatus ? (
              <p className={`mt-3 ${sellerAlertSuccess}`} role="status">
                {copyStatus}
              </p>
            ) : null}
            {copyError ? (
              <p className={`mt-3 ${sellerAlertError}`} role="alert">
                {copyError}
              </p>
            ) : null}
          </div>

          <div className={sellerModalFooter}>
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  disabled={!checkoutReady}
                  className="min-h-11 rounded-full border border-brand-green/20 px-3 text-sm font-bold text-brand-green touch-manipulation active:bg-brand-green/8 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Copiar enlace
                </button>
                <button
                  type="button"
                  onClick={handleSendVia}
                  disabled={!checkoutReady}
                  className="min-h-11 rounded-full bg-brand-green px-3 text-sm font-bold text-brand-white touch-manipulation active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Enviar por…
                </button>
              </div>
              {!checkoutReady && allowedAreas.length > 0 ? (
                <p className={sellerHint}>Elige provincia y municipio para copiar o enviar el enlace.</p>
              ) : null}
            </div>
          </div>
      </SellerMotionSheet>
    </SellerModalPortal>
  )
}
