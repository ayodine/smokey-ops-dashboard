import React, { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, X, ChevronDown } from 'lucide-react'

export interface DateTimePickerProps {
  label?: string
  value?: string // Can be ISO string (YYYY-MM-DDTHH:mm), "YYYY-MM-DD HH:mm", or natural text
  onChange?: (dateTimeString: string, details?: { date: string; time: string }) => void
  placeholder?: string
  minDate?: string
  maxDate?: string
  timeSlots?: string[]
  required?: boolean
  disabled?: boolean
  className?: string
  helperText?: string
  confirmLabel?: string
}

const DEFAULT_TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:15', '09:30', '09:45',
  '10:00', '10:15', '10:30', '11:00', '11:30', '12:00',
  '12:30', '13:00', '13:30', '14:00', '14:30', '15:00',
  '15:30', '16:00', '16:30', '17:00', '17:30', '18:00',
  '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
]

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date and time...',
  minDate,
  maxDate,
  timeSlots = DEFAULT_TIME_SLOTS,
  required = false,
  disabled = false,
  className,
  helperText,
  confirmLabel = 'Continue',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const timeListRef = useRef<HTMLDivElement>(null)
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 440 })

  // Parse value into date and time
  const parsedState = useMemo(() => {
    if (!value) return { date: null as Date | null, time: '10:00', raw: '' }
    
    // Check if value contains time (HH:mm or PM/AM)
    let timePart = '10:00'
    let datePart: Date | null = null

    // Match 24h or 12h time
    const timeMatch = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10)
      const minutes = timeMatch[2]
      const mer = timeMatch[3]?.toUpperCase()
      if (mer === 'PM' && hours < 12) hours += 12
      if (mer === 'AM' && hours === 12) hours = 0
      timePart = `${String(hours).padStart(2, '0')}:${minutes}`
    }

    // Match YYYY-MM-DD
    const isoDateMatch = value.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (isoDateMatch) {
      const y = parseInt(isoDateMatch[1], 10)
      const m = parseInt(isoDateMatch[2], 10) - 1
      const d = parseInt(isoDateMatch[3], 10)
      datePart = new Date(y, m, d)
    } else {
      // Try natural date or Today/Tomorrow
      const lower = value.toLowerCase()
      if (lower.includes('today')) {
        datePart = new Date()
      } else if (lower.includes('tomorrow')) {
        const d = new Date()
        d.setDate(d.getDate() + 1)
        datePart = d
      } else {
        const fallback = new Date(value)
        if (!isNaN(fallback.getTime())) {
          datePart = fallback
        }
      }
    }

    return { date: datePart, time: timePart, raw: value }
  }, [value])

  const [selectedDate, setSelectedDate] = useState<Date | null>(() => parsedState.date)
  const [selectedTime, setSelectedTime] = useState<string>(() => parsedState.time)
  const [viewDate, setViewDate] = useState<Date>(() => parsedState.date || new Date())

  // Sync internal state when external value changes
  useEffect(() => {
    if (parsedState.date) {
      setSelectedDate(parsedState.date)
      setViewDate(parsedState.date)
    }
    if (parsedState.time) {
      setSelectedTime(parsedState.time)
    }
  }, [parsedState])

  // Position popover
  useEffect(() => {
    if (!isOpen || !containerRef.current) return
    const updatePosition = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const calWidth = Math.min(460, window.innerWidth - 24)
      const calHeight = 360
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

  // Scroll active time into view on open
  useEffect(() => {
    if (isOpen && timeListRef.current) {
      const activeTimeBtn = timeListRef.current.querySelector('[data-active="true"]') as HTMLElement | null
      if (activeTimeBtn) {
        activeTimeBtn.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }
  }, [isOpen])

  // Calendar calculations
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const calendarCells = []
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrevMonth - i)
    calendarCells.push({ date: d, day: daysInPrevMonth - i, isCurrentMonth: false })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i)
    calendarCells.push({ date: d, day: i, isCurrentMonth: true })
  }
  const totalCells = calendarCells.length <= 35 ? 35 : 42
  const remaining = totalCells - calendarCells.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    calendarCells.push({ date: d, day: i, isCurrentMonth: false })
  }

  const formatIsoDate = (d: Date): string => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const formatSummaryText = (d: Date, t: string): string => {
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' })
    const monthDay = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    return `${weekday}, ${monthDay} at ${t}`
  }

  const handleApply = () => {
    const targetDate = selectedDate || new Date()
    const dateStr = formatIsoDate(targetDate)
    const combinedString = `${dateStr} ${selectedTime}`
    onChange?.(combinedString, { date: dateStr, time: selectedTime })
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedDate(null)
    onChange?.('', { date: '', time: '' })
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 40 }, (_, i) => currentYear - 10 + i)

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
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'w-full h-10 px-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-xs sm:text-[13px] text-zinc-900 dark:text-zinc-100 flex items-center justify-between gap-2 cursor-pointer transition-colors shadow-2xs font-sans',
          isOpen && 'ring-2 ring-zinc-400/20 border-zinc-400 dark:border-zinc-600',
          disabled && 'opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800'
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className={cn('truncate', !selectedDate && !value && 'text-zinc-400 font-normal')}>
            {selectedDate
              ? formatSummaryText(selectedDate, selectedTime)
              : value || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {(selectedDate || value) && !required && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              title="Clear date and time"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
        </div>
      </button>

      {helperText && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">{helperText}</p>
      )}

      {/* Popover Card matching Reference UI */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={{ top: popoverCoords.top, left: popoverCoords.left, width: popoverCoords.width }}
          className="fixed rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-0 font-sans z-[100] animate-in fade-in zoom-in-95 select-none overflow-hidden"
        >
          {/* Main 2-column layout: Left Calendar + Right Time List */}
          <div className="flex divide-x divide-zinc-200 dark:divide-zinc-800">
            {/* Left Column: Calendar (Width ~60%) */}
            <div className="flex-1 p-4">
              {/* Header: Month / Year with arrows */}
              <div className="flex items-center justify-between pb-3 mb-2.5">
                <button
                  type="button"
                  onClick={() => setViewDate(new Date(year, month - 1, 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowYearPicker((p) => !p)}
                  className="inline-flex items-center gap-1 text-[13px] font-bold text-zinc-900 dark:text-zinc-100 hover:text-primary transition-colors cursor-pointer"
                >
                  <span>{monthName}</span>
                  <ChevronDown className={cn('w-3 h-3 text-zinc-400 transition-transform', showYearPicker && 'rotate-180')} />
                </button>

                <button
                  type="button"
                  onClick={() => setViewDate(new Date(year, month + 1, 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {showYearPicker ? (
                <div className="py-1">
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Select Year</div>
                  <div className="max-h-48 overflow-y-auto grid grid-cols-4 gap-1.5 pr-1">
                    {yearOptions.map((y) => (
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
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold'
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
                  {/* Days of Week (Sun Mon Tue Wed Thu Fri Sat) */}
                  <div className="grid grid-cols-7 text-center text-[11px] font-medium text-zinc-400 dark:text-zinc-500 pb-2">
                    <span>Sun</span>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
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
                          onClick={() => setSelectedDate(cell.date)}
                          className={cn(
                            'h-8 w-full flex items-center justify-center text-xs rounded-xl transition-colors cursor-pointer',
                            cell.isCurrentMonth
                              ? 'text-zinc-900 dark:text-zinc-100 font-normal'
                              : 'text-zinc-300 dark:text-zinc-700',
                            isSelected
                              ? 'bg-[#18181b] text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-xs'
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
            </div>

            {/* Right Column: Time Slots List (Scrollable, Width ~40%) */}
            <div
              ref={timeListRef}
              className="w-36 sm:w-40 p-3 max-h-[280px] overflow-y-auto space-y-1.5 [scrollbar-width:thin]"
            >
              {timeSlots.map((time) => {
                const isTimeActive = time === selectedTime
                return (
                  <button
                    key={time}
                    type="button"
                    data-active={isTimeActive}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      'w-full py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer',
                      isTimeActive
                        ? 'bg-[#18181b] text-white dark:bg-zinc-100 dark:text-zinc-900 border-[#18181b] dark:border-zinc-100 shadow-xs'
                        : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                    )}
                  >
                    {time}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bottom Confirmation Bar */}
          <div className="p-3.5 bg-zinc-50/70 dark:bg-zinc-850/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
            <div className="text-xs text-zinc-600 dark:text-zinc-300 truncate">
              {selectedDate ? (
                <span>
                  Selected for <strong className="text-zinc-900 dark:text-zinc-100">{formatSummaryText(selectedDate, selectedTime)}</strong>
                </span>
              ) : (
                <span>Please pick a date and time</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              {confirmLabel}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default DateTimePicker
