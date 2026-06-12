import {
  resolveStateMascotSize,
  STATE_MASCOT_SIZE_CLASS,
  STATE_MASCOT_SIZE_PX,
} from './stateIllustrationSizes'

export default function StateMascotImage({ src, size = 'md', className = '' }) {
  const sizeKey = resolveStateMascotSize(size)
  const pixelSize = STATE_MASCOT_SIZE_PX[sizeKey]

  return (
    <img
      src={src}
      alt=""
      width={pixelSize}
      height={pixelSize}
      className={`${STATE_MASCOT_SIZE_CLASS[sizeKey]} object-contain ${className}`.trim()}
      decoding="async"
    />
  )
}
