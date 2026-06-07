import { resolveMediaUrl } from '../../lib/media'
import { formatPrice } from '../../lib/money'
import { sellerCatalogProductRow, sellerFocusRing, sellerIconBtn, sellerIconBtnDanger } from './sellerStyles'

export default function SellerCatalogProductItem({ product, onView, onEdit, onDelete }) {
  const imageSrc = resolveMediaUrl(product.image_url)

  return (
    <div className={sellerCatalogProductRow}>
      <button
        type="button"
        onClick={() => onView(product)}
        className={`flex min-w-0 flex-1 items-center gap-3 text-left touch-manipulation active:opacity-80 ${sellerFocusRing}`}
        aria-label={`Ver detalle de ${product.name}`}
      >
        <div
          className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-brand-green/[0.04] ${
            product.is_available ? '' : 'opacity-75'
          }`}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt=""
              className={`h-full w-full object-cover ${product.is_available ? '' : 'grayscale'}`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[0.6rem] font-semibold text-brand-carmelita/60">
              —
            </div>
          )}
        </div>

        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-sm font-bold leading-tight text-brand-green">
            {product.name}
          </span>
          <span className="mt-0.5 block text-sm font-semibold leading-tight text-brand-carmelita/90">
            {formatPrice(product.base_price, product.base_currency)}
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(product)}
          className={sellerIconBtn}
          aria-label={`Editar ${product.name}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onDelete(product)}
          className={sellerIconBtnDanger}
          aria-label={`Eliminar ${product.name}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
