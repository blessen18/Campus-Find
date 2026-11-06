'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle2, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'
import type { Claim, Item, Profile } from '@/types'

interface Props {
  claim: Claim & { item: Item; claimant: Profile }
}

export function ClaimReviewClient({ claim }: Props) {
  const [adminNotes, setAdminNotes] = useState(claim.admin_notes || '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { success, error: showError } = useToast()

  const handleAction = async (action: 'approved' | 'rejected') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/claims/${claim.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action,
          admin_notes: adminNotes.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update claim status')
      }

      success(`Claim ${action}!`, `Claim status has been updated to ${action}.`)
      router.push('/admin')
      router.refresh()
    } catch (err: unknown) {
      showError('Action failed', err instanceof Error ? err.message : 'Failed to update claim')
    } finally {
      setLoading(false)
    }
  }

  const proofImages = claim.proof_images?.map(path =>
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/claim-proofs/${path}`
  ) || []

  return (
    <div className="space-y-6">
      <div className="card p-6 space-y-4">
        <h3 className="text-base font-semibold text-content">Admin Decision & Notes</h3>
        
        <div>
          <label className="label" htmlFor="adminNotes">
            Verification Notes / Feedback for Claimant
          </label>
          <textarea
            id="adminNotes"
            rows={3}
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
            placeholder="e.g. Serial numbers matched college lab logs; student presented original invoice. Pickup authorized at Security Desk."
            className="input resize-none"
            disabled={loading || claim.status !== 'pending'}
          />
        </div>

        {claim.status === 'pending' ? (
          <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              onClick={() => handleAction('rejected')}
              disabled={loading}
              className="btn bg-red-600 text-white hover:bg-red-700 font-medium px-4 py-2"
            >
              <XCircle className="w-4 h-4" /> Reject Claim
            </button>
            <button
              onClick={() => handleAction('approved')}
              disabled={loading}
              className="btn bg-green-700 text-white hover:bg-green-800 font-medium px-5 py-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve & Authorize Handover
            </button>
          </div>
        ) : (
          <div className="p-3 bg-surface-muted rounded-lg text-sm text-content-muted">
            This claim is already marked as <strong>{claim.status}</strong>.
          </div>
        )}
      </div>

      {proofImages.length > 0 && (
        <div className="card p-6 space-y-3">
          <h3 className="text-base font-semibold text-content">Claimant Proof Images</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {proofImages.map((src, i) => (
              <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-border">
                <Image src={src} alt={`Proof image ${i + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

