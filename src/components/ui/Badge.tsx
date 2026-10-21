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
  // Logistics
  | 'AWAITING_PICK'
  | 'PICKING'
  | 'PACKED'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'DELAYED'
  | 'DELIVERY_FAILED'
  // Generic
  | 'ACTIVE'
  | 'INACTIVE'

interface StatusBadgeProps {
  status: BadgeStatus | string
  customLabel?: string
  label?: string
  className?: string
  size?: 'sm' | 'md'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  customLabel,
  label,
  className,
  size = 'md',
}) => {
  const norm = String(status || '').toUpperCase().replace(/[\s-]+/g, '_')
  const userText = label || customLabel

  let config = {
    label: userText || norm.replace(/_/g, ' '),
    icon: Clock,
    colorClasses:
      'bg-kumo-tint text-kumo-subtle border-kumo-line',
    dotColor: 'bg-kumo-subtle',
  }

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
      config = {
        label: userText || (norm === 'IN_STOCK' ? 'In Stock' : norm === 'COMPLETED' ? 'Completed' : 'Delivered'),
        icon: CheckCircle2,
        colorClasses:
          'bg-green-50 border-green-200 text-green-600 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-400',
        dotColor: 'bg-green-600 dark:bg-green-400',
      }
      break

    case 'PENDING':
    case 'IN_PROGRESS':
    case 'PREP_QUEUED':
    case 'ON_PACKING_TABLE':
    case 'IN_SMOKER_PIT':
    case 'DELAYED':
    case 'ON_HOLD':
    case 'ON_LEAVE':
    case 'PARTIALLY_RECEIVED':
    case 'AWAITING_PICK':
    case 'PICKING':
    case 'NEEDS_ATTENTION':
      config = {
        label: userText || (norm === 'ON_HOLD' ? 'On Hold' : norm === 'PENDING' ? 'Pending' : 'In Progress'),
        icon: AlertTriangle,
        colorClasses:
          'bg-yellow-50 border-yellow-200 text-yellow-600 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:text-yellow-400',
        dotColor: 'bg-yellow-600 dark:bg-yellow-400',
      }
      break

    case 'CRITICAL_LOW':
    case 'LOW_STOCK':
    case 'OUT_OF_STOCK':
    case 'CANCELLED':
    case 'DELIVERY_FAILED':
    case 'DAMAGED':
    case 'FAILED':
    case 'FAILED_/_RETURNED':
    case 'SPOILED_/_DAMAGED':
    case 'AUDIT_LOSS':
    case 'INACTIVE':
    case 'OVERDUE':
      config = {
        label: userText || (norm === 'CRITICAL_LOW' ? 'Critical Low' : norm === 'LOW_STOCK' ? 'Low Stock' : norm === 'OUT_OF_STOCK' ? 'Out of Stock' : norm === 'CANCELLED' ? 'Cancelled' : norm === 'INACTIVE' ? 'Inactive' : 'Failed'),
        icon: AlertOctagon,
        colorClasses:
          'bg-[#FCE8EC] border-[#F3B0BB] text-[#C8102E] dark:bg-red-950/40 dark:border-red-800/60 dark:text-red-400',
        dotColor: 'bg-[#C8102E] dark:bg-red-400',
      }
      break

    case 'IN_PRODUCTION':
    case 'IN_TRANSIT':
    case 'DISPATCHED':
    case 'EN_ROUTE':
    case 'OUT_WITH_COURIER':
    case 'PACKED':
    case 'SCHEDULED':
    case 'SCHEDULED_PRE_ORDER':
    case 'BATCH_OUTPUT':
    case 'AUDIT_GAIN':
      config = {
        label: userText || (norm === 'IN_PRODUCTION' ? 'In Production' : 'In Transit'),
        icon: Truck,
        colorClasses:
          'bg-kumo-badge-blue/10 text-kumo-badge-blue border-kumo-badge-blue/30',
        dotColor: 'bg-kumo-badge-blue',
      }
      break

    case 'RESERVED':
    case 'MATERIALS_RESERVED':
      config = {
        label: userText || 'Reserved',
        icon: Lock,
        colorClasses:
          'bg-kumo-badge-purple/10 text-kumo-badge-purple border-kumo-badge-purple/30',
        dotColor: 'bg-kumo-badge-purple',
      }
      break

    case 'INCOMING':
    case 'PLANNED':
    case 'READY_TO_PRODUCE':
    case 'READY_TO_START':
    case 'READY_FOR_DISPATCH':
    case 'READY_FOR_PICKUP':
    case 'RELEASE_TO_PACK':
      config = {
        label: userText || norm.replace(/_/g, ' '),
        icon: Boxes,
        colorClasses:
          'bg-kumo-badge-teal/10 text-kumo-badge-teal border-kumo-badge-teal/30',
        dotColor: 'bg-kumo-badge-teal',
      }
      break

    case 'QUARANTINED':
    case 'SCRAPPED_WRITE_OFF':
      config = {
        label: userText || 'Quarantined',
        icon: ShieldAlert,
        colorClasses:
          'bg-kumo-badge-purple/15 text-kumo-badge-purple border-kumo-badge-purple/35',
        dotColor: 'bg-kumo-badge-purple',
      }
      break

    case 'RECONCILIATION_REQUIRED':
    case 'QUALITY_CHECK':
    case 'QC_PENDING':
      config = {
        label: userText || (norm === 'QUALITY_CHECK' ? 'QC Pending' : 'Reconcile'),
        icon: RefreshCw,
        colorClasses:
          'bg-[#f6821f]/15 text-[#f6821f] border-[#f6821f]/30',
        dotColor: 'bg-[#f6821f]',
      }
      break

    default:
      break
  }

  return (
    <span
      data-kumo-component="Badge"
      className={cn(
        'inline-flex items-center font-medium rounded-full border border-solid select-none tracking-normal leading-none max-w-full min-w-0 overflow-hidden font-sans transition-colors',
        size === 'sm' ? 'px-2.5 py-1 text-[11px] gap-1.5' : 'px-3 py-1 text-xs gap-1.5',
        config.colorClasses,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dotColor)} />
      <span className="truncate min-w-0 overflow-hidden">{config.label}</span>
    </span>
  )
}
