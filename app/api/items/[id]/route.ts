import { NextResponse } from 'next/server'
import { getServerItemById, updateServerItem, removeServerItem } from '@/lib/serverStorage'
import { getServerUser, createClient } from '@/lib/supabase/server'
import { isDeveloperEmail } from '@/lib/utils'

interface RouteParams {
  params: { id: string }
}

async function resolveCaller(request: Request) {
  // 1. Try server cookie
  const serverProfile = await getServerUser()
  if (serverProfile) return serverProfile

  // 2. Check headers / query fallback
  try {
    const authHeader = request.headers.get('x-user-auth')
    if (authHeader) {
      return JSON.parse(decodeURIComponent(authHeader))
    }
  } catch (e) {}

  return null
}

function canUserModifyItem(caller: any, item: any): boolean {
  if (!caller) return false

  const callerEmail = (caller.email || '').toLowerCase()
  const callerId = caller.id

  // 1. Superadmin / Developer check
  if (isDeveloperEmail(callerEmail) || caller.role === 'admin') {
    return true
  }

  // 2. Reporter check
  if (callerId && item.reported_by && callerId === item.reported_by) {
    return true
  }

  const reporterEmail = (item.reporter?.email || '').toLowerCase()
  if (callerEmail && reporterEmail && callerEmail === reporterEmail) {
    return true
  }

  return false
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const item = await getServerItemById(params.id)
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    return NextResponse.json({ data: item })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const item = await getServerItemById(params.id)
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const body = await request.json()
    const caller = await resolveCaller(request) || body.caller

    if (!canUserModifyItem(caller, item)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only the reporting user or an administrator can modify this report.' },
        { status: 403 }
      )
    }

    const { status, title, description, category_id, location_detail } = body
    const updates: any = {}
    if (status !== undefined) {
      updates.status = status
      if (status === 'resolved') updates.resolved_at = new Date().toISOString()
    }
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (category_id !== undefined) updates.category_id = category_id
    if (location_detail !== undefined) updates.location_detail = location_detail

    const updated = await updateServerItem(params.id, updates)

    // Sync with Supabase if reachable
    const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
    if (!isPlaceholder) {
      try {
        const supabase = await createClient()
        await supabase.from('items').update(updates).eq('id', params.id)
      } catch (err) {
        console.warn('Supabase update note:', err)
      }
    }

    return NextResponse.json({ data: updated })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const item = await getServerItemById(params.id)
    if (!item) {
      // Already removed or not in server store
      return NextResponse.json({ success: true, message: 'Item already removed' })
    }

    let bodyCaller = null
    try {
      const body = await request.json()
      bodyCaller = body?.caller
    } catch (e) {}

    const caller = await resolveCaller(request) || bodyCaller

    if (!canUserModifyItem(caller, item)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only the reporting user or an administrator can remove this report.' },
        { status: 403 }
      )
    }

    await removeServerItem(params.id)

    // Also update Supabase if real
    const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
    if (!isPlaceholder) {
      try {
        const supabase = await createClient()
        await supabase.from('items').update({ status: 'removed' }).eq('id', params.id)
      } catch (err) {
        console.warn('Supabase remove note:', err)
      }
    }

    return NextResponse.json({ success: true, message: 'Report removed successfully' })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
