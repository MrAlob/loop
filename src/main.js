import { PROFILES_URL } from './api.js'
import './style.css'
import { setupCreateForm } from './create.js'
import { showProfile, showAccount } from './profile.js'

const token = sessionStorage.getItem('loop.accessToken')
const name = sessionStorage.getItem('loop.name')
const signedIn = Boolean(token && name)
const privateContent = document.querySelector('[data-private]')
const header = document.querySelector('header')
header.innerHTML = `
  <p class="announcement">Made for students · Powered by things already in circulation</p>
  <div class="bar">
    <a class="brand" href="/" aria-label="Loop home">
      <svg aria-hidden="true" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="20" fill="#ff5b35"/>
        <path d="M15 17a5.5 5.5 0 1 1-1 4m-1-7 2 4 4-2" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      loop
    </a>
    <button id="menu" aria-expanded="false" aria-controls="navigation">Menu</button>
    <nav id="navigation" aria-label="Main navigation">
      <div class="links">
        <a href="/browse/">Browse</a>
        <a href="/how-it-works/">How it works</a>
        ${signedIn ? '<button id="sell-item" aria-haspopup="dialog">Sell an item</button>' : '<a href="/login/">Sell an item</a>'}
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

const menu = document.querySelector('#menu')

function setMenu(open) {
  menu.setAttribute('aria-expanded', String(open))
}

menu.addEventListener('click', () => {
  setMenu(menu.getAttribute('aria-expanded') === 'false')
})

header.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
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

// Use the same session and API key for profile and bid requests.
async function getProfileData(path, changes) {
  const response = await fetch(`${PROFILES_URL}/${encodeURIComponent(name)}${path}`, {
    method: changes ? 'PUT' : 'GET',
    body: changes ? JSON.stringify(changes) : undefined,
    headers: {
      ...(changes && { 'Content-Type': 'application/json' }),
      Authorization: 'Bearer ' + token,
      'X-Noroff-API-Key': import.meta.env.VITE_NOROFF_API_KEY,
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
    const { data } = await getProfileData(onProfilePage ? '?_listings=true' : '')
    showAccount(data)
    if (privateContent) {
      document.querySelector('#session-status').textContent = ''
      privateContent.hidden = false
    }
    if (onProfilePage) await showProfile(data, getProfileData)
  } catch {
    if (privateContent) {
      document.querySelector('#session-status').textContent = 'Could not load your profile. Refresh to try again.'
    }
  }
}

if (signedIn) {
  setupCreateForm()
  document.querySelector('#logout').addEventListener('click', () => endSession('/'))
  loadProfile()
} else if (privateContent) {
  location.replace('/login/')
}

// Recheck the session when Back restores a page from browser memory.
window.addEventListener('pageshow', event => {
  if (event.persisted) location.reload()
})
