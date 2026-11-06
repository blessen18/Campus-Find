import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, ArrowRight } from 'lucide-react'
import { cn, formatDate, STATUS_COLORS, STATUS_LABELS, TYPE_COLORS, TYPE_LABELS } from '@/lib/utils'
import type { Item } from '@/types'

interface ItemCardProps {
  item: Item
  showType?: boolean
}

function resolveImageUrl(path?: string): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/item-images/${path}`
}

export function ItemCard({ item, showType = false }: ItemCardProps) {
  const hasImage = item.images && item.images.length > 0
  const imageUrl = hasImage ? resolveImageUrl(item.images[0]) : null

  return (
    <article className="card-hover flex flex-col overflow-hidden group bg-white border border-slate-200/80 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Image */}
      <div className="relative h-48 bg-slate-100 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-4xl bg-slate-50 text-slate-400">
            {item.category?.icon || '📦'}
          </div>
        )}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          {showType && (
            <span className={cn('badge text-xs font-semibold shadow-sm', TYPE_COLORS[item.type])}>
              {TYPE_LABELS[item.type]}
            </span>
          )}
          <span className={cn('badge text-xs shadow-sm', STATUS_COLORS[item.status])}>
            {STATUS_LABELS[item.status]}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {item.category && (
          <span className="text-xs font-medium text-blue-600 mb-1.5 flex items-center gap-1">
            <span>{item.category.icon}</span>
            <span>{item.category.name}</span>
          </span>
        )}

        <h3 className="text-sm font-semibold text-slate-900 mb-1.5 leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
          {item.title}
        </h3>

        <p className="text-xs text-slate-500 line-clamp-2 flex-1 mb-3 leading-relaxed">
          {item.description}
        </p>

        <div className="flex flex-col gap-1.5 text-xs text-slate-500 mb-3 pt-2.5 border-t border-slate-100">
          <span className="flex items-center gap-1.5 text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{item.location?.name || item.location_detail || 'Campus'}</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>{item.type === 'lost' ? 'Lost on' : 'Found on'} {formatDate(item.date_occurred)}</span>
          </span>
        </div>

        <Link
          href={`/items/${item.id}`}
          className="btn bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-xs py-2 px-3 rounded-lg justify-between font-medium transition-colors group/btn"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
        </Link>
      </div>
    </article>
  )
}

// ── List variant ───────────────────────────────────────────────────────────────
export function ItemRow({ item }: { item: Item }) {
  const hasImage = item.images && item.images.length > 0
  const imageUrl = hasImage ? resolveImageUrl(item.images[0]) : null

  return (
    <article className="card-hover flex items-center gap-4 p-3.5 bg-white border border-slate-200/80 rounded-xl group hover:border-blue-300">
      <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/60">
        {imageUrl ? (
          <Image src={imageUrl} alt={item.title} fill className="object-cover" sizes="64px" />
        ) : (
          <div className="flex items-center justify-center h-full text-2xl">
            {item.category?.icon || '📦'}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('badge text-[11px]', TYPE_COLORS[item.type])}>{TYPE_LABELS[item.type]}</span>
          <span className={cn('badge text-[11px]', STATUS_COLORS[item.status])}>{STATUS_LABELS[item.status]}</span>
          {item.category && (
            <span className="text-[11px] text-slate-400 hidden sm:inline">· {item.category.name}</span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
          {item.title}
        </h3>
        <p className="text-xs text-slate-500 truncate mt-0.5">{item.description}</p>
        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
          <span>{item.location?.name || item.location_detail}</span>
          <span>•</span>
          <span>{formatDate(item.date_occurred)}</span>
        </p>
      </div>

      <Link href={`/items/${item.id}`} className="btn bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-xs px-3 py-1.5 rounded-lg flex-shrink-0 font-medium">
        Details
      </Link>
    </article>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function ItemCardSkeleton() {
  return (
    <div className="card overflow-hidden bg-white border border-slate-200 rounded-xl">
      <div className="skeleton h-48 w-full bg-slate-100" />
      <div className="p-4 flex flex-col gap-2.5">
        <div className="skeleton h-3 w-20 bg-slate-100" />
        <div className="skeleton h-4 w-3/4 bg-slate-100" />
        <div className="skeleton h-3 w-full bg-slate-100" />
        <div className="skeleton h-3 w-5/6 bg-slate-100" />
        <div className="mt-2 skeleton h-8 w-full rounded-lg bg-slate-100" />
      </div>
    </div>
  )
}
