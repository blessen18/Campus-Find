import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Package, CheckCircle2, Clock, ArrowRight, ShieldCheck } from 'lucide-react'
import { createClient, getServerUser } from '@/lib/supabase/server'
import { formatDate, formatRelativeTime, STATUS_COLORS, STATUS_LABELS, TYPE_LABELS, TYPE_COLORS } from '@/lib/utils'
import type { Item, Claim } from '@/types'

export default async function DashboardPage() {
  const profile = await getServerUser()
  if (!profile) redirect('/auth/login?redirect=/dashboard')

  let myItems: Item[] = []
  let myClaims: Claim[] = []

  try {
    const supabase = await createClient()
    const [itemsRes, claimsRes] = await Promise.all([
      supabase.from('items')
        .select(`*, category:categories(id,name,icon), location:locations(id,name)`)
        .eq('reported_by', profile.id)
        .order('created_at', { ascending: false }),
      supabase.from('claims')
        .select(`*, item:items(id,title,type,status,category:categories(id,name,icon))`)
        .eq('claimant_id', profile.id)
        .order('created_at', { ascending: false }),
    ])
    if (itemsRes.data) myItems = itemsRes.data as Item[]
    if (claimsRes.data) myClaims = claimsRes.data as Claim[]
  } catch (e) {
    // ignore
  }

  const stats = {
    total:    myItems.length,
    active:   myItems.filter(i => i.status === 'active').length,
    resolved: myItems.filter(i => i.status === 'resolved').length,
    claims:   myClaims.length,
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 py-8">
        <div className="container-page">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
                <span>Student / Staff Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Reports & Claims</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Welcome back, <strong className="text-slate-800">{profile?.full_name || profile?.email}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/report/lost" className="btn bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs px-3.5 py-2 rounded-lg font-medium">
                <Plus className="w-3.5 h-3.5" /> Report Lost
              </Link>
              <Link href="/report/found" className="btn bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-3.5 py-2 rounded-lg font-medium shadow-xs">
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
            { label: 'My Reports',   value: stats.total,    icon: Package,      color: 'text-slate-700 bg-slate-100' },
            { label: 'Active',       value: stats.active,   icon: Clock,        color: 'text-amber-700 bg-amber-50' },
            { label: 'Resolved',     value: stats.resolved, icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50' },
            { label: 'Active Claims',value: stats.claims,   icon: ShieldCheck,  color: 'text-sky-700 bg-sky-50' },
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
          <h2 className="text-lg font-bold text-slate-900">Items I've Reported</h2>
          {myItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 py-12 text-center p-6 shadow-xs">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">You haven't submitted any reports yet.</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Misplaced something or found someone's property?</p>
              <div className="flex justify-center gap-2">
                <Link href="/report/lost" className="btn bg-rose-50 text-rose-700 border border-rose-200 text-xs px-3.5 py-1.5 rounded-lg">
                  Report Lost
                </Link>
                <Link href="/report/found" className="btn bg-emerald-700 text-white text-xs px-3.5 py-1.5 rounded-lg shadow-xs">
                  Report Found
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Item</th>
                    <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Type</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Reported</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{item.category?.icon || '📦'}</span>
                          <span className="font-semibold text-slate-900 truncate max-w-[200px]">{item.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`badge text-xs ${TYPE_COLORS[item.type]}`}>{TYPE_LABELS[item.type]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${STATUS_COLORS[item.status]}`}>{STATUS_LABELS[item.status]}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                        {formatRelativeTime(item.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/items/${item.id}`} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* My Claims */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">My Ownership Claims</h2>
          {myClaims.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 py-10 text-center p-6 shadow-xs">
              <p className="text-xs text-slate-500">You haven't submitted any ownership claims yet.</p>
              <Link href="/found-items" className="text-xs text-emerald-700 font-semibold hover:underline mt-2 inline-block">
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
                  {myClaims.map(claim => (
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
                        <Link href={`/items/${(claim.item as Item)?.id}`} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline">
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
