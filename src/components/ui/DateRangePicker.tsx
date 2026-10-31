import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsUpDown, 
  Plus, 
  RotateCw 
} from 'lucide-react'

export interface DateRange {
  start: Date | null
  end: Date | null
  presetKey?: string
}

export const isWithinDateRange = (
  rawDate: string | Date | null | undefined, 
  range: DateRange | null | undefined
): boolean => {
  if (!range) return true
  if (!range.presetKey || range.presetKey === 'all') return true
  if (!rawDate) return true
  const itemDate = new Date(rawDate)
  const itemTime = itemDate.getTime()
  if (isNaN(itemTime)) return true

  const baseTime = new Date(2026, 9, 21, 23, 59, 59).getTime()
  const now = Math.max(baseTime, Date.now())

  if (range.presetKey === 'today') {
    return itemDate.toDateString() === new Date(now).toDateString()
  }
  if (range.presetKey === '30m') {
    return itemTime >= now - 30 * 60 * 1000
  }
  if (range.presetKey === '1h') {
    return itemTime >= now - 60 * 60 * 1000
  }
  if (range.presetKey === '6h') {
    return itemTime >= now - 6 * 60 * 60 * 1000
  }
  if (range.presetKey === '12h') {
    return itemTime >= now - 12 * 60 * 60 * 1000
  }
  if (range.presetKey === '24h') {
    return itemTime >= now - 24 * 60 * 60 * 1000
  }
  if (range.presetKey === '7d' || range.presetKey === '7days') {
    return itemTime >= now - 7 * 24 * 60 * 60 * 1000
  }
  if (range.presetKey === '30d' || range.presetKey === '30days') {
    return itemTime >= now - 30 * 24 * 60 * 60 * 1000
  }
  if (range.start && range.end) {
    const startLimit = new Date(range.start).setHours(0, 0, 0, 0)
    const endLimit = new Date(range.end).setHours(23, 59, 59, 999)
    return itemTime >= startLimit && itemTime <= endLimit
  }
  return true
}

export interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange) => void
  className?: string
  align?: 'left' | 'right'
}

const PRESETS = [
  { id: 'all', label: 'All Records', durationHours: 0 },
  { id: 'today', label: 'Today', durationHours: 24 },
  { id: '30m', label: 'Last 30 minutes', durationHours: 0.5 },
  { id: '1h', label: 'Last 1 hour', durationHours: 1 },
  { id: '6h', label: 'Last 6 hours', durationHours: 6 },
  { id: '12h', label: 'Last 12 hours', durationHours: 12 },
  { id: '24h', label: 'Last 24 hours', durationHours: 24 },
  { id: '7d', label: 'Last 7 days', durationHours: 24 * 7 },
  { id: '30d', label: 'Last 30 days', durationHours: 24 * 30 },
]

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className,
  align = 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activePreset, setActivePreset] = useState<string>(value?.presetKey || 'all')
  const [customRangeQuery, setCustomRangeQuery] = useState('')
  const triggerRef = useRef<HTMLDivElement>(null)
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  
  // Current viewing month for calendar
  const [viewDate, setViewDate] = useState<Date>(value?.start || new Date(2026, 9, 21)) // October 2026
  const [startDate, setStartDate] = useState<Date>(value?.start || new Date(2026, 9, 1, 0, 0, 0))
  const [endDate, setEndDate] = useState<Date>(value?.end || new Date(2026, 9, 21, 23, 59, 59))
  const [isSelectingEnd, setIsSelectingEnd] = useState<boolean>(false)
  const [hoverDate, setHoverDate] = useState<Date | null>(null)

  // Sync with value prop if provided
  useEffect(() => {
    if (value) {
      if (value.start) {
        setStartDate(value.start)
        setViewDate(value.start)
      }
      if (value.end) setEndDate(value.end)
      if (value.presetKey) setActivePreset(value.presetKey)
    }
  }, [value])

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return
    const updatePosition = () => {
      if (!triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()
      const popoverWidth = Math.min(540, window.innerWidth - 24)
      const popoverHeight = 450
      const rawLeft = align === 'left' ? rect.left : rect.right - popoverWidth
      const clampedLeft = Math.max(12, Math.min(rawLeft, window.innerWidth - popoverWidth - 12))
      const rawTop = rect.bottom + 8
      const clampedTop = rawTop + popoverHeight > window.innerHeight
        ? Math.max(12, window.innerHeight - popoverHeight - 12)
        : rawTop
      setPopoverCoords({ top: clampedTop, left: clampedLeft })
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, align])

  // Timezone selection
  const [selectedTimezone, setSelectedTimezone] = useState('West Africa Time (GMT+1)')

  // Format date helper: YYYY-MM-DD HH:mm
  const formatDateTime = (d: Date) => {
    if (!d || isNaN(d.getTime())) return ''
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const mins = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${mins}`
  }

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate()
  }

  const handleSelectPreset = (presetId: string) => {
    setActivePreset(presetId)
    setIsSelectingEnd(false)
    setHoverDate(null)
    if (presetId === 'all') {
      const start = new Date(2026, 0, 1, 0, 0, 0)
      const end = new Date(2026, 11, 31, 23, 59, 59)
      setStartDate(start)
      setEndDate(end)
      return
    }
    const preset = PRESETS.find(p => p.id === presetId)
    if (preset) {
      const baseTime = new Date(2026, 9, 21, 23, 59, 59).getTime()
      const now = new Date(Math.max(baseTime, Date.now()))
      const start = new Date(now.getTime() - preset.durationHours * 60 * 60 * 1000)
      setStartDate(start)
      setEndDate(now)
    }
  }

  const handleApply = () => {
    setIsSelectingEnd(false)
    setHoverDate(null)
    setIsOpen(false)
    onChange?.({
      start: startDate,
      end: endDate,
      presetKey: activePreset === 'custom' ? undefined : activePreset
    })
  }

  // Generate calendar days for October 2026
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  // Days in month
  const firstDayOfWeek = new Date(year, month, 1).getDay() // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  // Calendar cells
  const calendarCells: { day: number; isCurrentMonth: boolean; date: Date }[] = []
  
  // Prev month padding
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    calendarCells.push({
      day: d,
      isCurrentMonth: false,
      date: new Date(year, month - 1, d)
    })
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i)
    })
  }

  // Next month padding
  const remainingCells = 35 - calendarCells.length
  for (let i = 1; i <= (remainingCells > 0 ? remainingCells : 42 - calendarCells.length); i++) {
    calendarCells.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i)
    })
  }

  // Two-click range selection
  const handleDayClick = (cellDate: Date) => {
    setActivePreset('custom')
    const clickedMidnight = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate(), 0, 0, 0)

    if (!isSelectingEnd) {
      // Step 1: First click sets start date
      const endOfDay = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate(), 23, 59, 59)
      setStartDate(clickedMidnight)
      setEndDate(endOfDay)
      setIsSelectingEnd(true)
      setHoverDate(null)
      onChange?.({
        start: clickedMidnight,
        end: endOfDay,
        presetKey: 'custom'
      })
    } else {
      // Step 2: Second click sets end date
      let nextStart = startDate
      let nextEnd = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate(), 23, 59, 59)
      if (clickedMidnight.getTime() < startDate.getTime()) {
        // Earlier than start, swap
        nextStart = clickedMidnight
        nextEnd = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 23, 59, 59)
      }
      setStartDate(nextStart)
      setEndDate(nextEnd)
      setIsSelectingEnd(false)
      setHoverDate(null)
      onChange?.({
        start: nextStart,
        end: nextEnd,
        presetKey: 'custom'
      })
    }
  }

  // Calculate effective range preview (including hover when selecting)
  const effectiveStart = isSelectingEnd && hoverDate && hoverDate.getTime() < startDate.getTime() 
    ? new Date(hoverDate.getFullYear(), hoverDate.getMonth(), hoverDate.getDate(), 0, 0, 0)
    : startDate

  const effectiveEnd = isSelectingEnd && hoverDate
    ? (hoverDate.getTime() < startDate.getTime()
        ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 23, 59, 59)
        : new Date(hoverDate.getFullYear(), hoverDate.getMonth(), hoverDate.getDate(), 23, 59, 59))
    : endDate

  const formatShortDate = (d: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${d.getDate()} ${months[d.getMonth()]}`
  }

  const activePresetObj = PRESETS.find(p => p.id === activePreset)
  const displayLabel = activePresetObj && activePreset !== 'custom'
    ? activePresetObj.label 
    : isSameDay(startDate, endDate)
      ? `${formatShortDate(startDate)} ${startDate.getFullYear()}`
      : `${formatShortDate(startDate)} - ${formatShortDate(endDate)} ${endDate.getFullYear()}`

  return (
    <div ref={triggerRef} className={cn('relative inline-block font-sans select-none', className)}>
      {/* Trigger Button Group matching Screenshot */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={cn(
            'h-10 px-3.5 rounded-lg border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-xs sm:text-sm font-medium text-kumo-strong flex items-center gap-2 cursor-pointer transition-colors shadow-2xs',
            isOpen && 'ring-2 ring-black/20 border-black dark:ring-white/20 dark:border-white',
            activePreset === 'custom' && 'border-black/50 bg-black/5 dark:border-white/50 dark:bg-white/5'
          )}
        >
          <CalendarIcon className={cn('w-4 h-4 shrink-0', activePreset === 'custom' ? 'text-black dark:text-white' : 'text-kumo-subtle')} />
          <span>{displayLabel}</span>
          {activePreset === 'custom' && (
            <span className="w-2 h-2 rounded-full bg-black dark:bg-white shrink-0" title="Custom date range active" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className="h-10 w-9 rounded-lg border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-strong flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
          title="Add range filter"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleApply()}
          className="h-10 w-9 rounded-lg border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-strong flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
          title="Apply current range"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Popover Card matching Screenshot exactly */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[90]" 
            onClick={() => {
              setIsSelectingEnd(false)
              setHoverDate(null)
              setIsOpen(false)
            }} 
          />
          <div
            style={{ top: popoverCoords.top, left: popoverCoords.left }}
            className="fixed w-[540px] max-w-[95vw] rounded-2xl border border-kumo-line bg-kumo-base shadow-2xl p-4 font-sans space-y-4 z-[100] animate-in fade-in zoom-in-95"
          >
            {/* Popover caret pointing up */}
            <div className="absolute -top-2 left-24 w-3.5 h-3.5 bg-kumo-base border-t border-l border-kumo-line rotate-45" />

            {/* Top custom range quick input */}
            <div>
              <input
                type="text"
                placeholder="Custom range: 3h, 3 hours, 7d, 30d..."
                value={customRangeQuery}
                onChange={(e) => {
                  const val = e.target.value
                  setCustomRangeQuery(val)
                  const trimmed = val.trim().toLowerCase()
                  const foundPreset = PRESETS.find(p => p.id === trimmed)
                  if (foundPreset) {
                    handleSelectPreset(foundPreset.id)
                  }
                }}
                className="w-full px-3 py-2 text-xs text-kumo-strong bg-kumo-base border border-kumo-line rounded-lg focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white placeholder:text-kumo-subtle font-sans"
              />
            </div>

            {/* Selection Status Prompt */}
            {isSelectingEnd && (
              <div className="px-3 py-1.5 bg-black/5 dark:bg-white/10 border border-black/15 dark:border-white/15 rounded-lg text-xs text-black dark:text-white font-medium flex items-center justify-between">
                <span>Click a second date on the calendar to set your end date</span>
                <span className="text-[11px] underline cursor-pointer" onClick={() => setIsSelectingEnd(false)}>Done</span>
              </div>
            )}

            {/* Main 2-column section: Left Calendar, Right Presets */}
            <div className="grid grid-cols-12 gap-4">
              {/* Left Calendar (7 cols) */}
              <div className="col-span-7 space-y-3">
                {/* Month header with prev/next buttons */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-kumo-strong">
                    {monthName}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setViewDate(new Date(year, month - 1, 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-kumo-line hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-strong cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewDate(new Date(year, month + 1, 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-kumo-line hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-strong cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Day of week headers */}
                <div className="grid grid-cols-7 text-center text-[11px] font-medium text-kumo-subtle">
                  <span>Su</span>
                  <span>Mo</span>
                  <span>Tu</span>
                  <span>We</span>
                  <span>Th</span>
                  <span>Fr</span>
                  <span>Sa</span>
                </div>

                {/* Day Numbers Grid */}
                <div 
                  className="grid grid-cols-7 gap-y-1 text-center text-xs"
                  onMouseLeave={() => setHoverDate(null)}
                >
                  {calendarCells.map((cell, idx) => {
                    const cellTime = new Date(cell.date.getFullYear(), cell.date.getMonth(), cell.date.getDate()).getTime()
                    const startTime = new Date(effectiveStart.getFullYear(), effectiveStart.getMonth(), effectiveStart.getDate()).getTime()
                    const endTime = new Date(effectiveEnd.getFullYear(), effectiveEnd.getMonth(), effectiveEnd.getDate()).getTime()

                    const isStart = cellTime === startTime
                    const isEnd = cellTime === endTime
                    const isBetween = cellTime > startTime && cellTime < endTime
                    const isSingleDay = startTime === endTime

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleDayClick(cell.date)}
                        onMouseEnter={() => {
                          if (isSelectingEnd) {
                            setHoverDate(cell.date)
                          }
                        }}
                        className={cn(
                          'h-8 w-full flex items-center justify-center text-xs transition-colors cursor-pointer',
                          cell.isCurrentMonth
                            ? 'text-kumo-strong'
                            : 'text-kumo-subtle/30',
                          (isStart || isEnd)
                            ? cn(
                                'bg-[#c0201f] text-white font-semibold shadow-xs',
                                isSingleDay 
                                  ? 'rounded-lg' 
                                  : isStart 
                                    ? 'rounded-l-lg' 
                                    : 'rounded-r-lg'
                              )
                            : isBetween
                              ? 'bg-[#c0201f]/10 text-[#c0201f] font-medium rounded-none'
                              : 'hover:bg-kumo-tint rounded-lg'
                        )}
                      >
                        {cell.day}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Right Presets List (5 cols) */}
              <div className="col-span-5 border-l border-kumo-line pl-3 space-y-1">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    className={cn(
                      'w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer font-sans',
                      activePreset === p.id
                        ? 'bg-black/10 text-black font-semibold dark:bg-white/15 dark:text-white'
                        : 'text-kumo-default hover:bg-kumo-tint hover:text-kumo-strong'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Row: Start and End Datetime Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-kumo-line">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-kumo-subtle block">Start</label>
                <div className="flex items-center gap-2 h-9 px-2.5 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong">
                  <CalendarIcon className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />
                  <span className="font-mono text-xs">{formatDateTime(startDate)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-kumo-subtle block">End</label>
                <div className="flex items-center gap-2 h-9 px-2.5 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong">
                  <CalendarIcon className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />
                  <span className="font-mono text-xs">{formatDateTime(endDate)}</span>
                </div>
              </div>
            </div>

            {/* Footer Row: Timezone on left, Apply Button on right */}
            <div className="flex items-center justify-between pt-3 border-t border-kumo-line">
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-kumo-subtle hover:text-kumo-strong cursor-pointer font-sans"
                >
                  <span>{selectedTimezone}</span>
                  <ChevronsUpDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleApply}
                className="px-6 py-2 text-xs font-semibold text-white bg-[#c0201f] hover:bg-[#a01817] rounded-lg shadow-xs cursor-pointer transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
export default DateRangePicker
