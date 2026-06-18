const CLOUDINARY_UPLOAD_PREFIX = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/i

export function cloudinaryRestHasTransformations(rest) {
  const firstSegment = rest.split('/')[0] ?? ''
  if (/^v\d+$/.test(firstSegment)) return false
  return firstSegment.includes('_') || firstSegment.includes(',')
}

/**
 * Añade transformaciones de entrega (formato/calidad automáticos) a URLs de Cloudinary.
 * No modifica URLs ya transformadas.
 */
export function optimizeCloudinaryUrl(url, { width } = {}) {
  if (!url || !url.includes('res.cloudinary.com')) return url

  const match = url.match(CLOUDINARY_UPLOAD_PREFIX)
  if (!match) return url

  const [, prefix, rest] = match
  if (cloudinaryRestHasTransformations(rest)) return url

  const transforms = ['f_auto', 'q_auto']
  if (width) {
    transforms.push(`w_${width}`, 'c_limit')
  }

  return `${prefix}${transforms.join(',')}/${rest}`
}
