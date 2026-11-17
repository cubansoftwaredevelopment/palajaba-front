import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { matchPath, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { fetchMarketplaceFeed } from '../api.js'
import { fetchRenewalContactPhone } from '../../subscriptions/api.js'
import { isAdminAuthenticated } from '../../lib/adminAuth'
import { useBuyerDisplayCurrency } from '../context.js'
import { getAdditionalMunicipalities, getBuyerLocation, setMarketplaceCategoryFilter } from '../../lib/buyerLocation'
import { marketplaceCategoryPath, resolveMarketplaceCategory, storeCategoryPath } from '../../lib/marketplaceCategory'
import { storeGestorPublicPath, storePublicPath } from '../../lib/storeSlug'
import { getSellerProfile, isSellerAuthenticated, SELLER_AUTH_CHANGE_EVENT } from '../../lib/sellerAuth'
import { CUSTOMER_AUTH_CHANGE_EVENT, getCustomerProfile, isCustomerAuthenticated } from '../../lib/customerAuth'
import { resolveMediaUrl } from '../../lib/media'
import StoreMark from './StoreMark'
import { buyerProductDetailBody, buyerProductDetailModal, buyerProductDetailOverlay } from './buyerStyles'
import BuyerMotionFrame from '../../motion/BuyerMotionFrame'
import { useSheetExitMs } from '../../motion/presets'
import { buildWhatsAppUrl } from '../../lib/whatsappOrder'
import { openExternalUrl } from '../../lib/nativeApp'
import { useDismissibleModal } from './useOrderModalPresence'
import { setOptionsFabPresent } from '../../lib/optionsFabVisibility'
import AppDownloadPrompt from '../../appReleases/components/AppDownloadPrompt.jsx'

export const MARKETPLACE_CATEGORY_EVENT = 'pala-jaba-marketplace-category'

const HELP_MESSAGE = 'Hola tengo un problema'

function barItemClass(active) {
  return `flex flex-col items-center justify-center gap-0.5 py-1.5 text-center text-[0.625rem] font-semibold touch-manipulation ${active ? 'text-brand-green' : 'text-brand-carmelita/65'}`
}

function barIconClass(active) {
  return `relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl ${active ? 'bg-brand-green text-white' : ''}`
}

function BarItem({ active, label, icon, to, state, disabled, onClick }) {
  const body = (
    <span className={barItemClass(active)}>
      <span className={barIconClass(active)}>{icon}</span>
      <span className="w-full truncate px-0.5">{label}</span>
    </span>
  )
  if (to) {
    return (
      <NavLink to={to} state={state} end className="min-w-0 flex-1" onClick={onClick}>
        {body}
      </NavLink>
    )
  }
  return (
    <button type="button" className="min-w-0 flex-1 disabled:opacity-40" disabled={disabled} onClick={onClick}>
      {body}
    </button>
  )
}

function CategoryModal({ categories, loading, selectedId, onClose: requestClose, onSelect, emptyMessage, storePhotoUrl = '', storeName = '' }) {
  const exitMs = useSheetExitMs()
  const { dismiss: onClose, closing, sheetProps } = useDismissibleModal(requestClose, exitMs, { motion: true })
  return (
    <BuyerMotionFrame
      closing={closing}
      sheetProps={sheetProps}
      overlayClassName={`${buyerProductDetailOverlay} z-[85]`}
      panelClassName={`${buyerProductDetailModal} max-h-[min(92dvh,44rem)]`}
      overlayProps={{
        role: 'presentation',
        onMouseDown: (event) => {
          if (event.target === event.currentTarget) onClose()
        },
      }}
      panelProps={{ role: 'dialog', 'aria-modal': true, 'aria-labelledby': 'buyer-category-modal-title' }}
    >
        <div className="shrink-0 px-5 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-green/15 sm:hidden" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3 pb-3">
            <h2 id="buyer-category-modal-title" className="font-display text-lg font-bold text-brand-green">
              Categorías
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-brand-carmelita touch-manipulation active:bg-brand-green/8"
              aria-label="Cerrar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <ul className={`${buyerProductDetailBody} pb-4`}>
          {loading ? (
            <li className="px-5 py-4 text-sm text-brand-carmelita">Cargando categorías…</li>
          ) : categories.length === 0 ? (
            <li className="px-5 py-4 text-sm text-brand-carmelita">{emptyMessage}</li>
          ) : (
            [{ id: '', name: 'Todas las categorías' }, ...categories].map((category) => {
              const active = (selectedId || '') === category.id
              return (
                <li key={category.id || 'all'}>
                  <button
                    type="button"
                    onClick={() => onSelect(category.id)}
                    className={`flex w-full items-center gap-3 px-5 py-3 text-left text-sm touch-manipulation ${
                      active ? 'bg-brand-green/10 font-semibold text-brand-green' : 'text-brand-green'
                    }`}
                  >
                    {storePhotoUrl || storeName ? (
                      <StoreMark photoUrl={storePhotoUrl} storeName={storeName} />
                    ) : null}
                    <span className="min-w-0 flex-1">{category.name}</span>
                    {active ? <span aria-hidden="true">✓</span> : null}
                  </button>
                </li>
              )
            })
          )}
        </ul>
    </BuyerMotionFrame>
  )
}

export default function BuyerMarketplaceNav({
  catalogCategories,
  catalogCategoriesLoading = false,
  selectedCatalogCategoryId = '',
  storeSlug = '',
  gestorUsername = null,
  storePhotoUrl = '',
  storeName = '',
}) {
  const route = useLocation()
  const navigate = useNavigate()
  const location = getBuyerLocation()
  const { currencies } = useBuyerDisplayCurrency()
  const provinceId = location?.province?.id ?? ''
  const municipalityId = location?.municipality?.id ?? ''
  const isCatalog = catalogCategories !== undefined
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [helpPhone, setHelpPhone] = useState('')
  const [, refreshAuthState] = useState(0)

  useEffect(() => {
    const refresh = () => refreshAuthState((current) => current + 1)
    window.addEventListener(CUSTOMER_AUTH_CHANGE_EVENT, refresh)
    window.addEventListener(SELLER_AUTH_CHANGE_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(CUSTOMER_AUTH_CHANGE_EVENT, refresh)
      window.removeEventListener(SELLER_AUTH_CHANGE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchRenewalContactPhone()
      .then((data) => {
        if (!cancelled) setHelpPhone(data?.renewal_contact_phone || '')
      })
      .catch(() => {
        if (!cancelled) setHelpPhone('')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isCatalog) return undefined
    setCategories(catalogCategories)
    setCategoriesLoading(catalogCategoriesLoading)
    return undefined
  }, [catalogCategories, catalogCategoriesLoading, isCatalog])

  useEffect(() => {
    setOptionsFabPresent(true)
    return () => setOptionsFabPresent(false)
  }, [])

  useEffect(() => {
    if (isCatalog || !categoryOpen || !provinceId || !municipalityId) return undefined
    let cancelled = false
    setCategoriesLoading(true)
    fetchMarketplaceFeed({
      provinceId,
      municipalityId,
      additionalMunicipalityIds: getAdditionalMunicipalities(provinceId),
      currency: currencies,
      limitPerCategory: 1,
      limit: 50,
      offset: 0,
    })
      .then((data) => {
        if (cancelled) return
        const stocked = (data?.sections ?? [])
          .filter((section) => (section.total_products ?? section.products?.length ?? 0) > 0)
          .map((section) => ({ id: section.category_id, name: section.category_name }))
        setCategories(stocked)
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [categoryOpen, currencies, isCatalog, municipalityId, provinceId])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      if (categoryOpen) setCategoryOpen(false)
    }
    if (!categoryOpen) return undefined
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [categoryOpen])

  useEffect(() => {
    if (isCatalog) return
    const match = matchPath({ path: '/comprar/:categorySlug', end: true }, route.pathname)
    const slug = match?.params?.categorySlug
    if (!slug || slug === 'negocios') {
      setSelectedCategoryId('')
      return
    }
    const found = resolveMarketplaceCategory(categories, slug)
    setSelectedCategoryId(found?.id || '')
  }, [categories, isCatalog, route.pathname])

  function chooseCategory(categoryId) {
    setCategoryOpen(false)

    const category = categories.find((item) => item.id === categoryId)
    const categoryName = category?.name

    if (isCatalog) {
      const homePath = gestorUsername
        ? storeGestorPublicPath(storeSlug, gestorUsername)
        : storePublicPath(storeSlug)
      if (!categoryId) {
        if (route.pathname !== homePath) navigate(homePath)
        return
      }
      const path = storeCategoryPath(
        storeSlug,
        { category_id: categoryId, category_name: categoryName },
        gestorUsername,
      )
      if (route.pathname === path) return
      navigate(path, {
        state: { categoryId, categoryName, kind: 'category' },
      })
      return
    }

    setSelectedCategoryId(categoryId)
    if (provinceId) setMarketplaceCategoryFilter(provinceId, '')

    if (!categoryId) {
      if (route.pathname !== '/comprar') navigate('/comprar')
      return
    }

    const path = marketplaceCategoryPath({
      category_id: categoryId,
      category_name: categoryName,
    })
    if (route.pathname === path) return
    navigate(path, {
      state: { categoryId, categoryName },
    })
  }

  function openHelp() {
    const url = buildWhatsAppUrl(helpPhone, HELP_MESSAGE)
    if (url) openExternalUrl(url)
  }

  const sellerSignedIn = isSellerAuthenticated()
  const accountSignedIn = sellerSignedIn || isAdminAuthenticated()
  const customerSignedIn = isCustomerAuthenticated()
  const signedInProfile = customerSignedIn ? getCustomerProfile() : sellerSignedIn ? getSellerProfile() : null
  const profileImageUrl = resolveMediaUrl(signedInProfile?.profile_photo_url)
  const activeCategoryId = isCatalog ? selectedCatalogCategoryId : selectedCategoryId
  const categoryActive = categoryOpen || Boolean(activeCategoryId)
  const accountTo = customerSignedIn ? '/cliente' : sellerSignedIn ? '/tienda' : '/login'
  const accountLabel = sellerSignedIn && !customerSignedIn ? 'Mi tienda' : 'Cuenta'
  const accountActive = customerSignedIn
    ? route.pathname.startsWith('/cliente')
    : sellerSignedIn && route.pathname.startsWith('/tienda')
  const accountIcon = profileImageUrl ? (
    <img
      src={profileImageUrl}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
      onError={(event) => { event.currentTarget.style.display = 'none' }}
    />
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
  const menu = (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-brand-green/10 bg-brand-white/95 shadow-[0_-4px_24px_rgba(89,128,44,0.08)] backdrop-blur-md"
        style={{ paddingBottom: 'max(0.375rem, var(--safe-bottom))' }}
        aria-label="Secciones de compra"
      >
        <div className="mx-auto flex w-full max-w-md items-stretch px-1">
          <AppDownloadPrompt variant="bar" />
          <BarItem
            active={categoryActive}
            label="Categorías"
            onClick={() => {
              if (!isCatalog) setCategoriesLoading(true)
              setCategoryOpen(true)
            }}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
                <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
                <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
                <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
              </svg>
            }
          />
          <BarItem
            label="Ayuda"
            disabled={!helpPhone}
            onClick={openHelp}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10 10 0 0 0 4.65 1.18h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.41 17.5 2 12.04 2Zm5.76 14.15c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.12.11-1.81-.11-.42-.14-.95-.31-1.64-.6-2.88-1.25-4.76-4.16-4.9-4.35-.14-.19-1.17-1.55-1.17-2.96 0-1.41.74-2.1 1-2.39.26-.28.57-.35.76-.35.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.57.81 1.97.88 2.11.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.28-.12.55.16.26.7 1.16 1.51 1.88 1.04.92 1.91 1.21 2.18 1.35.26.14.42.12.58-.07.16-.19.66-.77.84-1.03.18-.26.35-.22.59-.13.24.09 1.51.71 1.77.84.26.13.43.19.5.3.06.11.06.64-.18 1.32Z"
                />
              </svg>
            }
          />
          {accountSignedIn && !customerSignedIn && !sellerSignedIn ? (
            <BarItem active={false} label="Cuenta" disabled icon={accountIcon} />
          ) : (
            <BarItem
              to={accountTo}
              state={customerSignedIn || sellerSignedIn ? undefined : { accountType: 'customer' }}
              active={accountActive}
              label={accountLabel}
              icon={accountIcon}
            />
          )}
        </div>
      </nav>
      {categoryOpen ? (
        <CategoryModal
          categories={categories}
          loading={categoriesLoading}
          selectedId={activeCategoryId}
          emptyMessage={
            isCatalog
              ? 'Esta tienda no tiene categorías con productos.'
              : 'No hay categorías con productos en esta zona.'
          }
          onClose={() => setCategoryOpen(false)}
          onSelect={chooseCategory}
          storePhotoUrl={isCatalog ? storePhotoUrl : ''}
          storeName={isCatalog ? storeName : ''}
        />
      ) : null}
    </>
  )

  return createPortal(menu, document.body)
}
