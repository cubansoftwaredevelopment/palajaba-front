export default function BuyerProductPrices({ prices, priceClassName }) {
  if (!prices?.length) return null

  return (
    <div className="flex flex-col gap-0.5">
      {prices.map((price) => (
        <p key={price.currency} className={priceClassName}>
          {price.discountPercent ? (
            <span className="flex flex-col items-start gap-0.5">
              <span className="text-[0.85em] font-medium text-brand-carmelita/70 line-through">
                {price.originalLabel}
              </span>
              <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span>{price.label}</span>
                <span className="rounded-full bg-brand-yellow px-1.5 py-0.5 text-[0.62rem] font-bold leading-none text-brand-green">
                  -{price.discountPercent}%
                </span>
              </span>
            </span>
          ) : (
            price.label
          )}
        </p>
      ))}
    </div>
  )
}
