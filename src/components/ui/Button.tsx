import React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'brand' | 'outline' | 'inactive'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Cloudflare Kumo button primitives with robust disabled/inactive states
    const baseStyles =
      'group inline-flex items-center justify-center font-medium select-none border-0 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 disabled:bg-kumo-canvas disabled:text-kumo-subtle disabled:ring-1 disabled:ring-kumo-line disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-kumo-brand'

    const sizeStyles = {
      xs: 'h-7 px-2 text-xs rounded-lg gap-1',
      sm: 'h-8 px-2.5 text-xs rounded-lg gap-1.5',
      md: 'h-9 px-3.5 text-sm rounded-lg gap-2',
      lg: 'h-10 px-4 text-sm rounded-lg gap-2.5',
    }

    const variantStyles = {
      // Primary Action Red (Smokey brand design system)
      primary:
        'bg-[#c0201f] text-white hover:bg-[#a01817] active:opacity-90 shadow-xs',
      // Cloudflare Brand Signal Orange
      brand:
        'bg-[#f6821f] text-white hover:bg-[#e56e0d] active:bg-[#cc5c00] shadow-xs',
      // Cloudflare Kumo Base Card Button
      secondary:
        'bg-kumo-base text-kumo-default ring-1 ring-kumo-line hover:bg-kumo-tint active:bg-kumo-fill shadow-xs',
      // Outline Button
      outline:
        'bg-transparent text-kumo-default ring-1 ring-kumo-line hover:bg-kumo-tint',
      // Ghost / Tertiary Button
      tertiary:
        'bg-inherit text-kumo-default hover:bg-kumo-tint shadow-none',
      // Destructive Danger Button
      destructive:
        'bg-[#c0201f] text-white hover:bg-[#a01817] active:opacity-80 shadow-xs',
      // Dedicated Inactive / Disabled button for modals or unavailable CTAs
      inactive:
        'bg-kumo-canvas text-kumo-subtle ring-1 ring-kumo-line/80 cursor-not-allowed pointer-events-none shadow-none opacity-60',
    }

    const isInactive = disabled || variant === 'inactive'
    const computedVariantStyles = isInactive
      ? 'bg-kumo-canvas text-kumo-subtle ring-1 ring-kumo-line/80 cursor-not-allowed pointer-events-none shadow-none opacity-60'
      : variantStyles[variant]

    return (
      <button
        ref={ref}
        data-kumo-component="Button"
        disabled={isInactive || isLoading}
        aria-disabled={isInactive || isLoading}
        className={cn(baseStyles, sizeStyles[size], computedVariantStyles, className)}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-0.5 h-3.5 w-3.5 text-current shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon && <span className="inline-flex items-center shrink-0">{leftIcon}</span>
        )}
        <span className="inline-flex items-center gap-2 whitespace-nowrap">{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex items-center shrink-0">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'

// Dedicated Inactive / Disabled button component for modals or unavailable CTAs
export const InactiveButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  ({ children, className, size = 'md', leftIcon, rightIcon, ...props }, ref) => (
    <Button
      ref={ref}
      variant="inactive"
      disabled
      size={size}
      leftIcon={leftIcon}
      rightIcon={rightIcon}
      className={className}
      {...props}
    >
      {children}
    </Button>
  )
)

InactiveButton.displayName = 'InactiveButton'

export { TableActionButton, type TableActionButtonProps } from './TableActionButton'
