import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import BuyerAdditionalMunicipalitiesFilter from '../../components/buyer/BuyerAdditionalMunicipalitiesFilter'
import BuyerCategoryProductRow from '../../components/buyer/BuyerCategoryProductRow'
import BuyerCurrencySelector from '../../components/buyer/BuyerCurrencySelector'
import BuyerLocationDisplay from '../../components/buyer/BuyerLocationDisplay'
import BuyerMarketplaceSearch, {
  BuyerSearchResults,
  useMarketplaceSearchActive,
} from '../../components/buyer/BuyerMarketplaceSearch'
import BuyerShell from '../../components/buyer/BuyerShell'
import StatePanel from '../../components/ui/StatePanel'
import LoadingState from '../../components/ui/LoadingState'
import { buyerHomeSections } from '../../components/buyer/buyerStyles'
import Button from '../../components/Button'
import {
  fetchMarketplaceCategoryProducts,
  fetchMarketplaceFeed,
  fetchMarketplaceSearch,
  fetchCategories,
} from '../../lib/api'
import { getBuyerLocation, getAdditionalMunicipalities, hasCompleteBuyerLocation, setAdditionalMunicipalities, getMarketplaceCategoryFilter, setMarketplaceCategoryFilter } from '../../lib/buyerLocation'
import { recordMarketplaceVisit } from '../../lib/marketplaceVisit'
import { resolveUserFacingError } from '../../lib/userFacingError'
import { MARKETPLACE_LABEL } from '../../constants/branding'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

export default function BuyerHome() {
  if (!hasCompleteBuyerLocation()) {
    return <Navigate to="/comprar/provincia" replace />
  }

  return <BuyerHomeContent />
}

function BuyerHomeContent() {
  const location = getBuyerLocation()
  const [feed, setFeed] = useState(null)
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    recordMarketplaceVisit({
      provinceId: location.province.id,
      municipalityId: location.municipality.id,
    })
  }, [location.province.id, location.municipality.id])

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

  const loadFeed = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    try {
      const data = await fetchMarketplaceFeed({
        provinceId: location.province.id,
        municipalityId: location.municipality.id,
        additionalMunicipalityIds,
        limitPerCategory: PAGE_SIZE,
      })
      setFeed(data)
    } catch (err) {
      setLoadError(
        resolveUserFacingError(err, {
          contextTitle: `No se pudo cargar el ${MARKETPLACE_LABEL.toLowerCase()}`,
          fallbackMessage: 'No pudimos mostrar los productos de tu zona. Inténtalo de nuevo.',
        }),
      )
      setFeed(null)
    } finally {
      setLoading(false)
    }
  }, [additionalMunicipalityIds, location.municipality.id, location.province.id])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

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
        const data = await fetchMarketplaceSearch({
          provinceId: location.province.id,
          municipalityId: location.municipality.id,
          additionalMunicipalityIds,
          query: debouncedQuery,
          globalCategoryId: searchCategoryId || undefined,
          limit: PAGE_SIZE,
          offset,
        })

        setSearchResults((current) => {
          if (!append || !current) return data
          const seen = new Set(current.products.map((item) => item.id))
          const nextProducts = data.products.filter((item) => !seen.has(item.id))
          return {
            ...data,
            products: [...current.products, ...nextProducts],
          }
        })
      } catch (err) {
        if (!append) {
          setSearchResults(null)
          setSearchError(
            resolveUserFacingError(err, {
              contextTitle: 'No se pudo completar la búsqueda',
              fallbackMessage: 'No pudimos buscar productos en este momento. Inténtalo de nuevo.',
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

  const sections = feed?.sections ?? []
  const hasProducts = (feed?.total_products ?? 0) > 0

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
        />
        <BuyerAdditionalMunicipalitiesFilter
          provinceId={location.province.id}
          baseMunicipalityId={location.municipality.id}
          selectedIds={additionalMunicipalityIds}
          onChange={setAdditionalMunicipalityIds}
        />
      </div>

      {searchActive ? (
        <BuyerSearchResults
          loading={searchLoading}
          error={searchError}
          results={searchResults}
          loadingMore={searchLoadingMore}
          onRetry={() => runSearch()}
          retrying={searchLoading}
          onLoadMore={() =>
            runSearch({
              offset: searchResults?.products?.length ?? 0,
              append: true,
            })
          }
        />
      ) : null}

      {!searchActive && loading ? (
        <LoadingState message="Cargando productos…" className="lg:items-start lg:text-left" />
      ) : null}

      {!searchActive && !loading && loadError ? (
        <StatePanel
          variant="buyer"
          title={loadError.title}
          message={loadError.message}
          serviceError={loadError.isServiceError}
          onRetry={loadError.canRetry ? loadFeed : undefined}
          retrying={loading}
        />
      ) : null}

      {!searchActive && !loading && !loadError && !hasProducts ? (
        <div className="rounded-3xl border border-brand-yellow/25 bg-brand-yellow/15 px-5 py-6 text-center lg:text-left">
          <p className="font-display text-lg font-bold text-brand-green">Aún no hay productos aquí</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-carmelita/90">
            No encontramos tiendas con productos disponibles en {location.municipality.name}. Prueba con otra
            zona o usa el buscador cuando haya más tiendas.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center lg:justify-start">
            <Link to="/comprar/provincia">
              <Button variant="secondary" className="w-full sm:w-auto">
                Cambiar ubicación
              </Button>
            </Link>
            <Link to="/">
              <Button variant="ghost" className="w-full sm:w-auto">
                Volver al inicio
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      {!searchActive && !loading && !loadError && hasProducts ? (
        <div className={buyerHomeSections}>
          {sections.map((section) => (
            <BuyerCategoryProductRow
              key={section.category_id}
              section={section}
              loadMore={(offset) =>
                fetchMarketplaceCategoryProducts({
                  provinceId: location.province.id,
                  municipalityId: location.municipality.id,
                  additionalMunicipalityIds,
                  globalCategoryId: section.category_id,
                  limit: PAGE_SIZE,
                  offset,
                }).then((data) => ({
                  products: data.products,
                  has_more: data.has_more,
                }))
              }
            />
          ))}
        </div>
      ) : null}
    </BuyerShell>
  )
}
