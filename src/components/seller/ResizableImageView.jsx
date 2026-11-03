import { NodeViewWrapper } from '@tiptap/react'
import { clampImageWidth, MAX_IMAGE_WIDTH, MIN_IMAGE_WIDTH } from '../../lib/storePages'

function clampDragWidth(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return MAX_IMAGE_WIDTH
  return Math.min(MAX_IMAGE_WIDTH, Math.max(MIN_IMAGE_WIDTH, number))
}

const scaledImageStyle = {
  width: '100%',
  height: 'auto',
  maxWidth: '100%',
  minWidth: 0,
}

function wrapsBesideText(align, width) {
  return align !== 'center' && width < 100
}

export default function ResizableImageView({ node, updateAttributes, selected, deleteNode }) {
  const width = clampImageWidth(node.attrs.width)
  const align = node.attrs.textAlign === 'center' || node.attrs.textAlign === 'right' ? node.attrs.textAlign : 'left'

  function onResizePointerDown(event) {
    event.preventDefault()
    event.stopPropagation()
    const handle = event.currentTarget
    const frame = handle.parentElement
    const sized = besideText ? frame?.parentElement : frame
    const prose = frame?.closest('.ProseMirror')
    const proseStyle = prose ? getComputedStyle(prose) : null
    const columnWidth = prose
      ? prose.clientWidth - parseFloat(proseStyle.paddingLeft) - parseFloat(proseStyle.paddingRight)
      : frame?.parentElement?.getBoundingClientRect().width || 1
    const startX = event.clientX
    const startWidth = width
    let nextWidth = startWidth
    handle.setPointerCapture(event.pointerId)

    function onMove(moveEvent) {
      nextWidth = clampDragWidth(startWidth + ((moveEvent.clientX - startX) / columnWidth) * 100)
      if (sized) sized.style.width = `${nextWidth}%`
    }

    function onUp() {
      handle.removeEventListener('pointermove', onMove)
      handle.removeEventListener('pointerup', onUp)
      handle.removeEventListener('pointercancel', onUp)
      updateAttributes({ width: clampImageWidth(nextWidth) })
    }

    handle.addEventListener('pointermove', onMove)
    handle.addEventListener('pointerup', onUp)
    handle.addEventListener('pointercancel', onUp)
  }

  const besideText = wrapsBesideText(align, width)

  return (
    <NodeViewWrapper
      data-drag-handle
      className={besideText ? `my-1 min-w-0 max-w-full ${align === 'right' ? 'ml-4' : 'mr-4'}` : 'my-3 block w-full min-w-0'}
      style={besideText ? { width: `${width}%`, float: align === 'right' ? 'right' : 'left' } : undefined}
    >
      <div
        className={`relative min-w-0 max-w-full ${besideText ? '' : align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : ''} ${selected ? 'ring-2 ring-brand-green/50 ring-offset-2' : ''}`}
        style={{ width: besideText ? '100%' : `${width}%` }}
      >
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          draggable={false}
          style={scaledImageStyle}
          className="block rounded-lg"
        />
        {node.attrs.href ? (
          <span className="absolute left-1 top-1 rounded bg-brand-green px-1.5 py-0.5 text-[0.6rem] font-semibold text-white">Enlace</span>
        ) : null}
        {selected ? (
          <>
            <button
              type="button"
              aria-label="Eliminar imagen"
              onPointerDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                deleteNode()
              }}
              className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full border border-white bg-brand-carmelita text-white shadow"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Cambiar tamaño de la imagen"
              onPointerDown={onResizePointerDown}
              className="absolute -bottom-2 -right-2 h-7 w-7 cursor-se-resize touch-none rounded-md border-2 border-white bg-brand-green shadow"
            />
          </>
        ) : null}
      </div>
    </NodeViewWrapper>
  )
}
