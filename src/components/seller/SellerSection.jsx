import { sellerHint, sellerLabel, sellerSection } from './sellerStyles'

export default function SellerSection({ label, hint, required, optional, children, className = '' }) {
  return (
    <section className={`${sellerSection} ${className}`}>
      {label && (
        <div className="mb-2.5">
          <p className={sellerLabel}>
            {label}
            {required && <span className="text-brand-carmelita"> *</span>}
            {optional && (
              <span className="ml-1.5 font-normal text-brand-carmelita/70">(opcional)</span>
            )}
          </p>
          {hint && <p className={`mt-0.5 ${sellerHint}`}>{hint}</p>}
        </div>
      )}
      {children}
    </section>
  )
}
