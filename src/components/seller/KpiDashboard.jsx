import { useEffect, useMemo, useState } from 'react'

import { loadExchangeRates, getCupPerUnit } from '../../lib/exchangeRates'
import {
  buildKpiCardValues,
  KPI_CURRENCY_COLORS,
  KPI_REVENUE_CURRENCIES,
} from '../../lib/sellerStatsKpi'
import StatePanel from '../ui/StatePanel'
import LoadingState from '../ui/LoadingState'
import { sellerHint, sellerSection, sellerStatCard } from './sellerStyles'

function KpiCard({ label, value, hint, accentColor, loading = false }) {
  return (
    <div className={sellerStatCard}>
      <p
        className="text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-brand-carmelita/75"
        style={accentColor ? { color: accentColor } : undefined}
      >
        {label}
      </p>
      <p className="mt-1 font-display text-lg font-bold tabular-nums text-brand-green sm:text-xl">
        {loading ? '…' : value}
      </p>
      {hint ? <p className="mt-1 text-[0.62rem] text-brand-carmelita/70">{hint}</p> : null}
    </div>
  )
}

export default function KpiDashboard({
  data,
  loading = false,
  error = '',
  monthLabel = null,
}) {
  const [consolidatedCurrency, setConsolidatedCurrency] = useState('USD')
  const [ratesReady, setRatesReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    loadExchangeRates()
      .then(() => {
        if (!cancelled) setRatesReady(true)
      })
      .catch(() => {
        if (!cancelled) setRatesReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const cardValues = useMemo(() => {
    if (!data?.totals) {
      return buildKpiCardValues([], consolidatedCurrency, getCupPerUnit())
    }
    return buildKpiCardValues(data.totals, consolidatedCurrency, getCupPerUnit())
  }, [data, consolidatedCurrency, ratesReady])

  const sectionLabel = monthLabel ? `Recaudado en ${monthLabel}` : 'Recaudado del mes'
  const sectionHint = 'Solo productos vendidos. El domicilio no se incluye.'

  if (loading) {
    return (
      <div className={sellerSection}>
        <p className="text-sm font-semibold text-brand-green">{sectionLabel}</p>
        <p className={`mt-1 ${sellerHint}`}>{sectionHint}</p>
        <div className="mt-4">
          <LoadingState label="Cargando recaudación…" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={sellerSection}>
        <p className="text-sm font-semibold text-brand-green">{sectionLabel}</p>
        <div className="mt-4">
          <StatePanel variant="error" title="No pudimos cargar la recaudación" message={error} />
        </div>
      </div>
    )
  }

  return (
    <div className={sellerSection}>
      <p className="text-sm font-semibold text-brand-green">{sectionLabel}</p>
      <p className={`mt-1 ${sellerHint}`}>{sectionHint}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5 lg:gap-3">
        {cardValues.cards.map((card) => (
          <KpiCard
            key={card.id}
            label={card.label}
            value={card.formattedAmount}
            accentColor={KPI_CURRENCY_COLORS[card.id]}
          />
        ))}

        <div className={`${sellerStatCard} col-span-2 lg:col-span-1`}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-brand-carmelita/75">
              Total consolidado
            </p>
            <label className="sr-only" htmlFor="kpi-consolidated-currency">
              Moneda del total consolidado
            </label>
            <select
              id="kpi-consolidated-currency"
              value={consolidatedCurrency}
              onChange={(event) => setConsolidatedCurrency(event.target.value)}
              className="max-w-[5.5rem] rounded-lg border border-brand-green/15 bg-brand-white px-1.5 py-0.5 text-[0.62rem] font-semibold text-brand-green focus:border-brand-green/35 focus:outline-none focus:ring-2 focus:ring-brand-green/10"
            >
              {KPI_REVENUE_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 font-display text-lg font-bold tabular-nums text-brand-green sm:text-xl">
            {cardValues.consolidated.formattedAmount}
          </p>
          {cardValues.consolidated.conversionUnavailable ? (
            <p className="mt-1 text-[0.62rem] text-brand-carmelita/70">
              Tasas no disponibles para convertir.
            </p>
          ) : (
            <p className="mt-1 text-[0.62rem] text-brand-carmelita/70">
              {data?.orders_count ?? 0} pedido{(data?.orders_count ?? 0) === 1 ? '' : 's'} en el mes
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
