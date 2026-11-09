'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, CheckCircle2, MessageSquare, Mail, Phone, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ImageUpload } from './ImageUpload'
import { generateSafeFileName, CATEGORIES, CAMPUS_LOCATIONS } from '@/lib/utils'
import { useToast } from './providers/ToastProvider'
import { getClientUser } from '@/lib/auth'
import type { Item, ItemType, ReportItemFormData } from '@/types'

interface ReportFormProps {
  defaultType: ItemType
}

const EMPTY_FORM: ReportItemFormData = {
  type: 'lost',
  title: '',
  description: '',
  category_id: '',
  location_id: '',
  location_detail: '',
  date_occurred: new Date().toISOString().split('T')[0],
  contact_preference: 'platform',
  private_details: '',
  images: [],
}

export function ReportForm({ defaultType }: ReportFormProps) {
  const [form, setForm]       = useState<ReportItemFormData>({ ...EMPTY_FORM, type: defaultType })
  const [errors, setErrors]   = useState<Partial<Record<keyof ReportItemFormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [locations, setLocations]   = useState<{ id: string; name: string }[]>(
    CAMPUS_LOCATIONS.map(name => ({ id: name, name }))
  )
  const router  = useRouter()
  const { success, error: showError } = useToast()
  const supabase = createClient()

  useEffect(() => {
    async function loadLocations() {
      try {
        const { data } = await supabase.from('locations').select('id, name').order('name')
        if (data && data.length > 0) setLocations(data)
      } catch (err) {
        // use default campus locations
      }
    }
    loadLocations()
  }, [])

  const validate = (): boolean => {
    const e: typeof errors = {}
    if (!form.title.trim())         e.title = 'Item name is required'
    if (!form.description.trim())   e.description = 'Description is required'
    if (!form.category_id)          e.category_id = 'Please select a category'
    if (!form.date_occurred)        e.date_occurred = 'Date is required'
    if (new Date(form.date_occurred) > new Date()) e.date_occurred = 'Date cannot be in the future'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      // 1. Resolve user ID from Supabase auth or fallback client session
      let userId: string | null = null
      let userFullName = 'Campus Member'
      let userEmail = ''

      try {
        const { data } = await supabase.auth.getUser()
        if (data?.user) {
          userId = data.user.id
          userEmail = data.user.email || ''
        }
      } catch (authErr) {
        // Supabase offline/placeholder
      }

      if (!userId) {
        const clientUser = getClientUser()
        if (clientUser) {
          userId = clientUser.id
          userFullName = clientUser.full_name
          userEmail = clientUser.email
        }
      }

      if (!userId) {
        router.push(`/auth/login?redirect=/report/${form.type}`)
        return
      }

      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

      // 2. Upload images or fallback to base64 Data URLs
      const imagePaths: string[] = []
      for (const file of form.images) {
        let uploaded = false
        if (!isPlaceholder) {
          try {
            const path = `items/${userId}/${generateSafeFileName(file.name)}`
            const { error: uploadErr } = await supabase.storage
              .from('item-images')
              .upload(path, file, { cacheControl: '3600', upsert: false })
            if (!uploadErr) {
              imagePaths.push(path)
              uploaded = true
            }
          } catch (storageErr) {
            console.warn('Storage upload note:', storageErr)
          }
        }

        if (!uploaded) {
          // Convert file to Data URL so it previews and renders even without cloud storage
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })
          imagePaths.push(dataUrl)
        }
      }

      // 3. Create item object
      const generatedItemId = 'item-' + Date.now()
      const newItem: Item = {
        id: generatedItemId,
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim(),
        category_id: form.category_id || null,
        location_id: null,
        location_detail: form.location_detail.trim() || form.location_id || null,
        date_occurred: form.date_occurred,
        status: 'active',
        images: imagePaths,
        private_details: form.private_details.trim() || null,
        contact_preference: form.contact_preference,
        reported_by: userId,
        resolved_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: (() => {
          const cat = CATEGORIES.find(c => c.id === form.category_id)
          return cat ? { id: cat.id, name: cat.name, slug: cat.id, icon: cat.icon, created_at: '' } : undefined
        })(),
        reporter: {
          id: userId,
          full_name: userFullName,
          email: userEmail,
          phone: null,
          role: 'student',
          department: null,
          student_id: null,
          avatar_url: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }

      // 4. If real Supabase is configured, insert to PostgreSQL database
      if (!isPlaceholder) {
        try {
          const { data: itemData, error: insertErr } = await supabase
            .from('items')
            .insert({
              type:               form.type,
              title:              form.title.trim(),
              description:        form.description.trim(),
              category_id:        form.category_id || null,
              location_id:        null,
              location_detail:    form.location_detail.trim() || form.location_id || null,
              date_occurred:      form.date_occurred,
              contact_preference: form.contact_preference,
              private_details:    form.private_details.trim() || null,
              images:             imagePaths,
              reported_by:        userId,
            })
            .select('id')
            .single()

          if (!insertErr && itemData) {
            newItem.id = itemData.id
          }
        } catch (dbErr) {
          console.warn('Database insert note:', dbErr)
        }
      }

      // 5. Send to shared server items API so all devices and admin portal see it immediately
      try {
        await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem),
        })
      } catch (apiErr) {
        console.warn('Server API save note:', apiErr)
      }

      // 6. Save to local custom items storage so the reporter immediately sees it
      try {
        const stored = JSON.parse(localStorage.getItem('campusfind_custom_items') || '[]') as Item[]
        localStorage.setItem('campusfind_custom_items', JSON.stringify([newItem, ...stored]))
        window.dispatchEvent(new Event('campusfind_items_change'))
      } catch (storageErr) {
        console.warn('Local storage save note:', storageErr)
      }

      success('Report submitted successfully!', 'Your report is now live on the campus feed.')
      router.push(`/items/${newItem.id}`)
      router.refresh()
    } catch (err: unknown) {
      showError('Submission note', err instanceof Error ? err.message : 'Please check your connection and login status.')
    } finally {
      setSubmitting(false)
    }
  }

  const set = (field: keyof ReportItemFormData, value: unknown) => {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Item type toggle */}
      <div>
        <label className="label">Report Category</label>
        <div className="grid grid-cols-2 gap-3">
          {(['lost', 'found'] as const).map(t => (
            <label
              key={t}
              className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                form.type === t
                  ? t === 'lost'
                    ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-xs'
                    : 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
              }`}
            >
              <input type="radio" name="type" value={t} className="sr-only" checked={form.type === t} onChange={() => set('type', t)} />
              {t === 'lost' ? <Search className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              <span className="font-bold text-sm capitalize">{t} Item</span>
            </label>
          ))}
        </div>
      </div>

      {/* Item name */}
      <div>
        <label className="label" htmlFor="title">Item Name <span className="text-rose-500">*</span></label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="e.g. Casio Scientific Calculator fx-991CW, Black Titan Watch…"
          className={`input ${errors.title ? 'input-error' : ''}`}
        />
        {errors.title && <p className="error-msg">{errors.title}</p>}
      </div>

      {/* Category + Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="category">Category <span className="text-rose-500">*</span></label>
          <select
            id="category"
            value={form.category_id}
            onChange={e => set('category_id', e.target.value)}
            className={`input ${errors.category_id ? 'input-error' : ''}`}
          >
            <option value="">Select category…</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.category_id && <p className="error-msg">{errors.category_id}</p>}
        </div>

        <div>
          <label className="label" htmlFor="date">
            Date {form.type === 'lost' ? 'Lost' : 'Found'} <span className="text-rose-500">*</span>
          </label>
          <input
            id="date"
            type="date"
            value={form.date_occurred}
            onChange={e => set('date_occurred', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className={`input ${errors.date_occurred ? 'input-error' : ''}`}
          />
          {errors.date_occurred && <p className="error-msg">{errors.date_occurred}</p>}
        </div>
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="location">Campus Location</label>
          <select
            id="location"
            value={form.location_id}
            onChange={e => set('location_id', e.target.value)}
            className="input"
          >
            <option value="">Select campus area…</option>
            {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="location_detail">Specific Spot (Optional)</label>
          <input
            id="location_detail"
            type="text"
            value={form.location_detail}
            onChange={e => set('location_detail', e.target.value)}
            placeholder="e.g. 2nd floor desk, near water cooler…"
            className="input"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="label" htmlFor="description">Public Description <span className="text-rose-500">*</span></label>
        <textarea
          id="description"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={4}
          placeholder="Describe color, brand, condition, and any external markings that help identify the item…"
          className={`input resize-none ${errors.description ? 'input-error' : ''}`}
        />
        {errors.description && <p className="error-msg">{errors.description}</p>}
      </div>

      {/* Private details */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
        <label className="label mb-0" htmlFor="private">
          Private Identifying Details <span className="text-slate-400 font-normal lowercase">(confidential — hidden from public)</span>
        </label>
        <p className="text-[11px] text-slate-500">
          Include secret markings, serial numbers, exact wallet contents, or lock patterns used to verify real ownership.
        </p>
        <textarea
          id="private"
          value={form.private_details}
          onChange={e => set('private_details', e.target.value)}
          rows={2}
          placeholder="e.g. Serial ending in 9482, formula note taped inside battery lid…"
          className="input resize-none bg-white"
        />
      </div>

      {/* Contact preference */}
      <div>
        <label className="label">Contact Preference</label>
        <div className="grid grid-cols-3 gap-2">
          {(['platform', 'email', 'phone'] as const).map(pref => (
            <label
              key={pref}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                form.contact_preference === pref
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="contact"
                value={pref}
                className="sr-only"
                checked={form.contact_preference === pref}
                onChange={() => set('contact_preference', pref)}
              />
              <span className="flex items-center gap-1.5">
                {pref === 'platform' && <MessageSquare className="w-3.5 h-3.5 text-blue-600" />}
                {pref === 'email' && <Mail className="w-3.5 h-3.5 text-blue-600" />}
                {pref === 'phone' && <Phone className="w-3.5 h-3.5 text-blue-600" />}
                <span>{pref === 'platform' ? 'CampusFind' : pref === 'email' ? 'Email' : 'Phone'}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Photos */}
      <div>
        <label className="label">Attach Photos (Up to 3)</label>
        <ImageUpload value={form.images} onChange={files => set('images', files)} maxFiles={3} disabled={submitting} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button type="button" onClick={() => router.back()} className="btn-secondary" disabled={submitting}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className={`btn text-white font-semibold px-6 py-2.5 rounded-lg shadow-sm ${
            form.type === 'lost' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-700 hover:bg-emerald-800'
          }`}
        >
          {submitting ? 'Submitting…' : `Submit ${form.type === 'lost' ? 'Lost' : 'Found'} Report`}
        </button>
      </div>
    </form>
  )
}
