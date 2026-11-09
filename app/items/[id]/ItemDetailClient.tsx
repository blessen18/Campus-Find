'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Edit, CheckCircle, AlertTriangle, Trash2, Check, ShieldCheck } from 'lucide-react'
import { ClaimModal } from '@/components/ClaimModal'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/providers/ToastProvider'
import type { Item } from '@/types'

const LOCAL_ITEMS_STORAGE_KEY = 'campusfind_custom_items'
const REMOVED_ITEMS_STORAGE_KEY = 'campusfind_removed_item_ids'

interface Props {
  item: Item
  userId: string | null
  userRole: string | null
  isOwner: boolean
  isAdmin: boolean
  canClaim: boolean
}

export function ItemDetailClient({ item, userId, userRole, isOwner, isAdmin, canClaim }: Props) {
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const router = useRouter()
  const { success, error: showError } = useToast()
  const supabase = createClient()

  const canRemove = isOwner || isAdmin
  const isLost = item.type === 'lost'

  // Mark resolved & remove from active campus listings
  const handleResolveAndRemove = async () => {
    const promptText = isLost
      ? `Have you received your lost "${item.title}"?\n\nThis will remove the item from active campus search listings and mark it as Returned.`
      : `Has the found "${item.title}" been returned to its rightful owner?\n\nThis will remove the item from active campus search listings and mark it as Reunited.`

    if (!window.confirm(promptText)) return

    setActionLoading(true)
    try {
      // 1. Call server API
      const res = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'resolved',
          caller: { id: userId, role: userRole },
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to update report.')
      }

      // 2. Also attempt Supabase update if reachable
      try {
        await supabase
          .from('items')
          .update({ status: 'resolved', resolved_at: new Date().toISOString() })
          .eq('id', item.id)
      } catch (e) {}

      // 3. Update localStorage
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

      success(
        isLost ? 'Removed from reported!' : 'Removed from found!',
        isLost
          ? 'Glad you found your item! The report has been closed.'
          : 'Thank you for helping reunite campus property!'
      )
      router.refresh()
    } catch (err: any) {
      showError('Action failed', err?.message || 'Could not update report.')
    } finally {
      setActionLoading(false)
    }
  }

  // Completely delete report
  const handleDeleteReport = async () => {
    if (!window.confirm(`Permanently remove report "${item.title}" from CampusFind?`)) return

    setActionLoading(true)
    try {
      // 1. Call server API
      const res = await fetch(`/api/items/${item.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caller: { id: userId, role: userRole },
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to delete report.')
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

      success('Report removed', `"${item.title}" has been deleted.`)
      router.push(isLost ? '/lost-items' : '/found-items')
    } catch (err: any) {
      showError('Delete failed', err?.message || 'Could not delete report.')
    } finally {
      setActionLoading(false)
    }
  }

  if (!userId) {
    return (
      <div className="card p-5 text-center bg-white rounded-2xl border border-slate-200/90 shadow-xs">
        <p className="text-sm text-slate-500 mb-4">Sign in to report this as yours or take action.</p>
        <Link href={`/auth/login?redirect=/items/${item.id}`} className="btn bg-blue-600 hover:bg-blue-700 text-white w-full justify-center text-xs py-2.5 rounded-lg font-semibold">
          Sign in to Claim
        </Link>
      </div>
    )
  }

  if (item.status !== 'active') {
    return (
      <div className="card p-5 text-center bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
        <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-1" />
        <p className="text-sm font-bold text-slate-900">This item has been {item.status}</p>
        <p className="text-xs text-slate-500">Item successfully returned to owner. No further action needed.</p>
        {canRemove && (
          <button
            onClick={handleDeleteReport}
            disabled={actionLoading}
            className="mt-3 text-xs text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Report Record
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Actions</h3>

        {/* Found item — allow others to claim */}
        {canClaim && (
          <button
            onClick={() => setShowClaimModal(true)}
            className="btn bg-blue-600 hover:bg-blue-700 text-white w-full justify-center text-xs py-2.5 rounded-lg font-semibold shadow-xs"
          >
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Claim This Item</span>
            </span>
          </button>
        )}

        {/* Reporter or Admin: Remove from Reported / Remove from Found */}
        {canRemove && (
          <div className="space-y-2 pt-1">
            <button
              onClick={handleResolveAndRemove}
              disabled={actionLoading}
              className={`btn w-full justify-center text-xs py-2.5 rounded-lg font-semibold shadow-xs transition-all gap-1.5 ${
                isLost 
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200' 
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}
            >
              <Check className="w-4 h-4" />
              {actionLoading ? 'Updating…' : isLost ? 'Remove from Reported' : 'Remove from Found'}
            </button>
            <p className="text-[11px] text-slate-400 text-center">
              {isLost ? 'Click once you get your lost item back.' : 'Click once item is returned to owner.'}
            </p>
          </div>
        )}

        {/* Reporter edit report */}
        {isOwner && (
          <Link href={`/dashboard/edit/${item.id}`} className="btn bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 w-full justify-center gap-2 text-xs py-2 rounded-lg font-medium">
            <Edit className="w-3.5 h-3.5" /> Edit Report
          </Link>
        )}

        {/* Admin management shortcut */}
        {isAdmin && !isOwner && (
          <div className="border-t border-slate-100 pt-3">
            <Link href={`/admin`} className="btn bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs py-2 w-full justify-center rounded-lg font-medium">
              View in Admin Console
            </Link>
          </div>
        )}

        {/* Delete Report option for owner/admin */}
        {canRemove && (
          <div className="border-t border-slate-100 pt-2 text-center">
            <button
              onClick={handleDeleteReport}
              disabled={actionLoading}
              className="text-xs text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-1 font-medium"
            >
              <Trash2 className="w-3 h-3" /> Delete Report
            </button>
          </div>
        )}

        {/* Finder note */}
        {isOwner && item.type === 'found' && (
          <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-100">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>You reported finding this item. Other students and staff can view and submit ownership claims.</span>
          </div>
        )}
      </div>

      {showClaimModal && userId && (
        <ClaimModal
          item={item}
          userId={userId}
          onClose={() => setShowClaimModal(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  )
}
