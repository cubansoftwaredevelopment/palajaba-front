import LoadingState from '../../components/ui/LoadingState'
import StatePanel from '../../components/ui/StatePanel'
import { sellerHint, sellerSection } from '../../components/seller/sellerStyles'

export default function SellerChartCard({ title, hint, loading, error, empty, emptyMessage, children }) {
  return (
    <section className={sellerSection}>
      <div className="mb-3">
        <h3 className="font-display text-base font-bold text-brand-green sm:text-lg">{title}</h3>
        {hint ? <p className={`mt-1 ${sellerHint}`}>{hint}</p> : null}
      </div>
      {loading ? <LoadingState variant="compact" message="Cargando…" /> : null}
      {!loading && error ? (
        <StatePanel variant="compact" title="No se pudo cargar" message={error} serviceError />
      ) : null}
      {!loading && !error && empty ? (
        <p className="rounded-xl border border-brand-yellow/25 bg-brand-yellow/15 px-3 py-4 text-center text-sm text-brand-carmelita/90">
          {emptyMessage}
        </p>
      ) : null}
      {!loading && !error && !empty ? children : null}
    </section>
  )
}
