import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import SellerPageHeader from '../../components/seller/SellerPageHeader'
import SellerStatsPremiumPreview from '../../components/seller/SellerStatsPremiumPreview'
import { sellerHasStatistics } from '../../constants/plan'
import { sellerAlertError, sellerPageWrap, sellerSectionGap } from '../../components/seller/sellerStyles'
import { getSellerToken } from '../../lib/sellerAuth'
import { getUserFacingMessage } from '../../lib/userFacingError'
import {
  fetchSellerDeliveredOrders,
  fetchSellerHighViewsLowSales,
  fetchSellerProductConversion,
  fetchSellerProductViews,
  fetchSellerRevenue,
  fetchSellerStatsKpis,
  fetchSellerTopSold,
  fetchSellerTraffic,
  fetchSellerViewsByZone,
} from '../api'
import SellerDateRangeControls from '../components/SellerDateRangeControls'
import SellerHighViewsLowSales from '../components/SellerHighViewsLowSales'
import SellerProductConversionChart from '../components/SellerProductConversionChart'
import SellerRevenueCharts from '../components/SellerRevenueCharts'
import SellerSeriesChart from '../components/SellerSeriesChart'
import SellerStatsKpis from '../components/SellerStatsKpis'
import SellerTopSold from '../components/SellerTopSold'
import SellerViewsByZone from '../components/SellerViewsByZone'
import { isoDate, rangeForPeriod } from '../utils'

const EMPTY_BUNDLE = {
  kpis: null,
  conversion: null,
  highViews: null,
  zone: null,
  traffic: null,
  productViews: null,
  orders: null,
  revenue: null,
  topSold: null,
}

export default function SellerStats() {
  const { profile: seller } = useOutletContext()
  const [period, setPeriod] = useState('monthly')
  const [range, setRange] = useState(() => rangeForPeriod('monthly'))
  const [bundle, setBundle] = useState(EMPTY_BUNDLE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const windowQuery = useMemo(
    () => ({
      granularity: period,
      start: isoDate(range.from),
      end: isoDate(range.to),
    }),
    [period, range],
  )

  function handlePeriodChange(nextPeriod) {
    setPeriod(nextPeriod)
    setRange(rangeForPeriod(nextPeriod))
  }

  useEffect(() => {
    if (!seller || !sellerHasStatistics(seller)) return undefined

    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const token = getSellerToken()
        const [
          kpis,
          conversion,
          highViews,
          zone,
          traffic,
          productViews,
          orders,
          revenue,
          topSold,
        ] = await Promise.all([
          fetchSellerStatsKpis(token, windowQuery),
          fetchSellerProductConversion(token, windowQuery),
          fetchSellerHighViewsLowSales(token, windowQuery),
          fetchSellerViewsByZone(token, windowQuery),
          fetchSellerTraffic(token, windowQuery),
          fetchSellerProductViews(token, windowQuery),
          fetchSellerDeliveredOrders(token, windowQuery),
          fetchSellerRevenue(token, windowQuery),
          fetchSellerTopSold(token, windowQuery),
        ])
        if (!cancelled) {
          setBundle({
            kpis,
            conversion,
            highViews,
            zone,
            traffic,
            productViews,
            orders,
            revenue,
            topSold,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setBundle(EMPTY_BUNDLE)
          setError(getUserFacingMessage(err, 'No pudimos cargar las estadísticas. Inténtalo de nuevo.'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [seller, windowQuery])

  if (!seller) return null

  const hasStatistics = sellerHasStatistics(seller)

  return (
    <section className={`animate-fade-in ${sellerPageWrap} ${sellerSectionGap}`}>
      <SellerPageHeader
        eyebrow="Estadísticas"
        title="Cómo va tu tienda"
        subtitle="Visitas, conversión, pedidos e ingresos del periodo que elijas."
      />

      {!hasStatistics ? <SellerStatsPremiumPreview storeName={seller.store_name} /> : null}

      {hasStatistics ? (
        <>
          <SellerDateRangeControls period={period} range={range} onPeriodChange={handlePeriodChange} />

          {error ? (
            <p className={sellerAlertError} role="alert">
              {error}
            </p>
          ) : null}

          <SellerStatsKpis kpis={bundle.kpis} loading={loading} />

          <SellerProductConversionChart loading={loading} error="" data={bundle.conversion} />
          <SellerHighViewsLowSales loading={loading} error="" data={bundle.highViews} />
          <SellerSeriesChart
            title="Tráfico del sitio"
            hint="Visitas al perfil por día."
            loading={loading}
            error=""
            chart={bundle.traffic}
            emptyMessage="Aún no hay visitas al perfil en este periodo."
            valueLabel="visitas"
            chartId="traffic"
          />
          <SellerSeriesChart
            title="Vistas de productos"
            hint="Eventos de vista de tus productos."
            loading={loading}
            error=""
            chart={bundle.productViews}
            emptyMessage="Aún no hay vistas de productos en este periodo."
            kind="bar"
            valueLabel="vistas"
            color="#c9970a"
            chartId="product-views"
          />
          <SellerSeriesChart
            title="Pedidos entregados"
            hint="Pedidos completados en el periodo."
            loading={loading}
            error=""
            chart={bundle.orders}
            emptyMessage="Aún no hay pedidos entregados en este periodo."
            kind="bar"
            valueLabel="pedidos"
            color="#7b4c38"
            chartId="orders"
          />
          <SellerRevenueCharts loading={loading} error="" chart={bundle.revenue} />
          <SellerViewsByZone loading={loading} error="" data={bundle.zone} />
          <SellerTopSold loading={loading} error="" data={bundle.topSold} />
        </>
      ) : null}
    </section>
  )
}
