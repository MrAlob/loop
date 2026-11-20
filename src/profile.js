function showImage(id, photo) {
  if (!photo?.url) return
  const image = document.getElementById(id)
  image.alt = photo.alt || ''
  image.hidden = false
  image.onerror = () => { image.hidden = true }
  image.src = photo.url
}

function addListing(list, listing) {
  const item = document.createElement('li')
  const link = document.createElement('a')
  link.href = '/listing/?id=' + encodeURIComponent(listing.id)
  link.className = 'block break-words rounded-xl border border-[#d9ddcf] bg-white p-4 font-semibold hover:underline'
  link.textContent = listing.title
  item.append(link)
  list.append(item)
}

export async function showProfile(profile, getProfileData) {
  document.querySelector('#profile-name').textContent = profile.name
  document.querySelector('#bio').textContent = profile.bio || 'No bio yet.'
  showImage('banner', profile.banner)
  showImage('avatar', profile.avatar)

  const own = document.querySelector('#own-listings')
  for (const listing of profile.listings) addListing(own, listing)
  document.querySelector('#own-status').hidden = profile.listings.length > 0

  const status = document.querySelector('#bid-status')
  const bids = document.querySelector('#bid-listings')
  // A student may bid on the same listing several times, even across pages.
  const seen = new Set()
  let page = 1
  try {
    while (page) {
      const result = await getProfileData('/bids?_listings=true&limit=100&page=' + page)
      for (const { listing } of result.data) {
        if (!listing || seen.has(listing.id)) continue
        seen.add(listing.id)
        addListing(bids, listing)
      }
      page = result.meta.nextPage
    }
    status.textContent = seen.size ? '' : 'You haven’t bid on any listings yet.'
  } catch {
    status.textContent = 'Could not load all your bids. Refresh to try again.'
  }
}
