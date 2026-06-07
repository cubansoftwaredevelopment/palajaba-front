const baseClass =
  'flex w-full min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 touch-manipulation active:scale-[0.98] sm:active:scale-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-white lg:min-h-10 lg:text-sm'

const variantClass = {
  primary:
    'bg-brand-green text-brand-white shadow-[0_6px_20px_rgba(89,128,44,0.3)] sm:hover:-translate-y-px sm:hover:bg-[#4d7026] sm:active:translate-y-0',
  secondary:
    'border-2 border-brand-green/25 bg-brand-white text-brand-green sm:hover:border-brand-green/45 sm:hover:bg-brand-yellow/15',
  ghost:
    'bg-transparent text-brand-carmelita/80 sm:hover:text-brand-carmelita',
}

export default function Button({
  variant = 'primary',
  type = 'button',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`${baseClass} ${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
