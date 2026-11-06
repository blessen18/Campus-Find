import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EditItemForm } from './EditItemForm'
import type { Item } from '@/types'

interface Props {
  params: { id: string }
}

export default async function EditItemPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?redirect=/dashboard/edit/${params.id}`)

  const { data: itemData, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !itemData) notFound()

  const item = itemData as Item

  // Check permission (owner or admin)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isOwner = item.reported_by === user.id
  const isAdmin = profile?.role === 'admin'

  if (!isOwner && !isAdmin) {
    redirect('/dashboard')
  }

  return (
    <div>
      <div className="page-header">
        <div className="container-page max-w-2xl">
          <Link href={`/items/${item.id}`} className="inline-flex items-center gap-1.5 text-xs text-primary-200 hover:text-white mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Item
          </Link>
          <h1 className="text-2xl font-bold">Edit Report</h1>
          <p className="text-primary-200 text-sm mt-1">{item.title}</p>
        </div>
      </div>

      <div className="container-page max-w-2xl py-8">
        <div className="card p-6 sm:p-8">
          <EditItemForm item={item} />
        </div>
      </div>
    </div>
  )
}

