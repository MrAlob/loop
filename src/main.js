import { PROFILES_URL, privateApiUrl } from './api.js'
import './style.css'
import footerHtml from './footer.html?raw'
import { setupLogin } from './login.js'
import { setupCreateForm } from './create.js'
import { showProfile, showAccount } from './profile.js'

const token = sessionStorage.getItem('loop.accessToken')
const name = sessionStorage.getItem('loop.name')
const signedIn = Boolean(token && name)
const privateContent = document.querySelector('[data-private]')
const header = document.querySelector('header')
header.innerHTML = `
  <p class="announcement">Made for students · Powered by <span class="hidden sm:inline">things already in circulation</span><span class="sm:hidden">reuse</span></p>
  <div class="bar">
    <a class="brand" href="/" aria-label="Loop home">
      <svg aria-hidden="true" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="20" fill="#ff5b35"/>
        <path d="M15 17a5.5 5.5 0 1 1-1 4m-1-7 2 4 4-2" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      loop
    </a>
    ${signedIn ? '' : '<a class="mobile-login" href="/login/">Log in</a>'}
    <button id="menu" aria-expanded="false" aria-controls="navigation">Menu</button>
    <nav id="navigation" aria-label="Main navigation">
      <div class="links">
        <a href="/browse/">Browse</a>
        <a href="/how-it-works/">How it works</a>
        ${signedIn ? '<button id="sell-item" data-sell aria-haspopup="dialog">Sell an item</button>' : '<a href="/create/">Sell an item</a>'}
      </div>
      ${signedIn ? '' : `<div class="account">
          <a class="login" href="/login/">
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="7" r="4"/><path d="M3 22a9 9 0 0 1 18 0"/>
            </svg>
            Log in
          </a>
      </div>`}
    </nav>
    ${signedIn ? `<div class="member">
      <span id="balance">… cr</span>
      <details class="user-menu">
        <summary aria-label="Account menu">
          <img id="member-avatar" hidden alt="" />
          <span id="member-name">Account</span>
        </summary>
        <div class="user-links">
          <a href="/profile/">Profile</a>
          <button id="logout">Log out</button>
        </div>
      </details>
    </div>` : ''}
  </div>`

document.querySelector('main').insertAdjacentHTML('afterend', footerHtml)

const menu = document.querySelector('#menu')

function setMenu(open) {
  menu.setAttribute('aria-expanded', String(open))
}

menu.addEventListener('click', () => {
  setMenu(menu.getAttribute('aria-expanded') === 'false')
})

header.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return

  const account = header.querySelector('.user-menu[open]')
  if (account) {
    account.open = false
    account.querySelector('summary').focus()
  } else if (menu.getAttribute('aria-expanded') === 'true' && menu.offsetWidth > 0) {
    setMenu(false)
    menu.focus()
  }
})

function endSession(destination) {
  sessionStorage.removeItem('loop.accessToken')
  sessionStorage.removeItem('loop.name')
  sessionStorage.removeItem('loop.credits')
  location.replace(destination)
}

// Profile requests use the signed-in user token; the server adds the API key.
async function getProfileData(path, changes, profileName = name) {
  const response = await fetch(privateApiUrl(`${PROFILES_URL}/${encodeURIComponent(profileName)}${path}`), {
    method: changes ? 'PUT' : 'GET',
    body: changes ? JSON.stringify(changes) : undefined,
    headers: {
      ...(changes && { 'Content-Type': 'application/json' }),
      Authorization: 'Bearer ' + token,
    },
  })
  if (response.status === 401) endSession('/login/')
  const result = await response.json()
  if (!response.ok) throw new Error(result.errors?.[0]?.message || 'Profile request failed.')
  return result
}

async function loadProfile() {
  const balance = document.querySelector('#balance')
  balance.textContent = 'Balance unavailable'
  try {
    const onProfilePage = Boolean(document.querySelector('#my-profile'))
    const seller = onProfilePage && new URLSearchParams(location.search).get('name')
    const visiting = seller && seller !== name
    const { data } = await getProfileData(onProfilePage && !visiting ? '?_listings=true' : '')
    showAccount(data)
    const profile = visiting ? (await getProfileData('?_listings=true', undefined, seller)).data : data
    if (privateContent) {
      document.querySelector('#session-status').textContent = ''
      privateContent.hidden = false
    }
    if (onProfilePage) await showProfile(profile, getProfileData, Boolean(visiting))
  } catch {
    if (privateContent) {
      document.querySelector('#session-status').textContent = 'Could not load the profile. Check the link or refresh to try again.'
    }
  }
}

const loginPage = document.querySelector('[data-login-page]')
if (signedIn) {
  if (loginPage) location.replace('/profile/')
  setupCreateForm()
  if (sessionStorage.getItem('loop.openSell')) {
    sessionStorage.removeItem('loop.openSell')
    document.querySelector('#sell-item').click()
  }
  document.querySelector('#logout').addEventListener('click', () => endSession('/'))
  loadProfile()
} else {
  setupLogin(Boolean(loginPage), Boolean(privateContent))
}

// Recheck the session when Back restores a page from browser memory.
window.addEventListener('pageshow', event => {
  if (event.persisted) location.reload()
})
