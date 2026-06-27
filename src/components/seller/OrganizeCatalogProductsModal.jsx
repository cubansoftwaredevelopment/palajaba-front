import { useEffect, useMemo, useState } from 'react'

import { PRODUCT_SORT_MODES } from '../../constants/catalog'
import { reorderCatalogProducts, updateCatalogCategoryProductSort } from '../../lib/api'
import { sortProductsForPreview } from '../../lib/catalogProductSort'
import { getCupPerUnit, loadExchangeRates } from '../../lib/exchangeRates'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { getSellerToken } from '../../lib/sellerAuth'
import { formatPrice } from '../../lib/money'
import { resolveMediaUrl } from '../../lib/media'
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

export default function OrganizeCatalogProductsModal({ category, onClose, onSaved }) {
  const [selectedMode, setSelectedMode] = useState(category.product_sort_mode || 'popularity')
  const [items, setItems] = useState(category.products ?? [])
  const [manualItems, setManualItems] = useState(category.products ?? [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [draggingIndex, setDraggingIndex] = useState(null)
  const [ratesReady, setRatesReady] = useState(false)

  const initialMode = category.product_sort_mode || 'popularity'
  const initialManualOrder = useMemo(
    () => (category.products ?? []).map((product) => product.id).join('|'),
    [category.products],
  )
  const currentManualOrder = manualItems.map((product) => product.id).join('|')

  const modeChanged = selectedMode !== initialMode
  const manualOrderChanged = selectedMode === 'manual' && currentManualOrder !== initialManualOrder
  const hasChanges = modeChanged || manualOrderChanged

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    loadExchangeRates()
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setRatesReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (selectedMode === 'manual') {
      setItems(manualItems)
      return
    }
    setItems(sortProductsForPreview(category.products ?? [], selectedMode, getCupPerUnit()))
  }, [category.products, manualItems, selectedMode, ratesReady])

  function handleModeChange(mode) {
    setSelectedMode(mode)
    if (mode === 'manual') {
      setManualItems(
        items.length
          ? items
          : sortProductsForPreview(category.products ?? [], selectedMode, getCupPerUnit()),
      )
    }
  }

  function moveProduct(index, direction) {
    setManualItems((prev) => moveItem(prev, index, index + direction))
  }

  function handleDrop(dropIndex) {
    if (draggingIndex == null || draggingIndex === dropIndex) return
    setManualItems((prev) => moveItem(prev, draggingIndex, dropIndex))
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
      let summary = null

      if (modeChanged) {
        summary = await updateCatalogCategoryProductSort(token, category.id, selectedMode)
      }

      if (selectedMode === 'manual' && manualOrderChanged) {
        summary = await reorderCatalogProducts(
          token,
          category.id,
          manualItems.map((product) => product.id),
        )
      }

      if (summary) {
        onSaved(summary)
      } else {
        onClose()
      }
    } catch (err) {
      setError(getUserFacingMessage(err, 'No se pudo guardar el orden de los productos.'))
    } finally {
      setLoading(false)
    }
  }

  const isManual = selectedMode === 'manual'

  return (
    <SellerModalPortal>
      <div
        className={sellerModalOverlay}
        role="dialog"
        aria-modal="true"
        aria-labelledby="organize-products-title"
        onClick={onClose}
      >
        <div className={sellerModalSheet} onClick={(event) => event.stopPropagation()}>
          <div className="flex items-start justify-between gap-3 border-b border-brand-green/8 px-5 py-4">
            <div className="min-w-0">
              <h2 id="organize-products-title" className={sellerModalTitle}>
                Organizar productos
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-brand-carmelita/85">
                {category.name} · elige cómo se muestran en tu tienda pública.
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
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-brand-green">Orden de visualización</legend>
              {PRODUCT_SORT_MODES.map((mode) => (
                <label
                  key={mode.id}
                  className={`flex cursor-pointer gap-3 rounded-2xl border px-3 py-3 transition-colors ${
                    selectedMode === mode.id
                      ? 'border-brand-green/30 bg-brand-green/[0.05]'
                      : 'border-brand-green/12 bg-brand-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="product-sort-mode"
                    value={mode.id}
                    checked={selectedMode === mode.id}
                    onChange={() => handleModeChange(mode.id)}
                    className="mt-1 h-4 w-4 accent-brand-green"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-brand-green">{mode.label}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-brand-carmelita/85">
                      {mode.description}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="mt-4">
              <p className="text-sm font-semibold text-brand-green">Vista previa del orden</p>
              <ol className="mt-2 flex flex-col gap-2">
                {items.map((product, index) => {
                  const imageSrc = resolveMediaUrl(product.image_url)
                  const isFirst = index === 0
                  const isLast = index === items.length - 1

                  return (
                    <li
                      key={product.id}
                      draggable={isManual}
                      onDragStart={() => isManual && setDraggingIndex(index)}
                      onDragEnd={() => setDraggingIndex(null)}
                      onDragOver={(event) => isManual && event.preventDefault()}
                      onDrop={(event) => {
                        if (!isManual) return
                        event.preventDefault()
                        handleDrop(index)
                      }}
                      className={`flex items-center gap-2 rounded-2xl border border-brand-green/12 bg-brand-white px-2.5 py-2.5 shadow-[0_2px_10px_rgba(89,128,44,0.05)] transition-opacity ${
                        draggingIndex === index ? 'opacity-60' : ''
                      }`}
                    >
                      {isManual ? (
                        <div className={`${sellerIconBtn} cursor-grab active:cursor-grabbing`} aria-hidden="true">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="9" cy="7" r="1.3" />
                            <circle cx="15" cy="7" r="1.3" />
                            <circle cx="9" cy="12" r="1.3" />
                            <circle cx="15" cy="12" r="1.3" />
                            <circle cx="9" cy="17" r="1.3" />
                            <circle cx="15" cy="17" r="1.3" />
                          </svg>
                        </div>
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-xs font-bold text-brand-green">
                          {index + 1}
                        </span>
                      )}

                      {imageSrc ? (
                        <img src={imageSrc} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/8 text-[0.6rem] font-semibold text-brand-carmelita/60">
                          Sin foto
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-brand-green">{product.name}</p>
                        <p className="text-[0.65rem] text-brand-carmelita/75">
                          {formatPrice(product.base_price, product.base_currency)}
                        </p>
                      </div>

                      {isManual ? (
                        <div className="flex shrink-0 flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => moveProduct(index, -1)}
                            disabled={isFirst || loading}
                            className={`${sellerIconBtn} !h-8 !w-8 disabled:opacity-40`}
                            aria-label={`Subir ${product.name}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path d="m18 15-6-6-6 6" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveProduct(index, 1)}
                            disabled={isLast || loading}
                            className={`${sellerIconBtn} !h-8 !w-8 disabled:opacity-40`}
                            aria-label={`Bajar ${product.name}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </button>
                        </div>
                      ) : null}
                    </li>
                  )
                })}
              </ol>
            </div>

            <p className={`mt-3 ${sellerHint}`}>
              {isManual
                ? 'Arrastra o usa las flechas para definir el orden manual. Tus clientes verán exactamente esta secuencia.'
                : 'Este es el mismo orden que verán tus clientes en la tienda pública.'}
            </p>

            {error ? (
              <p className={`mt-3 ${sellerAlertError}`} role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 border-t border-brand-green/8 px-5 py-4">
            <button type="button" onClick={handleSave} disabled={loading} className={sellerBtnPrimary}>
              {loading ? 'Guardando…' : hasChanges ? 'Guardar orden' : 'Listo'}
            </button>
            <button type="button" onClick={onClose} disabled={loading} className={sellerBtnSecondary}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </SellerModalPortal>
  )
}
