import { LOADING_MASCOT } from '../../constants/branding'

export default function AdminStatsPullToast() {
  return (
    <div
      className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2"
      aria-live="polite"
    >
      <div
        role="status"
        className="flex items-center gap-3 rounded-xl border border-brand-green/30 bg-zinc-900/95 px-3 py-2 text-sm font-medium text-zinc-100 shadow-xl animate-jaba-toast-in"
      >
        <img
          src={LOADING_MASCOT.src}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 animate-levitate object-contain"
          decoding="async"
        />
        <span>Cargando estadísticas…</span>
      </div>
    </div>
  )
}
