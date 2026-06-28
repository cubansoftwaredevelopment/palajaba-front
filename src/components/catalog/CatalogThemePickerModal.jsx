import { listCatalogThemes, normalizeCatalogTheme } from '../../lib/catalogThemes'
import SellerModalPortal from '../seller/SellerModalPortal'
import {
  sellerAlertError,
  sellerBtnSecondary,
  sellerFocusRing,
  sellerModalOverlay,
  sellerModalSheet,
  sellerModalTitle,
} from '../seller/sellerStyles'

export default function CatalogThemePickerModal({
  selectedTheme,
  saving = false,
  error = '',
  onClose,
  onSelectTheme,
}) {
  const themes = listCatalogThemes()

  return (
    <SellerModalPortal>
      <div
        className={sellerModalOverlay}
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-theme-title"
        onClick={onClose}
      >
        <div className={sellerModalSheet} onClick={(event) => event.stopPropagation()}>
          <div className="flex items-start justify-between gap-3 border-b border-brand-green/8 px-5 py-4">
            <div className="min-w-0">
              <h2 id="catalog-theme-title" className={sellerModalTitle}>
                Tema del catálogo
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-brand-carmelita/85">
                Elige cómo verán tu tienda tus clientes.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-carmelita/55 transition-colors touch-manipulation active:bg-brand-green/8 active:text-brand-carmelita ${sellerFocusRing}`}
              aria-label="Cerrar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-2">
              {themes.map((theme) => {
                const isSelected = normalizeCatalogTheme(selectedTheme) === theme.id
                return (
                  <button
                    key={theme.id}
                    type="button"
                    disabled={saving}
                    onClick={() => onSelectTheme(theme.id)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors touch-manipulation ${
                      isSelected
                        ? 'border-brand-green/30 bg-brand-green/[0.05]'
                        : 'border-brand-green/12 bg-brand-white active:bg-brand-green/[0.03]'
                    } ${sellerFocusRing}`}
                  >
                    <span className="flex items-start gap-3">
                      <span className="flex shrink-0 gap-1 pt-0.5">
                        {theme.swatches.map((color) => (
                          <span
                            key={color}
                            className="h-5 w-5 rounded-full border border-brand-green/10 shadow-sm"
                            style={{ backgroundColor: color }}
                            aria-hidden
                          />
                        ))}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-brand-green">{theme.label}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-brand-carmelita/85">
                          {theme.description}
                        </span>
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            {error ? (
              <p className={`mt-3 ${sellerAlertError}`} role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="border-t border-brand-green/8 px-5 py-4">
            <button type="button" onClick={onClose} disabled={saving} className={sellerBtnSecondary}>
              Cerrar
            </button>
            {saving ? (
              <p className="mt-2 text-center text-xs text-brand-carmelita/75">Guardando tema…</p>
            ) : (
              <p className="mt-2 text-center text-xs text-brand-carmelita/75">
                Toca un tema para aplicarlo de inmediato.
              </p>
            )}
          </div>
        </div>
      </div>
    </SellerModalPortal>
  )
}
