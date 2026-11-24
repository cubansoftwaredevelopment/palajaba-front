export default function BuyerProductPrices({ prices, priceClassName }) {
  if (!prices?.length) return null

  return (
    <div className="flex flex-col gap-0.5">
      {prices.map((price) => (
        <p key={price.currency} className={priceClassName}>
          {price.discountPercent ? (
            <span className="flex flex-col items-start gap-[0.16em]">
              <span className="inline-flex flex-wrap items-center gap-x-[0.4em] gap-y-1">
                <span>{price.label}</span>
                <span className="rounded-full bg-brand-yellow px-[0.55em] py-[0.22em] text-[max(0.7rem,0.58em)] font-bold leading-none text-brand-green">
                  -{price.discountPercent}%
                </span>
              </span>
              <span className="text-[max(0.68rem,0.55em)] font-medium leading-none text-brand-carmelita/55 line-through decoration-brand-carmelita/35">
                {price.originalLabel}
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
