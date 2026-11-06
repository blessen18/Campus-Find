'use client'

import { Plus, LayoutGrid, List, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ItemCard, ItemRow, ItemCardSkeleton } from '@/components/ItemCard'
import { ItemFiltersBar } from '@/components/ItemFilters'
import { useItems } from '@/hooks/useItems'

export default function FoundItemsPage() {
  const { items, loading, filters, totalCount, updateFilters, resetFilters } = useItems('found')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  return (
    <div className="space-y-8 pb-16">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200 py-8">
        <div className="container-page">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Recovered Belongings</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Found Items on Campus</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                {loading ? 'Checking records…' : `${totalCount} item${totalCount !== 1 ? 's' : ''} currently secured and waiting to be claimed`}
              </p>
            </div>
            <Link
              href="/report/found"
              className="btn bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm self-start sm:self-auto gap-2"
            >
              <Plus className="w-4 h-4" /> Report a Found Item
            </Link>
          </div>
        </div>
      </div>

      <div className="container-page space-y-6">
        {/* Privacy notice banner */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex items-start gap-3 shadow-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 leading-relaxed">
            <strong className="font-semibold text-emerald-950">Campus Privacy Protection:</strong> To prevent false claims,
            confidential identifying markers (serial numbers, laptop stickers, and wallet contents) are hidden from the public feed.
            When you see your item, click <strong>View Details</strong> and submit your ownership claim with verification proof.
          </div>
        </div>

        {/* Filters */}
        <ItemFiltersBar filters={filters} onChange={updateFilters} onReset={resetFilters} />

        {/* View mode toggle + count */}
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {loading ? 'Loading…' : `Showing ${items.length} ${items.length === 1 ? 'item' : 'items'}`}
          </p>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'list' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Items */}
        {loading ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
            : 'flex flex-col gap-3'}>
            {Array.from({ length: 8 }).map((_, i) => <ItemCardSkeleton key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-16 px-4 text-center max-w-md mx-auto shadow-sm">
            <div className="text-4xl mb-3">📦</div>
            <h3 className="font-bold text-slate-900 text-base mb-1">No found items match your criteria</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Items are registered as soon as turned into campus security or department desks. Check back regularly.
            </p>
            <button onClick={resetFilters} className="btn bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs px-4 py-2 rounded-lg font-medium">
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map(item => <ItemCard key={item.id} item={item} showType={false} />)}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map(item => <ItemRow key={item.id} item={item} />)}
          </div>
        )}
      </div>
    </div>
  )
}
