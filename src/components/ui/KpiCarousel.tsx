import React, { useRef, useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, Settings, RefreshCw, Calendar, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select } from './Select'
import { DateRangePicker, type DateRange } from './DateRangePicker'

export interface KpiCarouselProps {
  children: React.ReactNode
  titleFilter?: {
    label: string
    options: { value: string; label: string }[]
    value: string
    onChange: (value: string) => void
  }
  timeRange?: string
  dateRange?: DateRange
  onDateRangeChange?: (range: DateRange) => void
  onRefresh?: () => void
  onSettings?: () => void
  className?: string
}

export const KpiCarousel: React.FC<KpiCarouselProps> = ({
  children,
  titleFilter,
  timeRange = 'Last 24 hours',
  dateRange,
  onDateRangeChange,
  onRefresh,
  onSettings,
  className,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10)
  }

  useEffect(() => {
    checkScroll()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScroll, { passive: true })
      window.addEventListener('resize', checkScroll)
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll)
        window.removeEventListener('resize', checkScroll)
      }
    }
  }, [children])

  const scrollBy = (offset: number) => {
    if (!scrollContainerRef.current) return
    scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' })
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Top Filter and Controls Bar matching Cloudflare screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        {/* Left Filter Dropdown */}
        {titleFilter ? (
          <div className="w-48">
            <Select
              value={titleFilter.value}
              onValueChange={val => titleFilter.onChange(String(val))}
              options={titleFilter.options}
              size="sm"
              buttonClassName="h-8.5 text-xs font-medium"
            />
          </div>
        ) : (
          <div />
        )}

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {onSettings && (
            <button
              onClick={onSettings}
              title="Metric settings"
              className="h-8.5 w-8.5 rounded-lg bg-kumo-base ring ring-kumo-line text-kumo-subtle hover:text-kumo-strong hover:bg-kumo-tint flex items-center justify-center transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh metrics"
              className="h-8.5 w-8.5 rounded-lg bg-kumo-base ring ring-kumo-line text-kumo-subtle hover:text-kumo-strong hover:bg-kumo-tint flex items-center justify-center transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {onDateRangeChange ? (
            <DateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
            />
          ) : (
            <button
              type="button"
              className="h-8.5 px-3 rounded-lg bg-kumo-base ring ring-kumo-line text-kumo-default hover:bg-kumo-tint font-medium flex items-center gap-1.5 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-kumo-subtle" />
              <span>{timeRange}</span>
            </button>
          )}
        </div>
      </div>

      {/* Relative Carousel Row with Floating Scroll Arrow */}
      <div className="relative group">
        {/* Left Scroll Chevron */}
        {canScrollLeft && (
          <button
            onClick={() => scrollBy(-300)}
            aria-label="Scroll left"
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 size-7.5 rounded-full bg-kumo-base ring ring-kumo-line shadow-md text-kumo-default hover:bg-kumo-tint flex items-center justify-center transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Horizontally Scrollable Cards Container */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-3.5 overflow-x-auto scrollbar-none snap-x pb-1 scroll-smooth"
        >
          {React.Children.map(children, (child) => (
            <div className="shrink-0 w-64 sm:w-72 md:w-80 lg:w-[calc(25%-10.5px)] snap-start">
              {child}
            </div>
          ))}
        </div>

        {/* Right Scroll Chevron - Cloudflare Circular Arrow Button */}
        {canScrollRight && (
          <button
            onClick={() => scrollBy(300)}
            aria-label="Scroll right"
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 size-7.5 rounded-full bg-kumo-base ring ring-kumo-line shadow-md text-kumo-default hover:bg-kumo-tint flex items-center justify-center transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
