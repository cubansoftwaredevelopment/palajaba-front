import { DISPLAY_CURRENCIES } from '../../constants/currencies'

function currencyLabel(code) {
  return DISPLAY_CURRENCIES.find((item) => item.code === code)?.label ?? code
}

export default function BuyerAssortmentHints({ hints, onCurrency }) {
  const currencies = hints?.currencies ?? []
  if (!currencies.length) return null

  return (
    <div className="mt-4 w-full max-w-md text-left">
      <p className="text-sm font-semibold text-brand-green">
        En esta zona sí hay productos con otra moneda.
      </p>
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
    </div>
  )
}
