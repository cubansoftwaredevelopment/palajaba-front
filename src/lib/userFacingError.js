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
  /^not authenticated$/i,
  /no se pudo subir la imagen a cloudinary/i,
  /cloudinary no devolvi[oó]/i,
  /^error de servidor$/i,
  /^ocurri[oó] un error\. intenta de nuevo\.$/i,
  /is not defined/i,
  /is not a function/i,
  /cannot read propert/i,
  /referenceerror/i,
  /typeerror/i,
  /valueerror/i,
  /field required/i,
  /input should be/i,
  /value is not a valid/i,
  /string should have at least/i,
  /token secret/i,
  /x-api-key/i,
  /traceback/i,
  /objectid/i,
  /mongo/i,
]

const ENGLISH_ERROR_HINTS =
  /\b(failed|unable|cannot|could not|please try|timed? out|unauthorized|forbidden|not found|bad request|too many requests|unexpected|undefined|null|exception|stack|missing|required|invalid json|internal server)\b/i

const SPANISH_COPY_HINTS =
  /\b(no|tu|tú|el|la|los|las|un|una|para|por|con|que|de|del|intenta|inténtalo|pudimos|ocurrió|sesión|correo|teléfono|tienda|producto|pedido|contraseña|revisa)\b|[áéíóúñü¿¡]/i

function looksLikeCode(message) {
  const text = message.trim()
  if (/[{}\[\]]/.test(text)) return true
  if (/^[A-Za-z]*Error\b/.test(text)) return true
  if (/\.(jsx|js|py|tsx):\d+/.test(text)) return true
  if (/https?:\/\//i.test(text) && /error|failed|exception/i.test(text)) return true
  return false
}

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
  const text = message.trim()
  if (TECHNICAL_PATTERNS.some((pattern) => pattern.test(text))) return true
  if (looksLikeCode(text)) return true
  if (ENGLISH_ERROR_HINTS.test(text) && !SPANISH_COPY_HINTS.test(text)) return true
  return false
}

export function isSessionError(err) {
  const msg = (err?.message || '').toLowerCase()
  return (
    msg.includes('autenticado') ||
    msg.includes('token inv') ||
    msg.includes('credenciales inv') ||
    msg.includes('no autorizado') ||
    msg.includes('not authenticated') ||
    msg.includes('not authorized')
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

export function isServerError(err) {
  return typeof err?.status === 'number' && err.status >= 500
}

export function isServiceError(err) {
  return isNetworkError(err) || isServerError(err)
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
      isServiceError: true,
    }
  }

  if (isSessionError(err)) {
    return {
      title: 'Sesión expirada',
      message: 'Tu sesión ya no es válida. Vuelve a iniciar sesión para continuar.',
      canRetry: false,
      isNotFound: false,
      isServiceError: false,
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
      isServiceError: false,
    }
  }

  if (isServerError(err)) {
    return {
      title: 'Servicio no disponible',
      message: 'El servidor no respondió correctamente. Inténtalo de nuevo en un momento.',
      canRetry: true,
      isNotFound: false,
      isServiceError: true,
    }
  }

  if (!rawMessage || isTechnicalMessage(rawMessage)) {
    return {
      title: contextTitle || fallbackTitle,
      message: fallbackMessage,
      canRetry: true,
      isNotFound: false,
      isServiceError: isServerError(err),
    }
  }

  return {
    title: contextTitle || null,
    message: rawMessage,
    canRetry: false,
    isNotFound: false,
    isServiceError: false,
  }
}

/** Para alertas inline en formularios y modales. */
export function getUserFacingMessage(err, fallbackMessage = 'Ocurrió un error. Intenta de nuevo.') {
  return resolveUserFacingError(err, { fallbackMessage }).message
}
