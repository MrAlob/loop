function showImage(id, photo) {
  const image = document.getElementById(id)
  if (!photo?.url) {
    image.hidden = true
    image.removeAttribute('src')
    return
  }
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

export function showAccount(profile) {
  document.querySelector('#balance').textContent = profile.credits.toLocaleString('en-US') + ' cr'
  document.querySelector('#member-name').textContent = profile.name
  showImage('member-avatar', profile.avatar)
}

function showDetails(profile) {
  document.querySelector('#profile-name').textContent = profile.name
  document.querySelector('#bio').textContent = profile.bio || 'No bio yet.'
  showImage('banner', profile.banner)
  showImage('avatar', profile.avatar)
}

export async function showProfile(profile, getProfileData) {
  showDetails(profile)
  const dialog = document.querySelector('#settings')
  const form = document.querySelector('#profile-form')
  const error = document.querySelector('#save-error')
  const submit = form.querySelector('button')
  document.querySelector('#edit-profile').onclick = () => {
    form.elements.bio.value = profile.bio || ''
    for (const field of ['avatar', 'banner']) {
      form.elements[field].value = profile[field]?.url || ''
      form.elements[field].required = Boolean(profile[field]?.url)
    }
    error.textContent = ''
    document.querySelector('#saved').textContent = ''
    dialog.showModal()
  }
  document.querySelector('#close-settings').onclick = () => dialog.close()

  form.onsubmit = async event => {
    event.preventDefault()
    if (submit.disabled) return
    submit.disabled = true
    error.textContent = ''
    const changes = { bio: form.elements.bio.value.trim() }
    // Send new image URLs only when the student changes them.
    for (const field of ['avatar', 'banner']) {
      const url = form.elements[field].value.trim()
      if (url && url !== profile[field]?.url) changes[field] = { url, alt: '' }
    }
    try {
      const result = await getProfileData('', changes)
      profile = result.data
      showDetails(profile)
      showAccount(profile)
      dialog.close()
      document.querySelector('#saved').textContent = 'Profile saved.'
    } catch (reason) {
      error.textContent = 'Could not save your profile. ' + reason.message
    } finally {
      submit.disabled = false
    }
  }

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
