const form = document.querySelector('#create-listing')
const status = document.querySelector('#publish-status')
const button = form.querySelector('button')

form.addEventListener('submit', async event => {
  event.preventDefault()
  if (button.disabled) return

  const fields = form.elements
  for (const field of [fields.title, fields.condition, fields.description]) {
    field.value = field.value.trim()
  }
  if (!form.reportValidity()) return

  // The datetime input uses local time. Noroff expects an ISO timestamp.
  const deadline = new Date(fields.deadline.value)
  if (deadline <= new Date()) {
    status.textContent = 'Choose a deadline in the future.'
    fields.deadline.focus()
    return
  }

  const photos = new FormData(form).getAll('photo').filter(Boolean)
  const listing = {
    title: fields.title.value,
    description: fields.description.value,
    tags: [fields.category.value, fields.condition.value],
    endsAt: deadline.toISOString(),
    media: photos.map(url => ({ url, alt: fields.title.value })),
  }

  button.disabled = true
  status.textContent = 'Publishing…'
  try {
    const response = await fetch('https://v2.api.noroff.dev/auction/listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + sessionStorage.getItem('loop.accessToken'),
        'X-Noroff-API-Key': import.meta.env.VITE_NOROFF_API_KEY,
      },
      body: JSON.stringify(listing),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.errors?.[0]?.message || 'Check the listing details.')
    location.assign('/listing/?id=' + encodeURIComponent(result.data.id))
  } catch (error) {
    status.textContent = 'Could not publish the listing. ' + error.message
    button.disabled = false
  }
})
