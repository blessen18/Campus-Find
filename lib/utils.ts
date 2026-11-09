import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ItemStatus, ItemType, ClaimStatus } from '@/types'

// ─── Tailwind class merger ────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Date formatting ──────────────────────────────────────────────────────────
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) return formatDate(dateString)
  if (days > 1) return `${days} days ago`
  if (days === 1) return 'Yesterday'
  if (hours > 1) return `${hours} hours ago`
  if (hours === 1) return '1 hour ago'
  if (minutes > 1) return `${minutes} minutes ago`
  return 'Just now'
}

// ─── Status helpers ───────────────────────────────────────────────────────────
export const STATUS_LABELS: Record<ItemStatus, string> = {
  active:   'Active',
  claimed:  'Claimed',
  resolved: 'Resolved',
  expired:  'Expired',
  removed:  'Removed',
}

export const STATUS_COLORS: Record<ItemStatus, string> = {
  active:   'bg-green-50 text-green-700 ring-1 ring-green-600/20',
  claimed:  'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  resolved: 'bg-slate-100 text-slate-600 ring-1 ring-slate-300',
  expired:  'bg-slate-100 text-slate-500 ring-1 ring-slate-300',
  removed:  'bg-red-50 text-red-600 ring-1 ring-red-500/20',
}

export const CLAIM_STATUS_COLORS: Record<ClaimStatus, string> = {
  pending:   'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20',
  approved:  'bg-green-50 text-green-700 ring-1 ring-green-600/20',
  rejected:  'bg-red-50 text-red-600 ring-1 ring-red-500/20',
  withdrawn: 'bg-slate-100 text-slate-600 ring-1 ring-slate-300',
}

export const TYPE_LABELS: Record<ItemType, string> = {
  lost:  'Lost',
  found: 'Found',
}

export const TYPE_COLORS: Record<ItemType, string> = {
  lost:  'bg-red-50 text-red-700 ring-1 ring-red-600/20',
  found: 'bg-green-50 text-green-700 ring-1 ring-green-600/20',
}

// ─── Validation ───────────────────────────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const DEVELOPER_EMAIL = 'blessenunnikrishnan@gmail.com'

/**
 * Checks if the given email is the designated developer/superadmin account.
 */
export function isDeveloperEmail(email: string): boolean {
  return email.trim().toLowerCase() === DEVELOPER_EMAIL.toLowerCase()
}

/**
 * Validates whether an email belongs to an official Amal Jyothi College of Engineering student/member.
 * Standard student email format: username<year>@<dept>.ajce.in (e.g. student2026@cs.ajce.in)
 * Also supports @ajce.in and @ajce.edu.in for general campus addresses.
 */
export function isAjceEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  return /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)?ajce\.(in|edu\.in)$/.test(normalized)
}

export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))
}

// ─── File helpers ─────────────────────────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, WebP, and GIF images are allowed.'
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return `Image must be under 5 MB. This file is ${formatFileSize(file.size)}.`
  }
  return null
}

export function generateSafeFileName(originalName: string, prefix: string = 'item'): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}-${timestamp}-${random}.${ext}`
}

// ─── Supabase storage ─────────────────────────────────────────────────────────
export function getPublicImageUrl(supabaseUrl: string, bucket: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}

// ─── Misc ─────────────────────────────────────────────────────────────────────
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}…`
}

export function generateId(): string {
  return crypto.randomUUID()
}

export const CATEGORIES = [
  { id: 'electronics',  name: 'Electronics',   icon: '📱' },
  { id: 'clothing',     name: 'Clothing',       icon: '👕' },
  { id: 'bags',         name: 'Bags & Wallets', icon: '🎒' },
  { id: 'books',        name: 'Books & Notes',  icon: '📚' },
  { id: 'accessories',  name: 'Accessories',    icon: '⌚' },
  { id: 'keys',         name: 'Keys & Cards',   icon: '🔑' },
  { id: 'documents',    name: 'Documents & ID', icon: '🪪' },
  { id: 'sports',       name: 'Sports & Gym',   icon: '⚽' },
  { id: 'other',        name: 'Other',          icon: '📦' },
]

export const CAMPUS_LOCATIONS = [
  'Main Block',
  'Library',
  'Canteen',
  'Seminar Hall',
  'Computer Lab',
  'Electronics Lab',
  'Mechanical Lab',
  'Civil Lab',
  'Basketball Court',
  'Football Ground',
  'Hostel Block A',
  'Hostel Block B',
  'Chapel',
  'Admin Block',
  'Parking Area',
  'Bus Stop',
  'Other',
]

