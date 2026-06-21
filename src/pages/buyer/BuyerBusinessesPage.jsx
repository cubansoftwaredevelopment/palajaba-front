import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import BuyerAdditionalMunicipalitiesFilter from '../../components/buyer/BuyerAdditionalMunicipalitiesFilter'
import BuyerBusinessCard from '../../components/buyer/BuyerBusinessCard'
import BuyerCurrencySelector from '../../components/buyer/BuyerCurrencySelector'
import BuyerLocationDisplay from '../../components/buyer/BuyerLocationDisplay'
import BuyerMarketplaceSearch, {
  BuyerBusinessSearchResults,
  useMarketplaceSearchActive,
} from '../../components/buyer/BuyerMarketplaceSearch'
import BuyerShell from '../../components/buyer/BuyerShell'
import StatePanel from '../../components/ui/StatePanel'
import LoadingState from '../../components/ui/LoadingState'
import DeadState from '../../components/ui/DeadState'
import Button from '../../components/Button'
import { BUSINESSES_LABEL, LOADING_MASCOT } from '../../constants/branding'
import { buyerBusinessList } from '../../components/buyer/buyerStyles'
import { fetchCategories, fetchMarketplaceBusinesses } from '../../lib/api'
import {
  getAdditionalMunicipalities,
  getBuyerLocation,
  getMarketplaceCategoryFilter,
  hasCompleteBuyerLocation,
  setAdditionalMunicipalities,
  setMarketplaceCategoryFilter,
} from '../../lib/buyerLocation'
import { resolveUserFacingError } from '../../lib/userFacingError'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

export default function BuyerBusinessesPage() {
  if (!hasCompleteBuyerLocation()) {
    return <Navigate to="/comprar/provincia" replace />
  }

  return <BuyerBusinessesPageContent />
}

function BuyerBusinessesPageContent() {
  const location = getBuyerLocation()
  const sentinelRef = useRef(null)
  const loadingMoreRef = useRef(false)

  const [businesses, setBusinesses] = useState([])
  const [totalBusinesses, setTotalBusinesses] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchCategoryId, setSearchCategoryIdState] = useState(
    () => getMarketplaceCategoryFilter(location.province.id),
  )
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [searchLoadingMore, setSearchLoadingMore] = useState(false)
  const [additionalMunicipalityIds, setAdditionalMunicipalityIdsState] = useState(
    () => getAdditionalMunicipalities(location.province.id),
  )

  const setAdditionalMunicipalityIds = useCallback(
    (nextIds) => {
      setAdditionalMunicipalityIdsState(nextIds)
      setAdditionalMunicipalities(location.province.id, nextIds)
    },
    [location.province.id],
  )

  const setSearchCategoryId = useCallback(
    (nextCategoryId) => {
      setSearchCategoryIdState(nextCategoryId)
      setMarketplaceCategoryFilter(location.province.id, nextCategoryId)
    },
    [location.province.id],
  )

  const searchActive = useMarketplaceSearchActive(debouncedQuery, searchCategoryId)

  const loadBusinesses = useCallback(
    async ({ offset = 0, append = false } = {}) => {
      if (append) {
        if (loadingMoreRef.current) return
        loadingMoreRef.current = true
        setLoadingMore(true)
      } else {
        setLoading(true)
        setLoadError(null)
      }

      try {
        const data = await fetchMarketplaceBusinesses({
          provinceId: location.province.id,
          municipalityId: location.municipality.id,
          additionalMunicipalityIds,
          limit: PAGE_SIZE,
          offset,
        })

        setTotalBusinesses(data.total_businesses)
        setHasMore(data.has_more)
        setBusinesses((current) => {
          if (!append) return data.businesses
          const seen = new Set(current.map((item) => item.store.id))
          const nextItems = data.businesses.filter((item) => !seen.has(item.store.id))
          return [...current, ...nextItems]
        })
      } catch (err) {
        if (!append) {
          setBusinesses([])
          setTotalBusinesses(0)
          setHasMore(false)
          setLoadError(
            resolveUserFacingError(err, {
              contextTitle: `No se pudo cargar ${BUSINESSES_LABEL.toLowerCase()}`,
              fallbackMessage: 'No pudimos mostrar los negocios de tu zona. Inténtalo de nuevo.',
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
    [additionalMunicipalityIds, location.municipality.id, location.province.id],
  )

  useEffect(() => {
    if (!searchActive) {
      loadBusinesses()
    }
  }, [loadBusinesses, searchActive])

  useEffect(() => {
    let cancelled = false
    setCategoriesLoading(true)

    fetchCategories()
      .then((data) => {
        if (!cancelled) setCategories(data)
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
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [searchQuery])

  const runSearch = useCallback(
    async ({ offset = 0, append = false } = {}) => {
      const isActive =
        debouncedQuery.trim().length >= 2 || Boolean(searchCategoryId)

      if (!isActive) {
        setSearchResults(null)
        setSearchError(null)
        setSearchLoading(false)
        return
      }

      if (append) {
        setSearchLoadingMore(true)
      } else {
        setSearchLoading(true)
        setSearchError(null)
      }

      try {
        const data = await fetchMarketplaceBusinesses({
          provinceId: location.province.id,
          municipalityId: location.municipality.id,
          additionalMunicipalityIds,
          query: debouncedQuery,
          categoryId: searchCategoryId || undefined,
          limit: PAGE_SIZE,
          offset,
        })

        setSearchResults((current) => {
          if (!append || !current) return data
          const seen = new Set(current.businesses.map((item) => item.store.id))
          const nextBusinesses = data.businesses.filter((item) => !seen.has(item.store.id))
          return {
            ...data,
            businesses: [...current.businesses, ...nextBusinesses],
          }
        })
      } catch (err) {
        if (!append) {
          setSearchResults(null)
          setSearchError(
            resolveUserFacingError(err, {
              contextTitle: 'No se pudo completar la búsqueda',
              fallbackMessage: 'No pudimos buscar negocios en este momento. Inténtalo de nuevo.',
            }),
          )
        }
      } finally {
        setSearchLoading(false)
        setSearchLoadingMore(false)
      }
    },
    [
      additionalMunicipalityIds,
      debouncedQuery,
      location.municipality.id,
      location.province.id,
      searchCategoryId,
    ],
  )

  useEffect(() => {
    runSearch()
  }, [runSearch])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || loading || loadingMore || searchActive) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadBusinesses({ offset: businesses.length, append: true })
        }
      },
      { rootMargin: '160px', threshold: 0.1 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [businesses.length, hasMore, loadBusinesses, loading, loadingMore, searchActive])

  const hasBusinesses = totalBusinesses > 0

  return (
    <BuyerShell
      headerStart={
        <BuyerLocationDisplay
          province={location.province}
          municipality={location.municipality}
        />
      }
      headerEnd={<BuyerCurrencySelector />}
    >
      <div className="mb-4 flex flex-col gap-2 lg:mb-6 lg:gap-3">
        <BuyerMarketplaceSearch
          categories={categories}
          categoriesLoading={categoriesLoading}
          query={searchQuery}
          categoryId={searchCategoryId}
          onQueryChange={setSearchQuery}
          onCategoryChange={setSearchCategoryId}
          searchLabel="Buscar negocios"
          searchPlaceholder="Buscar negocios en tu municipio…"
          categoryLabel="Filtrar negocios por categoría"
          allCategoriesLabel="Todas las categorías"
        />
        <BuyerAdditionalMunicipalitiesFilter
          provinceId={location.province.id}
          baseMunicipalityId={location.municipality.id}
          selectedIds={additionalMunicipalityIds}
          onChange={setAdditionalMunicipalityIds}
        />
      </div>

      {searchActive ? (
        <BuyerBusinessSearchResults
          loading={searchLoading}
          error={searchError}
          results={searchResults}
          loadingMore={searchLoadingMore}
          onRetry={() => runSearch()}
          retrying={searchLoading}
          onLoadMore={() =>
            runSearch({
              offset: searchResults?.businesses?.length ?? 0,
              append: true,
            })
          }
        />
      ) : null}

      {!searchActive && loading ? (
        <LoadingState message="Cargando negocios…" className="lg:items-start lg:text-left" />
      ) : null}

      {!searchActive && !loading && loadError ? (
        <StatePanel
          variant="buyer"
          title={loadError.title}
          message={loadError.message}
          serviceError={loadError.isServiceError}
          onRetry={loadError.canRetry ? () => loadBusinesses() : undefined}
          retrying={loading}
        />
      ) : null}

      {!searchActive && !loading && !loadError && !hasBusinesses ? (
        <DeadState
          variant="panel"
          title="Aún no hay negocios aquí"
          message={`No encontramos tiendas activas en ${location.municipality.name}. Prueba cambiando tu ubicación o marcando otros municipios para recogida.`}
          className="lg:items-start lg:text-left"
        >
          <Link to="/comprar/provincia">
            <Button variant="secondary" className="w-full sm:w-auto">
              Cambiar ubicación
            </Button>
          </Link>
        </DeadState>
      ) : null}

      {!searchActive && !loading && !loadError && hasBusinesses ? (
        <div className="animate-fade-in">
          <div className={buyerBusinessList}>
            {businesses.map((business) => (
              <BuyerBusinessCard key={business.store.id} business={business} />
            ))}
          </div>

          {hasMore ? (
            <div
              ref={sentinelRef}
              className="flex min-h-16 items-center justify-center py-4"
              aria-hidden={!loadingMore}
            >
              {loadingMore ? (
                <img
                  src={LOADING_MASCOT.src}
                  alt=""
                  className="h-14 w-14 animate-levitate object-contain sm:h-10 sm:w-10"
                  width={56}
                  height={56}
                  decoding="async"
                />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </BuyerShell>
  )
}
