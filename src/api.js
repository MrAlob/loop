const baseUrl = (import.meta.env.VITE_NOROFF_API_URL || 'https://v2.api.noroff.dev').replace(/\/+$/, '')

export const AUTH_URL = baseUrl + '/auth'
export const LISTINGS_URL = baseUrl + '/auction/listings'
export const PROFILES_URL = baseUrl + '/auction/profiles'
