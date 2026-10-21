import React from 'react'
import { cn } from '@/lib/utils'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

export interface MetricCardProps {
  title: string
  value: string | number
  delta?: {
    value: string | number
    isPositive?: boolean
    isNeutral?: boolean
    period?: string
  }
  trend?: {
    value: string | number
    isPositive?: boolean
  }
  subtext?: string
  description?: string
  icon?: React.ReactNode
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'info'
  className?: string
  action?: React.ReactNode
  sparkline?: number[]
  sparklineType?: 'spikes' | 'wave' | 'dense' | 'flat' | 'auto'
  noData?: boolean
  strokeColor?: string
}

// Generate realistic deterministic sparklines matching Cloudflare Metrics
function generateDeterministicPoints(title: string, value: string | number, type?: MetricCardProps['sparklineType']): number[] {
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  
  if (type === 'flat') {
    return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  }

  // Type: Wave (e.g. Cache Hit Rate, Yield, Valuation)
  if (type === 'wave' || title.toLowerCase().includes('rate') || title.toLowerCase().includes('hit') || title.toLowerCase().includes('yield') || title.toLowerCase().includes('valuation')) {
    return [
      84, 90, 88, 95, 92, 89, 96, 94, 98, 93, 97, 95, 99, 94, 98, 96, 100, 95, 97
    ]
  }

  // Type: Dense jitter (e.g. CPU Time, Active Pit Runs, Live tracking)
  if (type === 'dense' || title.toLowerCase().includes('time') || title.toLowerCase().includes('cpu') || title.toLowerCase().includes('pit') || title.toLowerCase().includes('transit')) {
    return [
      32, 60, 45, 78, 40, 85, 52, 70, 38, 90, 48, 82, 55, 68, 44, 75, 50, 88, 58, 72, 65
    ]
  }

  // Type: Spikes (e.g. Requests, Invocations, Stock Movements, Orders, Alerts)
  if (type === 'spikes' || typeof value === 'number' || title.toLowerCase().includes('request') || title.toLowerCase().includes('dispatch') || title.toLowerCase().includes('order') || title.toLowerCase().includes('alert')) {
    const base = [
      1, 2, 1, 1, 4, 1, 2, 12, 2, 1, 3, 1, 24, 2, 1, 5, 1, 18, 3, 1, 2, 30, 2, 1
    ]
    // Shift slightly by hash for variety
    const shift = hash % 5
    return [...base.slice(shift), ...base.slice(0, shift)]
  }

  // Default natural curve
  return [
    12, 18, 15, 26, 22, 35, 28, 45, 38, 55, 48, 62, 54, 70, 65, 80, 72, 85
  ]
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  delta,
  trend,
  subtext,
  description,
  icon,
  variant = 'default',
  className,
  action,
  sparkline,
  sparklineType = 'auto',
  noData,
  strokeColor,
}) => {
  const effectiveSubtext = subtext || description
  const effectiveDelta = delta || (trend ? { value: `${trend.isPositive ? '+' : ''}${trend.value}%`, isPositive: trend.isPositive } : undefined)

  const accentBorders = {
    default: '',
    danger: 'border-l-2 border-l-kumo-danger',
    warning: 'border-l-2 border-l-kumo-warning',
    success: 'border-l-2 border-l-kumo-success',
    info: 'border-l-2 border-l-kumo-brand',
  }

  // Check if this card represents a "No data" state like Cloudflare's Errors: 0
  const isZeroValue = value === 0 || value === '0'
  const isNoData = noData || (isZeroValue && (!effectiveDelta || effectiveDelta.value === '0' || String(effectiveDelta.value).includes('0%')))

  const points = sparkline ?? (isNoData ? [0, 0, 0, 0, 0] : generateDeterministicPoints(title, value, sparklineType))

  // Render SVG Sparkline
  const renderSparkline = () => {
    if (isNoData || points.every(p => p === 0)) {
      return (
        <div className="relative w-full h-8 flex items-center">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 32">
            <line
              x1="0"
              y1="22"
              x2="100"
              y2="22"
              stroke="currentColor"
              className="text-kumo-line"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-kumo-base ring ring-kumo-line text-kumo-subtle shadow-2xs">
              No data
            </span>
          </div>
        </div>
      )
    }

    const min = Math.min(...points)
    const max = Math.max(...points)
    const range = max - min || 1
    const height = 30
    const paddingY = 2

    const coords = points.map((val, idx) => {
      const x = (idx / (points.length - 1)) * 100
      const y = height - paddingY - ((val - min) / range) * (height - paddingY * 2)
      return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) }
    })

    const pathD = coords.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`
    }, '')

    const areaD = `${pathD} L 100 32 L 0 32 Z`
    const chartStroke = strokeColor || '#2563eb'
    const chartFill = strokeColor ? 'rgba(37, 99, 235, 0.10)' : 'rgba(37, 99, 235, 0.14)'

    return (
      <div className="relative w-full h-8 flex items-end">
        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 32">
          {/* Subtle blue area fill matching Cloudflare dashboard analytics */}
          <path
            d={areaD}
            fill={chartFill}
            stroke="none"
          />
          {/* Crisp blue line with uniform stroke */}
          <path
            d={pathD}
            fill="none"
            stroke={chartStroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    )
  }

  // Delta parsing
  const renderDelta = () => {
    if (!effectiveDelta) return null

    const deltaStr = String(effectiveDelta.value)
    const isNegative = effectiveDelta.isPositive === false || deltaStr.startsWith('-') || deltaStr.includes('Out of stock') || deltaStr.includes('Critical')
    const isPositive = effectiveDelta.isPositive === true || deltaStr.startsWith('+')
    const isNeutral = effectiveDelta.isNeutral || (!isNegative && !isPositive)

    return (
      <span
        className={cn(
          'inline-flex items-center text-xs font-semibold shrink-0 font-sans tracking-tight',
          isNeutral
            ? 'text-kumo-subtle'
            : isPositive
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-red-600 dark:text-red-400'
        )}
      >
        {isNeutral ? (
          <Minus className="w-3 h-3 mr-0.5" />
        ) : isPositive ? (
          <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 stroke-[2.5]" />
        ) : (
          <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 stroke-[2.5]" />
        )}
        <span>{deltaStr}</span>
      </span>
    )
  }

  return (
    <div
      data-sentry-component="ChartCardStandard"
      className={cn(
        'relative flex min-h-[124px] flex-col justify-between overflow-hidden rounded-lg bg-kumo-base ring ring-kumo-line transition-all hover:ring-kumo-interact p-3.5 shadow-2xs select-none',
        accentBorders[variant],
        className
      )}
    >
      <div>
        {/* Title row */}
        <div className="flex items-center justify-between gap-2">
          <span
            data-slot="chart-card-title"
            className="text-[13px] font-normal text-kumo-subtle truncate tracking-normal font-sans"
          >
            {title}
          </span>
          {icon && <div className="text-kumo-subtle shrink-0 opacity-60 scale-90">{icon}</div>}
        </div>

        {/* Value and inline delta row */}
        <div className="mt-1 flex items-baseline gap-2.5 flex-wrap">
          <div className="text-xl sm:text-2xl font-bold tracking-normal text-kumo-strong font-display">
            {value}
          </div>
          {renderDelta()}
        </div>
      </div>

      {/* Cloudflare Sparkline Chart */}
      <div className="mt-2.5 w-full">
        {renderSparkline()}
      </div>

      {/* Optional micro subtext */}
      {effectiveSubtext && (
        <div className="mt-1.5 text-[11px] text-kumo-subtle/80 truncate">
          {effectiveSubtext}
        </div>
      )}

      {action && (
        <div className="mt-2 pt-2 border-t border-kumo-line flex items-center justify-end">
          {action}
        </div>
      )}
    </div>
  )
}
