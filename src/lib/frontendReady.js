export const FRONTEND_READY_EVENT = 'pala-jaba-frontend-ready'

export function markFrontendReady() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(FRONTEND_READY_EVENT))
}
