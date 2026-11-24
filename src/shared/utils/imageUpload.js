export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export const IMAGE_TOO_LARGE_MESSAGE =
  'La foto pesa demasiado. Puedes hacerle captura de pantalla y recortarla para disminuir el peso.'

export const IMAGE_UPLOAD_HINT = 'JPG, PNG o WebP · máx. 5 MB'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const MAX_EDGE = 1600

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

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No pudimos leer la imagen.'))
    }
    image.src = url
  })
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}

async function decodeImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close?.(),
      }
    } catch {
      // El navegador no aceptó la orientación o el formato. Se intenta con Image.
    }
  }
  const image = await loadImage(file)
  return {
    source: image,
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
    close() {},
  }
}

async function convertToWebp(file) {
  const decoded = await decodeImage(file)
  let width = decoded.width
  let height = decoded.height
  const longest = Math.max(width, height)
  if (longest > MAX_EDGE) {
    const scale = MAX_EDGE / longest
    width = Math.max(1, Math.round(width * scale))
    height = Math.max(1, Math.round(height * scale))
  }

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) {
    decoded.close()
    throw new Error('No pudimos preparar la imagen.')
  }

  async function render(nextWidth, nextHeight, quality) {
    canvas.width = nextWidth
    canvas.height = nextHeight
    context.drawImage(decoded.source, 0, 0, nextWidth, nextHeight)
    return canvasToBlob(canvas, 'image/webp', quality)
  }

  let blob
  try {
    blob = await render(width, height, 0.82)
    let quality = 0.82
    while (blob && blob.size > MAX_IMAGE_BYTES && quality > 0.5) {
      quality -= 0.12
      blob = await render(width, height, quality)
    }
    while (blob && blob.size > MAX_IMAGE_BYTES && Math.max(width, height) > 720) {
      width = Math.max(1, Math.round(width * 0.75))
      height = Math.max(1, Math.round(height * 0.75))
      blob = await render(width, height, 0.68)
    }
  } finally {
    decoded.close()
  }
  if (!blob) throw new Error('No pudimos preparar la imagen.')
  const base = String(file.name || 'foto').replace(/\.[^.]+$/, '') || 'foto'
  return new File([blob], `${base}.webp`, { type: 'image/webp', lastModified: Date.now() })
}

export async function prepareUploadImage(file) {
  if (!file) return { ok: false, message: 'Selecciona una imagen.' }
  const type = String(file.type || '')
  if (type && !type.startsWith('image/')) {
    return { ok: false, message: 'La imagen debe ser JPG, PNG o WebP.' }
  }
  try {
    const converted = await convertToWebp(file)
    if (converted.size > MAX_IMAGE_BYTES) {
      return { ok: false, message: IMAGE_TOO_LARGE_MESSAGE }
    }
    return { ok: true, file: converted }
  } catch {
    if (ALLOWED_IMAGE_TYPES.has(type) && file.size <= MAX_IMAGE_BYTES) {
      return { ok: true, file }
    }
    return {
      ok: false,
      message: file.size > MAX_IMAGE_BYTES ? IMAGE_TOO_LARGE_MESSAGE : 'No pudimos preparar la imagen.',
    }
  }
}
