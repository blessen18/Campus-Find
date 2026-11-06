// ─── Database Enums ───────────────────────────────────────────────────────────

export type ItemStatus = 'active' | 'claimed' | 'resolved' | 'expired' | 'removed'
export type ItemType   = 'lost' | 'found'
export type UserRole   = 'student' | 'faculty' | 'staff' | 'admin'
export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'
export type NotificationType = 'claim_submitted' | 'claim_approved' | 'claim_rejected' | 'item_matched' | 'item_resolved' | 'general'

// ─── Database Row Types ───────────────────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: UserRole
  department: string | null
  student_id: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  created_at: string
}

export interface Location {
  id: string
  name: string
  building: string | null
  floor: string | null
  created_at: string
}

export interface Item {
  id: string
  type: ItemType
  title: string
  description: string
  category_id: string | null
  location_id: string | null
  location_detail: string | null
  date_occurred: string
  status: ItemStatus
  images: string[]
  private_details: string | null
  contact_preference: 'platform' | 'email' | 'phone'
  reported_by: string
  resolved_at: string | null
  created_at: string
  updated_at: string
  // Joined fields
  category?: Category
  location?: Location
  reporter?: Profile
}

export interface Claim {
  id: string
  item_id: string
  claimant_id: string
  proof_description: string
  proof_images: string[]
  status: ClaimStatus
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  // Joined fields
  item?: Item
  claimant?: Profile
  reviewer?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

// ─── Form Types ────────────────────────────────────────────────────────────────

export interface ReportItemFormData {
  type: ItemType
  title: string
  description: string
  category_id: string
  location_id: string
  location_detail: string
  date_occurred: string
  contact_preference: 'platform' | 'email' | 'phone'
  private_details: string
  images: File[]
}

export interface ClaimFormData {
  proof_description: string
  proof_images: File[]
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

// ─── Filter Types ─────────────────────────────────────────────────────────────

export interface ItemFilters {
  search: string
  category: string
  location: string
  status: string
  dateFrom: string
  dateTo: string
  sortBy: 'newest' | 'oldest'
}

// ─── UI State Types ───────────────────────────────────────────────────────────

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
}

export interface ModalState {
  isOpen: boolean
  itemId?: string
}

// ─── Stats Types ─────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalLost: number
  totalFound: number
  totalResolved: number
  totalPending: number
  recentItems: Item[]
}

export interface AdminStats extends DashboardStats {
  totalUsers: number
  totalClaims: number
  pendingClaims: number
  itemsByCategory: { category: string; count: number }[]
  itemsByLocation: { location: string; count: number }[]
}

