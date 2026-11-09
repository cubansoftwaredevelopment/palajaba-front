import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import CatalogThemeScope from "../../components/catalog/CatalogThemeScope";
import BuyerCategoryProductRow from "../components/BuyerCategoryProductRow";
import BuyerHeaderSearch from "../components/BuyerHeaderSearch";
import BuyerMarketplaceNav from "../components/BuyerMarketplaceNav";
import BuyerShell from "../components/BuyerShell";
import BuyerStoreProfileHeader from "../components/BuyerStoreProfileHeader";
import BuyerStoreServiceFooter from "../components/BuyerStoreServiceFooter";
import StatePanel from "../../components/ui/StatePanel";
import LoadingState from "../../components/ui/LoadingState";
import DeadState from "../../components/ui/DeadState";
import { DEAD_MASCOT, MARKETPLACE_LABEL } from "../../constants/branding";
import { DISPLAY_CURRENCIES } from "../../constants/currencies";
import Button from "../../components/Button";
import {
  fetchMarketplaceGestorStoreCatalog,
  fetchMarketplaceGestorStoreCategoryProducts,
  fetchMarketplaceStoreCatalog,
  fetchMarketplaceStoreCategoryProducts,
} from "../../products/api.js";
import { BuyerDisplayedLocationProvider } from "../context.js";
import { useBuyerDisplayCurrency } from "../context.js";
import { normalizeCatalogTheme } from "../../lib/catalogThemes";
import { storeCategoryPath } from "../../lib/marketplaceCategory";
import { validateGestorUsername } from "../../lib/sellerGestores";
import { recordStoreProfileView } from "../../lib/storeProfileView";
import { setStoreCheckoutPhones } from "../../lib/storeCheckoutPhones";
import { getAdditionalMunicipalities } from "../../lib/buyerLocation";
import { storePublicPath } from "../../lib/storeSlug";
import { resolveUserFacingError } from "../../lib/userFacingError";
import { usePublicStoreLocation } from "./usePublicStoreLocation";

const PAGE_SIZE = 5;

function emptyCatalogMessage(currencies, isGestorCatalog) {
  const filtered =
    currencies.length > 0 && currencies.length < DISPLAY_CURRENCIES.length;
  if (filtered) {
    const list = currencies.join(", ");
    return isGestorCatalog
      ? `Este gestor no tiene productos en ${list}.`
      : `Esta tienda no tiene productos en ${list} en este momento.`;
  }
  return isGestorCatalog
    ? "Este gestor todavía no tiene productos en su catálogo."
    : "Esta tienda no tiene productos publicados en este momento.";
}

export default function BuyerStorePage() {
  const { storeSlug, gestorUsername } = useParams();
  const { location, resolvingLocation, locationError } =
    usePublicStoreLocation(storeSlug);

  const gestorCheck = gestorUsername
    ? validateGestorUsername(gestorUsername)
    : { ok: true, username: null };

  if (gestorUsername && !gestorCheck.ok) {
    return <Navigate to={storePublicPath(storeSlug)} replace />;
  }

  if (resolvingLocation) {
    return (
      <>
        <BuyerShell backTo="/comprar" backLabel={MARKETPLACE_LABEL}>
          <LoadingState
            message="Cargando tienda…"
            className="lg:items-start lg:text-left"
          />
        </BuyerShell>
        <BuyerMarketplaceNav
          catalogCategories={[]}
          catalogCategoriesLoading
          storeSlug={storeSlug}
          gestorUsername={gestorCheck.ok ? gestorCheck.username : null}
        />
      </>
    );
  }

  if (!location || locationError) {
    return <Navigate to="/comprar/provincia" replace />;
  }

  return (
    <BuyerStorePageContent
      location={location}
      gestorUsername={gestorCheck.ok ? gestorCheck.username : null}
    />
  );
}

function BuyerStorePageContent({ location, gestorUsername = null }) {
  const { storeSlug } = useParams();
  const { currencies } = useBuyerDisplayCurrency();
  const [additionalMunicipalityIds] = useState(() =>
    getAdditionalMunicipalities(location.province.id),
  );
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const isGestorCatalog = Boolean(gestorUsername);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const data = isGestorCatalog
        ? await fetchMarketplaceGestorStoreCatalog({
            storeSlug,
            gestorUsername,
            provinceId: location.province.id,
            municipalityId: location.municipality.id,
            additionalMunicipalityIds,
            currency: currencies,
            limitPerCategory: PAGE_SIZE,
          })
        : await fetchMarketplaceStoreCatalog({
            storeSlug,
            provinceId: location.province.id,
            municipalityId: location.municipality.id,
            additionalMunicipalityIds,
            currency: currencies,
            limitPerCategory: PAGE_SIZE,
          });
      setCatalog(data);
      if (!isGestorCatalog && data?.store?.id) {
        const phones = Array.isArray(data.checkout_phones)
          ? data.checkout_phones
          : Array.isArray(data.store?.checkout_phones)
            ? data.store.checkout_phones
            : [];
        if (phones.length) {
          setStoreCheckoutPhones(data.store.id, phones);
        }
      }
      recordStoreProfileView(storeSlug, {
        provinceId: location.province.id,
        municipalityId: location.municipality.id,
      });
    } catch (err) {
      setLoadError(
        resolveUserFacingError(err, {
          contextTitle: isGestorCatalog
            ? "No se pudo abrir el catálogo del gestor"
            : "No se pudo abrir la tienda",
          fallbackMessage: isGestorCatalog
            ? "No pudimos cargar este catálogo. Inténtalo de nuevo."
            : "No pudimos cargar esta tienda. Inténtalo de nuevo.",
        }),
      );
      setCatalog(null);
    } finally {
      setLoading(false);
    }
  }, [
    additionalMunicipalityIds,
    currencies,
    isGestorCatalog,
    gestorUsername,
    location.municipality.id,
    location.province.id,
    storeSlug,
  ]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const catalogCategories = useMemo(
    () =>
      (catalog?.sections ?? [])
        .filter((section) => section.products?.length)
        .map((section) => ({
          id: section.category_id,
          name: section.category_name,
        })),
    [catalog],
  );

  const createLoadMore = useCallback(
    (section) => async (offset) => {
      const data = isGestorCatalog
        ? await fetchMarketplaceGestorStoreCategoryProducts({
            storeSlug,
            gestorUsername,
            localCategoryId: section.category_id,
            provinceId: location.province.id,
            municipalityId: location.municipality.id,
            additionalMunicipalityIds,
            currency: currencies,
            limit: PAGE_SIZE,
            offset,
          })
        : await fetchMarketplaceStoreCategoryProducts({
            storeSlug,
            localCategoryId: section.category_id,
            provinceId: location.province.id,
            municipalityId: location.municipality.id,
            additionalMunicipalityIds,
            currency: currencies,
            limit: PAGE_SIZE,
            offset,
          });
      return {
        products: data.products,
        has_more: data.has_more,
      };
    },
    [
      additionalMunicipalityIds,
      currencies,
      isGestorCatalog,
      gestorUsername,
      location.municipality.id,
      location.province.id,
      storeSlug,
    ],
  );

  const sections = catalog?.sections ?? [];
  const visibleSections = sections.filter((section) => section.products?.length);
  const hasProducts = (catalog?.total_products ?? 0) > 0;
  const catalogTheme = normalizeCatalogTheme(catalog?.catalog_theme);
  const catalogPalette = catalog?.catalog_palette ?? null;
  const backTo = isGestorCatalog ? storePublicPath(storeSlug) : "/comprar";
  const backLabel = isGestorCatalog
    ? catalog?.store?.store_name || "Tienda"
    : MARKETPLACE_LABEL;

  return (
    <CatalogThemeScope theme={catalogTheme} palette={catalogPalette} className="flex min-h-dvh flex-col">
      <BuyerDisplayedLocationProvider location={location}>
        <BuyerShell
          flushBottom
          backTo={backTo}
          backLabel={backLabel}
          headerSearch={
            <BuyerHeaderSearch
              provinceId={location.province.id}
              municipalityId={location.municipality.id}
              additionalMunicipalityIds={additionalMunicipalityIds}
              storeSlug={storeSlug}
              gestorUsername={gestorUsername}
            />
          }
        >
          {loading ? (
            <LoadingState
              message="Cargando tienda…"
              className="lg:items-start lg:text-left"
            />
          ) : null}

          {!loading && loadError ? (
            loadError.isNotFound ? (
              <DeadState
                variant="panel"
                title={
                  isGestorCatalog
                    ? "Catálogo no disponible"
                    : "Tienda no disponible"
                }
                message={
                  loadError.message ||
                  (isGestorCatalog
                    ? "Este gestor no existe o aún no publicó productos."
                    : "Esta tienda no existe o ya no está activa en Pa' La Jaba.")
                }
              >
                <Link to={backTo}>
                  <Button variant="ghost" className="w-full sm:w-auto">
                    {isGestorCatalog
                      ? "Ver tienda"
                      : `Volver al ${MARKETPLACE_LABEL.toLowerCase()}`}
                  </Button>
                </Link>
              </DeadState>
            ) : (
              <StatePanel
                variant="buyer"
                title={loadError.title}
                message={loadError.message}
                serviceError={loadError.isServiceError}
                onRetry={loadError.canRetry ? loadCatalog : undefined}
                retrying={loading}
              >
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center lg:justify-start">
                  <Link to={backTo}>
                    <Button variant="ghost" className="w-full sm:w-auto">
                      {isGestorCatalog
                        ? "Ver tienda"
                        : `Volver al ${MARKETPLACE_LABEL.toLowerCase()}`}
                    </Button>
                  </Link>
                </div>
              </StatePanel>
            )
          ) : null}

          {!loading && !loadError && catalog ? (
            <div className="flex min-h-full flex-1 flex-col pt-3">
              <BuyerStoreProfileHeader
                catalog={catalog}
                location={location}
              />

              {hasProducts ? (
                <div className="mt-8 flex flex-col gap-7 sm:mt-10 sm:gap-8">
                  {visibleSections.map((section) => (
                    <BuyerCategoryProductRow
                      key={section.category_id}
                      section={section}
                      href={storeCategoryPath(storeSlug, section, gestorUsername)}
                      loadMore={createLoadMore(section)}
                      storePhotoUrl={catalog.store?.profile_photo_url}
                      storeName={catalog.store?.store_name}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-8 flex flex-1 flex-col items-center justify-center px-3 py-8 text-center sm:mt-10">
                  <img
                    src={DEAD_MASCOT.src}
                    alt=""
                    className="h-28 w-28 object-contain"
                  />
                  <p className="mt-4 font-display text-lg font-bold text-brand-green">
                    Sin productos disponibles
                  </p>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-brand-carmelita/90">
                    {emptyCatalogMessage(currencies, isGestorCatalog)}
                  </p>
                </div>
              )}
              <BuyerStoreServiceFooter
                storeName={catalog.store?.store_name}
                storeSlug={catalog.store?.store_slug || storeSlug}
                photoUrl={catalog.store?.profile_photo_url}
                provinceName={catalog.business_area?.province_name}
                offersDelivery={catalog.offers_delivery}
                pages={catalog.store_pages}
                homeTo={
                  gestorUsername
                    ? storeGestorPublicPath(storeSlug, gestorUsername)
                    : storePublicPath(storeSlug)
                }
                clearFab
              />
            </div>
          ) : null}
        </BuyerShell>
      </BuyerDisplayedLocationProvider>
      <BuyerMarketplaceNav
        catalogCategories={catalogCategories}
        catalogCategoriesLoading={loading}
        storeSlug={storeSlug}
        gestorUsername={gestorUsername}
        storePhotoUrl={catalog?.store?.profile_photo_url}
        storeName={catalog?.store?.store_name}
      />
    </CatalogThemeScope>
  );
}
