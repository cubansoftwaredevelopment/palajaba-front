import { useEffect, useState } from 'react'
import { sellerAlertError, sellerBtnPrimary, sellerBtnSecondary, sellerModalTitle } from './sellerStyles'
import { deleteCatalogProduct } from '../../lib/api'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { getSellerToken } from '../../lib/sellerAuth'

export default function DeleteCatalogProductModal({ product, onClose, onDeleted }) {
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-brand-green/20 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-product-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-fade-in rounded-3xl border border-brand-green/12 bg-brand-white p-5 shadow-[0_20px_50px_rgba(89,128,44,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="delete-product-title" className={sellerModalTitle}>
          ¿Eliminar producto?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-carmelita/90">
          Se eliminará <span className="font-semibold text-brand-green">«{product.name}»</span> de tu catálogo. Esta
          acción no se puede deshacer.
        </p>
        {error && (
          <p className={`mt-3 ${sellerAlertError}`} role="alert">
            {error}
          </p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
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
      </div>
    </div>
  )
}
