import { resolveMediaUrl } from '../../lib/media'
import { formatCount, formatPercent } from '../utils'
import SellerChartCard from './SellerChartCard'

export default function SellerHighViewsLowSales({ loading, error, data }) {
  const items = data?.items ?? []

  return (
    <SellerChartCard
      title="Muchas vistas, pocas ventas"
      hint="Productos con visibilidad alta y una conversión por debajo del promedio de tu tienda."
      loading={loading}
      error={error}
      empty={!items.length}
      emptyMessage="Ningún producto destaca por vistas altas y pocas ventas en este periodo."
    >
      <ol className="space-y-2">
        {items.map((item, index) => {
          const imageSrc = resolveMediaUrl(item.image_url)
          return (
            <li
              key={`${item.product_id}-${index}`}
              className="flex items-center gap-3 rounded-xl border border-brand-green/10 bg-brand-white/80 px-2.5 py-2"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-yellow/25 font-display text-xs font-bold text-brand-carmelita">
                {index + 1}
              </span>
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-lg border border-brand-green/10 object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-yellow/15 text-[0.55rem] text-brand-carmelita">
                  Sin foto
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-green">{item.name}</p>
                <p className="text-[0.65rem] font-medium text-brand-carmelita/80">
                  {formatCount(item.views)} vistas · {formatCount(item.purchases)} compras ·{' '}
                  {formatPercent(item.conversion_rate)}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </SellerChartCard>
  )
}
