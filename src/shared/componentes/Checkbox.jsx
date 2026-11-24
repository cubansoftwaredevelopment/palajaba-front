const TONE = {
  light:
    'border-brand-green/30 bg-brand-white peer-checked:border-brand-green peer-checked:bg-brand-green peer-focus-visible:ring-offset-brand-white',
  admin:
    'border-zinc-600 bg-zinc-900/80 peer-checked:border-brand-green peer-checked:bg-brand-green peer-focus-visible:ring-offset-[var(--admin-canvas)]',
}

export default function Checkbox({ tone = 'light', className = '', ...props }) {
  return (
    <span className={`relative inline-flex h-5 w-5 shrink-0 ${className}`}>
      <input
        {...props}
        type="checkbox"
        className="peer absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none flex h-5 w-5 items-center justify-center rounded-[0.4rem] border-2 text-brand-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors peer-checked:[&_svg]:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-green/35 peer-focus-visible:ring-offset-2 peer-disabled:opacity-40 ${TONE[tone] ?? TONE.light}`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-0 transition-opacity">
          <path d="M2.2 6.2 4.7 8.6 9.8 3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </span>
  )
}
