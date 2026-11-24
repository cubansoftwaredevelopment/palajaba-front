export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export const IMAGE_TOO_LARGE_MESSAGE =
  'La foto pesa demasiado. Puedes hacerle captura de pantalla y recortarla para disminuir el peso.'

export const IMAGE_UPLOAD_HINT = 'JPG, PNG o WebP · máx. 5 MB'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function validateImageFile(file) {
  if (!file) {
    return { ok: false, message: 'Selecciona una imagen.' }
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { ok: false, message: 'La imagen debe ser JPG, PNG o WebP.' }
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, message: IMAGE_TOO_LARGE_MESSAGE }
  }

  return { ok: true }
}
