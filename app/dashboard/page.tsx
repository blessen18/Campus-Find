import { redirect } from 'next/navigation'
import { createClient, getServerUser } from '@/lib/supabase/server'
import { isPlaceholderSupabase } from '@/lib/utils'
import { DashboardClient } from './DashboardClient'
import type { Item, Claim } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  const profile = await getServerUser()
  if (!profile) redirect('/auth/login?redirect=/dashboard')

  let myItems: Item[] = []
  let myClaims: Claim[] = []

  if (!isPlaceholderSupabase()) {
    try {
      const supabase = await createClient()
      const [itemsRes, claimsRes] = await Promise.all([
        supabase.from('items')
          .select(`*, category:categories(id,name,icon), location:locations(id,name)`)
          .eq('reported_by', profile.id)
          .order('created_at', { ascending: false }),
        supabase.from('claims')
          .select(`*, item:items(id,title,type,status,category:categories(id,name,icon))`)
          .eq('claimant_id', profile.id)
          .order('created_at', { ascending: false }),
      ])
      if (itemsRes.data) myItems = itemsRes.data as Item[]
      if (claimsRes.data) myClaims = claimsRes.data as Claim[]
    } catch (e) {
      // Supabase offline / placeholder fallback
    }
  }

  return (
    <DashboardClient
      initialItems={myItems}
      initialClaims={myClaims}
      currentUser={profile}
    />
  )
}
