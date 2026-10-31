import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, ChevronDown } from 'lucide-react'

export interface SingleDatePickerProps {
  label?: string
  value?: string // YYYY-MM-DD
  onChange?: (date: string) => void
  placeholder?: string
  minDate?: string
  maxDate?: string
  required?: boolean
  disabled?: boolean
  className?: string
  helperText?: string
}

export const SingleDatePicker: React.FC<SingleDatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date...',
  minDate,
  maxDate,
  required = false,
  disabled = false,
  className,
  helperText,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 288 })

  // Parse initial selected date safely (handles YYYY-MM-DD, ISO timestamps, or space-separated datetimes)
  const parseDate = (d?: string): Date | null => {
    if (!d) return null
    const clean = d.trim().split('T')[0].split(' ')[0]
    const parts = clean.split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const dt = new Date(year, month, day)
        return isNaN(dt.getTime()) ? null : dt
      }
    }
    const fallback = new Date(d)
    return isNaN(fallback.getTime()) ? null : fallback
  }

  const selectedDate = parseDate(value)
  const [viewDate, setViewDate] = useState<Date>(() => selectedDate || new Date())

  useEffect(() => {
    const parsed = parseDate(value)
    if (parsed) {
      setViewDate(parsed)
    }
  }, [value])

  // Position popover relative to trigger
  useEffect(() => {
    if (!isOpen || !containerRef.current) return
    const updatePosition = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const calWidth = 288
      const calHeight = 310
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - calWidth - 12))
      const top = rect.bottom + 6 + calHeight > window.innerHeight
        ? Math.max(12, rect.top - calHeight - 6)
        : rect.bottom + 6
      setPopoverCoords({ top, left, width: calWidth })
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!popoverRef.current || !popoverRef.current.contains(target))
      ) {
        setIsOpen(false)
        setShowYearPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Calendar calculations
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const calendarCells = []
  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrevMonth - i)
    calendarCells.push({ date: d, day: daysInPrevMonth - i, isCurrentMonth: false })
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i)
    calendarCells.push({ date: d, day: i, isCurrentMonth: true })
  }
  // Next month leading days (fill to 35 or 42 cells)
  const totalCells = calendarCells.length <= 35 ? 35 : 42
  const remaining = totalCells - calendarCells.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    calendarCells.push({ date: d, day: i, isCurrentMonth: false })
  }

  const formatDateStr = (d: Date): string => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const formatDisplay = (d: Date): string => {
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const handleSelectDay = (d: Date) => {
    const str = formatDateStr(d)
    onChange?.(str)
    setIsOpen(false)
    setShowYearPicker(false)
  }

  const handleSelectToday = () => {
    const now = new Date()
    handleSelectDay(now)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.('')
  }

  // Quick years list for selection (last 75 years down to next 5 years)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 80 }, (_, i) => currentYear - 70 + i).reverse()

  return (
    <div ref={containerRef} className={cn('relative font-sans select-none', className)}>
      {label && (
        <label className="block text-xs font-medium text-kumo-default mb-1">
          {label}
          {required && <span className="text-kumo-danger ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setIsOpen(prev => !prev)
          setShowYearPicker(false)
        }}
        className={cn(
          'w-full h-10 px-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-xs sm:text-[13px] text-zinc-900 dark:text-zinc-100 flex items-center justify-between gap-2 cursor-pointer transition-colors shadow-2xs font-sans',
          isOpen && 'ring-2 ring-zinc-400/20 border-zinc-400 dark:border-zinc-600',
          disabled && 'opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800'
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className={cn('truncate', !selectedDate && 'text-zinc-400 font-normal')}>
            {selectedDate ? formatDisplay(selectedDate) : placeholder}
          </span>
        </div>

        {selectedDate && !required && !disabled && (
          <span
            onClick={handleClear}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            title="Clear date"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {helperText && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">{helperText}</p>
      )}

      {/* Popover Calendar */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={{ top: popoverCoords.top, left: popoverCoords.left, width: popoverCoords.width }}
          className="fixed rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-4 font-sans z-[100] animate-in fade-in zoom-in-95 select-none"
        >
          {/* Month Header */}
          <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setShowYearPicker(p => !p)}
              className="flex items-center gap-1.5 text-[14px] font-bold text-zinc-900 dark:text-zinc-100 hover:text-primary transition-colors cursor-pointer text-left"
              title="Click to change year"
            >
              <span>{monthName}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-400 transition-transform", showYearPicker && "rotate-180")} />
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month - 1, 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Year Picker Modal Overlay */}
          {showYearPicker ? (
            <div className="py-1">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Select Year</div>
              <div className="max-h-52 overflow-y-auto grid grid-cols-4 gap-1.5 pr-1">
                {yearOptions.map(y => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setViewDate(new Date(y, month, 1))
                      setShowYearPicker(false)
                    }}
                    className={cn(
                      'py-1.5 px-1 text-xs rounded-lg transition-colors cursor-pointer font-medium',
                      y === year
                        ? 'bg-[#c0201f] text-white font-bold shadow-xs'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Days of Week */}
              <div className="grid grid-cols-7 text-center text-[12px] font-medium text-zinc-400 dark:text-zinc-500 pb-2">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-y-1.5 text-center text-xs">
                {calendarCells.map((cell, idx) => {
                  const isSelected = selectedDate &&
                    cell.date.getFullYear() === selectedDate.getFullYear() &&
                    cell.date.getMonth() === selectedDate.getMonth() &&
                    cell.date.getDate() === selectedDate.getDate()

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDay(cell.date)}
                      className={cn(
                        'h-8 w-full flex items-center justify-center text-xs rounded-lg transition-colors cursor-pointer',
                        cell.isCurrentMonth
                          ? 'text-zinc-900 dark:text-zinc-100 font-normal'
                          : 'text-zinc-300 dark:text-zinc-700',
                        isSelected
                          ? 'bg-[#c0201f] text-white font-semibold shadow-xs'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      )}
                    >
                      {cell.day}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Footer Quick Action */}
          <div className="pt-3 mt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#c0201f] hover:bg-[#a01817] rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              Apply
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default SingleDatePicker
