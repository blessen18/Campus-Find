'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Edit, CheckCircle, AlertTriangle } from 'lucide-react'
import { ClaimModal } from '@/components/ClaimModal'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/providers/ToastProvider'
import type { Item } from '@/types'

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
  const [markingResolved, setMarkingResolved] = useState(false)
  const router = useRouter()
  const { success, error: showError } = useToast()
  const supabase = createClient()

  const markResolved = async () => {
    setMarkingResolved(true)
    const { error } = await supabase
      .from('items')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', item.id)
    if (error) {
      showError('Failed to update', error.message)
    } else {
      success('Marked as resolved!', 'This item has been successfully returned.')
      router.refresh()
    }
    setMarkingResolved(false)
  }

  if (!userId) {
    return (
      <div className="card p-5 text-center">
        <p className="text-sm text-content-muted mb-4">Sign in to report this as yours or take action.</p>
        <Link href={`/auth/login?redirect=/items/${item.id}`} className="btn-primary w-full justify-center">
          Sign in to Claim
        </Link>
      </div>
    )
  }

  if (item.status !== 'active') {
    return (
      <div className="card p-5 text-center">
        <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
        <p className="text-sm font-semibold text-content">This item has been {item.status}</p>
        <p className="text-xs text-content-muted mt-1">No further action needed.</p>
      </div>
    )
  }

  return (
    <>
      <div className="card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-content">Actions</h3>

        {/* Found item — allow claiming */}
        {canClaim && (
          <button
            onClick={() => setShowClaimModal(true)}
            className="btn-primary w-full justify-center"
          >
            🙋 This is Mine — Claim It
          </button>
        )}

        {/* Lost item — user can mark resolved */}
        {isOwner && item.type === 'lost' && (
          <button
            onClick={markResolved}
            disabled={markingResolved}
            className="btn bg-green-600 text-white hover:bg-green-700 w-full justify-center"
          >
            <CheckCircle className="w-4 h-4" />
            {markingResolved ? 'Updating…' : 'Mark as Returned'}
          </button>
        )}

        {/* Owner — edit */}
        {isOwner && (
          <Link href={`/dashboard/edit/${item.id}`} className="btn-secondary w-full justify-center gap-2">
            <Edit className="w-4 h-4" /> Edit Report
          </Link>
        )}

        {/* Admin actions */}
        {isAdmin && !isOwner && (
          <>
            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold text-content-muted uppercase tracking-wide mb-2">Admin</p>
              <button
                onClick={markResolved}
                disabled={markingResolved}
                className="btn bg-green-600 text-white hover:bg-green-700 w-full justify-center btn-sm"
              >
                <CheckCircle className="w-4 h-4" />
                {markingResolved ? 'Updating…' : 'Mark Resolved'}
              </button>
              <Link href={`/admin/items/${item.id}`} className="btn-secondary btn-sm w-full justify-center mt-2">
                View in Admin
              </Link>
            </div>
          </>
        )}

        {/* Same person can't claim their own found item */}
        {isOwner && item.type === 'found' && (
          <div className="flex items-start gap-2 text-xs text-content-muted bg-surface-muted rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            You reported this found item. Others can claim it.
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

