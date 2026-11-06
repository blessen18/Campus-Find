import type { Metadata } from 'next'
import { ReportForm } from '@/components/ReportForm'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Report Found Item',
  description: 'Submit a found item report on CampusFind.',
}

export default async function ReportFoundPage() {
  return (
    <div className="space-y-8 pb-16">
      <div className="bg-white border-b border-slate-200 py-8">
        <div className="container-page max-w-2xl">
          <Link href="/found-items" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 font-medium mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Found Items Feed
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Recovered Belonging Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Report a Found Item</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Help reunite a student or faculty member with their belongings safely.
          </p>
        </div>
      </div>
      <div className="container-page max-w-2xl">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
          <ReportForm defaultType="found" />
        </div>
      </div>
    </div>
  )
}
