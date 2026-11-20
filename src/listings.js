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
  card.querySelector('.bid-count').textContent = `Bids: ${listing._count.bids}`

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
const noBids = document.querySelector('#no-bids')

// Keep the downloaded listings so visitors can change the filters without another API request.
let listings = []

function showListings() {
  const query = keyword?.value.trim().toLowerCase() || ''

  // Search the title, description, and tags. If the checkbox is selected, also require zero bids.
  const matches = listings.filter(listing => {
    const text = [listing.title, listing.description, ...listing.tags].join(' ').toLowerCase()
    return text.includes(query) && (!noBids?.checked || listing._count.bids === 0)
  })

  grid.replaceChildren(...matches.map(listingCard))

  if (matches.length) status.textContent = ''
  else if (listings.length) status.textContent = 'No matching auctions. Try another keyword or clear the filter.'
  else status.textContent = 'There are no active auctions right now.'
}

async function loadListings() {
  try {
    // Only Browse has a search field. It loads all active auctions in batches of 100. The homepage loads eight.
    const limit = keyword ? 100 : 8
    let page = 1

    while (page) {
      const url = `${LISTINGS_URL}?_active=true&sort=created&sortOrder=desc&limit=${limit}&page=${page}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Could not load auctions')

      const { data, meta } = await response.json()
      listings.push(...data)
      page = keyword ? meta.nextPage : null
    }

    showListings()
    keyword?.addEventListener('input', showListings)
    noBids?.addEventListener('change', showListings)
  } catch {
    status.textContent = 'Could not load auctions. Refresh the page to try again.'
  }
}

loadListings()