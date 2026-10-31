import React from 'react'
import { cn } from '@/lib/utils'

export interface BorderBeamProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | number
  duration?: number
  borderWidth?: number
  anchor?: number
  colorFrom?: string
  colorTo?: string
  delay?: number
  borderRadius?: number
  active?: boolean
  children?: React.ReactNode
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  className,
  size = 200,
  duration = 15,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = '#c0201f',
  colorTo = '#f6821f',
  delay = 0,
  borderRadius = 18,
  active = true,
  children,
}) => {
  const sizeValue = typeof size === 'number' ? size : size === 'sm' ? 120 : size === 'lg' ? 300 : 200

  return (
    <div
      className={cn('relative rounded-[inherit] overflow-hidden p-[1px]', className)}
      style={{ borderRadius }}
    >
      {active && (
        <div
          style={
            {
              '--size': `${sizeValue}px`,
              '--duration': `${duration}s`,
              '--anchor': `${anchor}%`,
              '--border-width': `${borderWidth}px`,
              '--color-from': colorFrom,
              '--color-to': colorTo,
              '--delay': `-${delay}s`,
            } as React.CSSProperties
          }
          className={cn(
            'pointer-events-none absolute inset-0 rounded-[inherit]',
            '[border:calc(var(--border-width)*1px)_solid_transparent]',
            '![mask-clip:padding-box,border-box] ![mask-composite:intersect]',
            '[mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]',
            'after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:animate-border-beam',
            'after:[animation-delay:var(--delay)] after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)]',
            'after:[offset-anchor:calc(var(--anchor)*1%)_50%] after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]'
          )}
        />
      )}
      <div className="relative z-10 w-full h-full rounded-[inherit]">{children}</div>
    </div>
  )
}

export default BorderBeam
