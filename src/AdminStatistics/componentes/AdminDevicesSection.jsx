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
        <h3 className="text-sm font-medium text-zinc-50">Dispositivos de la app</h3>
        <p className={`mt-1.5 text-xs leading-relaxed ${adminSubtle}`}>
          Teléfonos con la app nativa. Un dispositivo activo avisó en los últimos 90 segundos.
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
              Nadie usó la app en este periodo.
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
                <span className="h-2.5 w-2.5 rounded-full bg-[#59802c]" />
                {data.live ? 'Activo' : 'Sin sesión'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#d97706]" />
                Sesión iniciada
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
