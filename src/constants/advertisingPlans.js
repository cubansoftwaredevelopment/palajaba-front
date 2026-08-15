/** Planes de publicidad contratables desde el perfil del vendedor. */

export const ADVERTISING_TAGLINE =
  'Destaca tu tienda en el marketplace. Elige el plan que mejor se ajuste a tu negocio.'

export const ADVERTISING_PLANS = Object.freeze([
  {
    id: 'ads-10',
    name: '10 días',
    eyebrow: 'Plan 1',
    amountUsd: 15,
    recommended: false,
    features: ['Banner 10 días', '1 reel', '1 post', '2 historias'],
  },
  {
    id: 'ads-20',
    name: '20 días',
    eyebrow: 'Plan 2',
    amountUsd: 20,
    recommended: true,
    features: ['Banner 20 días', '2 reels', '1 post', '3 historias'],
  },
  {
    id: 'ads-30',
    name: '30 días',
    eyebrow: 'Plan 3',
    amountUsd: 25,
    recommended: false,
    features: ['Banner 30 días', '2 reels', '2 posts', '4 historias'],
  },
])

export function getAdvertisingPlans() {
  return ADVERTISING_PLANS
}

export function getAdvertisingPlan(planId) {
  return ADVERTISING_PLANS.find((plan) => plan.id === planId) ?? null
}

export function getAdvertisingPlanHireLabel(plan) {
  if (!plan) return 'un plan de publicidad'
  return `${plan.eyebrow} — ${plan.name} (${plan.amountUsd} USD)`
}

export function buildAdvertisingPlanMessage(storeName, planName) {
  const name = (storeName || 'mi tienda').trim()
  const plan = (planName || 'un plan de publicidad').trim()
  return `Buenas, soy la tienda ${name} de Pa' La Jaba.

Deseo contratar el plan de publicidad ${plan}.`
}
