import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const autoId = React.useId()
    const generatedId = id || autoId

    return (
      <div className="w-full space-y-1.5 select-none">
        {label && (
          <label
            htmlFor={generatedId}
            className="block text-xs font-medium text-kumo-strong leading-4"
          >
            {label}
            {props.required && <span className="text-kumo-danger ml-0.5">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-2xs">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-kumo-subtle">
              {leftIcon}
            </div>
          )}
          <input
            id={generatedId}
            type={type}
            ref={ref}
            className={cn(
              'block w-full h-9 rounded-lg bg-kumo-base ring ring-kumo-line px-3 py-2 text-xs text-kumo-default placeholder:text-kumo-placeholder focus:outline-none focus:ring-2 focus:ring-kumo-brand transition-colors',
              leftIcon && 'pl-8.5',
              rightIcon && 'pr-8.5',
              error && 'ring-kumo-danger focus:ring-kumo-danger',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-kumo-subtle">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[11px] text-kumo-danger">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-kumo-subtle">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
