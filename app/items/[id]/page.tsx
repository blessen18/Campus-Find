import { createClient, getServerUser } from '@/lib/supabase/server'
import { getServerItemById } from '@/lib/serverStorage'
import { TYPE_LABELS, isPlaceholderSupabase } from '@/lib/utils'
import { ItemDetailView } from './ItemDetailView'
import type { Item } from '@/types'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Props { params: { id: string } }

async function getItem(id: string): Promise<Item | null> {
  if (!isPlaceholderSupabase()) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          category:categories(id, name, slug, icon),
          location:locations(id, name),
          reporter:profiles(id, full_name, role, department)
        `)
        .eq('id', id)
        .neq('status', 'removed')
        .single()
      if (!error && data) return data as Item
    } catch (err) {
      // fallback
    }
  }

  // Fallback to server shared storage (supports multi-device & offline reports)
  try {
    const serverItem = await getServerItemById(id)
    if (serverItem) return serverItem
  } catch (e) {}

  return null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getItem(params.id)
  if (!item) return { title: 'Item Details | CampusFind' }
  return {
    title: `${item.title} — ${TYPE_LABELS[item.type]} Item`,
    description: item.description,
  }
}

export default async function ItemDetailPage({ params }: Props) {
  const item = await getItem(params.id)
  const serverUser = await getServerUser()

  return (
    <ItemDetailView
      initialItem={item}
      id={params.id}
      serverUser={serverUser}
    />
  )
}
