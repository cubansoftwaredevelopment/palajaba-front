import { useEffect } from 'react'

function ToastCard({ toast, onClose }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onClose(toast.id), 5200)
    return () => window.clearTimeout(timer)
  }, [onClose, toast.id])

  return (
    <div
      className={`flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl animate-jaba-toast-in ${
        toast.type === 'success'
          ? 'border-brand-green/30 bg-zinc-900/95 text-zinc-100'
          : 'border-brand-carmelita/25 bg-zinc-950/95 text-zinc-200'
      }`}
      role={toast.type === 'error' ? 'alert' : 'status'}
    >
      <span className="flex-1 whitespace-pre-wrap">{toast.message}</span>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className="shrink-0 text-zinc-500 hover:text-white"
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>
  )
}

export default function AdminToastStack({ toasts, onDismiss }) {
  if (!toasts?.length) return null

  return (
    <div className="admin-theme pointer-events-none fixed bottom-[max(4.5rem,calc(3.25rem+var(--safe-bottom)))] left-1/2 z-50 flex w-[min(24rem,calc(100%-2rem))] -translate-x-1/2 flex-col-reverse gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastCard toast={toast} onClose={onDismiss} />
        </div>
      ))}
    </div>
  )
}
