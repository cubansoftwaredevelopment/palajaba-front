import { useEffect, useState } from 'react'
import { sellerAlertError, sellerBtnPrimary, sellerBtnSecondary, sellerModalTitle } from './sellerStyles'
import { deleteCatalogCategory } from '../../lib/api'
import { getSellerToken } from '../../lib/sellerAuth'

export default function DeleteCatalogCategoryModal({ category, onClose, onDeleted }) {
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
      await deleteCatalogCategory(token, category.id)
      onDeleted(category)
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la categoría.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-brand-green/20 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-category-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-fade-in rounded-3xl border border-brand-green/12 bg-brand-white p-5 shadow-[0_20px_50px_rgba(89,128,44,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="delete-category-title" className={sellerModalTitle}>
          ¿Eliminar categoría?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-carmelita/90">
          Se eliminará <span className="font-semibold text-brand-green">«{category.name}»</span>. Solo puedes
          hacerlo mientras no tenga productos.
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
