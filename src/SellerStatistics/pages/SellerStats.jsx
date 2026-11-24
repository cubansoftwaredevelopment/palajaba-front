import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'

import SellerPageHeader from '../../seller/componentes/SellerPageHeader.jsx'
import AdminDateRangeControls from '../../admin/componentes/AdminDateRangeControls.jsx'
import SellerStatsPremiumPreview from '../../seller/componentes/SellerStatsPremiumPreview.jsx'
import { sellerHasStatistics } from '../../subscriptions/utils/constants.js'
import { PROFILE_PANEL_IDS } from '../../seller/utils/sellerProfileHub.js'
import { sellerAlertError, sellerPageWrap, sellerSectionGap } from '../../seller/componentes/sellerStyles.js'
import { getSellerToken } from '../../seller/utils/sellerAuth.js'
import { beginSectionRefresh, endSectionRefresh } from '../../session/sectionStore'
import { useRegisterSectionRefresh } from '../../session/useSectionRefresh'
import { useSectionSnapshot } from '../../session/useSectionSnapshot'
import { getUserFacingMessage } from '../../shared/utils/userFacingError.js'
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
import SellerHighViewsLowSales from '../componentes/SellerHighViewsLowSales.jsx'
import SellerProductConversionChart from '../componentes/SellerProductConversionChart.jsx'
import SellerRevenueCharts from '../componentes/SellerRevenueCharts.jsx'
import SellerSeriesChart from '../componentes/SellerSeriesChart.jsx'
import SellerStatsKpis from '../componentes/SellerStatsKpis.jsx'
import SellerTopSold from '../componentes/SellerTopSold.jsx'
import SellerViewsByZone from '../componentes/SellerViewsByZone.jsx'
import { granularityForRange, isoDate, rangeForPeriod } from '../utils'

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
  const navigate = useNavigate()
  const { profile: seller } = useOutletContext()
  const { snapshot, commit, skipInitialRef } = useSectionSnapshot('seller', 'stats')
  const [period, setPeriod] = useState(snapshot?.query?.period ?? 'daily')
  const [range, setRange] = useState(() => snapshot?.query?.range ?? rangeForPeriod('daily'))
  const [bundle, setBundle] = useState(snapshot?.data ?? EMPTY_BUNDLE)
  const [loading, setLoading] = useState(!snapshot)
  const [error, setError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)
  useRegisterSectionRefresh(() => setReloadTick((value) => value + 1))

  const windowQuery = useMemo(
    () => ({
      granularity: granularityForRange(period, range),
      start: isoDate(range.from),
      end: isoDate(range.to),
    }),
    [period, range],
  )

  useEffect(() => {
    if (!seller || !sellerHasStatistics(seller)) return undefined
    if (skipInitialRef.current) return undefined

    let cancelled = false
    const markRefresh = reloadTick > 0

    async function load() {
      if (markRefresh) beginSectionRefresh('seller', 'stats')
      else if (!snapshot?.data) setLoading(true)
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
          const next = {
            kpis,
            conversion,
            highViews,
            zone,
            traffic,
            productViews,
            orders,
            revenue,
            topSold,
          }
          setBundle(next)
          commit(next, { period, range })
        }
      } catch (err) {
        if (!cancelled) {
          setBundle(EMPTY_BUNDLE)
          setError(getUserFacingMessage(err, 'No pudimos cargar las estadísticas. Inténtalo de nuevo.'))
        }
      } finally {
        if (!cancelled) setLoading(false)
        if (markRefresh) endSectionRefresh('seller', 'stats')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [seller, windowQuery, reloadTick])

  if (!seller) return null

  const hasStatistics = sellerHasStatistics(seller)

  return (
    <section className={`${sellerPageWrap} ${sellerSectionGap}`}>
      <SellerPageHeader
        eyebrow="Estadísticas"
        title="Cómo va tu tienda"
        subtitle="Visitas, conversión, pedidos e ingresos del periodo que elijas."
      />

      {!hasStatistics ? (
        <SellerStatsPremiumPreview
          storeName={seller.store_name}
          onUpgradeClick={() =>
            navigate('/tienda/perfil', { state: { panel: PROFILE_PANEL_IDS.plan } })
          }
        />
      ) : null}

      {hasStatistics ? (
        <>
          <AdminDateRangeControls
            period={period}
            range={range}
            onPeriodChange={setPeriod}
            onRangeChange={(nextRange, nextPeriod) => {
              if (nextRange) {
                setPeriod(nextPeriod || 'custom')
                setRange(nextRange)
              }
              else {
                setPeriod('daily')
                setRange(rangeForPeriod('daily'))
              }
            }}
            applyPeriodToRange
          />

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
