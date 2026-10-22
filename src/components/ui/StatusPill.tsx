import React from 'react'
import { cn } from '@/lib/utils'

export type FigmaBadgeState = 'draft' | 'in-progress' | 'in-review' | 'completed'

export interface StatusPillProps {
  /** Explicit status state or derived from label/variant */
  state?: FigmaBadgeState
  /** Status text label */
  label?: string
  /** Legacy variant compatibility */
  variant?: 'emerald' | 'blue' | 'amber' | 'purple' | 'zinc'
  /** Short label mode: icon only within 28px square container */
  short?: boolean
  className?: string
}

export const StatusPill: React.FC<StatusPillProps> = ({
  state: explicitState,
  label = '',
  variant,
  short = false,
  className
}) => {
  const norm = (label || '').toLowerCase().trim()

  // Determine Figma state: draft | in-progress | in-review | completed
  let state: FigmaBadgeState = explicitState || 'draft'
  let displayLabel = label

  if (!explicitState) {
    if (
      norm === 'done' ||
      norm === 'completed' ||
      norm === 'delivered' ||
      variant === 'emerald'
    ) {
      state = 'completed'
      displayLabel = norm === 'done' || !label ? 'Completed' : label
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
      displayLabel = norm === 'in review' || !label ? 'In-review' : label
    } else {
      state = 'draft'
      displayLabel = norm === 'pending' || !label ? 'Draft' : label
    }
  }

  // Exact icon definitions extracted from Figma (node 1:73)
  const renderIcon = () => {
    switch (state) {
      case 'draft':
        return (
          <svg
            width="16"
            height="16"
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
              stroke="#353B47"
              strokeWidth="1.21739"
              strokeDasharray="6.09 2.43"
            />
          </svg>
        )
      case 'in-progress':
        return (
          <svg
            width="16"
            height="16"
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
              stroke="#F07C27"
              strokeWidth="1.21739"
            />
            <path
              d="M8 13.6C9.4852 13.6 10.9096 13.01 11.9598 11.9598C13.01 10.9096 13.6 9.4852 13.6 8C13.6 6.5148 13.01 5.0904 11.9598 4.0402C10.9096 2.99 9.4852 2.4 8 2.4L8 8L8 13.6Z"
              fill="#F07C27"
            />
          </svg>
        )
      case 'in-review':
        return (
          <svg
            width="16"
            height="16"
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
              stroke="#1760FA"
              strokeWidth="1.21739"
            />
            <path
              d="M2.4 8C2.4 9.1076 2.7284 10.1903 3.3438 11.1112C3.9591 12.0321 4.8337 12.7499 5.857 13.1737C6.8803 13.5976 8.0062 13.7085 9.0925 13.4924C10.1788 13.2763 11.1766 12.743 11.9598 11.9598C12.743 11.1766 13.2763 10.1788 13.4924 9.0925C13.7085 8.0062 13.5976 6.8803 13.1737 5.857C12.7499 4.8337 12.0321 3.9591 11.1112 3.3438C10.1903 2.7284 9.1076 2.4 8 2.4L8 8L2.4 8Z"
              fill="#1564FC"
            />
          </svg>
        )
      case 'completed':
        return (
          <svg
            width="16"
            height="16"
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
    }
  }

  // Exact color themes extracted from Figma (node 1:73)
  const styles: Record<FigmaBadgeState, string> = {
    draft: 'bg-[#F3F4F8] text-[#353B47]',
    'in-progress': 'bg-[#FFF8F0] text-[#F07C27]',
    'in-review': 'bg-[#F0F4FF] text-[#1564FC]',
    completed: 'bg-[#F0FFF6] text-[#008234]'
  }

  if (short) {
    return (
      <span
        title={displayLabel || state}
        className={cn(
          'inline-flex items-center justify-center w-7 h-7 rounded-[8px] select-none shrink-0 transition-colors',
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
        'inline-flex items-center gap-[6px] h-7 px-[8px] py-[6px] rounded-[8px] text-[13px] sm:text-[14px] font-medium leading-none select-none shrink-0 transition-colors',
        styles[state],
        className
      )}
    >
      {renderIcon()}
      <span className="truncate">{displayLabel}</span>
    </span>
  )
}

export default StatusPill
