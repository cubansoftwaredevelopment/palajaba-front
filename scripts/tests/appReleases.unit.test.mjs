import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  shouldShowDownloadPrompt,
  shouldShowUpdatePrompt,
} from '../../src/appReleases/lib/prompt.js'

test('shouldShowDownloadPrompt solo fuera de la app nativa', () => {
  assert.equal(shouldShowDownloadPrompt(false), true)
  assert.equal(shouldShowDownloadPrompt(true), false)
})

test('shouldShowUpdatePrompt compara versión nativa vs main', () => {
  assert.equal(shouldShowUpdatePrompt('1.0.0', '1.0.1'), true)
  assert.equal(shouldShowUpdatePrompt('1.0.1', '1.0.1'), false)
  assert.equal(shouldShowUpdatePrompt('', '1.0.1'), false)
  assert.equal(shouldShowUpdatePrompt('1.0.1', ''), false)
  assert.equal(shouldShowUpdatePrompt(' 1.0.0 ', '1.0.0'), false)
})
