import React from 'react'
import { cn } from '@/lib/utils'

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  children: React.ReactNode
}

/**
 * Optically balanced Heading component for the Smokey Ops Design System.
 * Uses SF Pro Display with calibrated optical kerning and proportional letter-spacing
 * to avoid tight/pinched headers at all viewport scales.
 */
export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level = 1, size, className, children, ...props }, ref) => {
    const Component = `h${level}` as const

    // Proportional optical tracking scale:
    // Larger headings have subtle, balanced tracking (-0.012em);
    // smaller headings use neutral tracking to prevent character crowding.
    const sizeClasses = {
      '3xl': 'text-2xl sm:text-3xl md:text-4xl font-bold tracking-[-0.016em]',
      '2xl': 'text-2xl sm:text-3xl font-bold tracking-[-0.014em]',
      xl: 'text-xl sm:text-2xl font-bold tracking-[-0.011em]',
      lg: 'text-lg sm:text-xl font-bold tracking-[-0.008em]',
      md: 'text-base sm:text-lg font-semibold tracking-[-0.004em]',
      sm: 'text-sm font-semibold tracking-normal',
      xs: 'text-xs font-semibold tracking-normal',
    }

    const defaultSizeForLevel: Record<number, keyof typeof sizeClasses> = {
      1: 'xl',
      2: 'lg',
      3: 'md',
      4: 'sm',
      5: 'xs',
      6: 'xs',
    }

    const resolvedSize = size || defaultSizeForLevel[level]

    return (
      <Component
        ref={ref}
        data-kumo-component="Heading"
        className={cn(
          'text-kumo-strong font-display [text-rendering:optimizeLegibility] [font-feature-settings:"kern"_1,"liga"_1]',
          sizeClasses[resolvedSize],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

Heading.displayName = 'Heading'

export interface SubheadingProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: 'xs' | 'sm' | 'md'
  children: React.ReactNode
}

/**
 * Subheading component for section descriptions, page subtitle descriptions,
 * and contextual metadata. Always uses neutral, comfortable tracking and relaxed leading.
 */
export const Subheading = React.forwardRef<HTMLParagraphElement, SubheadingProps>(
  ({ size = 'xs', className, children, ...props }, ref) => {
    const sizeClasses = {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
    }

    return (
      <p
        ref={ref}
        data-kumo-component="Subheading"
        className={cn(
          'text-kumo-subtle tracking-normal leading-relaxed font-sans [text-rendering:optimizeLegibility]',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </p>
    )
  }
)

Subheading.displayName = 'Subheading'
