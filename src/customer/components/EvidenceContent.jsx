function EvidenceNode({ node }) {
  if (!node) return null
  if (node.type === 'text') {
    let child = node.text || ''
    for (const mark of node.marks || []) {
      if (mark.type === 'bold') child = <strong>{child}</strong>
      else if (mark.type === 'italic') child = <em>{child}</em>
      else if (mark.type === 'strike') child = <s>{child}</s>
    }
    return child
  }
  if (node.type === 'image') return <img src={node.attrs?.src} alt="Imagen de evidencia" className="my-2 max-h-72 rounded-xl object-contain" />
  const children = (node.content || []).map((child, index) => <EvidenceNode key={`${child.type}-${index}`} node={child} />)
  if (node.type === 'paragraph') return <p className="my-2 min-h-4">{children}</p>
  if (node.type === 'heading') return <h4 className="my-2 font-bold">{children}</h4>
  if (node.type === 'bulletList') return <ul className="my-2 list-disc pl-5">{children}</ul>
  if (node.type === 'orderedList') return <ol className="my-2 list-decimal pl-5">{children}</ol>
  if (node.type === 'listItem') return <li>{children}</li>
  if (node.type === 'blockquote') return <blockquote className="my-2 border-l-2 border-brand-green/30 pl-3">{children}</blockquote>
  if (node.type === 'hardBreak') return <br />
  return <>{children}</>
}

export default function EvidenceContent({ content }) {
  return <div className="prose prose-sm max-w-none break-words text-brand-carmelita">{(content?.content || []).map((node, index) => <EvidenceNode key={`${node.type}-${index}`} node={node} />)}</div>
}
