import React, { useState, useRef, useLayoutEffect, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

const GAP = 6 // distance between trigger and tooltip
const PADDING = 12 // minimum safe distance from viewport edge

/**
 * Tooltip rendered through a portal with fixed positioning so it can never be
 * clipped by scrolling / overflow-hidden ancestors (modals, scroll lists, tables).
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  const updatePosition = useCallback(() => {
    const trigger = containerRef.current
    const tip = tooltipRef.current
    if (!trigger || !tip) return

    const t = trigger.getBoundingClientRect()
    const w = tip.offsetWidth
    const h = tip.offsetHeight
    const vw = window.innerWidth
    const vh = window.innerHeight

    // Auto-flip when there is not enough room on the preferred side
    let pos = position
    if (pos === 'top' && t.top - GAP - h < PADDING) pos = 'bottom'
    else if (pos === 'bottom' && t.bottom + GAP + h > vh - PADDING) pos = 'top'
    else if (pos === 'left' && t.left - GAP - w < PADDING) pos = 'right'
    else if (pos === 'right' && t.right + GAP + w > vw - PADDING) pos = 'left'

    let top = 0
    let left = 0
    if (pos === 'top' || pos === 'bottom') {
      top = pos === 'top' ? t.top - GAP - h : t.bottom + GAP
      left = t.left + t.width / 2 - w / 2
    } else {
      top = t.top + t.height / 2 - h / 2
      left = pos === 'left' ? t.left - GAP - w : t.right + GAP
    }

    // Clamp inside the viewport so the message is always fully readable
    left = Math.min(Math.max(left, PADDING), vw - PADDING - w)
    top = Math.min(Math.max(top, PADDING), vh - PADDING - h)

    setCoords({ top: Math.round(top), left: Math.round(left) })
  }, [position])

  useLayoutEffect(() => {
    if (isVisible) updatePosition()
    else setCoords(null)
  }, [isVisible, updatePosition, content])

  // Keep the tooltip attached to its trigger while scrolling / resizing
  useEffect(() => {
    if (!isVisible) return
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isVisible, updatePosition])

  if (!content) return <>{children}</>

  return (
    <div
      ref={containerRef}
      data-kumo-tooltip="true"
      className={cn('relative inline-flex items-center', className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && typeof document !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          style={{
            position: 'fixed',
            top: coords?.top ?? 0,
            left: coords?.left ?? 0,
            visibility: coords ? 'visible' : 'hidden',
          }}
          className={cn(
            'z-[100] px-2.5 py-1.5 text-[11px] font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-lg shadow-lg pointer-events-none transition-opacity duration-150 font-sans',
            'max-w-[280px] sm:max-w-xs w-max whitespace-normal break-words text-center leading-snug'
          )}
        >
          {content}
        </div>,
        document.body
      )}
    </div>
  )
}

export default Tooltip
