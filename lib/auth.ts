import type { Profile } from '@/types'

export const AUTH_COOKIE_NAME = 'campusfind_session'
export const AUTH_STORAGE_KEY = 'campusfind_user'

export function getClientUser(): Profile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    // ignore
  }
  return null
}

export function setClientSession(profile: Profile) {
  if (typeof window === 'undefined') return
  try {
    const json = JSON.stringify(profile)
    localStorage.setItem(AUTH_STORAGE_KEY, json)
    // Set 30-day cookie accessible to Next.js middleware and server components
    document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(json)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
    window.dispatchEvent(new Event('campusfind_auth_change'))
  } catch (e) {
    console.error('Failed to save session:', e)
  }
}

export function clearClientSession() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    window.dispatchEvent(new Event('campusfind_auth_change'))
  } catch (e) {
    // ignore
  }
}

