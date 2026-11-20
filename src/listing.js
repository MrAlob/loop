const id = new URLSearchParams(location.search).get('id')
const status = document.querySelector('#status')

function showPhotos(listing) {
  const gallery = document.querySelector('#photos')

  for (const photo of listing.media) {
    if (!photo.url) continue
    const image = new Image()
    image.alt = photo.alt || listing.title
    image.className = 'w-full rounded-xl'
    image.onerror = () => {
      image.remove()
      if (!gallery.children.length) gallery.textContent = 'No photo available'
    }
    if (!gallery.children.length) gallery.textContent = ''
    gallery.append(image)
    image.src = photo.url
  }
}

function showListing(listing) {
  document.title = listing.title + ' | Loop'
  document.querySelector('#title').textContent = listing.title
  document.querySelector('#description').textContent = listing.description || 'No description provided.'
  document.querySelector('#seller').textContent = listing.seller.name
  showPhotos(listing)

  const deadline = document.querySelector('#deadline')
  const end = new Date(listing.endsAt)
  deadline.dateTime = listing.endsAt
  deadline.textContent = end.toLocaleString()
  if (end <= new Date()) document.querySelector('#deadline-label').textContent = 'Auction ended'

  // In an ascending-price auction the highest bid is the current price.
  const bids = listing.bids.sort((a, b) => b.amount - a.amount)
  document.querySelector('#amount').textContent = bids.length ? bids[0].amount + ' cr' : 'No bids'
  document.querySelector('#empty').hidden = bids.length > 0
  const history = document.querySelector('#bids')
  for (const bid of bids) {
    const row = document.createElement('li')
    row.className = 'py-2'
    row.textContent = bid.bidder.name + ' · ' + bid.amount + ' cr · ' + new Date(bid.created).toLocaleString()
    history.append(row)
  }

  status.textContent = ''
  document.querySelector('#details').hidden = false
}

async function loadListing() {
  if (!id) {
    status.textContent = 'No auction selected. Choose a listing from Browse.'
    return
  }

  try {
    // Request the seller and bids together with the listing.
    const url = 'https://v2.api.noroff.dev/auction/listings/' + encodeURIComponent(id) + '?_seller=true&_bids=true'
    const response = await fetch(url)
    if (response.status === 404 || response.status === 400) {
      status.textContent = 'Auction not found.'
      return
    }
    if (!response.ok) throw new Error('Listing request failed')
    const { data } = await response.json()
    showListing(data)
  } catch {
    status.textContent = 'Could not load the auction. Refresh to try again.'
  }
}

loadListing()
