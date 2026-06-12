export function isProductSoldOut(product) {
  return product?.is_available === false
}

export function isProductPurchasable(product) {
  return !product?.view_only && !isProductSoldOut(product)
}

export function getProductPickupDisplay(product) {
  if (!product) {
    return { requiresPickup: false, municipalityName: null, detailNotice: null }
  }

  if (product.pickup_required) {
    return {
      requiresPickup: true,
      municipalityName: product.pickup_municipality_name ?? null,
      detailNotice: product.pickup_notice ?? null,
    }
  }

  if (product.pickup_notice) {
    const match = product.pickup_notice.match(/Recoger en (.+)$/)
    return {
      requiresPickup: true,
      municipalityName: match?.[1]?.trim() ?? null,
      detailNotice: product.pickup_notice,
    }
  }

  return { requiresPickup: false, municipalityName: null, detailNotice: null }
}
