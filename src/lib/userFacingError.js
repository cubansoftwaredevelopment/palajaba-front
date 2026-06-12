/** Mensajes de error amigables — nunca mostrar detalles técnicos al usuario. */

export const NETWORK_ERROR_CODE = 'network_error'

const TECHNICAL_PATTERNS = [
  /^failed to fetch$/i,
  /^network error$/i,
  /^load failed$/i,
  /^error de conexi[oó]n$/i,
  /internal server error/i,
  /unexpected token/i,
  /syntaxerror/i,
  /recurso no encontrado/i,
  /^not found$/i,
  /^bad gateway$/i,
  /^service unavailable$/i,
  /^gateway timeout$/i,
  /^unauthorized$/i,
  /^forbidden$/i,
  /no se pudo subir la imagen a cloudinary/i,
  /cloudinary no devolvi[oó]/i,
  /^error de servidor$/i,
  /^ocurri[oó] un error\. intenta de nuevo\.$/i,
]

export function isNetworkError(err) {
  if (!err) return false
  if (err.code === NETWORK_ERROR_CODE) return true

  const msg = (err.message || '').trim().toLowerCase()
  return (
    msg === 'failed to fetch' ||
    msg === 'network error' ||
    msg === 'load failed' ||
    msg === 'error de conexión' ||
    (err.name === 'TypeError' && (msg.includes('fetch') || msg.includes('network')))
  )
}

export function isTechnicalMessage(message) {
  if (!message?.trim()) return true
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(message.trim()))
}

export function isSessionError(err) {
  const msg = (err?.message || '').toLowerCase()
  return (
    msg.includes('autenticado') ||
    msg.includes('token inv') ||
    msg.includes('credenciales inv') ||
    msg.includes('no autorizado')
  )
}

export function isNotFoundError(err) {
  if (err?.status === 404) return true
  const msg = (err?.message || '').trim().toLowerCase()
  return (
    msg.includes('no encontr') ||
    msg.includes('not found') ||
    msg.includes('no disponible') ||
    msg.includes('no válida')
  )
}

/**
 * Para pantallas y bloques con título, mensaje y opción de reintentar.
 */
export function resolveUserFacingError(err, options = {}) {
  const {
    fallbackTitle = 'Algo salió mal',
    fallbackMessage = 'Ocurrió un error. Intenta de nuevo en un momento.',
    contextTitle = null,
  } = options

  if (isNetworkError(err)) {
    return {
      title: 'Error de conexión',
      message:
        'No pudimos comunicarnos con el servidor. Revisa tu internet e inténtalo de nuevo.',
      canRetry: true,
      isNotFound: false,
    }
  }

  if (isSessionError(err)) {
    return {
      title: 'Sesión expirada',
      message: 'Tu sesión ya no es válida. Vuelve a iniciar sesión para continuar.',
      canRetry: false,
      isNotFound: false,
    }
  }

  const rawMessage = (err?.message || '').trim()

  if (isNotFoundError(err)) {
    return {
      title: contextTitle || 'No encontrado',
      message:
        rawMessage && !isTechnicalMessage(rawMessage)
          ? rawMessage
          : 'No encontramos lo que buscabas.',
      canRetry: false,
      isNotFound: true,
    }
  }

  if (!rawMessage || isTechnicalMessage(rawMessage)) {
    return {
      title: contextTitle || fallbackTitle,
      message: fallbackMessage,
      canRetry: true,
      isNotFound: false,
    }
  }

  return {
    title: contextTitle || null,
    message: rawMessage,
    canRetry: false,
    isNotFound: false,
  }
}

/** Para alertas inline en formularios y modales. */
export function getUserFacingMessage(err, fallbackMessage = 'Ocurrió un error. Intenta de nuevo.') {
  return resolveUserFacingError(err, { fallbackMessage }).message
}
