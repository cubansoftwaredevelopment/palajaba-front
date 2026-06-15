import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { sellerChip, sellerFocusRing, sellerInput, sellerModalInput } from './sellerStyles'

function normalizeQuery(value) {
  return value.trim().toLowerCase()
}

export default function CategoryAutocomplete({
  id,
  categories = [],
  value,
  onChange,
  multiple = false,
  placeholder = 'Buscar categoría…',
  disabled = false,
  emptyLabel = 'Sin coincidencias',
  dropdownZIndex = 60,
  useModalInput = false,
}) {
  const listId = useId()
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [queryTouched, setQueryTouched] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [dropdownStyle, setDropdownStyle] = useState(null)

  const inputClassName = useModalInput ? sellerModalInput : sellerInput

  const selectedIds = useMemo(() => {
    if (multiple) return Array.isArray(value) ? value : []
    return value ? [value] : []
  }, [multiple, value])

  const selectedCategories = useMemo(
    () => categories.filter((category) => selectedIds.includes(category.id)),
    [categories, selectedIds],
  )

  const filteredCategories = useMemo(() => {
    const pool = multiple
      ? categories.filter((category) => !selectedIds.includes(category.id))
      : categories

    const shouldFilter = multiple || queryTouched
    const normalized = shouldFilter ? normalizeQuery(query) : ''

    if (!normalized) return pool
    return pool.filter((category) => category.name.toLowerCase().includes(normalized))
  }, [categories, multiple, query, queryTouched, selectedIds])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, open, filteredCategories.length])

  useEffect(() => {
    if (!open) return undefined

    function updatePosition() {
      const input = inputRef.current
      if (!input) return
      const rect = input.getBoundingClientRect()
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: dropdownZIndex,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, dropdownZIndex])

  useEffect(() => {
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
        setQuery('')
        setQueryTouched(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  function openList() {
    if (disabled || categories.length === 0) return
    setOpen(true)
    if (!multiple) {
      setQuery('')
      setQueryTouched(false)
    }
  }

  function selectCategory(category) {
    if (multiple) {
      onChange([...selectedIds, category.id])
      setQuery('')
      inputRef.current?.focus()
      return
    }

    onChange(category.id)
    setQuery('')
    setQueryTouched(false)
    setOpen(false)
    inputRef.current?.blur()
  }

  function removeCategory(categoryId) {
    if (!multiple) return
    onChange(selectedIds.filter((item) => item !== categoryId))
  }

  function handleInputChange(event) {
    setQueryTouched(true)
    setQuery(event.target.value)
    if (!open) setOpen(true)
  }

  function handleKeyDown(event) {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      event.preventDefault()
      openList()
      return
    }

    if (!open) return

    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      setQuery('')
      setQueryTouched(false)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => Math.min(current + 1, filteredCategories.length - 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
      return
    }

    if (event.key === 'Enter' && filteredCategories[activeIndex]) {
      event.preventDefault()
      selectCategory(filteredCategories[activeIndex])
    }
  }

  const inputValue = multiple
    ? query
    : open
      ? queryTouched
        ? query
        : selectedCategories[0]?.name ?? ''
      : selectedCategories[0]?.name ?? ''

  return (
    <div ref={rootRef} className="relative">
      {multiple && selectedCategories.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedCategories.map((category) => (
            <span key={category.id} className={`inline-flex items-center gap-1 ${sellerChip(true)}`}>
              {category.name}
              <button
                type="button"
                onClick={() => removeCategory(category.id)}
                className="rounded-full p-0.5 text-brand-white/90 touch-manipulation hover:text-brand-white"
                aria-label={`Quitar ${category.name}`}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M3 3l6 6M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && filteredCategories[activeIndex]
              ? `${listId}-option-${filteredCategories[activeIndex].id}`
              : undefined
          }
          value={inputValue}
          onChange={handleInputChange}
          onFocus={(event) => {
            openList()
            if (!multiple) {
              requestAnimationFrame(() => event.target.select())
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || categories.length === 0}
          className={`${inputClassName} pr-9 ${sellerFocusRing}`}
          autoComplete="off"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-brand-carmelita/70">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </div>

      {open && dropdownStyle && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Categorías"
          style={dropdownStyle}
          className="max-h-44 overflow-y-auto rounded-xl border border-brand-green/15 bg-brand-white py-1 shadow-[0_12px_32px_rgba(89,128,44,0.18)]"
        >
          {filteredCategories.length === 0 ? (
            <li className="px-3 py-2 text-xs text-brand-carmelita/80">{emptyLabel}</li>
          ) : (
            filteredCategories.map((category, index) => {
              const active = index === activeIndex
              const selected = selectedIds.includes(category.id)
              return (
                <li
                  key={category.id}
                  id={`${listId}-option-${category.id}`}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectCategory(category)}
                  className={`cursor-pointer px-3 py-2 text-sm touch-manipulation ${
                    active ? 'bg-brand-green/10 text-brand-green' : 'text-brand-green'
                  } ${selected ? 'font-semibold' : ''}`}
                >
                  {category.name}
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
