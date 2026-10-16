import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import BuyerProductDetailModal from "./BuyerProductDetailModal";
import { DEAD_MASCOT } from "../../constants/branding";
import { fetchMarketplaceBusinesses, fetchMarketplaceSearch } from "../../lib/api";
import { resolveBuyerProductStorePath } from "../../lib/buyerProductCardView";
import { resolveMediaUrl } from "../../lib/media";
import { useBuyerDisplayCurrency } from "../../context/BuyerDisplayCurrencyContext";
import { useBuyerJaba } from "../../context/BuyerJabaContext";

const DEBOUNCE_MS = 300;
const MOTION_MS = 320;
const NO_EXTRA_MUNICIPALITIES = [];

const EMPTY_SUGGESTIONS = { products: [], stores: [] };

function ProductMark() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden="true">
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
    </svg>
  );
}

function StoreMark() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden="true">
      <path d="M3 10l1.5-5h15L21 10" />
      <path d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9z" />
    </svg>
  );
}

function SearchResultThumb({ src, label, mark, roundedClass, fallback }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <span className="relative h-11 w-11 shrink-0">
      <span className={`flex h-full w-full overflow-hidden bg-brand-green/8 text-brand-green ${roundedClass}`}>
        {showImage ? (
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[0.65rem] font-bold">
            {fallback}
          </span>
        )}
      </span>
      <span
        className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-brand-white bg-brand-green text-brand-white"
        title={label}
      >
        {mark}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

const SEARCH_ICON = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

function readFrame(node) {
  const rect = node?.getBoundingClientRect();
  if (!rect) return null;
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function expandedFrame(anchor, restHeight) {
  const column =
    document.querySelector(".buyer-scroll > div") ||
    anchor?.closest("header")?.firstElementChild;
  const bounds = column?.getBoundingClientRect();
  const safeTop =
    Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--safe-top"),
    ) || 0;
  const style = column ? getComputedStyle(column) : null;
  const padLeft = Number.parseFloat(style?.paddingLeft) || 0;
  const padRight = Number.parseFloat(style?.paddingRight) || 0;
  const left = bounds ? bounds.left + padLeft : 20;
  const width = bounds
    ? bounds.width - padLeft - padRight
    : window.innerWidth - 40;
  return {
    top: Math.max(12, safeTop + 8),
    left,
    width: Math.max(0, width),
    height: Math.max(restHeight, 52),
  };
}

export default function BuyerHeaderSearch({
  provinceId,
  municipalityId,
  additionalMunicipalityIds = NO_EXTRA_MUNICIPALITIES,
  storeSlug = null,
  gestorUsername = null,
}) {
  const navigate = useNavigate();
  const { isInJaba, addProduct, buyProduct } = useBuyerJaba();
  const { currency } = useBuyerDisplayCurrency();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState(EMPTY_SUGGESTIONS);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [origin, setOrigin] = useState(null);
  const inputRef = useRef(null);
  const anchorRef = useRef(null);
  const closeTimer = useRef(null);
  const visibleRef = useRef(false);
  const suppressFocus = useRef(false);
  const additionalMunicipalityKey = additionalMunicipalityIds.join(",");

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!open) return undefined;
    let inner = 0;
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => {
        if (!visibleRef.current) return;
        setShown(true);
        inputRef.current?.focus();
      });
    });
    return () => {
      window.cancelAnimationFrame(outer);
      window.cancelAnimationFrame(inner);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const text = query.trim();
    if (text.length < 2) {
      setSuggestions(EMPTY_SUGGESTIONS);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      const productRequest = fetchMarketplaceSearch({
        provinceId,
        municipalityId,
        additionalMunicipalityIds,
        currency,
        query: text,
        limit: 8,
        offset: 0,
        storeSlug,
        gestorUsername,
      });
      const storeRequest = storeSlug
        ? Promise.resolve({ businesses: [] })
        : fetchMarketplaceBusinesses({
            provinceId,
            municipalityId,
            additionalMunicipalityIds,
            currency,
            query: text,
            limit: 5,
            offset: 0,
          });
      Promise.all([productRequest, storeRequest])
        .then(([productsData, storesData]) => {
          if (cancelled) return;
          setSuggestions({
            products: productsData?.products ?? [],
            stores: storesData?.businesses ?? [],
          });
        })
        .catch(() => {
          if (!cancelled) setSuggestions(EMPTY_SUGGESTIONS);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    additionalMunicipalityKey,
    currency,
    gestorUsername,
    municipalityId,
    open,
    provinceId,
    query,
    storeSlug,
  ]);

  function openSearch() {
    if (suppressFocus.current) return;
    const frame = readFrame(anchorRef.current);
    if (!frame) return;
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOrigin(frame);
    visibleRef.current = true;
    setOpen(true);
  }

  function openStore(business) {
    const path = resolveBuyerProductStorePath(business?.store);
    if (!path) return;
    close();
    navigate(path);
  }

  function close() {
    suppressFocus.current = true;
    visibleRef.current = false;
    setShown(false);
    inputRef.current?.blur();
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      setOrigin(null);
      setQuery("");
      setSuggestions(EMPTY_SUGGESTIONS);
      closeTimer.current = null;
      window.setTimeout(() => {
        suppressFocus.current = false;
      }, 80);
    }, MOTION_MS);
  }

  const place = origin
    ? shown
      ? expandedFrame(anchorRef.current, origin.height)
      : origin
    : null;

  const overlay =
    open && place
      ? createPortal(
          <div className="fixed inset-0 z-40">
            <button
              type="button"
              className={`absolute inset-0 bg-brand-white/45 backdrop-blur-md transition-opacity duration-300 ease-out motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`}
              aria-label="Cerrar búsqueda"
              onClick={close}
            />
            <div
              className="fixed z-50 motion-reduce:transition-none"
              style={{
                top: place.top,
                left: place.left,
                width: place.width,
                height: place.height,
                transition: `top ${MOTION_MS}ms ease, left ${MOTION_MS}ms ease, width ${MOTION_MS}ms ease, height ${MOTION_MS}ms ease`,
              }}
            >
              <label className="sr-only" htmlFor="buyer-header-search">
                {storeSlug ? "Buscar en la tienda" : "Buscar productos y tiendas"}
              </label>
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-green">
                {SEARCH_ICON}
              </span>
              <input
                ref={inputRef}
                id="buyer-header-search"
                type="text"
                inputMode="search"
                enterKeyHint="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  storeSlug ? "Buscar en la tienda…" : "Buscar productos y tiendas…"
                }
                className="h-full w-full rounded-full border border-brand-green/20 bg-brand-white pl-10 pr-12 text-sm text-brand-green shadow-[0_8px_24px_rgba(89,128,44,0.12)] placeholder:text-brand-carmelita/45 focus:border-brand-green/35 focus:outline-none focus:ring-2 focus:ring-brand-green/10"
                autoComplete="off"
              />
              {query ? (
                <button
                  type="button"
                  className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-brand-carmelita touch-manipulation active:bg-brand-green/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25"
                  aria-label="Borrar búsqueda"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.25"
                    aria-hidden="true"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
            </div>
            <div
              className={`fixed z-50 px-1 transition-opacity duration-300 ease-out motion-reduce:transition-none ${shown ? "opacity-100" : "pointer-events-none opacity-0"}`}
              style={{
                top: place.top + place.height + 12,
                left: place.left,
                width: place.width,
              }}
            >
              {query.trim().length >= 2 ? (
                <ul className="max-h-[min(60dvh,24rem)] overflow-y-auto rounded-2xl border border-brand-green/12 bg-brand-white py-1 shadow-[0_12px_32px_rgba(89,128,44,0.16)]">
                  {loading ? (
                    <li className="px-4 py-3 text-sm text-brand-carmelita">
                      Buscando…
                    </li>
                  ) : null}
                  {!loading &&
                  suggestions.products.length === 0 &&
                  suggestions.stores.length === 0 ? (
                    <li className="flex flex-col items-center px-4 py-4 text-center">
                      <img
                        src={DEAD_MASCOT.src}
                        alt=""
                        className="h-24 w-24 object-contain"
                      />
                      <p className="mt-1 text-sm text-brand-carmelita">
                        Sin coincidencias.
                      </p>
                    </li>
                  ) : null}
                  {suggestions.stores.map((business) => (
                    <li key={`store-${business.store.id}`}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left touch-manipulation active:bg-brand-yellow/15"
                        onClick={() => openStore(business)}
                      >
                        <SearchResultThumb
                          src={resolveMediaUrl(business.store.profile_photo_url, { width: 128 })}
                          label="Tienda"
                          mark={<StoreMark />}
                          roundedClass="rounded-full"
                          fallback={business.store.store_name?.trim().slice(0, 2).toUpperCase() || "?"}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-brand-green">
                            {business.store.store_name}
                          </span>
                          {business.business_area?.municipality_name ? (
                            <span className="block truncate text-xs text-brand-carmelita">
                              {business.business_area.municipality_name}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  ))}
                  {suggestions.products.map((product) => (
                    <li key={`product-${product.id}`}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left touch-manipulation active:bg-brand-yellow/15"
                        onClick={() => setSelected(product)}
                      >
                        <SearchResultThumb
                          src={resolveMediaUrl(product.image_url, { width: 128 })}
                          label="Producto"
                          mark={<ProductMark />}
                          roundedClass="rounded-xl"
                          fallback={<ProductMark />}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-brand-green">
                            {product.name}
                          </span>
                          {product.store?.store_name ? (
                            <span className="block truncate text-xs text-brand-carmelita">
                              {product.store.store_name}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        ref={anchorRef}
        className={`relative w-full ${open ? "invisible" : ""}`}
      >
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-green">
          {SEARCH_ICON}
        </span>
        <input
          type="text"
          readOnly
          value=""
          placeholder={storeSlug ? "Buscar en la tienda…" : "Buscar…"}
          aria-label={storeSlug ? "Buscar en la tienda" : "Buscar productos y tiendas"}
          onFocus={openSearch}
          className="h-10 w-full cursor-text rounded-full border border-brand-green/15 bg-brand-white pl-9 pr-3 text-sm text-brand-green shadow-[0_2px_10px_rgba(89,128,44,0.08)] placeholder:text-brand-carmelita/45 focus:border-brand-green/35 focus:outline-none focus:ring-2 focus:ring-brand-green/10 lg:h-11"
        />
      </div>
      {overlay}
      {selected ? (
        <BuyerProductDetailModal
          product={selected}
          inJaba={isInJaba(selected.id)}
          onClose={() => setSelected(null)}
          onBuy={async (event) => {
            event?.stopPropagation?.();
            const success = await buyProduct(selected);
            if (success) setSelected(null);
          }}
          onAddToJaba={(event) => {
            event?.stopPropagation?.();
            addProduct(selected);
          }}
        />
      ) : null}
    </>
  );
}
