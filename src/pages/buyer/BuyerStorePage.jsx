import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import CatalogThemeScope from '../../components/catalog/CatalogThemeScope'
import BuyerCategoryProductRow from '../../components/buyer/BuyerCategoryProductRow'
import BuyerCurrencySelector from '../../components/buyer/BuyerCurrencySelector'
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
  fetchMarketplaceStore,
  fetchMarketplaceStoreCatalog,
  fetchMarketplaceStoreCategoryProducts,
} from '../../lib/api'
import { getBuyerLocation, hasCompleteBuyerLocation } from '../../lib/buyerLocation'
import { normalizeCatalogTheme } from '../../lib/catalogThemes'
import { recordStoreProfileView } from '../../lib/storeProfileView'
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
  const { storeSlug } = useParams()
  const buyerLocation = hasCompleteBuyerLocation() ? getBuyerLocation() : null
  const [fallbackLocation, setFallbackLocation] = useState(null)
  const [resolvingLocation, setResolvingLocation] = useState(!buyerLocation)
  const [locationError, setLocationError] = useState(false)

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

  if (resolvingLocation) {
    return (
      <BuyerShell backTo="/comprar" backLabel={MARKETPLACE_LABEL}>
        <LoadingState message="Cargando tienda…" className="lg:items-start lg:text-left" />
      </BuyerShell>
    )
  }

  const effectiveLocation = buyerLocation ?? fallbackLocation
  if (!effectiveLocation) {
    if (locationError) {
      return <Navigate to="/comprar/provincia" replace />
    }
    return <Navigate to="/comprar/provincia" replace />
  }

  return <BuyerStorePageContent location={effectiveLocation} />
}

function BuyerStorePageContent({ location }) {
  const { storeSlug } = useParams()
  const [catalog, setCatalog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const loadCatalog = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    try {
      const data = await fetchMarketplaceStoreCatalog({
        storeSlug,
        provinceId: location.province.id,
        municipalityId: location.municipality.id,
        limitPerCategory: PAGE_SIZE,
      })
      setCatalog(data)
      recordStoreProfileView(storeSlug, {
        provinceId: location.province.id,
        municipalityId: location.municipality.id,
      })
    } catch (err) {
      setLoadError(
        resolveUserFacingError(err, {
          contextTitle: 'No se pudo abrir la tienda',
          fallbackMessage: 'No pudimos cargar esta tienda. Inténtalo de nuevo.',
        }),
      )
      setCatalog(null)
    } finally {
      setLoading(false)
    }
  }, [location.municipality.id, location.province.id, storeSlug])

  useEffect(() => {
    loadCatalog()
  }, [loadCatalog])

  const createLoadMore = useCallback(
    (section) => async (offset) => {
      const data = await fetchMarketplaceStoreCategoryProducts({
        storeSlug,
        localCategoryId: section.category_id,
        provinceId: location.province.id,
        municipalityId: location.municipality.id,
        limit: PAGE_SIZE,
        offset,
      })
      return {
        products: data.products,
        has_more: data.has_more,
      }
    },
    [location.municipality.id, location.province.id, storeSlug],
  )

  const sections = catalog?.sections ?? []
  const hasProducts = (catalog?.total_products ?? 0) > 0
  const catalogTheme = normalizeCatalogTheme(catalog?.catalog_theme)

  return (
    <CatalogThemeScope theme={catalogTheme} className="flex min-h-dvh flex-col">
      <BuyerShell backTo="/comprar" backLabel={MARKETPLACE_LABEL} headerEnd={<BuyerCurrencySelector />}>
      {loading ? (
        <LoadingState message="Cargando tienda…" className="lg:items-start lg:text-left" />
      ) : null}

      {!loading && loadError ? (
        loadError.isNotFound ? (
          <DeadState
            variant="panel"
            title="Tienda no disponible"
            message={
              loadError.message ||
              'Esta tienda no existe o ya no está activa en Pa\' La Jaba.'
            }
          >
            <Link to="/comprar">
              <Button variant="ghost" className="w-full sm:w-auto">
                Volver al {MARKETPLACE_LABEL.toLowerCase()}
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
              <Link to="/comprar">
                <Button variant="ghost" className="w-full sm:w-auto">
                  Volver al {MARKETPLACE_LABEL.toLowerCase()}
                </Button>
              </Link>
            </div>
          </StatePanel>
        )
      ) : null}

      {!loading && !loadError && catalog ? (
        <div className={buyerHomeSections}>
          <BuyerStoreProfileHeader catalog={catalog} />

          {!hasProducts ? (
            <div className="rounded-3xl border border-brand-yellow/25 bg-brand-yellow/15 px-5 py-6 text-center lg:text-left">
              <p className="font-display text-lg font-bold text-brand-green">Sin productos disponibles</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-carmelita/90">
                Esta tienda no tiene productos publicados en este momento.
              </p>
            </div>
          ) : (
            sections.map((section) => (
              <BuyerCategoryProductRow
                key={section.category_id}
                section={section}
                loadMore={createLoadMore(section)}
              />
            ))
          )}

          <BuyerCatalogPoweredFooter />
        </div>
      ) : null}
      </BuyerShell>
    </CatalogThemeScope>
  )
}
