import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

interface RouteParams {
  params: { id: string }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { status, admin_notes } = await request.json()

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const adminClient = await createAdminClient()

    // Fetch existing claim
    const { data: claim, error: claimFetchErr } = await adminClient
      .from('claims')
      .select('*, item:items(*)')
      .eq('id', params.id)
      .single()

    if (claimFetchErr || !claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    // Update the claim
    const { error: updateErr } = await adminClient
      .from('claims')
      .update({
        status,
        admin_notes: admin_notes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    if (status === 'approved') {
      // Mark the item as claimed / resolved
      await adminClient
        .from('items')
        .update({
          status: 'claimed',
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', claim.item_id)

      // Notify claimant
      await adminClient.from('notifications').insert({
        user_id: claim.claimant_id,
        type: 'claim_approved',
        title: 'Claim Approved',
        message: `Your claim for "${claim.item?.title}" was approved by the campus admin. You may now retrieve your item. ${admin_notes ? `Notes: ${admin_notes}` : ''}`,
        link: `/items/${claim.item_id}`,
      })

      // Notify item reporter
      if (claim.item?.reported_by) {
        await adminClient.from('notifications').insert({
          user_id: claim.item.reported_by,
          type: 'item_resolved',
          title: 'Item Claimed & Verified',
          message: `The item "${claim.item?.title}" you reported has been verified and returned to its owner.`,
          link: `/items/${claim.item_id}`,
        })
      }
    } else if (status === 'rejected') {
      // Notify claimant of rejection
      await adminClient.from('notifications').insert({
        user_id: claim.claimant_id,
        type: 'claim_rejected',
        title: 'Claim Update: Not Approved',
        message: `Your claim for "${claim.item?.title}" could not be verified. ${admin_notes ? `Reason: ${admin_notes}` : 'Please contact campus security for clarification.'}`,
        link: `/items/${claim.item_id}`,
      })
    }

    return NextResponse.json({ success: true, status }, { status: 200 })
  } catch (err: unknown) {
    console.error('PATCH /api/admin/claims/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

