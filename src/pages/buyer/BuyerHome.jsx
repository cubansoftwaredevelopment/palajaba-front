import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import BuyerCategoryProductRow from '../../components/buyer/BuyerCategoryProductRow'
import BuyerCurrencySelector from '../../components/buyer/BuyerCurrencySelector'
import BuyerLocationDisplay from '../../components/buyer/BuyerLocationDisplay'
import BuyerShell from '../../components/buyer/BuyerShell'
import { buyerHomeSections } from '../../components/buyer/buyerStyles'
import Button from '../../components/Button'
import { fetchMarketplaceFeed } from '../../lib/api'
import { getBuyerLocation, hasCompleteBuyerLocation } from '../../lib/buyerLocation'

const PAGE_SIZE = 20

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
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadFeed() {
      setLoading(true)
      setError('')

      try {
        const data = await fetchMarketplaceFeed({
          provinceId: location.province.id,
          municipalityId: location.municipality.id,
          limitPerCategory: PAGE_SIZE,
        })
        if (!cancelled) {
          setFeed(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'No se pudieron cargar los productos.')
          setFeed(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadFeed()
    return () => {
      cancelled = true
    }
  }, [location.province.id, location.municipality.id])

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
      {loading ? (
        <p className="text-center text-sm text-brand-carmelita/80 lg:text-left">Cargando productos…</p>
      ) : null}

      {!loading && error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-6 text-center lg:text-left">
          <p className="font-display text-base font-bold text-brand-green">No se pudo cargar el catálogo</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-carmelita/90">{error}</p>
        </div>
      ) : null}

      {!loading && !error && !hasProducts ? (
        <div className="rounded-3xl border border-brand-yellow/25 bg-brand-yellow/15 px-5 py-6 text-center lg:text-left">
          <p className="font-display text-lg font-bold text-brand-green">Aún no hay productos aquí</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-carmelita/90">
            No encontramos tiendas con productos disponibles en {location.municipality.name}. Prueba con otra
            zona.
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

      {!loading && !error && hasProducts ? (
        <div className={buyerHomeSections}>
          {sections.map((section) => (
            <BuyerCategoryProductRow
              key={section.category_id}
              section={section}
              location={location}
            />
          ))}
        </div>
      ) : null}
    </BuyerShell>
  )
}
