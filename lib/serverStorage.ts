import fs from 'fs'
import path from 'path'
import os from 'os'
import type { Item } from '@/types'

const STORE_FILE = path.join(os.tmpdir(), 'campusfind_items_v2.json')

declare global {
  // eslint-disable-next-line no-var
  var __campusfind_items_cache: Item[] | undefined
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

