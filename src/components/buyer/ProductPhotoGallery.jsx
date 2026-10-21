import { useEffect, useRef, useState } from 'react'
import { resolveMediaUrl } from '../../lib/media'
import PhotoLightbox from '../PhotoLightbox'

export function galleryImages(product) {
  const images = Array.isArray(product?.images) && product.images.length
    ? product.images
    : product?.image_url
      ? [{ id: 'frontal', image_url: product.image_url, is_frontal: true }]
      : []
  return [...images].sort(
    (left, right) => Number(Boolean(right.is_frontal)) - Number(Boolean(left.is_frontal)),
  )
}

function Chevron({ direction }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      {direction === 'left' ? <path d="M15 6 9 12l6 6" /> : <path d="M9 6l6 6-6 6" />}
    </svg>
  )
}

export default function ProductPhotoGallery({
  product,
  imageClassName = '',
  emptyLabel = 'Sin foto',
  overlay = null,
}) {
  const images = galleryImages(product)
  const rowRef = useRef(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(null)

  function updateEdges() {
    const node = rowRef.current
    if (!node) return
    setCanPrev(node.scrollLeft > 8)
    setCanNext(node.scrollLeft + node.clientWidth < node.scrollWidth - 8)
  }

  useEffect(() => {
    updateEdges()
    const node = rowRef.current
    if (!node) return undefined
    node.addEventListener('scroll', updateEdges, { passive: true })
    window.addEventListener('resize', updateEdges)
    return () => {
      node.removeEventListener('scroll', updateEdges)
      window.removeEventListener('resize', updateEdges)
    }
  }, [images.map((image) => image.id).join('|')])

  function scrollByCard(direction) {
    const node = rowRef.current
    if (!node) return
    const card = node.querySelector('[data-photo-card]')
    const distance = (card?.getBoundingClientRect().width ?? node.clientWidth * 0.7) + 8
    node.scrollBy({ left: direction * distance, behavior: 'smooth' })
  }

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl bg-brand-white text-sm font-semibold text-brand-carmelita/60">
        {emptyLabel}
      </div>
    )
  }

  const several = images.length > 1

  return (
    <div className="relative">
      <div
        ref={rowRef}
        className={`flex gap-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${several ? 'snap-x snap-mandatory overflow-x-auto overscroll-x-contain' : 'justify-center'}`}
      >
        {images.map((image, index) => {
          const src = resolveMediaUrl(image.image_url, { width: 800 })
          return (
            <button
              key={image.id}
              type="button"
              data-photo-card
              onClick={() => setViewerIndex(index)}
              className={`relative shrink-0 snap-start overflow-hidden rounded-2xl bg-brand-white shadow-[0_8px_28px_rgba(89,128,44,0.12)] ring-1 ring-brand-green/10 touch-manipulation ${several ? 'aspect-[4/5] w-[68%]' : 'aspect-[4/5] w-full max-w-[11rem]'}`}
              aria-label={image.is_frontal ? 'Ampliar foto frontal' : 'Ampliar foto'}
            >
              {src ? (
                <img src={src} alt="" onLoad={updateEdges} className={`h-full w-full object-cover ${imageClassName}`} />
              ) : (
                <span className="flex h-full items-center justify-center text-sm font-semibold text-brand-carmelita/60">
                  {emptyLabel}
                </span>
              )}
              {index === 0 && overlay ? (
                <div className="pointer-events-none absolute inset-0 z-[1]">{overlay}</div>
              ) : null}
            </button>
          )
        })}
      </div>

      {several ? (
        <>
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            disabled={!canPrev}
            className="absolute left-1 top-1/2 z-[2] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-brand-white/95 text-brand-green shadow touch-manipulation disabled:opacity-35"
            aria-label="Desplazar a la foto anterior"
          >
            <Chevron direction="left" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            disabled={!canNext}
            className="absolute right-1 top-1/2 z-[2] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-brand-white/95 text-brand-green shadow touch-manipulation disabled:opacity-35"
            aria-label="Desplazar a la foto siguiente"
          >
            <Chevron direction="right" />
          </button>
        </>
      ) : null}

      {viewerIndex != null ? (
        <PhotoLightbox
          images={images}
          index={viewerIndex}
          onIndex={setViewerIndex}
          onClose={() => setViewerIndex(null)}
          label="Foto del producto"
          imageClassName={imageClassName}
        />
      ) : null}
    </div>
  )
}
