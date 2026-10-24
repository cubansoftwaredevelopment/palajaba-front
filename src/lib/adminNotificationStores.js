export function smsSendCountLabel(count) {
  const n = Number(count) || 0
  return n === 1 ? 'Enviado 1 vez por SMS' : `Enviado ${n} veces por SMS`
}

export function matchesStoreQuery(store, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [store.store_name, store.phone, store.transfer_id, store.store_slug]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(q)
}

export function buildAdminNotificationPayload({ title, content, audiences = [], sellerIds = [] }) {
  const groups = audiences.includes('all')
    ? ['all']
    : audiences.filter((id) => id && id !== 'single')
  const ids = [...new Set(sellerIds.filter(Boolean))]
  let audience = 'single'
  if (groups.includes('all')) audience = 'all'
  else if (groups.length === 1) audience = groups[0]
  else if (groups.length > 1) audience = groups[0]
  return {
    title,
    content,
    audience,
    audiences: groups,
    seller_ids: ids,
    ...(ids.length === 1 && !groups.length ? { seller_id: ids[0] } : {}),
  }
}
