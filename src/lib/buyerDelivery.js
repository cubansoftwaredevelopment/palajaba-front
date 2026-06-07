const STORAGE_KEY = 'pala-jaba-buyer-delivery'

const EMPTY = {
  recipient_name: '',
  address: '',
  phone_primary: '',
  phone_secondary: '',
  notes: '',
}

export function getBuyerDeliveryDefaults() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { ...EMPTY }

  try {
    const parsed = JSON.parse(raw)
    return {
      recipient_name: parsed.recipient_name ?? '',
      address: parsed.address ?? '',
      phone_primary: parsed.phone_primary ?? '',
      phone_secondary: parsed.phone_secondary ?? '',
      notes: parsed.notes ?? '',
    }
  } catch {
    return { ...EMPTY }
  }
}

export function saveBuyerDeliveryDefaults(data) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      recipient_name: data.recipient_name?.trim() ?? '',
      address: data.address?.trim() ?? '',
      phone_primary: data.phone_primary ?? '',
      phone_secondary: data.phone_secondary ?? '',
      notes: data.notes?.trim() ?? '',
    }),
  )
}

export function validateDeliveryForm(form) {
  const recipientName = form.recipient_name?.trim()
  if (!recipientName) return 'Indica quién recibirá el pedido.'

  const address = form.address?.trim()
  if (!address) return 'Indica la dirección de entrega.'

  const phoneDigits = String(form.phone_primary ?? '').replace(/\D/g, '')
  if (phoneDigits.length !== 8) return 'Ingresa un teléfono de contacto válido (8 dígitos).'

  const secondaryDigits = String(form.phone_secondary ?? '').replace(/\D/g, '')
  if (secondaryDigits && secondaryDigits.length !== 8) {
    return 'El teléfono adicional debe tener 8 dígitos.'
  }

  return null
}
