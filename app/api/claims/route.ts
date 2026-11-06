import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { item_id, proof_description, proof_images } = body

    if (!item_id || !proof_description?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (proof_description.trim().length < 30) {
      return NextResponse.json({ error: 'Proof description must be at least 30 characters' }, { status: 400 })
    }

    // Verify the item exists and is claimable
    const { data: item, error: itemErr } = await supabase
      .from('items')
      .select('id, type, status, reported_by')
      .eq('id', item_id)
      .single()

    if (itemErr || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    if (item.status !== 'active') {
      return NextResponse.json({ error: 'This item is no longer available for claiming' }, { status: 400 })
    }

    if (item.reported_by === user.id) {
      return NextResponse.json({ error: 'You cannot claim your own item' }, { status: 400 })
    }

    // Check for duplicate claim
    const { data: existing } = await supabase
      .from('claims')
      .select('id')
      .eq('item_id', item_id)
      .eq('claimant_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'You have already submitted a claim for this item' }, { status: 400 })
    }

    // Create the claim
    const { data: claim, error: claimErr } = await supabase
      .from('claims')
      .insert({
        item_id,
        claimant_id: user.id,
        proof_description: proof_description.trim(),
        proof_images: proof_images || [],
        status: 'pending',
      })
      .select('id')
      .single()

    if (claimErr) {
      return NextResponse.json({ error: claimErr.message }, { status: 500 })
    }

    // Notify item owner and admins using admin client
    const adminClient = await createAdminClient()

    // Notify the item reporter
    await adminClient.from('notifications').insert({
      user_id: item.reported_by,
      type: 'claim_submitted',
      title: 'New Claim Submitted',
      message: 'Someone has submitted a claim for your reported item. An admin will review it shortly.',
      link: `/items/${item_id}`,
    })

    // Update item status to claimed (when approved, not pending — keep active for now)
    // Status stays 'active' until admin approves a claim

    return NextResponse.json({ data: { id: claim.id }, error: null }, { status: 201 })

  } catch (err: unknown) {
    console.error('POST /api/claims error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

