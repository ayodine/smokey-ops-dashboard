import React from 'react'
import { cn } from '@/lib/utils'
import { Heading, Subheading } from './Heading'

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode
  subtitle?: React.ReactNode
  badge?: React.ReactNode
  breadcrumb?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

/**
 * Standard PageHeader design system component for all Smokey Ops pages.
 * Enforces optical kerning, proportional title tracking, and consistent action button spacing.
 */
export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, subtitle, badge, breadcrumb, actions, className, ...props }, ref) => {
    return (
      <header
        ref={ref}
        data-kumo-component="PageHeader"
        className={cn(
          'flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans select-none',
          className
        )}
        {...props}
      >
        <div className="space-y-1 min-w-0">
          {breadcrumb && (
            <div className="text-xs text-kumo-subtle mb-1">
              {breadcrumb}
            </div>
          )}
          <div className="flex items-center gap-2.5 flex-wrap">
            {typeof title === 'string' ? (
              <Heading level={1} size="xl">
                {title}
              </Heading>
            ) : (
              title
            )}
            {badge && <span className="shrink-0">{badge}</span>}
          </div>
          {subtitle && (
            typeof subtitle === 'string' ? (
              <Subheading size="xs">
                {subtitle}
              </Subheading>
            ) : (
              subtitle
            )
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {actions}
          </div>
        )}
      </header>
    )
  }
)

PageHeader.displayName = 'PageHeader'
