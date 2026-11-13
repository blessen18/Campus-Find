import fs from 'fs'
import path from 'path'
import os from 'os'
import type { Item } from '@/types'
import { DEVELOPER_EMAIL } from '@/lib/utils'

const STORE_FILE = path.join(os.tmpdir(), 'campusfind_items_v2.json')
const ADMINS_STORE_FILE = path.join(os.tmpdir(), 'campusfind_admins_v2.json')

export interface AdminCredential {
  email: string
  password: string
  assigned_at: string
  assigned_by: string
}

declare global {
  // eslint-disable-next-line no-var
  var __campusfind_items_cache: Item[] | undefined
  // eslint-disable-next-line no-var
  var __campusfind_admins_cache: AdminCredential[] | undefined
}

function loadCache(): Item[] {
  if (globalThis.__campusfind_items_cache) {
    return globalThis.__campusfind_items_cache
  }

  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf-8')
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed)) {
        globalThis.__campusfind_items_cache = parsed
        return parsed
      }
    }
  } catch (err) {
    console.warn('Error reading campusfind items cache file:', err)
  }

  globalThis.__campusfind_items_cache = []
  return globalThis.__campusfind_items_cache
}

function persistCache() {
  try {
    const list = globalThis.__campusfind_items_cache || []
    fs.writeFileSync(STORE_FILE, JSON.stringify(list, null, 2), 'utf-8')
  } catch (err) {
    console.warn('Error persisting campusfind items cache file:', err)
  }
}

export async function getAllServerItems(): Promise<Item[]> {
  const items = loadCache()
  return items.filter(i => i.status !== 'removed')
}

export async function getServerItemById(id: string): Promise<Item | null> {
  const items = loadCache()
  const found = items.find(i => i.id === id)
  if (!found || found.status === 'removed') return null
  return found
}

export async function addServerItem(item: Item): Promise<Item> {
  const items = loadCache()
  const existingIdx = items.findIndex(i => i.id === item.id)
  if (existingIdx >= 0) {
    items[existingIdx] = { ...items[existingIdx], ...item, updated_at: new Date().toISOString() }
  } else {
    items.unshift(item)
  }
  globalThis.__campusfind_items_cache = items
  persistCache()
  return item
}

export async function updateServerItem(id: string, updates: Partial<Item>): Promise<Item | null> {
  const items = loadCache()
  const idx = items.findIndex(i => i.id === id)
  if (idx < 0) return null

  const updated: Item = {
    ...items[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  }
  items[idx] = updated
  globalThis.__campusfind_items_cache = items
  persistCache()
  return updated
}

export async function removeServerItem(id: string): Promise<boolean> {
  const items = loadCache()
  const idx = items.findIndex(i => i.id === id)
  if (idx < 0) return false

  items[idx] = {
    ...items[idx],
    status: 'removed',
    updated_at: new Date().toISOString(),
  }
  globalThis.__campusfind_items_cache = items
  persistCache()
  return true
}

// ─── Admin Credentials Storage ───────────────────────────────────────────────

function getInitialAdmins(): AdminCredential[] {
  return [
    {
      email: DEVELOPER_EMAIL.toLowerCase(),
      password: 'Admin@2026!',
      assigned_at: new Date('2026-01-01').toISOString(),
      assigned_by: 'Primary Authority',
    },
  ]
}

function loadAdminCache(): AdminCredential[] {
  if (globalThis.__campusfind_admins_cache && globalThis.__campusfind_admins_cache.length > 0) {
    return globalThis.__campusfind_admins_cache
  }

  try {
    if (fs.existsSync(ADMINS_STORE_FILE)) {
      const content = fs.readFileSync(ADMINS_STORE_FILE, 'utf-8')
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure primary developer is always present
        if (!parsed.some(a => a.email.toLowerCase() === DEVELOPER_EMAIL.toLowerCase())) {
          parsed.unshift({
            email: DEVELOPER_EMAIL.toLowerCase(),
            password: 'Admin@2026!',
            assigned_at: new Date('2026-01-01').toISOString(),
            assigned_by: 'Primary Authority',
          })
        }
        globalThis.__campusfind_admins_cache = parsed
        return parsed
      }
    }
  } catch (err) {
    console.warn('Error reading admin credentials cache:', err)
  }

  const defaults = getInitialAdmins()
  globalThis.__campusfind_admins_cache = defaults
  persistAdminCache()
  return defaults
}

function persistAdminCache() {
  try {
    const list = globalThis.__campusfind_admins_cache || getInitialAdmins()
    fs.writeFileSync(ADMINS_STORE_FILE, JSON.stringify(list, null, 2), 'utf-8')
  } catch (err) {
    console.warn('Error persisting admin credentials cache:', err)
  }
}

export async function getAllAdminCredentials(): Promise<AdminCredential[]> {
  return loadAdminCache()
}

export async function saveAdminCredential(
  email: string, 
  password: string, 
  assignedBy = 'Primary Authority'
): Promise<AdminCredential> {
  const admins = loadAdminCache()
  const cleanEmail = email.trim().toLowerCase()
  const cleanPassword = password.trim()

  const existingIdx = admins.findIndex(a => a.email.toLowerCase() === cleanEmail)
  const entry: AdminCredential = {
    email: cleanEmail,
    password: cleanPassword,
    assigned_at: new Date().toISOString(),
    assigned_by: assignedBy,
  }

  if (existingIdx >= 0) {
    admins[existingIdx] = entry
  } else {
    admins.push(entry)
  }

  globalThis.__campusfind_admins_cache = admins
  persistAdminCache()
  return entry
}

export async function removeAdminCredential(email: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase()
  if (cleanEmail === DEVELOPER_EMAIL.toLowerCase()) {
    // Primary developer cannot be removed
    return false
  }

  const admins = loadAdminCache()
  const filtered = admins.filter(a => a.email.toLowerCase() !== cleanEmail)
  if (filtered.length === admins.length) return false

  globalThis.__campusfind_admins_cache = filtered
  persistAdminCache()
  return true
}

export async function verifyAdminPassword(
  email: string, 
  password: string
): Promise<{ valid: boolean; isPrimary?: boolean; error?: string }> {
  const admins = loadAdminCache()
  const cleanEmail = email.trim().toLowerCase()
  const cleanPassword = password.trim()

  const admin = admins.find(a => a.email.toLowerCase() === cleanEmail)
  if (!admin) {
    return {
      valid: false,
      error: 'Access denied. Account is not registered as an authorized administrator.',
    }
  }

  const isPrimary = cleanEmail === DEVELOPER_EMAIL.toLowerCase()

  // Match assigned password or default fallback for primary admin
  const isMatch = admin.password === cleanPassword || (isPrimary && cleanPassword === 'Admin@2026!')
  if (!isMatch) {
    return {
      valid: false,
      isPrimary,
      error: 'Incorrect admin password. Please use the exact login password assigned by the primary administrator.',
    }
  }

  return { valid: true, isPrimary }
}

