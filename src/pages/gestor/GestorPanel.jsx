import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import GestorShell from '../../components/gestor/GestorShell'
import LoadingState from '../../components/ui/LoadingState'
import StatePanel from '../../components/ui/StatePanel'
import { formatPrice } from '../../lib/money'
import {
  fetchGestorAllowedProducts,
  fetchGestorMe,
  updateGestorSelectedProducts,
} from '../../lib/api'
import {
  clearGestorSession,
  getGestorContext,
  getGestorProfile,
  getGestorToken,
  gestorLoginPath,
  updateGestorProfileCache,
} from '../../lib/gestorAuth'
import { storeGestorPublicPath } from '../../lib/storeSlug'
import {
  areAllGestorProductsSelected,
  applyMarginToAllGestorProducts,
  buildSelectedProductsPayload,
  computeGestorDisplayPrice,
  countSelectedGestorProducts,
  createGestorProductDrafts,
  gestorProductsDirty,
  parseMarginAmount,
  setAllGestorProductsSelected,
  toggleGestorProductSelection,
  updateGestorProductMargin,
} from '../../lib/gestorCatalog'
import { getUserFacingMessage } from '../../lib/userFacingError'
import {
  sellerAlertError,
  sellerAlertSuccess,
  sellerBtnPrimary,
  sellerBtnSecondary,
  sellerHint,
  sellerInput,
  sellerSection,
} from '../../components/seller/sellerStyles'

export default function GestorPanel() {
  const { storeSlug } = useParams()
  const navigate = useNavigate()
  const slug = String(storeSlug ?? '').trim()
  const context = getGestorContext()
  const cachedProfile = getGestorProfile()

  const [gestor, setGestor] = useState(cachedProfile)
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [bulkMargin, setBulkMargin] = useState('')

  const storeTitle = context?.store_name || slug
  const username = gestor?.username || cachedProfile?.username || ''
  const publicCatalogPath =
    slug && username ? storeGestorPublicPath(slug, username) : null
  const publicCatalogUrl =
    publicCatalogPath && typeof window !== 'undefined'
      ? `${window.location.origin}${publicCatalogPath}`
      : publicCatalogPath

  const loadPanel = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const token = getGestorToken()
      const [me, products] = await Promise.all([
        fetchGestorMe(token),
        fetchGestorAllowedProducts(token),
      ])
      setGestor(me)
      updateGestorProfileCache(me)
      setDrafts(createGestorProductDrafts(products))
    } catch (err) {
      setDrafts([])
      setError(getUserFacingMessage(err, 'No pudimos cargar tu panel. Inténtalo de nuevo.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPanel()
  }, [loadPanel])

  useEffect(() => {
    if (!successMessage) return undefined
    const timer = setTimeout(() => setSuccessMessage(''), 2000)
    return () => clearTimeout(timer)
  }, [successMessage])

  const selectedCount = countSelectedGestorProducts(drafts)
  const allSelected = areAllGestorProductsSelected(drafts)
  const isDirty = useMemo(() => gestorProductsDirty(gestor, drafts), [gestor, drafts])
  const bulkCurrency = drafts[0]?.base_currency || 'CUP'

  function handleLogout() {
    clearGestorSession()
    navigate(gestorLoginPath(slug), { replace: true })
  }

  function handleToggleSelectAll() {
    setSaveError('')
    setDrafts((prev) => setAllGestorProductsSelected(prev, !allSelected))
  }

  function handleApplyBulkMargin() {
    setSaveError('')
    const parsed = parseMarginAmount(bulkMargin === '' ? '0' : bulkMargin)
    if (parsed == null) {
      setSaveError('El margen para todos debe ser un número mayor o igual a 0.')
      return
    }
    const marginValue = bulkMargin === '' ? '0' : bulkMargin
    setDrafts((prev) => applyMarginToAllGestorProducts(prev, marginValue))
    setSuccessMessage(
      drafts.length === 1
        ? 'Margen aplicado al producto.'
        : `Margen aplicado a los ${drafts.length} productos.`,
    )
  }

  async function handleSave() {
    setSaveError('')
    const payload = buildSelectedProductsPayload(drafts)
    if (!payload.ok) {
      setSaveError(payload.message)
      return
    }

    setSaving(true)
    try {
      const token = getGestorToken()
      const updated = await updateGestorSelectedProducts(token, payload.products)
      setGestor(updated)
      updateGestorProfileCache(updated)
      setSuccessMessage('Productos guardados.')
    } catch (err) {
      setSaveError(getUserFacingMessage(err, 'No pudimos guardar. Inténtalo de nuevo.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <GestorShell title={storeTitle} subtitle={username ? `@${username}` : ''} onLogout={handleLogout}>
        <LoadingState label="Cargando tu catálogo…" />
      </GestorShell>
    )
  }

  if (error) {
    return (
      <GestorShell title={storeTitle} subtitle={username ? `@${username}` : ''} onLogout={handleLogout}>
        <StatePanel
          variant="seller"
          title="No se pudo cargar"
          message={error}
          serviceError
          onRetry={loadPanel}
        />
      </GestorShell>
    )
  }

  return (
    <GestorShell title={storeTitle} subtitle={username ? `@${username}` : ''} onLogout={handleLogout}>
      <div className="animate-fade-in flex flex-col gap-4">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-carmelita">
            Tu catálogo
          </p>
          <h1 className="mt-1 font-display text-xl font-bold text-brand-green sm:text-2xl">
            Productos y márgenes
          </h1>
          <p className={`mt-1.5 ${sellerHint}`}>
            Elige qué productos ofreces y cuánto sumas al precio base del negocio (misma moneda).
          </p>
          {publicCatalogUrl ? (
            <p className={`mt-2 ${sellerHint}`}>
              Tu enlace público:{' '}
              <a
                href={publicCatalogPath}
                target="_blank"
                rel="noreferrer"
                className="break-all font-semibold text-brand-green underline-offset-2 active:underline"
              >
                {publicCatalogUrl.replace(/^https?:\/\//, '')}
              </a>
            </p>
          ) : null}
        </header>

        {successMessage ? (
          <p className={sellerAlertSuccess} role="status">
            {successMessage}
          </p>
        ) : null}

        <div className={sellerSection}>
          {drafts.length === 0 ? (
            <p className={sellerHint}>
              El negocio aún no te habilitó productos. Cuando lo haga, aparecerán aquí.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-brand-green">
                  {selectedCount} de {drafts.length} seleccionados
                </p>
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-xs font-semibold text-brand-green touch-manipulation active:text-brand-green/80"
                >
                  {allSelected ? 'Quitar todos' : 'Seleccionar todos'}
                </button>
              </div>

              <div className="mt-3 rounded-xl border border-brand-green/10 bg-brand-green/[0.03] p-3">
                <p className="text-xs font-semibold text-brand-green">Margen para todos</p>
                <p className={`mt-0.5 ${sellerHint}`}>
                  Selecciona todos los productos y les pone el mismo margen ({bulkCurrency}).
                </p>
                <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <label htmlFor="gestor-bulk-margin" className="sr-only">
                    Margen para todos los productos
                  </label>
                  <input
                    id="gestor-bulk-margin"
                    type="text"
                    inputMode="decimal"
                    value={bulkMargin}
                    onChange={(e) => {
                      setSaveError('')
                      setBulkMargin(e.target.value)
                    }}
                    className={sellerInput}
                    placeholder="Ej. 50"
                  />
                  <button
                    type="button"
                    onClick={handleApplyBulkMargin}
                    className={`${sellerBtnSecondary} sm:w-auto sm:min-w-[9.5rem] sm:shrink-0`}
                  >
                    Aplicar a todos
                  </button>
                </div>
              </div>

              <ul className="mt-3 space-y-2" aria-label="Productos disponibles">
                {drafts.map((product) => {
                  const margin = parseMarginAmount(product.marginInput === '' ? '0' : product.marginInput)
                  const display =
                    product.selected && margin != null
                      ? computeGestorDisplayPrice(product.base_price, margin)
                      : null

                  return (
                    <li
                      key={product.product_id}
                      className="rounded-xl border border-brand-green/10 bg-brand-white px-3 py-3"
                    >
                      <label className="flex cursor-pointer items-start gap-3 touch-manipulation">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 shrink-0 rounded border-brand-green/30 text-brand-green focus:ring-brand-green/25"
                          checked={product.selected}
                          onChange={() =>
                            setDrafts((prev) => toggleGestorProductSelection(prev, product.product_id))
                          }
                        />
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-green/8 text-brand-carmelita/40">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <path d="m21 15-5-5L5 21" />
                            </svg>
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-brand-green">{product.name}</span>
                          <span className={`block ${sellerHint}`}>
                            Base {formatPrice(product.base_price, product.base_currency)}
                            {!product.is_available ? ' · No disponible' : ''}
                          </span>
                        </span>
                      </label>

                      {product.selected ? (
                        <div className="mt-3 flex flex-col gap-2 border-t border-brand-green/8 pt-3 sm:flex-row sm:items-end">
                          <div className="min-w-0 flex-1">
                            <label
                              htmlFor={`margin-${product.product_id}`}
                              className="mb-1 block text-xs font-semibold text-brand-green"
                            >
                              Tu margen ({product.base_currency})
                            </label>
                            <input
                              id={`margin-${product.product_id}`}
                              type="text"
                              inputMode="decimal"
                              value={product.marginInput}
                              onChange={(e) =>
                                setDrafts((prev) =>
                                  updateGestorProductMargin(prev, product.product_id, e.target.value),
                                )
                              }
                              className={sellerInput}
                              placeholder="0"
                            />
                          </div>
                          <p className={`sm:pb-2.5 sm:text-right ${sellerHint}`}>
                            Precio público:{' '}
                            <span className="font-semibold text-brand-green">
                              {display != null
                                ? formatPrice(display, product.base_currency)
                                : '—'}
                            </span>
                          </p>
                        </div>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          {saveError ? (
            <p className={`mt-3 ${sellerAlertError}`} role="alert">
              {saveError}
            </p>
          ) : null}

          <div className="mt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saving || drafts.length === 0}
              className={sellerBtnPrimary}
            >
              {saving ? 'Guardando…' : 'Guardar selección'}
            </button>
          </div>
        </div>
      </div>
    </GestorShell>
  )
}
