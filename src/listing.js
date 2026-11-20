import { LISTINGS_URL } from './api.js'
import { editListing, listingRequest } from './create.js'

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

function setupBidding(listing) {
  const end = new Date(listing.endsAt)
  if (end <= new Date()) return

  const name = sessionStorage.getItem('loop.name')
  if (!name || !sessionStorage.getItem('loop.accessToken')) {
    document.querySelector('#bid-login').hidden = false
    return
  }
  if (name === listing.seller.name) return

  const form = document.querySelector('#bid-form')
  const input = form.querySelector('input')
  const button = form.querySelector('button')
  const message = document.querySelector('#bid-status')
  const highestBid = Math.max(0, ...listing.bids.map(bid => bid.amount))
  input.min = highestBid + 1
  document.querySelector('#bid-hint').textContent = `Minimum bid: ${input.min} cr`
  form.hidden = false

  form.onsubmit = async event => {
    event.preventDefault()
    if (button.disabled) return
    button.disabled = true
    if (end <= new Date()) {
      message.textContent = 'This auction has ended.'
      return
    }

    message.textContent = 'Placing bid…'
    try {
      await listingRequest('POST', '/' + encodeURIComponent(listing.id) + '/bids', {
        amount: input.valueAsNumber,
      })
      // Reload the bid history and credit balance from Noroff after a successful bid.
      location.reload()
    } catch (error) {
      message.textContent = 'Could not place bid. ' + error.message
      button.disabled = false
    }
  }
}

function showOwnerActions(listing) {
  if (!sessionStorage.getItem('loop.accessToken') || sessionStorage.getItem('loop.name') !== listing.seller.name) return

  const dialog = document.querySelector('#confirm-delete')
  const error = document.querySelector('#delete-error')
  const remove = document.querySelector('#remove')
  document.querySelector('#owner-actions').hidden = false
  document.querySelector('#edit-listing').onclick = () => editListing(listing)
  document.querySelector('#delete-listing').onclick = () => {
    error.textContent = ''
    dialog.showModal()
  }
  document.querySelector('#keep').onclick = () => dialog.close()
  remove.onclick = async () => {
    remove.disabled = true
    try {
      await listingRequest('DELETE', '/' + encodeURIComponent(listing.id))
      location.replace('/profile/')
    } catch (reason) {
      error.textContent = 'Could not delete the listing. ' + reason.message
      remove.disabled = false
    }
  }
}

async function loadListing() {
  if (!id) {
    status.textContent = 'No auction selected. Choose a listing from Browse.'
    return
  }

  try {
    // Request the seller and bids together with the listing.
    const url = `${LISTINGS_URL}/${encodeURIComponent(id)}?_seller=true&_bids=true`
    const response = await fetch(url)
    if (response.status === 404 || response.status === 400) {
      status.textContent = 'Auction not found.'
      return
    }
    if (!response.ok) throw new Error('Listing request failed')
    const { data } = await response.json()
    showListing(data)
    showOwnerActions(data)
    setupBidding(data)
  } catch {
    status.textContent = 'Could not load the auction. Refresh to try again.'
  }
}

loadListing()
