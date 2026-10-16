import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import CatalogThemeScope from '../../components/catalog/CatalogThemeScope'
import BuyerCategoryProductRow from '../../components/buyer/BuyerCategoryProductRow'
import BuyerHeaderSearch from '../../components/buyer/BuyerHeaderSearch'
import BuyerMarketplaceNav from '../../components/buyer/BuyerMarketplaceNav'
import BuyerShell from '../../components/buyer/BuyerShell'
import BuyerStoreProfileHeader from '../../components/buyer/BuyerStoreProfileHeader'
import BuyerCatalogPoweredFooter from '../../components/buyer/BuyerCatalogPoweredFooter'
import StatePanel from '../../components/ui/StatePanel'
import LoadingState from '../../components/ui/LoadingState'
import DeadState from '../../components/ui/DeadState'
import { MARKETPLACE_LABEL } from '../../constants/branding'
import { buyerHomeSections } from '../../components/buyer/buyerStyles'
import Button from '../../components/Button'
import {
  fetchMarketplaceGestorStoreCatalog,
  fetchMarketplaceGestorStoreCategoryProducts,
  fetchMarketplaceStore,
  fetchMarketplaceStoreCatalog,
  fetchMarketplaceStoreCategoryProducts,
} from '../../lib/api'
import { BuyerDisplayedLocationProvider } from '../../context/BuyerDisplayedLocationContext'
import { useBuyerDisplayCurrency } from '../../context/BuyerDisplayCurrencyContext'
import { getBuyerLocation, hasCompleteBuyerLocation, readSharedZoneFromSearch, setBuyerLocation } from '../../lib/buyerLocation'
import { normalizeCatalogTheme } from '../../lib/catalogThemes'
import { validateGestorUsername } from '../../lib/sellerGestores'
import { recordStoreProfileView } from '../../lib/storeProfileView'
import { setStoreCheckoutPhones } from '../../lib/storeCheckoutPhones'
import { storePublicPath } from '../../lib/storeSlug'
import { resolveUserFacingError } from '../../lib/userFacingError'

const PAGE_SIZE = 20

function businessAreaToLocation(area) {
  if (!area?.province_id || !area?.municipality_id) return null
  return {
    province: { id: area.province_id, name: area.province_name },
    municipality: { id: area.municipality_id, name: area.municipality_name },
  }
}

export default function BuyerStorePage() {
  const { storeSlug, gestorUsername } = useParams()
  const sharedLocation = typeof window === 'undefined' ? null : readSharedZoneFromSearch(window.location.search)
  if (sharedLocation) setBuyerLocation(sharedLocation.province, sharedLocation.municipality)
  const buyerLocation = sharedLocation ?? (hasCompleteBuyerLocation() ? getBuyerLocation() : null)
  const [fallbackLocation, setFallbackLocation] = useState(null)
  const [resolvingLocation, setResolvingLocation] = useState(!buyerLocation)
  const [locationError, setLocationError] = useState(false)

  const gestorCheck = gestorUsername ? validateGestorUsername(gestorUsername) : { ok: true, username: null }

  useEffect(() => {
    if (buyerLocation) return undefined

    let cancelled = false
    setResolvingLocation(true)
    setLocationError(false)

    fetchMarketplaceStore(storeSlug)
      .then((store) => {
        if (cancelled) return
        const nextLocation = businessAreaToLocation(store.business_area)
        if (!nextLocation) {
          setLocationError(true)
          setFallbackLocation(null)
          return
        }
        setFallbackLocation(nextLocation)
      })
      .catch(() => {
        if (!cancelled) {
          setLocationError(true)
          setFallbackLocation(null)
        }
      })
      .finally(() => {
        if (!cancelled) setResolvingLocation(false)
      })

    return () => {
      cancelled = true
    }
  }, [buyerLocation, storeSlug])

  if (gestorUsername && !gestorCheck.ok) {
    return <Navigate to={storePublicPath(storeSlug)} replace />
  }

  if (resolvingLocation) {
    return (
      <>
        <BuyerShell backTo="/comprar" backLabel={MARKETPLACE_LABEL}>
          <LoadingState message="Cargando tienda…" className="lg:items-start lg:text-left" />
        </BuyerShell>
        <BuyerMarketplaceNav catalogCategories={[]} catalogCategoriesLoading />
      </>
    )
  }

  const effectiveLocation = buyerLocation ?? fallbackLocation
  if (!effectiveLocation) {
    if (locationError) {
      return <Navigate to="/comprar/provincia" replace />
    }
    return <Navigate to="/comprar/provincia" replace />
  }

  return (
    <BuyerStorePageContent
      location={effectiveLocation}
      gestorUsername={gestorCheck.ok ? gestorCheck.username : null}
    />
  )
}

function BuyerStorePageContent({ location, gestorUsername = null }) {
  const { storeSlug } = useParams()
  const { currency } = useBuyerDisplayCurrency()
  const [catalog, setCatalog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const isGestorCatalog = Boolean(gestorUsername)
  const [storeCategoryId, setStoreCategoryId] = useState('')

  const loadCatalog = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    try {
      const data = isGestorCatalog
        ? await fetchMarketplaceGestorStoreCatalog({
            storeSlug,
            gestorUsername,
            provinceId: location.province.id,
            municipalityId: location.municipality.id,
            currency,
            limitPerCategory: PAGE_SIZE,
          })
        : await fetchMarketplaceStoreCatalog({
            storeSlug,
            provinceId: location.province.id,
            municipalityId: location.municipality.id,
            currency,
            limitPerCategory: PAGE_SIZE,
          })
      setCatalog(data)
      if (!isGestorCatalog && data?.store?.id) {
        const phones = Array.isArray(data.checkout_phones)
          ? data.checkout_phones
          : Array.isArray(data.store?.checkout_phones)
            ? data.store.checkout_phones
            : []
        if (phones.length) {
          setStoreCheckoutPhones(data.store.id, phones)
        }
      }
      recordStoreProfileView(storeSlug, {
        provinceId: location.province.id,
        municipalityId: location.municipality.id,
      })
    } catch (err) {
      setLoadError(
        resolveUserFacingError(err, {
          contextTitle: isGestorCatalog
            ? 'No se pudo abrir el catálogo del gestor'
            : 'No se pudo abrir la tienda',
          fallbackMessage: isGestorCatalog
            ? 'No pudimos cargar este catálogo. Inténtalo de nuevo.'
            : 'No pudimos cargar esta tienda. Inténtalo de nuevo.',
        }),
      )
      setCatalog(null)
    } finally {
      setLoading(false)
    }
  }, [
    currency,
    isGestorCatalog,
    gestorUsername,
    location.municipality.id,
    location.province.id,
    storeSlug,
  ])

  useEffect(() => {
    loadCatalog()
  }, [loadCatalog])

  useEffect(() => {
    setStoreCategoryId('')
  }, [storeSlug, gestorUsername])

  const catalogCategories = useMemo(
    () =>
      (catalog?.sections ?? [])
        .filter((section) => section.products?.length)
        .map((section) => ({ id: section.category_id, name: section.category_name })),
    [catalog],
  )

  const createLoadMore = useCallback(
    (section) => async (offset) => {
      const data = isGestorCatalog
        ? await fetchMarketplaceGestorStoreCategoryProducts({
            storeSlug,
            gestorUsername,
            localCategoryId: section.category_id,
            provinceId: location.province.id,
            municipalityId: location.municipality.id,
            currency,
            limit: PAGE_SIZE,
            offset,
          })
        : await fetchMarketplaceStoreCategoryProducts({
            storeSlug,
            localCategoryId: section.category_id,
            provinceId: location.province.id,
            municipalityId: location.municipality.id,
            currency,
            limit: PAGE_SIZE,
            offset,
          })
      return {
        products: data.products,
        has_more: data.has_more,
      }
    },
    [
      currency,
      isGestorCatalog,
      gestorUsername,
      location.municipality.id,
      location.province.id,
      storeSlug,
    ],
  )

  const sections = catalog?.sections ?? []
  const visibleSections = storeCategoryId
    ? sections.filter((section) => section.category_id === storeCategoryId && section.products?.length)
    : sections.filter((section) => section.products?.length)
  const hasProducts = (catalog?.total_products ?? 0) > 0
  const catalogTheme = normalizeCatalogTheme(catalog?.catalog_theme)
  const backTo = isGestorCatalog ? storePublicPath(storeSlug) : '/comprar'
  const backLabel = isGestorCatalog ? catalog?.store?.store_name || 'Tienda' : MARKETPLACE_LABEL

  return (
    <CatalogThemeScope theme={catalogTheme} className="flex min-h-dvh flex-col">
      <BuyerDisplayedLocationProvider location={location}>
      <BuyerShell
        flushBottom
        backTo={backTo}
        backLabel={backLabel}
        headerSearch={
          <BuyerHeaderSearch
            provinceId={location.province.id}
            municipalityId={location.municipality.id}
            storeSlug={storeSlug}
            gestorUsername={gestorUsername}
          />
        }
      >
      {loading ? (
        <LoadingState message="Cargando tienda…" className="lg:items-start lg:text-left" />
      ) : null}

      {!loading && loadError ? (
        loadError.isNotFound ? (
          <DeadState
            variant="panel"
            title={isGestorCatalog ? 'Catálogo no disponible' : 'Tienda no disponible'}
            message={
              loadError.message ||
              (isGestorCatalog
                ? 'Este gestor no existe o aún no publicó productos.'
                : 'Esta tienda no existe o ya no está activa en Pa\' La Jaba.')
            }
          >
            <Link to={backTo}>
              <Button variant="ghost" className="w-full sm:w-auto">
                {isGestorCatalog ? 'Ver tienda' : `Volver al ${MARKETPLACE_LABEL.toLowerCase()}`}
              </Button>
            </Link>
          </DeadState>
        ) : (
          <StatePanel
            variant="buyer"
            title={loadError.title}
            message={loadError.message}
            serviceError={loadError.isServiceError}
            onRetry={loadError.canRetry ? loadCatalog : undefined}
            retrying={loading}
          >
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center lg:justify-start">
              <Link to={backTo}>
                <Button variant="ghost" className="w-full sm:w-auto">
                  {isGestorCatalog ? 'Ver tienda' : `Volver al ${MARKETPLACE_LABEL.toLowerCase()}`}
                </Button>
              </Link>
            </div>
          </StatePanel>
        )
      ) : null}

      {!loading && !loadError && catalog ? (
        <div className="flex min-h-full flex-1 flex-col">
        <div className={buyerHomeSections}>
          <BuyerStoreProfileHeader catalog={catalog} location={location} />

          {!hasProducts ? (
            <div className="rounded-3xl border border-brand-yellow/25 bg-brand-yellow/15 px-5 py-6 text-center lg:text-left">
              <p className="font-display text-lg font-bold text-brand-green">Sin productos disponibles</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-carmelita/90">
                {isGestorCatalog
                  ? 'Este gestor todavía no tiene productos en su catálogo.'
                  : 'Esta tienda no tiene productos publicados en este momento.'}
              </p>
            </div>
          ) : (
            visibleSections.map((section) => (
              <BuyerCategoryProductRow
                key={section.category_id}
                section={section}
                loadMore={createLoadMore(section)}
              />
            ))
          )}

        </div>
          <BuyerCatalogPoweredFooter pinned />
        </div>
      ) : null}
      </BuyerShell>
      </BuyerDisplayedLocationProvider>
      <BuyerMarketplaceNav
        catalogCategories={catalogCategories}
        catalogCategoriesLoading={loading}
        selectedCatalogCategoryId={storeCategoryId}
        onCatalogCategorySelect={setStoreCategoryId}
      />
    </CatalogThemeScope>
  )
}
