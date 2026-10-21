import React, { useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface KumoTabItem {
  id: string
  label: React.ReactNode
  badge?: string | number
}

export interface KumoTabsProps {
  tabs: KumoTabItem[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
  size?: 'sm' | 'md'
}

export const KumoTabs: React.FC<KumoTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  size = 'md',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; height: number; top: number }>({
    left: 2,
    width: 0,
    height: 32,
    top: 2,
  })
  const [mounted, setMounted] = useState(false)

  const updateIndicator = () => {
    if (!containerRef.current) return
    const activeEl = containerRef.current.querySelector<HTMLElement>(`[data-tab-id="${activeTab}"]`)
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        height: activeEl.offsetHeight,
        top: activeEl.offsetTop,
      })
    }
  }

  useEffect(() => {
    updateIndicator()
    setMounted(true)
    const handleResize = () => updateIndicator()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeTab, tabs])

  return (
    <div
      ref={containerRef}
      role="tablist"
      data-orientation="horizontal"
      data-kumo-component="Tabs"
      className={cn(
        'kumo-tabs-list relative inline-flex min-w-0 shrink items-center rounded-lg bg-[#f0f0f3] dark:bg-zinc-900 border border-black/[0.04] dark:border-white/[0.08] p-1 h-10 font-sans select-none overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        size === 'sm' && 'h-8 p-0.5 text-xs',
        className
      )}
    >
      {/* Sliding Active Pill Background matching Cloudflare Kumo specification */}
      <div
        role="presentation"
        className={cn(
          'absolute z-1 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] bg-white dark:bg-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.06] dark:ring-white/[0.08] rounded-md pointer-events-none',
          !mounted && 'opacity-0'
        )}
        style={{
          left: 0,
          transform: `translateX(${indicatorStyle.left}px)`,
          width: `${indicatorStyle.width}px`,
          height: `${indicatorStyle.height}px`,
          top: `${indicatorStyle.top}px`,
        }}
      />

      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            data-tab-id={tab.id}
            data-kumo-part="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'group no-underline relative z-2 flex items-center justify-center bg-transparent whitespace-nowrap focus:outline-none cursor-pointer rounded-md px-3.5 h-8 transition-colors gap-1.5 text-sm font-medium leading-none select-none',
              size === 'sm' && 'px-2.5 h-7 text-xs',
              isActive
                ? 'text-[#18181b] dark:text-zinc-100 font-medium'
                : 'text-[#60606a] hover:text-[#18181b] dark:text-zinc-400 dark:hover:text-zinc-100'
            )}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'text-xs transition-colors',
                  isActive
                    ? 'text-[#60606a] dark:text-zinc-400 font-medium'
                    : 'text-[#8c8c95] group-hover:text-[#60606a] dark:text-zinc-500 dark:group-hover:text-zinc-300'
                )}
              >
                ({tab.badge})
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
