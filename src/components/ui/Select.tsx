import React, { useState, useRef, useEffect, useId, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Check, Search } from 'lucide-react'

export interface SelectOption {
  value: string | number
  label: string
}

export interface SelectProps {
  label?: string
  error?: string
  helperText?: string
  options?: (SelectOption | { value: string | number; label: string })[]
  value?: string | number
  defaultValue?: string | number
  onChange?: (e: { target: { value: string; name?: string } }) => void
  onValueChange?: (value: string | number) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  buttonClassName?: string
  dropdownClassName?: string
  id?: string
  name?: string
  size?: 'sm' | 'md'
  children?: React.ReactNode
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      className,
      buttonClassName,
      dropdownClassName,
      label,
      error,
      helperText,
      options,
      value,
      defaultValue,
      onChange,
      onValueChange,
      placeholder = 'Select option...',
      disabled = false,
      required = false,
      id,
      name,
      size = 'md',
      children,
    },
    ref
  ) => {
    const autoId = useId()
    const generatedId = id || autoId
    const containerRef = useRef<HTMLDivElement>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [openUpward, setOpenUpward] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Automatically check whether dropdown should open upwards to prevent modal overflow
    useEffect(() => {
      if (isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        
        // Check dialog or scrollable parent boundary
        const dialog = containerRef.current.closest('[role="dialog"]')
        let parentSpaceBelow = spaceBelow
        if (dialog) {
          const dialogRect = dialog.getBoundingClientRect()
          parentSpaceBelow = Math.min(spaceBelow, dialogRect.bottom - rect.bottom)
        }

        if (parentSpaceBelow < 230 && rect.top > 260 && rect.top > parentSpaceBelow) {
          setOpenUpward(true)
        } else {
          setOpenUpward(false)
        }
      }
    }, [isOpen])

    // Parse options from either `options` prop or `children` (<option> tags)
    const parsedOptions = useMemo<SelectOption[]>(() => {
      if (options && options.length > 0) {
        return options.map(opt => ({
          value: opt.value,
          label: opt.label || String(opt.value),
        }))
      }
      if (children) {
        const list: SelectOption[] = []
        React.Children.forEach(children, child => {
          if (React.isValidElement(child)) {
            const childProps = child.props as any
            list.push({
              value: childProps.value !== undefined ? childProps.value : childProps.children,
              label: String(childProps.children || childProps.value || ''),
            })
          }
        })
        return list
      }
      return []
    }, [options, children])

    // Internal value tracking (controlled or uncontrolled)
    const [internalValue, setInternalValue] = useState<string | number>(() => {
      if (value !== undefined) return value
      if (defaultValue !== undefined) return defaultValue
      return parsedOptions[0]?.value ?? ''
    })

    const currentValue = value !== undefined ? value : internalValue

    // Find current selected option
    const selectedOption = parsedOptions.find(
      opt => String(opt.value) === String(currentValue)
    )

    // Close on click outside
    useEffect(() => {
      const handleOutsideClick = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false)
        }
      }
      if (isOpen) {
        document.addEventListener('mousedown', handleOutsideClick)
      }
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick)
      }
    }, [isOpen])

    // Keyboard navigation (Escape to close)
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          setIsOpen(false)
        }
      }
      if (isOpen) {
        window.addEventListener('keydown', handleKeyDown)
      }
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      }
    }, [isOpen])

    const filteredOptions = useMemo(() => {
      if (!searchQuery.trim()) return parsedOptions
      const q = searchQuery.toLowerCase().trim()
      return parsedOptions.filter(opt => opt.label.toLowerCase().includes(q))
    }, [parsedOptions, searchQuery])

    const handleSelect = (val: string | number) => {
      if (disabled) return
      setInternalValue(val)
      setIsOpen(false)
      setSearchQuery('')
      if (onChange) {
        onChange({ target: { value: String(val), name } })
      }
      if (onValueChange) {
        onValueChange(val)
      }
    }

    return (
      <div
        ref={containerRef}
        data-kumo-component="Select"
        className={cn('w-full space-y-1 select-none relative', className)}
      >
        {label && (
          <label
            htmlFor={generatedId}
            className="block text-xs font-medium text-kumo-strong"
          >
            {label}
            {required && <span className="text-kumo-danger ml-0.5">*</span>}
          </label>
        )}

        <div className="relative">
          <button
            type="button"
            id={generatedId}
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                setIsOpen(prev => {
                  if (prev) setSearchQuery('')
                  return !prev
                })
              }
            }}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className={cn(
              'flex w-full items-center justify-between rounded-lg bg-background border border-border/80 px-3 text-left text-xs sm:text-sm text-foreground shadow-2xs transition-all cursor-pointer',
              size === 'sm' ? 'h-9 py-1' : 'h-10 py-2',
              'hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary',
              disabled && 'opacity-50 cursor-not-allowed bg-muted/20',
              error && 'border-rose-500 focus:ring-rose-500',
              buttonClassName
            )}
          >
            <span className="truncate block font-normal">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ml-1.5',
                isOpen && 'rotate-180 text-primary'
              )}
            />
          </button>

          {isOpen && (
            <div
              role="listbox"
              className={cn(
                'absolute left-0 z-50 max-h-56 sm:max-h-64 w-full min-w-full sm:min-w-[320px] max-w-[92vw] overflow-y-auto overscroll-contain rounded-lg border border-border bg-background p-1.5 shadow-2xl animate-in fade-in zoom-in-95 font-sans [scrollbar-width:thin]',
                openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
                dropdownClassName
              )}
            >
              {parsedOptions.length >= 4 && (
                <div className="sticky top-0 z-10 bg-background pb-1.5 mb-1 border-b border-border/60 px-1 pt-0.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search options..."
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-muted/40 border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}

              {filteredOptions.length === 0 ? (
                <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                  No matching options found
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredOptions.map(opt => {
                    const isSelected = String(opt.value) === String(currentValue)
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(opt.value)}
                        className={cn(
                          'w-full flex items-start justify-between rounded-md px-3 py-2 text-left text-xs sm:text-[13px] leading-snug transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-foreground hover:bg-muted/50 hover:text-foreground'
                        )}
                      >
                        <span className="whitespace-normal break-words flex-1 pr-2">
                          {opt.label}
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5 ml-1" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-[11px] text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-muted-foreground">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
