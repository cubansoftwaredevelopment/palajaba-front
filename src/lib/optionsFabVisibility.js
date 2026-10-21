let present = false
let visible = true
const listeners = new Set()

function emit() {
  const snapshot = { present, visible }
  for (const listener of listeners) listener(snapshot)
}

export function setOptionsFabPresent(nextPresent) {
  const normalized = Boolean(nextPresent)
  if (present === normalized) return
  present = normalized
  if (!present) visible = true
  emit()
}

export function setOptionsFabVisible(nextVisible) {
  const normalized = Boolean(nextVisible)
  if (visible === normalized) return
  visible = normalized
  emit()
}

export function subscribeOptionsFab(listener) {
  listeners.add(listener)
  listener({ present, visible })
  return () => listeners.delete(listener)
}
