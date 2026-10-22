import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { adminFocusRing } from './adminStyles'
import { storePublicPath } from '../../lib/storeSlug'

const MENU_WIDTH = 240

function menuItemClass(danger = false) {
  return `flex w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${adminFocusRing} ${
    danger
      ? 'text-orange-200 hover:bg-brand-carmelita/15'
      : 'text-zinc-100 hover:bg-zinc-800'
  }`
}

export default function RegistrationActionsMenu({
  item,
  open,
  onToggle,
  onClose,
  onApprove,
  onReject,
  onEditSubscription,
  onEditPayment,
  onRenew,
  onDelete,
}) {
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const [place, setPlace] = useState(null)
  const publicCatalogPath =
    item.status === 'approved' && item.profile_completed ? storePublicPath(item.store_slug) : null

  useEffect(() => {
    if (!open || !buttonRef.current) {
      setPlace(null)
      return undefined
    }

    function updatePlace() {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const spaceAbove = rect.top
      const openAbove = spaceAbove > 220
      const left = Math.min(
        Math.max(8, rect.right - MENU_WIDTH),
        window.innerWidth - MENU_WIDTH - 8,
      )
      setPlace(
        openAbove
          ? { left, bottom: window.innerHeight - rect.top + 8 }
          : { left, top: rect.bottom + 8 },
      )
    }

    updatePlace()
    window.addEventListener('resize', updatePlace)
    window.addEventListener('scroll', updatePlace, true)
    return () => {
      window.removeEventListener('resize', updatePlace)
      window.removeEventListener('scroll', updatePlace, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    function handleKey(event) {
      if (event.key === 'Escape') onClose()
    }
    function handlePointer(event) {
      const target = event.target
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return
      onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('pointerdown', handlePointer)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('pointerdown', handlePointer)
    }
  }, [open, onClose])

  const host = typeof document === 'undefined' ? null : document.querySelector('.admin-theme')

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700/80 bg-zinc-800/80 text-zinc-200 transition-colors hover:border-brand-green/30 hover:bg-brand-green/10 hover:text-brand-white ${adminFocusRing}`}
        aria-label="Acciones"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={onToggle}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14.7 6.3a4.5 4.5 0 0 0-6.2 6.2L3 18l3 3 5.5-5.5a4.5 4.5 0 0 0 6.2-6.2l-2.9 2.9-2.1-2.1 2.9-2.9z" />
        </svg>
      </button>
      {open && place && host
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              className="fixed z-50 rounded-xl border border-brand-green/20 bg-[var(--admin-header)] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
              style={{ width: MENU_WIDTH, ...place }}
            >
              {item.status === 'pending' ? (
                <>
                  <button type="button" role="menuitem" className={menuItemClass()} onClick={() => onApprove(item)}>
                    Aprobar
                  </button>
                  <button type="button" role="menuitem" className={menuItemClass(true)} onClick={() => onReject(item)}>
                    Rechazar
                  </button>
                </>
              ) : null}
              {item.status === 'approved' ? (
                <>
                  {publicCatalogPath ? (
                    <button
                      type="button"
                      role="menuitem"
                      className={menuItemClass()}
                      onClick={() => {
                        window.open(publicCatalogPath, '_blank', 'noopener,noreferrer')
                        onClose()
                      }}
                    >
                      Ver catálogo público
                    </button>
                  ) : (
                    <p className="px-3 py-2 text-xs leading-relaxed text-zinc-400">
                      El catálogo público aparece cuando el vendedor complete su perfil.
                    </p>
                  )}
                  <button type="button" role="menuitem" className={menuItemClass()} onClick={() => onEditPayment(item)}>
                    {item.payment_amount_cup != null ? 'Editar monto pagado' : 'Registrar monto pagado'}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className={menuItemClass()}
                    onClick={() => onEditSubscription(item)}
                  >
                    Editar plan y suscripción
                  </button>
                  <button type="button" role="menuitem" className={menuItemClass()} onClick={() => onRenew(item)}>
                    Renovar suscripción
                  </button>
                </>
              ) : null}
              {item.status === 'expired' ? (
                <button type="button" role="menuitem" className={menuItemClass()} onClick={() => onRenew(item)}>
                  Renovar suscripción
                </button>
              ) : null}
              <div className="my-1 border-t border-zinc-800" />
              <button type="button" role="menuitem" className={menuItemClass(true)} onClick={() => onDelete(item)}>
                Eliminar tienda
              </button>
            </div>,
            host,
          )
        : null}
    </>
  )
}
