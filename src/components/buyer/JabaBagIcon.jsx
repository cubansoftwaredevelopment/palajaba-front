import { JABA_BAG } from '../../constants/branding'

export default function JabaBagIcon({ className = 'h-4 w-4', alt = JABA_BAG.alt }) {
  return (
    <img
      src={JABA_BAG.src}
      alt={alt}
      className={`shrink-0 object-contain ${className}`}
      width={32}
      height={32}
      decoding="async"
      aria-hidden={alt === ''}
    />
  )
}
