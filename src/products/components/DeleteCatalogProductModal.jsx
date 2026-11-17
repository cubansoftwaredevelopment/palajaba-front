import { useEffect, useState } from 'react'
import {
  sellerAlertError,
  sellerBtnPrimary,
  sellerBtnSecondary,
  sellerModalBody,
  sellerModalFooter,
  sellerModalTitle,
} from '../../components/seller/sellerStyles'
import { deleteCatalogProduct } from '../api.js'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { getSellerToken } from '../../lib/sellerAuth'
import SellerModalPortal from '../../components/seller/SellerModalPortal'
import SellerMotionSheet, { useSellerSheet } from '../../motion/SellerMotionSheet'

export default function DeleteCatalogProductModal({ product, onClose: requestClose, onDeleted }) {
  const { dismiss: onClose, closing, sheetProps } = useSellerSheet(requestClose)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      await deleteCatalogProduct(token, product.id)
      onDeleted(product)
    } catch (err) {
      setError(getUserFacingMessage(err, 'No se pudo eliminar el producto.'))
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
        labelledBy="delete-product-title"
      >
          <div className="shrink-0 border-b border-brand-green/8 px-5 py-4">
            <h2 id="delete-product-title" className={sellerModalTitle}>
              ¿Eliminar producto?
            </h2>
          </div>

          <div className={sellerModalBody}>
            <p className="text-sm leading-relaxed text-brand-carmelita/90">
              Se eliminará <span className="font-semibold text-brand-green">«{product.name}»</span> de tu catálogo.
              Esta acción no se puede deshacer.
            </p>

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
              {loading ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
      </SellerMotionSheet>
    </SellerModalPortal>
  )
}
