const SESSION_KEY = 'pala-jaba-marketplace-session'

function getApiBase() {
  const env = import.meta.env
  if (env?.DEV) return ''
  return env?.VITE_API_URL ?? 'http://127.0.0.1:8001'
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '')
  }
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
}

/** Sesión anónima de corta vida (pestaña); sirve para no contar F5 el mismo día. */
export function getMarketplaceSessionId() {
  if (typeof sessionStorage === 'undefined') {
    return createSessionId()
  }

  const existing = sessionStorage.getItem(SESSION_KEY)
  if (existing && existing.length >= 8) {
    return existing
  }

  const next = createSessionId()
  sessionStorage.setItem(SESSION_KEY, next)
  return next
}

export function buildMarketplaceVisitPayload({ provinceId, municipalityId, sessionId } = {}) {
  if (!provinceId || !municipalityId) return null

  return {
    session_id: sessionId || getMarketplaceSessionId(),
    page: 'marketplace',
    province_id: provinceId,
    municipality_id: municipalityId,
  }
}

/** Registra visita al home del marketplace sin bloquear la UI. */
export function recordMarketplaceVisit({ provinceId, municipalityId }) {
  const payload = buildMarketplaceVisitPayload({ provinceId, municipalityId })
  if (!payload) return

  fetch(`${getApiBase()}/api/marketplace/visits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {})
}
