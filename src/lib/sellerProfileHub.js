/** Configuración del hub visual «Mi cuenta» del perfil vendedor. */

export const PROFILE_PANEL_IDS = Object.freeze({
  identity: 'identity',
  location: 'location',
  categories: 'categories',
  social: 'social',
  advanced: 'advanced',
  feedback: 'feedback',
  marketplace: 'marketplace',
})

/** Paneles que editan el formulario principal (Guardar cambios). */
export const PROFILE_FORM_PANEL_IDS = Object.freeze([
  PROFILE_PANEL_IDS.identity,
  PROFILE_PANEL_IDS.location,
  PROFILE_PANEL_IDS.categories,
  PROFILE_PANEL_IDS.social,
])

const PANELS = Object.freeze({
  [PROFILE_PANEL_IDS.identity]: {
    id: PROFILE_PANEL_IDS.identity,
    label: 'Identidad',
    description: 'Biografía de tu tienda',
    kind: 'form',
    icon: 'identity',
  },
  [PROFILE_PANEL_IDS.location]: {
    id: PROFILE_PANEL_IDS.location,
    label: 'Ubicación y entrega',
    description: 'Zona, mapa y domicilio',
    kind: 'form',
    icon: 'location',
  },
  [PROFILE_PANEL_IDS.categories]: {
    id: PROFILE_PANEL_IDS.categories,
    label: 'Categorías',
    description: 'Cómo te encuentran los compradores',
    kind: 'form',
    icon: 'categories',
  },
  [PROFILE_PANEL_IDS.social]: {
    id: PROFILE_PANEL_IDS.social,
    label: 'Redes sociales',
    description: 'Instagram y Facebook',
    kind: 'form',
    icon: 'social',
  },
  [PROFILE_PANEL_IDS.advanced]: {
    id: PROFILE_PANEL_IDS.advanced,
    label: 'Nombre y teléfono',
    description: 'Datos de acceso a tu cuenta',
    kind: 'panel',
    icon: 'account',
  },
  [PROFILE_PANEL_IDS.feedback]: {
    id: PROFILE_PANEL_IDS.feedback,
    label: 'Quejas y sugerencias',
    description: 'Escríbenos al equipo',
    kind: 'panel',
    icon: 'feedback',
  },
  [PROFILE_PANEL_IDS.marketplace]: {
    id: PROFILE_PANEL_IDS.marketplace,
    label: 'Explorar el marketplace',
    description: 'Compra en otras tiendas',
    kind: 'action',
    icon: 'marketplace',
  },
})

export const PROFILE_MENU_SECTIONS = Object.freeze([
  {
    id: 'general',
    title: 'General',
    itemIds: [
      PROFILE_PANEL_IDS.identity,
      PROFILE_PANEL_IDS.location,
      PROFILE_PANEL_IDS.categories,
      PROFILE_PANEL_IDS.social,
    ],
  },
  {
    id: 'account',
    title: 'Cuenta',
    itemIds: [
      PROFILE_PANEL_IDS.advanced,
      PROFILE_PANEL_IDS.feedback,
      PROFILE_PANEL_IDS.marketplace,
    ],
  },
])

export function getProfilePanel(panelId) {
  if (!panelId) return null
  return PANELS[panelId] ?? null
}

export function isProfileFormPanel(panelId) {
  return PROFILE_FORM_PANEL_IDS.includes(panelId)
}

export function isProfileHubPanel(panelId) {
  const panel = getProfilePanel(panelId)
  return Boolean(panel && panel.kind !== 'action')
}

/**
 * Resuelve qué hacer al tocar un ítem del menú.
 * @returns {{ type: 'open' | 'action', panelId: string } | null}
 */
export function resolveProfileMenuAction(panelId) {
  const panel = getProfilePanel(panelId)
  if (!panel) return null
  if (panel.kind === 'action') {
    return { type: 'action', panelId: panel.id }
  }
  return { type: 'open', panelId: panel.id }
}

/** Estado del hub: null = lista principal; string = panel abierto. */
export function openProfilePanel(currentPanelId, nextPanelId) {
  if (!isProfileHubPanel(nextPanelId)) return currentPanelId ?? null
  return nextPanelId
}

export function closeProfilePanel() {
  return null
}

export function getProfileMenuSections() {
  return PROFILE_MENU_SECTIONS.map((section) => ({
    id: section.id,
    title: section.title,
    items: section.itemIds.map((id) => PANELS[id]).filter(Boolean),
  }))
}

export function getProfileHubSubtitle(profile) {
  const phone = (profile?.phone || '').trim()
  if (phone) return phone
  return 'Completa los datos de tu tienda'
}
