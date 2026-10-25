import assert from 'node:assert/strict'
import { test } from 'node:test'

import { areaKey, productServiceAreas, selectedProductSalesAreas } from '../../src/lib/businessArea.js'

const profile = {
  offers_delivery: true,
  business_area: {
    province_id: 'p1',
    province_name: 'La Habana',
    municipality_id: 'm1',
    municipality_name: 'Playa',
  },
  delivery_areas: [
    {
      province_id: 'p1',
      province_name: 'La Habana',
      municipality_id: 'm2',
      municipality_name: 'Marianao',
    },
  ],
}

test('productServiceAreas mantiene las zonas de venta aunque no acepte domicilio', () => {
  const withoutDelivery = { ...profile, offers_delivery: false }
  assert.deepEqual(
    productServiceAreas(withoutDelivery).map((area) => area.municipality_id),
    ['m1', 'm2'],
  )
})

test('selectedProductSalesAreas respeta las zonas desmarcadas', () => {
  const areas = productServiceAreas(profile)
  const selected = selectedProductSalesAreas(profile, [areaKey(areas[0])])
  assert.deepEqual(
    selected.map((area) => area.municipality_id),
    ['m1'],
  )
})
