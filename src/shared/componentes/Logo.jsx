import { useState } from 'react'
import { BRAND_NAME, LOGO } from '../utils/branding.js'

// Área opaca de public/logo.png (842×595). El resto del archivo es transparente.
const ART = { w: 842, h: 595, l: 68, t: 104, cw: 684, ch: 376 }

export const TIGHT_HEADER_LOGO =
  'h-[calc(2.25rem*376/842)] w-[calc(2.25rem*684/842)] sm:h-[calc(2.5rem*376/842)] sm:w-[calc(2.5rem*684/842)]'

export const TIGHT_SIDEBAR_LOGO =
  'h-[calc(5rem*376/842)] w-[calc(5rem*684/842)] xl:h-[calc(6rem*376/842)] xl:w-[calc(6rem*684/842)]'

export const TIGHT_GESTOR_LOGO =
  'h-[calc(2rem*376/595)] w-[calc(2rem*684/595)]'

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
  tight = false,
}) {
  const [failed, setFailed] = useState(false)
  const src = variant === 'admin' ? LOGO.black : LOGO.png

  if (failed) {
    return <LogoFallback className={className} />
  }

  if (tight) {
    return (
      <span className={`relative inline-block shrink-0 overflow-hidden ${className}`}>
        <img
          src={src}
          alt={LOGO.alt}
          className="pointer-events-none absolute max-h-none max-w-none"
          style={{
            width: `${(ART.w / ART.cw) * 100}%`,
            height: `${(ART.h / ART.ch) * 100}%`,
            left: `${(-ART.l / ART.cw) * 100}%`,
            top: `${(-ART.t / ART.ch) * 100}%`,
          }}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onError={() => setFailed(true)}
        />
      </span>
    )
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
