import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import BuyerCategoryProductRow from '../../components/buyer/BuyerCategoryProductRow'
import BuyerCurrencySelector from '../../components/buyer/BuyerCurrencySelector'
import BuyerShell from '../../components/buyer/BuyerShell'
import BuyerStoreProfileHeader from '../../components/buyer/BuyerStoreProfileHeader'
import { buyerHomeSections } from '../../components/buyer/buyerStyles'
import Button from '../../components/Button'
import {
  fetchMarketplaceStoreCatalog,
  fetchMarketplaceStoreCategoryProducts,
} from '../../lib/api'
import { getBuyerLocation, hasCompleteBuyerLocation } from '../../lib/buyerLocation'

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
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadCatalog() {
      setLoading(true)
      setError('')

      try {
        const data = await fetchMarketplaceStoreCatalog({
          storeSlug,
          provinceId: location.province.id,
          municipalityId: location.municipality.id,
          limitPerCategory: PAGE_SIZE,
        })
        if (!cancelled) {
          setCatalog(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'No se pudo cargar la tienda.')
          setCatalog(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadCatalog()
    return () => {
      cancelled = true
    }
  }, [location.municipality.id, location.province.id, storeSlug])

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
    <BuyerShell backTo="/comprar" backLabel="Catálogo" headerEnd={<BuyerCurrencySelector />}>
      {loading ? (
        <p className="text-center text-sm text-brand-carmelita/80 lg:text-left">Cargando tienda…</p>
      ) : null}

      {!loading && error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-6 text-center lg:text-left">
          <p className="font-display text-base font-bold text-brand-green">No se pudo abrir la tienda</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-carmelita/90">{error}</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center lg:justify-start">
            <Link to="/comprar">
              <Button variant="secondary" className="w-full sm:w-auto">
                Volver al catálogo
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      {!loading && !error && catalog ? (
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
