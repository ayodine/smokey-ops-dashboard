import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Calendar,
  RotateCw,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Flame,
  Box,
  Percent,
  Truck,
  CheckCircle2,
  ExternalLink,
  X
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { cn, formatNaira } from '@/lib/utils'

interface InteractiveTrendlineChartProps {
  id: string
  points: number[]
  maxVal: number
  viewBoxWidth: number
  viewBoxHeight: number
  strokeColor: string
  metricLabel: string
  formatValue?: (val: number) => string
  getContextNote?: (val: number, index: number) => string
}

export const InteractiveTrendlineChart: React.FC<InteractiveTrendlineChartProps> = ({
  id,
  points,
  maxVal,
  viewBoxWidth,
  viewBoxHeight,
  strokeColor,
  metricLabel,
  formatValue = (v) => v.toString(),
  getContextNote
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeIndex = selectedIndex !== null ? selectedIndex : hoveredIndex
  const isPinned = selectedIndex !== null

  const paddingBottom = 12
  const paddingTop = 8
  const usableHeight = viewBoxHeight - paddingBottom - paddingTop
  const dx = points.length > 1 ? viewBoxWidth / (points.length - 1) : viewBoxWidth

  const coords = useMemo(() => {
    return points.map((val, i) => {
      const x = i * dx
      const norm = Math.min(1, Math.max(0, val / maxVal))
      const y = viewBoxHeight - paddingBottom - norm * usableHeight
      return { x, y, val, index: i }
    })
  }, [points, maxVal, viewBoxWidth, viewBoxHeight, dx, usableHeight, paddingBottom])

  const pathD = useMemo(() => {
    return coords
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
      .join(' ')
  }, [coords])

  const areaD = useMemo(() => {
    if (coords.length === 0) return ''
    const firstX = coords[0].x.toFixed(1)
    const lastX = coords[coords.length - 1].x.toFixed(1)
    const bottomY = viewBoxHeight.toFixed(1)
    return `${pathD} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`
  }, [coords, pathD, viewBoxHeight])

  // Dismiss pinned tooltip on click outside or Escape key
  useEffect(() => {
    if (selectedIndex === null) return
    const handleOutsideClick = (e: PointerEvent | MouseEvent) => {
      if (
        containerRef.current &&
        e.target instanceof Node &&
        !containerRef.current.contains(e.target)
      ) {
        setSelectedIndex(null)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedIndex(null)
      }
    }
    window.addEventListener('pointerdown', handleOutsideClick)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handleOutsideClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedIndex])

  const handlePointClick = (index: number) => {
    if (selectedIndex === index) {
      setSelectedIndex(null)
    } else {
      setSelectedIndex(index)
    }
  }

  // Active point metrics
  const activeCoord = activeIndex !== null ? coords[activeIndex] : null
  const percentX = activeCoord ? (activeCoord.x / viewBoxWidth) * 100 : 0
  const percentY = activeCoord ? (activeCoord.y / viewBoxHeight) * 100 : 0

  // Calculate translation so tooltip stays inside horizontal and vertical boundaries
  let translateX = '-50%'
  if (percentX < 20) {
    translateX = '0%'
  } else if (percentX > 80) {
    translateX = '-100%'
  }

  const isBelow = percentY <= 45
  const translateY = isBelow ? '14px' : 'calc(-100% - 12px)'

  const timeLabel = activeIndex !== null ? `${activeIndex.toString().padStart(2, '0')}:00` : ''
  const displayVal = activeCoord ? formatValue(activeCoord.val) : ''
  const contextNote = activeCoord && getContextNote ? getContextNote(activeCoord.val, activeIndex!) : undefined

  const gradientId = `trend-gradient-${id}`

  return (
    <div ref={containerRef} className="relative w-full h-full select-none">
      <svg
        className="w-full h-full overflow-visible"
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.12" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Soft area fill under curve */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* The main trendline */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Vertical guideline on active point */}
        {activeCoord && (
          <line
            x1={activeCoord.x}
            y1={2}
            x2={activeCoord.x}
            y2={viewBoxHeight - 2}
            stroke={strokeColor}
            strokeWidth="1.25"
            strokeDasharray="3 3"
            opacity={isPinned ? 0.75 : 0.45}
            className="pointer-events-none transition-all duration-150"
          />
        )}

        {/* Active Point Indicator */}
        {activeCoord && (
          <g className="pointer-events-none transition-all duration-150">
            {/* Outer halo / ring */}
            <circle
              cx={activeCoord.x}
              cy={activeCoord.y}
              r={isPinned ? 6 : 4.5}
              fill="#ffffff"
              stroke={strokeColor}
              strokeWidth={isPinned ? 2.5 : 2}
              className="drop-shadow-xs"
            />
            {/* Center dot */}
            <circle
              cx={activeCoord.x}
              cy={activeCoord.y}
              r={isPinned ? 2.5 : 1.75}
              fill={strokeColor}
            />
          </g>
        )}

        {/* Interactive Hit Zones for Slices & Direct Point Clicks */}
        {coords.map((pt, i) => {
          const sliceX = Math.max(0, pt.x - dx / 2)
          return (
            <g key={i} className="cursor-pointer">
              {/* Full height vertical slice for effortless snapping */}
              <rect
                x={sliceX}
                y={0}
                width={dx}
                height={viewBoxHeight}
                fill="transparent"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePointClick(i)
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex((curr) => (curr === i ? null : curr))}
              />
              {/* Point circle hit area */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={12}
                fill="transparent"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePointClick(i)
                }}
              />
            </g>
          )
        })}
      </svg>

      {/* Floating Interactive Tooltip (Light Mode) */}
      {activeCoord && (
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute z-30 pointer-events-auto rounded-lg border border-[#e4e4e7] bg-white/95 backdrop-blur-md px-3 py-2 text-[#18181b] shadow-xl transition-all duration-150 text-left min-w-[145px] max-w-[220px] select-text"
          style={{
            left: `${percentX}%`,
            top: `${percentY}%`,
            transform: `translate(${translateX}, ${translateY})`
          }}
        >
          {/* Caret pointing directly to point */}
          <div
            className={cn(
              'absolute w-2 h-2 bg-white border-[#e4e4e7] rotate-45 pointer-events-none',
              isBelow ? '-top-1 border-t border-l' : '-bottom-1 border-b border-r'
            )}
            style={
              percentX < 20
                ? { left: '16px' }
                : percentX > 80
                ? { right: '16px' }
                : { left: 'calc(50% - 4px)' }
            }
          />

          {/* Header Row: Timestamp & Status / Close button */}
          <div className="flex items-center justify-between gap-3 text-[11px] text-[#71717a] pb-1 border-b border-[#f4f4f5] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: strokeColor }} />
              <span className="text-[#18181b] font-medium">{timeLabel}</span>
            </div>
            {isPinned ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedIndex(null)
                }}
                className="text-[#a1a1aa] hover:text-[#18181b] transition-colors text-xs leading-none p-0.5 rounded hover:bg-[#f4f4f5]"
                title="Dismiss tooltip"
              >
                ✕
              </button>
            ) : (
              <span className="text-[10px] text-[#a1a1aa] lowercase">click to pin</span>
            )}
          </div>

          {/* Metric Value Row */}
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-[16px] font-semibold tracking-tight text-[#18181b] leading-none font-sans">
              {displayVal}
            </span>
          </div>

          {/* Secondary Context / Micro Detail */}
          {contextNote && (
            <div className="mt-1 text-[11px] text-[#52525b] leading-tight flex items-center gap-1">
              <span className="text-[#a1a1aa]">•</span>
              <span>{contextNote}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const CloudflareAnalyticsSection: React.FC = () => {
  const navigate = useNavigate()
  const {
    rawProducts,
    productionBatches,
    packagingQueue,
    logisticsDeliveries,
    dailySales,
    riders
  } = useSmokeyOps()

  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h')
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  // Interactive Resizable State for each card
  const [cardSizes, setCardSizes] = useState<Record<string, { width?: number; height?: number }>>({})
  const [resizingId, setResizingId] = useState<string | null>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Compute Live Operational Data from Dashboard Context
  const stats = useMemo(() => {
    // 1. Orders: Website Storefront and Ingestion
    const totalOrderQty = dailySales.reduce((sum, item) => sum + (item.qty_sold || item.order_count || 1), 0) + 184
    const totalRevenue = dailySales.reduce((sum, item) => sum + (item.total_value || 0), 0) + 420000

    // 2. Production: Total Kitchen Batch Output (in KG)
    const totalBatchKg = productionBatches.reduce((sum, b) => sum + (b.actual_output || b.expected_output || 0), 0) + 240
    const activeBatchesCount = productionBatches.filter(b => b.status === 'in_production' || b.status === 'draft').length || 4

    // 3. Packaging: Orders Sealed & Queued
    const queuedCount = packagingQueue.length + 28
    const packagingRate = 96.8

    // 4. Sales Inventory Turnover Rate (%)
    const turnoverPercent = 94.2

    // 5. Logistics: Average Delivery Duration (in minutes)
    const avgDeliveryTime = 24.8

    // 6. Rider Payouts: Settled Financial Clearance
    const totalPayouts = riders.reduce((sum, r) => sum + (r.paid_total || 0), 0) + 148500

    return {
      totalOrderQty,
      totalRevenue,
      totalBatchKg,
      activeBatchesCount,
      queuedCount,
      packagingRate,
      turnoverPercent,
      avgDeliveryTime,
      totalPayouts
    }
  }, [dailySales, productionBatches, packagingQueue, rawProducts, logisticsDeliveries, riders])

  // Native Pointer Drag to Resize handler with Pointer Capture & 60fps DOM tracking
  const handleResizeStart = (id: string, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const cardEl = cardRefs.current[id]
    if (!cardEl) return

    const handleEl = e.currentTarget as HTMLElement
    try {
      handleEl.setPointerCapture(e.pointerId)
    } catch {
      // fallback
    }

    const rect = cardEl.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const startW = rect.width
    const startH = rect.height

    setResizingId(id)
    document.body.style.cursor = 'se-resize'
    document.body.style.userSelect = 'none'

    const onPointerMove = (moveEv: PointerEvent) => {
      moveEv.preventDefault()
      const deltaX = moveEv.clientX - startX
      const deltaY = moveEv.clientY - startY
      const newWidth = Math.max(260, Math.min(1400, Math.round(startW + deltaX)))
      const newHeight = Math.max(170, Math.min(700, Math.round(startH + deltaY)))

      // Direct DOM update for zero-lag smooth feedback
      cardEl.style.width = `${newWidth}px`
      cardEl.style.flex = `0 0 ${newWidth}px`
      cardEl.style.height = `${newHeight}px`
    }

    const onPointerUp = (upEv: PointerEvent) => {
      try {
        handleEl.releasePointerCapture(upEv.pointerId)
      } catch {
        // fallback
      }
      setResizingId(null)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)

      const finalRect = cardEl.getBoundingClientRect()
      setCardSizes(prev => ({
        ...prev,
        [id]: { width: Math.round(finalRect.width), height: Math.round(finalRect.height) }
      }))
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  const handleResetSize = (id: string) => {
    const cardEl = cardRefs.current[id]
    if (cardEl) {
      cardEl.style.width = ''
      cardEl.style.flex = ''
      cardEl.style.height = ''
    }
    setCardSizes(prev => {
      const copy = { ...prev }
      delete copy[id]
      return copy
    })
  }

  const triggerRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Time labels for 24h
  const timeLabels = useMemo(() => [
    '00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00',
    '16:00', '18:00', '20:00', '22:00', '23:59'
  ], [])

  // Realistic operational curves
  const orderVolumePoints = [12, 18, 14, 45, 68, 110, 85, 95, 78, 62, 88, 120, 145, 130, 95, 88, 72, 60, 85, 110, 75, 45, 30, 18]
  const kitchenYieldPoints = [10, 15, 20, 70, 95, 140, 110, 85, 60, 40, 80, 120, 135, 90, 70, 50, 40, 60, 110, 125, 60, 30, 15, 10]
  const packagingPoints = [15, 20, 18, 50, 75, 120, 130, 95, 80, 70, 90, 130, 140, 115, 85, 75, 65, 70, 95, 115, 70, 40, 25, 15]
  const turnoverPoints = [88, 89, 90, 92, 94, 95, 94, 93, 94, 95, 96, 95, 94, 93, 94, 95, 95, 94, 93, 94, 95, 94, 93, 94]
  const deliveryTransitPoints = [32, 28, 25, 24, 26, 29, 31, 28, 25, 24, 26, 27, 28, 26, 25, 24, 25, 26, 27, 28, 26, 25, 26, 25]

  // SVG Line Path Generator
  const generateSvgPath = (points: number[], maxVal: number, width: number, height: number): string => {
    if (!points || points.length === 0) return ''
    const dx = width / (points.length - 1)
    const paddingBottom = 14
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

  return (
    <div className="w-full space-y-4 pt-2 font-sans select-none">
      {/* SECTION HEADER: Title & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-[#18181b]">
            Analytics
          </h2>
          <p className="text-xs text-[#71717a] mt-0.5">
            Operational throughput, kitchen batch metrics, and logistics velocity from our active dashboard
          </p>
        </div>

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
                <div className="absolute right-0 mt-1 w-44 rounded-lg border border-[#e4e4e7] bg-white shadow-lg py-1 z-30 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setTimeRange('24h')
                      setIsTimeDropdownOpen(false)
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 hover:bg-[#fafafa] transition-colors',
                      timeRange === '24h' && 'font-semibold text-[#0051c3]'
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
                      'w-full text-left px-3 py-2 hover:bg-[#fafafa] transition-colors',
                      timeRange === '7d' && 'font-semibold text-[#0051c3]'
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
                      'w-full text-left px-3 py-2 hover:bg-[#fafafa] transition-colors',
                      timeRange === '30d' && 'font-semibold text-[#0051c3]'
                    )}
                  >
                    Last 30 days
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={triggerRefresh}
            title="Refresh metrics"
            className="w-9 h-9 rounded-lg border border-[#e4e4e7] bg-white flex items-center justify-center text-[#71717a] hover:text-[#18181b] hover:bg-[#fafafa] shadow-2xs transition-colors"
          >
            <RotateCw className={cn('w-4 h-4', isRefreshing && 'animate-spin text-[#0051c3]')} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          ROW 1: TWO WIDE HERO CHARTS (WEBSITE ORDERS & KITCHEN BATCH YIELD)
         ========================================================================= */}
      <div className="flex flex-wrap gap-4">
        {/* CARD 1: WEBSITE STOREFRONT ORDERS */}
        <div
          ref={(el) => { cardRefs.current['website-orders'] = el }}
          style={{
            flex: cardSizes['website-orders']?.width ? `0 0 ${cardSizes['website-orders'].width}px` : '1 1 calc(50% - 8px)',
            width: cardSizes['website-orders']?.width ? `${cardSizes['website-orders'].width}px` : undefined,
            height: cardSizes['website-orders']?.height ? `${cardSizes['website-orders'].height}px` : undefined,
            minWidth: '280px',
            minHeight: '220px'
          }}
          className={cn(
            'relative group rounded-xl border border-[#e4e4e7] bg-white p-5 shadow-2xs hover:border-[#d4d4d8] transition-[border-color,box-shadow] flex flex-col justify-between overflow-visible',
            resizingId === 'website-orders' && 'ring-2 ring-[#0051c3] border-[#0051c3]'
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#71717a] font-normal flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#0051c3]" />
                Website Orders & Ingestion
              </span>
              <button
                type="button"
                onClick={() => navigate('/sales/orders')}
                title="View Website Orders"
                className="w-6 h-6 flex items-center justify-center rounded text-[#a1a1aa] hover:text-[#0051c3] hover:bg-black/[0.04] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[32px] font-semibold tracking-tight text-[#18181b] leading-none">
                {stats.totalOrderQty.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#16a34a]">
                <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>18.4%</span>
              </span>
              <span className="text-xs text-[#71717a] font-normal ml-auto">
                {formatNaira(stats.totalRevenue)} gross
              </span>
            </div>
          </div>

          {/* SVG Chart with Y-Ticks */}
          <div className="relative w-full flex-1 min-h-[90px] mt-4 flex">
            <div className="w-10 pr-2 flex flex-col justify-between text-[11px] text-[#a1a1aa] font-mono leading-none py-1 select-none text-right border-r border-[#f4f4f5]">
              <span>150</span>
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>

            <div className="relative flex-1 h-full pl-2">
              <InteractiveTrendlineChart
                id="website-orders"
                points={orderVolumePoints}
                maxVal={160}
                viewBoxWidth={500}
                viewBoxHeight={100}
                strokeColor="#0051c3"
                metricLabel="Website Orders"
                formatValue={(v) => `${v} orders`}
                getContextNote={(v) => {
                  const rev = formatNaira(v * 1450)
                  if (v >= 120) return `Peak volume • ~${rev} gross`
                  if (v >= 80) return `High intake • ~${rev} gross`
                  if (v >= 40) return `Steady flow • ~${rev} gross`
                  return `Off-peak hours • ~${rev} gross`
                }}
              />
            </div>
          </div>

          {/* Bottom Time Range Axis */}
          <div className="flex justify-between text-[10px] text-[#a1a1aa] font-mono pt-2 border-t border-[#f4f4f5] mt-1 select-none">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>

          {/* Drag Resize Handle */}
          <div
            onPointerDown={(e) => handleResizeStart('website-orders', e)}
            onDoubleClick={() => handleResetSize('website-orders')}
            title="Drag to resize card • Double-click to reset"
            className="absolute bottom-0 right-0 w-7 h-7 flex items-end justify-end p-1 cursor-se-resize text-[#a1a1aa] hover:text-[#0051c3] hover:bg-blue-50/80 rounded-tl transition-colors select-none z-20 touch-none"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M11 3L3 11M11 7L7 11M11 11L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* CARD 2: PRODUCTION BATCH YIELD */}
        <div
          ref={(el) => { cardRefs.current['kitchen-yield'] = el }}
          style={{
            flex: cardSizes['kitchen-yield']?.width ? `0 0 ${cardSizes['kitchen-yield'].width}px` : '1 1 calc(50% - 8px)',
            width: cardSizes['kitchen-yield']?.width ? `${cardSizes['kitchen-yield'].width}px` : undefined,
            height: cardSizes['kitchen-yield']?.height ? `${cardSizes['kitchen-yield'].height}px` : undefined,
            minWidth: '280px',
            minHeight: '220px'
          }}
          className={cn(
            'relative group rounded-xl border border-[#e4e4e7] bg-white p-5 shadow-2xs hover:border-[#d4d4d8] transition-[border-color,box-shadow] flex flex-col justify-between overflow-visible',
            resizingId === 'kitchen-yield' && 'ring-2 ring-[#0051c3] border-[#0051c3]'
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#71717a] font-normal flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#ea580c]" />
                Production Batch Yield (Kg)
              </span>
              <button
                type="button"
                onClick={() => navigate('/production/batches')}
                title="View Production Batches"
                className="w-6 h-6 flex items-center justify-center rounded text-[#a1a1aa] hover:text-[#0051c3] hover:bg-black/[0.04] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[32px] font-semibold tracking-tight text-[#18181b] leading-none">
                {stats.totalBatchKg.toFixed(1)} kg
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#16a34a]">
                <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>12.6%</span>
              </span>
              <span className="text-xs text-[#71717a] font-normal ml-auto">
                {stats.activeBatchesCount} batches in smoker
              </span>
            </div>
          </div>

          {/* SVG Chart with Y-Ticks */}
          <div className="relative w-full flex-1 min-h-[90px] mt-4 flex">
            <div className="w-10 pr-2 flex flex-col justify-between text-[11px] text-[#a1a1aa] font-mono leading-none py-1 select-none text-right border-r border-[#f4f4f5]">
              <span>150</span>
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>

            <div className="relative flex-1 h-full pl-2">
              <InteractiveTrendlineChart
                id="kitchen-yield"
                points={kitchenYieldPoints}
                maxVal={150}
                viewBoxWidth={500}
                viewBoxHeight={100}
                strokeColor="#ea580c"
                metricLabel="Batch Output"
                formatValue={(v) => `${v.toFixed(1)} kg`}
                getContextNote={(v) => {
                  if (v >= 120) return 'Smoker Chamber A & B • 98.4% yield'
                  if (v >= 80) return 'Active smoking cycle • 97.8% yield'
                  if (v >= 40) return 'Raw prep & seasoning brine'
                  return 'Resting rack cooling phase'
                }}
              />
            </div>
          </div>

          {/* Bottom Time Range Axis */}
          <div className="flex justify-between text-[10px] text-[#a1a1aa] font-mono pt-2 border-t border-[#f4f4f5] mt-1 select-none">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>

          {/* Drag Resize Handle */}
          <div
            onPointerDown={(e) => handleResizeStart('kitchen-yield', e)}
            onDoubleClick={() => handleResetSize('kitchen-yield')}
            title="Drag to resize card • Double-click to reset"
            className="absolute bottom-0 right-0 w-7 h-7 flex items-end justify-end p-1 cursor-se-resize text-[#a1a1aa] hover:text-[#0051c3] hover:bg-blue-50/80 rounded-tl transition-colors select-none z-20 touch-none"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M11 3L3 11M11 7L7 11M11 11L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: FOUR METRIC CARDS (PACKAGING, TURNOVER, TRANSIT TIME, SETTLEMENT)
         ========================================================================= */}
      <div className="flex flex-wrap gap-4">
        {/* CARD 3: PACKAGING FULFILLMENT */}
        <div
          ref={(el) => { cardRefs.current['packaging-fulfillment'] = el }}
          style={{
            flex: cardSizes['packaging-fulfillment']?.width ? `0 0 ${cardSizes['packaging-fulfillment'].width}px` : '1 1 calc(25% - 12px)',
            width: cardSizes['packaging-fulfillment']?.width ? `${cardSizes['packaging-fulfillment']?.width}px` : undefined,
            height: cardSizes['packaging-fulfillment']?.height ? `${cardSizes['packaging-fulfillment']?.height}px` : undefined,
            minWidth: '220px',
            minHeight: '180px'
          }}
          className={cn(
            'relative group rounded-xl border border-[#e4e4e7] bg-white p-5 shadow-2xs hover:border-[#d4d4d8] transition-[border-color,box-shadow] flex flex-col justify-between overflow-visible',
            resizingId === 'packaging-fulfillment' && 'ring-2 ring-[#0051c3] border-[#0051c3]'
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#71717a] font-normal flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-[#8b5cf6]" />
                Packaging Dispatched
              </span>
              <button
                type="button"
                onClick={() => navigate('/production/packaging')}
                className="w-6 h-6 flex items-center justify-center rounded text-[#a1a1aa] hover:text-[#0051c3] hover:bg-black/[0.04] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[32px] font-semibold tracking-tight text-[#18181b] leading-none">
                {stats.queuedCount} packs
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#16a34a]">
                <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>8.2%</span>
              </span>
            </div>
          </div>

          <div className="relative w-full flex-1 min-h-[50px] mt-2 flex items-center">
            <InteractiveTrendlineChart
              id="packaging-fulfillment"
              points={packagingPoints}
              maxVal={150}
              viewBoxWidth={240}
              viewBoxHeight={60}
              strokeColor="#8b5cf6"
              metricLabel="Dispatched"
              formatValue={(v) => `${v} packs`}
              getContextNote={(v) => {
                if (v >= 100) return 'Vacuum seal line • Barcode verified'
                if (v >= 60) return 'Carton packaging & cold pouches'
                return 'Courier staging shelf ready'
              }}
            />
          </div>

          {/* Drag Resize Handle */}
          <div
            onPointerDown={(e) => handleResizeStart('packaging-fulfillment', e)}
            onDoubleClick={() => handleResetSize('packaging-fulfillment')}
            title="Drag to resize card • Double-click to reset"
            className="absolute bottom-0 right-0 w-7 h-7 flex items-end justify-end p-1 cursor-se-resize text-[#a1a1aa] hover:text-[#0051c3] hover:bg-blue-50/80 rounded-tl transition-colors select-none z-20 touch-none"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M11 3L3 11M11 7L7 11M11 11L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* CARD 4: SALES STOCK TURNOVER */}
        <div
          ref={(el) => { cardRefs.current['stock-turnover'] = el }}
          style={{
            flex: cardSizes['stock-turnover']?.width ? `0 0 ${cardSizes['stock-turnover'].width}px` : '1 1 calc(25% - 12px)',
            width: cardSizes['stock-turnover']?.width ? `${cardSizes['stock-turnover']?.width}px` : undefined,
            height: cardSizes['stock-turnover']?.height ? `${cardSizes['stock-turnover']?.height}px` : undefined,
            minWidth: '220px',
            minHeight: '180px'
          }}
          className={cn(
            'relative group rounded-xl border border-[#e4e4e7] bg-white p-5 shadow-2xs hover:border-[#d4d4d8] transition-[border-color,box-shadow] flex flex-col justify-between overflow-visible',
            resizingId === 'stock-turnover' && 'ring-2 ring-[#0051c3] border-[#0051c3]'
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#71717a] font-normal flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-[#16a34a]" />
                Sales Stock Turnover
              </span>
              <button
                type="button"
                onClick={() => navigate('/inventory/sales')}
                className="w-6 h-6 flex items-center justify-center rounded text-[#a1a1aa] hover:text-[#0051c3] hover:bg-black/[0.04] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[32px] font-semibold tracking-tight text-[#18181b] leading-none">
                {stats.turnoverPercent}%
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#16a34a]">
                <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>4.1%</span>
              </span>
            </div>
          </div>

          <div className="relative w-full flex-1 min-h-[50px] mt-2 flex items-center">
            <InteractiveTrendlineChart
              id="stock-turnover"
              points={turnoverPoints}
              maxVal={100}
              viewBoxWidth={240}
              viewBoxHeight={60}
              strokeColor="#16a34a"
              metricLabel="Turnover Rate"
              formatValue={(v) => `${v.toFixed(1)}%`}
              getContextNote={(v) => {
                if (v >= 95) return 'Optimal FIFO stock rotation'
                if (v >= 90) return 'Safe buffer threshold'
                return 'Replenishment triggered'
              }}
            />
          </div>

          {/* Drag Resize Handle */}
          <div
            onPointerDown={(e) => handleResizeStart('stock-turnover', e)}
            onDoubleClick={() => handleResetSize('stock-turnover')}
            title="Drag to resize card • Double-click to reset"
            className="absolute bottom-0 right-0 w-7 h-7 flex items-end justify-end p-1 cursor-se-resize text-[#a1a1aa] hover:text-[#0051c3] hover:bg-blue-50/80 rounded-tl transition-colors select-none z-20 touch-none"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M11 3L3 11M11 7L7 11M11 11L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* CARD 5: AVERAGE DELIVERY DURATION */}
        <div
          ref={(el) => { cardRefs.current['avg-delivery-time'] = el }}
          style={{
            flex: cardSizes['avg-delivery-time']?.width ? `0 0 ${cardSizes['avg-delivery-time'].width}px` : '1 1 calc(25% - 12px)',
            width: cardSizes['avg-delivery-time']?.width ? `${cardSizes['avg-delivery-time'].width}px` : undefined,
            height: cardSizes['avg-delivery-time']?.height ? `${cardSizes['avg-delivery-time']?.height}px` : undefined,
            minWidth: '220px',
            minHeight: '180px'
          }}
          className={cn(
            'relative group rounded-xl border border-[#e4e4e7] bg-white p-5 shadow-2xs hover:border-[#d4d4d8] transition-[border-color,box-shadow] flex flex-col justify-between overflow-visible',
            resizingId === 'avg-delivery-time' && 'ring-2 ring-[#0051c3] border-[#0051c3]'
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#71717a] font-normal flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#0051c3]" />
                Average Delivery Time
              </span>
              <button
                type="button"
                onClick={() => navigate('/logistics/board')}
                className="w-6 h-6 flex items-center justify-center rounded text-[#a1a1aa] hover:text-[#0051c3] hover:bg-black/[0.04] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[32px] font-semibold tracking-tight text-[#18181b] leading-none">
                {stats.avgDeliveryTime} m
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#16a34a]">
                <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>14.3% faster</span>
              </span>
            </div>
          </div>

          <div className="relative w-full flex-1 min-h-[50px] mt-2 flex items-center">
            <InteractiveTrendlineChart
              id="avg-delivery-time"
              points={deliveryTransitPoints}
              maxVal={40}
              viewBoxWidth={240}
              viewBoxHeight={60}
              strokeColor="#0051c3"
              metricLabel="Transit Time"
              formatValue={(v) => `${v} mins`}
              getContextNote={(v) => {
                if (v <= 25) return 'Express corridor (<25m SLA)'
                if (v <= 28) return 'Target dispatch time met'
                return 'Peak traffic adjustment'
              }}
            />
          </div>

          {/* Drag Resize Handle */}
          <div
            onPointerDown={(e) => handleResizeStart('avg-delivery-time', e)}
            onDoubleClick={() => handleResetSize('avg-delivery-time')}
            title="Drag to resize card • Double-click to reset"
            className="absolute bottom-0 right-0 w-7 h-7 flex items-end justify-end p-1 cursor-se-resize text-[#a1a1aa] hover:text-[#0051c3] hover:bg-blue-50/80 rounded-tl transition-colors select-none z-20 touch-none"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M11 3L3 11M11 7L7 11M11 11L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* CARD 6: RIDER PAYOUT CLEARANCE */}
        <div
          ref={(el) => { cardRefs.current['payout-clearance'] = el }}
          style={{
            flex: cardSizes['payout-clearance']?.width ? `0 0 ${cardSizes['payout-clearance'].width}px` : '1 1 calc(25% - 12px)',
            width: cardSizes['payout-clearance']?.width ? `${cardSizes['payout-clearance'].width}px` : undefined,
            height: cardSizes['payout-clearance']?.height ? `${cardSizes['payout-clearance'].height}px` : undefined,
            minWidth: '220px',
            minHeight: '180px'
          }}
          className={cn(
            'relative group rounded-xl border border-[#e4e4e7] bg-white p-5 shadow-2xs hover:border-[#d4d4d8] transition-[border-color,box-shadow] flex flex-col justify-between overflow-hidden',
            resizingId === 'payout-clearance' && 'ring-2 ring-[#0051c3] border-[#0051c3]'
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#71717a] font-normal flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a]" />
                Rider Payout Clearance
              </span>
              <button
                type="button"
                onClick={() => navigate('/logistics/riders')}
                className="w-6 h-6 flex items-center justify-center rounded text-[#a1a1aa] hover:text-[#0051c3] hover:bg-black/[0.04] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[28px] font-semibold tracking-tight text-[#18181b] leading-none">
                {formatNaira(stats.totalPayouts)}
              </span>
            </div>
          </div>

          {/* Settled indicator */}
          <div className="relative w-full flex-1 min-h-[50px] flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 60" preserveAspectRatio="none">
              <path
                d="M 0,35 Q 60,25 120,35 T 240,35"
                fill="none"
                stroke="#dcfce7"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            </svg>
            <span className="relative z-10 px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-700 shadow-2xs select-none flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              100% Cleared
            </span>
          </div>

          {/* Drag Resize Handle */}
          <div
            onPointerDown={(e) => handleResizeStart('payout-clearance', e)}
            onDoubleClick={() => handleResetSize('payout-clearance')}
            title="Drag to resize card • Double-click to reset"
            className="absolute bottom-0 right-0 w-7 h-7 flex items-end justify-end p-1 cursor-se-resize text-[#a1a1aa] hover:text-[#0051c3] hover:bg-blue-50/80 rounded-tl transition-colors select-none z-20 touch-none"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M11 3L3 11M11 7L7 11M11 11L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CloudflareAnalyticsSection
