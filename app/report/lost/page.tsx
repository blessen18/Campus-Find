import type { Metadata } from 'next'
import { ReportForm } from '@/components/ReportForm'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Report Lost Item',
  description: 'Submit a lost item report on CampusFind.',
}

export default async function ReportLostPage() {
  return (
    <div className="space-y-8 pb-16">
      <div className="bg-white border-b border-slate-200 py-8">
        <div className="container-page max-w-2xl">
          <Link href="/lost-items" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 font-medium mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Lost Items Feed
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-600 mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Missing Item Registration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Report a Lost Item</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Provide specific details and photos so campus members and security staff can contact you.
          </p>
        </div>
      </div>
      <div className="container-page max-w-2xl">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
          <ReportForm defaultType="lost" />
        </div>
      </div>
    </div>
  )
}
