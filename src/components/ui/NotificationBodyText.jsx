const URL_PATTERN =
  /((?:https?:\/\/|www\.)[^\s<]+[^.\s<,;:!?"')\]])/gi

function normalizeHref(raw) {
  const value = String(raw || '').trim()
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  if (/^www\./i.test(value)) return `https://${value}`
  return null
}

/**
 * Renderiza el texto de un aviso preservando saltos de línea y convirtiendo URLs en enlaces.
 */
export default function NotificationBodyText({ text, className = '' }) {
  const content = String(text ?? '')
  if (!content) return null

  const nodes = []
  let lastIndex = 0
  let match
  const pattern = new RegExp(URL_PATTERN.source, URL_PATTERN.flags)

  while ((match = pattern.exec(content)) !== null) {
    const raw = match[0]
    const href = normalizeHref(raw)
    if (match.index > lastIndex) {
      nodes.push(content.slice(lastIndex, match.index))
    }
    if (href) {
      nodes.push(
        <a
          key={`${match.index}-${raw}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all font-semibold text-brand-green underline underline-offset-2"
          onClick={(event) => event.stopPropagation()}
        >
          {raw}
        </a>,
      )
    } else {
      nodes.push(raw)
    }
    lastIndex = match.index + raw.length
  }

  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex))
  }

  return <p className={className}>{nodes.length ? nodes : content}</p>
}
