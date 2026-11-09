import Link from 'next/link'
import { Search, ArrowUpRight, ArrowRight, ShieldCheck, MapPin, Clock, FileText, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { HomeRecentFeeds } from '@/components/HomeRecentFeeds'
import { isPlaceholderSupabase } from '@/lib/utils'
import type { Item } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getHomeData() {
  if (isPlaceholderSupabase()) {
    return {
      recentLost: [],
      recentFound: [],
      totalLost: 0,
      totalFound: 0,
      totalResolved: 0,
    }
  }

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4 text-left">
            <Link
              href="/report/lost"
              className="group relative overflow-hidden rounded-2xl bg-white p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-rose-300 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-rose-600 opacity-80 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-rose-100/80 transition-all shadow-xs">
                    <Search className="w-5 h-5 text-rose-600" strokeWidth={2.2} />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                    Lost Report
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-rose-700 transition-colors text-base tracking-tight mb-1">
                  I Lost Something
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Submit details, photos, and location so finders across campus can identify and return your item.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-rose-600 group-hover:text-rose-700">
                <span>Start Lost Report</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/report/found"
              className="group relative overflow-hidden rounded-2xl bg-white p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 opacity-80 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-emerald-100/80 transition-all shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" strokeWidth={2.2} />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Found Report
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-base tracking-tight mb-1">
                  I Found Something
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Log an item you discovered on campus so the verified owner can claim and safely collect it.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
                <span>Start Found Report</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Dynamic Stats Bar & Recent Feeds ────────────────────────── */}
      <HomeRecentFeeds
        initialLost={recentLost}
        initialFound={recentFound}
        initialTotalLost={totalLost}
        initialTotalFound={totalFound}
        initialTotalResolved={totalResolved}
      />

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-t border-slate-200 mt-14 py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">How it works</h2>
          <p className="text-slate-500 text-sm mb-10">Three simple steps to reunite lost belongings</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                Icon: FileText,
                title: 'Report',
                desc: 'Submit a detailed report with photos, description, and where you last saw the item.',
                color: 'bg-blue-50 border-blue-200',
                num: 'bg-blue-600',
              },
              {
                step: '2',
                Icon: Search,
                title: 'Match',
                desc: 'Campus staff and community members search the database to identify and secure the item.',
                color: 'bg-amber-50 border-amber-200',
                num: 'bg-amber-500',
              },
              {
                step: '3',
                Icon: ShieldCheck,
                title: 'Reunite',
                desc: 'Owner verifies identity and collects their item from the campus security office.',
                color: 'bg-green-50 border-green-200',
                num: 'bg-green-600',
              },
            ].map(({ step, Icon, title, desc, color, num }) => (
              <div key={step} className={`rounded-xl border p-6 text-left ${color}`}>
                <div className={`w-8 h-8 rounded-full ${num} text-white text-sm font-bold flex items-center justify-center mb-4`}>
                  {step}
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/80 border border-slate-200/60 flex items-center justify-center text-slate-800 mb-3 shadow-2xs">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
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
