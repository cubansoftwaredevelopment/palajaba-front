import { useEffect, useRef, useState } from 'react'
import Checkbox from '../../components/ui/Checkbox'
import { storePagePublicPath } from '../../lib/storePages'
import { fetchMarketplaceStore } from '../api.js'

const REQUIRED_PAGES = [
  {
    key: 'delivery_policy',
    slug: 'politica-de-entrega',
    phrase: 'la política de entrega',
  },
  {
    key: 'terms',
    slug: 'terminos-y-condiciones',
    phrase: 'los términos y condiciones',
  },
]

function PolicyLink({ page, storeSlug }) {
  const className = 'font-semibold underline underline-offset-2'
  if (!storeSlug) return <span className={className}>{page.phrase}</span>
  return (
    <a
      href={storePagePublicPath(storeSlug, page.slug)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {page.phrase}
    </a>
  )
}

export default function CheckoutStoreAgreements({ storeId, storeSlug, pages, onChange }) {
  const [resolvedPages, setResolvedPages] = useState(pages || null)
  const [slug, setSlug] = useState(storeSlug || '')
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [trackedStoreId, setTrackedStoreId] = useState(storeId)
  const onChangeRef = useRef(onChange)
  if (storeId !== trackedStoreId) {
    setTrackedStoreId(storeId)
    setLoading(true)
    setError('')
    setAccepted(false)
    setResolvedPages(pages || null)
    setSlug(storeSlug || '')
  }

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  function publish(nextAccepted, nextPages, nextLoading, nextError) {
    const needed = REQUIRED_PAGES.filter((page) => nextPages?.[page.key])
    const ready = Boolean(nextPages) && !nextLoading && !nextError && (needed.length === 0 || nextAccepted)
    onChangeRef.current?.({
      delivery_policy: Boolean(nextAccepted && nextPages?.delivery_policy),
      terms: Boolean(nextAccepted && nextPages?.terms),
      ready,
    })
  }

  useEffect(() => {
    let active = true

    async function load() {
      await Promise.resolve()
      if (!active) return
      let nextSlug = storeSlug || ''
      let flags = pages || null
      if ((!flags || !nextSlug) && (storeId || nextSlug)) {
        const store = await fetchMarketplaceStore(storeId || nextSlug)
        nextSlug = store?.store_slug || nextSlug
        flags = flags || store?.store_pages || {}
      }
      if (!active) return
      setSlug(nextSlug)
      setResolvedPages(flags || {})
      setLoading(false)
      publish(false, flags || {}, false, '')
    }

    load().catch(() => {
      if (!active) return
      const message = 'No se pudieron cargar las condiciones de la tienda.'
      setError(message)
      setLoading(false)
      publish(false, pages || {}, false, message)
    })

    return () => {
      active = false
    }
  }, [pages, storeId, storeSlug])

  const required = REQUIRED_PAGES.filter((page) => resolvedPages?.[page.key])

  function toggle(checked) {
    setAccepted(checked)
    publish(checked, resolvedPages, loading, error)
  }

  if (!loading && !error && required.length === 0) return null

  return (
    <div className="rounded-2xl border border-brand-green/15 bg-brand-white px-3 py-3">
      {loading ? <p className="text-sm text-brand-carmelita">Cargando las condiciones de la tienda…</p> : null}
      {error ? <p className="text-sm text-brand-carmelita">{error}</p> : null}
      {!loading && !error ? (
        <div className="flex items-start gap-2.5 text-sm leading-relaxed text-brand-green">
          <Checkbox
            id="accept-store-agreements"
            checked={accepted}
            onChange={(event) => toggle(event.target.checked)}
          />
          <p>
            <label htmlFor="accept-store-agreements" className="cursor-pointer">Acepto </label>
            {required.map((page, index) => (
              <span key={page.key}>
                {index > 0 ? <label htmlFor="accept-store-agreements" className="cursor-pointer"> y </label> : null}
                <PolicyLink page={page} storeSlug={slug} />
              </span>
            ))}
            <label htmlFor="accept-store-agreements" className="cursor-pointer"> de la tienda.</label>
          </p>
        </div>
      ) : null}
      {!loading && !error ? (
        <p className="mt-2 text-xs leading-relaxed text-brand-carmelita">Necesario para pagar por QvaPay. Puedes contactar a la tienda sin aceptarlo.</p>
      ) : null}
    </div>
  )
}
