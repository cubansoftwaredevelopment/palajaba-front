import { useEffect, useState } from 'react'
import {
  sellerAlertError,
  sellerBtnPrimary,
  sellerBtnSecondary,
  sellerModalBody,
  sellerModalFooter,
  sellerModalTitle,
} from '../../components/seller/sellerStyles'
import { deleteCatalogCategory } from '../api.js'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { getSellerToken } from '../../lib/sellerAuth'
import SellerModalPortal from '../../components/seller/SellerModalPortal'
import SellerMotionSheet, { useSellerSheet } from '../../motion/SellerMotionSheet'

export default function DeleteCatalogCategoryModal({ category, onClose: requestClose, onDeleted }) {
  const { dismiss: onClose, closing, sheetProps } = useSellerSheet(requestClose)
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
      <SellerMotionSheet
        onClose={onClose}
        closing={closing}
        sheetProps={sheetProps}
        labelledBy="delete-category-title"
      >
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
      </SellerMotionSheet>
    </SellerModalPortal>
  )
}
