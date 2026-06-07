import { useState } from 'react'
import { BRAND_NAME, LOGO } from '../constants/branding'

function LogoFallback({ className = '' }) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl border-2 border-dashed border-brand-green/25 bg-brand-yellow/15 ${className}`}
      role="img"
      aria-label={LOGO.alt}
    >
      <span className="px-2 text-center font-display text-[0.65rem] font-bold leading-tight text-brand-green sm:text-xs">
        {BRAND_NAME}
      </span>
    </div>
  )
}

export default function Logo({
  className = 'h-20 w-20',
  priority = false,
  variant = 'default',
}) {
  const [failed, setFailed] = useState(false)
  const src = variant === 'admin' ? LOGO.black : LOGO.png

  if (failed) {
    return <LogoFallback className={className} />
  }

  return (
    <img
        src={src}
        alt={LOGO.alt}
        width={512}
        height={512}
        className={`object-contain ${className}`}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onError={() => setFailed(true)}
      />
  )
}
