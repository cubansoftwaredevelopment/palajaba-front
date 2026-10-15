import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import StatePanel from '../ui/StatePanel'
import LoadingState from '../ui/LoadingState'
import DeadState from '../ui/DeadState'
import BuyerProductCard from './BuyerProductCard'
import BuyerBusinessCard from './BuyerBusinessCard'
import { buyerBusinessList, buyerProductGrid, buyerSearchInput } from './buyerStyles'

function BuyerCategorySelect({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
}) {
  const listId = useId()
  const rootRef = useRef(null)
  const panelRef = useRef(null)
  const triggerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const selectedIndex = options.findIndex((option) => option.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : options[0]

  useEffect(() => {
    if (!open) return undefined

    function updatePosition() {
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const openUp = spaceBelow < 220 && rect.top > spaceBelow
      setPanelStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        zIndex: 40,
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + 6 }
          : { top: rect.bottom + 6 }),
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    function handlePointerDown(event) {
      const target = event.target
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
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

  function openList() {
    if (disabled) return
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }

  function choose(option) {
    onChange(option.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  function handleTriggerKeyDown(event) {
    if (disabled) return
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!open) openList()
      else if (event.key === 'ArrowDown') {
        setActiveIndex((current) => Math.min(options.length - 1, current + 1))
      } else if (options[activeIndex]) {
        choose(options[activeIndex])
      }
      return
    }
    if (!open) return
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(0, current - 1))
    }
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleTriggerKeyDown}
        className={`${buyerSearchInput} flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
      >
        <span className="truncate font-semibold text-brand-green">{selected?.label}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`shrink-0 text-brand-carmelita/70 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && panelStyle
        ? createPortal(
            <ul
              ref={panelRef}
              id={listId}
              role="listbox"
              aria-label={label}
              style={panelStyle}
              className="max-h-64 overflow-y-auto rounded-2xl border border-brand-green/15 bg-brand-white py-1 shadow-[0_12px_32px_rgba(89,128,44,0.16)]"
            >
              {options.map((option, index) => {
                const active = index === activeIndex
                const isSelected = option.value === value
                return (
                  <li key={option.value || 'all'} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => choose(option)}
                      className={`flex w-full px-4 py-2.5 text-left text-sm text-brand-green touch-manipulation ${
                        active || isSelected
                          ? 'bg-brand-green/10 font-semibold'
                          : 'active:bg-brand-yellow/15 lg:hover:bg-brand-green/[0.04]'
                      }`}
                    >
                      {option.label}
                    </button>
                  </li>
                )
              })}
            </ul>,
            document.body,
          )
        : null}
    </div>
  )
}

export default function BuyerMarketplaceSearch({
  categories,
  categoriesLoading,
  query,
  categoryId,
  onQueryChange,
  onCategoryChange,
  searchLabel = 'Buscar productos',
  searchPlaceholder = 'Buscar productos en tu municipio…',
  categoryLabel = 'Filtrar por categoría',
  allCategoriesLabel = 'Todas las categorías',
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,11rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,13rem)]">
      <label className="sr-only" htmlFor="buyer-marketplace-search">
        {searchLabel}
      </label>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-carmelita/45"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          id="buyer-marketplace-search"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchPlaceholder}
          className={`${buyerSearchInput} pl-10`}
          autoComplete="off"
        />
      </div>

      <BuyerCategorySelect
        id="buyer-marketplace-category"
        label={categoryLabel}
        value={categoryId}
        disabled={categoriesLoading}
        onChange={onCategoryChange}
        options={[
          { value: '', label: allCategoriesLabel },
          ...categories.map((category) => ({ value: category.id, label: category.name })),
        ]}
      />
    </div>
  )
}

export function useMarketplaceSearchActive(query, categoryId) {
  return query.trim().length >= 2 || Boolean(categoryId)
}

export function BuyerSearchResults({
  loading,
  error,
  results,
  onLoadMore,
  loadingMore,
  onRetry,
  retrying = false,
  emptyNotice = null,
  emptyMessage = 'Prueba con otra palabra o cambia la categoría.',
}) {
  const products = results?.products ?? []
  const hasMore = results?.has_more ?? false

  if (loading) {
    return <LoadingState message="Buscando productos…" className="lg:items-start lg:text-left" />
  }

  if (error) {
    return (
      <StatePanel
        variant="buyer"
        title={error.title}
        message={error.message}
        serviceError={error.isServiceError}
        onRetry={error.canRetry !== false ? onRetry : undefined}
        retrying={retrying}
      />
    )
  }

  if (!products.length) {
    return (
      <div>
        <DeadState
          variant="panel"
          title="Sin resultados"
          message={emptyMessage}
          className="lg:items-start lg:text-left"
        />
        {emptyNotice ? <div className="mt-4 flex justify-center lg:justify-start">{emptyNotice}</div> : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold text-brand-carmelita/80">
        {results.total_products} producto{results.total_products === 1 ? '' : 's'} encontrado
        {results.total_products === 1 ? '' : 's'}
      </p>
      <div className={buyerProductGrid}>
        {products.map((product) => (
          <BuyerProductCard key={product.id} product={product} />
        ))}
      </div>
      {hasMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="mx-auto min-h-10 rounded-full border border-brand-green/20 bg-brand-white px-5 text-sm font-semibold text-brand-green transition-colors touch-manipulation active:bg-brand-yellow/10 disabled:opacity-60 lg:mx-0"
        >
          {loadingMore ? 'Cargando…' : 'Ver más resultados'}
        </button>
      ) : null}
    </div>
  )
}

export function BuyerBusinessSearchResults({
  loading,
  error,
  results,
  onLoadMore,
  loadingMore,
  onRetry,
  retrying = false,
}) {
  const businesses = results?.businesses ?? []
  const hasMore = results?.has_more ?? false

  if (loading) {
    return <LoadingState message="Buscando negocios…" className="lg:items-start lg:text-left" />
  }

  if (error) {
    return (
      <StatePanel
        variant="buyer"
        title={error.title}
        message={error.message}
        serviceError={error.isServiceError}
        onRetry={error.canRetry !== false ? onRetry : undefined}
        retrying={retrying}
      />
    )
  }

  if (!businesses.length) {
    return (
      <DeadState
        variant="panel"
        title="Sin resultados"
        message="Prueba con otra palabra o cambia la categoría."
        className="lg:items-start lg:text-left"
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className={buyerBusinessList}>
        {businesses.map((business) => (
          <BuyerBusinessCard key={business.store.id} business={business} />
        ))}
      </div>
      {hasMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="mx-auto min-h-10 rounded-full border border-brand-green/20 bg-brand-white px-5 text-sm font-semibold text-brand-green transition-colors touch-manipulation active:bg-brand-yellow/10 disabled:opacity-60 lg:mx-0"
        >
          {loadingMore ? 'Cargando…' : 'Ver más resultados'}
        </button>
      ) : null}
    </div>
  )
}
