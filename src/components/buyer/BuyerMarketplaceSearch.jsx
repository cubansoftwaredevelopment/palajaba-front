import StatePanel from '../ui/StatePanel'
import LoadingState from '../ui/LoadingState'
import DeadState from '../ui/DeadState'
import BuyerProductCard from './BuyerProductCard'
import { buyerProductGrid, buyerSearchInput } from './buyerStyles'

export default function BuyerMarketplaceSearch({
  categories,
  categoriesLoading,
  query,
  categoryId,
  onQueryChange,
  onCategoryChange,
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,11rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,13rem)]">
      <label className="sr-only" htmlFor="buyer-marketplace-search">
        Buscar productos
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
          placeholder="Buscar productos en tu municipio…"
          className={`${buyerSearchInput} pl-10`}
          autoComplete="off"
        />
      </div>

      <label className="sr-only" htmlFor="buyer-marketplace-category">
        Filtrar por categoría
      </label>
      <select
        id="buyer-marketplace-category"
        value={categoryId}
        onChange={(event) => onCategoryChange(event.target.value)}
        disabled={categoriesLoading}
        className={buyerSearchInput}
      >
        <option value="">Todas las categorías</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
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
