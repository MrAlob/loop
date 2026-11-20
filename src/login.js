import { AUTH_URL } from './api.js'
const form = document.querySelector('#login')
const button = form.querySelector('button')
const status = document.querySelector('#login-status')

form.addEventListener('submit', async event => {
  event.preventDefault()
  if (button.disabled) return
  button.disabled = true
  status.textContent = 'Logging in…'

  try {
    const response = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    })

    if (response.status === 401 || response.status === 400) {
      status.textContent = 'Check your student email and password, then try again.'
      return
    }
    if (!response.ok) throw new Error('Login failed')

    const { data } = await response.json()
    if (!data.accessToken || !data.name) throw new Error('Incomplete login response')

    // Keep the session in this tab and discard the password.
    sessionStorage.setItem('loop.name', data.name)
    sessionStorage.setItem('loop.accessToken', data.accessToken)
    form.reset()
    location.replace('/profile/')
  } catch {
    status.textContent = 'Could not log in. Please try again.'
  } finally {
    button.disabled = false
  }
})
