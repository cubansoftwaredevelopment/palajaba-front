function easeOutCubic(progress) {
  return 1 - (1 - progress) ** 3
}

export function animateScrollLeft(element, targetLeft, { duration = 560, onComplete } = {}) {
  const startLeft = element.scrollLeft
  const distance = targetLeft - startLeft

  if (Math.abs(distance) < 1) {
    onComplete?.()
    return () => {}
  }

  const startTime = performance.now()
  let frameId = 0

  function step(now) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    element.scrollLeft = startLeft + distance * easeOutCubic(progress)

    if (progress < 1) {
      frameId = requestAnimationFrame(step)
      return
    }

    onComplete?.()
  }

  frameId = requestAnimationFrame(step)

  return () => cancelAnimationFrame(frameId)
}

export function animateScrollTop(element, { duration = 420, onComplete } = {}) {
  if (!element) {
    onComplete?.()
    return () => {}
  }

  const startTop = element.scrollTop
  if (startTop < 1) {
    onComplete?.()
    return () => {}
  }

  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    element.scrollTop = 0
    onComplete?.()
    return () => {}
  }

  const startTime = performance.now()
  let frameId = 0

  function step(now) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    element.scrollTop = startTop * (1 - easeOutCubic(progress))

    if (progress < 1) {
      frameId = requestAnimationFrame(step)
      return
    }

    element.scrollTop = 0
    onComplete?.()
  }

  frameId = requestAnimationFrame(step)

  return () => cancelAnimationFrame(frameId)
}
