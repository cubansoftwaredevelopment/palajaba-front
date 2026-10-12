import AdminCandleChart from './AdminCandleChart'
import AdminDeviceMap from './AdminDeviceMap'
import { adminCard, adminMuted, adminSubtle } from '../../components/admin/adminStyles'

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

function formatCount(value) {
  return Math.round(Number(value) || 0).toLocaleString('es')
}

function formatMapDay(day) {
  if (!day) return ''
  const [year, month, date] = day.split('-').map(Number)
  if (!year || !month || !date) return day
  return `${date} de ${MONTHS[month - 1]} de ${year}`
}

export default function AdminDevicesSection({ data, loading, error, multiDay }) {
  const points = data?.points ?? []
  const hasData = points.some((point) => Number(point.close) > 0 || Number(point.count) > 0)
  const mapTitle = data?.live
    ? 'Posición en vivo'
    : `Última ubicación del ${formatMapDay(data?.map_day)}`
  const activeOnly = Math.max(0, (data?.active_now ?? 0) - (data?.signed_in_now ?? 0))

  return (
    <section className={adminCard}>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-50">Dispositivos</h3>
        <p className={`mt-1.5 text-xs leading-relaxed ${adminSubtle}`}>
          App y navegadores. Un dispositivo activo avisó en los últimos 90 segundos.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-3">
          <p className={`text-[0.65rem] font-medium uppercase tracking-wide ${adminMuted}`}>Ahora</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-50">
            {loading && !data ? '…' : formatCount(data?.active_now ?? 0)}
          </p>
          <p className={`mt-1 text-xs ${adminSubtle}`}>
            {formatCount(activeOnly)} activos · {formatCount(data?.signed_in_now ?? 0)} con sesión
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-3">
          <p className={`text-[0.65rem] font-medium uppercase tracking-wide ${adminMuted}`}>
            Registrados
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-50">
            {loading && !data ? '…' : formatCount(data?.registered ?? 0)}
          </p>
          <p className={`mt-1 text-xs ${adminSubtle}`}>Vistos alguna vez</p>
        </div>
      </div>

      {loading && !data ? (
        <p className={`py-6 text-center text-sm ${adminMuted}`}>Cargando dispositivos…</p>
      ) : null}
      {!loading && error ? (
        <p
          className="rounded-xl border border-brand-carmelita/25 bg-brand-carmelita/10 px-4 py-5 text-center text-sm text-zinc-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {data && !error ? (
        <>
          {hasData ? (
            <AdminCandleChart
              points={points}
              level
              formatValue={formatCount}
              formatTick={formatCount}
            />
          ) : (
            <p className={`rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-8 text-center text-sm ${adminSubtle}`}>
              Nadie usó la app ni el navegador en este periodo.
            </p>
          )}

          <div className="mt-4">
            <h4 className="text-sm font-medium text-zinc-50">{mapTitle}</h4>
            {!data.live && multiDay ? (
              <p className={`mt-1 text-xs ${adminSubtle}`}>
                El rango cubre varios días. El mapa usa el último día.
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <img src="/images/states/loading.png" alt="" className="h-4 w-4 rounded-full object-cover" />
                Comprador
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 10 6 4h12l2 6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M4 10h16v9H4z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M10 19v-5h4v5" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                Vendedor
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M7 8.5h10a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-1v2h-2v-2H10v2H8v-2H7a2 2 0 0 1-2-2v-7.5a2 2 0 0 1 2-2z" />
                </svg>
                Android
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 20h8M12 16v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Navegador
              </span>
            </div>
            <div className="mt-3">
              <AdminDeviceMap
                markers={data.markers ?? []}
                frameKey={data.live ? 'live' : data.map_day || 'past'}
              />
            </div>
          </div>
        </>
      ) : null}
    </section>
  )
}
