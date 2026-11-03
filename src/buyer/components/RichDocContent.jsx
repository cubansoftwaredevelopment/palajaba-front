import { resolveMediaUrl } from '../../lib/media'
import { clampImageWidth, normalizeStoreLink } from '../../lib/storePages'

const HEADING_CLASS = {
  1: 'my-3 font-display text-2xl font-bold leading-tight text-brand-green',
  2: 'my-3 font-display text-xl font-bold leading-tight text-brand-green',
  3: 'my-2 font-display text-lg font-semibold text-brand-green',
  4: 'my-2 text-base font-semibold text-brand-green',
}

function textColor(mark) {
  const color = mark?.attrs?.color
  return typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color) ? color : ''
}

function SafeLink({ href, className, style, children }) {
  const safe = normalizeStoreLink(href)
  if (!safe) return children
  const external = safe.startsWith('http://') || safe.startsWith('https://')
  return (
    <a
      href={safe}
      className={className}
      style={style}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  )
}

function RichMark({ mark, children }) {
  if (mark?.type === 'bold') return <strong>{children}</strong>
  if (mark?.type === 'italic') return <em>{children}</em>
  if (mark?.type === 'strike') return <s>{children}</s>
  if (mark?.type === 'underline') return <u>{children}</u>
  const color = textColor(mark)
  if (mark?.type === 'textStyle' && color) return <span style={{ color }}>{children}</span>
  if (mark?.type === 'link') {
    return (
      <SafeLink href={mark.attrs?.href} className="font-semibold text-brand-green underline underline-offset-2">
        {children}
      </SafeLink>
    )
  }
  return children
}

function blockAlign(node) {
  const value = node.attrs?.textAlign
  if (value === 'center' || value === 'right') return { textAlign: value }
  return undefined
}

function RichDocNode({ node }) {
  if (!node) return null
  if (node.type === 'text') {
    let child = node.text || ''
    for (const mark of node.marks || []) child = <RichMark mark={mark}>{child}</RichMark>
    return child
  }
  if (node.type === 'hardBreak') return <br />
  if (node.type === 'image') {
    const src = resolveMediaUrl(node.attrs?.src)
    if (!src) return null
    const width = clampImageWidth(node.attrs?.width)
    const align = node.attrs?.textAlign === 'center' || node.attrs?.textAlign === 'right' ? node.attrs.textAlign : 'left'
    const besideText = align !== 'center' && width < 100
    const frameStyle = {
      width: `${width}%`,
      float: besideText ? (align === 'right' ? 'right' : 'left') : undefined,
      marginLeft: besideText ? (align === 'right' ? '1rem' : 0) : align === 'center' ? 'auto' : 0,
      marginRight: besideText ? (align === 'left' ? '1rem' : 0) : align === 'center' ? 'auto' : 0,
    }
    const image = (
      <img
        src={src}
        alt={node.attrs?.alt || ''}
        style={{ width: '100%', height: 'auto', maxWidth: '100%', minWidth: 0 }}
        className="block rounded-lg"
      />
    )
    const href = normalizeStoreLink(node.attrs?.href)
    const frameClass = besideText ? 'my-1' : 'my-3 block'
    if (!href) return <span className={frameClass} style={frameStyle}>{image}</span>
    return <SafeLink href={href} className={frameClass} style={frameStyle}>{image}</SafeLink>
  }

  const children = (node.content || []).map((child, index) => (
    <RichDocNode key={`${child.type}-${index}`} node={child} />
  ))
  if (node.type === 'paragraph') return <p className="my-2 min-h-4 whitespace-pre-wrap" style={blockAlign(node)}>{children}</p>
  if (node.type === 'heading') {
    const level = Number(node.attrs?.level)
    const Tag = level === 1 ? 'h1' : level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4'
    return <Tag className={HEADING_CLASS[level] || HEADING_CLASS[4]} style={blockAlign(node)}>{children}</Tag>
  }
  if (node.type === 'bulletList') return <ul className="my-2 list-disc pl-5">{children}</ul>
  if (node.type === 'orderedList') return <ol className="my-2 list-decimal pl-5">{children}</ol>
  if (node.type === 'listItem') return <li>{children}</li>
  if (node.type === 'blockquote') return <blockquote className="my-2 border-l-2 border-brand-green/30 pl-3">{children}</blockquote>
  return null
}

export default function RichDocContent({ content }) {
  return (
    <div className="flow-root max-w-none break-words text-sm leading-relaxed text-brand-carmelita">
      {(content?.content || []).map((node, index) => (
        <RichDocNode key={`${node.type}-${index}`} node={node} />
      ))}
    </div>
  )
}
