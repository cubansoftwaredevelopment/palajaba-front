import { sellerHint, sellerLabel } from './sellerStyles'

export default function SellerSection({ label, hint, required, optional, children }) {
  return (
    <section>
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
    </section >
  )
}
