import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import BuyerHeaderSearch from '../../components/buyer/BuyerHeaderSearch'
import BuyerLocationDisplay from '../../components/buyer/BuyerLocationDisplay'
import BuyerProductCard from '../../components/buyer/BuyerProductCard'
import BuyerShell from '../../components/buyer/BuyerShell'
import {
  buyerCategorySectionTitle,
  buyerHomeSections,
  buyerProductGrid,
} from '../../components/buyer/buyerStyles'
import LoadingState from '../../components/ui/LoadingState'
import StatePanel from '../../components/ui/StatePanel'
import { BuyerDisplayedLocationProvider } from '../../context/BuyerDisplayedLocationContext'
import { useBuyerDisplayCurrency } from '../../context/BuyerDisplayCurrencyContext'
import { DEAD_MASCOT, LOADING_MASCOT } from '../../constants/branding'
import { fetchCategories, fetchMarketplaceCategoryProducts } from '../../lib/api'
import {
  applySharedZoneFromSearch,
  getAdditionalMunicipalities,
  getBuyerLocation,
  hasCompleteBuyerLocation,
} from '../../lib/buyerLocation'
import { resolveMarketplaceCategory } from '../../lib/marketplaceCategory'
import { resolveUserFacingError } from '../../lib/userFacingError'

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

  const [category, setCategory] = useState(null)
  const [resolving, setResolving] = useState(true)
  const [products, setProducts] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
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
  }, [categorySlug, hintedCategory?.categoryId, hintedCategory?.categoryName])

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
      location.municipality.id,
      location.province.id,
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
