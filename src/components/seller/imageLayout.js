import { clampImageWidth } from '../../lib/storePages.js'

export function imageAlign(attrs) {
  const value = attrs?.textAlign
  return value === 'center' || value === 'right' ? value : 'left'
}

export function imageSharesRow(attrs) {
  return imageAlign(attrs) !== 'center' && clampImageWidth(attrs?.width) < 100
}

const TEXT_GAP = '0.5rem'

export function imageNodeStyle(attrs) {
  const width = clampImageWidth(attrs?.width)
  const align = imageAlign(attrs)
  if (imageSharesRow(attrs)) {
    const float = align === 'right' ? 'right' : 'left'
    const margin = float === 'right' ? `0 0 0.25rem ${TEXT_GAP}` : `0 ${TEXT_GAP} 0.25rem 0`
    return `display:block;width:${width}%;max-width:100%;float:${float};clear:none;margin:${margin};`
  }
  const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
  return `display:flex;width:100%;max-width:100%;float:none;clear:both;justify-content:${justify};margin:0;`
}
