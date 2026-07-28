import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  PROFILE_PANEL_IDS,
  closeProfilePanel,
  getProfileMenuSections,
  isProfileFormPanel,
  openProfilePanel,
  resolveProfileMenuAction,
} from '../../src/lib/sellerProfileHub.js'

/**
 * Simula la navegación del hub Mi cuenta sin montar React.
 * La acción marketplace se trata como navegación externa (sin abrir panel).
 */
function simulateProfileHubFlow(steps) {
  let activePanel = null
  const opened = []
  let marketplaceRequested = false

  for (const step of steps) {
    if (step === 'back') {
      activePanel = closeProfilePanel()
      continue
    }

    const action = resolveProfileMenuAction(step)
    if (!action) {
      throw new Error(`Acción inválida: ${step}`)
    }

    if (action.type === 'action' && action.panelId === PROFILE_PANEL_IDS.marketplace) {
      marketplaceRequested = true
      continue
    }

    activePanel = openProfilePanel(activePanel, action.panelId)
    opened.push({
      panelId: activePanel,
      showsSave: isProfileFormPanel(activePanel),
    })
  }

  return { activePanel, opened, marketplaceRequested }
}

test('flujo integrado: hub → identidad → guardar panel → volver → ubicación', () => {
  const result = simulateProfileHubFlow([
    PROFILE_PANEL_IDS.identity,
    'back',
    PROFILE_PANEL_IDS.location,
  ])

  assert.equal(result.activePanel, PROFILE_PANEL_IDS.location)
  assert.deepEqual(result.opened, [
    { panelId: PROFILE_PANEL_IDS.identity, showsSave: true },
    { panelId: PROFILE_PANEL_IDS.location, showsSave: true },
  ])
  assert.equal(result.marketplaceRequested, false)
})

test('flujo integrado: cuenta avanzada no muestra Guardar cambios del form', () => {
  const result = simulateProfileHubFlow([PROFILE_PANEL_IDS.advanced, PROFILE_PANEL_IDS.feedback])
  assert.equal(result.activePanel, PROFILE_PANEL_IDS.feedback)
  assert.deepEqual(result.opened, [
    { panelId: PROFILE_PANEL_IDS.advanced, showsSave: false },
    { panelId: PROFILE_PANEL_IDS.feedback, showsSave: false },
  ])
})

test('flujo integrado: marketplace navega sin abrir panel', () => {
  const result = simulateProfileHubFlow([
    PROFILE_PANEL_IDS.identity,
    PROFILE_PANEL_IDS.marketplace,
  ])

  assert.equal(result.activePanel, PROFILE_PANEL_IDS.identity)
  assert.equal(result.marketplaceRequested, true)
  assert.equal(result.opened.length, 1)
})

test('flujo integrado: el menú del hub cubre todos los paneles editables', () => {
  const sections = getProfileMenuSections()
  const editable = sections
    .flatMap((section) => section.items)
    .filter((item) => item.kind !== 'action')

  assert.ok(editable.length >= 7)
  assert.ok(editable.some((item) => item.id === PROFILE_PANEL_IDS.gestores))
  for (const item of editable) {
    const opened = openProfilePanel(null, item.id)
    assert.equal(opened, item.id)
  }
})
