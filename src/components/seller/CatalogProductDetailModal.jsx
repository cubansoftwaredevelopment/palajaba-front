import { useEffect } from 'react'
import { resolveMediaUrl } from '../../lib/media'
import { formatPrice } from '../../lib/money'
import {
  sellerBtnPrimary,
  sellerBtnSecondary,
  sellerCatalogProductBadge,
  sellerCatalogProductBadgeMuted,
  sellerHint,
  sellerLabel,
  sellerModalTitle,
} from './sellerStyles'

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-brand-green/8 py-3 last:border-b-0">
      <dt className={`shrink-0 ${sellerLabel}`}>{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium text-brand-green">{children}</dd>
    </div>
  )
}

export default function CatalogProductDetailModal({
  product,
  categoryName,
  onClose,
  onEdit,
  onDelete,
}) {
  const imageSrc = resolveMediaUrl(product.image_url)

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

  const acceptedLabel =
    product.accepted_currencies?.length > 0
      ? `${product.base_currency}, ${product.accepted_currencies.join(', ')}`
      : product.base_currency

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-brand-green/20 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalog-product-detail-title"
      onClick={onClose}
    >
      <div
        className="flex h-[min(85dvh,640px)] w-full max-w-md min-h-0 animate-fade-in flex-col overflow-hidden rounded-t-3xl border border-brand-green/12 bg-brand-white shadow-[0_24px_60px_rgba(89,128,44,0.2)] sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-brand-green/8 px-5 py-4">
          <h2 id="catalog-product-detail-title" className={`min-w-0 truncate ${sellerModalTitle}`}>
            {product.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-brand-carmelita touch-manipulation active:bg-brand-green/8"
            aria-label="Cerrar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-brand-green/[0.04]">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt=""
                className={`h-full w-full object-cover ${product.is_available ? '' : 'grayscale'}`}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-semibold text-brand-carmelita/60">
                Sin imagen
              </div>
            )}
            {!product.is_available && (
              <span className="absolute inset-x-2 bottom-2 rounded-md bg-brand-carmelita/95 px-2 py-0.5 text-center text-[0.55rem] font-bold uppercase tracking-[0.08em] text-brand-white">
                Agotado
              </span>
            )}
          </div>

          <p className="mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-carmelita/75">
            {categoryName}
          </p>
          <p className="mt-2 text-lg font-semibold text-brand-carmelita">
            {formatPrice(product.base_price, product.base_currency)}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.is_available ? (
              <span className={sellerCatalogProductBadge}>Disponible</span>
            ) : (
              <span className={sellerCatalogProductBadgeMuted}>No disponible</span>
            )}
            {product.view_only && <span className={sellerCatalogProductBadge}>Solo vista</span>}
            {product.offers_delivery ? (
              <span className={sellerCatalogProductBadge}>Con domicilio</span>
            ) : (
              <span className={sellerCatalogProductBadgeMuted}>Sin domicilio</span>
            )}
          </div>

          {product.description ? (
            <div className="mt-4">
              <p className={sellerLabel}>Descripción</p>
              <p className="mt-1.5 text-sm leading-relaxed text-brand-carmelita/90">{product.description}</p>
            </div>
          ) : (
            <p className={`mt-4 ${sellerHint}`}>Sin descripción.</p>
          )}

          <dl className="mt-4 rounded-2xl border border-brand-green/10 bg-brand-green/[0.02] px-4">
            <DetailRow label="Categoría local">{categoryName}</DetailRow>
            <DetailRow label="Categoría global">
              {product.global_category_name || product.global_category_id}
            </DetailRow>
            <DetailRow label="Precio base">
              {formatPrice(product.base_price, product.base_currency)}
            </DetailRow>
            <DetailRow label="Monedas">{acceptedLabel}</DetailRow>
            <DetailRow label="Domicilio">{product.offers_delivery ? 'Sí' : 'No'}</DetailRow>
            <DetailRow label="Solo vista">{product.view_only ? 'Sí' : 'No'}</DetailRow>
            <DetailRow label="Disponible">{product.is_available ? 'Sí' : 'No'}</DetailRow>
          </dl>
        </div>

        <div className="shrink-0 grid grid-cols-2 gap-2 border-t border-brand-green/8 px-5 py-4 pb-[max(1rem,var(--safe-bottom))]">
          <button
            type="button"
            onClick={() => {
              onClose()
              onDelete(product)
            }}
            className={`${sellerBtnSecondary} !border-brand-carmelita/20 !text-brand-carmelita`}
          >
            Eliminar
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              onEdit(product)
            }}
            className={sellerBtnPrimary}
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  )
}
