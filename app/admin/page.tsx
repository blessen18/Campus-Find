import { redirect } from 'next/navigation'
import { createClient, getServerUser } from '@/lib/supabase/server'
import { INITIAL_CAMPUS_ITEMS } from '@/data/initialItems'
import { AdminDashboardClient } from './AdminDashboardClient'
import type { Item, Claim, Profile } from '@/types'

export default async function AdminPage() {
  const profile = await getServerUser()
  if (!profile) redirect('/auth/login?redirect=/admin')
  if (profile.role !== 'admin') redirect('/')

  let dbItems: Item[] = []
  let claims: Claim[] = []
  let users: Profile[] = []

  try {
    const supabase = await createClient()
    const [itemsRes, claimsRes, usersRes] = await Promise.all([
      supabase.from('items')
        .select(`*, category:categories(id,name,icon), reporter:profiles(id,full_name,email)`)
        .neq('status', 'removed')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('claims')
        .select(`*, item:items(id,title,type), claimant:profiles(id,full_name,email)`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50),
    ])
    if (itemsRes.data) dbItems = itemsRes.data as Item[]
    if (claimsRes.data) claims = claimsRes.data as Claim[]
    if (usersRes.data) users = usersRes.data as Profile[]
  } catch (e) {
    // offline/fallback mode
  }

  const items = dbItems

  return (
    <AdminDashboardClient
      initialItems={items}
      initialClaims={claims}
      initialUsers={users}
      currentUser={profile}
    />
  )
}
