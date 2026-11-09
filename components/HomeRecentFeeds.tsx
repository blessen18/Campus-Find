'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, Package, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { ItemCard } from '@/components/ItemCard'
import type { Item } from '@/types'

const LOCAL_ITEMS_STORAGE_KEY = 'campusfind_custom_items'
const REMOVED_ITEMS_STORAGE_KEY = 'campusfind_removed_item_ids'

interface Props {
  initialLost: Item[]
  initialFound: Item[]
  initialTotalLost: number
  initialTotalFound: number
  initialTotalResolved: number
}

export function HomeRecentFeeds({
  initialLost,
  initialFound,
  initialTotalLost,
  initialTotalFound,
  initialTotalResolved,
}: Props) {
  const [lostItems, setLostItems] = useState<Item[]>(initialLost)
  const [foundItems, setFoundItems] = useState<Item[]>(initialFound)
  const [totalLost, setTotalLost] = useState<number>(initialTotalLost)
  const [totalFound, setTotalFound] = useState<number>(initialTotalFound)
  const [totalResolved, setTotalResolved] = useState<number>(initialTotalResolved)

  const syncFeeds = useCallback(async () => {
    try {
      // 1. Fetch from server API
      let serverItems: Item[] = []
      try {
        const res = await fetch('/api/items')
        if (res.ok) {
          const data = await res.json()
          if (data.items && Array.isArray(data.items)) {
            serverItems = data.items
          }
        }
      } catch (e) {}

      // 2. Load from localStorage
      let localCustom: Item[] = []
      let removedIds: string[] = []
      if (typeof window !== 'undefined') {
        try {
          const rawCustom = localStorage.getItem(LOCAL_ITEMS_STORAGE_KEY)
          if (rawCustom) {
            const parsed = JSON.parse(rawCustom)
            if (Array.isArray(parsed)) localCustom = parsed
          }
          removedIds = JSON.parse(localStorage.getItem(REMOVED_ITEMS_STORAGE_KEY) || '[]')
        } catch (e) {}
      }

      // 3. Merge all items
      const merged: Item[] = [...initialLost, ...initialFound]
      for (const item of [...serverItems, ...localCustom]) {
        const existingIdx = merged.findIndex(m => m.id === item.id)
        if (existingIdx >= 0) {
          merged[existingIdx] = { ...merged[existingIdx], ...item }
        } else {
          merged.unshift(item)
        }
      }

      // Filter active non-removed items
      const activeLost = merged.filter(i => i.type === 'lost' && i.status === 'active' && !removedIds.includes(i.id))
      const activeFound = merged.filter(i => i.type === 'found' && i.status === 'active' && !removedIds.includes(i.id))
      const resolvedCount = merged.filter(i => i.status === 'resolved' && !removedIds.includes(i.id)).length

      setLostItems(activeLost.slice(0, 4))
      setFoundItems(activeFound.slice(0, 4))
      setTotalLost(activeLost.length)
      setTotalFound(activeFound.length)
      setTotalResolved(resolvedCount)
    } catch (e) {
      console.warn('Home feed sync issue:', e)
    }
  }, [initialFound, initialLost])

  useEffect(() => {
    syncFeeds()

    const onItemsChange = () => syncFeeds()
    window.addEventListener('campusfind_items_change', onItemsChange)
    return () => window.removeEventListener('campusfind_items_change', onItemsChange)
  }, [syncFeeds])

  return (
    <>
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

        {lostItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {lostItems.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-slate-600">No lost items reported yet</p>
            <p className="text-xs text-slate-400 mt-1">Real-time reports submitted by students will appear here.</p>
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

        {foundItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {foundItems.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-slate-600">No found items reported yet</p>
            <p className="text-xs text-slate-400 mt-1">Real-time reports submitted by students will appear here.</p>
          </div>
        )}
      </section>
    </>
  )
}

