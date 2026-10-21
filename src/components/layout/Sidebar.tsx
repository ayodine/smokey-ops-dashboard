import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Boxes,
  Factory,
  Flame,
  Truck,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Home,
  History,
  Search,
  ChevronsUpDown,
  Check,
  User,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: number | string
}

interface NavSection {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  defaultHref: string
  items: NavItem[]
}

const RECENT_NAV_ITEMS = [
  { label: 'Raw Ingredients', href: '/inventory/raw' },
  { label: 'Packaging Materials', href: '/inventory/packaging' },
  { label: 'Stock Movements', href: '/inventory/movements' },
  { label: 'Production Batches', href: '/production/batches' },
  { label: 'Delivery Fleet & Riders', href: '/logistics/riders' },
]

const NAV_SECTIONS: NavSection[] = [
  {
    id: 'inventory',
    title: 'Inventory Control',
    icon: Boxes,
    defaultHref: '/inventory/raw',
    items: [
      { label: 'Raw Ingredients', href: '/inventory/raw', badge: '13' },
      { label: 'Packaging Materials', href: '/inventory/packaging', badge: '7' },
      { label: 'Sales Inventory', href: '/inventory/sales', badge: '7' },
      { label: 'Stock Movements', href: '/inventory/movements' },
      { label: 'Suppliers & Vendors', href: '/inventory/suppliers', badge: '4' },
    ],
  },
  {
    id: 'production',
    title: 'Production Runs',
    icon: Factory,
    defaultHref: '/production/batches',
    items: [
      { label: 'Production Batches', href: '/production/batches', badge: '3' },
      { label: 'Packaging Execution', href: '/production/packaging', badge: '3' },
      { label: 'Kitchen Shift Tasks', href: '/production/tasks', badge: '4' },
    ],
  },
  {
    id: 'logistics',
    title: 'Logistics & Dispatch',
    icon: Truck,
    defaultHref: '/logistics/board',
    items: [
      { label: 'Dispatch Board', href: '/logistics/board', badge: '5' },
      { label: 'Delivery Schedule', href: '/logistics/schedule', badge: '3' },
      { label: 'Delivery Fleet & Riders', href: '/logistics/riders', badge: '4' },
      { label: 'Store Pickup Counter', href: '/logistics/pickup', badge: '2' },
      { label: 'Courier Fees & Delivery', href: '/logistics/third-party' },
    ],
  },
]

interface SidebarProps {
  isMobileOpen: boolean
  onCloseMobile: () => void
  onOpenCommandMenu?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile, onOpenCommandMenu }) => {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('ops_sidebar_collapsed') === 'true'
  })

  // Account dropdown state
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [activeAccount, setActiveAccount] = useState('Ayodine47@gmail.com')

  // Recents collapsible state
  const [isRecentsOpen, setIsRecentsOpen] = useState(true)

  // Track expanded collapsible sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    return {
      inventory: true,
      production: true,
      logistics: true,
    }
  })

  const toggleSection = (id: string) => {
    if (isCollapsed) {
      setIsCollapsed(false)
      localStorage.setItem('ops_sidebar_collapsed', 'false')
    }
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev
      localStorage.setItem('ops_sidebar_collapsed', String(next))
      return next
    })
  }

  const sidebarContent = (
    <div
      data-kumo-component="Sidebar"
      className={cn(
        'flex h-full flex-col min-w-0 overflow-hidden whitespace-nowrap bg-kumo-canvas text-kumo-default border-r border-kumo-line select-none transition-[width] duration-250 ease-[cubic-bezier(0.77,0,0.175,1)] font-sans',
        isCollapsed ? 'w-[57px]' : 'w-[16.25rem]'
      )}
    >
      {/* 1. Account Dropdown Header with 58px border line matching TopNav */}
      <div className="relative border-b border-kumo-line">
        {isCollapsed ? (
          <div className="flex h-[58px] shrink-0 items-center justify-center w-full">
            <button
              type="button"
              onClick={toggleCollapse}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-kumo-subtle hover:text-kumo-strong hover:bg-kumo-tint cursor-pointer transition-colors"
              title="Expand sidebar"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex h-[58px] shrink-0 items-center justify-between px-3">
            <button
              type="button"
              onClick={() => setIsAccountMenuOpen(prev => !prev)}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left hover:bg-kumo-tint py-1.5 px-2 -ml-2 rounded-lg cursor-pointer transition-colors"
            >
              {/* Person Profile Icon */}
              <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <User className="w-3.5 h-3.5" />
              </div>

              <span className="text-xs font-semibold text-kumo-strong truncate flex-1 tracking-normal">
                {activeAccount.length > 20 ? `${activeAccount.slice(0, 16)}...` : activeAccount}
              </span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-kumo-subtle shrink-0 ml-1" />
            </button>

            {/* Sidebar Collapse Toggle Button */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-kumo-subtle hover:text-kumo-strong hover:bg-kumo-tint cursor-pointer transition-colors shrink-0 ml-1"
              title="Collapse sidebar"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Account Menu Popover */}
        {isAccountMenuOpen && !isCollapsed && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsAccountMenuOpen(false)}
            />
            <div className="absolute left-2.5 top-[50px] w-60 rounded-lg border border-kumo-line bg-kumo-base shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 text-xs">
              <div className="px-3 py-2 border-b border-kumo-line">
                <p className="text-[11px] text-kumo-subtle">Signed in as</p>
                <p className="font-semibold text-kumo-strong truncate">{activeAccount}</p>
                <span className="inline-block mt-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-medium">
                  Administrator
                </span>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveAccount('Ayodine47@gmail.com')
                    setIsAccountMenuOpen(false)
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-kumo-tint cursor-pointer"
                >
                  <span className="truncate">Ayodine47@gmail.com</span>
                  {activeAccount === 'Ayodine47@gmail.com' && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAccount('ops-team@smokeyhut.com')
                    setIsAccountMenuOpen(false)
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-kumo-tint cursor-pointer"
                >
                  <span className="truncate">ops-team@smokeyhut.com</span>
                  {activeAccount === 'ops-team@smokeyhut.com' && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              </div>

              <div className="border-t border-kumo-line pt-1">
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen(false)}
                  className="w-full px-3 py-1.5 text-left text-kumo-subtle hover:text-kumo-strong hover:bg-kumo-tint cursor-pointer"
                >
                  Account Settings
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 2. Quick Search & Recents Navigation (as shown in Screenshot 1) */}
      {!isCollapsed && (
        <div className="px-2 pt-2.5 pb-2 space-y-1.5 border-b border-kumo-line/60">
          {/* Quick Search Input */}
          <div className="px-0.5">
            <button
              type="button"
              onClick={onOpenCommandMenu}
              className="w-full flex items-center justify-between h-8 px-2.5 rounded-lg border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-xs text-kumo-subtle transition-colors cursor-pointer shadow-2xs font-sans"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 opacity-60 shrink-0" />
                <span className="truncate">Quick search...</span>
              </div>
              <kbd className="font-sans text-[10px] px-1.5 py-0.2 rounded border border-kumo-line bg-kumo-tint text-kumo-subtle shrink-0">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Account Home Link */}
          <Link
            to="/overview"
            onClick={onCloseMobile}
            className={cn(
              'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer',
              location.pathname === '/' || location.pathname === '/overview'
                ? 'bg-kumo-tint text-kumo-strong font-semibold'
                : 'text-kumo-default hover:bg-kumo-tint hover:text-kumo-strong'
            )}
          >
            <Home className="w-4 h-4 text-kumo-subtle shrink-0" />
            <span className="truncate">Account home</span>
          </Link>

          {/* Recents Collapsible Sub-menu */}
          <div>
            <button
              type="button"
              onClick={() => setIsRecentsOpen(prev => !prev)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[13px] font-medium text-kumo-default hover:bg-kumo-tint hover:text-kumo-strong cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <History className="w-4 h-4 text-kumo-subtle shrink-0" />
                <span>Recents</span>
              </div>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 text-kumo-subtle transition-transform duration-200 shrink-0',
                  !isRecentsOpen && '-rotate-90'
                )}
              />
            </button>

            {isRecentsOpen && (
              <div className="relative pl-6 pr-1 py-0.5 space-y-0.5">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-1 left-[18px] z-10 block w-px bg-kumo-line"
                />
                {RECENT_NAV_ITEMS.map(rec => {
                  const isActive = location.pathname === rec.href
                  return (
                    <Link
                      key={rec.href}
                      to={rec.href}
                      onClick={onCloseMobile}
                      className={cn(
                        'block px-2.5 py-1.5 text-[13px] rounded-md transition-colors truncate',
                        isActive
                          ? 'text-primary font-semibold bg-primary/5'
                          : 'text-kumo-subtle hover:text-kumo-strong hover:bg-kumo-tint font-normal'
                      )}
                    >
                      {rec.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Main Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {NAV_SECTIONS.map(section => {
          const SectionIcon = section.icon
          const isOpen = openSections[section.id]
          const isSectionActive = section.items.some(item => location.pathname.startsWith(item.href))

          return (
            <div key={section.id} className="space-y-1">
              {/* Section Header Button */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[13px] font-semibold cursor-pointer transition-colors text-left',
                  isSectionActive
                    ? 'text-primary bg-primary/5'
                    : 'text-kumo-strong hover:bg-kumo-tint'
                )}
                title={isCollapsed ? section.title : undefined}
              >
                <SectionIcon className={cn('w-4 h-4 shrink-0', isSectionActive ? 'text-primary' : 'text-kumo-subtle')} />
                
                {!isCollapsed && (
                  <>
                    <span className="truncate flex-1 tracking-tight uppercase text-xs font-bold">
                      {section.title}
                    </span>
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 text-kumo-subtle transition-transform duration-200 shrink-0',
                        !isOpen && '-rotate-90'
                      )}
                    />
                  </>
                )}
              </button>

              {/* Submenu Links */}
              {isOpen && !isCollapsed && (
                <div className="relative pl-4 pr-0 py-0.5">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-1 left-[14px] z-10 block w-px bg-kumo-line"
                  />

                  <ul className="m-0 list-none flex flex-col gap-y-0.5 p-0">
                    {section.items.map(subItem => {
                      const isSubActive = location.pathname === subItem.href || location.pathname.startsWith(`${subItem.href}/`)

                      return (
                        <li key={subItem.href} className="relative">
                          <Link
                            to={subItem.href}
                            onClick={onCloseMobile}
                            className={cn(
                              'group/menu-button relative flex min-h-[32px] w-full min-w-0 cursor-pointer items-center justify-between rounded-md px-2.5 py-1 text-[13px] font-medium outline-none transition-colors',
                              isSubActive
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-kumo-default hover:bg-kumo-tint hover:text-kumo-strong'
                            )}
                          >
                            <span className="truncate flex-1 text-[13px]">{subItem.label}</span>
                            {subItem.badge && (
                              <span
                                className={cn(
                                  'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold select-none border ml-1.5',
                                  isSubActive 
                                    ? 'badge-red-pill' 
                                    : 'border-kumo-line text-kumo-subtle bg-kumo-surface'
                                )}
                                style={isSubActive ? { backgroundColor: '#FCE8EC', borderColor: '#F3B0BB', color: '#C8102E' } : undefined}
                              >
                                {subItem.badge}
                              </span>
                            )}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 4. Smokey Hut Ops Moved to the Bottom of the Side Menu (Footer) */}
      <div className="border-t border-kumo-line p-3 shrink-0 bg-kumo-canvas">
        {!isCollapsed ? (
          <div className="flex flex-col gap-2">
            <Link
              to="/inventory/raw"
              className="flex items-center gap-2.5 min-w-0 group cursor-pointer focus:outline-none"
            >
              <div className="w-7 h-7 rounded bg-primary flex items-center justify-center shrink-0 shadow-xs text-white">
                <Flame className="w-4 h-4 fill-current" />
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <span className="font-bold text-xs leading-none text-kumo-strong tracking-tight truncate">
                  Smokey Hut Ops
                </span>
                <span className="text-[10px] text-kumo-subtle font-sans truncate mt-0.5">
                  Food Processing OS
                </span>
              </div>
            </Link>

            <div className="flex items-center justify-between text-[11px] text-kumo-subtle pt-2 border-t border-kumo-line/60">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-sans text-xs">Live System Sync</span>
              </div>
              <span className="font-sans text-[10px] text-kumo-subtle">v2.4 Pro</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2" title="Smokey Hut Ops">
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center shrink-0 shadow-xs text-white">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        data-sidebar="sidebar"
        className={cn(
          'hidden md:block shrink-0 transition-[width] duration-250 ease-[cubic-bezier(0.77,0,0.175,1)] h-screen sticky top-0 z-30',
          isCollapsed ? 'w-[57px]' : 'w-[16.25rem]'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-kumo-canvas/80 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-[16.25rem] max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200 z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
export default Sidebar
