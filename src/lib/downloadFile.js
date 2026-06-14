import { isNativeAppShell } from './nativeApp'

function readBlobAsBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('No se pudo leer el archivo'))
        return
      }
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(blob)
  })
}

export async function downloadBlob(blob, filename, mimeType = blob.type || 'application/octet-stream') {
  if (isNativeAppShell()) {
    const base64 = await readBlobAsBase64(blob)
    window.PalaJabaApp.postMessage(
      JSON.stringify({
        action: 'download',
        filename,
        mimeType,
        base64,
      }),
    )
    return
  }

  const url = URL.createObjectURL(blob)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } finally {
    URL.revokeObjectURL(url)
  }
}
