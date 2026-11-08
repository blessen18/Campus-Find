'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { INITIAL_CAMPUS_ITEMS } from '@/data/initialItems'
import type { Item, ItemFilters } from '@/types'

const DEFAULT_FILTERS: ItemFilters = {
  search: '',
  category: '',
  location: '',
  status: 'active',
  dateFrom: '',
  dateTo: '',
  sortBy: 'newest',
}

export function useItems(type?: 'lost' | 'found') {
  const [items, setItems]           = useState<Item[]>([])
  const [loading, setLoading]       = useState(true)
  const [filters, setFilters]       = useState<ItemFilters>(DEFAULT_FILTERS)
  const [totalCount, setTotalCount] = useState(0)
  const supabase = createClient()

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('items')
        .select(`
          *,
          category:categories(id, name, slug, icon),
          location:locations(id, name),
          reporter:profiles(id, full_name)
        `, { count: 'exact' })
        .neq('status', 'removed')

      if (type) query = query.eq('type', type)
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.category) query = query.eq('category_id', filters.category)
      if (filters.search) query = query.ilike('title', `%${filters.search}%`)
      if (filters.dateFrom) query = query.gte('date_occurred', filters.dateFrom)
      if (filters.dateTo)   query = query.lte('date_occurred', filters.dateTo)

      query = filters.sortBy === 'newest'
        ? query.order('created_at', { ascending: false })
        : query.order('created_at', { ascending: true })

      const { data, count, error } = await query

      if (error) {
        setItems([])
        setTotalCount(0)
      } else {
        setItems((data || []) as Item[])
        setTotalCount(count || (data ? data.length : 0))
      }
    } catch (err) {
      console.warn('Items query note:', err)
      setItems([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [type, filters])

  useEffect(() => { fetchItems() }, [fetchItems])

  // ── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      const channel = supabase
        .channel(`items-realtime-${type || 'all'}`)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'items',
          ...(type ? { filter: `type=eq.${type}` } : {}),
        }, () => {
          fetchItems()
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    } catch (e) {
      // Ignore websocket errors if offline
    }
  }, [type, fetchItems])

  const updateFilters = (partial: Partial<ItemFilters>) => {
    setFilters(f => ({ ...f, ...partial }))
  }

  const resetFilters = () => setFilters({ ...DEFAULT_FILTERS })

  return { items, loading, filters, totalCount, updateFilters, resetFilters, refetch: fetchItems }
}
