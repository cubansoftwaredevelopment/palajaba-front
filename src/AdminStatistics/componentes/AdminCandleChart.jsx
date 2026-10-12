import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const UP = '#59802c'
const DOWN = '#c45c26'
const FLAT = '#71717a'

function bucketOf(point) {
  return Number(point.count ?? point.amount ?? point.bucket ?? 0)
}

function percentChange(current, previous) {
  if (previous == null) return { change: 0, direction: 'flat', based: false }
  if (previous === 0) {
    if (current > 0) return { change: 0, direction: 'up', based: false }
    if (current < 0) return { change: 0, direction: 'down', based: false }
    return { change: 0, direction: 'flat', based: true }
  }
  const change = ((current - previous) / Math.abs(previous)) * 100
  if (change > 0) return { change, direction: 'up', based: true }
  if (change < 0) return { change, direction: 'down', based: true }
  return { change: 0, direction: 'flat', based: true }
}

function formatPercent(value) {
  const text = Number(value).toLocaleString('es', {
    maximumFractionDigits: Math.abs(value) >= 10 ? 0 : 1,
    signDisplay: 'exceptZero',
  })
  return `${text}%`
}

function withChange(points) {
  return points.map((point, index) => {
    const current = bucketOf(point)
    const previous = index === 0 ? null : bucketOf(points[index - 1])
    const { change, direction, based } = percentChange(current, previous)
    return {
      ...point,
      open: 0,
      close: change,
      high: Math.max(0, change),
      low: Math.min(0, change),
      bucket: current,
      direction,
      based,
    }
  })
}

function nearestPoint(points, time) {
  let best = points[0]
  let bestDist = Infinity
  for (const point of points) {
    const dist = Math.abs(Number(point.time) - Number(time))
    if (dist < bestDist) {
      best = point
      bestDist = dist
    }
  }
  return best
}

function CandleShape(props) {
  const { x, y, width, height, payload } = props
  if (payload == null || x == null || y == null) return null
  const open = Number(payload.open ?? 0)
  const close = Number(payload.close ?? 0)
  const color = payload.direction === 'down' ? DOWN : payload.direction === 'flat' ? FLAT : close >= open ? UP : DOWN
  const cx = x + width / 2
  if (!height) {
    return <line x1={x + 1} x2={x + width - 1} y1={y} y2={y} stroke={color} strokeWidth={2} />
  }
  const high = Number(payload.high ?? 0)
  const low = Number(payload.low ?? 0)
  const span = high - low
  const bodyTop = span === 0 ? y : y + ((high - Math.max(open, close)) / span) * height
  const bodyBottom = span === 0 ? y + height : y + ((high - Math.min(open, close)) / span) * height
  const bodyHeight = Math.max(bodyBottom - bodyTop, 2)
  const bodyWidth = Math.max(Math.min(width * 0.62, 16), 4)
  return (
    <g>
      <line x1={cx} x2={cx} y1={y} y2={y + height} stroke={color} strokeWidth={1.5} />
      <rect
        x={cx - bodyWidth / 2}
        y={bodyTop}
        width={bodyWidth}
        height={bodyHeight}
        fill={color}
        rx={1}
      />
    </g>
  )
}

function changeCaption(point) {
  if (!point.based && point.direction === 'flat') return 'Sin vela anterior'
  if (!point.based) return 'La vela anterior fue 0'
  return `Cambio: ${formatPercent(point.close ?? 0)}`
}

function CandleTooltip({ active, payload, formatValue, level, change }) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null
  const bucket = Number(point.bucket ?? point.count ?? point.amount ?? 0)
  const tone = point.direction === 'down' ? 'text-[#c45c26]' : point.direction === 'flat' ? 'text-zinc-300' : 'text-brand-green'
  return (
    <div className="rounded-xl border border-brand-green/20 bg-zinc-900 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-zinc-400">
        {point.label}
      </p>
      {change ? (
        <>
          <p className={`mt-0.5 text-sm font-semibold tabular-nums ${tone}`}>{changeCaption(point)}</p>
          <p className="mt-0.5 text-xs tabular-nums text-zinc-300">En la vela: {formatValue(bucket)}</p>
        </>
      ) : (
        <>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-brand-green">
            {level ? 'En el periodo' : 'Acumulado'}: {formatValue(point.close ?? 0)}
          </p>
          <p className="mt-0.5 text-xs tabular-nums text-zinc-300">
            {level ? 'Periodo anterior' : 'En el cubo'}: {formatValue(level ? point.open ?? 0 : bucket)}
          </p>
          <p className="mt-0.5 text-[0.65rem] tabular-nums text-zinc-500">
            Máx {formatValue(point.high ?? 0)} · Mín {formatValue(point.low ?? 0)}
          </p>
        </>
      )}
    </div>
  )
}

export default function AdminCandleChart({ points, formatValue, formatTick, level = false, change = false }) {
  const source = change ? withChange(points ?? []) : (points ?? [])
  const rows = source.map((point) => ({
    ...point,
    time: Number(point.time),
    range: [Number(point.low ?? 0), Number(point.high ?? 0)],
    bucket: Number(point.bucket ?? point.count ?? point.amount ?? 0),
  }))
  if (!rows.length) return null

  const changes = rows.map((point) => Number(point.close ?? 0))
  const yMin = Math.min(0, ...changes)
  const yMax = Math.max(0, ...changes)
  const yPad = Math.max((yMax - yMin) * 0.12, 8)

  const times = rows.map((point) => point.time)
  const min = Math.min(...times)
  const max = Math.max(...times)
  const step = rows.length > 1 ? (max - min) / (rows.length - 1) : 12 * 60 * 60 * 1000
  const pad = Math.max(step * 0.55, 1)

  return (
    <div className="h-56 w-full min-w-0 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#59802c14" vertical={false} />
          <XAxis
            type="number"
            dataKey="time"
            scale="linear"
            domain={[min - pad, max + pad]}
            tickFormatter={(value) => nearestPoint(rows, value)?.label ?? ''}
            tick={{ fill: '#a1a1aa', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            tickFormatter={change ? formatPercent : formatTick}
            domain={change ? [yMin - yPad, yMax + yPad] : undefined}
            tick={{ fill: '#a1a1aa', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={change ? 52 : 42}
          />
          <Tooltip
            cursor={{ stroke: '#59802c33', strokeWidth: 1 }}
            content={<CandleTooltip formatValue={formatValue} level={level} change={change} />}
          />
          <Bar
            dataKey="range"
            shape={<CandleShape />}
            maxBarSize={18}
            minPointSize={3}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
