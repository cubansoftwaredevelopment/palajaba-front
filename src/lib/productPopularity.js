function getApiBase() {
  if (import.meta.env.DEV) return ''
  return import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8001'
}

/** Registra interacción sin bloquear la UI (view: +1, jaba: +2). */
export function recordProductPopularity(productId, event) {
  if (!productId || !event) return

  fetch(`${getApiBase()}/api/marketplace/products/${encodeURIComponent(productId)}/popularity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event }),
    keepalive: true,
  }).catch(() => {})
}
