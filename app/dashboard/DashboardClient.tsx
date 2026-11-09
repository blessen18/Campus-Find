'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { 
  Plus, Package, CheckCircle2, Clock, ShieldCheck, 
  Trash2, ExternalLink, AlertCircle, Check, Eye
} from 'lucide-react'
import { formatDate, formatRelativeTime, STATUS_COLORS, STATUS_LABELS, TYPE_LABELS, TYPE_COLORS, isDeveloperEmail } from '@/lib/utils'
import { useToast } from '@/components/providers/ToastProvider'
import type { Item, Claim, Profile } from '@/types'

const LOCAL_ITEMS_STORAGE_KEY = 'campusfind_custom_items'
const REMOVED_ITEMS_STORAGE_KEY = 'campusfind_removed_item_ids'

interface Props {
  initialItems: Item[]
  initialClaims: Claim[]
  currentUser: Profile
}

export function DashboardClient({ initialItems, initialClaims, currentUser }: Props) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [claims] = useState<Claim[]>(initialClaims)
  const [loading, setLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const { success, error: showError } = useToast()

  const isUserOwner = useCallback((item: Item) => {
    if (!currentUser) return false
    if (currentUser.id && item.reported_by && currentUser.id === item.reported_by) return true
    if (currentUser.email && item.reporter?.email && currentUser.email.toLowerCase() === item.reporter.email.toLowerCase()) return true
    return false
  }, [currentUser])

  const isAdmin = currentUser.role === 'admin' || isDeveloperEmail(currentUser.email)

  // Sync user's reported items from both server API and localStorage
  const loadMyItems = useCallback(async () => {
    try {
      // 1. Fetch from server API
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

      // 2. Fetch from local custom items
      let localCustom: Item[] = []
      if (typeof window !== 'undefined') {
        const rawCustom = localStorage.getItem(LOCAL_ITEMS_STORAGE_KEY)
        if (rawCustom) {
          try {
            const parsed = JSON.parse(rawCustom)
            if (Array.isArray(parsed)) localCustom = parsed
          } catch (e) {}
        }
      }

      // 3. Removed IDs
      let removedIds: string[] = []
      if (typeof window !== 'undefined') {
        try {
          removedIds = JSON.parse(localStorage.getItem(REMOVED_ITEMS_STORAGE_KEY) || '[]')
        } catch (e) {}
      }

      // 4. Merge all sources
      const allUnique = [...initialItems]
      for (const item of [...serverItems, ...localCustom]) {
        const existingIdx = allUnique.findIndex(m => m.id === item.id)
        if (existingIdx >= 0) {
          allUnique[existingIdx] = { ...allUnique[existingIdx], ...item }
        } else {
          allUnique.unshift(item)
        }
      }

      // Filter only items reported by this user (or if admin, show all user's reports)
      const myOnly = allUnique.filter(item => {
        if (removedIds.includes(item.id)) return false
        if (item.status === 'removed') return false
        return isUserOwner(item) || item.reported_by === currentUser.id
      })

      setItems(myOnly)
    } catch (err) {
      console.warn('Dashboard items load issue:', err)
    }
  }, [currentUser.id, initialItems, isUserOwner])

  useEffect(() => {
    loadMyItems()

    const onItemsChange = () => loadMyItems()
    window.addEventListener('campusfind_items_change', onItemsChange)
    return () => window.removeEventListener('campusfind_items_change', onItemsChange)
  }, [loadMyItems])

  // Handler: "Remove from Reported" (Lost) or "Remove from Found" (Found)
  // Marks the item as reunited/resolved and removes it from active campus listings
  const handleResolveAndRemove = async (item: Item) => {
    const isLost = item.type === 'lost'
    const confirmPrompt = isLost
      ? `Have you received your lost "${item.title}"?\n\nThis will remove the item from active campus search listings and mark it as Returned.`
      : `Has the found "${item.title}" been returned to its rightful owner?\n\nThis will remove the item from active campus listings and mark it as Reunited.`

    if (!window.confirm(confirmPrompt)) return

    setActionLoadingId(item.id)
    try {
      // 1. Call server API
      const res = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'resolved',
          caller: currentUser,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Failed to update report.')
      }

      // 2. Update localStorage
      if (typeof window !== 'undefined') {
        const rawCustom = localStorage.getItem(LOCAL_ITEMS_STORAGE_KEY)
        if (rawCustom) {
          try {
            const list = JSON.parse(rawCustom) as Item[]
            localStorage.setItem(
              LOCAL_ITEMS_STORAGE_KEY,
              JSON.stringify(list.map(i => i.id === item.id ? { ...i, status: 'resolved', resolved_at: new Date().toISOString() } : i))
            )
          } catch (e) {}
        }
        window.dispatchEvent(new Event('campusfind_items_change'))
      }

      // 3. Update local state
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'resolved', resolved_at: new Date().toISOString() } : i))

      success(
        isLost ? 'Removed from reported!' : 'Removed from found!',
        isLost
          ? 'Glad you found your item! The report has been closed.'
          : 'Thank you for helping reunite campus property!'
      )
    } catch (err: any) {
      showError('Action failed', err?.message || 'Could not update report.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Handler: Completely Delete Report
  const handleDeleteReport = async (item: Item) => {
    if (!window.confirm(`Permanently remove report "${item.title}"?`)) return

    setActionLoadingId(item.id)
    try {
      // 1. Call server API
      const res = await fetch(`/api/items/${item.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caller: currentUser }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Failed to remove report.')
      }

      // 2. Update localStorage
      if (typeof window !== 'undefined') {
        const rawCustom = localStorage.getItem(LOCAL_ITEMS_STORAGE_KEY)
        if (rawCustom) {
          try {
            const list = JSON.parse(rawCustom) as Item[]
            localStorage.setItem(LOCAL_ITEMS_STORAGE_KEY, JSON.stringify(list.filter(i => i.id !== item.id)))
          } catch (e) {}
        }

        const removedIds = JSON.parse(localStorage.getItem(REMOVED_ITEMS_STORAGE_KEY) || '[]') as string[]
        if (!removedIds.includes(item.id)) {
          removedIds.push(item.id)
          localStorage.setItem(REMOVED_ITEMS_STORAGE_KEY, JSON.stringify(removedIds))
        }
        window.dispatchEvent(new Event('campusfind_items_change'))
      }

      // 3. Update local state
      setItems(prev => prev.filter(i => i.id !== item.id))
      success('Report deleted', `"${item.title}" has been completely removed.`)
    } catch (err: any) {
      showError('Delete failed', err?.message || 'Could not delete report.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const stats = {
    total:    items.length,
    active:   items.filter(i => i.status === 'active').length,
    resolved: items.filter(i => i.status === 'resolved').length,
    claims:   claims.length,
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 py-8">
        <div className="container-page">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
                <span>Student / Staff Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Reports & Claims</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Welcome back, <strong className="text-slate-800">{currentUser?.full_name || currentUser?.email}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/report/lost" className="btn bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs px-3.5 py-2 rounded-lg font-medium">
                <Plus className="w-3.5 h-3.5" /> Report Lost
              </Link>
              <Link href="/report/found" className="btn bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-2 rounded-lg font-medium shadow-xs">
                <Plus className="w-3.5 h-3.5" /> Report Found
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page space-y-8">
        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'My Reports',    value: stats.total,    icon: Package,      color: 'text-slate-700 bg-slate-100' },
            { label: 'Active Feeds',  value: stats.active,   icon: Clock,        color: 'text-amber-700 bg-amber-50' },
            { label: 'Returned',      value: stats.resolved, icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50' },
            { label: 'Active Claims', value: stats.claims,   icon: ShieldCheck,  color: 'text-blue-700 bg-blue-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* My Reports */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Items I've Reported</h2>
            <span className="text-xs text-slate-500 font-medium">
              {items.length} {items.length === 1 ? 'report' : 'reports'} logged
            </span>
          </div>

          {items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 py-12 text-center p-6 shadow-xs">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">You haven't submitted any reports yet.</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Misplaced something or found someone's property?</p>
              <div className="flex justify-center gap-2">
                <Link href="/report/lost" className="btn bg-rose-50 text-rose-700 border border-rose-200 text-xs px-3.5 py-1.5 rounded-lg">
                  Report Lost
                </Link>
                <Link href="/report/found" className="btn bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-1.5 rounded-lg shadow-xs">
                  Report Found
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Item</th>
                      <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Type</th>
                      <th className="text-left px-4 py-3 font-semibold">Status</th>
                      <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Reported</th>
                      <th className="text-right px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map(item => {
                      const canModify = isUserOwner(item) || isAdmin
                      const isLost = item.type === 'lost'
                      const isActionBusy = actionLoadingId === item.id

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <span className="text-lg flex-shrink-0">{item.category?.icon || '📦'}</span>
                              <div className="min-w-0">
                                <Link 
                                  href={`/items/${item.id}`}
                                  className="font-semibold text-slate-900 hover:text-blue-600 truncate block max-w-[200px] sm:max-w-[260px]"
                                >
                                  {item.title}
                                </Link>
                                <span className="text-[11px] text-slate-400 block sm:hidden">
                                  {TYPE_LABELS[item.type]} · {formatRelativeTime(item.created_at)}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 hidden sm:table-cell">
                            <span className={`badge text-xs ${TYPE_COLORS[item.type]}`}>
                              {TYPE_LABELS[item.type]}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className={`badge text-xs ${STATUS_COLORS[item.status]}`}>
                              {STATUS_LABELS[item.status]}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-slate-500 hidden md:table-cell">
                            {formatRelativeTime(item.created_at)}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              {/* Dedicated Remove / Reunited Action */}
                              {canModify && item.status === 'active' && (
                                <button
                                  onClick={() => handleResolveAndRemove(item)}
                                  disabled={isActionBusy}
                                  title={isLost ? "Click if you got your lost item back" : "Click if the found item was returned to owner"}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                                    isLost
                                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{isLost ? 'Remove from Reported' : 'Remove from Found'}</span>
                                </button>
                              )}

                              {/* View Details Link */}
                              <Link 
                                href={`/items/${item.id}`} 
                                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors border border-slate-200/80"
                                title="View item page"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">View</span>
                              </Link>

                              {/* Delete Report Option */}
                              {canModify && (
                                <button
                                  onClick={() => handleDeleteReport(item)}
                                  disabled={isActionBusy}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Delete Report"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* My Claims */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">My Ownership Claims</h2>
          {claims.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 py-10 text-center p-6 shadow-xs">
              <p className="text-xs text-slate-500">You haven't submitted any ownership claims yet.</p>
              <Link href="/found-items" className="text-xs text-blue-600 font-semibold hover:underline mt-2 inline-block">
                Browse Recovered Items →
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Claimed Item</th>
                    <th className="text-left px-4 py-3 font-semibold">Verification Status</th>
                    <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Date Submitted</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {claims.map(claim => (
                    <tr key={claim.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900">{(claim.item as Item)?.title || 'Campus Item'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${
                          claim.status === 'approved'  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' :
                          claim.status === 'rejected'  ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200' :
                          'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
                        }`}>
                          {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                        {formatDate(claim.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/items/${(claim.item as Item)?.id}`} className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                          Details →
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
