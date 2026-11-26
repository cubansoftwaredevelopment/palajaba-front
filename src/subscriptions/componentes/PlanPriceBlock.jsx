import CountingAmount from './CountingAmount.jsx'

function amountDigits(value) {
  return Number.isInteger(Number(value)) ? 0 : 2
}

export default function PlanPriceBlock({ price, usdEquivalent, qvapayUsd, heroClassName }) {
  const cupAmount = price.amount
  const showQvapay = qvapayUsd != null && cupAmount != null
  const heroValue = showQvapay
    ? qvapayUsd
    : (price.amount ?? price.sourceAmount ?? price.amountUsd)
  const heroCurrency = showQvapay
    ? 'USD'
    : (price.amount != null ? (price.currency || 'CUP') : (price.sourceCurrency || 'USD'))

  return (
    <>
      <span className={`block font-bold text-brand-green ${heroClassName}`}>
        {showQvapay ? (
          <span className="mb-0.5 block text-[0.65rem] font-bold uppercase tracking-[0.08em] text-brand-green">Con QvaPay</span>
        ) : null}
        <CountingAmount value={heroValue} currency={heroCurrency} fractionDigits={showQvapay ? 2 : amountDigits(heroValue)} />
        <span className="ml-1 text-xs font-semibold text-brand-carmelita/80">/{price.label}</span>
      </span>
      {showQvapay ? (
        <span className="mt-1 block text-sm font-semibold text-brand-carmelita/75">
          <CountingAmount value={cupAmount} currency="CUP" fractionDigits={amountDigits(cupAmount)} />
          <span className="ml-1 text-xs">/{price.label}</span>
        </span>
      ) : null}
      {!showQvapay && usdEquivalent != null ? (
        <span className="mt-1 block text-sm font-semibold text-brand-green/80">
          ≈ <CountingAmount value={usdEquivalent} fractionDigits={2} /> USD/{price.label}
        </span>
      ) : null}
    </>
  )
}
