import { adminFocusRing } from './adminStyles'

const base = `inline-flex items-center justify-center rounded-xl font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${adminFocusRing}`

const sizes = {
  md: 'min-h-11 w-full px-5 py-2.5 text-sm sm:min-h-11',
  sm: 'min-h-9 w-auto px-3 py-1.5 text-xs',
  xs: 'min-h-8 w-fit px-2.5 py-1 text-[0.7rem]',
}

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
  size = 'md',
  type = 'button',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`${base} ${sizes[size] ?? sizes.md} ${variants[variant] ?? variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
