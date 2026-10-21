import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import BuyerAssortmentHints from "../../components/buyer/BuyerAssortmentHints";
import BuyerBannerCarousel from "../../components/buyer/BuyerBannerCarousel";
import BuyerSharedEntry from "../../components/buyer/BuyerSharedEntry";
import BuyerCategoryProductRow from "../../components/buyer/BuyerCategoryProductRow";
import BuyerHeaderSearch from "../../components/buyer/BuyerHeaderSearch";
import BuyerLocationDisplay from "../../components/buyer/BuyerLocationDisplay";
import { MARKETPLACE_CATEGORY_EVENT } from "../../components/buyer/BuyerMarketplaceNav";
import { BuyerSearchResults } from "../../components/buyer/BuyerMarketplaceSearch";
import BuyerShell from "../../components/buyer/BuyerShell";
import StatePanel from "../../components/ui/StatePanel";
import LoadingState from "../../components/ui/LoadingState";
import { buyerHomeSections } from "../../components/buyer/buyerStyles";
import {
  fetchMarketplaceAvailabilityHints,
  fetchMarketplaceCategoryProducts,
  fetchMarketplaceFeed,
  fetchMarketplaceSearch,
} from "../../lib/api";
import {
  getBuyerLocation,
  getAdditionalMunicipalities,
  hasCompleteBuyerLocation,
  getMarketplaceCategoryFilter,
  setMarketplaceCategoryFilter,
  applySharedZoneFromSearch,
} from "../../lib/buyerLocation";
import {
  getMunicipalityById,
  getProvinceById,
} from "../../constants/cubaLocations";
import { marketplaceCategoryPath } from "../../lib/marketplaceCategory";
import { recordMarketplaceVisit } from "../../lib/marketplaceVisit";
import { BuyerDisplayedLocationProvider } from "../../context/BuyerDisplayedLocationContext";
import { useBuyerDisplayCurrency } from "../../context/BuyerDisplayCurrencyContext";
import { resolveUserFacingError } from "../../lib/userFacingError";
import {
  DEAD_MASCOT,
  LOADING_MASCOT,
  MARKETPLACE_LABEL,
} from "../../constants/branding";

const ROW_PAGE_SIZE = 5;
const SEARCH_PAGE_SIZE = 20;
const SECTION_PAGE_SIZE = 4;

function readPreviewLocation() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get("vista") !== "preview") return null;
  const province = getProvinceById(params.get("provincia"));
  const municipality = getMunicipalityById(
    params.get("provincia"),
    params.get("municipio"),
  );
  if (!province || !municipality) return null;
  return {
    province: { id: province.id, name: province.name },
    municipality: { id: municipality.id, name: municipality.name },
    bannerId: params.get("banner") || null,
  };
}

export default function BuyerHome() {
  const preview = readPreviewLocation();
  if (!preview && typeof window !== "undefined") {
    applySharedZoneFromSearch(window.location.search);
  }
  if (!preview && !hasCompleteBuyerLocation()) {
    return <Navigate to="/comprar/provincia" replace />;
  }

  return <BuyerHomeContent preview={preview} />;
}

function BuyerHomeContent({ preview = null }) {
  const location = preview ?? getBuyerLocation();
  const { currencies, toggleCurrency } = useBuyerDisplayCurrency();
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef(null);
  const [searchCategoryId, setSearchCategoryId] = useState(() =>
    preview ? "" : getMarketplaceCategoryFilter(location.province.id),
  );
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);
  const [additionalMunicipalityIds] = useState(() =>
    preview ? [] : getAdditionalMunicipalities(location.province.id),
  );
  const [assortmentHints, setAssortmentHints] = useState(null);

  const municipalityIds = useMemo(() => {
    const ids = [location.municipality.id];
    for (const id of additionalMunicipalityIds) {
      if (id && !ids.includes(id)) ids.push(id);
    }
    return ids;
  }, [additionalMunicipalityIds, location.municipality.id]);
  useEffect(() => {
    if (preview) return;
    recordMarketplaceVisit({
      provinceId: location.province.id,
      municipalityId: location.municipality.id,
    });
  }, [preview, location.province.id, location.municipality.id]);

  useEffect(() => {
    function onCategory(event) {
      if (event.detail?.provinceId !== location.province.id) return;
      const nextCategoryId = event.detail.categoryId || "";
      setSearchCategoryId(nextCategoryId);
      setMarketplaceCategoryFilter(location.province.id, nextCategoryId);
    }
    window.addEventListener(MARKETPLACE_CATEGORY_EVENT, onCategory);
    return () =>
      window.removeEventListener(MARKETPLACE_CATEGORY_EVENT, onCategory);
  }, [location.province.id]);

  const searchActive = Boolean(searchCategoryId);

  const loadFeed = useCallback(
    async ({ offset = 0, append = false } = {}) => {
      if (append) {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
        setLoadError(null);
      }

      try {
        const data = await fetchMarketplaceFeed({
          provinceId: location.province.id,
          municipalityId: location.municipality.id,
          additionalMunicipalityIds,
          currency: currencies,
          limitPerCategory: ROW_PAGE_SIZE,
          limit: SECTION_PAGE_SIZE,
          offset,
        });
        setFeed((current) => {
          if (!append || !current) return data;
          const seen = new Set(
            current.sections.map((section) => section.category_id),
          );
          return {
            ...data,
            sections: [
              ...current.sections,
              ...data.sections.filter(
                (section) => !seen.has(section.category_id),
              ),
            ],
          };
        });
      } catch (err) {
        if (!append) {
          setLoadError(
            resolveUserFacingError(err, {
              contextTitle: `No se pudo cargar el ${MARKETPLACE_LABEL.toLowerCase()}`,
              fallbackMessage:
                "No pudimos mostrar los productos de tu zona. Inténtalo de nuevo.",
            }),
          );
          setFeed(null);
        }
      } finally {
        if (append) {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [additionalMunicipalityIds, currencies, location.municipality.id, location.province.id],
  );

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const runSearch = useCallback(
    async ({ offset = 0, append = false } = {}) => {
      const isActive = Boolean(searchCategoryId);

      if (!isActive) {
        setSearchResults(null);
        setSearchError(null);
        setSearchLoading(false);
        return;
      }

      if (append) {
        setSearchLoadingMore(true);
      } else {
        setSearchLoading(true);
        setSearchError(null);
      }

      try {
        const data = await fetchMarketplaceSearch({
          provinceId: location.province.id,
          municipalityId: location.municipality.id,
          additionalMunicipalityIds,
          currency: currencies,
          query: "",
          globalCategoryId: searchCategoryId || undefined,
          limit: SEARCH_PAGE_SIZE,
          offset,
        });

        setSearchResults((current) => {
          if (!append || !current) return data;
          const seen = new Set(current.products.map((item) => item.id));
          const nextProducts = data.products.filter(
            (item) => !seen.has(item.id),
          );
          return {
            ...data,
            products: [...current.products, ...nextProducts],
          };
        });
      } catch (err) {
        if (!append) {
          setSearchResults(null);
          setSearchError(
            resolveUserFacingError(err, {
              contextTitle: "No se pudo completar la búsqueda",
              fallbackMessage:
                "No pudimos buscar productos en este momento. Inténtalo de nuevo.",
            }),
          );
        }
      } finally {
        setSearchLoading(false);
        setSearchLoadingMore(false);
      }
    },
    [
      additionalMunicipalityIds,
      currencies,
      location.municipality.id,
      location.province.id,
      searchCategoryId,
    ],
  );

  const severalMunicipalities = municipalityIds.length > 1;
  const showSearchGrid = searchActive && !severalMunicipalities;

  useEffect(() => {
    if (!showSearchGrid) {
      setSearchResults(null);
      setSearchError(null);
      setSearchLoading(false);
      return undefined;
    }
    runSearch();
    return undefined;
  }, [runSearch, showSearchGrid]);

  const sections = feed?.sections ?? [];
  const visibleSections = sections.filter((section) => section.products?.length);
  const hasProducts = (feed?.total_products ?? 0) > 0;
  const hasMoreSections = Boolean(feed?.has_more);
  const searchEmpty =
    showSearchGrid &&
    !searchLoading &&
    !searchError &&
    Boolean(searchResults) &&
    !searchResults.products?.length;
  const emptyBecauseOfCurrency = Boolean(assortmentHints?.currencies?.length);
  const emptyZoneLabel = severalMunicipalities
    ? "los municipios elegidos"
    : location.municipality.name;
  const feedEmpty =
    !showSearchGrid && !loading && !loadError && !hasProducts;
  const showAssortmentHints = searchEmpty || feedEmpty;

  useEffect(() => {
    if (!showAssortmentHints) {
      setAssortmentHints(null);
      return undefined;
    }
    let cancelled = false;
    fetchMarketplaceAvailabilityHints({
      provinceId: location.province.id,
      municipalityIds,
      currency: currencies,
      globalCategoryId: showSearchGrid ? searchCategoryId || undefined : undefined,
    })
      .then((data) => {
        if (!cancelled) setAssortmentHints(data);
      })
      .catch(() => {
        if (!cancelled) setAssortmentHints(null);
      });
    return () => {
      cancelled = true;
    };
  }, [
    currencies,
    location.province.id,
    municipalityIds,
    showSearchGrid,
    searchCategoryId,
    showAssortmentHints,
  ]);

  const assortmentNotice = (
    <BuyerAssortmentHints hints={assortmentHints} onCurrency={toggleCurrency} />
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMoreSections || loading || loadingMore || showSearchGrid)
      return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadFeed({ offset: sections.length, append: true });
        }
      },
      { rootMargin: "240px", threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    hasMoreSections,
    loadFeed,
    loading,
    loadingMore,
    showSearchGrid,
    sections.length,
  ]);

  return (
    <BuyerDisplayedLocationProvider location={location}>
      <BuyerShell
        headerStart={
          <BuyerLocationDisplay
            province={location.province}
            municipality={location.municipality}
            extraMunicipalityCount={Math.max(0, municipalityIds.length - 1)}
          />
        }
        headerSearch={
          <BuyerHeaderSearch
            provinceId={location.province.id}
            municipalityId={location.municipality.id}
            additionalMunicipalityIds={additionalMunicipalityIds}
          />
        }
      >
        <BuyerBannerCarousel
            provinceId={location.province.id}
            initialBannerId={preview?.bannerId}
          />
        {preview ? null : <BuyerSharedEntry location={location} />}

        {showSearchGrid ? (
          <BuyerSearchResults
            loading={searchLoading}
            error={searchError}
            results={searchResults}
            loadingMore={searchLoadingMore}
            onRetry={() => runSearch()}
            retrying={searchLoading}
            onLoadMore={() =>
              runSearch({
                offset: searchResults?.products?.length ?? 0,
                append: true,
              })
            }
            emptyNotice={searchEmpty ? assortmentNotice : null}
            emptyMessage={
              emptyBecauseOfCurrency
                ? "No hay productos con esta moneda en la categoría elegida."
                : `Aún no hay ofertas en ${emptyZoneLabel}.`
            }
          />
        ) : null}

        {!showSearchGrid && loading ? (
          <LoadingState
            message="Cargando productos…"
            className="lg:items-start lg:text-left"
          />
        ) : null}

        {!showSearchGrid && !loading && loadError ? (
          <StatePanel
            variant="buyer"
            title={loadError.title}
            message={loadError.message}
            serviceError={loadError.isServiceError}
            onRetry={loadError.canRetry ? loadFeed : undefined}
            retrying={loading}
          />
        ) : null}

        {!showSearchGrid && !loading && !loadError && !hasProducts ? (
          <div className="flex flex-col items-center rounded-3xl border border-brand-yellow/25 bg-brand-yellow/15 px-5 py-8 text-center">
            <img
              src={DEAD_MASCOT.src}
              alt=""
              className="mb-3 h-36 w-36 object-contain"
            />
            <p className="font-display text-lg font-bold text-brand-green">
              {emptyBecauseOfCurrency
                ? "Aún no hay productos aquí"
                : `Aún no hay ofertas en ${emptyZoneLabel}`}
            </p>
            {emptyBecauseOfCurrency ? (
              <p className="mt-2 max-w-md text-sm leading-relaxed text-brand-carmelita/90">
                No encontramos tiendas con productos disponibles en {emptyZoneLabel} con esta configuración.
              </p>
            ) : null}
            {assortmentNotice}
          </div>
        ) : null}

        {!showSearchGrid && !loading && !loadError && hasProducts ? (
          <div className={buyerHomeSections}>
            {visibleSections.map((section) => (
                <BuyerCategoryProductRow
                  key={section.category_id}
                  section={section}
                  href={marketplaceCategoryPath(section)}
                  loadMore={(offset) =>
                    fetchMarketplaceCategoryProducts({
                      provinceId: location.province.id,
                      municipalityId: location.municipality.id,
                      additionalMunicipalityIds,
                      currency: currencies,
                      globalCategoryId: section.category_id,
                      limit: ROW_PAGE_SIZE,
                      offset,
                    }).then((data) => ({
                      products: data.products,
                      has_more: data.has_more,
                    }))
                  }
                />
              ))}
            {hasMoreSections ? (
              <div
                ref={sentinelRef}
                className="flex min-h-16 items-center justify-center py-4"
                aria-hidden={!loadingMore}
              >
                {loadingMore ? (
                  <img
                    src={LOADING_MASCOT.src}
                    alt=""
                    className="h-14 w-14 animate-levitate object-contain sm:h-10 sm:w-10"
                    width={56}
                    height={56}
                    decoding="async"
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </BuyerShell>
    </BuyerDisplayedLocationProvider>
  );
}
