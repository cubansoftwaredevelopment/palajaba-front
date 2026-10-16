import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { resolveMediaUrl } from '../../lib/media'

const MIN_SCALE = 1
const MAX_SCALE = 4

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

function clampScale(value) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
}

function ProductPhotoViewer({ images, index, onIndex, onClose, imageClassName = '' }) {
  const image = images[index]
  const src = resolveMediaUrl(image?.image_url)
  const stageRef = useRef(null)
  const [scale, setScale] = useState(MIN_SCALE)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef(null)
  const pinchRef = useRef(null)

  useEffect(() => {
    setScale(MIN_SCALE)
    setOffset({ x: 0, y: 0 })
  }, [index])

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopImmediatePropagation()
        onClose()
        return
      }
      if (event.key === 'ArrowRight') onIndex(Math.min(images.length - 1, index + 1))
      if (event.key === 'ArrowLeft') onIndex(Math.max(0, index - 1))
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [images.length, index, onClose, onIndex])

  useEffect(() => {
    const node = stageRef.current
    if (!node) return undefined
    function onWheel(event) {
      event.preventDefault()
      const delta = event.deltaY < 0 ? 0.25 : -0.25
      setScale((current) => {
        const next = clampScale(Math.round((current + delta) * 100) / 100)
        if (next === MIN_SCALE) setOffset({ x: 0, y: 0 })
        return next
      })
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [])

  function zoomBy(delta) {
    setScale((current) => {
      const next = clampScale(Math.round((current + delta) * 100) / 100)
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 })
      return next
    })
  }

  function onPointerDown(event) {
    if (event.pointerType === 'touch') return
    if (scale <= MIN_SCALE) return
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      originX: offset.x,
      originY: offset.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event) {
    const drag = dragRef.current
    if (!drag) return
    setOffset({
      x: drag.originX + event.clientX - drag.x,
      y: drag.originY + event.clientY - drag.y,
    })
  }

  function onPointerUp() {
    dragRef.current = null
  }

  function onTouchStart(event) {
    if (event.touches.length === 2) {
      const [first, second] = event.touches
      pinchRef.current = {
        distance: Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY),
        scale,
      }
      dragRef.current = null
      return
    }
    if (event.touches.length === 1 && scale > MIN_SCALE) {
      const touch = event.touches[0]
      dragRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        originX: offset.x,
        originY: offset.y,
      }
    }
  }

  function onTouchMove(event) {
    if (event.touches.length === 2 && pinchRef.current) {
      event.preventDefault()
      const [first, second] = event.touches
      const distance = Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY)
      const next = clampScale(pinchRef.current.scale * (distance / pinchRef.current.distance))
      setScale(next)
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 })
      return
    }
    const drag = dragRef.current
    if (!drag || event.touches.length !== 1) return
    const touch = event.touches[0]
    setOffset({
      x: drag.originX + touch.clientX - drag.x,
      y: drag.originY + touch.clientY - drag.y,
    })
  }

  function onTouchEnd() {
    pinchRef.current = null
    dragRef.current = null
  }

  if (!image || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-green/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Foto del producto"
      onClick={onClose}
    >
      <div
        ref={stageRef}
        className="relative flex h-full w-full max-w-5xl items-center justify-center"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-0 top-0 z-[2] flex h-10 w-10 items-center justify-center rounded-full bg-brand-white text-brand-carmelita touch-manipulation"
          aria-label="Cerrar visor"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => onIndex(Math.max(0, index - 1))}
              disabled={index === 0}
              className="absolute left-0 top-1/2 z-[2] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-brand-white text-brand-green touch-manipulation disabled:opacity-40"
              aria-label="Foto anterior"
            >
              <Chevron direction="left" />
            </button>
            <button
              type="button"
              onClick={() => onIndex(Math.min(images.length - 1, index + 1))}
              disabled={index === images.length - 1}
              className="absolute right-0 top-1/2 z-[2] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-brand-white text-brand-green touch-manipulation disabled:opacity-40"
              aria-label="Foto siguiente"
            >
              <Chevron direction="right" />
            </button>
          </>
        ) : null}

        <img
          src={src}
          alt=""
          draggable={false}
          onDoubleClick={() => zoomBy(scale > MIN_SCALE ? -scale : 1.5)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className={`max-h-[78dvh] max-w-[min(100%,52rem)] select-none object-contain ${scale > MIN_SCALE ? 'cursor-grab' : 'cursor-zoom-in'} ${imageClassName}`}
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
        />

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => zoomBy(-0.5)}
            disabled={scale <= MIN_SCALE}
            className="rounded-full bg-brand-white px-3 py-2 text-sm font-semibold text-brand-green touch-manipulation disabled:opacity-40"
          >
            Alejar
          </button>
          <button
            type="button"
            onClick={() => zoomBy(0.5)}
            disabled={scale >= MAX_SCALE}
            className="rounded-full bg-brand-white px-3 py-2 text-sm font-semibold text-brand-green touch-manipulation disabled:opacity-40"
          >
            Acercar
          </button>
          <span className="rounded-full bg-brand-white/90 px-3 py-2 text-xs font-semibold text-brand-carmelita">
            {index + 1} / {images.length}
          </span>
        </div>
      </div>
    </div>,
    document.body,
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
        <ProductPhotoViewer
          images={images}
          index={viewerIndex}
          onIndex={setViewerIndex}
          onClose={() => setViewerIndex(null)}
          imageClassName={imageClassName}
        />
      ) : null}
    </div>
  )
}
