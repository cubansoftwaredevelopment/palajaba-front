import LoadingState from '../ui/LoadingState'

export default function SellerLoadingScreen({ message = 'Cargando tu tienda…' }) {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-brand-white">
      <div
        className="pointer-events-none absolute -right-16 top-12 h-48 w-48 rounded-full bg-brand-yellow/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-16 h-56 w-56 rounded-full bg-brand-green/10 blur-3xl"
        aria-hidden="true"
      />
      <LoadingState
        variant="fullscreen"
        size="lg"
        message={message}
        className="flex-1 animate-fade-in !min-h-0"
      />
    </main>
  )
}
