import { cn, STATUS_COLORS, STATUS_LABELS, TYPE_COLORS, TYPE_LABELS, CLAIM_STATUS_COLORS } from '@/lib/utils'
import type { ItemStatus, ItemType, ClaimStatus } from '@/types'

interface StatusBadgeProps {
  status: ItemStatus
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  return (
    <span className={cn(
      'badge font-medium',
      STATUS_COLORS[status],
      size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
    )}>
      {STATUS_LABELS[status]}
    </span>
  )
}

interface TypeBadgeProps {
  type: ItemType
  size?: 'sm' | 'md'
}

export function TypeBadge({ type, size = 'md' }: TypeBadgeProps) {
  return (
    <span className={cn(
      'badge font-semibold',
      TYPE_COLORS[type],
      size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
    )}>
      {TYPE_LABELS[type]}
    </span>
  )
}

interface ClaimBadgeProps {
  status: ClaimStatus
}

export function ClaimBadge({ status }: ClaimBadgeProps) {
  const labels: Record<ClaimStatus, string> = {
    pending:   'Pending Review',
    approved:  'Approved',
    rejected:  'Rejected',
    withdrawn: 'Withdrawn',
  }
  return (
    <span className={cn('badge font-medium text-xs', CLAIM_STATUS_COLORS[status])}>
      {labels[status]}
    </span>
  )
}

