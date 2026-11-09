'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Trash2, ShieldCheck, UserCheck, Key, Plus, RefreshCw, 
  AlertCircle, CheckCircle, Search, ExternalLink, ShieldAlert,
  ArrowUpRight, Clock, FileText, Check, X
} from 'lucide-react'
import { 
  formatDate, formatRelativeTime, 
  STATUS_COLORS, STATUS_LABELS, 
  TYPE_COLORS, TYPE_LABELS, 
  DEVELOPER_EMAIL 
} from '@/lib/utils'
import { INITIAL_CAMPUS_ITEMS } from '@/data/initialItems'
import type { Item, Claim, Profile } from '@/types'

const LOCAL_ITEMS_STORAGE_KEY = 'campusfind_custom_items'
const DEVS_STORAGE_KEY = 'campusfind_developer_whitelist'
const REMOVED_ITEMS_STORAGE_KEY = 'campusfind_removed_item_ids'

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

  // Developer Whitelist State
  const [whitelistedDevs, setWhitelistedDevs] = useState<string[]>([DEVELOPER_EMAIL.toLowerCase()])
  const [newDevEmail, setNewDevEmail] = useState('')
  const [devActionMsg, setDevActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load local modifications & developer list from localStorage + shared API
  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncItems = async () => {
      try {
        // Load Whitelist
        const savedDevs = localStorage.getItem(DEVS_STORAGE_KEY)
        if (savedDevs) {
          const parsed = JSON.parse(savedDevs) as string[]
          if (Array.isArray(parsed)) {
            const unique = Array.from(new Set([DEVELOPER_EMAIL.toLowerCase(), ...parsed.map(e => e.toLowerCase())]))
            setWhitelistedDevs(unique)
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

  // Function to grant another Gmail developer access (SuperDev only)
  const handleAddDeveloper = (e: React.FormEvent) => {
    e.preventDefault()
    setDevActionMsg(null)
    const clean = newDevEmail.trim().toLowerCase()
    
    if (!clean) {
      setDevActionMsg({ type: 'error', text: 'Please enter an email address.' })
      return
    }
    if (!clean.includes('@') || !clean.includes('.')) {
      setDevActionMsg({ type: 'error', text: 'Please enter a valid email address.' })
      return
    }
    if (whitelistedDevs.includes(clean)) {
      setDevActionMsg({ type: 'error', text: 'This email already has developer access.' })
      return
    }

    const updated = [...whitelistedDevs, clean]
    setWhitelistedDevs(updated)
    try {
      localStorage.setItem(DEVS_STORAGE_KEY, JSON.stringify(updated))
      setDevActionMsg({ type: 'success', text: `Granted developer access to ${clean} successfully!` })
      setNewDevEmail('')
    } catch {
      setDevActionMsg({ type: 'error', text: 'Failed to save to storage.' })
    }
  }

  // Remove a developer from whitelist
  const handleRevokeDeveloper = (targetEmail: string) => {
    if (targetEmail.toLowerCase() === DEVELOPER_EMAIL.toLowerCase()) {
      alert('The primary founding developer cannot be removed.')
      return
    }
    if (!confirm(`Revoke developer privileges for ${targetEmail}?`)) return

    const updated = whitelistedDevs.filter(e => e.toLowerCase() !== targetEmail.toLowerCase())
    setWhitelistedDevs(updated)
    try {
      localStorage.setItem(DEVS_STORAGE_KEY, JSON.stringify(updated))
      setDevActionMsg({ type: 'success', text: `Revoked developer access for ${targetEmail}.` })
    } catch (e) {
      // ignore
    }
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
    totalDevs: whitelistedDevs.length,
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
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full flex-shrink-0">
                ⭐ Primary Authority
              </span>
            )}
          </div>

          {isSuperDev ? (
            <div className="space-y-4">
              <form onSubmit={handleAddDeveloper} className="flex flex-col sm:flex-row gap-2 max-w-xl">
                <input
                  type="email"
                  value={newDevEmail}
                  onChange={e => setNewDevEmail(e.target.value)}
                  placeholder="Enter Gmail address (e.g. co-dev@gmail.com)"
                  className="flex-1 input text-xs sm:text-sm"
                />
                <button
                  type="submit"
                  className="btn bg-slate-900 hover:bg-slate-800 text-white text-xs px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Grant Access
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

              {/* Whitelist Display */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                  Authorized Administrators ({whitelistedDevs.length})
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {whitelistedDevs.map(devMail => (
                    <div 
                      key={devMail} 
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                        devMail.toLowerCase() === DEVELOPER_EMAIL.toLowerCase() 
                          ? 'bg-amber-50/60 border-amber-200 text-amber-900 font-semibold' 
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="truncate mr-2 font-mono">{devMail}</span>
                      {devMail.toLowerCase() === DEVELOPER_EMAIL.toLowerCase() ? (
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">Primary</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRevokeDeveloper(devMail)}
                          className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                          title="Revoke developer access"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Delegate Management Locked</p>
              <p>You have developer access to inspect and remove reported items, but only the primary founding developer ({DEVELOPER_EMAIL}) has authority to add or revoke other developers.</p>
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
                            <span className="text-lg mt-0.5">{item.category?.icon || '📦'}</span>
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
                            {STATUS_LABELS[item.status]} ⟳
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
              <p className="text-sm text-slate-600 font-medium">All claim requests are processed! 🎉</p>
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

