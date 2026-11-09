import { NextResponse } from 'next/server'
import { getAllServerItems, addServerItem } from '@/lib/serverStorage'
import { createClient } from '@/lib/supabase/server'
import type { Item } from '@/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const reportedBy = searchParams.get('reported_by')
    const reporterEmail = searchParams.get('reporter_email')
    const search = searchParams.get('search')

    let allItems = await getAllServerItems()

    // If Supabase is real and reachable, try to fetch and merge
    const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
    if (!isPlaceholder) {
      try {
        const supabase = await createClient()
        const { data } = await supabase
          .from('items')
          .select(`*, category:categories(id,name,icon), location:locations(id,name), reporter:profiles(id,full_name,email)`)
          .neq('status', 'removed')
          .order('created_at', { ascending: false })

        if (data && data.length > 0) {
          const remoteItems = data as Item[]
          for (const ri of remoteItems) {
            if (!allItems.some(i => i.id === ri.id)) {
              allItems.push(ri)
            }
          }
        }
      } catch (err) {
        console.warn('Supabase fetch items note:', err)
      }
    }

    // Apply filtering
    if (type) {
      allItems = allItems.filter(i => i.type === type)
    }
    if (status) {
      allItems = allItems.filter(i => i.status === status)
    }
    if (reportedBy) {
      allItems = allItems.filter(i => i.reported_by === reportedBy)
    }
    if (reporterEmail) {
      const emailLower = reporterEmail.toLowerCase()
      allItems = allItems.filter(i => i.reporter?.email?.toLowerCase() === emailLower)
    }
    if (search) {
      const s = search.toLowerCase()
      allItems = allItems.filter(i =>
        i.title.toLowerCase().includes(s) ||
        i.description.toLowerCase().includes(s) ||
        (i.location_detail && i.location_detail.toLowerCase().includes(s))
      )
    }

    return NextResponse.json({ items: allItems, count: allItems.length })
  } catch (err) {
    console.error('GET /api/items error:', err)
    return NextResponse.json({ error: 'Failed to retrieve items' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const item = body as Item

    if (!item.title || !item.type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 })
    }

    // Ensure item has proper fields
    const newItem: Item = {
      ...item,
      id: item.id || `item-${Date.now()}`,
      status: item.status || 'active',
      created_at: item.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Save to server store
    await addServerItem(newItem)

    // Also insert to Supabase if real database is configured
    const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
    if (!isPlaceholder) {
      try {
        const supabase = await createClient()
        await supabase.from('items').insert({
          id: newItem.id,
          type: newItem.type,
          title: newItem.title,
          description: newItem.description,
          category_id: newItem.category_id,
          location_id: newItem.location_id,
          location_detail: newItem.location_detail,
          date_occurred: newItem.date_occurred,
          status: newItem.status,
          images: newItem.images,
          contact_preference: newItem.contact_preference,
          private_details: newItem.private_details,
          reported_by: newItem.reported_by,
        })
      } catch (err) {
        console.warn('Supabase insert note:', err)
      }
    }

    return NextResponse.json({ data: newItem }, { status: 201 })
  } catch (err) {
    console.error('POST /api/items error:', err)
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}
