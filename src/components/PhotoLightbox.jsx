import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { resolveMediaUrl } from '../lib/media'
import { useDismissibleModal } from './buyer/useOrderModalPresence'

const MIN_SCALE = 1
const MAX_SCALE = 4

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

export default function PhotoLightbox({
  images,
  index,
  onIndex,
  onClose,
  label = 'Foto',
  imageClassName = '',
}) {
  const image = images[index]
  const src = resolveMediaUrl(image?.image_url)
  const stageRef = useRef(null)
  const [scale, setScale] = useState(MIN_SCALE)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [smoothZoom, setSmoothZoom] = useState(true)
  const dragRef = useRef(null)
  const pinchRef = useRef(null)
  const previousIndexRef = useRef(index)
  const [slideDir, setSlideDir] = useState(null)
  const { dismiss, closing } = useDismissibleModal(onClose)

  useEffect(() => {
    setScale(MIN_SCALE)
    setOffset({ x: 0, y: 0 })
    setSmoothZoom(true)
    if (previousIndexRef.current === index) return
    setSlideDir(index > previousIndexRef.current ? 'next' : 'prev')
    previousIndexRef.current = index
  }, [index])

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopImmediatePropagation()
        dismiss()
        return
      }
      if (event.key === 'ArrowRight') onIndex(Math.min(images.length - 1, index + 1))
      if (event.key === 'ArrowLeft') onIndex(Math.max(0, index - 1))
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [dismiss, images.length, index, onIndex])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  useEffect(() => {
    const node = stageRef.current
    if (!node) return undefined
    function onWheel(event) {
      event.preventDefault()
      const delta = event.deltaY < 0 ? 0.25 : -0.25
      setSmoothZoom(true)
      setScale((current) => {
        const next = clampScale(Math.round((current + delta) * 100) / 100)
        if (next === MIN_SCALE) setOffset({ x: 0, y: 0 })
        return next
      })
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [])

  function zoomTo(nextScale) {
    setSmoothZoom(true)
    setScale(clampScale(nextScale))
    if (nextScale <= MIN_SCALE) setOffset({ x: 0, y: 0 })
  }

  function onPointerDown(event) {
    if (event.pointerType === 'touch') return
    if (scale <= MIN_SCALE) return
    setSmoothZoom(false)
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
      setSmoothZoom(false)
      pinchRef.current = {
        distance: Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY),
        scale,
      }
      dragRef.current = null
      return
    }
    if (event.touches.length === 1 && scale > MIN_SCALE) {
      setSmoothZoom(false)
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

  const backdropClass = closing
    ? 'motion-safe:animate-photo-backdrop-out motion-reduce:animate-none'
    : 'motion-safe:animate-photo-backdrop-in motion-reduce:animate-none'
  const imageMotionClass = closing
    ? 'motion-safe:animate-photo-zoom-out motion-reduce:animate-none'
    : slideDir === 'next'
      ? 'motion-safe:animate-photo-slide-next motion-reduce:animate-none'
      : slideDir === 'prev'
        ? 'motion-safe:animate-photo-slide-prev motion-reduce:animate-none'
        : 'motion-safe:animate-photo-zoom-in motion-reduce:animate-none'

  return createPortal(
    <div
      className={`fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md ${backdropClass}`}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={dismiss}
    >
      <div
        ref={stageRef}
        className="pointer-events-none relative flex h-full w-full max-w-5xl items-center justify-center"
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            dismiss()
          }}
          className="pointer-events-auto absolute right-0 top-0 z-[2] flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-zinc-700 touch-manipulation"
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
              onClick={(event) => {
                event.stopPropagation()
                onIndex(Math.max(0, index - 1))
              }}
              disabled={index === 0}
              className="pointer-events-auto absolute left-0 top-1/2 z-[2] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-800 touch-manipulation disabled:opacity-40"
              aria-label="Foto anterior"
            >
              <Chevron direction="left" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onIndex(Math.min(images.length - 1, index + 1))
              }}
              disabled={index === images.length - 1}
              className="pointer-events-auto absolute right-0 top-1/2 z-[2] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-800 touch-manipulation disabled:opacity-40"
              aria-label="Foto siguiente"
            >
              <Chevron direction="right" />
            </button>
          </>
        ) : null}

        <div
          key={`${image.id ?? src}-${index}`}
          className={`pointer-events-auto ${imageMotionClass}`}
          onClick={(event) => event.stopPropagation()}
        >
          <img
            src={src}
            alt=""
            draggable={false}
            onDoubleClick={() => zoomTo(scale > MIN_SCALE ? MIN_SCALE : 2.2)}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className={`max-h-[78dvh] max-w-[min(100%,52rem)] select-none object-contain ${scale > MIN_SCALE ? 'cursor-grab' : 'cursor-zoom-in'} ${imageClassName}`}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transition: smoothZoom ? 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
            }}
          />
        </div>

        {images.length > 1 ? (
          <span className="pointer-events-auto absolute inset-x-0 bottom-0 mx-auto w-fit rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white">
            {index + 1} / {images.length}
          </span>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
