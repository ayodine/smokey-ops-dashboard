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
          'relative inline-flex items-center shrink-0 cursor-pointer rounded-full select-none transition-colors duration-200 ease-in-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-kumo-brand focus-visible:ring-offset-2',
          // Dimensions matching design system specifications
          size === 'sm' && 'w-[36px] h-[19px] p-[2px]',
          size === 'md' && 'w-[42px] h-[22px] p-[2px]',
          size === 'lg' && 'w-[50px] h-[26px] p-[2.5px]',
          // Track color: dark charcoal graphite when active (#595959), soft neutral gray when inactive
          isChecked
            ? 'bg-[#595959] border border-[#484848] dark:bg-[#525252] dark:border-[#3f3f3f]'
            : 'bg-[#e4e4e7] border border-[#d1d1d6] dark:bg-zinc-800 dark:border-zinc-700',
          disabled && 'opacity-40 cursor-not-allowed',
          trackClassName,
          !label && !description && className
        )}
        {...props}
      >
        <span
          className={cn(
            'pointer-events-none inline-block bg-white shadow-[0_1px_2px_rgba(0,0,0,0.18)] border border-black/5 transform transition-transform duration-200 ease-in-out',
            // Signature rounded-rectangle thumb
            size === 'sm' && 'w-[14px] h-[15px] rounded-[4px]',
            size === 'md' && 'w-[16px] h-[18px] rounded-[5px]',
            size === 'lg' && 'w-[20px] h-[21px] rounded-[6px]',
            isChecked
              ? size === 'sm'
                ? 'translate-x-[17px]'
                : size === 'lg'
                  ? 'translate-x-[24px]'
                  : 'translate-x-[20px]'
              : 'translate-x-0',
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
