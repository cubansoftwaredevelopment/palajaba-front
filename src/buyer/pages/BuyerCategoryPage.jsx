import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import BuyerHeaderSearch from '../componentes/BuyerHeaderSearch.jsx'
import BuyerLocationDisplay from '../componentes/BuyerLocationDisplay.jsx'
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
import { fetchMarketplaceCategoryProducts } from '../api.js'
import { fetchCategories } from '../../products/api.js'
import {
  applySharedZoneFromSearch,
  getAdditionalMunicipalities,
  getBuyerLocation,
  hasCompleteBuyerLocation,
} from '../utils/buyerLocation.js'
import { resolveMarketplaceCategory } from '../utils/marketplaceCategory.js'
import { resolveUserFacingError } from '../../shared/utils/userFacingError.js'
import { readMatchingSnapshot, useSectionSnapshot } from '../../session/useSectionSnapshot'

const PAGE_SIZE = 20

export default function BuyerCategoryPage() {
  if (typeof window !== 'undefined') {
    applySharedZoneFromSearch(window.location.search)
  }
  if (!hasCompleteBuyerLocation()) {
    return <Navigate to="/comprar/provincia" replace />
  }

  return <BuyerCategoryPageContent />
}

function BuyerCategoryPageContent() {
  const { categorySlug } = useParams()
  const route = useLocation()
  const navigate = useNavigate()
  const hintedCategory = route.state
  const location = getBuyerLocation()
  const { currencies } = useBuyerDisplayCurrency()
  const sentinelRef = useRef(null)
  const loadingMoreRef = useRef(false)

  const placeQuery = {
    provinceId: location.province.id,
    municipalityId: location.municipality.id,
    currencyKey: currencies.join(','),
    slug: categorySlug || '',
  }
  const { snapshot, commit } = useSectionSnapshot('customer', `marketplace-category:${categorySlug || ''}`)
  const cached = readMatchingSnapshot(snapshot, placeQuery)
  const placeKey = `${placeQuery.provinceId}|${placeQuery.municipalityId}|${placeQuery.currencyKey}|${placeQuery.slug}`
  const localKeyRef = useRef(cached ? placeKey : '')
  const [category, setCategory] = useState(cached?.category ?? null)
  const [resolving, setResolving] = useState(!cached)
  const [products, setProducts] = useState(cached?.products ?? [])
  const [hasMore, setHasMore] = useState(Boolean(cached?.hasMore))
  const [loading, setLoading] = useState(!cached)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [additionalMunicipalityIds] = useState(() =>
    getAdditionalMunicipalities(location.province.id),
  )

  const municipalityIds = useMemo(() => {
    const ids = [location.municipality.id]
    for (const id of additionalMunicipalityIds) {
      if (id && !ids.includes(id)) ids.push(id)
    }
    return ids
  }, [additionalMunicipalityIds, location.municipality.id])

  useEffect(() => {
    if (localKeyRef.current === placeKey) return undefined
    let cancelled = false
    const hinted = hintedCategory?.categoryId
      ? {
          id: hintedCategory.categoryId,
          name: hintedCategory.categoryName || decodeURIComponent(categorySlug || ''),
        }
      : null

    setResolving(!hinted)
    setCategory(hinted)
    setProducts([])
    setHasMore(false)
    setLoadError(null)

    if (hinted) return undefined

    fetchCategories()
      .then((data) => {
        if (cancelled) return
        const categories = Array.isArray(data) ? data : data?.categories ?? []
        setCategory(resolveMarketplaceCategory(categories, categorySlug))
      })
      .catch(() => {
        if (cancelled) return
        setCategory(null)
      })
      .finally(() => {
        if (!cancelled) setResolving(false)
      })

    return () => {
      cancelled = true
    }
  }, [categorySlug, hintedCategory?.categoryId, hintedCategory?.categoryName, placeKey])

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
        const data = await fetchMarketplaceCategoryProducts({
          provinceId: location.province.id,
          municipalityId: location.municipality.id,
          additionalMunicipalityIds,
          currency: currencies,
          globalCategoryId: category.id,
          limit: PAGE_SIZE,
          offset,
        })
        let nextProducts = data.products ?? []
        setProducts((current) => {
          if (!append) return nextProducts
          const seen = new Set(current.map((item) => item.id))
          nextProducts = [...current, ...nextProducts.filter((item) => !seen.has(item.id))]
          return nextProducts
        })
        const nextHasMore = Boolean(data.has_more)
        setHasMore(nextHasMore)
        if (category) {
          localKeyRef.current = placeKey
          commit({ category, products: nextProducts, hasMore: nextHasMore }, placeQuery)
        }
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
      category,
      category?.id,
      commit,
      currencies,
      location.municipality.id,
      location.province.id,
      placeKey,
    ],
  )

  useEffect(() => {
    if (!category?.id) {
      setLoading(false)
      return undefined
    }
    if (localKeyRef.current === placeKey) return undefined
    localKeyRef.current = placeKey
    loadProducts({ offset: 0, append: false })
    return undefined
  }, [category?.id, loadProducts, placeKey])

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

  const extraMunicipalityCount = Math.max(0, municipalityIds.length - 1)
  const categoryName = category?.name || decodeURIComponent(categorySlug || '')

  function goBack() {
    if (route.key !== 'default') {
      navigate(-1)
      return
    }
    navigate('/comprar')
  }

  return (
    <BuyerDisplayedLocationProvider location={location}>
      <BuyerShell
        headerLayout="stack"
        headerStart={
          <BuyerLocationDisplay
            province={location.province}
            municipality={location.municipality}
            extraMunicipalityCount={extraMunicipalityCount}
          />
        }
        headerSearch={
          <BuyerHeaderSearch
            provinceId={location.province.id}
            municipalityId={location.municipality.id}
            additionalMunicipalityIds={additionalMunicipalityIds}
            showGo
          />
        }
      >
        <div className={buyerHomeSections}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goBack}
              aria-label="Atrás"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-green transition-colors touch-manipulation active:bg-brand-green/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 sm:hover:bg-brand-green/8"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h1 className={buyerCategorySectionTitle}>{categoryName}</h1>
          </div>

          {resolving || loading ? (
            <LoadingState message="Cargando productos…" className="lg:items-start lg:text-left" />
          ) : null}

          {!resolving && !category ? (
            <StatePanel
              variant="buyer"
              title="Categoría no encontrada"
              message="No reconocemos esa categoría. Vuelve al mercado y elige otra."
            />
          ) : null}

          {!resolving && category && !loading && loadError ? (
            <StatePanel
              variant="buyer"
              title={loadError.title}
              message={loadError.message}
              serviceError={loadError.isServiceError}
              onRetry={loadError.canRetry ? () => loadProducts() : undefined}
              retrying={loading}
            />
          ) : null}

          {!resolving && category && !loading && !loadError && !products.length ? (
            <div className="flex flex-col items-center rounded-3xl border border-brand-yellow/25 bg-brand-yellow/15 px-5 py-8 text-center">
              <img src={DEAD_MASCOT.src} alt="" className="mb-3 h-36 w-36 object-contain" />
              <p className="font-display text-lg font-bold text-brand-green">
                Aún no hay productos en esta categoría
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-brand-carmelita/90">
                No encontramos ofertas de {categoryName} en {location.municipality.name}.
              </p>
            </div>
          ) : null}

          {!resolving && category && !loading && !loadError && products.length ? (
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
      </BuyerShell>
    </BuyerDisplayedLocationProvider>
  )
}
