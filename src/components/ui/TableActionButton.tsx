import React from 'react'
import { cn } from '@/lib/utils'

export type TableActionButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'danger' 
  | 'warning' 
  | 'outline' 
  | 'blue' 
  | 'ghost'

export interface TableActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TableActionButtonVariant
  leftIcon?: React.ReactNode
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
  iconStrokeWidth?: number
  children?: React.ReactNode
}

const variantStyles: Record<TableActionButtonVariant, string> = {
  primary: 
    'text-white bg-primary hover:bg-primary/90 border border-primary dark:border-primary/80 shadow-2xs',
  secondary: 
    'text-kumo-strong bg-kumo-tint hover:bg-kumo-control border border-kumo-line shadow-2xs',
  success: 
    'text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 shadow-2xs',
  danger: 
    'text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 shadow-2xs',
  warning: 
    'text-amber-800 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 shadow-2xs',
  outline: 
    'text-kumo-default hover:text-kumo-strong bg-kumo-surface hover:bg-kumo-control border border-kumo-line shadow-2xs',
  blue: 
    'text-blue-700 dark:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 shadow-2xs',
  ghost: 
    'text-kumo-subtle hover:text-kumo-strong hover:bg-kumo-tint border border-transparent',
}

export const TableActionButton: React.FC<TableActionButtonProps> = ({
  variant = 'outline',
  leftIcon,
  icon,
  rightIcon,
  iconStrokeWidth,
  className,
  children,
  type = 'button',
  disabled,
  ...props
}) => {
  const effectiveLeftIcon = leftIcon || icon

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        // Uniform sizing and padding matching the design system standard (+ Receive button)
        'px-3 py-1.5 text-xs font-semibold rounded-lg font-sans',
        'inline-flex items-center justify-center gap-1.5',
        'transition-colors duration-150 select-none whitespace-nowrap shrink-0 flex-none',
        'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {effectiveLeftIcon && (
        <span 
          className="shrink-0 flex items-center justify-center [&>svg]:w-3.5 [&>svg]:h-3.5"
          style={iconStrokeWidth ? { strokeWidth: iconStrokeWidth } : undefined}
        >
          {effectiveLeftIcon}
        </span>
      )}
      {children && <span>{children}</span>}
      {rightIcon && (
        <span 
          className="shrink-0 flex items-center justify-center [&>svg]:w-3.5 [&>svg]:h-3.5"
          style={iconStrokeWidth ? { strokeWidth: iconStrokeWidth } : undefined}
        >
          {rightIcon}
        </span>
      )}
    </button>
  )
}

export default TableActionButton
