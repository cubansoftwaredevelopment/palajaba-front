import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  PROFILE_PANEL_IDS,
  closeProfilePanel,
  getProfileHubSubtitle,
  getProfileMenuSections,
  getProfilePanel,
  isProfileFormPanel,
  isProfileHubPanel,
  openProfilePanel,
  resolveProfileMenuAction,
} from '../../src/lib/sellerProfileHub.js'

test('getProfileMenuSections agrupa General y Cuenta sin solapes', () => {
  const sections = getProfileMenuSections()
  assert.equal(sections.length, 3)
  assert.equal(sections[0].id, 'marketplace')
  assert.equal(sections[1].title, 'General')
  assert.equal(sections[2].title, 'Cuenta')

  const ids = sections.flatMap((section) => section.items.map((item) => item.id))
  assert.deepEqual(ids, [
    PROFILE_PANEL_IDS.marketplace,
    PROFILE_PANEL_IDS.advertising,
    PROFILE_PANEL_IDS.identity,
    PROFILE_PANEL_IDS.location,
    PROFILE_PANEL_IDS.categories,
    PROFILE_PANEL_IDS.social,
    PROFILE_PANEL_IDS.gestores,
    PROFILE_PANEL_IDS.advanced,
    PROFILE_PANEL_IDS.feedback,
  ])
  assert.equal(isProfileFormPanel(PROFILE_PANEL_IDS.gestores), true)
  assert.equal(new Set(ids).size, ids.length)
})

test('isProfileFormPanel solo marca paneles del formulario principal', () => {
  assert.equal(isProfileFormPanel(PROFILE_PANEL_IDS.identity), true)
  assert.equal(isProfileFormPanel(PROFILE_PANEL_IDS.location), true)
  assert.equal(isProfileFormPanel(PROFILE_PANEL_IDS.advanced), false)
  assert.equal(isProfileFormPanel(PROFILE_PANEL_IDS.marketplace), false)
})

test('resolveProfileMenuAction abre paneles y trata marketplace como acción', () => {
  assert.deepEqual(resolveProfileMenuAction(PROFILE_PANEL_IDS.social), {
    type: 'open',
    panelId: PROFILE_PANEL_IDS.social,
  })
  assert.deepEqual(resolveProfileMenuAction(PROFILE_PANEL_IDS.marketplace), {
    type: 'action',
    panelId: PROFILE_PANEL_IDS.marketplace,
  })
  assert.equal(resolveProfileMenuAction('no-existe'), null)
})

test('openProfilePanel ignora acciones y closeProfilePanel vuelve al hub', () => {
  assert.equal(openProfilePanel(null, PROFILE_PANEL_IDS.identity), PROFILE_PANEL_IDS.identity)
  assert.equal(openProfilePanel(PROFILE_PANEL_IDS.identity, PROFILE_PANEL_IDS.marketplace), PROFILE_PANEL_IDS.identity)
  assert.equal(isProfileHubPanel(PROFILE_PANEL_IDS.marketplace), false)
  assert.equal(isProfileHubPanel(PROFILE_PANEL_IDS.advertising), true)
  assert.equal(openProfilePanel(null, PROFILE_PANEL_IDS.advertising), PROFILE_PANEL_IDS.advertising)
  assert.equal(closeProfilePanel(), null)
})

test('getProfilePanel y getProfileHubSubtitle exponen textos de UI', () => {
  const panel = getProfilePanel(PROFILE_PANEL_IDS.location)
  assert.equal(panel.label, 'Ubicación y entrega')
  assert.equal(getProfileHubSubtitle({ phone: '51234567' }), '51234567')
  assert.equal(getProfileHubSubtitle({}), 'Completa los datos de tu tienda')
})
