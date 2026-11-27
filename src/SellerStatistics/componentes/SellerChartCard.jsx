import LoadingState from '../../shared/componentes/LoadingState.jsx'
import StatePanel from '../../shared/componentes/StatePanel.jsx'
import { sellerHint, sellerSection } from '../../seller/componentes/sellerStyles.js'

export default function SellerChartCard({ title, hint, loading, error, empty, emptyMessage, fill = false, children }) {
  return (
    <section className={`${sellerSection} ${fill ? 'flex h-full min-h-0 flex-1 flex-col' : ''}`}>
      <div className={`mb-3 ${fill ? 'shrink-0' : ''}`}>
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
