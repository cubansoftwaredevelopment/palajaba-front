export function matchesStoreQuery(store, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [store.store_name, store.phone, store.transfer_id, store.store_slug]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(q)
}
