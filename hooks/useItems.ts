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

      let fetchedItems: Item[] = []
      if (!error && data && data.length > 0) {
        fetchedItems = data as Item[]
      }

      // Fetch shared items from server API (items from all users/devices)
      try {
        const apiRes = await fetch('/api/items')
        if (apiRes.ok) {
          const apiJson = await apiRes.json()
          if (apiJson.items && Array.isArray(apiJson.items)) {
            for (const item of apiJson.items) {
              if (!fetchedItems.some(f => f.id === item.id)) {
                fetchedItems.push(item)
              }
            }
          }
        }
      } catch (apiErr) {
        // API offline or static fallback
      }

      // Merge locally reported items (from localStorage)
      if (typeof window !== 'undefined') {
        try {
          const rawCustom = localStorage.getItem('campusfind_custom_items')
          if (rawCustom) {
            const customItems = JSON.parse(rawCustom) as Item[]
            if (Array.isArray(customItems)) {
              for (const ci of customItems) {
                if (!fetchedItems.some(fi => fi.id === ci.id)) {
                  fetchedItems.unshift(ci)
                }
              }
            }
          }

          // Filter out any items removed by admin/developer
          const removedIds = JSON.parse(localStorage.getItem('campusfind_removed_item_ids') || '[]') as string[]
          if (removedIds.length > 0) {
            fetchedItems = fetchedItems.filter(i => !removedIds.includes(i.id))
          }
        } catch (e) {}
      }

      // Apply client-side filters
      let result = [...fetchedItems]
      if (type) result = result.filter(i => i.type === type)
      if (filters.status) result = result.filter(i => i.status === filters.status)
      if (filters.category) result = result.filter(i => i.category_id === filters.category)
      if (filters.search) {
        const s = filters.search.toLowerCase()
        result = result.filter(i =>
          i.title.toLowerCase().includes(s) ||
          i.description.toLowerCase().includes(s) ||
          (i.location_detail && i.location_detail.toLowerCase().includes(s))
        )
      }

      setItems(result)
      setTotalCount(result.length)
    } catch (err) {
      console.warn('Items query note:', err)
      setItems([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [type, filters])

  useEffect(() => { 
    fetchItems() 

    const onItemsChange = () => fetchItems()
    window.addEventListener('campusfind_items_change', onItemsChange)
    return () => window.removeEventListener('campusfind_items_change', onItemsChange)
  }, [fetchItems])

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
