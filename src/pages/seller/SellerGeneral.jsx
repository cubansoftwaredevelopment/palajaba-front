import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import SellerPageHeader from '../../components/seller/SellerPageHeader'
import SellerProductsSoldSection from '../../components/seller/SellerProductsSoldSection'
import SellerRevenueSection from '../../components/seller/SellerRevenueSection'
import SellerSection from '../../components/seller/SellerSection'
import SellerStatGrid from '../../components/seller/SellerStatGrid'
import SellerStatsMonthNav from '../../components/seller/SellerStatsMonthNav'
import SellerStatsPremiumPreview from '../../components/seller/SellerStatsPremiumPreview'
import SellerSubscriptionAlert from '../../components/seller/SellerSubscriptionAlert'
import SellerTopProductsSection from '../../components/seller/SellerTopProductsSection'
import { sellerHasStatistics } from '../../constants/plan'
import {
  sellerAlertError,
  sellerPageWrap,
  sellerSectionGap,
} from '../../components/seller/sellerStyles'
import { fetchSellerProductsSoldChart, fetchSellerRevenueChart, fetchSellerStatsSummary, fetchSellerTopProducts } from '../../lib/api'
import { formatDateTime } from '../../lib/dates'
import { resolveMediaUrl } from '../../lib/media'
import { getSellerToken } from '../../lib/sellerAuth'
import { getUserFacingMessage } from '../../lib/userFacingError'

function formatMonthLabel(year, month) {
  const date = new Date(year, month - 1, 1)
  return new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(date)
}

export default function SellerGeneral() {
  const { profile: seller } = useOutletContext()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [revenueGranularity, setRevenueGranularity] = useState('daily')
  const [productsSoldGranularity, setProductsSoldGranularity] = useState('daily')
  const [revenueChart, setRevenueChart] = useState(null)
  const [revenueLoading, setRevenueLoading] = useState(true)
  const [revenueError, setRevenueError] = useState('')
  const [productsSoldChart, setProductsSoldChart] = useState(null)
  const [productsSoldLoading, setProductsSoldLoading] = useState(true)
  const [productsSoldError, setProductsSoldError] = useState('')
  const [topProducts, setTopProducts] = useState(null)
  const [topProductsLoading, setTopProductsLoading] = useState(true)
  const [topProductsError, setTopProductsError] = useState('')

  useEffect(() => {
    if (!seller || !sellerHasStatistics(seller)) return undefined

    let cancelled = false

    async function loadStats() {
      setLoading(true)
      setError('')
      try {
        const token = getSellerToken()
        const params =
          selectedYear != null && selectedMonth != null
            ? { year: selectedYear, month: selectedMonth }
            : {}
        const data = await fetchSellerStatsSummary(token, params)
        if (!cancelled) {
          setStats(data)
          if (selectedYear == null || selectedMonth == null) {
            setSelectedYear(data.year)
            setSelectedMonth(data.month)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(getUserFacingMessage(err, 'No pudimos cargar las estadísticas. Inténtalo de nuevo.'))
          setStats(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadStats()
    return () => {
      cancelled = true
    }
  }, [seller, selectedYear, selectedMonth])

  useEffect(() => {
    if (!seller || !sellerHasStatistics(seller)) return undefined
    if (selectedYear == null || selectedMonth == null) return undefined

    let cancelled = false

    async function loadRevenueChart() {
      setRevenueLoading(true)
      setRevenueError('')
      try {
        const token = getSellerToken()
        const data = await fetchSellerRevenueChart(token, {
          granularity: revenueGranularity,
          year: revenueGranularity === 'monthly' ? undefined : selectedYear,
          month: revenueGranularity === 'monthly' ? undefined : selectedMonth,
        })
        if (!cancelled) setRevenueChart(data)
      } catch (err) {
        if (!cancelled) {
          setRevenueChart(null)
          setRevenueError(getUserFacingMessage(err, 'No pudimos cargar el gráfico de ingresos.'))
        }
      } finally {
        if (!cancelled) setRevenueLoading(false)
      }
    }

    loadRevenueChart()
    return () => {
      cancelled = true
    }
  }, [seller, selectedYear, selectedMonth, revenueGranularity])

  useEffect(() => {
    if (!seller || !sellerHasStatistics(seller)) return undefined
    if (selectedYear == null || selectedMonth == null) return undefined

    let cancelled = false

    async function loadProductsSoldChart() {
      setProductsSoldLoading(true)
      setProductsSoldError('')
      try {
        const token = getSellerToken()
        const data = await fetchSellerProductsSoldChart(token, {
          granularity: productsSoldGranularity,
          year: productsSoldGranularity === 'monthly' ? undefined : selectedYear,
          month: productsSoldGranularity === 'monthly' ? undefined : selectedMonth,
        })
        if (!cancelled) setProductsSoldChart(data)
      } catch (err) {
        if (!cancelled) {
          setProductsSoldChart(null)
          setProductsSoldError(getUserFacingMessage(err, 'No pudimos cargar el gráfico de productos vendidos.'))
        }
      } finally {
        if (!cancelled) setProductsSoldLoading(false)
      }
    }

    loadProductsSoldChart()
    return () => {
      cancelled = true
    }
  }, [seller, selectedYear, selectedMonth, productsSoldGranularity])

  useEffect(() => {
    if (!seller || !sellerHasStatistics(seller)) return undefined

    let cancelled = false

    async function loadTopProducts() {
      setTopProductsLoading(true)
      setTopProductsError('')
      try {
        const token = getSellerToken()
        const data = await fetchSellerTopProducts(token)
        if (!cancelled) setTopProducts(data)
      } catch (err) {
        if (!cancelled) {
          setTopProducts(null)
          setTopProductsError(getUserFacingMessage(err, 'No pudimos cargar los productos destacados.'))
        }
      } finally {
        if (!cancelled) setTopProductsLoading(false)
      }
    }

    loadTopProducts()
    return () => {
      cancelled = true
    }
  }, [seller])

  useEffect(() => {
    if (!stats?.period) return
    if (revenueGranularity === 'monthly' && stats.period.months_available < 2) {
      setRevenueGranularity('daily')
    }
    if (productsSoldGranularity === 'monthly' && stats.period.months_available < 2) {
      setProductsSoldGranularity('daily')
    }
  }, [revenueGranularity, productsSoldGranularity, stats?.period])

  if (!seller) return null

  const hasStatistics = sellerHasStatistics(seller)
  const photoSrc = resolveMediaUrl(seller.profile_photo_url)
  const monthLabel =
    selectedYear && selectedMonth ? formatMonthLabel(selectedYear, selectedMonth) : null

  function handleMonthChange({ year, month }) {
    setSelectedYear(year)
    setSelectedMonth(month)
  }

  return (
    <section className={`animate-fade-in ${sellerPageWrap} ${sellerSectionGap}`}>
      <SellerPageHeader
        eyebrow="General"
        title="Estadísticas de tu tienda"
        subtitle="Resumen de visitas, ventas e ingresos de tu perfil."
      />

      <SellerSubscriptionAlert profile={seller} />

      {!hasStatistics ? (
        <SellerStatsPremiumPreview storeName={seller.store_name} />
      ) : null}

      <SellerSection label="Tu negocio">
        <div className="flex items-center gap-3">
          {photoSrc ? (
            <img
              src={photoSrc}
              alt=""
              className="h-14 w-14 shrink-0 rounded-full border-2 border-brand-green/12 object-cover shadow-[0_2px_8px_rgba(89,128,44,0.12)]"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-yellow/15 text-[0.6rem] text-brand-carmelita">
              Sin foto
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold text-brand-green">
              {seller.store_name}
            </p>
            <p className="text-xs text-brand-carmelita/85">{seller.phone}</p>
            {seller.subscription_ends_at && (
              <p className="mt-1.5 text-[0.65rem] text-brand-green/90">
                Suscripción hasta {formatDateTime(seller.subscription_ends_at)}
              </p>
            )}
          </div>
        </div>
      </SellerSection>

      {hasStatistics ? (
        <>
          <SellerTopProductsSection
            loading={topProductsLoading}
            error={topProductsError}
            data={topProducts}
          />

          {stats?.period && selectedYear && selectedMonth ? (
            <SellerStatsMonthNav
              period={stats.period}
              year={selectedYear}
              month={selectedMonth}
              onChange={handleMonthChange}
            />
          ) : null}

          <SellerSection
            label={monthLabel ? `Resumen de ${monthLabel}` : 'Resumen del mes'}
            hint="Visitas y pedidos confirmados del mes. Productos: activos ahora mismo."
          >
            {error && (
              <p className={`mb-3 ${sellerAlertError}`} role="alert">
                {error}
              </p>
            )}
            <SellerStatGrid stats={stats} loading={loading} />
          </SellerSection>

          <SellerRevenueSection
            granularity={revenueGranularity}
            onGranularityChange={setRevenueGranularity}
            monthsAvailable={
              stats?.period?.months_available ?? revenueChart?.months_available ?? 1
            }
            loading={revenueLoading}
            error={revenueError}
            chart={revenueChart}
          />

          <SellerProductsSoldSection
            granularity={productsSoldGranularity}
            onGranularityChange={setProductsSoldGranularity}
            monthsAvailable={
              stats?.period?.months_available ?? productsSoldChart?.months_available ?? 1
            }
            loading={productsSoldLoading}
            error={productsSoldError}
            chart={productsSoldChart}
          />
        </>
      ) : null}
    </section>
  )
}
