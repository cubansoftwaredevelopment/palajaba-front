export function PullStatus({ status }) {
  if (!status) return null
  return (
    <p className="pointer-events-none sticky top-0 z-20 py-2 text-center text-xs font-semibold text-brand-carmelita">
      {status}
    </p>
  )
}
