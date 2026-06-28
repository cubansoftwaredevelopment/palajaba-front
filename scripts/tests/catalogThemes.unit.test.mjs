import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  DEFAULT_CATALOG_THEME,
  getCatalogThemeClass,
  getCatalogThemeDefinition,
  listCatalogThemes,
  normalizeCatalogTheme,
} from '../../src/lib/catalogThemes.js'

test('normalizeCatalogTheme usa default para valores desconocidos', () => {
  assert.equal(normalizeCatalogTheme(null), 'default')
  assert.equal(normalizeCatalogTheme(''), 'default')
  assert.equal(normalizeCatalogTheme('neon'), 'default')
})

test('normalizeCatalogTheme acepta default, grey, red y pink', () => {
  assert.equal(normalizeCatalogTheme('default'), 'default')
  assert.equal(normalizeCatalogTheme('grey'), 'grey')
  assert.equal(normalizeCatalogTheme('red'), 'red')
  assert.equal(normalizeCatalogTheme('pink'), 'pink')
  assert.equal(normalizeCatalogTheme(' GREY '), 'grey')
  assert.equal(normalizeCatalogTheme(' RED '), 'red')
  assert.equal(normalizeCatalogTheme(' PINK '), 'pink')
})

test('getCatalogThemeClass mapea clases css por tema', () => {
  assert.equal(getCatalogThemeClass('default'), 'catalog-theme-default')
  assert.equal(getCatalogThemeClass('grey'), 'catalog-theme-grey')
  assert.equal(getCatalogThemeClass('red'), 'catalog-theme-red')
  assert.equal(getCatalogThemeClass('pink'), 'catalog-theme-pink')
  assert.equal(getCatalogThemeClass('unknown'), 'catalog-theme-default')
})

test('listCatalogThemes incluye clásico, gris, rojo y rosa', () => {
  const themes = listCatalogThemes()
  assert.deepEqual(
    themes.map((theme) => theme.id),
    ['default', 'grey', 'red', 'pink'],
  )
})

test('tema rosa expone la paleta de cinco tonos rosa', () => {
  const pink = getCatalogThemeDefinition('pink')
  assert.deepEqual(pink.swatches, ['#c2185b', '#e91e63', '#f48fb1', '#f8bbd0', '#fce4ec'])
})

test('tema rojo usa crema Jaba como fondo y escala burdeos de cinco tonos', () => {
  const red = getCatalogThemeDefinition('red')
  assert.deepEqual(red.swatches, ['#4a0a0f', '#5f0309', '#6e1a24', '#85222f', '#fdfbf2'])
})

test('tema gris expone la paleta de cinco tonos', () => {
  const grey = getCatalogThemeDefinition('grey')
  assert.deepEqual(grey.swatches, ['#2b2b2b', '#565656', '#848484', '#b3b3b3', '#e0e0e0'])
})

test('DEFAULT_CATALOG_THEME es default', () => {
  assert.equal(DEFAULT_CATALOG_THEME, 'default')
})
