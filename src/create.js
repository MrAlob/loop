import { LISTINGS_URL } from './api.js'
import formHtml from './create-form.html?raw'

export function setupCreateForm() {
  const page = document.querySelector('#create-page')
  const trigger = document.querySelector('#sell-item')
  const dialog = document.createElement('dialog')
  dialog.id = 'sell-dialog'
  dialog.setAttribute('aria-labelledby', 'listing-heading')
  document.body.append(dialog)

  const container = page || dialog
  container.innerHTML = formHtml
  const card = container.firstElementChild
  card.querySelector('form').addEventListener('submit', event => saveListing(event))

  trigger.addEventListener('click', () => {
    // Move the existing card so /create/ keeps one form and one draft.
    dialog.append(card)
    dialog.showModal()
    dialog.scrollTop = 0
  })
  card.querySelector('[data-close]').addEventListener('click', () => {
    if (dialog.open) dialog.close()
    else location.assign('/profile/')
  })
  dialog.addEventListener('close', () => {
    if (dialog.open) return
    if (page) page.append(card)
    if (!page) dialog.replaceChildren(card)
    if (dialog.dataset.editing) {
      delete dialog.dataset.editing
      document.querySelector('#edit-listing').focus({ preventScroll: true })
    } else {
      trigger.focus({ preventScroll: true })
    }
  })
}

export function editListing(listing) {
  const dialog = document.querySelector('#sell-dialog')
  // Keep the separate Sell an item draft while the owner edits this auction.
  dialog.innerHTML = formHtml
  dialog.dataset.editing = 'true'
  dialog.querySelector('p').textContent = 'MANAGE YOUR LISTING'
  dialog.querySelector('h1').textContent = 'Edit listing'
  dialog.querySelector('[data-close]').onclick = () => dialog.close()

  const form = dialog.querySelector('form')
  const fields = form.elements
  fields.title.value = listing.title
  fields.description.value = listing.description || ''
  fields.description.required = false
  const [category = '', condition = ''] = listing.tags
  if (![...fields.category.options].some(option => option.value === category)) {
    fields.category.add(new Option(category || 'Choose category', category))
  }
  fields.category.value = category
  fields.condition.value = condition
  fields.condition.required = false
  fields.deadline.disabled = true
  fields.deadline.closest('label').hidden = true
  form.querySelectorAll('[name=photo]').forEach((input, index) => {
    input.value = listing.media[index]?.url || ''
    input.required = false
  })
  form.querySelector('button').textContent = 'Save changes'
  form.onsubmit = event => saveListing(event, listing)
  dialog.showModal()
  dialog.scrollTop = 0
}

export async function listingRequest(method, id, listing) {
  const path = id ? '/' + encodeURIComponent(id) : ''
  const response = await fetch(LISTINGS_URL + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + sessionStorage.getItem('loop.accessToken'),
      'X-Noroff-API-Key': import.meta.env.VITE_NOROFF_API_KEY,
    },
    body: JSON.stringify(listing),
  })
  if (response.status === 204) return
  const result = await response.json()
  if (!response.ok) throw new Error(result.errors?.[0]?.message || 'Request failed.')
  return result.data
}

async function saveListing(event, original) {
  const form = event.currentTarget
  const status = form.querySelector('#publish-status')
  const button = form.querySelector('button')
  event.preventDefault()
  if (button.disabled) return

  const fields = form.elements
  for (const field of [fields.title, fields.condition, fields.description]) {
    field.value = field.value.trim()
  }
  if (!form.reportValidity()) return

  // The datetime input uses local time. Noroff expects an ISO timestamp.
  const deadline = new Date(fields.deadline.value)
  if (!original && deadline <= new Date()) {
    status.textContent = 'Choose a deadline in the future.'
    fields.deadline.focus()
    return
  }

  const photos = new FormData(form).getAll('photo').filter(Boolean)
  const listing = {
    title: fields.title.value,
    description: fields.description.value,
    tags: [fields.category.value, fields.condition.value, ...(original?.tags.slice(2) || [])].filter(Boolean),
    media: photos.map(url => original?.media.find(photo => photo.url === url) || { url, alt: fields.title.value }),
  }

  // Loop edits three photos. Keep any extra photos already on the auction.
  if (original) listing.media.push(...original.media.slice(3))
  else listing.endsAt = deadline.toISOString()

  button.disabled = true
  status.textContent = original ? 'Saving…' : 'Publishing…'
  try {
    if (original) {
      await listingRequest('PUT', original.id, listing)
      location.reload()
    } else {
      const created = await listingRequest('POST', '', listing)
      location.assign('/listing/?id=' + encodeURIComponent(created.id))
    }
  } catch (error) {
    status.textContent = 'Could not save the listing. ' + error.message
    button.disabled = false
  }
}
