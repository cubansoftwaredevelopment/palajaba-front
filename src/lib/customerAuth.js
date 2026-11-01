const TOKEN_KEY = 'pala_jaba_customer_token'
const PROFILE_KEY = 'pala_jaba_customer_profile'
export const CUSTOMER_AUTH_CHANGE_EVENT = 'pala-jaba:customer-auth-change'

export function getCustomerToken() {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

export function getCustomerProfile() {
  try {
    const value = localStorage.getItem(PROFILE_KEY)
    return value ? JSON.parse(value) : null
  } catch { return null }
}

export function setCustomerSession(token, customer) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(PROFILE_KEY, JSON.stringify(customer))
    window.dispatchEvent(new CustomEvent(CUSTOMER_AUTH_CHANGE_EVENT, { detail: customer }))
  } catch { /* storage may be disabled */ }
}

export function updateCustomerProfile(customer) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(customer))
    window.dispatchEvent(new CustomEvent(CUSTOMER_AUTH_CHANGE_EVENT, { detail: customer }))
  } catch { /* storage may be disabled */ }
}

export function clearCustomerSession() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(PROFILE_KEY)
    window.dispatchEvent(new CustomEvent(CUSTOMER_AUTH_CHANGE_EVENT, { detail: null }))
  } catch { /* storage may be disabled */ }
}

export function isCustomerAuthenticated() { return Boolean(getCustomerToken()) }
