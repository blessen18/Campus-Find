import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, getServerUser } from '@/lib/supabase/server'
import { formatDate, formatRelativeTime, STATUS_COLORS, STATUS_LABELS, TYPE_LABELS, TYPE_COLORS } from '@/lib/utils'
import { INITIAL_CAMPUS_ITEMS } from '@/data/initialItems'
import type { Item, Claim, Profile } from '@/types'

export default async function AdminPage() {
  const profile = await getServerUser()
  if (!profile) redirect('/auth/login?redirect=/admin')
  if (profile.role !== 'admin') redirect('/')

  let dbItems: Item[] = []
  let claims: Claim[] = []
  let users: Profile[] = []

  try {
    const supabase = await createClient()
    const [itemsRes, claimsRes, usersRes] = await Promise.all([
      supabase.from('items')
        .select(`*, category:categories(id,name,icon), reporter:profiles(id,full_name,email)`)
        .neq('status', 'removed')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('claims')
        .select(`*, item:items(id,title,type), claimant:profiles(id,full_name,email)`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50),
    ])
    if (itemsRes.data) dbItems = itemsRes.data as Item[]
    if (claimsRes.data) claims = claimsRes.data as Claim[]
    if (usersRes.data) users = usersRes.data as Profile[]
  } catch (e) {
    // offline/fallback mode
  }

  const items = dbItems.length > 0 ? dbItems : INITIAL_CAMPUS_ITEMS

  const stats = {
    totalItems:    items.length,
    activeLost:    items.filter(i => i.type === 'lost'  && i.status === 'active').length,
    activeFound:   items.filter(i => i.type === 'found' && i.status === 'active').length,
    resolved:      items.filter(i => i.status === 'resolved').length,
    pendingClaims: claims.length,
    totalUsers:    users.length,
  }

  return (
    <div className="space-y-8 pb-16">
      <div className="bg-white border-b border-slate-200 py-8">
        <div className="container-page">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
            <span>Administrative Command</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">CampusFind Admin Console</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Manage reported items, verify proof claims, and audit security handovers.</p>
        </div>
      </div>

      <div className="container-page space-y-8">
        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[
            { label: 'Total Items',    value: stats.totalItems,    color: 'bg-white border-slate-200 text-slate-900' },
            { label: 'Active Lost',    value: stats.activeLost,    color: 'bg-rose-50/60 border-rose-200 text-rose-700' },
            { label: 'Active Found',   value: stats.activeFound,   color: 'bg-emerald-50/60 border-emerald-200 text-emerald-800' },
            { label: 'Reunited',       value: stats.resolved,      color: 'bg-slate-100/60 border-slate-200 text-slate-700' },
            { label: 'Pending Claims', value: stats.pendingClaims, color: 'bg-amber-50/60 border-amber-200 text-amber-700' },
            { label: 'Registered',     value: stats.totalUsers,    color: 'bg-blue-50/60 border-blue-200 text-blue-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`p-4 rounded-xl border text-center shadow-xs ${color}`}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
            </div>
          ))}
        </div>

        {/* Pending Claims */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Pending Claims Queue <span className="text-sm font-normal text-slate-400">({claims.length})</span>
            </h2>
          </div>

          {claims.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 py-10 text-center p-6 shadow-xs">
              <p className="text-sm text-slate-600 font-medium">All claim requests are up to date! 🎉</p>
              <p className="text-xs text-slate-400 mt-1">New claims will appear here for verification and approval.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Item</th>
                    <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Claimant</th>
                    <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Submitted</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {claims.map(claim => (
                    <tr key={claim.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-900">{(claim.item as Item)?.title}</p>
                          <span className={`badge text-[11px] mt-0.5 ${TYPE_COLORS[(claim.item as Item)?.type]}`}>
                            {TYPE_LABELS[(claim.item as Item)?.type]}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                        {(claim.claimant as Profile)?.full_name}
                        <br />
                        <span className="text-xs text-slate-400">{(claim.claimant as Profile)?.email}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                        {formatRelativeTime(claim.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/claims/${claim.id}`} className="btn bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-3 py-1.5 rounded-lg font-medium shadow-xs">
                          Review Proof →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* All Items */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Campus Registered Items</h2>
            <div className="flex gap-2">
              <Link href="/lost-items"  className="btn bg-white text-slate-700 border border-slate-200 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-50">View Lost</Link>
              <Link href="/found-items" className="btn bg-white text-slate-700 border border-slate-200 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-50">View Found</Link>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Item</th>
                  <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Reporter</th>
                  <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{item.category?.icon || '📦'}</span>
                        <span className="font-semibold text-slate-900 truncate max-w-[180px]">{item.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`badge text-xs ${TYPE_COLORS[item.type]}`}>{TYPE_LABELS[item.type]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${STATUS_COLORS[item.status]}`}>{STATUS_LABELS[item.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                      {(item.reporter as Profile)?.full_name || 'Campus Member'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">
                      {formatDate(item.date_occurred)}
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
        </section>
      </div>
    </div>
  )
}
