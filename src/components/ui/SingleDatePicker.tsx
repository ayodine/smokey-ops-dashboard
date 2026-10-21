import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'

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
  const containerRef = useRef<HTMLDivElement>(null)

  // Parse initial selected date
  const parseDate = (d?: string): Date | null => {
    if (!d) return null
    const parts = d.split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const dt = new Date(year, month, day)
      return isNaN(dt.getTime()) ? null : dt
    }
    const fallback = new Date(d)
    return isNaN(fallback.getTime()) ? null : fallback
  }

  const selectedDate = parseDate(value)
  const [viewDate, setViewDate] = useState<Date>(() => selectedDate || new Date(2026, 8, 25))

  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate)
    }
  }, [value])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
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
  }

  const handleSelectToday = () => {
    const now = new Date(2026, 8, 25) // Anchor to operations period or current date
    handleSelectDay(now)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.('')
  }

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
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          'w-full h-9 px-3 rounded-lg border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-xs text-kumo-strong flex items-center justify-between gap-2 cursor-pointer transition-colors shadow-2xs',
          isOpen && 'ring-2 ring-black/20 border-black dark:ring-white/20 dark:border-white',
          disabled && 'opacity-50 cursor-not-allowed bg-kumo-surface'
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
          <span className={cn('truncate', !selectedDate && 'text-kumo-subtle/70 font-normal')}>
            {selectedDate ? formatDisplay(selectedDate) : placeholder}
          </span>
        </div>

        {selectedDate && !required && !disabled && (
          <span
            onClick={handleClear}
            className="p-0.5 rounded hover:bg-kumo-control text-kumo-subtle hover:text-kumo-strong transition-colors"
            title="Clear date"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {helperText && (
        <p className="text-[11px] text-kumo-subtle mt-1">{helperText}</p>
      )}

      {/* Popover Calendar */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-72 rounded-xl border border-kumo-line bg-kumo-base shadow-xl p-3 font-sans z-50 animate-in fade-in zoom-in-95">
          {/* Month Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-kumo-line">
            <span className="text-xs font-semibold text-kumo-strong">
              {monthName}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month - 1, 1))}
                className="w-6 h-6 flex items-center justify-center rounded-md border border-kumo-line hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-strong cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
                className="w-6 h-6 flex items-center justify-center rounded-md border border-kumo-line hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-strong cursor-pointer"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 text-center text-[10px] font-medium text-kumo-subtle pb-1">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
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
                    'h-7 w-full flex items-center justify-center text-xs rounded-md transition-colors cursor-pointer',
                    cell.isCurrentMonth
                      ? 'text-kumo-strong font-normal'
                      : 'text-kumo-subtle/30',
                    isSelected
                      ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-xs'
                      : 'hover:bg-kumo-tint'
                  )}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>

          {/* Footer Quick Action */}
          <div className="pt-2 mt-2 border-t border-kumo-line flex items-center justify-between">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[11px] font-medium text-kumo-subtle hover:text-kumo-strong cursor-pointer underline"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-medium text-kumo-subtle hover:text-kumo-strong cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SingleDatePicker
