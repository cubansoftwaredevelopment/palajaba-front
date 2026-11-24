import { SearchHint, useTypingPlaceholder } from './useTypingPlaceholder.jsx'

const SEARCH_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
)

const ACTION_CLASS =
  'absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-brand-green text-brand-white shadow-[0_4px_12px_rgba(89,128,44,0.28)] touch-manipulation active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40'

function FilterMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5h16l-6.2 7v5l-3.6 2v-7L4 5Z" />
    </svg>
  )
}

export default function SearchBar({
  id,
  value,
  onChange,
  onClear,
  label,
  phrases,
  filter = null,
  onGo = null,
}) {
  const hint = useTypingPlaceholder(phrases)
  const showAction = Boolean(filter || onGo)

  return (
    <div className="relative w-full">
      <label className="sr-only" htmlFor={id}>{label}</label>
      {value && onClear ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Limpiar búsqueda"
          title="Limpiar búsqueda"
          className="absolute left-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-brand-carmelita/70 touch-manipulation active:bg-brand-green/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      ) : (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-green">
          {SEARCH_ICON}
        </span>
      )}
      <input
        id={id}
        type="text"
        inputMode="search"
        enterKeyHint="search"
        value={value}
        onChange={onChange}
        placeholder=""
        autoComplete="off"
        className={`h-12 w-full rounded-full border border-brand-green/15 bg-brand-white pl-9 text-sm text-brand-green shadow-[0_2px_10px_rgba(89,128,44,0.08)] focus:border-brand-green/35 focus:outline-none focus:ring-2 focus:ring-brand-green/10 ${showAction ? 'pr-14' : 'pr-4'}`}
      />
      {value ? null : <SearchHint text={hint} className={`left-9 top-0 h-full ${showAction ? 'right-14' : 'right-4'}`} />}
      {filter ? (
        <button
          type="button"
          onClick={filter.onClick}
          aria-expanded={filter.expanded}
          aria-label={filter.label}
          title={filter.label}
          className={ACTION_CLASS}
        >
          <FilterMark />
          {filter.count > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-yellow px-1 text-[9px] font-bold leading-none text-brand-carmelita">
              {filter.count}
            </span>
          ) : null}
        </button>
      ) : onGo ? (
        <button type="button" onClick={onGo} className={ACTION_CLASS} aria-label="Buscar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      ) : null}
    </div>
  )
}
