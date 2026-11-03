import Image from '@tiptap/extension-image'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { clampImageWidth, normalizeStoreLink } from '../../lib/storePages.js'
import ResizableImageView from './ResizableImageView.jsx'

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 100,
        parseHTML: (element) => {
          const raw = element.getAttribute('data-width') || String(element.style.width || '').replace('%', '')
          return clampImageWidth(raw)
        },
        renderHTML: (attributes) => {
          const width = clampImageWidth(attributes.width)
          return {
            'data-width': width,
            style: `width: ${width}%`,
          }
        },
      },
      href: {
        default: null,
        parseHTML: (element) => {
          const parent = element.parentElement
          const raw = element.getAttribute('data-href') || (parent?.tagName === 'A' ? parent.getAttribute('href') : '')
          return normalizeStoreLink(raw) || null
        },
        renderHTML: (attributes) => {
          const href = normalizeStoreLink(attributes.href)
          if (!href) return {}
          return { 'data-href': href }
        },
      },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView)
  },
})

export default ResizableImage
