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
  assert.equal(normalizeCatalogTheme('purple'), 'purple')
  assert.equal(normalizeCatalogTheme('orange'), 'orange')
  assert.equal(normalizeCatalogTheme('yellow'), 'yellow')
  assert.equal(normalizeCatalogTheme(' GREY '), 'grey')
  assert.equal(normalizeCatalogTheme(' RED '), 'red')
  assert.equal(normalizeCatalogTheme(' PINK '), 'pink')
  assert.equal(normalizeCatalogTheme(' GREEN '), 'green')
  assert.equal(normalizeCatalogTheme(' BLUE '), 'blue')
  assert.equal(normalizeCatalogTheme(' PURPLE '), 'purple')
  assert.equal(normalizeCatalogTheme(' ORANGE '), 'orange')
  assert.equal(normalizeCatalogTheme(' YELLOW '), 'yellow')
})

test('getCatalogThemeClass mapea clases css por tema', () => {
  assert.equal(getCatalogThemeClass('default'), 'catalog-theme-default')
  assert.equal(getCatalogThemeClass('grey'), 'catalog-theme-grey')
  assert.equal(getCatalogThemeClass('red'), 'catalog-theme-red')
  assert.equal(getCatalogThemeClass('pink'), 'catalog-theme-pink')
  assert.equal(getCatalogThemeClass('green'), 'catalog-theme-green')
  assert.equal(getCatalogThemeClass('blue'), 'catalog-theme-blue')
  assert.equal(getCatalogThemeClass('purple'), 'catalog-theme-purple')
  assert.equal(getCatalogThemeClass('orange'), 'catalog-theme-orange')
  assert.equal(getCatalogThemeClass('yellow'), 'catalog-theme-yellow')
  assert.equal(getCatalogThemeClass('unknown'), 'catalog-theme-default')
})

test('listCatalogThemes incluye todos los temas del catálogo', () => {
  const themes = listCatalogThemes()
  assert.deepEqual(
    themes.map((theme) => theme.id),
    ['default', 'grey', 'red', 'pink', 'green', 'blue', 'purple', 'orange', 'yellow'],
  )
})

test('tema azul contrasta abisal con azul cielo brillante', () => {
  const blue = getCatalogThemeDefinition('blue')
  assert.deepEqual(blue.swatches, ['#092c56', '#225688', '#1976d2', '#42a5f5', '#f0f5f4'])
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

test('tema morado expone la paleta violeta de cinco tonos', () => {
  const purple = getCatalogThemeDefinition('purple')
  assert.deepEqual(purple.swatches, ['#312a44', '#5b4b8a', '#8870e3', '#bab0c8', '#dad4df'])
})

test('tema naranja expone la paleta Mango accesible de cinco tonos', () => {
  const orange = getCatalogThemeDefinition('orange')
  assert.equal(orange.label, 'Mango')
  assert.equal(orange.description, 'Bien maduro y picao en cuadritos.')
  assert.deepEqual(orange.swatches, ['#c24100', '#ff7b00', '#ff8d21', '#ffa652', '#fff8f0'])
})

test('tema amarillo expone la paleta Marcolina accesible de cinco tonos', () => {
  const yellow = getCatalogThemeDefinition('yellow')
  assert.equal(yellow.label, 'Marcolina')
  assert.equal(
    yellow.description,
    'YA EMPEZÓ LA SOMBRILLA AMARILLA, VAMOS,  VEN A LA CASA E MARCOLINA',
  )
  assert.deepEqual(yellow.swatches, ['#7a6200', '#f7c319', '#facf43', '#fcdb6d', '#fdfbcf'])
})

test('DEFAULT_CATALOG_THEME es default', () => {
  assert.equal(DEFAULT_CATALOG_THEME, 'default')
})

test('cada tema expone el nombre y la descripción de la paleta', () => {
  assert.equal(getCatalogThemeDefinition('default').label, "Pa' La Jaba")
  assert.equal(getCatalogThemeDefinition('grey').label, 'Apagón')
  assert.equal(getCatalogThemeDefinition('red').label, 'Marpacífico')
  assert.equal(getCatalogThemeDefinition('pink').label, 'Flamenco')
  assert.equal(getCatalogThemeDefinition('green').label, 'Limonada')
  assert.equal(getCatalogThemeDefinition('blue').label, 'Varadero')
  assert.equal(getCatalogThemeDefinition('purple').label, 'Uva Caleta')
  assert.equal(getCatalogThemeDefinition('orange').label, 'Mango')
  assert.equal(getCatalogThemeDefinition('yellow').label, 'Marcolina')

  assert.match(getCatalogThemeDefinition('grey').description, /perro apagón 💡/)
  assert.match(getCatalogThemeDefinition('green').description, /🎶/)
})
