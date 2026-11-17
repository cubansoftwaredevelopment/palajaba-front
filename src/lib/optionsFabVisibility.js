let present = false
let visible = true
let helpPresent = false
const listeners = new Set()

function emit() {
  const snapshot = { present, visible, helpPresent }
  for (const listener of listeners) listener(snapshot)
}

export function setOptionsFabPresent(nextPresent) {
  const normalized = Boolean(nextPresent)
  if (present === normalized) return
  present = normalized
  if (!present) visible = true
  emit()
}

export function setHelpFabPresent(nextPresent) {
  const normalized = Boolean(nextPresent)
  if (helpPresent === normalized) return
  helpPresent = normalized
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
