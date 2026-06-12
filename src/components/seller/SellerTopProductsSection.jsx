import { resolveMediaUrl } from '../../lib/media'
import StatePanel from '../ui/StatePanel'
import { sellerHint, sellerSection } from './sellerStyles'

function ProductRankList({ title, hint, items, metricLabel, emptyMessage }) {
  return (
    <div className={sellerSection}>
      <div className="mb-3">
        <h4 className="font-display text-base font-bold text-brand-green">{title}</h4>
        {hint ? <p className={`mt-1 ${sellerHint}`}>{hint}</p> : null}
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-brand-yellow/25 bg-brand-yellow/15 px-3 py-4 text-center text-sm text-brand-carmelita/90">
          {emptyMessage}
        </p>
      ) : (
        <ol className="space-y-2">
          {items.map((item, index) => {
            const imageSrc = resolveMediaUrl(item.image_url)
            const metric = metricLabel?.(item)
            return (
              <li
                key={`${item.product_id}-${index}`}
                className="flex items-center gap-3 rounded-xl border border-brand-green/10 bg-brand-white/80 px-2.5 py-2"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-green/10 font-display text-xs font-bold text-brand-green">
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
                  {metric ? (
                    <p className="text-[0.65rem] font-medium text-brand-carmelita/80">{metric}</p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

export default function SellerTopProductsSection({ loading, error, data }) {
  if (loading) {
    return (
      <section className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h3 className="font-display text-lg font-bold text-brand-green sm:text-xl">
            Productos destacados
          </h3>
          <p className={`mt-1 ${sellerHint}`}>
            Ranking actual de tu catálogo: los que más interés generan y los que más se venden.
          </p>
        </div>
        <p className="rounded-2xl border border-brand-green/10 bg-brand-white px-4 py-8 text-center text-sm text-brand-carmelita/80">
          Cargando productos…
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h3 className="font-display text-lg font-bold text-brand-green sm:text-xl">
            Productos destacados
          </h3>
        </div>
        <StatePanel variant="compact" title="No se pudo cargar" message={error} />
      </section>
    )
  }

  const popular = data?.most_popular ?? []
  const sold = data?.most_sold ?? []

  return (
    <section className="flex flex-col gap-3 sm:gap-4">
      <div>
        <h3 className="font-display text-lg font-bold text-brand-green sm:text-xl">
          Productos destacados
        </h3>
        <p className={`mt-1 ${sellerHint}`}>
          Ranking actual de tu catálogo: los que más interés generan y los que más se venden.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        <ProductRankList
          title="Más populares"
          hint="Productos con mayor visibilidad en la plataforma ahora mismo."
          items={popular}
          emptyMessage="Aún no hay productos con popularidad registrada."
        />
        <ProductRankList
          title="Más vendidos"
          hint="Unidades vendidas en todos los pedidos completados hasta ahora."
          items={sold}
          metricLabel={(item) =>
            `${item.units_sold ?? 0} ${item.units_sold === 1 ? 'unidad vendida' : 'unidades vendidas'}`
          }
          emptyMessage="Aún no hay productos vendidos."
        />
      </div>
    </section>
  )
}
