import { useEffect, useRef, useState } from 'react'

import { sellerCatalogMenuAction, sellerCatalogMenuTrigger } from './sellerStyles'

export default function SellerCatalogActionsMenu({
  canReorderCategories,
  canShareCatalog,
  canChangeTheme,
  onReorderCategories,
  onShareCatalog,
  onChangeTheme,
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  const hasActions = canReorderCategories || canShareCatalog || canChangeTheme

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

  if (!hasActions) return null

  return (
    <div ref={rootRef} className="relative flex shrink-0 flex-col items-end">
      {open ? (
        <div
          className="absolute right-0 top-full z-30 mt-2 flex flex-col items-end gap-1.5 animate-fade-in sm:gap-2"
          role="menu"
          aria-label="Opciones del catálogo"
        >
          {canReorderCategories ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onReorderCategories()
              }}
              className={sellerCatalogMenuAction}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="shrink-0 sm:h-[18px] sm:w-[18px]">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
              <span className="sm:hidden">Organizar</span>
              <span className="hidden sm:inline">Organizar categorías</span>
            </button>
          ) : null}

          {canShareCatalog ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onShareCatalog()
              }}
              className={sellerCatalogMenuAction}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="shrink-0 sm:h-[18px] sm:w-[18px]">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" x2="12" y1="2" y2="15" />
              </svg>
              <span className="sm:hidden">Compartir</span>
              <span className="hidden sm:inline">Compartir catálogo</span>
            </button>
          ) : null}

          {canChangeTheme ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onChangeTheme()
              }}
              className={sellerCatalogMenuAction}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="shrink-0 sm:h-[18px] sm:w-[18px]">
                <circle cx="13.5" cy="6.5" r="2" />
                <circle cx="17.5" cy="10.5" r="2" />
                <circle cx="8.5" cy="7.5" r="2" />
                <circle cx="6.5" cy="12.5" r="2" />
                <path d="M12 22c4.2 0 7.5-3.4 7.5-7.5 0-1.2-.3-2.4-.8-3.5L12 12l-6.7 1C5.8 14.1 5.5 15.3 5.5 16.5 5.5 18.6 7.4 22 12 22z" />
              </svg>
              <span className="sm:hidden">Tema</span>
              <span className="hidden sm:inline">Cambiar tema</span>
            </button>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`${sellerCatalogMenuTrigger} ${open ? 'border-brand-white/40 bg-brand-white/18' : ''}`}
        aria-label={open ? 'Cerrar opciones del catálogo' : 'Abrir opciones del catálogo'}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
          className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        >
          <circle cx="12" cy="5" r="1.25" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
          <circle cx="12" cy="19" r="1.25" fill="currentColor" stroke="none" />
        </svg>
      </button>
    </div>
  )
}
