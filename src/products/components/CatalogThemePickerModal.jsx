import {
  PALETTE_SLOT_META,
  PALETTE_SLOTS,
  listCatalogThemes,
  normalizeCatalogPalette,
  normalizeCatalogTheme,
  paletteColorToCss,
  paletteFromTheme,
} from '../constants.js'
import SellerModalPortal from '../../components/seller/SellerModalPortal'
import { useDismissibleModal } from '../../components/buyer/useOrderModalPresence'
import {
  sellerAlertError,
  sellerBtnSecondary,
  sellerFocusRing,
  sellerModalOverlay,
  sellerModalSheet,
  sellerModalTitle,
} from '../../components/seller/sellerStyles'

function PaletteSlotRow({ slot, color, disabled, onChange, onCommit }) {
  const meta = PALETTE_SLOT_META[slot]
  const hex = color.hex
  const opacity = color.opacity

  return (
    <div className="rounded-2xl border border-brand-green/12 bg-brand-white px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-green">{meta.label}</p>
          <p className="text-[0.7rem] text-brand-carmelita/80">{meta.hint}</p>
        </div>
        <label className="relative flex h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-full border border-brand-green/15 shadow-sm">
          <span
            className="absolute inset-0"
            style={{ backgroundColor: paletteColorToCss(color) }}
            aria-hidden
          />
          <input
            type="color"
            value={hex}
            disabled={disabled}
            aria-label={`Color ${meta.label}`}
            onChange={(event) => {
              onChange({ hex: event.target.value })
              queueMicrotask(onCommit)
            }}
            onBlur={onCommit}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
        </label>
      </div>
      <label className="mt-2.5 flex items-center gap-3">
        <span className="w-16 shrink-0 text-[0.7rem] font-medium text-brand-carmelita/80">
          Opacidad
        </span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={opacity}
          disabled={disabled}
          aria-label={`Opacidad ${meta.label}`}
          onChange={(event) => onChange({ opacity: Number(event.target.value) })}
          onPointerUp={onCommit}
          onKeyUp={onCommit}
          className="min-w-0 flex-1 accent-brand-green"
        />
        <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-brand-green">
          {opacity}%
        </span>
      </label>
    </div>
  )
}

export default function CatalogThemePickerModal({
  selectedTheme,
  palette,
  saving = false,
  locked = false,
  error = '',
  onClose: requestClose,
  onSelectTheme,
  onPaletteChange,
  onPaletteCommit,
}) {
  const { dismiss: onClose, motionClass } = useDismissibleModal(requestClose)
  const themes = listCatalogThemes()
  const currentTheme = normalizeCatalogTheme(selectedTheme)
  const currentPalette = normalizeCatalogPalette(palette, currentTheme)
  const disabled = saving || locked

  return (
    <SellerModalPortal>
      <div
        className={`${sellerModalOverlay} ${motionClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-theme-title"
        onClick={onClose}
      >
        <div className={sellerModalSheet} onClick={(event) => event.stopPropagation()}>
          <div className="flex items-start justify-between gap-3 border-b border-brand-green/8 px-5 py-4">
            <div className="min-w-0">
              <h2 id="catalog-theme-title" className={sellerModalTitle}>
                Paleta del catálogo
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-brand-carmelita/85">
                {locked
                  ? 'La paleta de colores está disponible en el plan Premium.'
                  : 'Elige un tema y ajusta cada color y su opacidad.'}
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
                const isSelected = currentTheme === theme.id
                return (
                  <button
                    key={theme.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelectTheme(theme.id, paletteFromTheme(theme.id))}
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

            <div className="mt-4 space-y-2">
              <p className="px-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-brand-carmelita/75">
                Colores
              </p>
              {PALETTE_SLOTS.map((slot) => (
                <PaletteSlotRow
                  key={slot}
                  slot={slot}
                  color={currentPalette[slot]}
                  disabled={disabled}
                  onChange={(patch) => onPaletteChange(slot, patch)}
                  onCommit={onPaletteCommit}
                />
              ))}
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
              <p className="mt-2 text-center text-xs text-brand-carmelita/75">Guardando paleta…</p>
            ) : (
              <p className="mt-2 text-center text-xs text-brand-carmelita/75">
                {locked
                  ? 'Pasa a Premium para personalizar la paleta de tu catálogo.'
                  : 'Los cambios se ven al instante y se guardan al soltar el control.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </SellerModalPortal>
  )
}
