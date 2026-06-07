import Logo from '../Logo'

export default function SellerLoadingScreen({ message = 'Cargando tu tienda…' }) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-brand-white px-6">
      <div
        className="pointer-events-none absolute -right-16 top-12 h-48 w-48 rounded-full bg-brand-yellow/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-16 h-56 w-56 rounded-full bg-brand-green/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative flex flex-col items-center gap-4 animate-fade-in">
        <Logo className="h-14 w-14" priority />
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-brand-green/15 border-t-brand-green"
          role="status"
          aria-label={message}
        />
        <p className="text-sm font-medium text-brand-carmelita/85">{message}</p>
      </div>
    </main>
  )
}
