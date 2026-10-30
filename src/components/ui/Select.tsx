import React, { useState, useRef, useEffect, useId, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { ChevronDown, Check, Search } from 'lucide-react'

export interface SelectOption {
  value: string | number
  label: string
  group?: string
  disabled?: boolean
  description?: string
  icon?: React.ReactNode
}

export interface SelectGroup {
  label: string
  options: SelectOption[]
}

export interface SelectProps {
  label?: string
  error?: string
  helperText?: string
  options?: (SelectOption | { value: string | number; label: string; group?: string; disabled?: boolean })[]
  groups?: SelectGroup[]
  value?: string | number
  defaultValue?: string | number
  onChange?: (e: { target: { value: string; name?: string } }) => void
  onValueChange?: (value: string | number) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  searchable?: boolean
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
      groups,
      value,
      defaultValue,
      onChange,
      onValueChange,
      placeholder = 'Select option...',
      disabled = false,
      required = false,
      searchable = false,
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
      maxHeight: 320,
      openUp: false,
    })

    // Calculate fixed viewport coordinates for portal dropdown
    const updateCoords = () => {
      if (!buttonRef.current) return
      const rect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const menuHeight = 320
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
        maxHeight: Math.max(160, availableHeight),
        openUp,
      })
    }

    // Parse options and groups from props or children
    const groupedData = useMemo<SelectGroup[]>(() => {
      // 1. Direct groups prop
      if (groups && groups.length > 0) {
        return groups
      }

      // 2. Options prop with potential group properties
      if (options && options.length > 0) {
        const hasAnyGroup = options.some(opt => 'group' in opt && opt.group)
        if (hasAnyGroup) {
          const groupMap = new Map<string, SelectOption[]>()
          const ungrouped: SelectOption[] = []

          options.forEach(opt => {
            const item: SelectOption = {
              value: opt.value,
              label: opt.label || String(opt.value),
              disabled: (opt as SelectOption).disabled,
              description: (opt as SelectOption).description,
              icon: (opt as SelectOption).icon,
            }
            const gName = (opt as SelectOption).group
            if (gName) {
              if (!groupMap.has(gName)) groupMap.set(gName, [])
              groupMap.get(gName)!.push(item)
            } else {
              ungrouped.push(item)
            }
          })

          const result: SelectGroup[] = []
          if (ungrouped.length > 0) {
            result.push({ label: '', options: ungrouped })
          }
          groupMap.forEach((opts, gName) => {
            result.push({ label: gName, options: opts })
          })
          return result
        }

        // Flat options without grouping
        return [
          {
            label: '',
            options: options.map(opt => ({
              value: opt.value,
              label: opt.label || String(opt.value),
              disabled: (opt as SelectOption).disabled,
              description: (opt as SelectOption).description,
              icon: (opt as SelectOption).icon,
            })),
          },
        ]
      }

      // 3. Children parsing (<optgroup> and <option>)
      if (children) {
        const result: SelectGroup[] = []
        const currentUngrouped: SelectOption[] = []

        React.Children.forEach(children, child => {
          if (React.isValidElement(child)) {
            if (child.type === 'optgroup') {
              const groupLabel = (child.props as any).label || ''
              const groupOptions: SelectOption[] = []
              React.Children.forEach((child.props as any).children, subChild => {
                if (React.isValidElement(subChild)) {
                  const subProps = subChild.props as any
                  groupOptions.push({
                    value: subProps.value !== undefined ? subProps.value : subProps.children,
                    label: String(subProps.children || subProps.value || ''),
                    disabled: subProps.disabled,
                  })
                }
              })
              if (groupOptions.length > 0) {
                result.push({ label: groupLabel, options: groupOptions })
              }
            } else {
              const childProps = child.props as any
              currentUngrouped.push({
                value: childProps.value !== undefined ? childProps.value : childProps.children,
                label: String(childProps.children || childProps.value || ''),
                disabled: childProps.disabled,
              })
            }
          }
        })

        if (currentUngrouped.length > 0) {
          result.unshift({ label: '', options: currentUngrouped })
        }
        return result
      }

      return []
    }, [groups, options, children])

    // Flatten all options to determine selected item and value lookup
    const allOptions = useMemo<SelectOption[]>(() => {
      return groupedData.flatMap(g => g.options)
    }, [groupedData])

    // Internal value tracking (controlled or uncontrolled)
    const [internalValue, setInternalValue] = useState<string | number>(() => {
      if (value !== undefined) return value
      if (defaultValue !== undefined) return defaultValue
      return allOptions[0]?.value ?? ''
    })

    const currentValue = value !== undefined ? value : internalValue

    // Find current selected option
    const selectedOption = allOptions.find(
      opt => String(opt.value) === String(currentValue)
    )

    // Listen for scroll, resize, escape, outside click when open
    useEffect(() => {
      if (!isOpen) return

      updateCoords()

      const handleScroll = () => updateCoords()
      const handleResize = () => updateCoords()
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

    // Filter options per group based on search query
    const filteredGroups = useMemo<SelectGroup[]>(() => {
      if (!searchQuery.trim()) return groupedData
      const q = searchQuery.toLowerCase().trim()

      return groupedData
        .map(group => ({
          ...group,
          options: group.options.filter(
            opt =>
              opt.label.toLowerCase().includes(q) ||
              (opt.description && opt.description.toLowerCase().includes(q))
          ),
        }))
        .filter(group => group.options.length > 0)
    }, [groupedData, searchQuery])

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
            className="block text-[12px] font-semibold text-kumo-strong leading-4"
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
              'flex w-full items-center justify-between rounded-lg bg-kumo-base border border-kumo-line px-3.5 text-left text-[13px] text-kumo-strong shadow-2xs transition-colors cursor-pointer select-none font-sans',
              size === 'sm' ? 'h-9 text-[13px]' : 'h-10 text-[13px]',
              'hover:bg-kumo-canvas/40 focus:outline-none focus:border-kumo-brand focus:ring-1 focus:ring-kumo-brand',
              disabled && 'opacity-50 cursor-not-allowed bg-kumo-canvas/60',
              error && 'border-rose-500 focus:ring-rose-500',
              buttonClassName
            )}
          >
            <span className="truncate block font-normal text-kumo-strong">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-kumo-subtle shrink-0 transition-transform duration-200 ml-2.5 mr-0.5',
                isOpen && 'rotate-180 text-kumo-strong'
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
                  'overflow-y-auto overscroll-contain rounded-xl border border-kumo-line bg-kumo-base py-1.5 shadow-xl animate-in fade-in zoom-in-95 font-sans [scrollbar-width:thin]',
                  dropdownClassName
                )}
              >
                {/* Search bar when searchable or large list */}
                {(searchable || allOptions.length >= 8) && (
                  <div className="sticky top-0 z-10 bg-kumo-base pb-2 mb-1 border-b border-kumo-line/60 px-3 pt-1.5">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-kumo-subtle pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search options..."
                        className="w-full pl-9 pr-3 py-2 text-[13px] bg-kumo-canvas/50 border border-kumo-line rounded-lg focus:outline-none focus:border-kumo-brand text-kumo-strong placeholder:text-kumo-subtle/70"
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )}

                {filteredGroups.length === 0 ? (
                  <div className="px-4 py-3 text-[13px] text-kumo-subtle text-center">
                    No matching options found
                  </div>
                ) : (
                  <div className="divide-y divide-kumo-line/50">
                    {filteredGroups.map((group, groupIdx) => (
                      <div key={group.label || groupIdx} className={groupIdx > 0 ? 'pt-1.5' : ''}>
                        {/* Group Header matching inspiration: ACCOUNT-LEVEL, RESOURCE-SPECIFIC */}
                        {group.label && (
                          <div className="px-4 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-kumo-subtle select-none">
                            {group.label}
                          </div>
                        )}

                        {/* Options in group */}
                        <div className="space-y-0.5 px-1.5 pb-1">
                          {group.options.map(opt => {
                            const isSelected = String(opt.value) === String(currentValue)
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                disabled={opt.disabled}
                                onClick={() => !opt.disabled && handleSelect(opt.value)}
                                className={cn(
                                  'w-full flex items-center justify-between rounded-lg px-3.5 py-2.5 text-left text-[13px] transition-colors select-none font-sans',
                                  opt.disabled
                                    ? 'text-kumo-subtle/60 cursor-not-allowed opacity-60'
                                    : 'cursor-pointer hover:bg-kumo-tint/60',
                                  isSelected
                                    ? 'text-kumo-strong font-medium bg-kumo-tint/40'
                                    : 'text-kumo-strong font-normal'
                                )}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                                  <div className="min-w-0">
                                    <span className="block font-normal text-kumo-strong leading-snug">{opt.label}</span>
                                    {opt.description && (
                                      <span className="text-[12px] text-kumo-subtle block font-normal mt-0.5 leading-tight">
                                        {opt.description}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Right Checkmark matching inspiration */}
                                {isSelected && (
                                  <Check className="w-4 h-4 text-kumo-strong shrink-0 ml-auto stroke-[2.2]" />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>,
              document.body
            )}
        </div>

        {error ? (
          <p className="text-[13px] text-kumo-danger font-normal">{error}</p>
        ) : helperText ? (
          <p className="text-[13px] text-kumo-subtle font-normal">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
