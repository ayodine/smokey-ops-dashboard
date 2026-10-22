import React, { useId } from 'react'
import { cn } from '@/lib/utils'

export interface ToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  onCheckedChange?: (checked: boolean) => void
  size?: 'sm' | 'md' | 'lg'
  label?: React.ReactNode
  description?: React.ReactNode
  ariaLabel?: string
  trackClassName?: string
  thumbClassName?: string
}

/**
 * Smokey Ops Design System Toggle Switch
 * Features a modern pill track with a signature rounded-rectangle white thumb.
 * Matches Cloudflare Kumo design system specifications with graphite active state.
 */
export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      checked: controlledChecked,
      defaultChecked = false,
      onChange,
      onCheckedChange,
      size = 'md',
      disabled = false,
      label,
      description,
      id,
      ariaLabel,
      className,
      trackClassName,
      thumbClassName,
      onClick,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const autoId = useId()
    const toggleId = id || autoId

    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked)
    const isControlled = controlledChecked !== undefined
    const isChecked = isControlled ? controlledChecked : uncontrolledChecked

    const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return
      const nextChecked = !isChecked
      if (!isControlled) {
        setUncontrolledChecked(nextChecked)
      }
      onChange?.(nextChecked)
      onCheckedChange?.(nextChecked)
      onClick?.(e)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        const nextChecked = !isChecked
        if (!isControlled) {
          setUncontrolledChecked(nextChecked)
        }
        onChange?.(nextChecked)
        onCheckedChange?.(nextChecked)
      }
      onKeyDown?.(e)
    }

    const toggleButton = (
      <button
        ref={ref}
        type="button"
        role="switch"
        id={toggleId}
        aria-checked={isChecked}
        aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        data-kumo-component="Toggle"
        className={cn(
          'relative inline-flex items-center shrink-0 cursor-pointer select-none transition-colors duration-150 ease-in-out p-0 border box-border appearance-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-kumo-brand focus-visible:ring-offset-2',
          // Dimensions matching exact Cloudflare Kumo specifications (38px x 20px squircle with rounded-[6px])
          size === 'sm' && 'w-[32px] h-[18px] rounded-[5px]',
          size === 'md' && 'w-[38px] h-[20px] rounded-[6px]',
          size === 'lg' && 'w-[44px] h-[24px] rounded-[7px]',
          // Track colors matching exact Cloudflare pixel measurement:
          // Active: #737373 bg with #525252 solid border
          // Inactive: #f2f2f2 bg with #d4d4d8 border
          isChecked
            ? 'bg-[#737373] border-[#525252] hover:bg-[#686868] dark:bg-[#666666] dark:border-[#444444]'
            : 'bg-[#f2f2f2] border-[#d4d4d8] hover:bg-[#eaeaea] hover:border-[#cbd5e1] dark:bg-zinc-800 dark:border-zinc-700',
          disabled && 'opacity-40 cursor-not-allowed',
          trackClassName,
          !label && !description && className
        )}
        {...props}
      >
        <span
          className={cn(
            'pointer-events-none block bg-white box-border transform transition-transform duration-150 ease-in-out',
            // Signature Cloudflare squircle thumb (18px x 18px for md, filling exactly half the track width and full inner height)
            size === 'sm' && 'w-[15px] h-[16px] rounded-[4px]',
            size === 'md' && 'w-[18px] h-[18px] rounded-[5px]',
            size === 'lg' && 'w-[21px] h-[22px] rounded-[6px]',
            isChecked
              ? cn(
                  'shadow-[0_1px_2px_rgba(0,0,0,0.18)]',
                  size === 'sm' && 'translate-x-[15px]',
                  size === 'md' && 'translate-x-[18px]',
                  size === 'lg' && 'translate-x-[21px]'
                )
              : cn(
                  'shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] translate-x-0'
                ),
            thumbClassName
          )}
        />
      </button>
    )

    if (!label && !description) {
      return toggleButton
    }

    return (
      <div
        className={cn(
          'inline-flex items-center justify-between gap-3 select-none',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          className
        )}
        onClick={(e) => {
          if (!disabled) {
            handleToggle(e as unknown as React.MouseEvent<HTMLButtonElement>)
          }
        }}
      >
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={toggleId}
              className={cn(
                'text-xs font-semibold text-kumo-strong cursor-pointer',
                disabled && 'cursor-not-allowed'
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <span className="text-[11px] text-kumo-subtle leading-tight">
              {description}
            </span>
          )}
        </div>
        {toggleButton}
      </div>
    )
  }
)

Toggle.displayName = 'Toggle'

// Export alias ToggleSwitch for semantic convenience
export const ToggleSwitch = Toggle
