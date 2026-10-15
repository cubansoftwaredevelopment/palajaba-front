import { DISPLAY_CURRENCIES } from '../../constants/currencies'

function currencyLabel(code) {
  return DISPLAY_CURRENCIES.find((item) => item.code === code)?.label ?? code
}

export default function BuyerAssortmentHints({ hints, onCurrency, onCategory }) {
  const currencies = hints?.currencies ?? []
  const categories = hints?.categories ?? []
  if (!currencies.length && !categories.length) return null
  const alternatives = [
    currencies.length ? 'otra moneda' : null,
    categories.length ? 'otra categoría' : null,
  ].filter(Boolean)

  return (
    <div className="mt-4 w-full max-w-md text-left">
      <p className="text-sm font-semibold text-brand-green">
        En esta zona sí hay productos con {alternatives.join(' o ')}.
      </p>
      {currencies.length ? (
        <div className="mt-3">
          <p className="text-xs font-semibold text-brand-carmelita/80">Monedas</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {currencies.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onCurrency?.(code)}
                className="rounded-full border border-brand-green/20 bg-brand-white px-3 py-1 text-xs font-bold text-brand-green touch-manipulation"
              >
                {currencyLabel(code)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {categories.length ? (
        <div className="mt-3">
          <p className="text-xs font-semibold text-brand-carmelita/80">Categorías</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategory?.(category.id)}
                className="rounded-full border border-brand-green/20 bg-brand-white px-3 py-1 text-xs font-bold text-brand-green touch-manipulation"
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
