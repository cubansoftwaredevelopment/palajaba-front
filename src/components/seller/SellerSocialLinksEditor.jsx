import SellerSelect from './SellerSelect'
import { sellerBtnSecondary, sellerFocusRing, sellerInput, sellerLabel } from './sellerStyles'
import {
  SOCIAL_LINK_LIMIT,
  SOCIAL_PLATFORMS,
  createSocialLink,
} from '../../lib/socialLinks'

export default function SellerSocialLinksEditor({ links, onChange }) {
  function updateLink(id, patch) {
    onChange(links.map((link) => (link.id === id ? { ...link, ...patch } : link)))
  }

  function removeLink(id) {
    onChange(links.filter((link) => link.id !== id))
  }

  return (
    <div className="flex flex-col gap-3">
      {links.map((link, index) => {
        const platform = SOCIAL_PLATFORMS.find((item) => item.value === link.platform) ?? SOCIAL_PLATFORMS[0]
        return (
          <div key={link.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <p className={sellerLabel}>Red {index + 1}</p>
              <button
                type="button"
                onClick={() => removeLink(link.id)}
                className={`text-xs font-semibold text-brand-carmelita/85 touch-manipulation ${sellerFocusRing}`}
              >
                Quitar
              </button>
            </div>
            <SellerSelect
              value={link.platform}
              onChange={(platformId) => updateLink(link.id, { platform: platformId })}
              options={SOCIAL_PLATFORMS}
              ariaLabel={`Tipo de la red ${index + 1}`}
            />
            {link.platform === 'other' ? (
              <input
                type="text"
                value={link.label}
                onChange={(event) => updateLink(link.id, { label: event.target.value })}
                placeholder="Nombre de la red"
                maxLength={40}
                className={sellerInput}
                aria-label={`Nombre de la red ${index + 1}`}
              />
            ) : null}
            <input
              type="text"
              value={link.value}
              onChange={(event) => updateLink(link.id, { value: event.target.value })}
              placeholder={platform.placeholder}
              maxLength={200}
              className={sellerInput}
              aria-label={`Usuario o enlace de la red ${index + 1}`}
            />
          </div>
        )
      })}

      <button
        type="button"
        onClick={() => onChange([...links, createSocialLink()])}
        disabled={links.length >= SOCIAL_LINK_LIMIT}
        className={sellerBtnSecondary}
      >
        Agregar red social
      </button>
    </div>
  )
}
