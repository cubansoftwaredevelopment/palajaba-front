import { useEffect, useRef, useState } from 'react'
import { sellerAlertError, sellerBtnPrimary, sellerBtnSecondary, sellerHint, sellerLabel } from './sellerStyles'
import { deleteSellerStoreBanner, updateSellerStoreBanner, uploadSellerStoreBanner } from '../../lib/api'
import { validateImageFile, IMAGE_UPLOAD_HINT } from '../../lib/imageUpload'
import { resolveMediaUrl } from '../../lib/media'
import { getSellerToken, updateSellerProfileCache } from '../../lib/sellerAuth'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { sellerHasStoreBanners } from '../../constants/plan'
import BuyerStoreBannerCover, { storeBannerAspectClass } from '../buyer/BuyerStoreBannerCover'
import { buyerStorePageHeader, buyerStorePageName } from '../buyer/buyerStyles'

const PREVIEW_MIN_WIDTH = 320

export default function SellerStoreBanners({ profile, onUpdated }) {
  const fileInputRef = useRef(null)
  const [banners, setBanners] = useState(profile?.store_banners ?? [])
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [togglingId, setTogglingId] = useState('')
  const [error, setError] = useState('')

  function applyProfile(updated) {
    setBanners(updated?.store_banners ?? [])
    updateSellerProfileCache(updated)
    onUpdated?.(updated)
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.ok) {
      setError(validation.message)
      return
    }

    setError('')
    setUploading(true)
    try {
      const updated = await uploadSellerStoreBanner(getSellerToken(), file)
      applyProfile(updated)
    } catch (err) {
      setError(getUserFacingMessage(err, 'No pudimos subir el banner.'))
    } finally {
      setUploading(false)
    }
  }

  async function handleToggle(banner) {
    setError('')
    setTogglingId(banner.id)
    try {
      const updated = await updateSellerStoreBanner(getSellerToken(), banner.id, banner.is_active === false)
      applyProfile(updated)
    } catch (err) {
      setError(getUserFacingMessage(err, 'No pudimos actualizar el banner.'))
    } finally {
      setTogglingId('')
    }
  }

  async function handleDelete(bannerId) {
    setError('')
    setDeletingId(bannerId)
    try {
      const updated = await deleteSellerStoreBanner(getSellerToken(), bannerId)
      applyProfile(updated)
    } catch (err) {
      setError(getUserFacingMessage(err, 'No pudimos quitar el banner.'))
    } finally {
      setDeletingId('')
    }
  }

  const activeBanners = banners.filter((banner) => banner.is_active !== false)
  const canManageBanners = sellerHasStoreBanners(profile)

  return (
    <div className="flex flex-col gap-5">
      <p className={sellerHint}>
        Estas imágenes se ven detrás de la foto de tu tienda. Los desactivados no se muestran. Si hay más de uno activo, se van turnando. {IMAGE_UPLOAD_HINT}.
      </p>
      {canManageBanners ? null : (
        <p className={sellerAlertError} role="status">
          Los banners de tienda están disponibles en el plan Prueba y en los planes Pro y Premium.
          Los que ya tengas se ocultan en el catálogo público hasta que subas de plan.
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
        <section className="flex min-w-0 flex-col gap-3" aria-labelledby="store-banners-list-title">
          <div className="flex items-center justify-between gap-3">
            <h3 id="store-banners-list-title" className={sellerLabel}>
              Banners
            </h3>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !canManageBanners}
              className={`${sellerBtnPrimary} !w-auto px-4`}
            >
              {uploading ? 'Subiendo…' : 'Agregar banner'}
            </button>
          </div>

          {error ? (
            <p className={sellerAlertError} role="alert">
              {error}
            </p>
          ) : null}

          {banners.length ? (
            <ul className="flex flex-col gap-2">
              {banners.map((banner, index) => {
                const active = banner.is_active !== false
                return (
                  <li
                    key={banner.id}
                    className="flex items-center gap-3 rounded-2xl border border-brand-green/12 bg-brand-white p-2"
                  >
                    <div className={`w-28 shrink-0 overflow-hidden rounded-xl bg-brand-green/10 ${storeBannerAspectClass} ${active ? '' : 'opacity-45'}`}>
                      <img
                        src={resolveMediaUrl(banner.image_url)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <p className="text-xs font-semibold text-brand-carmelita/80">
                        Banner {index + 1}
                        {active ? '' : ' · desactivado'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggle(banner)}
                          disabled={togglingId === banner.id || !canManageBanners}
                          className={`${sellerBtnSecondary} !w-auto px-3 text-xs`}
                        >
                          {togglingId === banner.id ? 'Guardando…' : (active ? 'Desactivar' : 'Activar')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(banner.id)}
                          disabled={deletingId === banner.id}
                          className={`${sellerBtnSecondary} !w-auto px-3 text-xs`}
                        >
                          {deletingId === banner.id ? 'Quitando…' : 'Quitar'}
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-brand-carmelita/80">Todavía no tienes banners. La cabecera usa un fondo de marca hasta que subas uno.</p>
          )}
        </section>

        <section className="flex min-w-0 flex-col gap-3" aria-labelledby="store-banner-preview-title">
          <h3 id="store-banner-preview-title" className={sellerLabel}>
            Vista previa
          </h3>
          <p className={sellerHint}>
            Amplía la vista hasta el ancho de esta pantalla.
          </p>
          <StoreBannerPreview banners={activeBanners} profile={profile} />
        </section>
      </div>
    </div>
  )
}

function StoreBannerPreview({ banners, profile }) {
  const frameRef = useRef(null)
  const [maxWidth, setMaxWidth] = useState(PREVIEW_MIN_WIDTH)
  const [widthPx, setWidthPx] = useState(PREVIEW_MIN_WIDTH)
  const photoSrc = resolveMediaUrl(profile?.profile_photo_url)
  const initials = profile?.store_name?.trim().slice(0, 2).toUpperCase() || '?'
  const wide = widthPx >= 640

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return undefined

    function measure() {
      const nextMax = Math.max(1, Math.floor(frame.clientWidth))
      setMaxWidth(nextMax)
      setWidthPx((current) => Math.min(Math.max(current, Math.min(PREVIEW_MIN_WIDTH, nextMax)), nextMax))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  const minWidth = Math.min(PREVIEW_MIN_WIDTH, maxWidth)
  const previewWidth = Math.min(Math.max(widthPx, minWidth), maxWidth)

  return (
    <div ref={frameRef} className="flex w-full flex-col gap-3">
      <div className="mx-auto w-full" style={{ maxWidth: previewWidth }}>
        <section className={buyerStorePageHeader}>
          <BuyerStoreBannerCover banners={banners} />
          <div className={`relative z-10 pb-5 ${wide ? 'px-5' : 'px-4'}`}>
            <div className={`flex items-center justify-between gap-3 ${wide ? '-mt-12' : '-mt-10'}`}>
              <div
                className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-zinc-100 font-display font-bold text-zinc-500 shadow-[0_4px_16px_rgba(15,23,42,0.18)] ${
                  wide ? 'h-24 w-24 text-xl' : 'h-20 w-20 text-lg'
                }`}
              >
                {photoSrc ? (
                  <img src={photoSrc} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="mb-1 flex shrink-0 items-center" aria-hidden>
                <span className="inline-flex h-10 items-center rounded-full bg-brand-green px-4 text-sm font-bold text-white shadow-[0_4px_14px_rgba(89,128,44,0.28)]">
                  Compartir
                </span>
              </div>
            </div>
            <h4 className={`${buyerStorePageName} mt-3`}>{profile?.store_name || 'Tu tienda'}</h4>
          </div>
        </section>
      </div>
      <label className="flex items-center gap-3">
        <span className="shrink-0 text-xs font-semibold text-brand-carmelita/80">{previewWidth} px</span>
        <input
          type="range"
          min={minWidth}
          max={maxWidth}
          value={previewWidth}
          onChange={(event) => setWidthPx(Number(event.target.value))}
          aria-label="Ampliar la vista previa"
          className="store-banner-range"
        />
      </label>
    </div>
  )
}
