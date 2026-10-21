import React, { useState, useRef, useEffect, useId, useMemo } from 'react'
import { createPortal } from 'react-dom'
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
      size = 'sm',
      children,
    },
    ref
  ) => {
    const autoId = useId()
    const generatedId = id || autoId
    const containerRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [dropdownCoords, setDropdownCoords] = useState<{
      top: number
      left: number
      width: number
      maxHeight: number
      openUp: boolean
    }>({
      top: 0,
      left: 0,
      width: 240,
      maxHeight: 260,
      openUp: false,
    })

    // Calculate fixed viewport coordinates for portal dropdown
    const updateCoords = () => {
      if (!buttonRef.current) return
      const rect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const menuHeight = 260
      const openUp = spaceBelow < 220 && spaceAbove > spaceBelow

      const targetWidth = Math.min(Math.max(rect.width, 240), window.innerWidth - 24)

      let left = rect.left
      if (left + targetWidth > window.innerWidth - 12) {
        left = Math.max(12, rect.right - targetWidth)
      }
      if (left < 12) left = 12

      const top = openUp ? Math.max(12, rect.top - menuHeight - 4) : rect.bottom + 4
      const availableHeight = openUp
        ? Math.min(menuHeight, rect.top - 16)
        : Math.min(menuHeight, spaceBelow - 16)

      setDropdownCoords({
        top,
        left,
        width: targetWidth,
        maxHeight: Math.max(140, availableHeight),
        openUp,
      })
    }

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

    // Listen for scroll, resize, escape, outside click when open
    useEffect(() => {
      if (!isOpen) return

      updateCoords()

      const handleScroll = () => {
        updateCoords()
      }
      const handleResize = () => {
        updateCoords()
      }
      const handleOutsideClick = (e: MouseEvent) => {
        const target = e.target as Node
        if (
          containerRef.current &&
          !containerRef.current.contains(target) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(target)
        ) {
          setIsOpen(false)
          setSearchQuery('')
        }
      }
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false)
          setSearchQuery('')
        }
      }

      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)
      document.addEventListener('mousedown', handleOutsideClick)
      window.addEventListener('keydown', handleKeyDown)

      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
        document.removeEventListener('mousedown', handleOutsideClick)
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
        className={cn('w-full space-y-1.5 select-none relative', className)}
      >
        {label && (
          <label
            htmlFor={generatedId}
            className="block text-xs font-medium text-kumo-strong leading-4"
          >
            {label}
            {required && <span className="text-kumo-danger ml-0.5">*</span>}
          </label>
        )}

        <div className="relative">
          <button
            ref={buttonRef}
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
              'flex w-full items-center justify-between rounded-lg bg-background border border-border/80 pl-3.5 pr-3 text-left text-xs sm:text-sm text-foreground shadow-2xs transition-all cursor-pointer select-none',
              size === 'sm' ? 'h-9 py-1.5 text-xs' : 'h-9 sm:h-10 py-1.5 sm:py-2 text-xs sm:text-sm',
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
                'w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ml-2.5 mr-0.5',
                isOpen && 'rotate-180 text-primary'
              )}
            />
          </button>

          {isOpen &&
            createPortal(
              <div
                ref={dropdownRef}
                role="listbox"
                style={{
                  position: 'fixed',
                  top: `${dropdownCoords.top}px`,
                  left: `${dropdownCoords.left}px`,
                  width: `${dropdownCoords.width}px`,
                  maxHeight: `${dropdownCoords.maxHeight}px`,
                  zIndex: 9999,
                }}
                className={cn(
                  'overflow-y-auto overscroll-contain rounded-lg border border-border bg-background p-1.5 shadow-2xl animate-in fade-in zoom-in-95 font-sans [scrollbar-width:thin]',
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
              </div>,
              document.body
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
