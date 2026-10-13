import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { clearAdminToken, getAdminToken } from '../../lib/adminAuth'
import { getUserFacingMessage, isSessionError } from '../../lib/userFacingError'
import {
  fetchAdminBusinessesByProvince,
  fetchAdminDeliveryMap,
  fetchAdminDeviceStats,
  fetchAdminOrderSalesChart,
  fetchAdminOrdersChart,
  fetchAdminOrdersLocations,
  fetchAdminOrdersTopBusinesses,
  fetchAdminRevenueChart,
  fetchAdminTopPopularProducts,
  fetchAdminTopSoldProducts,
  fetchAdminStats,
  fetchAdminTrafficChart,
  fetchAdminTrafficLocations,
  fetchAdminTrafficPatterns,
} from '../api'
import { POLL_MS, buildChartQuery, buildMonthQuery, isMultiDayRange, periodLabel } from '../utils'

const AdminStatisticsContext = createContext(null)

export function AdminStatisticsProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [granularity, setGranularity] = useState('daily')
  const [range, setRange] = useState(null)
  const [stats, setStats] = useState(null)
  const [provinceStats, setProvinceStats] = useState(null)
  const [revenueChart, setRevenueChart] = useState(null)
  const [trafficChart, setTrafficChart] = useState(null)
  const [trafficLocations, setTrafficLocations] = useState(null)
  const [trafficPatterns, setTrafficPatterns] = useState(null)
  const [ordersChart, setOrdersChart] = useState(null)
  const [salesChart, setSalesChart] = useState(null)
  const [topBusinesses, setTopBusinesses] = useState(null)
  const [topSoldProducts, setTopSoldProducts] = useState(null)
  const [topPopularProducts, setTopPopularProducts] = useState(null)
  const [ordersLocations, setOrdersLocations] = useState(null)
  const [deliveryMap, setDeliveryMap] = useState(null)
  const [deviceStats, setDeviceStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chartsLoading, setChartsLoading] = useState(true)
  const [error, setError] = useState('')
  const [revenueError, setRevenueError] = useState('')
  const [trafficError, setTrafficError] = useState('')
  const [locationsError, setLocationsError] = useState('')
  const [patternsError, setPatternsError] = useState('')
  const [ordersError, setOrdersError] = useState('')
  const [salesError, setSalesError] = useState('')
  const [topBusinessesError, setTopBusinessesError] = useState('')
  const [topSoldError, setTopSoldError] = useState('')
  const [topPopularError, setTopPopularError] = useState('')
  const [ordersLocationsError, setOrdersLocationsError] = useState('')
  const [deliveryMapError, setDeliveryMapError] = useState('')
  const [devicesError, setDevicesError] = useState('')
  const [pulling, setPulling] = useState(false)
  const pullSeq = useRef(0)

  const handleSessionError = useCallback(
    (err) => {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return true
      }
      return false
    },
    [navigate],
  )

  const chartQuery = useMemo(() => buildChartQuery(granularity, range), [granularity, range])

  const loadAll = useCallback(
    async ({ silent = false } = {}) => {
      const pullId = pullSeq.current + 1
      pullSeq.current = pullId
      setPulling(true)
      if (!silent) {
        setError('')
        setRevenueError('')
        setTrafficError('')
        setLocationsError('')
        setPatternsError('')
        setOrdersError('')
        setSalesError('')
        setTopBusinessesError('')
        setTopSoldError('')
        setTopPopularError('')
        setOrdersLocationsError('')
        setDeliveryMapError('')
        setDevicesError('')
        setChartsLoading(true)
      }

      const token = getAdminToken()
      const query = chartQuery
      const monthQuery = buildMonthQuery(query)
      const jobs = [
        () => fetchAdminStats(token),
        () => fetchAdminBusinessesByProvince(token),
        () => fetchAdminRevenueChart(token, query),
        () => fetchAdminTrafficChart(token, query),
        () => fetchAdminTrafficLocations(token, monthQuery),
        () => fetchAdminTrafficPatterns(token, monthQuery),
        () => fetchAdminOrdersChart(token, query),
        () => fetchAdminOrderSalesChart(token, query),
        () => fetchAdminOrdersTopBusinesses(token, query),
        () => fetchAdminTopSoldProducts(token, query),
        () => fetchAdminTopPopularProducts(token, query),
        () => fetchAdminOrdersLocations(token, query),
        () => fetchAdminDeliveryMap(token, query),
        () => fetchAdminDeviceStats(token, query),
      ]

      let results
      try {
        results = await Promise.allSettled(jobs.map((run) => run()))
      } finally {
        if (pullSeq.current === pullId) setPulling(false)
      }
      if (results.some((result) => result.status === 'rejected' && handleSessionError(result.reason))) {
        return
      }

      const apply = (index, setter, errorSetter, fallback) => {
        const result = results[index]
        if (result.status === 'fulfilled') {
          setter(result.value)
          if (!silent) errorSetter?.('')
          return
        }
        if (silent) return
        setter(null)
        errorSetter?.(getUserFacingMessage(result.reason, fallback))
      }

      apply(0, setStats, setError, 'No pudimos cargar las estadísticas.')
      apply(1, setProvinceStats, setError, 'No pudimos cargar las estadísticas.')
      apply(2, setRevenueChart, setRevenueError, 'No pudimos cargar el gráfico de recaudación.')
      apply(3, setTrafficChart, setTrafficError, 'No pudimos cargar el gráfico de tráfico.')
      apply(4, setTrafficLocations, setLocationsError, 'No pudimos cargar el desglose de tráfico.')
      apply(5, setTrafficPatterns, setPatternsError, 'No pudimos cargar el desglose de tráfico.')
      apply(6, setOrdersChart, setOrdersError, 'No pudimos cargar el análisis de pedidos.')
      apply(7, setSalesChart, setSalesError, 'No pudimos cargar el monto vendido.')
      apply(8, setTopBusinesses, setTopBusinessesError, 'No pudimos cargar el análisis de pedidos.')
      apply(9, setTopSoldProducts, setTopSoldError, 'No pudimos cargar los productos más vendidos.')
      apply(10, setTopPopularProducts, setTopPopularError, 'No pudimos cargar los productos más populares.')
      apply(11, setOrdersLocations, setOrdersLocationsError, 'No pudimos cargar el análisis de pedidos.')
      apply(12, setDeliveryMap, setDeliveryMapError, 'No pudimos cargar el mapa de domicilios.')
      apply(13, setDeviceStats, setDevicesError, 'No pudimos cargar los dispositivos.')

      if (!silent) {
        setLoading(false)
        setChartsLoading(false)
      }
    },
    [chartQuery, handleSessionError],
  )

  useEffect(() => {
    loadAll({ silent: false })
  }, [loadAll, location.pathname])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return
      loadAll({ silent: true })
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [loadAll])

  const value = useMemo(
    () => ({
      granularity,
      setGranularity,
      range,
      setRange,
      stats,
      provinceStats,
      revenueChart,
      trafficChart,
      trafficLocations,
      trafficPatterns,
      ordersChart,
      salesChart,
      topBusinesses,
      topSoldProducts,
      topPopularProducts,
      ordersLocations,
      deliveryMap,
      deviceStats,
      loading,
      chartsLoading,
      error,
      revenueError,
      trafficError,
      locationsError,
      patternsError,
      ordersError,
      salesError,
      topBusinessesError,
      topSoldError,
      topPopularError,
      ordersLocationsError,
      deliveryMapError,
      devicesError,
      pulling,
      periodLabel: periodLabel(stats),
      multiDay: isMultiDayRange(range, deviceStats?.points?.length ?? 0),
    }),
    [
      granularity,
      range,
      stats,
      provinceStats,
      revenueChart,
      trafficChart,
      trafficLocations,
      trafficPatterns,
      ordersChart,
      salesChart,
      topBusinesses,
      topSoldProducts,
      topPopularProducts,
      ordersLocations,
      deliveryMap,
      deviceStats,
      loading,
      chartsLoading,
      error,
      revenueError,
      trafficError,
      locationsError,
      patternsError,
      ordersError,
      salesError,
      topBusinessesError,
      topSoldError,
      topPopularError,
      ordersLocationsError,
      deliveryMapError,
      devicesError,
      pulling,
    ],
  )

  return <AdminStatisticsContext.Provider value={value}>{children}</AdminStatisticsContext.Provider>
}

export function useAdminStatistics() {
  const value = useContext(AdminStatisticsContext)
  if (!value) {
    throw new Error('useAdminStatistics debe usarse dentro de AdminStatisticsProvider.')
  }
  return value
}
