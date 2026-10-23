import React from 'react'
import { cn } from '@/lib/utils'

export type FigmaBadgeState = 'draft' | 'in-progress' | 'in-review' | 'completed' | 'flagged'

export interface StatusPillProps {
  /** Explicit status state or derived from label/variant */
  state?: FigmaBadgeState
  /** Status text label */
  label?: string
  /** Legacy variant compatibility */
  variant?: 'emerald' | 'blue' | 'amber' | 'purple' | 'zinc' | 'red'
  /** Short label mode: icon only within 28px square container */
  short?: boolean
  /** Size variant: 'sm' (compact 22px height) or 'md' (standard 28px height, default) */
  size?: 'sm' | 'md'
  className?: string
}

export const StatusPill: React.FC<StatusPillProps> = ({
  state: explicitState,
  label = '',
  variant,
  short = false,
  size = 'md',
  className
}) => {
  const norm = (label || '').toLowerCase().trim()

  // Determine Figma state: draft | in-progress | in-review | completed | flagged
  let state: FigmaBadgeState = explicitState || 'draft'
  let displayLabel = label

  if (!explicitState) {
    if (
      norm === 'flagged' ||
      norm === 'cancelled' ||
      norm === 'failed' ||
      norm === 'rejected' ||
      variant === 'red'
    ) {
      state = 'flagged'
      displayLabel = norm === 'flagged' || !label ? 'flagged' : (norm === 'cancelled' ? 'cancelled' : norm === 'failed' ? 'failed' : label)
    } else if (
      norm === 'done' ||
      norm === 'completed' ||
      norm === 'delivered' ||
      variant === 'emerald'
    ) {
      state = 'completed'
      displayLabel = norm === 'done' || !label ? 'completed' : label
    } else if (
      norm === 'in progress' ||
      norm === 'in-progress' ||
      norm === 'in-process' ||
      norm === 'active' ||
      variant === 'amber'
    ) {
      state = 'in-progress'
      displayLabel = norm === 'in progress' || norm === 'in-process' || !label ? 'in-progress' : label
    } else if (
      norm === 'in review' ||
      norm === 'in-review' ||
      norm === 'review' ||
      variant === 'blue'
    ) {
      state = 'in-review'
      displayLabel = norm === 'in review' || !label ? 'in-review' : label
    } else {
      state = 'draft'
      displayLabel = norm === 'pending' || norm === 'draft' || !label ? 'no-action' : label
    }
  }

  // Ensure fallback labels for explicit states
  if (!displayLabel || displayLabel.toLowerCase() === 'draft') {
    if (state === 'completed') displayLabel = 'completed'
    else if (state === 'in-progress') displayLabel = 'in-progress'
    else if (state === 'in-review') displayLabel = 'in-review'
    else if (state === 'flagged') displayLabel = 'flagged'
    else displayLabel = 'no-action'
  }

  // Normalize casing: convert COMPLETED to lowercase "completed",
  // and convert any other all-caps labels to lowercase
  if (displayLabel) {
    if (displayLabel.toLowerCase() === 'completed') {
      displayLabel = 'completed'
    } else if (displayLabel.toLowerCase() === 'flagged') {
      displayLabel = 'flagged'
    } else if (displayLabel.toLowerCase() === 'in-review' || displayLabel.toLowerCase() === 'in review') {
      displayLabel = 'in-review'
    } else if (displayLabel.toLowerCase() === 'in-progress' || displayLabel.toLowerCase() === 'in progress') {
      displayLabel = 'in-progress'
    } else if (displayLabel.toLowerCase() === 'no-action' || displayLabel.toLowerCase() === 'no action') {
      displayLabel = 'no-action'
    } else if (displayLabel === displayLabel.toUpperCase() && /[A-Z]/.test(displayLabel)) {
      displayLabel = displayLabel.toLowerCase().replace(/_/g, '-')
    }
    if (displayLabel.includes('_')) {
      displayLabel = displayLabel.replace(/_/g, '-')
    }
  }

  const iconDim = size === 'sm' ? 12 : 16

  // Exact icon definitions consistent with Figma design system (node 1:73)
  const renderIcon = () => {
    switch (state) {
      case 'draft':
        return (
          <svg
            width={iconDim}
            height={iconDim}
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0"
            aria-hidden="true"
          >
            <rect
              x="0.6087"
              y="0.6087"
              width="14.7826"
              height="14.7826"
              rx="7.3913"
              stroke="currentColor"
              strokeWidth="1.21739"
              strokeDasharray="6.09 2.43"
            />
          </svg>
        )
      case 'in-progress':
        return (
          <svg
            width={iconDim}
            height={iconDim}
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0"
            aria-hidden="true"
          >
            <rect
              x="0.6087"
              y="0.6087"
              width="14.7826"
              height="14.7826"
              rx="7.3913"
              stroke="currentColor"
              strokeWidth="1.21739"
            />
            <path
              d="M8 13.6C9.4852 13.6 10.9096 13.01 11.9598 11.9598C13.01 10.9096 13.6 9.4852 13.6 8C13.6 6.5148 13.01 5.0904 11.9598 4.0402C10.9096 2.99 9.4852 2.4 8 2.4L8 8L8 13.6Z"
              fill="currentColor"
            />
          </svg>
        )
      case 'in-review':
        return (
          <svg
            width={iconDim}
            height={iconDim}
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0"
            aria-hidden="true"
          >
            <rect
              x="0.6087"
              y="0.6087"
              width="14.7826"
              height="14.7826"
              rx="7.3913"
              stroke="currentColor"
              strokeWidth="1.21739"
            />
            <path
              d="M2.4 8C2.4 9.1076 2.7284 10.1903 3.3438 11.1112C3.9591 12.0321 4.8337 12.7499 5.857 13.1737C6.8803 13.5976 8.0062 13.7085 9.0925 13.4924C10.1788 13.2763 11.1766 12.743 11.9598 11.9598C12.743 11.1766 13.2763 10.1788 13.4924 9.0925C13.7085 8.0062 13.5976 6.8803 13.1737 5.857C12.7499 4.8337 12.0321 3.9591 11.1112 3.3438C10.1903 2.7284 9.1076 2.4 8 2.4L8 8L2.4 8Z"
              fill="currentColor"
            />
          </svg>
        )
      case 'completed':
        return (
          <svg
            width={iconDim}
            height={iconDim}
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0"
            aria-hidden="true"
          >
            <rect width="16" height="16" rx="8" fill="#00A63D" />
            <path
              d="M4.39941 8.174L6.67621 10.4955C6.76903 10.5901 6.92258 10.5864 7.01071 10.4874L11.6006 5.32956"
              stroke="white"
              strokeWidth="1.83164"
              strokeLinecap="round"
            />
          </svg>
        )
      case 'flagged':
        return (
          <svg
            width={iconDim}
            height={iconDim}
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0"
            aria-hidden="true"
          >
            <rect width="16" height="16" rx="8" fill="#D92D20" />
            <path
              d="M5.2 5.2L10.8 10.8M10.8 5.2L5.2 10.8"
              stroke="white"
              strokeWidth="1.83164"
              strokeLinecap="round"
            />
          </svg>
        )
    }
  }

  // Exact color themes extracted from Figma (node 1:73) + consistent red flagged state + Dark mode support
  const styles: Record<FigmaBadgeState, string> = {
    draft: 'bg-[#F3F4F8] text-[#353B47] dark:bg-zinc-800/90 dark:text-zinc-300 dark:border dark:border-zinc-700/60',
    'in-progress': 'bg-[#FFF8F0] text-[#F07C27] dark:bg-amber-950/40 dark:text-amber-400 dark:border dark:border-amber-800/50',
    'in-review': 'bg-[#F0F4FF] text-[#1564FC] dark:bg-blue-950/40 dark:text-blue-400 dark:border dark:border-blue-800/50',
    completed: 'bg-[#F0FFF6] text-[#008234] dark:bg-emerald-950/40 dark:text-emerald-400 dark:border dark:border-emerald-800/50',
    flagged: 'bg-[#FEF3F2] text-[#B42318] dark:bg-red-950/40 dark:text-red-400 dark:border dark:border-red-800/50'
  }

  if (short) {
    return (
      <span
        title={displayLabel || state}
        className={cn(
          'inline-flex items-center justify-center select-none shrink-0 transition-colors',
          size === 'sm'
            ? 'w-[22px] h-[22px] min-w-[22px] min-h-[22px] rounded-[6px]'
            : 'w-7 h-7 min-w-[28px] min-h-[28px] rounded-[8px]',
          styles[state],
          className
        )}
      >
        {renderIcon()}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium select-none shrink-0 transition-colors',
        size === 'sm'
          ? 'gap-1 h-[22px] min-h-[22px] px-1.5 py-0.5 rounded-[5px] text-[11px] leading-tight'
          : 'gap-[6px] h-7 min-h-[28px] px-[8px] py-[3px] rounded-[8px] text-[13px] leading-normal',
        styles[state],
        className
      )}
    >
      {renderIcon()}
      <span className="whitespace-nowrap tracking-normal leading-normal">{displayLabel}</span>
    </span>
  )
}

/**
 * Component instance: Flagged Badge (Red pill with cancel icon)
 */
export const FlaggedBadge: React.FC<Omit<StatusPillProps, 'state'>> = (props) => (
  <StatusPill state="flagged" label="flagged" {...props} />
)

/**
 * Component instance: Completed Badge (Green pill with checkmark icon)
 */
export const CompletedBadge: React.FC<Omit<StatusPillProps, 'state'>> = (props) => (
  <StatusPill state="completed" label="completed" {...props} />
)

/**
 * Component instance: In-Progress Badge (Amber pill with progress icon)
 */
export const InProgressBadge: React.FC<Omit<StatusPillProps, 'state'>> = (props) => (
  <StatusPill state="in-progress" label="in-progress" {...props} />
)

/**
 * Component instance: In-Review Badge (Blue pill with review icon)
 */
export const InReviewBadge: React.FC<Omit<StatusPillProps, 'state'>> = (props) => (
  <StatusPill state="in-review" label="in-review" {...props} />
)

/**
 * Component instance: Draft / No-Action Badge (Grey pill with dashed icon)
 */
export const DraftBadge: React.FC<Omit<StatusPillProps, 'state'>> = (props) => (
  <StatusPill state="draft" label="no-action" {...props} />
)

export default StatusPill
