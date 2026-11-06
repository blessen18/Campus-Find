import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, User, Calendar, MapPin, ShieldAlert, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatRelativeTime, TYPE_LABELS, TYPE_COLORS, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils'
import { ClaimReviewClient } from './ClaimReviewClient'
import type { Claim, Item, Profile } from '@/types'

interface Props {
  params: { id: string }
}

export default async function AdminClaimDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: claimData, error } = await supabase
    .from('claims')
    .select(`
      *,
      item:items(*, category:categories(id, name, icon), location:locations(id, name), reporter:profiles(*)),
      claimant:profiles(*)
    `)
    .eq('id', params.id)
    .single()

  if (error || !claimData) notFound()

  const claim = claimData as unknown as Claim & { item: Item; claimant: Profile }
  const item = claim.item

  const itemImages = item.images?.map(path =>
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/item-images/${path}`
  ) || []

  return (
    <div>
      <div className="page-header">
        <div className="container-page max-w-5xl">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-primary-200 hover:text-white mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Review Ownership Claim</h1>
          <p className="text-primary-200 text-sm mt-1">Claim ID: {claim.id}</p>
        </div>
      </div>

      <div className="container-page max-w-5xl py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Item Information */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className={`badge text-xs font-semibold ${TYPE_COLORS[item.type]}`}>
                {TYPE_LABELS[item.type]} Item
              </span>
              <span className={`badge text-xs ${STATUS_COLORS[item.status]}`}>
                {STATUS_LABELS[item.status]}
              </span>
            </div>

            <h2 className="text-xl font-bold text-content">{item.title}</h2>
            <p className="text-sm text-content-muted leading-relaxed">{item.description}</p>

            <div className="space-y-2 text-xs text-content-muted border-t border-border pt-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-700" />
                <span>Date: {formatDate(item.date_occurred)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-700" />
                <span>Location: {item.location?.name || item.location_detail || 'Campus'}</span>
              </div>
            </div>

            {/* Private Details (Admin Exclusive View) */}
            {item.private_details && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-800">
                  <ShieldAlert className="w-4 h-4" /> Confidential Details (From Reporter)
                </div>
                <p className="text-xs text-red-900 font-mono whitespace-pre-wrap">{item.private_details}</p>
              </div>
            )}

            {itemImages.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-content">Reported Photos:</p>
                <div className="grid grid-cols-2 gap-2">
                  {itemImages.map((src, i) => (
                    <div key={i} className="relative aspect-video rounded overflow-hidden border border-border">
                      <Image src={src} alt={`Item ${i + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Claimant & Submitted Proof */}
          <div className="space-y-6">
            <div className="card p-6 space-y-4">
              <h3 className="text-base font-semibold text-content flex items-center gap-2">
                <User className="w-4 h-4 text-primary-700" /> Claimant Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-content-muted">Full Name</p>
                  <p className="font-medium text-content">{claim.claimant?.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-content-muted">Email</p>
                  <p className="font-medium text-content">{claim.claimant?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-content-muted">Role</p>
                  <p className="font-medium text-content capitalize">{claim.claimant?.role}</p>
                </div>
                <div>
                  <p className="text-xs text-content-muted">Department</p>
                  <p className="font-medium text-content">{claim.claimant?.department || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="card p-6 space-y-3">
              <h3 className="text-base font-semibold text-content flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-700" /> Claimant's Proof of Ownership
              </h3>
              <div className="bg-surface-subtle p-4 rounded-lg border border-border">
                <p className="text-sm text-content leading-relaxed whitespace-pre-wrap font-sans">
                  {claim.proof_description}
                </p>
              </div>
              <p className="text-xs text-content-subtle">
                Submitted {formatRelativeTime(claim.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <ClaimReviewClient claim={claim} />
      </div>
    </div>
  )
}

