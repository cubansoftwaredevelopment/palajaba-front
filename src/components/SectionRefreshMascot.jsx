import LoadingState from './ui/LoadingState'

export default function SectionRefreshMascot({ active = false }) {
  if (!active) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(var(--safe-top)+4.25rem)] z-30 flex justify-center motion-safe:animate-refresh-mascot-in">
      <LoadingState size="xs" variant="compact" showMessage={false} message="Actualizando" className="!py-0" />
    </div>
  )
}
