import React, { useState, useMemo } from 'react'
import { Resizable } from 'react-resizable'
import 'react-resizable/css/styles.css'
import {
  Calendar,
  Plus,
  RotateCw,
  MoreHorizontal,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricPoint {
  time: string
  value: number
}

interface AnalyticsCardConfig {
  id: string
  title: string
  value: string
  change: string
  changeType: 'up' | 'down' | 'neutral'
  changePositive: boolean
  yTicks?: string[]
  points?: number[]
  emptyState?: boolean
  initialWidth?: number
  initialHeight?: number
  minWidth?: number
  minHeight?: number
}

export const CloudflareAnalyticsSection: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h')
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  // Card dimensions state for resizable behavior
  const [cardSizes, setCardSizes] = useState<Record<string, { width: number; height: number }>>({
    'total-requests': { width: 560, height: 230 },
    'worker-invocations': { width: 560, height: 230 },
    'workers-errors': { width: 270, height: 200 },
    'cache-hit-rate': { width: 270, height: 200 },
    'cpu-time-p90': { width: 270, height: 200 },
    'build-minutes': { width: 270, height: 200 }
  })

  const handleResize = (id: string, width: number, height: number) => {
    setCardSizes((prev) => ({
      ...prev,
      [id]: { width, height }
    }))
  }

  const triggerRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 600)
  }

  // Time labels for 24h
  const timeLabels = useMemo(() => [
    '00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00',
    '16:00', '18:00', '20:00', '22:00', '23:59'
  ], [])

  // Spiky points replicating Cloudflare's requests and worker invocations
  const totalRequestsPoints = [
    12, 18, 14, 68, 22, 110, 18, 24, 16, 12, 38, 22, 18, 120, 20, 28, 36, 44, 30, 48, 32, 70, 36, 32
  ]

  const workerInvocationsPoints = [
    8, 110, 12, 85, 14, 16, 22, 8, 12, 80, 85, 230, 20, 16, 18, 20, 140, 45, 60, 28, 150, 22, 30, 14
  ]

  const cacheHitPoints = [
    22, 65, 18, 70, 12, 75, 28, 80, 15, 60, 22, 72, 16, 85, 24, 68, 14, 78, 26, 82, 18, 74, 20, 80
  ]

  const cpuTimePoints = [
    42, 78, 38, 85, 45, 68, 35, 90, 40, 72, 36, 88, 48, 65, 32, 92, 44, 70, 38, 86, 46, 75, 40, 82
  ]

  // Convert points array to smooth SVG path
  const generateSvgPath = (points: number[], maxVal: number, width: number, height: number): string => {
    if (!points || points.length === 0) return ''
    const dx = width / (points.length - 1)
    const paddingBottom = 12
    const paddingTop = 8
    const usableHeight = height - paddingBottom - paddingTop

    return points
      .map((val, i) => {
        const x = i * dx
        const norm = Math.min(1, Math.max(0, val / maxVal))
        const y = height - paddingBottom - norm * usableHeight
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }

  // Faint wave for empty states
  const emptyWavePath = (width: number, height: number): string => {
    const mid = height - 20
    return `M 0,${mid} Q ${width * 0.25},${mid - 8} ${width * 0.5},${mid} T ${width},${mid}`
  }

  return (
    <div className="w-full space-y-4 pt-2">
      {/* SECTION HEADER: Title & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-[22px] font-semibold tracking-tight text-[#18181b]">
          Analytics
        </h2>

        {/* Right Controls */}
        <div className="flex items-center gap-2 relative">
          {/* Time range dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-[#e4e4e7] bg-white text-[13px] font-medium text-[#18181b] hover:bg-[#fafafa] shadow-2xs transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-[#71717a]" />
              <span>
                {timeRange === '24h' && 'Last 24 hours'}
                {timeRange === '7d' && 'Last 7 days'}
                {timeRange === '30d' && 'Last 30 days'}
              </span>
            </button>

            {isTimeDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsTimeDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-40 rounded-lg border border-[#e4e4e7] bg-white shadow-lg py-1 z-30 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setTimeRange('24h')
                      setIsTimeDropdownOpen(false)
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 hover:bg-[#f4f4f5] transition-colors',
                      timeRange === '24h' ? 'font-semibold text-[#0051c3]' : 'text-[#18181b]'
                    )}
                  >
                    Last 24 hours
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTimeRange('7d')
                      setIsTimeDropdownOpen(false)
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 hover:bg-[#f4f4f5] transition-colors',
                      timeRange === '7d' ? 'font-semibold text-[#0051c3]' : 'text-[#18181b]'
                    )}
                  >
                    Last 7 days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTimeRange('30d')
                      setIsTimeDropdownOpen(false)
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 hover:bg-[#f4f4f5] transition-colors',
                      timeRange === '30d' ? 'font-semibold text-[#0051c3]' : 'text-[#18181b]'
                    )}
                  >
                    Last 30 days
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Add card button */}
          <button
            type="button"
            title="Add metric card"
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#e4e4e7] bg-white text-[#71717a] hover:text-[#18181b] hover:bg-[#fafafa] shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Refresh button */}
          <button
            type="button"
            title="Refresh analytics data"
            onClick={triggerRefresh}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#e4e4e7] bg-white text-[#71717a] hover:text-[#18181b] hover:bg-[#fafafa] shadow-2xs transition-colors"
          >
            <RotateCw className={cn('w-4 h-4', isRefreshing && 'animate-spin text-[#0051c3]')} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          ROW 1: TWO WIDE CARDS (Total Requests & Worker Invocations)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CARD 1: Total requests */}
        <div className="relative group rounded-xl border border-[#e4e4e7] bg-white p-5 shadow-2xs hover:border-[#d4d4d8] transition-all flex flex-col justify-between min-h-[240px]">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#71717a] font-normal">
                Total requests
              </span>
              <button
                type="button"
                aria-label="Options"
                className="w-6 h-6 flex items-center justify-center rounded text-[#a1a1aa] hover:text-[#18181b] hover:bg-black/[0.04] transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Metric + Trend */}
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[32px] font-semibold tracking-tight text-[#18181b] leading-none">
                30.96k
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#16a34a]">
                <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>58.1%</span>
              </span>
            </div>
          </div>

          {/* Graph with Y-Axis Ticks */}
          <div className="relative w-full h-28 mt-4 flex">
            {/* Chart Area */}
            <div className="flex-1 relative h-full">
              {/* Horizontal gridlines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                <div className="w-full border-b border-dashed border-[#e4e4e7]" />
                <div className="w-full border-b border-dashed border-[#e4e4e7]" />
                <div className="w-full border-b border-dashed border-[#e4e4e7]" />
                <div className="w-full border-b border-[#e4e4e7]" />
              </div>

              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 480 100"
                preserveAspectRatio="none"
              >
                <path
                  d={generateSvgPath(totalRequestsPoints, 130, 480, 100)}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Right Y-Axis Labels */}
            <div className="w-8 flex flex-col justify-between items-end pl-2 text-[11px] text-[#a1a1aa] font-mono select-none">
              <span>4k</span>
              <span>3k</span>
              <span>2k</span>
              <span>1k</span>
              <span>0</span>
            </div>
          </div>

          {/* Resize Corner Indicator */}
          <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M7 1L1 7M7 4L4 7M7 7L7 7" stroke="#71717a" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* CARD 2: Worker invocations */}
        <div className="relative group rounded-xl border border-[#e4e4e7] bg-white p-5 shadow-2xs hover:border-[#d4d4d8] transition-all flex flex-col justify-between min-h-[240px]">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#71717a] font-normal">
                Worker invocations
              </span>
              <button
                type="button"
                aria-label="Options"
                className="w-6 h-6 flex items-center justify-center rounded text-[#a1a1aa] hover:text-[#18181b] hover:bg-black/[0.04] transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Metric + Trend */}
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[32px] font-semibold tracking-tight text-[#18181b] leading-none">
                3.98k
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#16a34a]">
                <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>65.8%</span>
              </span>
            </div>
          </div>

          {/* Graph with Y-Axis Ticks */}
          <div className="relative w-full h-28 mt-4 flex">
            {/* Chart Area */}
            <div className="flex-1 relative h-full">
              {/* Horizontal gridlines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                <div className="w-full border-b border-dashed border-[#e4e4e7]" />
                <div className="w-full border-b border-dashed border-[#e4e4e7]" />
                <div className="w-full border-b border-dashed border-[#e4e4e7]" />
                <div className="w-full border-b border-[#e4e4e7]" />
              </div>

              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 480 100"
                preserveAspectRatio="none"
              >
                <path
                  d={generateSvgPath(workerInvocationsPoints, 240, 480, 100)}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Right Y-Axis Labels */}
            <div className="w-8 flex flex-col justify-between items-end pl-2 text-[11px] text-[#a1a1aa] font-mono select-none">
              <span>600</span>
              <span>400</span>
              <span>200</span>
              <span>0</span>
            </div>
          </div>

          {/* Resize Corner Indicator */}
          <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M7 1L1 7M7 4L4 7M7 7L7 7" stroke="#71717a" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: FOUR COMPACT METRIC CARDS (Errors, Cache Hit, CPU P90, Build Mins)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 3: Workers errors (Empty state) */}
        <div className="relative group rounded-xl border border-[#e4e4e7] bg-white p-5 shadow-2xs hover:border-[#d4d4d8] transition-all flex flex-col justify-between min-h-[190px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#71717a] font-normal">
                Workers errors
              </span>
              <button
                type="button"
                aria-label="Options"
                className="w-6 h-6 flex items-center justify-center rounded text-[#a1a1aa] hover:text-[#18181b] hover:bg-black/[0.04] transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-1">
              <span className="text-[32px] font-semibold tracking-tight text-[#18181b] leading-none">
                0
              </span>
            </div>
          </div>

          {/* Empty state waveform + No Data pill badge */}
          <div className="relative w-full h-16 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 60" preserveAspectRatio="none">
              <path
                d="M 0,35 Q 60,25 120,35 T 240,35"
                fill="none"
                stroke="#e4e4e7"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            </svg>
            <span className="relative z-10 px-2.5 py-0.5 rounded-full border border-[#e4e4e7] bg-white text-[11px] font-medium text-[#71717a] shadow-2xs select-none">
              No data
            </span>
          </div>

          <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M7 1L1 7M7 4L4 7M7 7L7 7" stroke="#71717a" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* CARD 4: Cache hit rate */}
        <div className="relative group rounded-xl border border-[#e4e4e7] bg-white p-5 shadow-2xs hover:border-[#d4d4d8] transition-all flex flex-col justify-between min-h-[190px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#71717a] font-normal">
                Cache hit rate
              </span>
              <button
                type="button"
                aria-label="Options"
                className="w-6 h-6 flex items-center justify-center rounded text-[#a1a1aa] hover:text-[#18181b] hover:bg-black/[0.04] transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[32px] font-semibold tracking-tight text-[#18181b] leading-none">
                27.83%
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#dc2626]">
                <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>24.8%</span>
              </span>
            </div>
          </div>

          {/* High frequency oscillating chart */}
          <div className="relative w-full h-16 mt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 240 60" preserveAspectRatio="none">
              <path
                d={generateSvgPath(cacheHitPoints, 95, 240, 60)}
                fill="none"
                stroke="#2563eb"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M7 1L1 7M7 4L4 7M7 7L7 7" stroke="#71717a" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* CARD 5: CPU time P90 */}
        <div className="relative group rounded-xl border border-[#e4e4e7] bg-white p-5 shadow-2xs hover:border-[#d4d4d8] transition-all flex flex-col justify-between min-h-[190px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#71717a] font-normal">
                CPU time P90
              </span>
              <button
                type="button"
                aria-label="Options"
                className="w-6 h-6 flex items-center justify-center rounded text-[#a1a1aa] hover:text-[#18181b] hover:bg-black/[0.04] transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[32px] font-semibold tracking-tight text-[#18181b] leading-none">
                408 ms
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#16a34a]">
                <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>27.3%</span>
              </span>
            </div>
          </div>

          {/* High frequency line chart */}
          <div className="relative w-full h-16 mt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 240 60" preserveAspectRatio="none">
              <path
                d={generateSvgPath(cpuTimePoints, 100, 240, 60)}
                fill="none"
                stroke="#2563eb"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M7 1L1 7M7 4L4 7M7 7L7 7" stroke="#71717a" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* CARD 6: Build minutes (Empty state) */}
        <div className="relative group rounded-xl border border-[#e4e4e7] bg-white p-5 shadow-2xs hover:border-[#d4d4d8] transition-all flex flex-col justify-between min-h-[190px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#71717a] font-normal">
                Build minutes
              </span>
              <button
                type="button"
                aria-label="Options"
                className="w-6 h-6 flex items-center justify-center rounded text-[#a1a1aa] hover:text-[#18181b] hover:bg-black/[0.04] transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-1">
              <span className="text-[32px] font-semibold tracking-tight text-[#18181b] leading-none">
                0
              </span>
            </div>
          </div>

          {/* Empty state waveform + No Data pill badge */}
          <div className="relative w-full h-16 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 60" preserveAspectRatio="none">
              <path
                d="M 0,35 Q 60,25 120,35 T 240,35"
                fill="none"
                stroke="#e4e4e7"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            </svg>
            <span className="relative z-10 px-2.5 py-0.5 rounded-full border border-[#e4e4e7] bg-white text-[11px] font-medium text-[#71717a] shadow-2xs select-none">
              No data
            </span>
          </div>

          <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M7 1L1 7M7 4L4 7M7 7L7 7" stroke="#71717a" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
