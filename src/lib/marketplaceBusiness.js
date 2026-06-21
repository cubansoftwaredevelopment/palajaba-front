export function getBusinessPickupDisplay(business) {
  if (!business) {
    return { requiresPickup: false, municipalityName: null, detailNotice: null }
  }

  if (business.pickup_required) {
    return {
      requiresPickup: true,
      municipalityName: business.pickup_municipality_name ?? null,
      detailNotice: business.pickup_notice ?? null,
    }
  }

  if (business.pickup_notice) {
    const match = business.pickup_notice.match(/Recoger en (.+)$/)
    return {
      requiresPickup: true,
      municipalityName: match?.[1]?.trim() ?? null,
      detailNotice: business.pickup_notice,
    }
  }

  return { requiresPickup: false, municipalityName: null, detailNotice: null }
}
