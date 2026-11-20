import { AUTH_URL } from './api.js'
import dialogHtml from './login-dialog.html?raw'

export function setupLogin(loginPage, privatePage) {
  document.body.insertAdjacentHTML('beforeend', dialogHtml)
  const dialog = document.querySelector('#login-dialog')
  let sellAfterLogin = false
  let opener
  let pending

  for (const link of document.querySelectorAll('a[href="/login/"], a[href="/create/"]')) {
    link.setAttribute('aria-haspopup', 'dialog')
    link.addEventListener('click', event => {
      event.preventDefault()
      opener = link
      sellAfterLogin = link.pathname === '/create/'
      dialog.showModal()
    })
  }

  dialog.querySelector('[data-close]').onclick = () => dialog.close()
  dialog.addEventListener('close', () => {
    pending?.abort()
    form.reset()
    status.textContent = ''
    if (loginPage || privatePage) location.replace('/')
    else opener?.focus()
  })
  if (loginPage || privatePage) dialog.showModal()

  const form = document.querySelector('#login')
  const button = form.querySelector('button')
  const status = document.querySelector('#login-status')

  form.addEventListener('submit', async event => {
    event.preventDefault()
    if (button.disabled) return
    const request = new AbortController()
    pending = request
    button.disabled = true
    status.textContent = 'Logging in…'

    try {
      const response = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        signal: request.signal,
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
      if (sellAfterLogin) sessionStorage.setItem('loop.openSell', 'yes')
      if (loginPage || location.pathname === '/register/' && !sellAfterLogin) location.replace('/profile/')
      else location.reload()
    } catch {
      if (request.signal.aborted) return
      status.textContent = 'Could not log in. Please try again.'
    } finally {
      pending = null
      button.disabled = false
    }
  })
}
