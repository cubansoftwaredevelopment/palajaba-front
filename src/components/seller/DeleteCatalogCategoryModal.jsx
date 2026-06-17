import { useEffect, useState } from 'react'
import {
  sellerAlertError,
  sellerBtnPrimary,
  sellerBtnSecondary,
  sellerModalBody,
  sellerModalFooter,
  sellerModalOverlay,
  sellerModalSheet,
  sellerModalTitle,
} from './sellerStyles'
import { deleteCatalogCategory } from '../../lib/api'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { getSellerToken } from '../../lib/sellerAuth'
import SellerModalPortal from './SellerModalPortal'

export default function DeleteCatalogCategoryModal({ category, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const productCount = category.product_count ?? category.products?.length ?? 0
  const hasProducts = productCount > 0

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

  async function handleDelete() {
    setError('')
    setLoading(true)
    try {
      const token = getSellerToken()
      await deleteCatalogCategory(token, category.id)
      onDeleted(category)
    } catch (err) {
      setError(getUserFacingMessage(err, 'No se pudo eliminar la categoría.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SellerModalPortal>
      <div
        className={sellerModalOverlay}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-category-title"
        onClick={onClose}
      >
        <div className={sellerModalSheet} onClick={(e) => e.stopPropagation()}>
          <div className="shrink-0 border-b border-brand-green/8 px-5 py-4">
            <h2 id="delete-category-title" className={sellerModalTitle}>
              ¿Eliminar categoría?
            </h2>
          </div>

          <div className={sellerModalBody}>
            {hasProducts ? (
              <div className="rounded-2xl border border-brand-carmelita/20 bg-brand-carmelita/[0.06] px-3.5 py-3">
                <p className="text-sm font-semibold text-brand-carmelita">
                  Esta categoría tiene {productCount} producto{productCount === 1 ? '' : 's'}.
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-brand-carmelita/90">
                  Al eliminar <span className="font-semibold text-brand-green">«{category.name}»</span> también se
                  borrarán todos sus productos. Esta acción no se puede deshacer.
                </p>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-brand-carmelita/90">
                Se eliminará <span className="font-semibold text-brand-green">«{category.name}»</span> de tu catálogo.
              </p>
            )}

            {error ? (
              <p className={`mt-3 ${sellerAlertError}`} role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className={`${sellerModalFooter} grid grid-cols-2 gap-2`}>
            <button type="button" onClick={onClose} disabled={loading} className={sellerBtnSecondary}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className={`${sellerBtnPrimary} !bg-brand-carmelita !shadow-none`}
            >
              {loading ? 'Eliminando…' : hasProducts ? 'Eliminar todo' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </SellerModalPortal>
  )
}
