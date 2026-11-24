import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useNavigate, useOutletContext } from 'react-router-dom'

import PhotoLightbox from '../../shared/componentes/PhotoLightbox.jsx'
import SellerPageHeader from '../componentes/SellerPageHeader.jsx'
import SellerProductsSoldSection from '../componentes/SellerProductsSoldSection.jsx'
import SellerRevenueSection from '../componentes/SellerRevenueSection.jsx'
import SellerSection from '../componentes/SellerSection.jsx'
import SellerStatGrid from '../componentes/SellerStatGrid.jsx'
import SellerStatsMonthNav from '../componentes/SellerStatsMonthNav.jsx'
import { monthPageShift } from '../../motion/presets'
import SellerStatsPremiumPreview from '../componentes/SellerStatsPremiumPreview.jsx'
import SellerSubscriptionAlert from '../componentes/SellerSubscriptionAlert.jsx'
import SellerTopProductsSection from '../componentes/SellerTopProductsSection.jsx'
import { canUpgradePlan, sellerHasStatistics } from '../../subscriptions/utils/constants.js'
import { PROFILE_PANEL_IDS } from '../utils/sellerProfileHub.js'
import {
  sellerAlertError,
  sellerFocusRing,
  sellerPageWrap,
  sellerSectionGap,
} from '../componentes/sellerStyles.js'
import { fetchSellerProductsSoldChart, fetchSellerRevenueChart, fetchSellerStatsSummary, fetchSellerTopProducts } from '../../seller/api.js'
import { formatDateTime } from '../../shared/utils/dates.js'
import { resolveMediaUrl } from '../../shared/utils/media.js'
import { getSellerToken } from '../utils/sellerAuth.js'
import { useRegisterSectionRefresh } from '../../session/useSectionRefresh'
import { beginSectionRefresh, endSectionRefresh } from '../../session/sectionStore'
import { useSectionSnapshot } from '../../session/useSectionSnapshot'
import { getUserFacingMessage } from '../../shared/utils/userFacingError.js'

function formatMonthLabel(year, month) {
  const date = new Date(year, month - 1, 1)
  return new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(date)
}

export default function SellerGeneral() {
  const navigate = useNavigate()
  const { profile: seller } = useOutletContext()
  const { snapshot, commit, skipInitialRef } = useSectionSnapshot('seller', 'general')
  const cached = snapshot?.data
  const query = snapshot?.query
  const [reloadTick, setReloadTick] = useState(0)
  const appliedPeriodRef = useRef(false)
  const [stats, setStats] = useState(cached?.stats ?? null)
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState('')
  const [selectedYear, setSelectedYear] = useState(query?.selectedYear ?? null)
  const [selectedMonth, setSelectedMonth] = useState(query?.selectedMonth ?? null)
  const [revenueGranularity, setRevenueGranularity] = useState(query?.revenueGranularity ?? 'daily')
  const [productsSoldGranularity, setProductsSoldGranularity] = useState(query?.productsSoldGranularity ?? 'daily')
  const [revenueChart, setRevenueChart] = useState(cached?.revenueChart ?? null)
  const [revenueLoading, setRevenueLoading] = useState(!cached)
  const [revenueError, setRevenueError] = useState('')
  const [productsSoldChart, setProductsSoldChart] = useState(cached?.productsSoldChart ?? null)
  const [productsSoldLoading, setProductsSoldLoading] = useState(!cached)
  const [productsSoldError, setProductsSoldError] = useState('')
  const [topProducts, setTopProducts] = useState(cached?.topProducts ?? null)
  const [topProductsLoading, setTopProductsLoading] = useState(!cached)
  const [topProductsError, setTopProductsError] = useState('')
  const [photoOpen, setPhotoOpen] = useState(false)
  const [monthDirection, setMonthDirection] = useState(1)
  const reducedMotion = useReducedMotion()

  useRegisterSectionRefresh(() => setReloadTick((value) => value + 1))

  useEffect(() => {
    if (!seller || !sellerHasStatistics(seller)) return undefined
    if (skipInitialRef.current) return undefined
    if (appliedPeriodRef.current) {
      appliedPeriodRef.current = false
      return undefined
    }

    let cancelled = false
    const markRefresh = reloadTick > 0

    async function loadStats() {
      if (markRefresh) beginSectionRefresh('seller', 'general')
      else if (!stats) setLoading(true)
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
            appliedPeriodRef.current = true
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
        if (markRefresh) endSectionRefresh('seller', 'general')
      }
    }

    loadStats()
    return () => {
      cancelled = true
    }
  }, [seller, selectedYear, selectedMonth, reloadTick])

  useEffect(() => {
    if (!seller || !sellerHasStatistics(seller)) return undefined
    if (selectedYear == null || selectedMonth == null) return undefined
    if (skipInitialRef.current) return undefined

    let cancelled = false
    const markRefresh = reloadTick > 0

    async function loadRevenueChart() {
      if (markRefresh) beginSectionRefresh('seller', 'general')
      else setRevenueLoading(true)
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
        if (markRefresh) endSectionRefresh('seller', 'general')
      }
    }

    loadRevenueChart()
    return () => {
      cancelled = true
    }
  }, [seller, selectedYear, selectedMonth, revenueGranularity, reloadTick])

  useEffect(() => {
    if (!seller || !sellerHasStatistics(seller)) return undefined
    if (selectedYear == null || selectedMonth == null) return undefined
    if (skipInitialRef.current) return undefined

    let cancelled = false
    const markRefresh = reloadTick > 0

    async function loadProductsSoldChart() {
      if (markRefresh) beginSectionRefresh('seller', 'general')
      else setProductsSoldLoading(true)
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
        if (markRefresh) endSectionRefresh('seller', 'general')
      }
    }

    loadProductsSoldChart()
    return () => {
      cancelled = true
    }
  }, [seller, selectedYear, selectedMonth, productsSoldGranularity, reloadTick])

  useEffect(() => {
    if (!seller || !sellerHasStatistics(seller)) return undefined
    if (skipInitialRef.current) return undefined

    let cancelled = false
    const markRefresh = reloadTick > 0

    async function loadTopProducts() {
      if (markRefresh) beginSectionRefresh('seller', 'general')
      else setTopProductsLoading(true)
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
        if (markRefresh) endSectionRefresh('seller', 'general')
      }
    }

    loadTopProducts()
    return () => {
      cancelled = true
    }
  }, [seller, reloadTick])

  useEffect(() => {
    if (!stats) return
    commit(
      { stats, revenueChart, productsSoldChart, topProducts },
      { selectedYear, selectedMonth, revenueGranularity, productsSoldGranularity },
    )
  }, [stats, revenueChart, productsSoldChart, topProducts, selectedYear, selectedMonth, revenueGranularity, productsSoldGranularity, commit])

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
    const currentIndex = (selectedYear ?? year) * 12 + (selectedMonth ?? month)
    const nextIndex = year * 12 + month
    setMonthDirection(nextIndex >= currentIndex ? 1 : -1)
    setSelectedYear(year)
    setSelectedMonth(month)
  }

  const monthShift = monthPageShift(monthDirection, reducedMotion)

  return (
    <section className={`${sellerPageWrap} ${sellerSectionGap}`}>
      <SellerPageHeader eyebrow="General" />

      <SellerSubscriptionAlert profile={seller} />

      {!hasStatistics ? (
        <SellerStatsPremiumPreview
          storeName={seller.store_name}
          onUpgradeClick={() =>
            navigate('/tienda/perfil', { state: { panel: PROFILE_PANEL_IDS.plan } })
          }
        />
      ) : null}

      <SellerSection label="Tu negocio">
        <div className="flex items-center gap-3">
          {photoSrc ? (
            <button
              type="button"
              onClick={() => setPhotoOpen(true)}
              className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-brand-green/12 shadow-[0_2px_8px_rgba(89,128,44,0.12)] touch-manipulation"
              aria-label="Ver foto de perfil"
            >
              <img src={photoSrc} alt="" className="h-full w-full object-cover" />
            </button>
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
                {seller.is_trial ? 'Plan Prueba hasta' : 'Suscripción hasta'}{' '}
                {formatDateTime(seller.subscription_ends_at)}
              </p>
            )}
            {canUpgradePlan(seller) ? (
              <button
                type="button"
                onClick={() =>
                  navigate('/tienda/perfil', { state: { panel: PROFILE_PANEL_IDS.plan } })
                }
                className={`mt-2 inline-flex min-h-8 items-center rounded-full bg-brand-green px-3 py-1 text-[0.7rem] font-semibold text-brand-white touch-manipulation active:scale-[0.98] ${sellerFocusRing}`}
              >
                Mejorar plan
              </button>
            ) : null}
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
            <>
              <SellerStatsMonthNav
                period={stats.period}
                year={selectedYear}
                month={selectedMonth}
                direction={monthDirection}
                onChange={handleMonthChange}
              />
              <div className="relative overflow-x-clip">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={`${selectedYear}-${selectedMonth}`}
                    className={`${sellerSectionGap} ${reducedMotion ? '' : 'screen-step'}`}
                    {...monthShift}
                  >
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
                  </motion.div>
                </AnimatePresence>
              </div>
            </>
          ) : (
            <SellerSection
              label="Resumen del mes"
              hint="Visitas y pedidos confirmados del mes. Productos: activos ahora mismo."
            >
              {error && (
                <p className={`mb-3 ${sellerAlertError}`} role="alert">
                  {error}
                </p>
              )}
              <SellerStatGrid stats={stats} loading={loading} />
            </SellerSection>
          )}
        </>
      ) : null}

      {photoOpen && seller.profile_photo_url ? (
        <PhotoLightbox
          images={[{ id: 'profile', image_url: seller.profile_photo_url }]}
          index={0}
          onIndex={() => {}}
          onClose={() => setPhotoOpen(false)}
          label="Foto de perfil"
        />
      ) : null}
    </section>
  )
}
