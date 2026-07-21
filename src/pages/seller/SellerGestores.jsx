import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import ConfirmModal from '../../components/ConfirmModal'
import SellerPageHeader from '../../components/seller/SellerPageHeader'
import SellerSuccessAlert from '../../components/seller/SellerSuccessAlert'
import LoadingState from '../../components/ui/LoadingState'
import StatePanel from '../../components/ui/StatePanel'
import { formatPrice } from '../../lib/money'
import {
  createSellerGestor,
  deleteSellerGestor,
  fetchSellerGestorCatalogAccess,
  fetchSellerGestorCheckoutPhones,
  fetchSellerGestorNetworkProducts,
  fetchSellerGestores,
  updateSellerGestorCatalogAccess,
  updateSellerGestorCheckoutPhones,
} from '../../lib/api'
import { getSellerToken } from '../../lib/sellerAuth'
import {
  areAllProductsSelected,
  buildCatalogAccessPayload,
  buildCheckoutPhonesPayload,
  catalogAccessDirty,
  checkoutPhonesDirty,
  deriveSelectionFromAccess,
  gestorEligibleForCheckoutPhone,
  gestorSetupStatus,
  selectAllProductIds,
  toggleGestorCheckoutId,
  toggleProductId,
  validateCheckoutPhonesSelection,
  validateGestorUsername,
} from '../../lib/sellerGestores'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { gestorLoginPath } from '../../lib/gestorAuth'
import {
  sellerAlertError,
  sellerBtnPrimary,
  sellerBtnPrimaryCompact,
  sellerChoice,
  sellerHint,
  sellerInput,
  sellerPageWrap,
  sellerSection,
  sellerSectionGap,
} from '../../components/seller/sellerStyles'

const DeleteIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
)

const PeopleIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

export default function SellerGestores() {
  const { profile } = useOutletContext()
  const loginUrl = profile?.store_slug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}${gestorLoginPath(profile.store_slug)}`
    : ''
  const [gestores, setGestores] = useState([])
  const [products, setProducts] = useState([])
  const [savedAccess, setSavedAccess] = useState(null)
  const [accessMode, setAccessMode] = useState('selected')
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [newUsername, setNewUsername] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [gestorToDelete, setGestorToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [savingAccess, setSavingAccess] = useState(false)
  const [accessError, setAccessError] = useState('')

  const [savedCheckoutIds, setSavedCheckoutIds] = useState([])
  const [checkoutIds, setCheckoutIds] = useState([])
  const [savedIncludeStorePhone, setSavedIncludeStorePhone] = useState(true)
  const [includeStorePhone, setIncludeStorePhone] = useState(true)
  const [savingCheckoutPhones, setSavingCheckoutPhones] = useState(false)
  const [checkoutPhonesError, setCheckoutPhonesError] = useState('')

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const token = getSellerToken()
      const [list, access, networkProducts, checkoutPhones] = await Promise.all([
        fetchSellerGestores(token),
        fetchSellerGestorCatalogAccess(token),
        fetchSellerGestorNetworkProducts(token),
        fetchSellerGestorCheckoutPhones(token),
      ])
      setGestores(list)
      setProducts(networkProducts)
      setSavedAccess(access)
      const derived = deriveSelectionFromAccess(access, networkProducts)
      setAccessMode(derived.mode)
      setSelectedIds(derived.selectedIds)
      const ids = Array.isArray(checkoutPhones?.gestor_ids)
        ? checkoutPhones.gestor_ids.map(String)
        : []
      const includeStore = checkoutPhones?.include_store_phone !== false
      setSavedCheckoutIds(ids)
      setCheckoutIds(ids)
      setSavedIncludeStorePhone(includeStore)
      setIncludeStorePhone(includeStore)
    } catch (err) {
      setGestores([])
      setProducts([])
      setSavedCheckoutIds([])
      setCheckoutIds([])
      setSavedIncludeStorePhone(true)
      setIncludeStorePhone(true)
      setError(getUserFacingMessage(err, 'No pudimos cargar tus gestores. Inténtalo de nuevo.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const draftAccess = useMemo(
    () => buildCatalogAccessPayload(accessMode, selectedIds),
    [accessMode, selectedIds],
  )

  const accessIsDirty = useMemo(
    () => catalogAccessDirty(savedAccess, draftAccess),
    [savedAccess, draftAccess],
  )

  const checkoutPhonesIsDirty = useMemo(
    () =>
      checkoutPhonesDirty(
        { gestor_ids: savedCheckoutIds, include_store_phone: savedIncludeStorePhone },
        { gestor_ids: checkoutIds, include_store_phone: includeStorePhone },
      ),
    [savedCheckoutIds, checkoutIds, savedIncludeStorePhone, includeStorePhone],
  )

  const eligibleCheckoutGestores = useMemo(
    () => gestores.filter(gestorEligibleForCheckoutPhone),
    [gestores],
  )

  const allSelected = areAllProductsSelected(products, selectedIds)

  async function handleCreate(e) {
    e.preventDefault()
    setCreateError('')
    const validated = validateGestorUsername(newUsername)
    if (!validated.ok) {
      setCreateError(validated.message)
      return
    }

    setCreating(true)
    try {
      const token = getSellerToken()
      const created = await createSellerGestor(token, validated.username)
      setGestores((prev) => [...prev, created].sort((a, b) => a.username.localeCompare(b.username)))
      setNewUsername('')
      setSuccessMessage(`Gestor «${created.username}» creado. Comparte su enlace cuando esté listo.`)
    } catch (err) {
      setCreateError(getUserFacingMessage(err, 'No pudimos crear el gestor. Inténtalo de nuevo.'))
    } finally {
      setCreating(false)
    }
  }

  async function handleConfirmDelete() {
    if (!gestorToDelete) return
    setDeleting(true)
    try {
      const token = getSellerToken()
      await deleteSellerGestor(token, gestorToDelete.id)
      const deletedId = String(gestorToDelete.id)
      setGestores((prev) => prev.filter((g) => g.id !== gestorToDelete.id))
      setCheckoutIds((prev) => prev.filter((id) => id !== deletedId))
      setSavedCheckoutIds((prev) => prev.filter((id) => id !== deletedId))
      setSuccessMessage(`Gestor «${gestorToDelete.username}» eliminado.`)
      setGestorToDelete(null)
    } catch (err) {
      setError(getUserFacingMessage(err, 'No pudimos eliminar el gestor. Inténtalo de nuevo.'))
      setGestorToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  function handleToggleCheckoutPhone(gestorId) {
    setCheckoutPhonesError('')
    setCheckoutIds((prev) => toggleGestorCheckoutId(prev, gestorId))
  }

  function handleToggleStorePhone() {
    setCheckoutPhonesError('')
    setIncludeStorePhone((prev) => !prev)
  }

  async function handleSaveCheckoutPhones() {
    setCheckoutPhonesError('')
    const validation = validateCheckoutPhonesSelection(checkoutIds, includeStorePhone)
    if (!validation.ok) {
      setCheckoutPhonesError(validation.message)
      return
    }
    setSavingCheckoutPhones(true)
    try {
      const token = getSellerToken()
      const payload = buildCheckoutPhonesPayload(checkoutIds, includeStorePhone)
      const updated = await updateSellerGestorCheckoutPhones(token, payload)
      const ids = Array.isArray(updated?.gestor_ids) ? updated.gestor_ids.map(String) : []
      const includeStore = updated?.include_store_phone !== false
      setSavedCheckoutIds(ids)
      setCheckoutIds(ids)
      setSavedIncludeStorePhone(includeStore)
      setIncludeStorePhone(includeStore)
      setSuccessMessage('Teléfonos de venta actualizados.')
    } catch (err) {
      setCheckoutPhonesError(
        getUserFacingMessage(err, 'No pudimos guardar los teléfonos. Inténtalo de nuevo.'),
      )
    } finally {
      setSavingCheckoutPhones(false)
    }
  }

  function handleModeChange(mode) {
    setAccessError('')
    setAccessMode(mode)
    if (mode === 'all') {
      setSelectedIds(selectAllProductIds(products))
    }
  }

  function handleToggleProduct(productId) {
    setAccessError('')
    setAccessMode('selected')
    setSelectedIds((prev) => toggleProductId(prev, productId))
  }

  function handleSelectAll() {
    setAccessError('')
    if (allSelected && accessMode === 'selected') {
      setSelectedIds([])
      return
    }
    setAccessMode('all')
    setSelectedIds(selectAllProductIds(products))
  }

  async function handleSaveAccess() {
    setAccessError('')
    setSavingAccess(true)
    try {
      const token = getSellerToken()
      const payload = buildCatalogAccessPayload(accessMode, selectedIds)
      const updated = await updateSellerGestorCatalogAccess(token, payload)
      setSavedAccess(updated)
      const networkProducts = await fetchSellerGestorNetworkProducts(token)
      setProducts(networkProducts)
      const derived = deriveSelectionFromAccess(updated, networkProducts)
      setAccessMode(derived.mode)
      setSelectedIds(derived.selectedIds)
      setSuccessMessage('Productos de la red actualizados.')
    } catch (err) {
      setAccessError(getUserFacingMessage(err, 'No pudimos guardar la selección. Inténtalo de nuevo.'))
    } finally {
      setSavingAccess(false)
    }
  }

  if (loading) {
    return (
      <section className={`animate-fade-in ${sellerPageWrap}`}>
        <LoadingState label="Cargando gestores…" />
      </section>
    )
  }

  if (error && gestores.length === 0 && products.length === 0 && !savedAccess) {
    return (
      <section className={`animate-fade-in ${sellerPageWrap} ${sellerSectionGap}`}>
        <SellerPageHeader
          eyebrow="Tu red"
          title="Gestores"
          subtitle="Administra quién puede revender tus productos."
        />
        <StatePanel
          variant="seller"
          title="No se pudo cargar"
          message={error}
          serviceError
          onRetry={loadAll}
        />
      </section>
    )
  }

  return (
    <section className={`animate-fade-in ${sellerPageWrap} ${sellerSectionGap}`}>
      <SellerPageHeader
        eyebrow="Tu red"
        title="Gestores"
        subtitle="Crea usuarios para tu red de venta y elige qué productos pueden ofrecer."
      />

      <SellerSuccessAlert message={successMessage} onDismiss={() => setSuccessMessage('')} />

      {error ? (
        <p className={sellerAlertError} role="alert">
          {error}
        </p>
      ) : null}

      <div className={sellerSection}>
        <h3 className="font-display text-base font-bold text-brand-green sm:text-lg">Tus gestores</h3>
        <p className={`mt-1 ${sellerHint}`}>
          Solo necesitas el usuario. Ellos completan contraseña y teléfono en su primer ingreso.
          {loginUrl ? (
            <>
              {' '}
              Login:{' '}
              <span className="break-all font-medium text-brand-green">{loginUrl.replace(/^https?:\/\//, '')}</span>
            </>
          ) : null}
        </p>

        <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <label htmlFor="gestor-username" className="sr-only">
              Usuario del gestor
            </label>
            <input
              id="gestor-username"
              type="text"
              autoComplete="off"
              spellCheck={false}
              maxLength={32}
              placeholder="usuario_gestor"
              value={newUsername}
              onChange={(e) => {
                setCreateError('')
                setNewUsername(e.target.value)
              }}
              className={sellerInput}
              disabled={creating}
            />
            {createError ? (
              <p className="mt-1.5 text-xs text-brand-carmelita" role="alert">
                {createError}
              </p>
            ) : (
              <p className={`mt-1.5 ${sellerHint}`}>Letras minúsculas, números, _ y - (2–32 caracteres).</p>
            )}
          </div>
          <button type="submit" disabled={creating || !newUsername.trim()} className={sellerBtnPrimaryCompact}>
            {creating ? 'Creando…' : 'Agregar'}
          </button>
        </form>

        {gestores.length === 0 ? (
          <div className="mt-5 flex flex-col items-center py-4 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-yellow/20 text-brand-green">
              {PeopleIcon}
            </div>
            <p className="text-sm font-semibold text-brand-green">Aún no tienes gestores</p>
            <p className={`mt-1 max-w-xs ${sellerHint}`}>
              Agrega el primero con un usuario. Después podrás compartir su enlace de catálogo.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-brand-green/8" aria-label="Lista de gestores">
            {gestores.map((gestor) => {
              const status = gestorSetupStatus(gestor)
              return (
                <li key={gestor.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-brand-green">@{gestor.username}</p>
                    <p className={`mt-0.5 ${sellerHint}`}>
                      {status.label}
                      {gestor.phone ? ` · ${gestor.phone}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGestorToDelete(gestor)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-brand-carmelita/70 transition-colors touch-manipulation active:bg-brand-carmelita/10 active:text-brand-carmelita"
                    aria-label={`Eliminar gestor ${gestor.username}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className={sellerSection}>
        <h3 className="font-display text-base font-bold text-brand-green sm:text-lg">
          Teléfonos para ventas de la tienda
        </h3>
        <p className={`mt-1 ${sellerHint}`}>
          Elige qué números aparecen cuando alguien compra en tu catálogo. Puedes ocultar el del
          negocio y dejar solo gestores. El pedido siempre se guarda en tu negocio.
        </p>

        <ul className="mt-4 space-y-1" aria-label="Teléfonos para ventas">
          <li>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 transition-colors touch-manipulation active:bg-brand-green/5">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-brand-green/30 text-brand-green focus:ring-brand-green/25"
                checked={includeStorePhone}
                onChange={handleToggleStorePhone}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-brand-green">
                  Número del negocio
                </span>
                <span className={`block ${sellerHint}`}>
                  {profile?.phone ? profile.phone : 'Tu teléfono de perfil'}
                </span>
              </span>
            </label>
          </li>
          {eligibleCheckoutGestores.map((gestor) => {
            const checked = checkoutIds.includes(String(gestor.id))
            return (
              <li key={gestor.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 transition-colors touch-manipulation active:bg-brand-green/5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 rounded border-brand-green/30 text-brand-green focus:ring-brand-green/25"
                    checked={checked}
                    onChange={() => handleToggleCheckoutPhone(gestor.id)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-brand-green">
                      @{gestor.username}
                    </span>
                    <span className={`block ${sellerHint}`}>{gestor.phone}</span>
                  </span>
                </label>
              </li>
            )
          })}
        </ul>

        {eligibleCheckoutGestores.length === 0 ? (
          <p className={`mt-3 ${sellerHint}`}>
            Cuando un gestor complete su registro con teléfono, podrás habilitarlo aquí.
          </p>
        ) : null}

        {checkoutPhonesError ? (
          <p className={`mt-3 ${sellerAlertError}`} role="alert">
            {checkoutPhonesError}
          </p>
        ) : null}

        <div className="mt-4">
          <button
            type="button"
            onClick={handleSaveCheckoutPhones}
            disabled={!checkoutPhonesIsDirty || savingCheckoutPhones}
            className={sellerBtnPrimary}
          >
            {savingCheckoutPhones ? 'Guardando…' : 'Guardar teléfonos de venta'}
          </button>
        </div>
      </div>

      <div className={sellerSection}>
        <h3 className="font-display text-base font-bold text-brand-green sm:text-lg">
          Productos para la red
        </h3>
        <p className={`mt-1 ${sellerHint}`}>
          Define qué productos de tu catálogo pueden elegir tus gestores.
        </p>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Modo de acceso">
          <button
            type="button"
            className={sellerChoice(accessMode === 'all')}
            onClick={() => handleModeChange('all')}
          >
            Todos
          </button>
          <button
            type="button"
            className={sellerChoice(accessMode === 'selected')}
            onClick={() => handleModeChange('selected')}
          >
            Solo seleccionados
          </button>
        </div>

        {products.length === 0 ? (
          <p className={`mt-4 ${sellerHint}`}>
            Todavía no tienes productos en el catálogo. Créalos en Catálogo para habilitarlos aquí.
          </p>
        ) : (
          <>
            {accessMode === 'selected' ? (
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className={sellerHint}>
                  {selectedIds.length} de {products.length} seleccionados
                </p>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-semibold text-brand-green touch-manipulation active:text-brand-green/80"
                >
                  {allSelected ? 'Quitar todos' : 'Seleccionar todos'}
                </button>
              </div>
            ) : (
              <p className={`mt-3 ${sellerHint}`}>Toda tu red puede ofrecer cualquier producto de tu catálogo.</p>
            )}

            <ul className="mt-3 max-h-[22rem] space-y-1 overflow-y-auto overscroll-y-contain pr-0.5" aria-label="Productos del catálogo">
              {products.map((product) => {
                const checked = accessMode === 'all' || selectedIds.includes(String(product.product_id))
                const disabled = accessMode === 'all'
                return (
                  <li key={product.product_id}>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 transition-colors touch-manipulation ${
                        disabled ? 'opacity-80' : 'active:bg-brand-green/5'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0 rounded border-brand-green/30 text-brand-green focus:ring-brand-green/25"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => handleToggleProduct(product.product_id)}
                      />
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-green/8 text-brand-carmelita/50">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="m21 15-5-5L5 21" />
                          </svg>
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-brand-green">{product.name}</span>
                        <span className={`block ${sellerHint}`}>
                          {formatPrice(product.base_price, product.base_currency)}
                          {!product.is_available ? ' · No disponible' : ''}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </>
        )}

        {accessError ? (
          <p className={`mt-3 ${sellerAlertError}`} role="alert">
            {accessError}
          </p>
        ) : null}

        <div className="mt-4">
          <button
            type="button"
            onClick={handleSaveAccess}
            disabled={!accessIsDirty || savingAccess || products.length === 0}
            className={sellerBtnPrimary}
          >
            {savingAccess ? 'Guardando…' : 'Guardar productos de la red'}
          </button>
        </div>
      </div>

      {gestorToDelete ? (
        <ConfirmModal
          title={`¿Eliminar a @${gestorToDelete.username}?`}
          confirmLabel={deleting ? 'Eliminando…' : 'Sí, eliminar'}
          cancelLabel="Cancelar"
          confirmVariant="tertiary"
          icon={DeleteIcon}
          onClose={() => {
            if (!deleting) setGestorToDelete(null)
          }}
          onConfirm={() => {
            if (!deleting) handleConfirmDelete()
          }}
        />
      ) : null}
    </section>
  )
}
