'use client'

import { useState } from 'react'
import { X, AlertCircle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ImageUpload } from './ImageUpload'
import { generateSafeFileName } from '@/lib/utils'
import { useToast } from './providers/ToastProvider'
import type { Item } from '@/types'

interface ClaimModalProps {
  item: Item
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export function ClaimModal({ item, userId, onClose, onSuccess }: ClaimModalProps) {
  const [proof, setProof]           = useState('')
  const [images, setImages]         = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const { error: showError, success } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (proof.trim().length < 30) {
      showError('Proof too short', 'Please describe your proof of ownership in at least 30 characters.')
      return
    }

    setSubmitting(true)
    try {
      // Upload proof images
      const imagePaths: string[] = []
      for (const file of images) {
        const path = `claims/${userId}/${generateSafeFileName(file.name, 'proof')}`
        const { error } = await supabase.storage.from('claim-proofs').upload(path, file)
        if (error) throw new Error(`Image upload failed: ${error.message}`)
        imagePaths.push(path)
      }

      // Submit claim via API (server-side validation)
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: item.id,
          proof_description: proof.trim(),
          proof_images: imagePaths,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit claim')
      }

      setSubmitted(true)
      success('Claim submitted!', 'An admin will review your claim and get back to you.')
      setTimeout(() => { onSuccess(); onClose() }, 2000)

    } catch (err: unknown) {
      showError('Submission failed', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-content">Claim This Item</h2>
            <p className="text-xs text-content-muted mt-0.5">{item.title}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-content">Claim Submitted!</h3>
              <p className="text-sm text-content-muted mt-1">An admin will review and contact you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Info box */}
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Provide specific proof of ownership (purchase receipt, unique marks, photos, etc.).
                  False claims may result in account suspension. All claims require admin review.
                </p>
              </div>

              {/* Proof text */}
              <div>
                <label className="label" htmlFor="proof">
                  Proof of Ownership <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="proof"
                  value={proof}
                  onChange={e => setProof(e.target.value)}
                  rows={5}
                  placeholder="Describe how you can prove this is yours. Include specific details like brand, color, model, serial number, unique marks, contents, or when and where you lost it…"
                  className="input resize-none"
                  required
                />
                <p className="text-xs text-content-muted mt-1">{proof.length} / 30 characters minimum</p>
              </div>

              {/* Proof images */}
              <div>
                <label className="label">Supporting Images (optional)</label>
                <ImageUpload value={images} onChange={setImages} maxFiles={2} disabled={submitting} />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-secondary" disabled={submitting}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting || proof.trim().length < 30}>
                  {submitting ? 'Submitting…' : 'Submit Claim'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

