import { adminFocusRing } from './adminStyles'

const base = `inline-flex min-h-11 w-full items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-11 ${adminFocusRing}`

const variants = {
  primary:
    'bg-brand-green text-brand-white shadow-[0_4px_18px_rgba(89,128,44,0.35)] hover:bg-[#668f34] active:scale-[0.98]',
  secondary:
    'border border-zinc-700/90 bg-zinc-900/70 text-zinc-100 hover:border-brand-green/30 hover:bg-zinc-800/80',
  ghost: 'bg-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100',
  danger:
    'border border-brand-carmelita/35 bg-brand-carmelita/10 text-orange-100 hover:border-brand-carmelita/50 hover:bg-brand-carmelita/15',
}

export default function AdminButton({
  variant = 'primary',
  type = 'button',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant] ?? variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
