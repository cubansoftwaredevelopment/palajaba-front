import { Link } from 'react-router-dom'
import {
  STORE_PAGES,
  isStorePagePublished,
  storeCopyrightLine,
  storePagePublicPath,
} from '../../lib/storePages'

export default function BuyerStoreServiceFooter({ storeName, storeSlug, pages }) {
  const links = STORE_PAGES.filter((page) => isStorePagePublished(pages, page.key))
  if (!links.length) return null

  return (
    <footer
      className="store-service-footer -mx-5 mt-auto px-5 pb-[max(2rem,var(--safe-bottom))] pt-8 text-brand-carmelita sm:-mx-6 sm:px-8 lg:-mx-10 lg:px-10"
      aria-label="Servicio al cliente"
    >
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-green">
        Servicio al cliente
      </h2>
      <ul className="mt-4 flex flex-col">
        {links.map((page) => (
          <li key={page.key}>
            <Link
              to={storePagePublicPath(storeSlug, page.slug)}
              className="flex min-h-11 items-center text-sm text-brand-carmelita transition-colors touch-manipulation hover:text-brand-green"
            >
              {page.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-center text-xs text-brand-carmelita/70">
        {storeCopyrightLine(storeName)}
      </p>
    </footer>
  )
}
