import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, User, ArrowLeft, Phone, Mail, MessageSquare, ShieldCheck } from 'lucide-react'
import { createClient, getServerUser } from '@/lib/supabase/server'
import { formatDate, formatRelativeTime, STATUS_COLORS, STATUS_LABELS, TYPE_LABELS, TYPE_COLORS } from '@/lib/utils'
import { ItemDetailClient } from './ItemDetailClient'
import { INITIAL_CAMPUS_ITEMS } from '@/data/initialItems'
import type { Item, Profile } from '@/types'
import type { Metadata } from 'next'

interface Props { params: { id: string } }

async function getItem(id: string): Promise<Item | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        category:categories(id, name, slug, icon),
        location:locations(id, name),
        reporter:profiles(id, full_name, role, department)
      `)
      .eq('id', id)
      .neq('status', 'removed')
      .single()
    if (!error && data) return data as Item
  } catch (err) {
    // fallback
  }
  return INITIAL_CAMPUS_ITEMS.find(i => i.id === id) || null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getItem(params.id)
  if (!item) return { title: 'Item Not Found' }
  return {
    title: `${item.title} — ${TYPE_LABELS[item.type]} Item`,
    description: item.description,
  }
}

export default async function ItemDetailPage({ params }: Props) {
  const item = await getItem(params.id)
  if (!item) notFound()

  const userProfile = await getServerUser()
  const userId = userProfile?.id || null
  const isOwner = userId === item.reported_by
  const isAdmin = userProfile?.role === 'admin'
  const canClaim = !!userId && !isOwner && item.type === 'found' && item.status === 'active'

  const images = item.images?.map((path: string) =>
    path.startsWith('http')
      ? path
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/item-images/${path}`
  ) || []

  return (
    <div className="container-page max-w-5xl py-8 space-y-6">
      {/* Back link */}
      <Link
        href={item.type === 'lost' ? '/lost-items' : '/found-items'}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-700 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to {item.type === 'lost' ? 'Lost' : 'Found'} Items
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── Left: Image & Details ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
            {images.length > 0 ? (
              <div className="relative h-80 sm:h-96 w-full bg-slate-100">
                <Image src={images[0]} alt={item.title} fill className="object-cover" priority />
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
                    <Image src={src} alt={`${item.title} ${i + 2}`} fill className="object-cover" />
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
                <Calendar className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>
                  <strong>Date:</strong> {formatDate(item.date_occurred)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span className="truncate">
                  <strong>Location:</strong> {item.location?.name || item.location_detail || 'Campus'}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <User className="w-4 h-4 text-emerald-700 flex-shrink-0" />
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

        {/* ── Right: Action Sidebar ── */}
        <div className="space-y-5">
          <ItemDetailClient
            item={item}
            userId={userId}
            userRole={userProfile?.role || null}
            isOwner={isOwner}
            isAdmin={isAdmin}
            canClaim={!!canClaim}
          />

          {/* Verification Protocol Box */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Campus Security Handover</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Found belongings deposited on CampusFind are verified at the college security desk or designated departmental office before release.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-3">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Bring valid student/faculty ID during claim retrieval.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Be ready to unlock device or describe specific marks.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
