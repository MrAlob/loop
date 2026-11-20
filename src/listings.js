import { LISTINGS_URL } from './api.js'
import cardHtml from './listing-card.html?raw'

const grid = document.querySelector('#listings')
const status = document.querySelector('#listings-status')

// Vite loads the card HTML as text. We turn it into a template so each auction gets its own copy.
const template = document.createElement('template')
template.innerHTML = cardHtml

function listingCard(listing) {
  const card = template.content.cloneNode(true)

  const link = card.querySelector('h3 a')
  link.href = '/listing/?id=' + encodeURIComponent(listing.id)
  link.textContent = listing.title
  const [category, condition] = listing.tags
  card.querySelector('.category').textContent = category || 'Auction'
  card.querySelector('.condition').textContent = condition || ''
  const bids = listing.bids || []
  const highest = bids.reduce((max, bid) => Math.max(max, bid.amount), 0)
  card.querySelector('.price').textContent = highest ? highest + ' cr' : 'No bids yet'
  card.querySelector('.bid-count').textContent = listing._count.bids === 1 ? '1 bid' : listing._count.bids + ' bids'

  const time = card.querySelector('time')
  // Keep the original timestamp in the HTML and show the closing time in the visitor's time zone.
  time.dateTime = listing.endsAt
  time.textContent = new Date(listing.endsAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const photo = listing.media?.[0]

  if (photo?.url) {
    const image = card.querySelector('img')
    const fallback = card.querySelector('span')

    image.alt = photo.alt || listing.title
    image.hidden = false
    fallback.hidden = true

    // A listing can have a photo URL that no longer works. Show the fallback text if it fails.
    image.onerror = () => {
      image.hidden = true
      fallback.hidden = false
    }

    image.src = photo.url
  }

  return card
}

const keyword = document.querySelector('#keyword')

// Keep the downloaded listings so visitors can change the filters without another API request.
const listings = []
const filters = document.querySelector('#categories')
const sort = document.querySelector('#sort')
if (keyword) {
  keyword.value = new URLSearchParams(location.search).get('q') || ''
  for (const category of ['All finds', 'Furniture', 'Tech', 'Bikes', 'Books', 'Home', 'Other']) {
    const label = document.createElement('label')
    const radio = document.createElement('input')
    radio.type = 'radio'
    radio.name = 'category'
    radio.value = category === 'All finds' ? '' : category
    radio.checked = !radio.value
    radio.className = 'sr-only'
    label.append(radio, category)
    filters.append(label)
  }
}

function showListings() {
  const query = keyword?.value.trim().toLowerCase() || ''

  const category = filters?.querySelector(':checked')?.value
  const matches = listings.filter(listing => {
    const text = [listing.title, listing.description, ...listing.tags].join(' ').toLowerCase()
    return (!category || listing.tags[0]?.toLowerCase() === category.toLowerCase()) && text.includes(query)
  })

  if (sort?.value === 'created') matches.sort((a, b) => Date.parse(b.created) - Date.parse(a.created))
  else matches.sort((a, b) => Date.parse(a.endsAt) - Date.parse(b.endsAt))

  grid.replaceChildren(...matches.map(listingCard))

  if (matches.length) status.textContent = keyword ? matches.length + (matches.length === 1 ? ' find' : ' finds') : ''
  else if (listings.length) status.textContent = 'No matching auctions. Try another keyword or clear the filter.'
  else status.textContent = 'There are no active auctions right now.'
}

async function loadListings() {
  try {
    // Only Browse has a search field. It loads all active auctions in batches of 100. The homepage loads the next four to close.
    const limit = keyword ? 100 : 4
    let page = 1

    while (page) {
      const url = `${LISTINGS_URL}?_active=true&_bids=true&sort=endsAt&sortOrder=asc&limit=${limit}&page=${page}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Could not load auctions')

      const { data, meta } = await response.json()
      listings.push(...data)
      page = keyword ? meta.nextPage : null
    }

    showListings()
    filters?.addEventListener('change', showListings)
    sort?.addEventListener('change', showListings)
    keyword?.addEventListener('input', showListings)
  } catch {
    status.textContent = 'Could not load auctions. Refresh the page to try again.'
  }
}

loadListings()
