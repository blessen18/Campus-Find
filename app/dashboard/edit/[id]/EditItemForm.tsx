'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/providers/ToastProvider'
import { CATEGORIES, CAMPUS_LOCATIONS } from '@/lib/utils'
import type { Item, ItemStatus } from '@/types'

interface Props {
  item: Item
}

export function EditItemForm({ item }: Props) {
  const [title, setTitle] = useState(item.title)
  const [description, setDescription] = useState(item.description)
  const [categoryId, setCategoryId] = useState(item.category_id || '')
  const [locationDetail, setLocationDetail] = useState(item.location_detail || '')
  const [status, setStatus] = useState(item.status)
  const [privateDetails, setPrivateDetails] = useState(item.private_details || '')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const { success, error: showError } = useToast()
  const supabase = createClient()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      showError('Required fields missing', 'Please provide a title and description.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('items')
        .update({
          title: title.trim(),
          description: description.trim(),
          category_id: categoryId || null,
          location_detail: locationDetail.trim() || null,
          status: status,
          private_details: privateDetails.trim() || null,
          resolved_at: status === 'resolved' ? new Date().toISOString() : item.resolved_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)

      if (error) throw error

      success('Report updated!', 'Your changes have been saved.')
      router.push(`/items/${item.id}`)
      router.refresh()
    } catch (err: unknown) {
      showError('Update failed', err instanceof Error ? err.message : 'Could not save changes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleUpdate} className="space-y-6">
      <div>
        <label className="label" htmlFor="title">Item Name</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="input"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="cat">Category</label>
          <select
            id="cat"
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className="input"
          >
            <option value="">Select category…</option>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="status">Report Status</label>
          <select
            id="status"
            value={status}
            onChange={e => setStatus(e.target.value as ItemStatus)}
            className="input"
          >
            <option value="active">Active (Visible)</option>
            <option value="resolved">Resolved (Returned / Closed)</option>
            <option value="claimed">Claimed</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="loc">Specific Location Details</label>
        <input
          id="loc"
          type="text"
          value={locationDetail}
          onChange={e => setLocationDetail(e.target.value)}
          placeholder="e.g. 2nd Floor, Room 204 or near canteen counter"
          className="input"
        />
      </div>

      <div>
        <label className="label" htmlFor="desc">Description</label>
        <textarea
          id="desc"
          rows={4}
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="input resize-none"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="private">
          Private Identifying Details <span className="text-xs text-content-muted font-normal">(Never shown publicly)</span>
        </label>
        <textarea
          id="private"
          rows={2}
          value={privateDetails}
          onChange={e => setPrivateDetails(e.target.value)}
          className="input resize-none"
          placeholder="Serial numbers, markings, inner contents for verification"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

