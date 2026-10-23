import React from 'react'
import { cn } from '@/lib/utils'
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Clock, 
  Lock, 
  ShieldAlert, 
  RefreshCw, 
  Truck, 
  Boxes
} from 'lucide-react'

export type BadgeStatus =
  // Inventory
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'INCOMING'
  | 'RESERVED'
  | 'QUARANTINED'
  | 'RECONCILIATION_REQUIRED'
  | 'DAMAGED'
  // Production
  | 'DRAFT'
  | 'PLANNED'
  | 'MATERIALS_RESERVED'
  | 'READY_TO_PRODUCE'
  | 'IN_PRODUCTION'
  | 'QUALITY_CHECK'
  | 'COMPLETED'
  | 'CLOSED'
  | 'ON_HOLD'
  | 'CANCELLED'
  | 'FLAGGED'
  | 'REJECTED'
  // Logistics & Sales
  | 'AWAITING_PICK'
  | 'PICKING'
  | 'PACKED'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'DELAYED'
  | 'DELIVERY_FAILED'
  | 'PAID'
  | 'PENDING'
  | 'REFUNDED'
  | 'IN_INTAKE'
  | 'INTAKE'
  | 'ORDER_INTAKE'
  | 'COOKING'
  | 'PACKAGING'
  // Generic
  | 'ACTIVE'
  | 'INACTIVE'

interface StatusBadgeProps {
  status: BadgeStatus | string
  customLabel?: string
  label?: string
  className?: string
  size?: 'sm' | 'md'
  variant?: 'emerald' | 'blue' | 'amber' | 'purple' | 'zinc' | 'red'
  dot?: boolean
}

import { 
  StatusPill, 
  FlaggedBadge,
  CompletedBadge,
  InProgressBadge,
  InReviewBadge,
  DraftBadge,
  type FigmaBadgeState, 
  type StatusPillProps 
} from './StatusPill'
export { 
  StatusPill, 
  FlaggedBadge,
  CompletedBadge,
  InProgressBadge,
  InReviewBadge,
  DraftBadge,
  type FigmaBadgeState, 
  type StatusPillProps 
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  customLabel,
  label,
  className,
  size = 'md',
  variant,
  dot = true,
}) => {
  const norm = String(status || '').toUpperCase().replace(/[\s-]+/g, '_')
  const userText = label || customLabel

  let figmaState: FigmaBadgeState = 'draft'
  let displayLabel = 'no-action'

  // Normalize incoming userText: if provided in ALL CAPS (e.g. "COMPLETED", "ON ROAD"),
  // convert to lowercase to maintain clean, consistent casing across all badges
  const cleanUserText = userText
    ? (userText === userText.toUpperCase() && /[A-Z]/.test(userText)
        ? userText.toLowerCase().replace(/_/g, '-')
        : (userText.toLowerCase() === 'completed' ? 'completed' : userText.replace(/_/g, '-')))
    : undefined

  switch (norm) {
    case 'IN_STOCK':
    case 'COMPLETED':
    case 'DELIVERED':
    case 'ACTIVE':
    case 'PASSED':
    case 'PASSED_&_DEPOSITED':
    case 'RELEASED':
    case 'AVAILABLE':
    case 'DONE':
    case 'PAID':
    case 'VERIFIED':
      figmaState = 'completed'
      displayLabel = cleanUserText && !['PASSED & DEPOSITED', 'PASSED'].includes(cleanUserText.toUpperCase())
        ? cleanUserText
        : 'completed'
      break

    case 'IN_PROGRESS':
    case 'PROCESSING':
    case 'PRODUCING':
    case 'IN_PRODUCTION':
    case 'COOKING':
    case 'PACKAGING':
    case 'IN_TRANSIT':
    case 'DISPATCHED':
    case 'EN_ROUTE':
    case 'ON_PACKING_TABLE':
    case 'OUT_WITH_COURIER':
    case 'AWAITING_PICK':
    case 'PICKING':
      figmaState = 'in-progress'
      displayLabel = cleanUserText || (norm === 'PROCESSING' ? 'processing' : 'in-progress')
      break

    case 'QUALITY_CHECK':
    case 'QC_PENDING':
    case 'IN_REVIEW':
    case 'REVIEW':
    case 'RECONCILIATION_REQUIRED':
    case 'IN_SMOKER_PIT':
    case 'ON_HOLD':
    case 'NEEDS_ATTENTION':
      figmaState = 'in-review'
      displayLabel = cleanUserText || 'in-review'
      break

    case 'PENDING':
    case 'PREP_QUEUE':
    case 'PREP_QUEUED':
    case 'DRAFT':
    case 'PLANNED':
    case 'READY_TO_PRODUCE':
    case 'READY_TO_START':
    case 'WARNING':
      figmaState = 'draft'
      displayLabel = cleanUserText ? cleanUserText : 'pending'
      break

    case 'FLAGGED':
    case 'CANCELLED':
    case 'DELIVERY_FAILED':
    case 'FAILED':
    case 'FAILED_/_RETURNED':
    case 'SPOILED_/_DAMAGED':
    case 'REJECTED':
      figmaState = 'flagged'
      displayLabel = cleanUserText || (norm === 'CANCELLED' ? 'cancelled' : norm === 'FLAGGED' ? 'flagged' : norm === 'DELIVERY_FAILED' ? 'delivery failed' : 'failed')
      break

    case 'CRITICAL_LOW':
    case 'LOW_STOCK':
    case 'OUT_OF_STOCK':
    case 'DAMAGED':
    case 'AUDIT_LOSS':
    case 'INACTIVE':
    case 'OVERDUE':
    case 'REFUNDED':
      figmaState = 'draft'
      displayLabel = cleanUserText || (norm === 'REFUNDED' ? 'refunded' : norm === 'LOW_STOCK' ? 'low stock' : norm === 'OUT_OF_STOCK' ? 'out of stock' : norm === 'INACTIVE' ? 'inactive' : 'action required')
      break

    default:
      if (variant === 'emerald') {
        figmaState = 'completed'
        displayLabel = cleanUserText || 'completed'
      } else if (variant === 'amber') {
        figmaState = 'in-progress'
        displayLabel = cleanUserText || 'in-progress'
      } else if (variant === 'blue') {
        figmaState = 'in-review'
        displayLabel = cleanUserText || 'in-review'
      } else if (variant === 'red') {
        figmaState = 'flagged'
        displayLabel = cleanUserText || 'flagged'
      } else {
        figmaState = 'draft'
        displayLabel = cleanUserText || 'no-action'
      }
      break
  }

  return (
    <StatusPill
      state={figmaState}
      label={displayLabel}
      className={className}
    />
  )
}

// Re-export Figma StatusPill design system badge (both full and icon-only variants)

/**
 * Figma Status Badge - Full variant with container, icon, and text label
 */
export const FigmaBadge: React.FC<StatusPillProps> = (props) => (
  <StatusPill {...props} />
)

/**
 * Figma Status Badge - Compact variant with icon only in a 28x28px container
 */
export const FigmaIconBadge: React.FC<StatusPillProps> = (props) => (
  <StatusPill {...props} short={true} />
)

export default StatusBadge
