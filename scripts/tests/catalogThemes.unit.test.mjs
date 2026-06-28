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

test('normalizeCatalogTheme acepta todos los temas soportados', () => {
  assert.equal(normalizeCatalogTheme('default'), 'default')
  assert.equal(normalizeCatalogTheme('grey'), 'grey')
  assert.equal(normalizeCatalogTheme('red'), 'red')
  assert.equal(normalizeCatalogTheme('pink'), 'pink')
  assert.equal(normalizeCatalogTheme('green'), 'green')
  assert.equal(normalizeCatalogTheme('blue'), 'blue')
  assert.equal(normalizeCatalogTheme(' GREY '), 'grey')
  assert.equal(normalizeCatalogTheme(' RED '), 'red')
  assert.equal(normalizeCatalogTheme(' PINK '), 'pink')
  assert.equal(normalizeCatalogTheme(' GREEN '), 'green')
  assert.equal(normalizeCatalogTheme(' BLUE '), 'blue')
})

test('getCatalogThemeClass mapea clases css por tema', () => {
  assert.equal(getCatalogThemeClass('default'), 'catalog-theme-default')
  assert.equal(getCatalogThemeClass('grey'), 'catalog-theme-grey')
  assert.equal(getCatalogThemeClass('red'), 'catalog-theme-red')
  assert.equal(getCatalogThemeClass('pink'), 'catalog-theme-pink')
  assert.equal(getCatalogThemeClass('green'), 'catalog-theme-green')
  assert.equal(getCatalogThemeClass('blue'), 'catalog-theme-blue')
  assert.equal(getCatalogThemeClass('unknown'), 'catalog-theme-default')
})

test('listCatalogThemes incluye todos los temas del catálogo', () => {
  const themes = listCatalogThemes()
  assert.deepEqual(
    themes.map((theme) => theme.id),
    ['default', 'grey', 'red', 'pink', 'green', 'blue'],
  )
})

test('tema azul expone la paleta oceánica de cinco tonos', () => {
  const blue = getCatalogThemeDefinition('blue')
  assert.deepEqual(blue.swatches, ['#092c56', '#225688', '#668ca9', '#a9cbe0', '#f0f5f4'])
})

test('tema verde usa amarillo-verde cálido con acentos lima', () => {
  const green = getCatalogThemeDefinition('green')
  assert.deepEqual(green.swatches, ['#33691e', '#558b2f', '#7cb342', '#9acd32', '#f1f8e9'])
})

test('tema rosa expone la paleta de cinco tonos rosa', () => {
  const pink = getCatalogThemeDefinition('pink')
  assert.deepEqual(pink.swatches, ['#c2185b', '#e91e63', '#f48fb1', '#f8bbd0', '#fce4ec'])
})

test('tema rojo usa rojos intensos separados del rosa magenta', () => {
  const red = getCatalogThemeDefinition('red')
  assert.deepEqual(red.swatches, ['#cc0000', '#e60000', '#ff2400', '#ff5722', '#fdfbf2'])
})

test('tema gris expone la paleta de cinco tonos', () => {
  const grey = getCatalogThemeDefinition('grey')
  assert.deepEqual(grey.swatches, ['#2b2b2b', '#565656', '#848484', '#b3b3b3', '#e0e0e0'])
})

test('DEFAULT_CATALOG_THEME es default', () => {
  assert.equal(DEFAULT_CATALOG_THEME, 'default')
})
