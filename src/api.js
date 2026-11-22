const baseUrl = 'https://v2.api.noroff.dev'

export const AUTH_URL = baseUrl + '/auth'
export const LISTINGS_URL = baseUrl + '/auction/listings'
export const PROFILES_URL = baseUrl + '/auction/profiles'

// Authenticated requests go through our own server so the API key is never bundled by Vite.
export function privateApiUrl(url) {
  const endpoint = new URL(url)
  if (endpoint.origin !== baseUrl) throw new Error('Unexpected API origin')
  return '/api/noroff?path=' + encodeURIComponent(endpoint.pathname + endpoint.search)
}
