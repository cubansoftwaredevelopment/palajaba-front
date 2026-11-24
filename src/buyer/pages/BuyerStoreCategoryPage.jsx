import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import CatalogThemeScope from '../../products/componentes/CatalogThemeScope.jsx'
import BuyerStoreServiceFooter from '../componentes/BuyerStoreServiceFooter.jsx'
import BuyerHeaderSearch from '../componentes/BuyerHeaderSearch.jsx'
import { BuyerStoreIdentity } from '../componentes/BuyerStoreHeader.jsx'
import BuyerMarketplaceNav from '../componentes/BuyerMarketplaceNav.jsx'
import BuyerProductCard from '../componentes/BuyerProductCard.jsx'
import BuyerShell from '../componentes/BuyerShell.jsx'
import {
  buyerCategorySectionTitle,
  buyerHomeSections,
  buyerProductGrid,
} from '../componentes/buyerStyles.js'
import LoadingState from '../../shared/componentes/LoadingState.jsx'
import StatePanel from '../../shared/componentes/StatePanel.jsx'
import { BuyerDisplayedLocationProvider } from '../context/context.js'
import { useBuyerDisplayCurrency } from '../context/context.js'
import { DEAD_MASCOT, LOADING_MASCOT } from '../../shared/utils/branding.js'
import {
  fetchMarketplaceGestorStoreCatalog,
  fetchMarketplaceGestorStoreCategoryProducts,
  fetchMarketplaceStoreCatalog,
  fetchMarketplaceStoreCategoryProducts,
} from '../../products/api.js'
import { normalizeCatalogTheme } from '../../products/utils/constants.js'
import { resolveMarketplaceCategory } from '../utils/marketplaceCategory.js'
import { getAdditionalMunicipalities } from '../utils/buyerLocation.js'
import { storeGestorPublicPath, storePublicPath } from '../../seller/utils/storeSlug.js'
import { resolveUserFacingError } from '../../shared/utils/userFacingError.js'
import { usePublicStoreLocation } from './usePublicStoreLocation'

const PAGE_SIZE = 20

export default function BuyerStoreCategoryPage({
  categorySlug: categorySlugProp,
  gestorUsername = null,
}) {
  const { storeSlug } = useParams()
  const { location, resolvingLocation, locationError } = usePublicStoreLocation(storeSlug)

  if (resolvingLocation) {
    return (
      <>
        <BuyerShell backTo="/comprar" backLabel="">
          <LoadingState message="Cargando tienda…" className="lg:items-start lg:text-left" />
        </BuyerShell>
        <BuyerMarketplaceNav
          catalogCategories={[]}
          catalogCategoriesLoading
          storeSlug={storeSlug}
          gestorUsername={gestorUsername}
        />
      </>
    )
  }

  if (!location || locationError) {
    return <Navigate to="/comprar/provincia" replace />
  }

  return (
    <BuyerStoreCategoryPageContent
      location={location}
      categorySlug={categorySlugProp}
      gestorUsername={gestorUsername}
    />
  )
}

function BuyerStoreCategoryPageContent({ location, categorySlug, gestorUsername = null }) {
  const { storeSlug } = useParams()
  const route = useLocation()
  const navigate = useNavigate()
  const hintedCategory = route.state
  const { currencies } = useBuyerDisplayCurrency()
  const [additionalMunicipalityIds] = useState(() =>
    getAdditionalMunicipalities(location.province.id),
  )
  const sentinelRef = useRef(null)
  const loadingMoreRef = useRef(false)
  const isGestorCatalog = Boolean(gestorUsername)

  const [catalog, setCatalog] = useState(null)
  const [category, setCategory] = useState(null)
  const [resolving, setResolving] = useState(true)
  const [products, setProducts] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState(null)

  const storeHomePath = isGestorCatalog
    ? storeGestorPublicPath(storeSlug, gestorUsername)
    : storePublicPath(storeSlug)

  useEffect(() => {
    let cancelled = false
    const hinted = hintedCategory?.categoryId
      ? {
          id: hintedCategory.categoryId,
          name: hintedCategory.categoryName || decodeURIComponent(categorySlug || ''),
        }
      : null

    setResolving(true)
    setCategory(hinted)
    setProducts([])
    setHasMore(false)
    setLoadError(null)
    setCatalog(null)

    const loadCatalog = isGestorCatalog
      ? fetchMarketplaceGestorStoreCatalog
      : fetchMarketplaceStoreCatalog

    loadCatalog({
      storeSlug,
      gestorUsername,
      provinceId: location.province.id,
      municipalityId: location.municipality.id,
      additionalMunicipalityIds,
      currency: currencies,
      limitPerCategory: 1,
    })
      .then((data) => {
        if (cancelled) return
        setCatalog(data)
        const sections = (data?.sections ?? []).map((section) => ({
          id: section.category_id,
          name: section.category_name,
        }))
        setCategory(hinted || resolveMarketplaceCategory(sections, categorySlug))
      })
      .catch((err) => {
        if (cancelled) return
        if (hinted) {
          setCategory(hinted)
          return
        }
        setCategory(null)
        setLoadError(
          resolveUserFacingError(err, {
            contextTitle: 'No se pudo abrir la categoría',
            fallbackMessage: 'No pudimos cargar esta categoría. Inténtalo de nuevo.',
          }),
        )
      })
      .finally(() => {
        if (!cancelled) setResolving(false)
      })

    return () => {
      cancelled = true
    }
  }, [
    additionalMunicipalityIds,
    categorySlug,
    currencies,
    gestorUsername,
    hintedCategory?.categoryId,
    hintedCategory?.categoryName,
    isGestorCatalog,
    location.municipality.id,
    location.province.id,
    storeSlug,
  ])

  const loadProducts = useCallback(
    async ({ offset = 0, append = false } = {}) => {
      if (!category?.id) return
      if (append) {
        if (loadingMoreRef.current) return
        loadingMoreRef.current = true
        setLoadingMore(true)
      } else {
        setLoading(true)
        setLoadError(null)
      }

      try {
        const data = isGestorCatalog
          ? await fetchMarketplaceGestorStoreCategoryProducts({
              storeSlug,
              gestorUsername,
              localCategoryId: category.id,
              provinceId: location.province.id,
              municipalityId: location.municipality.id,
              additionalMunicipalityIds,
              currency: currencies,
              limit: PAGE_SIZE,
              offset,
            })
          : await fetchMarketplaceStoreCategoryProducts({
              storeSlug,
              localCategoryId: category.id,
              provinceId: location.province.id,
              municipalityId: location.municipality.id,
              additionalMunicipalityIds,
              currency: currencies,
              limit: PAGE_SIZE,
              offset,
            })
        setProducts((current) => {
          if (!append) return data.products ?? []
          const seen = new Set(current.map((item) => item.id))
          return [...current, ...(data.products ?? []).filter((item) => !seen.has(item.id))]
        })
        setHasMore(Boolean(data.has_more))
      } catch (err) {
        if (!append) {
          setLoadError(
            resolveUserFacingError(err, {
              contextTitle: 'No se pudo cargar la categoría',
              fallbackMessage: 'No pudimos mostrar los productos de esta categoría. Inténtalo de nuevo.',
            }),
          )
        }
      } finally {
        if (append) {
          loadingMoreRef.current = false
          setLoadingMore(false)
        } else {
          setLoading(false)
        }
      }
    },
    [
      additionalMunicipalityIds,
      category?.id,
      currencies,
      gestorUsername,
      isGestorCatalog,
      location.municipality.id,
      location.province.id,
      storeSlug,
    ],
  )

  useEffect(() => {
    if (!category?.id) {
      setLoading(false)
      return undefined
    }
    loadProducts({ offset: 0, append: false })
    return undefined
  }, [category?.id, loadProducts])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || loading || loadingMore || resolving) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadProducts({ offset: products.length, append: true })
        }
      },
      { rootMargin: '240px', threshold: 0.1 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadProducts, loading, loadingMore, products.length, resolving])

  const catalogCategories = useMemo(
    () =>
      (catalog?.sections ?? [])
        .filter((section) => (section.total_products ?? section.products?.length ?? 0) > 0)
        .map((section) => ({
          id: section.category_id,
          name: section.category_name,
        })),
    [catalog],
  )
  const catalogTheme = normalizeCatalogTheme(catalog?.catalog_theme)
  const catalogPalette = catalog?.catalog_palette ?? null
  const categoryName = category?.name || decodeURIComponent(categorySlug || '')

  function goBack() {
    if (route.key !== 'default') {
      navigate(-1)
      return
    }
    navigate(storeHomePath)
  }

  return (
    <CatalogThemeScope theme={catalogTheme} palette={catalogPalette} className="flex min-h-dvh flex-col">
      <BuyerDisplayedLocationProvider location={location}>
        <BuyerShell
          flushBottom
          headerLayout="stack"
          headerStart={
            <BuyerStoreIdentity
              store={catalog?.store}
              onBack={goBack}
              backLabel="Volver"
            />
          }
          headerSearch={
            <BuyerHeaderSearch
              provinceId={location.province.id}
              municipalityId={location.municipality.id}
              additionalMunicipalityIds={additionalMunicipalityIds}
              storeSlug={storeSlug}
              gestorUsername={gestorUsername}
              showGo
            />
          }
        >
          <div className="flex min-h-full flex-1 flex-col">
            <div className={buyerHomeSections}>
              <h1 className={buyerCategorySectionTitle}>{categoryName}</h1>

              {resolving || loading ? (
                <LoadingState message="Cargando productos…" className="lg:items-start lg:text-left" />
              ) : null}

              {!resolving && !category && !loadError ? (
                <StatePanel
                  variant="buyer"
                  title="Categoría no encontrada"
                  message="Esta tienda no tiene esa categoría. Vuelve al catálogo y elige otra."
                />
              ) : null}

              {!resolving && loadError && (!category || !products.length) ? (
                <StatePanel
                  variant="buyer"
                  title={loadError.title}
                  message={loadError.message}
                  serviceError={loadError.isServiceError}
                  onRetry={loadError.canRetry ? () => (category?.id ? loadProducts() : window.location.reload()) : undefined}
                  retrying={loading}
                />
              ) : null}

              {!resolving && category && !loading && !loadError && !products.length ? (
                <div className="flex flex-col items-center rounded-3xl border border-brand-yellow/25 bg-brand-yellow/15 px-5 py-8 text-center">
                  <img src={DEAD_MASCOT.src} alt="" className="mb-3 h-36 w-36 object-contain" />
                  <p className="font-display text-lg font-bold text-brand-green">
                    Aún no hay productos en esta categoría
                  </p>
                </div>
              ) : null}

              {!resolving && category && !loading && products.length ? (
                <>
                  <div className={buyerProductGrid}>
                    {products.map((product) => (
                      <BuyerProductCard key={product.id} product={product} />
                    ))}
                  </div>
                  {hasMore ? (
                    <div ref={sentinelRef} className="flex min-h-16 items-center justify-center py-4">
                      {loadingMore ? (
                        <img
                          src={LOADING_MASCOT.src}
                          alt=""
                          className="h-14 w-14 animate-levitate object-contain"
                          width={56}
                          height={56}
                          decoding="async"
                        />
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
            <BuyerStoreServiceFooter
              storeName={catalog?.store?.store_name}
              storeSlug={catalog?.store?.store_slug || storeSlug}
              photoUrl={catalog?.store?.profile_photo_url}
              provinceName={catalog?.business_area?.province_name}
              offersDelivery={catalog?.offers_delivery}
              pages={catalog?.store_pages}
              homeTo={
                gestorUsername
                  ? storeGestorPublicPath(storeSlug, gestorUsername)
                  : storePublicPath(storeSlug)
              }
              clearFab
            />
          </div>
        </BuyerShell>
      </BuyerDisplayedLocationProvider>
      <BuyerMarketplaceNav
        catalogCategories={catalogCategories}
        catalogCategoriesLoading={resolving}
        selectedCatalogCategoryId={category?.id || ''}
        storeSlug={storeSlug}
        gestorUsername={gestorUsername}
        storePhotoUrl={catalog?.store?.profile_photo_url}
        storeName={catalog?.store?.store_name}
      />
    </CatalogThemeScope>
  )
}
