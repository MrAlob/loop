import cardHtml from './listing-card.html?raw'

const grid = document.querySelector('#listings')
const status = document.querySelector('#listings-status')
const template = document.createElement('template')
template.innerHTML = cardHtml

function listingCard(listing) {
  const card = template.content.cloneNode(true)

  card.querySelector('h3').textContent = listing.title
  card.querySelector('.bid-count').textContent = `Bids: ${listing._count.bids}`

  const time = card.querySelector('time')
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

    image.onerror = () => {
      image.hidden = true
      fallback.hidden = false
    }

    image.src = photo.url
  }

  return card
}

async function loadListings() {
  try {
    const url = 'https://v2.api.noroff.dev/auction/listings?_active=true&sort=created&sortOrder=desc&limit=8'
    const response = await fetch(url)
    if (!response.ok) throw new Error('Could not load auctions')

    const { data: listings } = await response.json()
    const cards = listings.map(listingCard)

    grid.replaceChildren(...cards)
    status.textContent = listings.length ? '' : 'There are no active auctions right now.'
  } catch {
    status.textContent = 'Could not load auctions. Refresh the page to try again.'
  }
}

loadListings()