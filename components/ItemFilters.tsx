'use client'

import { useState } from 'react'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import { cn, CATEGORIES, CAMPUS_LOCATIONS } from '@/lib/utils'
import type { ItemFilters } from '@/types'

interface ItemFiltersProps {
  filters: ItemFilters
  onChange: (filters: Partial<ItemFilters>) => void
  onReset: () => void
}

export function ItemFiltersBar({ filters, onChange, onReset }: ItemFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const hasActiveFilters = Boolean(filters.category || filters.location || filters.dateFrom || filters.dateTo)

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
      {/* Search + Sort row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by keyword (e.g. AirPods, Casio, blue, hostel)…"
            value={filters.search}
            onChange={e => onChange({ search: e.target.value })}
            className="input pl-10 h-10 text-sm"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filters.sortBy}
            onChange={e => onChange({ sortBy: e.target.value as 'newest' | 'oldest' })}
            className="input w-auto h-10 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-50 border-slate-200"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          <button
            onClick={() => setShowAdvanced(o => !o)}
            className={cn(
              'btn h-10 px-3.5 text-xs sm:text-sm font-medium border rounded-lg gap-2 transition-colors',
              showAdvanced
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
            )}
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', showAdvanced && 'rotate-180')} />
          </button>
        </div>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in-50 duration-150">
          <div>
            <label className="label">Category</label>
            <select
              value={filters.category}
              onChange={e => onChange({ category: e.target.value })}
              className="input text-xs"
            >
              <option value="">All categories</option>
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Campus Location</label>
            <select
              value={filters.location}
              onChange={e => onChange({ location: e.target.value })}
              className="input text-xs"
            >
              <option value="">All locations</option>
              {CAMPUS_LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={e => onChange({ dateFrom: e.target.value })}
              className="input text-xs"
            />
          </div>

          <div>
            <label className="label">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={e => onChange({ dateTo: e.target.value })}
              className="input text-xs"
            />
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active:</span>
          {filters.category && (
            <Chip
              label={CATEGORIES.find(c => c.id === filters.category)?.name || filters.category}
              onRemove={() => onChange({ category: '' })}
            />
          )}
          {filters.location && (
            <Chip
              label={filters.location}
              onRemove={() => onChange({ location: '' })}
            />
          )}
          {filters.dateFrom && (
            <Chip
              label={`From ${filters.dateFrom}`}
              onRemove={() => onChange({ dateFrom: '' })}
            />
          )}
          {filters.dateTo && (
            <Chip
              label={`To ${filters.dateTo}`}
              onRemove={() => onChange({ dateTo: '' })}
            />
          )}
          <button
            onClick={onReset}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium ml-auto hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-full px-2.5 py-0.5 border border-emerald-200">
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-emerald-600 hover:text-emerald-900 focus:outline-none"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}
