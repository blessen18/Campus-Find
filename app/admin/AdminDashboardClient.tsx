'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Trash2, ShieldCheck, Key, Plus, RefreshCw,
  AlertCircle, Search, ExternalLink,
  Check, X, Eye, EyeOff, Copy, Edit3, Lock, Sparkles, Mail
} from 'lucide-react'
import { 
  formatDate, formatRelativeTime, 
  STATUS_COLORS, STATUS_LABELS, 
  TYPE_COLORS, TYPE_LABELS, 
  DEVELOPER_EMAIL 
} from '@/lib/utils'
import { CategoryIcon } from '@/components/CategoryIcon'
import { INITIAL_CAMPUS_ITEMS } from '@/data/initialItems'
import type { Item, Claim, Profile } from '@/types'

const LOCAL_ITEMS_STORAGE_KEY = 'campusfind_custom_items'
const DEVS_STORAGE_KEY = 'campusfind_developer_whitelist'
const REMOVED_ITEMS_STORAGE_KEY = 'campusfind_removed_item_ids'
const ADMIN_CREDS_STORAGE_KEY = 'campusfind_admin_credentials_v2'

export interface AdminRecord {
  email: string
  password: string
  assigned_at?: string
  assigned_by?: string
  isPrimary?: boolean
}

interface Props {
  initialItems: Item[]
  initialClaims: Claim[]
  initialUsers: Profile[]
  currentUser: Profile
}

export function AdminDashboardClient({ 
  initialItems, 
  initialClaims, 
  initialUsers, 
  currentUser 
}: Props) {
  const isSuperDev = currentUser.email.toLowerCase() === DEVELOPER_EMAIL.toLowerCase()
  
  // State for items & soft removal tracking
  const [items, setItems] = useState<Item[]>(initialItems)
  const [claims, setClaims] = useState<Claim[]>(initialClaims)
  const [users, setUsers] = useState<Profile[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found'>('all')

  // Administrator & Developer Credentials State
  const [adminsList, setAdminsList] = useState<AdminRecord[]>([
    {
      email: DEVELOPER_EMAIL.toLowerCase(),
      password: 'Admin@2026!',
      isPrimary: true,
      assigned_by: 'Primary Authority',
    },
  ])
  const [newDevEmail, setNewDevEmail] = useState('')
  const [newDevPassword, setNewDevPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)
  const [editingAdmin, setEditingAdmin] = useState<AdminRecord | null>(null)
  const [editPasswordValue, setEditPasswordValue] = useState('')
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [devActionMsg, setDevActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load local modifications & developer list from localStorage + shared API
  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncItems = async () => {
      try {
        // Fetch Admin Credentials from server API
        try {
          const res = await fetch('/api/admin/admins')
          if (res.ok) {
            const data = await res.json()
            if (data.admins && Array.isArray(data.admins)) {
              setAdminsList(data.admins)
              localStorage.setItem(ADMIN_CREDS_STORAGE_KEY, JSON.stringify(data.admins))
              localStorage.setItem(DEVS_STORAGE_KEY, JSON.stringify(data.admins.map((a: any) => a.email)))
            }
          }
        } catch (e) {
          // fallback to localStorage
          const savedCreds = localStorage.getItem(ADMIN_CREDS_STORAGE_KEY)
          if (savedCreds) {
            try {
              const parsed = JSON.parse(savedCreds)
              if (Array.isArray(parsed) && parsed.length > 0) {
                setAdminsList(parsed)
              }
            } catch (err) {}
          }
        }

        // Fetch shared items from server API (cross-device reports)
        let serverItems: Item[] = []
        try {
          const res = await fetch('/api/items')
          if (res.ok) {
            const data = await res.json()
            if (data.items && Array.isArray(data.items)) {
              serverItems = data.items
            }
          }
        } catch (e) {}

        // Load custom user reported items from localStorage
        let localCustom: Item[] = []
        const rawCustom = localStorage.getItem(LOCAL_ITEMS_STORAGE_KEY)
        if (rawCustom) {
          try {
            const parsed = JSON.parse(rawCustom)
            if (Array.isArray(parsed)) localCustom = parsed
          } catch (e) {}
        }

        const removedIds = JSON.parse(localStorage.getItem(REMOVED_ITEMS_STORAGE_KEY) || '[]') as string[]

        setItems(prev => {
          const merged = [...prev]
          for (const item of [...serverItems, ...localCustom]) {
            const existingIdx = merged.findIndex(m => m.id === item.id)
            if (existingIdx >= 0) {
              merged[existingIdx] = { ...merged[existingIdx], ...item }
            } else {
              merged.unshift(item)
            }
          }
          return merged.filter(item => !removedIds.includes(item.id) && item.status !== 'removed')
        })
      } catch (e) {
        console.warn('Storage sync issue:', e)
      }
    }

    syncItems()

    const onItemsChange = () => syncItems()
    window.addEventListener('campusfind_items_change', onItemsChange)
    return () => window.removeEventListener('campusfind_items_change', onItemsChange)
  }, [])

  // Generate clean, secure passwords for new admins
  const generatePassword = () => {
    const words = ['Campus', 'Admin', 'Ajce', 'Shield', 'Security', 'Portal']
    const word = words[Math.floor(Math.random() * words.length)]
    const digits = Math.floor(1000 + Math.random() * 9000)
    setNewDevPassword(`${word}@${digits}!`)
    setShowNewPassword(true)
  }

  const generateEditPassword = () => {
    const words = ['Campus', 'Admin', 'Ajce', 'Shield', 'Security', 'Portal']
    const word = words[Math.floor(Math.random() * words.length)]
    const digits = Math.floor(1000 + Math.random() * 9000)
    setEditPasswordValue(`${word}@${digits}!`)
    setShowEditPassword(true)
  }

  const handleCopyPassword = (email: string, password: string) => {
    navigator.clipboard.writeText(password)
    setCopiedEmail(email)
    setTimeout(() => setCopiedEmail(null), 2500)
  }

  const togglePasswordVisibility = (email: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [email]: !prev[email],
    }))
  }

  // Function to grant another administrator access and assign login password (Primary Admin only)
  const handleAddDeveloper = async (e: React.FormEvent) => {
    e.preventDefault()
    setDevActionMsg(null)
    const cleanEmail = newDevEmail.trim().toLowerCase()
    const cleanPassword = newDevPassword.trim()
    
    if (!cleanEmail) {
      setDevActionMsg({ type: 'error', text: 'Please enter an administrator email address.' })
      return
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setDevActionMsg({ type: 'error', text: 'Please enter a valid email address.' })
      return
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      setDevActionMsg({ type: 'error', text: 'Please assign a login password with at least 4 characters.' })
      return
    }
    if (adminsList.some(a => a.email.toLowerCase() === cleanEmail)) {
      setDevActionMsg({ 
        type: 'error', 
        text: `Administrator "${cleanEmail}" is already authorized. Use the edit button below to change their password.` 
      })
      return
    }

    setIsSubmittingAdmin(true)
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
          callerEmail: currentUser.email,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setDevActionMsg({ type: 'error', text: data.error || 'Failed to assign administrator credentials.' })
        setIsSubmittingAdmin(false)
        return
      }

      const newAdmin: AdminRecord = data.admin || {
        email: cleanEmail,
        password: cleanPassword,
        assigned_at: new Date().toISOString(),
        assigned_by: currentUser.email,
        isPrimary: false,
      }

      const updated = [...adminsList, newAdmin]
      setAdminsList(updated)
      localStorage.setItem(ADMIN_CREDS_STORAGE_KEY, JSON.stringify(updated))
      localStorage.setItem(DEVS_STORAGE_KEY, JSON.stringify(updated.map(a => a.email)))

      setDevActionMsg({ 
        type: 'success', 
        text: `Admin access granted to ${cleanEmail}. Assigned login password: ${cleanPassword}` 
      })
      setNewDevEmail('')
      setNewDevPassword('')
      setShowNewPassword(false)
    } catch {
      setDevActionMsg({ type: 'error', text: 'Network error saving admin credentials.' })
    } finally {
      setIsSubmittingAdmin(false)
    }
  }

  // Update password for an existing administrator
  const handleSaveUpdatedPassword = async () => {
    if (!editingAdmin) return
    const cleanPassword = editPasswordValue.trim()
    if (!cleanPassword || cleanPassword.length < 4) {
      alert('Password must be at least 4 characters long.')
      return
    }

    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editingAdmin.email,
          password: cleanPassword,
          callerEmail: currentUser.email,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to update login password')
        return
      }

      const updated = adminsList.map(a => 
        a.email.toLowerCase() === editingAdmin.email.toLowerCase()
          ? { ...a, password: cleanPassword }
          : a
      )
      setAdminsList(updated)
      localStorage.setItem(ADMIN_CREDS_STORAGE_KEY, JSON.stringify(updated))
      setDevActionMsg({
        type: 'success',
        text: `Updated login password for ${editingAdmin.email} to: ${cleanPassword}`,
      })
      setEditingAdmin(null)
      setEditPasswordValue('')
    } catch {
      alert('Network error updating password.')
    }
  }

  // Revoke administrator access
  const handleRevokeDeveloper = async (targetEmail: string) => {
    if (targetEmail.toLowerCase() === DEVELOPER_EMAIL.toLowerCase()) {
      alert('The primary founding developer cannot be removed.')
      return
    }
    if (!confirm(`Revoke administrator privileges and login access for ${targetEmail}?`)) return

    try {
      await fetch('/api/admin/admins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, callerEmail: currentUser.email }),
      })
    } catch (e) {}

    const updated = adminsList.filter(e => e.email.toLowerCase() !== targetEmail.toLowerCase())
    setAdminsList(updated)
    try {
      localStorage.setItem(ADMIN_CREDS_STORAGE_KEY, JSON.stringify(updated))
      localStorage.setItem(DEVS_STORAGE_KEY, JSON.stringify(updated.map(e => e.email)))
      setDevActionMsg({ type: 'success', text: `Revoked administrator access for ${targetEmail}.` })
    } catch (e) {}
  }

  // Developer action: Instantly delete/remove a reported item
  const handleRemoveItem = async (itemId: string, itemTitle: string) => {
    if (!confirm(`Are you sure you want to permanently remove "${itemTitle}" from the campus feed?`)) return

    // Update state
    setItems(prev => prev.filter(i => i.id !== itemId))

    // Call server API
    try {
      await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caller: currentUser }),
      })
    } catch (e) {}

    // Save removal to localStorage so it persists across refreshes
    try {
      const removedIds = JSON.parse(localStorage.getItem(REMOVED_ITEMS_STORAGE_KEY) || '[]') as string[]
      if (!removedIds.includes(itemId)) {
        removedIds.push(itemId)
        localStorage.setItem(REMOVED_ITEMS_STORAGE_KEY, JSON.stringify(removedIds))
      }
      // Also clean up from local custom items if present
      const rawCustom = localStorage.getItem(LOCAL_ITEMS_STORAGE_KEY)
      if (rawCustom) {
        const custom = JSON.parse(rawCustom) as Item[]
        localStorage.setItem(LOCAL_ITEMS_STORAGE_KEY, JSON.stringify(custom.filter(c => c.id !== itemId)))
      }
      window.dispatchEvent(new Event('campusfind_items_change'))
    } catch (e) {}
  }

  // Developer action: Quick status toggle (Active / Resolved)
  const handleToggleStatus = async (itemId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'resolved' : 'active'
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, status: nextStatus as any }
      }
      return item
    }))

    // Call server API
    try {
      await fetch(`/api/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, caller: currentUser }),
      })
    } catch (e) {}

    // Update localStorage
    try {
      const rawCustom = localStorage.getItem(LOCAL_ITEMS_STORAGE_KEY)
      if (rawCustom) {
        const custom = JSON.parse(rawCustom) as Item[]
        localStorage.setItem(
          LOCAL_ITEMS_STORAGE_KEY,
          JSON.stringify(custom.map(c => c.id === itemId ? { ...c, status: nextStatus as any } : c))
        )
      }
      window.dispatchEvent(new Event('campusfind_items_change'))
    } catch (e) {}
  }

  // Filter items
  const filteredItems = items.filter(item => {
    const matchType = typeFilter === 'all' || item.type === typeFilter
    const q = searchQuery.toLowerCase()
    const matchQuery = !q || 
      item.title.toLowerCase().includes(q) || 
      item.description.toLowerCase().includes(q) ||
      (item.location_detail && item.location_detail.toLowerCase().includes(q))
    return matchType && matchQuery
  })

  const stats = {
    totalItems: items.length,
    activeLost: items.filter(i => i.type === 'lost' && i.status === 'active').length,
    activeFound: items.filter(i => i.type === 'found' && i.status === 'active').length,
    resolved: items.filter(i => i.status === 'resolved').length,
    pendingClaims: claims.length,
    totalDevs: adminsList.length,
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white border-b border-slate-800 py-8">
        <div className="container-page">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-400/20 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Admin & Master Control Console</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                CampusFind Admin Console
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm">
                Administrative access enabled ({isSuperDev ? 'Primary Administrator' : 'Authorized Administrator'})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link 
                href="/" 
                target="_blank" 
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
              >
                <span>Live Site</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page space-y-8">
        {/* KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[
            { label: 'Total Items', value: stats.totalItems, color: 'bg-white border-slate-200 text-slate-900' },
            { label: 'Active Lost', value: stats.activeLost, color: 'bg-red-50/70 border-red-200 text-red-700' },
            { label: 'Active Found', value: stats.activeFound, color: 'bg-green-50/70 border-green-200 text-green-700' },
            { label: 'Resolved / Returned', value: stats.resolved, color: 'bg-slate-100/70 border-slate-200 text-slate-700' },
            { label: 'Pending Claims', value: stats.pendingClaims, color: 'bg-amber-50/70 border-amber-200 text-amber-700' },
            { label: 'Active Admins', value: stats.totalDevs, color: 'bg-indigo-50/70 border-indigo-200 text-indigo-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`p-4 rounded-xl border text-center shadow-xs ${color}`}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Administrator Access Delegation Panel (Only visible to the Primary Admin) ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-500" />
                <h2 className="text-base font-bold text-slate-900">Administrator Access Delegation</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Grant or revoke admin privileges to other Gmail accounts. Only the primary administrator has authority to manage this list.
              </p>
            </div>
            {isSuperDev && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full flex-shrink-0 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Primary Authority</span>
              </span>
            )}
          </div>

          {isSuperDev ? (
            <div className="space-y-5">
              {/* Add New Admin Form */}
              <form onSubmit={handleAddDeveloper} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl">
                  <input
                    type="email"
                    value={newDevEmail}
                    onChange={e => setNewDevEmail(e.target.value)}
                    placeholder="Admin Gmail address"
                    className="flex-1 input text-xs sm:text-sm"
                    required
                  />
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newDevPassword}
                      onChange={e => setNewDevPassword(e.target.value)}
                      placeholder="Assign login password"
                      className="w-full input text-xs sm:text-sm pr-16"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="p-1 text-slate-400 hover:text-indigo-600"
                        title="Auto-generate password"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(v => !v)}
                        className="p-1 text-slate-400 hover:text-slate-600"
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingAdmin}
                  className="btn bg-slate-900 hover:bg-slate-800 text-white text-xs px-5 py-2 rounded-lg font-medium flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isSubmittingAdmin ? 'Granting Access...' : 'Grant Admin Access'}
                </button>
              </form>

              {devActionMsg && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                  devActionMsg.type === 'success'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {devActionMsg.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  <span>{devActionMsg.text}</span>
                </div>
              )}

              {/* Administrators List */}
              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
                  Authorized Administrators ({adminsList.length})
                </label>
                <div className="space-y-2">
                  {adminsList.map(admin => (
                    <div
                      key={admin.email}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border text-xs ${
                        admin.isPrimary
                          ? 'bg-amber-50/60 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${admin.isPrimary ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-800 font-mono truncate">{admin.email}</span>
                            {admin.isPrimary && (
                              <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold flex-shrink-0">Primary</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="font-mono text-slate-500 tracking-wider">
                              {visiblePasswords[admin.email] ? admin.password : '••••••••'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setVisiblePasswords(v => ({ ...v, [admin.email]: !v[admin.email] }))}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                          title={visiblePasswords[admin.email] ? 'Hide password' : 'Show password'}
                        >
                          {visiblePasswords[admin.email] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyPassword(admin.email, admin.password)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all"
                          title="Copy password"
                        >
                          {copiedEmail === admin.email ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingAdmin(admin); setEditPasswordValue(admin.password); setShowEditPassword(false) }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all"
                          title="Edit password"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {!admin.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleRevokeDeveloper(admin.email)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                            title="Revoke access"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edit Password Modal */}
              {editingAdmin && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
                  <p className="text-xs font-semibold text-indigo-800">
                    Update login password for <span className="font-mono">{editingAdmin.email}</span>
                  </p>
                  <div className="flex gap-2 max-w-sm">
                    <div className="relative flex-1">
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        value={editPasswordValue}
                        onChange={e => setEditPasswordValue(e.target.value)}
                        placeholder="New password"
                        className="w-full input text-xs pr-16"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={generateEditPassword}
                          className="p-1 text-slate-400 hover:text-indigo-600"
                          title="Auto-generate password"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowEditPassword(v => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                        >
                          {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveUpdatedPassword}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg font-medium flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingAdmin(null); setEditPasswordValue('') }}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 text-xs rounded-lg font-medium border border-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Delegate Management Locked</p>
              <p>You have administrator access to manage campus items, but only the primary administrator ({DEVELOPER_EMAIL}) has authority to add or revoke other administrators.</p>
            </div>
          )}
        </section>

        {/* ── Reported Items Management (Instant Deletion / Status Control) ── */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Item Feed Management ({filteredItems.length})
              </h2>
              <p className="text-xs text-slate-500">
                Developers can delete false reports, mark items resolved, or inspect private details instantly.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter items..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg w-40 sm:w-56 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
                {(['all', 'lost', 'found'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-2.5 py-1 rounded-md capitalize transition-all ${
                      typeFilter === t ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Item & Details</th>
                    <th className="text-left px-4 py-3 font-semibold">Type</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Location</th>
                    <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Reported Date</th>
                    <th className="text-right px-4 py-3 font-semibold">Developer Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                        No items match the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0 mt-0.5">
                              <CategoryIcon category={item.category_id || item.category?.name} className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate max-w-[220px]">
                                {item.title}
                              </p>
                              <p className="text-xs text-slate-500 line-clamp-1 max-w-[280px]">
                                {item.description}
                              </p>
                              {item.private_details && (
                                <p className="text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block border border-amber-200/60 font-mono">
                                  Secret: {item.private_details}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className={`badge text-xs ${TYPE_COLORS[item.type]}`}>
                            {TYPE_LABELS[item.type]}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item.id, item.status)}
                            title="Click to toggle status between active and resolved"
                            className={`badge text-xs cursor-pointer hover:opacity-80 transition-opacity ${STATUS_COLORS[item.status]}`}
                          >
                            {STATUS_LABELS[item.status]} <RefreshCw className="w-3 h-3 inline-block ml-0.5 opacity-70" />
                          </button>
                        </td>

                        <td className="px-4 py-3 text-slate-600 text-xs hidden md:table-cell">
                          {item.location?.name || item.location_detail || 'Campus Area'}
                        </td>

                        <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">
                          {formatDate(item.date_occurred)}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/items/${item.id}`}
                              target="_blank"
                              className="px-2.5 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                              title="Inspect public page"
                            >
                              Inspect ↗
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id, item.title)}
                              className="px-2.5 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors font-medium flex items-center gap-1 border border-red-200"
                              title="Delete this item completely"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Pending Claims Queue ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Pending Ownership Claims Queue ({claims.length})
              </h2>
              <p className="text-xs text-slate-500">
                Verify student identity and approve handover claims.
              </p>
            </div>
          </div>

          {claims.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 py-10 text-center p-6 shadow-xs">
              <p className="text-sm text-slate-600 font-medium">All claim requests have been processed.</p>
              <p className="text-xs text-slate-400 mt-1">When students submit ownership claims on found items, they will appear here.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Item</th>
                    <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Claimant</th>
                    <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Submitted</th>
                    <th className="text-right px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {claims.map(claim => (
                    <tr key={claim.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-900">{(claim.item as Item)?.title}</p>
                          <span className={`badge text-[11px] mt-0.5 ${TYPE_COLORS[(claim.item as Item)?.type]}`}>
                            {TYPE_LABELS[(claim.item as Item)?.type]}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                        {(claim.claimant as Profile)?.full_name}
                        <br />
                        <span className="text-xs text-slate-400">{(claim.claimant as Profile)?.email}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                        {formatRelativeTime(claim.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link 
                          href={`/admin/claims/${claim.id}`} 
                          className="btn bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium shadow-xs"
                        >
                          Review Proof →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

