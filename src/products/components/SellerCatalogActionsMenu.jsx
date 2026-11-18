import { createPortal } from 'react-dom'

const ACTIONS = [
  {
    id: 'category',
    label: 'Categoría',
    show: (props) => typeof props.onAddCategory === 'function',
    run: (props) => props.onAddCategory(),
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 6h16M4 12h10M4 18h6" />
      </svg>
    ),
  },
  {
    id: 'product',
    label: 'Producto',
    show: (props) => typeof props.onAddProduct === 'function',
    run: (props) => props.onAddProduct(),
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    id: 'reorder',
    label: 'Organizar',
    show: (props) => props.canReorderCategories,
    run: (props) => props.onReorderCategories(),
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
  },
  {
    id: 'share',
    label: 'Compartir',
    show: (props) => props.canShareCatalog,
    run: (props) => props.onShareCatalog(),
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" x2="12" y1="2" y2="15" />
      </svg>
    ),
  },
  {
    id: 'theme',
    label: 'Tema',
    show: (props) => props.canChangeTheme,
    run: (props) => props.onChangeTheme(),
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="13.5" cy="6.5" r="2" />
        <circle cx="17.5" cy="10.5" r="2" />
        <circle cx="8.5" cy="7.5" r="2" />
        <circle cx="6.5" cy="12.5" r="2" />
        <path d="M12 22c4.2 0 7.5-3.4 7.5-7.5 0-1.2-.3-2.4-.8-3.5L12 12l-6.7 1C5.8 14.1 5.5 15.3 5.5 16.5 5.5 18.6 7.4 22 12 22z" />
      </svg>
    ),
  },
]

export default function SellerCatalogActionsMenu(props) {
  const actions = ACTIONS.filter((action) => action.show(props))
  if (!actions.length) return null

  return createPortal(
    <div
      className="fixed inset-x-3 z-40 bottom-[calc(4.75rem+var(--safe-bottom)+0.45rem)] lg:bottom-6 lg:left-[calc(14rem+1.5rem)] lg:right-8 xl:left-[calc(15rem+1.5rem)]"
      role="toolbar"
      aria-label="Acciones del catálogo"
    >
      <div className="mx-auto flex w-full max-w-xl items-stretch gap-1 overflow-x-auto rounded-2xl border border-brand-green/12 bg-brand-white/95 p-1.5 shadow-[0_10px_28px_rgba(89,128,44,0.16)] backdrop-blur-md">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => action.run(props)}
            className="flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-[0.7rem] font-semibold text-brand-green touch-manipulation active:bg-brand-yellow/30"
          >
            {action.icon}
            <span className="truncate">{action.label}</span>
          </button>
        ))}
      </div>
    </div>,
    document.body,
  )
}
