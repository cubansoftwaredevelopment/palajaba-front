import { useMatch } from 'react-router-dom'

export function useBuyerMarketplaceHub() {
  const marketplace = useMatch({ path: '/comprar', end: true })
  const businesses = useMatch({ path: '/comprar/negocios', end: true })
  return Boolean(marketplace || businesses)
}
