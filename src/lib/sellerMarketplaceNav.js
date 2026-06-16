import { getMunicipalityById, getProvinceById } from '../constants/cubaLocations'
import {
  getBuyerLocation,
  hasCompleteBuyerLocation,
  resolveBuyerEntryPath,
  setBuyerMunicipality,
  setBuyerProvince,
} from './buyerLocation'
import { isSellerAuthenticated } from './sellerAuth'

const RETURN_PATH_KEY = 'pala-jaba-seller-return-path'
const DEFAULT_SELLER_RETURN_PATH = '/tienda'

export function markSellerMarketplaceVisit(returnPath = '/tienda/perfil') {
  sessionStorage.setItem(RETURN_PATH_KEY, returnPath)
}

export function getSellerReturnPath() {
  return sessionStorage.getItem(RETURN_PATH_KEY) || DEFAULT_SELLER_RETURN_PATH
}

export function clearSellerMarketplaceVisit() {
  sessionStorage.removeItem(RETURN_PATH_KEY)
}

export function isSellerBrowsingMarketplace() {
  return isSellerAuthenticated() && sessionStorage.getItem(RETURN_PATH_KEY) != null
}

export function seedBuyerLocationFromSellerProfile(profile) {
  if (hasCompleteBuyerLocation()) return false

  const area = profile?.business_area
  if (!area?.province_id || !area?.municipality_id) return false

  const province = getProvinceById(area.province_id)
  const municipality = getMunicipalityById(area.province_id, area.municipality_id)
  if (!province || !municipality) return false

  const current = getBuyerLocation()
  if (!current?.province?.id) {
    setBuyerProvince({ id: province.id, name: province.name })
  }

  setBuyerMunicipality({ id: municipality.id, name: municipality.name })
  return true
}

export function beginSellerMarketplaceVisit(profile, returnPath = '/tienda/perfil') {
  markSellerMarketplaceVisit(returnPath)
  seedBuyerLocationFromSellerProfile(profile)
  return resolveBuyerEntryPath()
}
