import { useEffect, useRef, useState } from 'react'

import { sellerCatalogFab, sellerCatalogFabAction } from './sellerStyles'

export default function SellerCatalogFab({ onAddCategory, onAddProduct }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom)+0.75rem)] right-4 z-40 flex flex-col items-end gap-2 lg:bottom-8 lg:right-8">
      {open && (
        <div className="flex flex-col items-end gap-2 animate-fade-in">
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onAddCategory()
            }}
            className={sellerCatalogFabAction}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 6h16M4 12h10M4 18h6" />
            </svg>
            Nueva categoría
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onAddProduct()
            }}
            className={sellerCatalogFabAction}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nuevo producto
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={sellerCatalogFab}
        aria-label={open ? 'Cerrar acciones del catálogo' : 'Abrir acciones del catálogo'}
        aria-expanded={open}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          aria-hidden
          className={`transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  )
}
