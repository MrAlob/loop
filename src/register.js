const form = document.querySelector('#register')
const button = form.querySelector('button')
const status = document.querySelector('#status')
const email = form.elements.email

// Email domains are case-insensitive. Normalize the domain before validation.
email.addEventListener('change', () => {
  email.value = email.value.replace(/@.*$/, domain => domain.toLowerCase())
})

form.addEventListener('submit', async event => {
  event.preventDefault()
  if (button.disabled) return
  button.disabled = true
  status.textContent = 'Creating your account…'

  try {
    // Form field names match the three properties expected by Noroff.
    const response = await fetch('https://v2.api.noroff.dev/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    })

    if (response.ok) {
      form.reset()
      status.textContent = 'Account created. You can now log in.'
    } else {
      const result = await response.json()
      status.textContent = result.errors?.[0]?.message || 'Registration failed. Check your details and try again.'
    }
  } catch {
    status.textContent = 'Could not complete registration. Check your connection and try again.'
  } finally {
    button.disabled = false
  }
})
