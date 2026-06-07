import { createPortal } from 'react-dom'

export default function BuyerModalPortal({ children }) {
  if (typeof document === 'undefined') return null
  return createPortal(children, document.body)
}
