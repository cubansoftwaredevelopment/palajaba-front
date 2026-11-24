function getApiBase() {
  if (import.meta.env.DEV) return ''
  return import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8001'
}

/** Registra una visita al perfil de la tienda sin bloquear la UI. */
export function recordStoreProfileView(storeSlug, { provinceId, municipalityId }) {
  if (!storeSlug || !provinceId || !municipalityId) return

  const params = new URLSearchParams({
    province_id: provinceId,
    municipality_id: municipalityId,
  })

  fetch(
    `${getApiBase()}/api/marketplace/stores/${encodeURIComponent(storeSlug)}/view?${params}`,
    {
      method: 'POST',
      keepalive: true,
    },
  ).catch(() => {})
}
