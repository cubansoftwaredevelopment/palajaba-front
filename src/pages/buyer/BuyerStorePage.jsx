import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import BuyerCategoryProductRow from '../../components/buyer/BuyerCategoryProductRow'
import BuyerCurrencySelector from '../../components/buyer/BuyerCurrencySelector'
import BuyerShell from '../../components/buyer/BuyerShell'
import BuyerStoreProfileHeader from '../../components/buyer/BuyerStoreProfileHeader'
import StatePanel from '../../components/ui/StatePanel'
import LoadingState from '../../components/ui/LoadingState'
import DeadState from '../../components/ui/DeadState'
import { MARKETPLACE_LABEL } from '../../constants/branding'
import { buyerHomeSections } from '../../components/buyer/buyerStyles'
import Button from '../../components/Button'
import {
  fetchMarketplaceStoreCatalog,
  fetchMarketplaceStoreCategoryProducts,
} from '../../lib/api'
import { getBuyerLocation, hasCompleteBuyerLocation } from '../../lib/buyerLocation'
import { recordStoreProfileView } from '../../lib/storeProfileView'
import { resolveUserFacingError } from '../../lib/userFacingError'

const PAGE_SIZE = 20

export default function BuyerStorePage() {
  if (!hasCompleteBuyerLocation()) {
    return <Navigate to="/comprar/provincia" replace />
  }

  return <BuyerStorePageContent />
}

function BuyerStorePageContent() {
  const { storeSlug } = useParams()
  const location = getBuyerLocation()
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

  return (
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
        </div>
      ) : null}
    </BuyerShell>
  )
}

