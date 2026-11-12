import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsUpDown, 
  RotateCw 
} from 'lucide-react'

export interface DateRange {
  start: Date | null
  end: Date | null
  presetKey?: string
}

export const formatLocalDateToYMD = (d: Date): string => {
  if (!d || isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const isWithinDateRange = (
  rawDate: string | Date | null | undefined, 
  range: DateRange | null | undefined
): boolean => {
  if (!range || !range.presetKey || range.presetKey === 'all') {
    if (!range?.start && !range?.end) return true
  }
  if (!rawDate) return false
  const itemDate = new Date(rawDate)
  const isStandardDateString = typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(rawDate.trim())
  if (isNaN(itemDate.getTime()) && !isStandardDateString) return false

  let itemYMD = ''
  if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim())) {
    itemYMD = rawDate.trim()
  } else if (!isNaN(itemDate.getTime())) {
    itemYMD = formatLocalDateToYMD(itemDate)
  } else if (isStandardDateString) {
    itemYMD = String(rawDate).trim().substring(0, 10)
  }

  // If explicit start and/or end dates are provided (custom range or range bounds)
  if (range.presetKey === 'custom' || range.start || range.end) {
    if (!itemYMD) return false
    if (range.start) {
      const startYMD = formatLocalDateToYMD(range.start)
      if (itemYMD < startYMD) return false
    }
    if (range.end) {
      const endYMD = formatLocalDateToYMD(range.end)
      if (itemYMD > endYMD) return false
    }
    return true
  }

  const now = new Date()
  const nowTime = now.getTime()
  const itemTime = itemDate.getTime()

  if (range.presetKey === 'today') {
    return itemYMD === formatLocalDateToYMD(now)
  }
  if (range.presetKey === 'yesterday') {
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    return itemYMD === formatLocalDateToYMD(yesterday)
  }
  if (range.presetKey === 'month') {
    return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
  }
  if (range.presetKey === '30m') {
    return itemTime >= nowTime - 30 * 60 * 1000
  }
  if (range.presetKey === '1h') {
    return itemTime >= nowTime - 60 * 60 * 1000
  }
  if (range.presetKey === '6h') {
    return itemTime >= nowTime - 6 * 60 * 60 * 1000
  }
  if (range.presetKey === '12h') {
    return itemTime >= nowTime - 12 * 60 * 60 * 1000
  }
  if (range.presetKey === '24h') {
    return itemTime >= nowTime - 24 * 60 * 60 * 1000
  }
  if (range.presetKey === '7d' || range.presetKey === '7days') {
    return itemTime >= nowTime - 7 * 24 * 60 * 60 * 1000
  }
  if (range.presetKey === '30d' || range.presetKey === '30days') {
    return itemTime >= nowTime - 30 * 24 * 60 * 60 * 1000
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
  { id: 'yesterday', label: 'Yesterday', durationHours: 24 },
  { id: '30m', label: 'Last 30 minutes', durationHours: 0.5 },
  { id: '1h', label: 'Last 1 hour', durationHours: 1 },
  { id: '6h', label: 'Last 6 hours', durationHours: 6 },
  { id: '12h', label: 'Last 12 hours', durationHours: 12 },
  { id: '24h', label: 'Last 24 hours', durationHours: 24 },
  { id: '7d', label: 'Last 7 days', durationHours: 24 * 7 },
  { id: '30d', label: 'Last 30 days', durationHours: 24 * 30 },
  { id: 'month', label: 'This Month', durationHours: 24 * 30 },
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
  const popoverRef = useRef<HTMLDivElement>(null)
  const dateButtonRef = useRef<HTMLButtonElement>(null)
  const [caretOffset, setCaretOffset] = useState<number>(24)
  const [hasCaret, setHasCaret] = useState<boolean>(true)
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom')
  const [popoverMaxHeight, setPopoverMaxHeight] = useState<number>(600)
  
  // Current viewing month for calendar - defaults dynamically to current date / active value
  const [viewDate, setViewDate] = useState<Date>(() => value?.start || new Date())
  const [startDate, setStartDate] = useState<Date>(() => {
    if (value?.start) return value.start
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  })
  const [endDate, setEndDate] = useState<Date>(() => {
    if (value?.end) return value.end
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  })
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
    if (!isOpen) return
    const updatePosition = () => {
      const anchorEl = dateButtonRef.current || triggerRef.current
      if (!anchorEl) return
      const rect = anchorEl.getBoundingClientRect()
      const popoverWidth = Math.min(520, window.innerWidth - 24)
      const card = popoverRef.current?.lastElementChild as HTMLElement | null
      const measuredHeight = card?.offsetHeight || 400

      // Horizontal: align right edge with button right edge, clamped safely within viewport
      const rawLeft = align === 'left' ? rect.left : rect.right - popoverWidth
      const clampedLeft = Math.max(12, Math.min(rawLeft, window.innerWidth - popoverWidth - 12))

      // Vertical: ensure popover is completely within viewport
      const spaceBelow = window.innerHeight - rect.bottom - 12
      const spaceAbove = rect.top - 12
      let nextPlacement: 'bottom' | 'top' = 'bottom'
      let top = rect.bottom + 8
      let showCaret = true

      if (spaceBelow >= measuredHeight + 8) {
        nextPlacement = 'bottom'
        top = rect.bottom + 8
      } else if (spaceAbove >= measuredHeight + 8) {
        nextPlacement = 'top'
        top = rect.top - measuredHeight - 8
      } else {
        // Neither fits without clipping: choose side with more space, and clamp top so the bottom is never cut off
        if (spaceBelow >= spaceAbove) {
          nextPlacement = 'bottom'
          top = Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - measuredHeight - 12))
        } else {
          nextPlacement = 'top'
          top = Math.max(12, Math.min(rect.top - measuredHeight - 8, window.innerHeight - measuredHeight - 12))
        }
        // If popover overlaps the button vertically, hide caret to avoid pointing to wrong origin
        if (top < rect.bottom && top + measuredHeight > rect.top) {
          showCaret = false
        }
      }

      // Max height constraint to guarantee internal scrolling if screen is tiny (< 560px)
      const availableMaxHeight = Math.max(280, window.innerHeight - top - 12)

      // Caret position relative to popover: exactly aligns with center of anchor button
      const anchorCenter = rect.left + rect.width / 2
      const caret = Math.max(20, Math.min(anchorCenter - clampedLeft - 7, popoverWidth - 34))

      // If anchor center is outside the popover horizontal bounds, hide caret
      if (anchorCenter < clampedLeft || anchorCenter > clampedLeft + popoverWidth) {
        showCaret = false
      }

      setPlacement(nextPlacement)
      setCaretOffset(caret)
      setHasCaret(showCaret)
      setPopoverMaxHeight(availableMaxHeight)
      setPopoverCoords({ top, left: clampedLeft })
    }
    updatePosition()
    // Re-measure after the popover has painted so the real height is used
    const raf = requestAnimationFrame(updatePosition)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, align, isSelectingEnd])

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
    const now = new Date()

    if (presetId === 'all') {
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0))
      setEndDate(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999))
      onChange?.({
        start: null,
        end: null,
        presetKey: 'all'
      })
      setIsOpen(false)
      return
    }

    if (presetId === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      setStartDate(start)
      setEndDate(end)
      onChange?.({
        start,
        end,
        presetKey: 'today'
      })
      setIsOpen(false)
      return
    }

    if (presetId === 'yesterday') {
      const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
      const start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0)
      const end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999)
      setStartDate(start)
      setEndDate(end)
      onChange?.({
        start,
        end,
        presetKey: 'yesterday'
      })
      setIsOpen(false)
      return
    }

    if (presetId === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const end = new Date(now.getFullYear(), now.getMonth(), lastDay, 23, 59, 59, 999)
      setStartDate(start)
      setEndDate(end)
      onChange?.({
        start,
        end,
        presetKey: 'month'
      })
      setIsOpen(false)
      return
    }

    const preset = PRESETS.find(p => p.id === presetId)
    if (preset) {
      const start = new Date(now.getTime() - preset.durationHours * 60 * 60 * 1000)
      setStartDate(start)
      setEndDate(now)
      onChange?.({
        start,
        end: now,
        presetKey: preset.id
      })
      setIsOpen(false)
    }
  }

  const handleApply = () => {
    setIsSelectingEnd(false)
    setHoverDate(null)
    setIsOpen(false)
    onChange?.({
      start: startDate,
      end: endDate,
      presetKey: activePreset === 'all' ? 'all' : (activePreset === 'custom' ? 'custom' : activePreset)
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
    const clickedMidnight = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate(), 0, 0, 0, 0)
    const clickedEndOfDay = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate(), 23, 59, 59, 999)

    if (!isSelectingEnd) {
      // Step 1: First click sets single-day range
      setStartDate(clickedMidnight)
      setEndDate(clickedEndOfDay)
      setIsSelectingEnd(true)
      setHoverDate(null)
      onChange?.({
        start: clickedMidnight,
        end: clickedEndOfDay,
        presetKey: 'custom'
      })
    } else {
      // Step 2: Second click sets end date
      let nextStart = startDate
      let nextEnd = clickedEndOfDay
      if (clickedMidnight.getTime() < startDate.getTime()) {
        // Earlier than start, swap
        nextStart = clickedMidnight
        nextEnd = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 23, 59, 59, 999)
      } else if (clickedMidnight.getTime() === startDate.getTime()) {
        // Clicked same day again -> finalize single day
        nextStart = clickedMidnight
        nextEnd = clickedEndOfDay
      } else {
        nextStart = startDate
        nextEnd = clickedEndOfDay
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
  const displayLabel = activePreset === 'all'
    ? 'All Records'
    : (activePresetObj && activePreset !== 'custom')
      ? activePresetObj.label 
      : isSameDay(startDate, endDate)
        ? `${formatShortDate(startDate)} ${startDate.getFullYear()}`
        : `${formatShortDate(startDate)} - ${formatShortDate(endDate)} ${endDate.getFullYear()}`

  return (
    <div ref={triggerRef} className={cn('relative inline-block font-sans select-none', className)}>
      {/* Single Date Filter Button with 1-click Clear */}
      <button
        ref={dateButtonRef}
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          'h-10 px-3.5 rounded-lg border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-xs sm:text-sm font-medium text-kumo-strong flex items-center gap-2 cursor-pointer transition-colors shadow-2xs',
          isOpen && 'ring-2 ring-primary border-primary bg-primary/5 text-primary',
          activePreset !== 'all' && 'border-primary/50 bg-primary/5 text-primary'
        )}
      >
        <CalendarIcon className={cn('w-4 h-4 shrink-0', (isOpen || activePreset !== 'all') ? 'text-primary' : 'text-kumo-subtle')} />
        <span>{displayLabel}</span>
        {activePreset !== 'all' && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              handleSelectPreset('all')
            }}
            className="w-4 h-4 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center text-[11px] ml-0.5 shrink-0 cursor-pointer font-bold leading-none"
            title="Clear date filter"
          >
            ×
          </span>
        )}
      </button>

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
            ref={popoverRef}
            style={{ top: popoverCoords.top, left: popoverCoords.left }}
            className="fixed w-[510px] max-w-[95vw] z-[100] animate-in fade-in zoom-in-95"
          >
            {/* Popover caret — dynamically aligned with the date trigger button */}
            {hasCaret && (
              <div
                style={{ left: `${caretOffset}px` }}
                className={cn(
                  'absolute w-3.5 h-3.5 bg-kumo-base border-kumo-line rotate-45 pointer-events-none z-[1]',
                  placement === 'bottom' ? '-top-[7px] border-t border-l' : '-bottom-[7px] border-b border-r'
                )}
              />
            )}

            <div
              style={{ maxHeight: popoverMaxHeight }}
              className="rounded-xl border border-kumo-line bg-kumo-base shadow-xl font-sans flex flex-col overflow-hidden"
            >
              {/* Scrollable Main Area (Guarantees footer is never cropped) */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
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
                    className="w-full px-3 py-1.5 text-xs text-kumo-strong bg-kumo-base border border-kumo-line rounded-lg focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white placeholder:text-kumo-subtle font-sans"
                  />
                </div>

                {/* Selection Status Prompt */}
                {isSelectingEnd && (
                  <div className="px-2.5 py-1 bg-black/5 dark:bg-white/10 border border-black/15 dark:border-white/15 rounded-lg text-xs text-black dark:text-white font-medium flex items-center justify-between">
                    <span>Click a second date on the calendar to set your end date</span>
                    <span className="text-[11px] underline cursor-pointer" onClick={() => setIsSelectingEnd(false)}>Done</span>
                  </div>
                )}

                {/* Main 2-column section: Left Calendar, Right Presets */}
                <div className="grid grid-cols-12 gap-3">
                  {/* Left Calendar (7 cols) */}
                  <div className="col-span-7 space-y-2">
                    {/* Month header with prev/next buttons */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-kumo-strong">
                        {monthName}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewDate(new Date(year, month - 1, 1))}
                          className="w-6 h-6 flex items-center justify-center rounded-lg border border-kumo-line hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-strong cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewDate(new Date(year, month + 1, 1))}
                          className="w-6 h-6 flex items-center justify-center rounded-lg border border-kumo-line hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-strong cursor-pointer"
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
                          'h-7 w-full flex items-center justify-center text-xs transition-colors cursor-pointer',
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
              <div className="col-span-5 border-l border-kumo-line pl-2.5 space-y-0.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    className={cn(
                      'w-full text-left px-2 py-1 text-xs rounded-lg transition-colors cursor-pointer font-sans',
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
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-kumo-line">
              <div className="space-y-0.5">
                <label className="text-[10px] font-medium text-kumo-subtle block">Start</label>
                <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong">
                  <CalendarIcon className="w-3 h-3 text-black dark:text-white shrink-0" />
                  <span className="font-mono text-[11px]">{formatDateTime(startDate)}</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <label className="text-[10px] font-medium text-kumo-subtle block">End</label>
                <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong">
                  <CalendarIcon className="w-3 h-3 text-black dark:text-white shrink-0" />
                  <span className="font-mono text-[11px]">{formatDateTime(endDate)}</span>
                </div>
              </div>
            </div>
            </div>

            {/* Non-Cropped Pinned Footer Row: Timezone on left, Cancel & Apply on right */}
            <div className="shrink-0 px-3.5 py-2.5 bg-kumo-base border-t border-kumo-line flex items-center justify-between z-10">
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-kumo-subtle hover:text-kumo-strong cursor-pointer font-sans"
                >
                  <span>{selectedTimezone}</span>
                  <ChevronsUpDown className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectingEnd(false)
                    setHoverDate(null)
                    setIsOpen(false)
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-kumo-default hover:text-kumo-strong hover:bg-kumo-tint rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-5 py-1.5 text-xs font-semibold text-white bg-[#c0201f] hover:bg-[#a01817] rounded-lg shadow-xs cursor-pointer transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
export default DateRangePicker
