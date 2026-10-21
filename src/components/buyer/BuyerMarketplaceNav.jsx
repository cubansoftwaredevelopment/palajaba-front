import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { matchPath, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { fetchMarketplaceFeed, fetchRenewalContactPhone } from '../../lib/api'
import { isAdminAuthenticated } from '../../lib/adminAuth'
import { useBuyerDisplayCurrency } from '../../context/BuyerDisplayCurrencyContext'
import { getAdditionalMunicipalities, getBuyerLocation, setMarketplaceCategoryFilter } from '../../lib/buyerLocation'
import { marketplaceCategoryPath, resolveMarketplaceCategory, storeCategoryPath } from '../../lib/marketplaceCategory'
import { storeGestorPublicPath, storePublicPath } from '../../lib/storeSlug'
import { isSellerAuthenticated } from '../../lib/sellerAuth'
import { buildWhatsAppUrl } from '../../lib/whatsappOrder'
import { openExternalUrl } from '../../lib/nativeApp'
import { useDismissibleModal } from './useOrderModalPresence'
import { setOptionsFabPresent, setOptionsFabVisible } from '../../lib/optionsFabVisibility'

export const MARKETPLACE_CATEGORY_EVENT = 'pala-jaba-marketplace-category'

const HELP_MESSAGE = 'Hola tengo un problema'

const optionClass =
  'relative inline-flex text-brand-carmelita touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/35 disabled:cursor-not-allowed disabled:opacity-40'

const MAIN_RADIUS = 118

function arcPoint(index, count, radius) {
  const start = Math.PI
  const end = Math.PI / 2
  const t = count <= 1 ? 0.5 : index / (count - 1)
  const angle = start + (end - start) * t
  return {
    x: Math.cos(angle) * radius,
    y: -Math.sin(angle) * radius,
  }
}

const MAIN_POINTS = [0, 1, 2].map((index) => arcPoint(index, 3, MAIN_RADIUS))
const ORIGIN = { x: 0, y: 0 }

const optionIconClass =
  'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-white shadow-[0_8px_18px_rgba(89,128,44,0.18)]'

const LIVES = [
  { icon: ['ghost-drift-a', '3.8s', '-0.6s'], label: ['ghost-drift-b', '5.4s', '-2.2s'], fade: ['4.3s', '-1.1s'] },
  { icon: ['ghost-drift-c', '2.9s', '-1.5s'], label: ['ghost-drift-a', '4.7s', '-0.2s'], fade: ['3.2s', '-2.6s'] },
  { icon: ['ghost-drift-b', '4.6s', '-3.1s'], label: ['ghost-drift-c', '3.3s', '-1.8s'], fade: ['5.7s', '-0.4s'] },
]

function lifeFor(index) {
  const base = LIVES[index % LIVES.length]
  return {
    icon: [base.icon[0], base.icon[1], `-${(index * 0.67).toFixed(2)}s`],
    label: [base.label[0], base.label[1], `-${(index * 1.13).toFixed(2)}s`],
    fade: [base.fade[0], `-${(index * 0.41).toFixed(2)}s`],
  }
}

function driftStyle(open, spec, fade) {
  if (!open) return { animation: 'none' }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return { animation: 'none' }
  }
  const [name, duration, delay] = spec
  const fadePart = fade ? `, ghost-fade ${fade[0]} ease-in-out ${fade[1]} infinite` : ''
  return { animation: `${name} ${duration} ease-in-out ${delay} infinite${fadePart}` }
}

function ArcOption({ open, from, to, index, children }) {
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const place = open ? to : from
  return (
    <div
      className="absolute top-1/2 left-1/2 z-0"
      inert={open ? undefined : true}
      aria-hidden={open ? undefined : true}
      style={{
        opacity: open ? 1 : 0,
        filter: reduceMotion || open ? 'blur(0px)' : 'blur(6px)',
        transform: `translate(calc(-50% + ${place.x}px), calc(-50% + ${place.y}px))`,
        transition: reduceMotion ? 'none' : 'transform 220ms linear, opacity 160ms ease, filter 160ms ease',
        transitionDelay: open && !reduceMotion ? `${index * 16}ms` : '0ms',
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  )
}

function OptionLabel({ open, life, children }) {
  return (
    <span className="pointer-events-none absolute bottom-[calc(100%+0.3rem)] left-1/2 w-max -translate-x-1/2">
      <span
        className="inline-block whitespace-nowrap rounded-full bg-brand-white/95 px-2.5 py-1 text-xs font-semibold text-brand-green shadow-[0_4px_12px_rgba(89,128,44,0.12)] motion-reduce:animate-none"
        style={driftStyle(open, life.label, life.fade)}
      >
        {children}
      </span>
    </span>
  )
}

function OptionIcon({ open, life, className, children }) {
  return (
    <span className={`${className} motion-reduce:animate-none`} style={driftStyle(open, life.icon)}>
      {children}
    </span>
  )
}

function CategoryModal({ categories, loading, selectedId, onClose: requestClose, onSelect, emptyMessage }) {
  const { dismiss: onClose, motionClass } = useDismissibleModal(requestClose)
  return (
    <div
      className={`fixed inset-0 z-[60] flex items-end justify-center bg-brand-green/25 p-3 backdrop-blur-sm sm:items-center ${motionClass}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="buyer-category-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(70dvh,32rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-brand-green/12 bg-brand-white shadow-[0_24px_60px_rgba(89,128,44,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-brand-green/10 px-5 py-4">
          <h2 id="buyer-category-modal-title" className="font-display text-lg font-bold text-brand-green">
            Categorías
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 text-lg text-brand-carmelita"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto py-2">
          {loading ? (
            <li className="px-5 py-4 text-sm text-brand-carmelita">Cargando categorías…</li>
          ) : categories.length === 0 ? (
            <li className="px-5 py-4 text-sm text-brand-carmelita">{emptyMessage}</li>
          ) : (
            [{ id: '', name: 'Todas las categorías' }, ...categories].map((category) => {
              const active = (selectedId || '') === category.id
              return (
                <li key={category.id || 'all'}>
                  <button
                    type="button"
                    onClick={() => onSelect(category.id)}
                    className={`flex w-full items-center justify-between px-5 py-3 text-left text-sm touch-manipulation ${
                      active ? 'bg-brand-green/10 font-semibold text-brand-green' : 'text-brand-green'
                    }`}
                  >
                    <span>{category.name}</span>
                    {active ? <span aria-hidden="true">✓</span> : null}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}

export default function BuyerMarketplaceNav({
  catalogCategories,
  catalogCategoriesLoading = false,
  selectedCatalogCategoryId = '',
  storeSlug = '',
  gestorUsername = null,
}) {
  const route = useLocation()
  const navigate = useNavigate()
  const location = getBuyerLocation()
  const { currencies } = useBuyerDisplayCurrency()
  const provinceId = location?.province?.id ?? ''
  const municipalityId = location?.municipality?.id ?? ''
  const isCatalog = catalogCategories !== undefined
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [fabVisible, setFabVisible] = useState(true)
  const hideTimerRef = useRef(null)
  const [helpPhone, setHelpPhone] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchRenewalContactPhone()
      .then((data) => {
        if (!cancelled) setHelpPhone(data?.renewal_contact_phone || '')
      })
      .catch(() => {
        if (!cancelled) setHelpPhone('')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isCatalog) return undefined
    setCategories(catalogCategories)
    setCategoriesLoading(catalogCategoriesLoading)
    return undefined
  }, [catalogCategories, catalogCategoriesLoading, isCatalog])

  useEffect(() => {
    setOptionsFabPresent(true)
    return () => setOptionsFabPresent(false)
  }, [])

  useEffect(() => {
    setOptionsFabVisible(fabVisible)
  }, [fabVisible])

  useEffect(() => {
    const scroller = document.querySelector('.buyer-scroll')
    if (!scroller) return undefined

    function onScroll() {
      setFabVisible(false)
      setMenuOpen(false)
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = window.setTimeout(() => setFabVisible(true), 1000)
    }

    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      window.clearTimeout(hideTimerRef.current)
    }
  }, [route.pathname])

  useEffect(() => {
    if (isCatalog || !categoryOpen || !provinceId || !municipalityId) return undefined
    let cancelled = false
    setCategoriesLoading(true)
    fetchMarketplaceFeed({
      provinceId,
      municipalityId,
      additionalMunicipalityIds: getAdditionalMunicipalities(provinceId),
      currency: currencies,
      limitPerCategory: 1,
      limit: 50,
      offset: 0,
    })
      .then((data) => {
        if (cancelled) return
        const stocked = (data?.sections ?? [])
          .filter((section) => (section.total_products ?? section.products?.length ?? 0) > 0)
          .map((section) => ({ id: section.category_id, name: section.category_name }))
        setCategories(stocked)
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [categoryOpen, currencies, isCatalog, municipalityId, provinceId])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      if (categoryOpen) setCategoryOpen(false)
      else setMenuOpen(false)
    }
    if (!categoryOpen && !menuOpen) return undefined
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [categoryOpen, menuOpen])

  useEffect(() => {
    setMenuOpen(false)
  }, [route.pathname])

  useEffect(() => {
    if (isCatalog) return
    const match = matchPath({ path: '/comprar/:categorySlug', end: true }, route.pathname)
    const slug = match?.params?.categorySlug
    if (!slug || slug === 'negocios') {
      setSelectedCategoryId('')
      return
    }
    const found = resolveMarketplaceCategory(categories, slug)
    setSelectedCategoryId(found?.id || '')
  }, [categories, isCatalog, route.pathname])

  function chooseCategory(categoryId) {
    setCategoryOpen(false)
    setMenuOpen(false)

    const category = categories.find((item) => item.id === categoryId)
    const categoryName = category?.name

    if (isCatalog) {
      const homePath = gestorUsername
        ? storeGestorPublicPath(storeSlug, gestorUsername)
        : storePublicPath(storeSlug)
      if (!categoryId) {
        if (route.pathname !== homePath) navigate(homePath)
        return
      }
      const path = storeCategoryPath(
        storeSlug,
        { category_id: categoryId, category_name: categoryName },
        gestorUsername,
      )
      if (route.pathname === path) return
      navigate(path, {
        state: { categoryId, categoryName, kind: 'category' },
      })
      return
    }

    setSelectedCategoryId(categoryId)
    if (provinceId) setMarketplaceCategoryFilter(provinceId, '')

    if (!categoryId) {
      if (route.pathname !== '/comprar') navigate('/comprar')
      return
    }

    const path = marketplaceCategoryPath({
      category_id: categoryId,
      category_name: categoryName,
    })
    if (route.pathname === path) return
    navigate(path, {
      state: { categoryId, categoryName },
    })
  }

  function openHelp() {
    const url = buildWhatsAppUrl(helpPhone, HELP_MESSAGE)
    if (url) openExternalUrl(url)
  }

  const accountSignedIn = isSellerAuthenticated() || isAdminAuthenticated()
  const activeCategoryId = isCatalog ? selectedCatalogCategoryId : selectedCategoryId
  const categoryActive = categoryOpen || Boolean(activeCategoryId)
  const accountIcon = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.2c1.4-2.6 3.6-3.7 6.5-3.7s5.1 1.1 6.5 3.7" />
    </svg>
  )
  const backTo = `${route.pathname}${route.search}${route.hash}`

  const menu = (
    <>
      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-brand-green/10"
          aria-label="Cerrar navegación"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <nav
        className={`fixed right-4 bottom-[max(2rem,calc(1.65rem+var(--safe-bottom)))] z-30 h-14 w-14 transition-[opacity,transform] duration-200 sm:right-[3.25rem] motion-reduce:transition-none ${
          fabVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
        }`}
        aria-label="Secciones de compra"
        aria-hidden={fabVisible ? undefined : true}
      >
        <ArcOption open={menuOpen} from={ORIGIN} to={MAIN_POINTS[0]} index={0}>
          <button
            type="button"
            className={`${optionClass} ${categoryActive ? 'text-brand-green' : ''}`}
            aria-label="Categorías"
            onClick={() => {
              setMenuOpen(false)
              if (!isCatalog) setCategoriesLoading(true)
              setCategoryOpen(true)
            }}
          >
            <OptionLabel open={menuOpen} life={lifeFor(0)}>Categorías</OptionLabel>
            <OptionIcon open={menuOpen} life={lifeFor(0)} className={optionIconClass}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
                <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
                <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
                <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
              </svg>
            </OptionIcon>
          </button>
        </ArcOption>
        <ArcOption open={menuOpen} from={ORIGIN} to={MAIN_POINTS[1]} index={1}>
          <button
            type="button"
            className={`${optionClass} text-brand-green`}
            aria-label="Ayuda"
            disabled={!helpPhone}
            onClick={() => {
              setMenuOpen(false)
              openHelp()
            }}
          >
            <OptionLabel open={menuOpen} life={lifeFor(1)}>Ayuda</OptionLabel>
            <OptionIcon open={menuOpen} life={lifeFor(1)} className={optionIconClass}>
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10 10 0 0 0 4.65 1.18h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.41 17.5 2 12.04 2Zm5.76 14.15c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.12.11-1.81-.11-.42-.14-.95-.31-1.64-.6-2.88-1.25-4.76-4.16-4.9-4.35-.14-.19-1.17-1.55-1.17-2.96 0-1.41.74-2.1 1-2.39.26-.28.57-.35.76-.35.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.57.81 1.97.88 2.11.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.28-.12.55.16.26.7 1.16 1.51 1.88 1.04.92 1.91 1.21 2.18 1.35.26.14.42.12.58-.07.16-.19.66-.77.84-1.03.18-.26.35-.22.59-.13.24.09 1.51.71 1.77.84.26.13.43.19.5.3.06.11.06.64-.18 1.32Z"
                />
              </svg>
            </OptionIcon>
          </button>
        </ArcOption>
        <ArcOption open={menuOpen} from={ORIGIN} to={MAIN_POINTS[2]} index={2}>
          {accountSignedIn ? (
            <button type="button" className={optionClass} aria-label="Cuenta" disabled>
              <OptionLabel open={menuOpen} life={lifeFor(2)}>Cuenta</OptionLabel>
              <OptionIcon open={menuOpen} life={lifeFor(2)} className={optionIconClass}>{accountIcon}</OptionIcon>
            </button>
          ) : (
            <NavLink
              to="/login"
              state={{ backTo }}
              className={optionClass}
              aria-label="Iniciar sesión"
              onClick={() => setMenuOpen(false)}
            >
              <OptionLabel open={menuOpen} life={lifeFor(2)}>Cuenta</OptionLabel>
              <OptionIcon open={menuOpen} life={lifeFor(2)} className={optionIconClass}>{accountIcon}</OptionIcon>
            </NavLink>
          )}
        </ArcOption>
        <button
          type="button"
          className="relative z-10 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-brand-yellow shadow-[0_14px_28px_rgba(28,33,24,0.28)] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40"
          aria-label={menuOpen ? 'Cerrar navegación' : 'Abrir navegación'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <img src="/images/welcome/lali.png" alt="" className="h-12 w-12 object-contain" />
        </button>
      </nav>
      {categoryOpen ? (
        <CategoryModal
          categories={categories}
          loading={categoriesLoading}
          selectedId={activeCategoryId}
          emptyMessage={
            isCatalog
              ? 'Esta tienda no tiene categorías con productos.'
              : 'No hay categorías con productos en esta zona.'
          }
          onClose={() => setCategoryOpen(false)}
          onSelect={chooseCategory}
        />
      ) : null}
    </>
  )

  return createPortal(menu, document.body)
}
