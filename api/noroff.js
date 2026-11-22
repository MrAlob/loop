// Only forward the authenticated Auction House routes used by Loop.
// Authentication is checked by Noroff; the API key stays on the server.
const API_ORIGIN = 'https://v2.api.noroff.dev'

function isAllowed(path, method) {
  const name = '[A-Za-z0-9_-]+'
  if (path === '/auction/listings') return method === 'POST'
  if (new RegExp(`^/auction/listings/${name}$`).test(path)) return ['PUT', 'DELETE'].includes(method)
  if (new RegExp(`^/auction/listings/${name}/bids$`).test(path)) return method === 'POST'
  if (new RegExp(`^/auction/profiles/${name}$`).test(path)) return ['GET', 'PUT'].includes(method)
  if (new RegExp(`^/auction/profiles/${name}/bids$`).test(path)) return method === 'GET'
  return false
}

function error(message, status) {
  return Response.json({ errors: [{ message }] }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function forwardNoroff(request, { apiKey = process.env.NOROFF_API_KEY } = {}) {
  const path = new URL(request.url).searchParams.get('path')
  if (!path || path.length > 2048) return error('Invalid API path.', 400)
  // Reject dot segments before URL parsing can normalize them away.
  if (/(?:^|\/)\.{1,2}(?:\/|$)|%(?:2e|2f|5c)/i.test(path.split('?')[0])) {
    return error('Endpoint not available.', 404)
  }

  let url
  try {
    url = new URL(path, API_ORIGIN)
  } catch {
    return error('Invalid API path.', 400)
  }
  if (url.origin !== API_ORIGIN || !isAllowed(url.pathname, request.method)) {
    return error('Endpoint not available.', 404)
  }

  const authorization = request.headers.get('authorization')
  if (!/^Bearer \S+$/.test(authorization || '')) return error('Log in to continue.', 401)
  if (!apiKey) return error('The server API key is not configured.', 503)

  const headers = new Headers({
    Authorization: authorization,
    'X-Noroff-API-Key': apiKey,
    Accept: 'application/json',
  })
  let body
  if (['POST', 'PUT'].includes(request.method)) {
    if (!request.headers.get('content-type')?.startsWith('application/json')) {
      return error('Only JSON requests are supported.', 415)
    }
    body = await request.text()
    if (body.length > 32768) return error('Request is too large.', 413)
    try {
      JSON.parse(body)
    } catch {
      return error('Invalid JSON request.', 400)
    }
    headers.set('Content-Type', 'application/json')
  }

  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
    })
    if (upstream.status >= 300 && upstream.status < 400) {
      return error('The API returned an unexpected redirect.', 502)
    }
    return new Response(upstream.status === 204 ? null : await upstream.text(), {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return error('Could not connect to the Noroff API.', 502)
  }
}

// Vercel runs this function for requests to /api/noroff.
export default { fetch(request) { return forwardNoroff(request) } }
