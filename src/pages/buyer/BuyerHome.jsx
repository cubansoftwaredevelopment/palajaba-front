import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import BuyerBannerCarousel from '../../components/buyer/BuyerBannerCarousel'
import BuyerCategoryProductRow from '../../components/buyer/BuyerCategoryProductRow'
import BuyerHeaderSearch from '../../components/buyer/BuyerHeaderSearch'
import BuyerLocationDisplay from '../../components/buyer/BuyerLocationDisplay'
import { MARKETPLACE_CATEGORY_EVENT } from '../../components/buyer/BuyerMarketplaceNav'
import { BuyerSearchResults } from '../../components/buyer/BuyerMarketplaceSearch'
import BuyerShell from '../../components/buyer/BuyerShell'
import StatePanel from '../../components/ui/StatePanel'
import LoadingState from '../../components/ui/LoadingState'
import { buyerHomeSections } from '../../components/buyer/buyerStyles'
import {
  fetchMarketplaceCategoryProducts,
  fetchMarketplaceFeed,
  fetchMarketplaceSearch,
  fetchCategories,
} from '../../lib/api'
import { getBuyerLocation, getAdditionalMunicipalities, hasCompleteBuyerLocation, getMarketplaceCategoryFilter, setMarketplaceCategoryFilter } from '../../lib/buyerLocation'
import { getMunicipalityById, getProvinceById } from '../../constants/cubaLocations'
import { recordMarketplaceVisit } from '../../lib/marketplaceVisit'
import { useBuyerDisplayCurrency } from '../../context/BuyerDisplayCurrencyContext'
import { resolveUserFacingError } from '../../lib/userFacingError'
import { LOADING_MASCOT, MARKETPLACE_LABEL } from '../../constants/branding'

const PAGE_SIZE = 20
const SECTION_PAGE_SIZE = 4

function readPreviewLocation() {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  if (params.get('vista') !== 'preview') return null
  const province = getProvinceById(params.get('provincia'))
  const municipality = getMunicipalityById(params.get('provincia'), params.get('municipio'))
  if (!province || !municipality) return null
  return {
    province: { id: province.id, name: province.name },
    municipality: { id: municipality.id, name: municipality.name },
    bannerId: params.get('banner') || null,
  }
}

export default function BuyerHome() {
  const preview = readPreviewLocation()
  if (!preview && !hasCompleteBuyerLocation()) {
    return <Navigate to="/comprar/provincia" replace />
  }

  return <BuyerHomeContent preview={preview} />
}

function BuyerHomeContent({ preview = null }) {
  const location = preview ?? getBuyerLocation()
  const { currency } = useBuyerDisplayCurrency()
  const [feed, setFeed] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const loadingMoreRef = useRef(false)
  const sentinelRef = useRef(null)
  const [categories, setCategories] = useState([])
  const [searchCategoryId, setSearchCategoryId] = useState(
    () => (preview ? '' : getMarketplaceCategoryFilter(location.province.id)),
  )
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [searchLoadingMore, setSearchLoadingMore] = useState(false)
  const [additionalMunicipalityIds] = useState(
    () => (preview ? [] : getAdditionalMunicipalities(location.province.id)),
  )
  const [municipalityFeeds, setMunicipalityFeeds] = useState([])
  const [groupedLoading, setGroupedLoading] = useState(false)

  const municipalityIds = useMemo(() => {
    const ids = [location.municipality.id]
    for (const id of additionalMunicipalityIds) {
      if (id && !ids.includes(id)) ids.push(id)
    }
    return ids
  }, [additionalMunicipalityIds, location.municipality.id])
  const grouped = municipalityIds.length > 1

  useEffect(() => {
    if (preview) return
    recordMarketplaceVisit({
      provinceId: location.province.id,
      municipalityId: location.municipality.id,
    })
  }, [preview, location.province.id, location.municipality.id])

  useEffect(() => {
    function onCategory(event) {
      if (event.detail?.provinceId !== location.province.id) return
      const nextCategoryId = event.detail.categoryId || ''
      setSearchCategoryId(nextCategoryId)
      setMarketplaceCategoryFilter(location.province.id, nextCategoryId)
    }
    window.addEventListener(MARKETPLACE_CATEGORY_EVENT, onCategory)
    return () => window.removeEventListener(MARKETPLACE_CATEGORY_EVENT, onCategory)
  }, [location.province.id])

  const searchActive = Boolean(searchCategoryId) && !grouped

  const loadFeed = useCallback(async ({ offset = 0, append = false } = {}) => {
    if (append) {
      if (loadingMoreRef.current) return
      loadingMoreRef.current = true
      setLoadingMore(true)
    } else {
      setLoading(true)
      setLoadError(null)
    }

    try {
      const data = await fetchMarketplaceFeed({
        provinceId: location.province.id,
        municipalityId: location.municipality.id,
        additionalMunicipalityIds: [],
        currency,
        limitPerCategory: PAGE_SIZE,
        limit: SECTION_PAGE_SIZE,
        offset,
      })
      setFeed((current) => {
        if (!append || !current) return data
        const seen = new Set(current.sections.map((section) => section.category_id))
        return {
          ...data,
          sections: [
            ...current.sections,
            ...data.sections.filter((section) => !seen.has(section.category_id)),
          ],
        }
      })
    } catch (err) {
      if (!append) {
        setLoadError(
          resolveUserFacingError(err, {
            contextTitle: `No se pudo cargar el ${MARKETPLACE_LABEL.toLowerCase()}`,
            fallbackMessage: 'No pudimos mostrar los productos de tu zona. Inténtalo de nuevo.',
          }),
        )
        setFeed(null)
      }
    } finally {
      if (append) {
        loadingMoreRef.current = false
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
    }
  }, [currency, location.municipality.id, location.province.id])

  useEffect(() => {
    if (grouped) return
    loadFeed()
  }, [grouped, loadFeed])

  useEffect(() => {
    let cancelled = false

    fetchCategories()
      .then((data) => {
        if (!cancelled) setCategories(data)
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const runSearch = useCallback(
    async ({ offset = 0, append = false } = {}) => {
      const isActive = Boolean(searchCategoryId) && !grouped

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
          additionalMunicipalityIds: [],
          currency,
          query: '',
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
      currency,
      grouped,
      location.municipality.id,
      location.province.id,
      searchCategoryId,
    ],
  )

  useEffect(() => {
    runSearch()
  }, [runSearch])

  useEffect(() => {
    if (!grouped) return undefined
    let cancelled = false
    setGroupedLoading(true)
    setLoadError(null)

    const requests = municipalityIds.map((municipalityId) => {
      if (searchCategoryId) {
        return fetchMarketplaceSearch({
          provinceId: location.province.id,
          municipalityId,
          additionalMunicipalityIds: [],
          currency,
          query: '',
          globalCategoryId: searchCategoryId,
          limit: PAGE_SIZE,
          offset: 0,
        }).then((data) => {
          if (!data?.products?.length) return null
          const categoryName =
            data.category_name ||
            categories.find((category) => category.id === searchCategoryId)?.name ||
            'Categoría'
          return {
            municipalityId,
            municipalityName: getMunicipalityById(location.province.id, municipalityId)?.name || municipalityId,
            sections: [
              {
                category_id: searchCategoryId,
                category_name: categoryName,
                products: data.products,
                has_more: data.has_more,
                total_products: data.total_products,
              },
            ],
          }
        })
      }
      return fetchMarketplaceFeed({
        provinceId: location.province.id,
        municipalityId,
        additionalMunicipalityIds: [],
        currency,
        limitPerCategory: PAGE_SIZE,
        limit: 20,
        offset: 0,
      }).then((data) => {
        if ((data?.total_products ?? 0) <= 0) return null
        return {
          municipalityId: data.municipality_id,
          municipalityName: data.municipality_name,
          sections: data.sections ?? [],
        }
      })
    })

    Promise.all(requests.map((request) => request.catch(() => null)))
      .then((blocks) => {
        if (cancelled) return
        setMunicipalityFeeds(blocks.filter(Boolean))
      })
      .catch((err) => {
        if (cancelled) return
        setMunicipalityFeeds([])
        setLoadError(
          resolveUserFacingError(err, {
            contextTitle: `No se pudo cargar el ${MARKETPLACE_LABEL.toLowerCase()}`,
            fallbackMessage: 'No pudimos mostrar los productos de tu zona. Inténtalo de nuevo.',
          }),
        )
      })
      .finally(() => {
        if (!cancelled) setGroupedLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [categories, currency, grouped, location.province.id, municipalityIds, searchCategoryId])

  const sections = feed?.sections ?? []
  const hasProducts = (feed?.total_products ?? 0) > 0
  const hasMoreSections = Boolean(feed?.has_more)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMoreSections || loading || loadingMore || searchActive) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadFeed({ offset: sections.length, append: true })
        }
      },
      { rootMargin: '240px', threshold: 0.1 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMoreSections, loadFeed, loading, loadingMore, searchActive, sections.length])

  return (
    <BuyerShell
      headerStart={
        <BuyerLocationDisplay
          province={location.province}
          municipality={location.municipality}
          extraMunicipalityCount={Math.max(0, municipalityIds.length - 1)}
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
      <BuyerBannerCarousel provinceId={location.province.id} initialBannerId={preview?.bannerId} />

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

      {grouped && groupedLoading ? (
        <LoadingState message="Cargando productos…" className="lg:items-start lg:text-left" />
      ) : null}

      {grouped && !groupedLoading && !loadError && municipalityFeeds.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-brand-yellow/25 bg-brand-yellow/15 px-5 py-8 text-center">
          <img src="/images/welcome/papi.png" alt="" className="mb-3 h-36 w-36 object-contain" />
          <p className="font-display text-lg font-bold text-brand-green">Aún no hay productos aquí</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-brand-carmelita/90">
            No encontramos tiendas con productos disponibles en los municipios elegidos.
          </p>
        </div>
      ) : null}

      {grouped && !groupedLoading && !loadError && municipalityFeeds.length > 0 ? (
        <div className="flex flex-col gap-10">
          {municipalityFeeds.map((block) => (
            <section key={block.municipalityId}>
              <h2 className="mb-4 font-display text-xl font-bold text-brand-green">{block.municipalityName}</h2>
              <div className={buyerHomeSections}>
                {block.sections.map((section) => (
                  <BuyerCategoryProductRow
                    key={`${block.municipalityId}-${section.category_id}`}
                    section={section}
                    loadMore={(offset) =>
                      fetchMarketplaceCategoryProducts({
                        provinceId: location.province.id,
                        municipalityId: block.municipalityId,
                        additionalMunicipalityIds: [],
                        currency,
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
            </section>
          ))}
        </div>
      ) : null}

      {!grouped && !searchActive && loading ? (
        <LoadingState message="Cargando productos…" className="lg:items-start lg:text-left" />
      ) : null}

      {!grouped && !searchActive && !loading && loadError ? (
        <StatePanel
          variant="buyer"
          title={loadError.title}
          message={loadError.message}
          serviceError={loadError.isServiceError}
          onRetry={loadError.canRetry ? loadFeed : undefined}
          retrying={loading}
        />
      ) : null}

      {!grouped && !searchActive && !loading && !loadError && !hasProducts ? (
        <div className="flex flex-col items-center rounded-3xl border border-brand-yellow/25 bg-brand-yellow/15 px-5 py-8 text-center">
          <img src="/images/welcome/papi.png" alt="" className="mb-3 h-36 w-36 object-contain" />
          <p className="font-display text-lg font-bold text-brand-green">Aún no hay productos aquí</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-brand-carmelita/90">
            No encontramos tiendas con productos disponibles en {location.municipality.name}. Prueba con otra
            zona.
          </p>
        </div>
      ) : null}

      {!grouped && !searchActive && !loading && !loadError && hasProducts ? (
        <div className={buyerHomeSections}>
          {sections.map((section) => (
            <BuyerCategoryProductRow
              key={section.category_id}
              section={section}
              loadMore={(offset) =>
                fetchMarketplaceCategoryProducts({
                  provinceId: location.province.id,
                  municipalityId: location.municipality.id,
                  additionalMunicipalityIds: [],
                  currency,
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
          {hasMoreSections ? (
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
