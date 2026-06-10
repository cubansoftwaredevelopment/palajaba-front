import { useEffect, useMemo, useState } from 'react'

import { getCategoryInitial } from '../../constants/catalog'
import { reorderCatalogCategories } from '../../lib/api'
import { getSellerToken } from '../../lib/sellerAuth'
import SellerModalPortal from './SellerModalPortal'
import {
  sellerAlertError,
  sellerBtnPrimary,
  sellerBtnSecondary,
  sellerFocusRing,
  sellerHint,
  sellerIconBtn,
  sellerModalOverlay,
  sellerModalSheet,
  sellerModalTitle,
} from './sellerStyles'

function moveItem(list, fromIndex, toIndex) {
  if (fromIndex === toIndex) return list
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length) {
    return list
  }

  const next = [...list]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}

export default function ReorderCatalogCategoriesModal({ categories, onClose, onSaved }) {
  const [items, setItems] = useState(categories)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [draggingIndex, setDraggingIndex] = useState(null)

  const initialOrder = useMemo(() => categories.map((category) => category.id).join('|'), [categories])
  const currentOrder = items.map((category) => category.id).join('|')
  const hasChanges = currentOrder !== initialOrder

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

  function moveCategory(index, direction) {
    setItems((prev) => moveItem(prev, index, index + direction))
  }

  function handleDrop(dropIndex) {
    if (draggingIndex == null || draggingIndex === dropIndex) return
    setItems((prev) => moveItem(prev, draggingIndex, dropIndex))
    setDraggingIndex(null)
  }

  async function handleSave() {
    if (!hasChanges) {
      onClose()
      return
    }

    setError('')
    setLoading(true)

    try {
      const token = getSellerToken()
      const summary = await reorderCatalogCategories(
        token,
        items.map((category) => category.id),
      )
      onSaved(summary)
    } catch (err) {
      setError(err.message || 'No se pudo guardar el orden de las categorías.')
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
        aria-labelledby="reorder-categories-title"
        onClick={onClose}
      >
        <div className={sellerModalSheet} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-3 border-b border-brand-green/8 px-5 py-4">
            <div className="min-w-0">
              <h2 id="reorder-categories-title" className={sellerModalTitle}>
                Organizar categorías
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-brand-carmelita/85">
                Arrastra o usa las flechas para definir el orden de tu menú o catálogo.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-carmelita/55 transition-colors touch-manipulation active:bg-brand-green/8 active:text-brand-carmelita ${sellerFocusRing}`}
              aria-label="Cerrar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <ol className="flex flex-col gap-2">
              {items.map((category, index) => {
                const initial = getCategoryInitial(category.name)
                const isFirst = index === 0
                const isLast = index === items.length - 1

                return (
                  <li
                    key={category.id}
                    draggable
                    onDragStart={() => setDraggingIndex(index)}
                    onDragEnd={() => setDraggingIndex(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      handleDrop(index)
                    }}
                    className={`flex items-center gap-2 rounded-2xl border border-brand-green/12 bg-brand-white px-2.5 py-2.5 shadow-[0_2px_10px_rgba(89,128,44,0.05)] transition-opacity ${
                      draggingIndex === index ? 'opacity-60' : ''
                    }`}
                  >
                    <div
                      className={`${sellerIconBtn} cursor-grab active:cursor-grabbing`}
                      aria-hidden="true"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="9" cy="7" r="1.3" />
                        <circle cx="15" cy="7" r="1.3" />
                        <circle cx="9" cy="12" r="1.3" />
                        <circle cx="15" cy="12" r="1.3" />
                        <circle cx="9" cy="17" r="1.3" />
                        <circle cx="15" cy="17" r="1.3" />
                      </svg>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 font-display text-sm font-bold text-brand-green">
                      {initial}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-brand-green">{category.name}</p>
                      <p className="text-[0.65rem] text-brand-carmelita/75">
                        {category.product_count ?? category.products?.length ?? 0} producto
                        {(category.product_count ?? category.products?.length ?? 0) === 1 ? '' : 's'}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveCategory(index, -1)}
                        disabled={isFirst || loading}
                        className={`${sellerIconBtn} !h-8 !w-8 disabled:opacity-40`}
                        aria-label={`Subir categoría ${category.name}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="m18 15-6-6-6 6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCategory(index, 1)}
                        disabled={isLast || loading}
                        className={`${sellerIconBtn} !h-8 !w-8 disabled:opacity-40`}
                        aria-label={`Bajar categoría ${category.name}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    </div>
                  </li>
                )
              })}
            </ol>

            <p className={`mt-3 ${sellerHint}`}>
              Posición 1 arriba. Los compradores verán tus categorías en este mismo orden.
            </p>

            {error ? (
              <p className={`mt-3 ${sellerAlertError}`} role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 border-t border-brand-green/8 px-5 py-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className={sellerBtnPrimary}
            >
              {loading ? 'Guardando…' : hasChanges ? 'Guardar orden' : 'Listo'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={sellerBtnSecondary}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </SellerModalPortal>
  )
}
