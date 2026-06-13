import { useEffect, useState } from 'react'
import { CATALOG_CATEGORY_SUGGESTIONS } from '../../constants/catalog'
import {
  sellerAlertError,
  sellerBtnPrimary,
  sellerBtnSecondary,
  sellerCharCounter,
  sellerChip,
  sellerModalBody,
  sellerModalFooter,
  sellerModalInput,
  sellerModalOverlay,
  sellerModalSheet,
  sellerLabel,
  sellerModalTitle,
} from './sellerStyles'
import { createCatalogCategory } from '../../lib/api'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { getSellerToken } from '../../lib/sellerAuth'
import SellerModalPortal from './SellerModalPortal'

export default function CreateCatalogCategoryModal({ initialName = '', onClose, onCreated }) {
  const [name, setName] = useState(initialName)
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

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setError('Escribe un nombre de al menos 2 caracteres.')
      return
    }

    setLoading(true)
    try {
      const token = getSellerToken()
      const category = await createCatalogCategory(token, { name: trimmed })
      onCreated(category)
    } catch (err) {
      setError(getUserFacingMessage(err, 'No se pudo crear la categoría.'))
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
        aria-labelledby="create-catalog-category-title"
        onClick={onClose}
      >
        <div className={sellerModalSheet} onClick={(e) => e.stopPropagation()}>
          <div className="shrink-0 border-b border-brand-green/8 px-5 py-4">
            <h2 id="create-catalog-category-title" className={sellerModalTitle}>
              Nueva categoría
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className={sellerModalBody}>
              <label htmlFor="catalog-category-name" className={sellerLabel}>
                Nombre de la categoría
              </label>
              <input
                id="catalog-category-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError('')
                }}
                maxLength={60}
                placeholder="Ej.: Ferretería"
                className={`mt-1.5 ${sellerModalInput}`}
                autoComplete="off"
              />
              <p className={`mt-1 ${sellerCharCounter}`}>{name.length}/60</p>

              <p className="mt-3 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-carmelita/75">
                Ideas rápidas
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {CATALOG_CATEGORY_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setName(suggestion)
                      setError('')
                    }}
                    className={sellerChip(name === suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {error && (
                <p className={`mt-3 ${sellerAlertError}`} role="alert">
                  {error}
                </p>
              )}
            </div>

            <div className={`${sellerModalFooter} grid grid-cols-2 gap-2`}>
              <button type="button" onClick={onClose} disabled={loading} className={sellerBtnSecondary}>
                Cancelar
              </button>
              <button type="submit" disabled={loading} className={sellerBtnPrimary}>
                {loading ? 'Creando…' : 'Crear categoría'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </SellerModalPortal>
  )
}
