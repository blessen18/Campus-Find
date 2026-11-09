'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, User, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react'
import { formatDate, formatRelativeTime, STATUS_COLORS, STATUS_LABELS, TYPE_LABELS, TYPE_COLORS } from '@/lib/utils'
import { ItemDetailClient } from './ItemDetailClient'
import { getClientUser } from '@/lib/auth'
import type { Item, Profile } from '@/types'

interface Props {
  initialItem: Item | null
  id: string
  serverUser: Profile | null
}

export function ItemDetailView({ initialItem, id, serverUser }: Props) {
  const [item, setItem] = useState<Item | null>(initialItem)
  const [loading, setLoading] = useState(!initialItem)
  const [user, setUser] = useState<Profile | null>(serverUser)

  useEffect(() => {
    if (!user) {
      const clientU = getClientUser()
      if (clientU) setUser(clientU)
    }

    if (!item && typeof window !== 'undefined') {
      const fetchItemDetails = async () => {
        // 1. Check localStorage
        try {
          const raw = localStorage.getItem('campusfind_custom_items')
          if (raw) {
            const list = JSON.parse(raw) as Item[]
            const found = list.find(i => i.id === id)
            if (found) {
              setItem(found)
              setLoading(false)
              return
            }
          }
        } catch (e) {}

        // 2. Fetch from shared server API
        try {
          const res = await fetch(`/api/items/${id}`)
          if (res.ok) {
            const data = await res.json()
            if (data.data) {
              setItem(data.data)
              setLoading(false)
              return
            }
          }
        } catch (e) {}

        setLoading(false)
      }

      fetchItemDetails()
    }
  }, [id, item, user])

  if (loading) {
    return (
      <div className="container-page max-w-5xl py-16 text-center text-slate-500">
        Loading item details…
      </div>
    )
  }

  if (!item) {
    return (
      <div className="container-page max-w-md py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Item Not Found</h1>
        <p className="text-sm text-slate-500">
          This item may have been removed or does not exist.
        </p>
        <Link href="/lost-items" className="btn bg-blue-600 text-white text-xs px-4 py-2 rounded-lg inline-flex">
          Browse Lost Items
        </Link>
      </div>
    )
  }

  const userId = user?.id || null
  const isOwner = userId === item.reported_by
  const isAdmin = user?.role === 'admin'
  const canClaim = !!userId && !isOwner && item.type === 'found' && item.status === 'active'

  const images = item.images?.map((path: string) =>
    path.startsWith('http') || path.startsWith('data:')
      ? path
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/item-images/${path}`
  ) || []

  return (
    <div className="container-page max-w-5xl py-8 space-y-6">
      <Link
        href={item.type === 'lost' ? '/lost-items' : '/found-items'}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to {item.type === 'lost' ? 'Lost' : 'Found'} Items
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Image & Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
            {images.length > 0 ? (
              <div className="relative h-80 sm:h-96 w-full bg-slate-100">
                <Image src={images[0]} alt={item.title} fill className="object-cover" priority unoptimized={images[0].startsWith('data:')} />
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center bg-slate-50 text-5xl">
                {item.category?.icon || '📦'}
              </div>
            )}
            {images.length > 1 && (
              <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex gap-2 overflow-x-auto">
                {images.slice(1).map((src, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                    <Image src={src} alt={`${item.title} ${i + 2}`} fill className="object-cover" unoptimized={src.startsWith('data:')} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge font-semibold text-xs px-3 py-1 ${TYPE_COLORS[item.type]}`}>
                {TYPE_LABELS[item.type]} Item
              </span>
              <span className={`badge text-xs px-3 py-1 ${STATUS_COLORS[item.status]}`}>
                {STATUS_LABELS[item.status]}
              </span>
              {item.category && (
                <span className="badge bg-slate-100 text-slate-700 ring-1 ring-slate-200 text-xs px-2.5 py-1">
                  {item.category.icon} {item.category.name}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{item.title}</h1>
              <p className="text-xs text-slate-400 mt-1">Reported {formatRelativeTime(item.created_at)}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>
                  <strong>Date:</strong> {formatDate(item.date_occurred)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="truncate">
                  <strong>Location:</strong> {item.location?.name || item.location_detail || 'Campus'}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>
                  <strong>Reported By:</strong> {item.reporter?.full_name || 'Campus Member'} {item.reporter?.department && `(${item.reporter.department})`}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Item Description</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
            </div>
          </div>
        </div>

        {/* Right: Action Sidebar */}
        <div className="space-y-5">
          <ItemDetailClient
            item={item}
            userId={userId}
            userRole={user?.role || null}
            isOwner={isOwner}
            isAdmin={isAdmin}
            canClaim={!!canClaim}
          />

          {/* Verification Protocol Box */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Campus Security Handover</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Found belongings deposited on CampusFind are verified at the college security desk or designated departmental office before release.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-3">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Bring valid student/faculty ID during claim retrieval.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Be ready to unlock device or describe specific marks.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

