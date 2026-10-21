import React, { useState, useRef, useLayoutEffect } from 'react'
import { cn } from '@/lib/utils'

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [clampedStyle, setClampedStyle] = useState<React.CSSProperties>({})

  useLayoutEffect(() => {
    if (isVisible && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const padding = 12 // minimum safe distance from screen edge

      let shiftX = 0
      if (rect.left < padding) {
        shiftX = padding - rect.left
      } else if (rect.right > viewportWidth - padding) {
        shiftX = (viewportWidth - padding) - rect.right
      }

      if (shiftX !== 0) {
        if (position === 'top' || position === 'bottom') {
          setClampedStyle({
            transform: `translateX(calc(-50% + ${Math.round(shiftX)}px))`
          })
        }
      } else {
        setClampedStyle({})
      }
    } else {
      setClampedStyle({})
    }
  }, [isVisible, position])

  if (!content) return <>{children}</>

  const posClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  }

  return (
    <div
      data-kumo-tooltip="true"
      className={cn('relative inline-flex items-center', className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          style={clampedStyle}
          className={cn(
            'absolute z-50 px-2.5 py-1.5 text-[11px] font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-lg shadow-lg pointer-events-none transition-opacity duration-150 font-sans',
            'max-w-[280px] sm:max-w-xs w-max whitespace-normal break-words text-center leading-snug',
            posClasses[position]
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}

export default Tooltip
