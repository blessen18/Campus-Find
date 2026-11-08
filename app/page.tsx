import Link from 'next/link'
import { Search, ArrowRight, Package, CheckCircle2, Clock, ShieldCheck, MapPin, AlertCircle, ArrowUpRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ItemCard } from '@/components/ItemCard'
import { INITIAL_CAMPUS_ITEMS } from '@/data/initialItems'
import type { Item } from '@/types'

async function getHomeData() {
  try {
    const supabase = await createClient()
    const [lostRes, foundRes, totalResolvedRes] = await Promise.all([
      supabase.from('items').select(`*, category:categories(id,name,icon), location:locations(id,name)`)
        .eq('type', 'lost').eq('status', 'active').order('created_at', { ascending: false }).limit(4),
      supabase.from('items').select(`*, category:categories(id,name,icon), location:locations(id,name)`)
        .eq('type', 'found').eq('status', 'active').order('created_at', { ascending: false }).limit(4),
      supabase.from('items').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
    ])

    const recentLost = (lostRes.data || []) as Item[]
    const recentFound = (foundRes.data || []) as Item[]
    const totalLost = recentLost.length
    const totalFound = recentFound.length
    const totalResolved = totalResolvedRes.count || 0

    return { recentLost, recentFound, totalLost, totalFound, totalResolved }
  } catch {
    return {
      recentLost: [],
      recentFound: [],
      totalLost: 0,
      totalFound: 0,
      totalResolved: 0,
    }
  }
}

export default async function HomePage() {
  const { recentLost, recentFound, totalLost, totalFound, totalResolved } = await getHomeData()

  return (
    <div className="pb-16">

      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200 pt-14 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Amal Jyothi College of Engineering · Official Campus Portal
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Lost something on campus?
            </h1>
            <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              CampusFind connects students, faculty, and security to reunite lost belongings quickly and securely — right here at AJCE.
            </p>
          </div>

          {/* Search bar */}
          <div className="max-w-xl mx-auto pt-2">
            <form action="/lost-items" method="GET">
              <div className="flex items-center bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <Search className="w-5 h-5 text-slate-400 ml-4 flex-shrink-0" />
                <input
                  name="search"
                  type="text"
                  placeholder="Search for AirPods, ID card, calculator, bag…"
                  className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none px-3 py-3"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-3 transition-colors flex-shrink-0"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Quick chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-slate-500">
              <span className="text-slate-400 font-medium">Popular:</span>
              {[
                { label: 'AirPods', href: '/lost-items?search=airpods' },
                { label: 'Student ID', href: '/found-items?search=id' },
                { label: 'Calculator', href: '/lost-items?search=casio' },
                { label: 'Laptop Charger', href: '/lost-items?search=charger' },
                { label: 'Water Bottle', href: '/found-items?search=bottle' },
              ].map(chip => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto pt-4 text-left">
            <Link
              href="/report/lost"
              className="p-5 rounded-xl bg-red-50 border border-red-200 hover:border-red-400 hover:shadow-md transition-all group flex items-start gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
                😟
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 group-hover:text-red-700 transition-colors text-sm">
                    I Lost Something
                  </h3>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Post details so campus finders can notify you quickly.
                </p>
              </div>
            </Link>

            <Link
              href="/report/found"
              className="p-5 rounded-xl bg-green-50 border border-green-200 hover:border-green-400 hover:shadow-md transition-all group flex items-start gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-green-100 text-green-700 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
                🤝
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 group-hover:text-green-700 transition-colors text-sm">
                    I Found Something
                  </h3>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-green-500 transition-colors" />
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Help a classmate recover their item securely.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-b border-slate-200 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { icon: AlertCircle, label: 'Lost Reports', value: totalLost, color: 'text-red-600' },
              { icon: CheckCircle2, label: 'Found Reports', value: totalFound, color: 'text-green-600' },
              { icon: Package, label: 'Items Returned', value: totalResolved, color: 'text-blue-600' },
              { icon: Clock, label: 'Platform Active', value: '24/7', color: 'text-slate-600' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="space-y-1">
                <Icon className={`w-5 h-5 mx-auto ${color}`} />
                <div className="text-2xl font-bold text-slate-900">{value}</div>
                <div className="text-xs text-slate-500 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent Lost Items ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recently Lost</h2>
            <p className="text-sm text-slate-500 mt-0.5">Latest items reported as lost on campus</p>
          </div>
          <Link href="/lost-items" className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentLost.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentLost.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No lost items yet</p>
          </div>
        )}
      </section>

      {/* ── Recent Found Items ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recently Found</h2>
            <p className="text-sm text-slate-500 mt-0.5">Items found on campus waiting to be claimed</p>
          </div>
          <Link href="/found-items" className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentFound.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentFound.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No found items reported yet</p>
          </div>
        )}
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-t border-slate-200 mt-14 py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">How it works</h2>
          <p className="text-slate-500 text-sm mb-10">Three simple steps to reunite lost belongings</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                icon: '📋',
                title: 'Report',
                desc: 'Submit a detailed report with photos, description, and where you last saw the item.',
                color: 'bg-blue-50 border-blue-200',
                num: 'bg-blue-600',
              },
              {
                step: '2',
                icon: '🔍',
                title: 'Match',
                desc: 'Campus staff and community members search the database to identify and secure the item.',
                color: 'bg-amber-50 border-amber-200',
                num: 'bg-amber-500',
              },
              {
                step: '3',
                icon: '🤝',
                title: 'Reunite',
                desc: 'Owner verifies identity and collects their item from the campus security office.',
                color: 'bg-green-50 border-green-200',
                num: 'bg-green-600',
              },
            ].map(s => (
              <div key={s.step} className={`rounded-xl border p-6 text-left ${s.color}`}>
                <div className={`w-8 h-8 rounded-full ${s.num} text-white text-sm font-bold flex items-center justify-center mb-4`}>
                  {s.step}
                </div>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-bold text-slate-900 mb-1">{s.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/report/lost" className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors shadow-sm">
              Report a Lost Item
            </Link>
            <Link href="/how-it-works" className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3 rounded-xl text-sm border border-slate-200 transition-colors">
              Learn more <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust Strip ──────────────────────────────────────────────── */}
      <section className="bg-white border-t border-slate-100 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-xs text-slate-500">
            {[
              { icon: ShieldCheck, text: 'Verified campus platform' },
              { icon: MapPin, text: 'AJCE Kanjirappally, Kerala' },
              { icon: Clock, text: 'Available 24/7 online' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-slate-400" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
