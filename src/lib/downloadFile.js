import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
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

function safeFileName(filename) {
  const cleaned = String(filename || 'documento.pdf').replace(/[^\w.\-]+/g, '_')
  return cleaned.toLowerCase().endsWith('.pdf') ? cleaned : `${cleaned}.pdf`
}

function isShareCancel(error) {
  const message = String(error?.message || error || '').toLowerCase()
  return message.includes('cancel') || message.includes('abort')
}

async function downloadBlobOnCapacitor(blob, filename) {
  const path = safeFileName(filename)
  const data = await readBlobAsBase64(blob)
  await Filesystem.writeFile({
    path,
    data,
    directory: Directory.Cache,
  })
  const { uri } = await Filesystem.getUri({
    path,
    directory: Directory.Cache,
  })
  try {
    await Share.share({
      title: filename,
      files: [uri],
      dialogTitle: 'Abrir o guardar',
    })
  } catch (error) {
    if (isShareCancel(error)) return
    throw error
  }
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

  if (Capacitor.isNativePlatform()) {
    await downloadBlobOnCapacitor(blob, filename)
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
    window.setTimeout(() => URL.revokeObjectURL(url), 1500)
  }
}
