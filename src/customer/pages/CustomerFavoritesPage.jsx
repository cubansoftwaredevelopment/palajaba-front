import { AnimatePresence, motion, PresenceContext, useReducedMotion } from 'framer-motion'
import BuyerProductCard from '../../buyer/componentes/BuyerProductCard.jsx'
import { useCustomerAccount } from '../context/CustomerAccountContext.jsx'

export default function CustomerFavoritesPage() {
  const reducedMotion = useReducedMotion()
  const { favoriteProducts, setFavoriteProducts } = useCustomerAccount()

  return (
    <section className="space-y-4">
      {favoriteProducts.length ? (
        <PresenceContext.Provider value={null}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {favoriteProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  className="min-w-0"
                  exit={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.78, y: 16 }}
                  transition={{ duration: reducedMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  <BuyerProductCard
                    product={product}
                    enterIndex={index}
                    allowBuyAfterWarning={Boolean(product.warning_municipality)}
                    buyWarning={
                      product.warning_municipality
                        ? `La tienda no ofrece entrega en ${product.warning_municipality}. Debes recoger esta oferta${product.pickup_municipality_name ? ` en ${product.pickup_municipality_name}` : ''}.`
                        : product.unavailable_in_municipality === true
                          ? 'No pudimos comprobar que esta oferta esté disponible para tu municipio. Configura tu municipio y vuelve a intentarlo.'
                          : product.unavailable_in_municipality
                            ? `No pudimos comprobar que esta oferta esté disponible en ${product.unavailable_in_municipality}. Cambia tu municipio para buscarla en su zona.`
                            : ''
                    }
                    onFavoriteChange={(isFavorite) => {
                      if (isFavorite) return
                      window.setTimeout(() => {
                        setFavoriteProducts((current) => current.filter((item) => item.id !== product.id))
                      }, reducedMotion ? 0 : 700)
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </PresenceContext.Provider>
      ) : (
        <p className="text-sm text-brand-carmelita/70">Aún no tienes favoritos.</p>
      )}
    </section>
  )
}
