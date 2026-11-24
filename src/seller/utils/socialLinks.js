export const SOCIAL_PLATFORMS = [
  { value: 'instagram', label: 'Instagram', placeholder: 'tu_tienda' },
  { value: 'facebook', label: 'Facebook', placeholder: 'tu.pagina' },
  { value: 'tiktok', label: 'TikTok', placeholder: 'tu_tienda' },
  { value: 'youtube', label: 'YouTube', placeholder: '@tucanal o enlace' },
  { value: 'telegram', label: 'Telegram', placeholder: 'tu_usuario' },
  { value: 'x', label: 'X', placeholder: 'tu_usuario' },
  { value: 'other', label: 'Otra', placeholder: 'https://…' },
]

export const SOCIAL_LINK_LIMIT = 12

export function createSocialLink(partial = {}) {
  return {
    id: crypto.randomUUID(),
    platform: partial.platform || 'instagram',
    label: partial.label || '',
    value: partial.value || '',
  }
}

export function socialLinksFromProfile(source) {
  const stored = Array.isArray(source?.social_links) ? source.social_links : null
  if (stored) {
    return stored
      .filter((link) => link?.value && link.platform !== 'whatsapp')
      .map((link) =>
        createSocialLink({
          platform: link.platform,
          label: link.label || '',
          value: link.value,
        }),
      )
  }

  const links = []
  if (source?.social_instagram) {
    links.push(createSocialLink({ platform: 'instagram', value: source.social_instagram }))
  }
  if (source?.social_facebook) {
    links.push(createSocialLink({ platform: 'facebook', value: source.social_facebook }))
  }
  return links
}

export function socialLinksPayload(links) {
  return links
    .map((link) => ({
      platform: link.platform,
      label: link.platform === 'other' ? link.label.trim() : null,
      value: link.value.trim(),
    }))
    .filter((link) => link.value)
}

export function socialLinksSignature(links) {
  return JSON.stringify(socialLinksPayload(links))
}

export function socialLinksError(links) {
  const filled = socialLinksPayload(links)
  if (filled.some((link) => link.platform === 'other' && !link.label)) {
    return 'Escribe el nombre de cada red social personalizada.'
  }
  return ''
}

export function socialLinkLabel(link) {
  if (link.platform === 'other') return link.label?.trim() || 'Enlace'
  return SOCIAL_PLATFORMS.find((item) => item.value === link.platform)?.label || 'Enlace'
}

export function socialLinkUrl(link) {
  const value = link.value?.trim()
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value

  const handle = value.replace(/^@/, '')
  if (!handle) return null

  switch (link.platform) {
    case 'instagram':
      return `https://instagram.com/${handle}`
    case 'facebook':
      return `https://facebook.com/${handle}`
    case 'tiktok':
      return `https://www.tiktok.com/@${handle}`
    case 'youtube':
      return `https://www.youtube.com/@${handle}`
    case 'telegram':
      return `https://t.me/${handle}`
    case 'x':
      return `https://x.com/${handle}`
    default:
      return `https://${handle}`
  }
}
