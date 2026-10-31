import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { useWarehouse } from '@/context/WarehouseContext'
import { cn } from '@/lib/utils'
import {
  Boxes,
  Factory,
  Truck,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Home,
  Search,
  ChevronsUpDown,
  Check,
  Plus,
  ShieldCheck,
  LogOut,
  Settings,
  ShoppingBag,
  Building2,
  Package,
} from 'lucide-react'
import { SignInActivityModal } from './SignInActivityModal'

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

interface SidebarProps {
  isMobileOpen: boolean
  onCloseMobile: () => void
  onOpenCommandMenu?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile, onOpenCommandMenu }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('ops_sidebar_collapsed') === 'true'
  })

  const {
    activeAccountEmail,
    currentAccount,
    switchAccount,
    logout,
    availableAccounts,
    websiteOrders,
    rawProducts,
    packagingProducts,
    salesProducts,
    suppliers,
    riders,
    rawMovements,
    productionBatches,
    kitchenTasks,
    packagingQueue,
    logisticsDeliveries,
    scheduledOrders,
    storePickups,
    thirdPartySummaries
  } = useSmokeyOps()

  const { facilities } = useWarehouse()

  // Live active orders count derived synchronously from context websiteOrders
  const activeOrdersCount = useMemo(() => {
    if (!websiteOrders || websiteOrders.length === 0) return undefined
    return websiteOrders.filter(o => o.fulfillment_status !== 'delivered' && o.payment_status !== 'refunded').length
  }, [websiteOrders])

  // Sign-in activity modal state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [accountSearchQuery, setAccountSearchQuery] = useState('')

  const filteredAccounts = useMemo(() => {
    if (!accountSearchQuery.trim()) return availableAccounts
    const q = accountSearchQuery.toLowerCase()
    return availableAccounts.filter(acc =>
      acc.email.toLowerCase().includes(q) ||
      acc.name.toLowerCase().includes(q)
    )
  }, [availableAccounts, accountSearchQuery])

  // Filter sections and compute dynamic real-time badge counts from Supabase
  const navSections = useMemo<NavSection[]>(() => {
    if (currentAccount.role === 'rider') {
      return [
        {
          id: 'logistic',
          title: 'LOGISTIC',
          icon: Truck,
          defaultHref: '/logistics/rider-portal',
          items: [
            { label: 'Rider Portal (My Trips)', href: '/logistics/rider-portal', badge: 'Active' },
          ],
        },
      ]
    }

    const activeBatchesCount = productionBatches.filter(b => b.status === 'in_production').length
    const pendingTasksCount = kitchenTasks.filter(t => t.status !== 'done').length
    const pendingPackagingCount = packagingQueue.filter(q => q.order_status !== 'packaged').length
    const activeDispatchesCount = logisticsDeliveries.filter(d => ['pending', 'assigned', 'in_transit', 'out_for_delivery'].includes(d.status)).length
    const scheduledOrdersCount = scheduledOrders.filter(o => o.order_status !== 'dispatched').length
    const pendingPickupsCount = storePickups.filter(p => p.order_status === 'ready_for_pickup').length

    return [
      {
        id: 'sales',
        title: 'SALES',
        icon: ShoppingBag,
        defaultHref: '/sales/orders',
        items: [
          { label: 'Website Orders', href: '/sales/orders', badge: activeOrdersCount !== undefined ? activeOrdersCount : undefined },
          { label: 'Sales Inventory', href: '/inventory/sales', badge: salesProducts.length },
        ],
      },
      {
        id: 'inventory',
        title: 'INVENTORY',
        icon: Boxes,
        defaultHref: '/inventory/raw',
        items: [
          { label: 'Raw Inventory', href: '/inventory/raw', badge: rawProducts.length },
          { label: 'Stock Movements', href: '/inventory/movements', badge: rawMovements.length > 0 ? rawMovements.length : undefined },
          { label: 'Suppliers & Vendors', href: '/inventory/suppliers', badge: suppliers.length },
        ],
      },
      {
        id: 'production',
        title: 'PRODUCTION',
        icon: Factory,
        defaultHref: '/production/batches',
        items: [
          { label: 'Production Batches', href: '/production/batches', badge: activeBatchesCount > 0 ? activeBatchesCount : undefined },
          { label: 'Kitchen Shift Tasks', href: '/production/tasks', badge: pendingTasksCount > 0 ? pendingTasksCount : undefined },
        ],
      },
      {
        id: 'packaging',
        title: 'PACKAGING',
        icon: Package,
        defaultHref: '/production/packaging',
        items: [
          { label: 'Packaging Execution', href: '/production/packaging', badge: pendingPackagingCount > 0 ? pendingPackagingCount : undefined },
          { label: 'Packaging Materials', href: '/inventory/packaging', badge: packagingProducts.length },
        ],
      },
      {
        id: 'logistic',
        title: 'LOGISTIC',
        icon: Truck,
        defaultHref: '/logistics/board',
        items: [
          { label: 'Dispatch Board', href: '/logistics/board', badge: activeDispatchesCount > 0 ? activeDispatchesCount : undefined },
          { label: 'Delivery Schedule', href: '/logistics/schedule', badge: scheduledOrdersCount > 0 ? scheduledOrdersCount : undefined },
          { label: 'In-House Riders', href: '/logistics/riders', badge: riders.length },
          { label: 'Store Pickup Counter', href: '/logistics/pickup', badge: pendingPickupsCount > 0 ? pendingPickupsCount : undefined },
          { label: 'Third Party Delivery', href: '/logistics/third-party', badge: thirdPartySummaries.length > 0 ? thirdPartySummaries.length : undefined },
        ],
      },
    ]
  }, [
    currentAccount.role,
    activeOrdersCount,
    salesProducts.length,
    rawProducts.length,
    rawMovements.length,
    suppliers.length,
    facilities.length,
    productionBatches,
    kitchenTasks,
    packagingQueue,
    packagingProducts.length,
    logisticsDeliveries,
    scheduledOrders,
    riders.length,
    storePickups,
    thirdPartySummaries.length
  ])

  // Track expanded collapsible sections with persistence
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('ops_sidebar_open_sections')
    const defaults = {
      sales: true,
      inventory: true,
      production: true,
      packaging: true,
      logistic: true,
    }
    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) }
      } catch {
        return defaults
      }
    }
    return defaults
  })

  const toggleSection = (id: string) => {
    if (isCollapsed) {
      setIsCollapsed(false)
      localStorage.setItem('ops_sidebar_collapsed', 'false')
    }
    setOpenSections(prev => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem('ops_sidebar_open_sections', JSON.stringify(next))
      return next
    })
  }

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev
      localStorage.setItem('ops_sidebar_collapsed', String(next))
      return next
    })
  }

  // Automatically ensure the section containing the active route is expanded
  useEffect(() => {
    const activeSection = navSections.find(sec =>
      sec.items.some(item => location.pathname === item.href || location.pathname.startsWith(`${item.href}/`))
    )
    if (activeSection && !openSections[activeSection.id]) {
      setOpenSections(prev => {
        const next = { ...prev, [activeSection.id]: true }
        localStorage.setItem('ops_sidebar_open_sections', JSON.stringify(next))
        return next
      })
    }
  }, [location.pathname, navSections, openSections])

  // Reference to the scrollable navigation container and active item for scroll retention & visibility
  const navScrollRef = useRef<HTMLDivElement>(null)
  const activeItemRef = useRef<HTMLAnchorElement>(null)

  // Determine active item href (exact match first, then longest matching prefix)
  const activeHref = useMemo(() => {
    for (const sec of navSections) {
      for (const item of sec.items) {
        if (location.pathname === item.href) return item.href
      }
    }
    for (const sec of navSections) {
      for (const item of sec.items) {
        if (location.pathname.startsWith(`${item.href}/`)) return item.href
      }
    }
    return null
  }, [location.pathname, navSections])

  // Handle manual scrolling to persist position across refreshes
  const handleNavScroll = (e: React.UIEvent<HTMLDivElement>) => {
    sessionStorage.setItem('smokey_sidebar_nav_scroll', String(e.currentTarget.scrollTop))
  }

  // Preserve scroll on beforeunload as safety
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (navScrollRef.current) {
        sessionStorage.setItem('smokey_sidebar_nav_scroll', String(navScrollRef.current.scrollTop))
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Restore scroll position on refresh and guarantee selected side menu is in-view without manual scrolling
  useLayoutEffect(() => {
    const navEl = navScrollRef.current
    if (!navEl) return

    // 1. Restore saved scroll position if available
    const savedScroll = sessionStorage.getItem('smokey_sidebar_nav_scroll')
    if (savedScroll !== null) {
      const parsed = parseFloat(savedScroll)
      if (!isNaN(parsed)) {
        navEl.scrollTop = parsed
      }
    }

    // 2. Ensure selected active side menu is comfortably in view
    const ensureInView = () => {
      const container = navScrollRef.current
      const activeEl = activeItemRef.current
      if (!container || !activeEl) return

      const containerRect = container.getBoundingClientRect()
      const activeRect = activeEl.getBoundingClientRect()

      if (activeRect.top < containerRect.top) {
        container.scrollTop -= (containerRect.top - activeRect.top) + 12
        sessionStorage.setItem('smokey_sidebar_nav_scroll', String(container.scrollTop))
      } else if (activeRect.bottom > containerRect.bottom) {
        container.scrollTop += (activeRect.bottom - containerRect.bottom) + 12
        sessionStorage.setItem('smokey_sidebar_nav_scroll', String(container.scrollTop))
      }
    }

    ensureInView()
    const timer = requestAnimationFrame(ensureInView)
    return () => cancelAnimationFrame(timer)
  }, [location.pathname, openSections, isMobileOpen])

  const sidebarContent = (
    <div
      data-kumo-component="Sidebar"
      className={cn(
        'flex h-full flex-col min-w-0 whitespace-nowrap bg-kumo-canvas text-kumo-default border-r border-kumo-line select-none transition-[width] duration-250 ease-[cubic-bezier(0.77,0,0.175,1)] font-sans',
        isCollapsed ? 'w-[57px] overflow-hidden' : 'w-[16.25rem] overflow-visible'
      )}
    >
      {/* 1. Account Dropdown Header with 58px border line matching TopNav */}
      <div className="relative border-b border-kumo-line z-30 overflow-visible">
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
              aria-label="Switch account profile"
              onClick={() => {
                setIsAccountMenuOpen(prev => !prev)
                setAccountSearchQuery('')
              }}
              className="flex items-center justify-between gap-1.5 min-w-0 flex-1 max-w-[200px] text-left bg-zinc-100 hover:bg-zinc-200/70 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 py-1.5 px-3 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 cursor-pointer transition-colors shadow-2xs"
            >
              <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {currentAccount.email.length > 18 ? `${currentAccount.email.slice(0, 16)}...` : currentAccount.email}
              </span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
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
            <div className="absolute left-2.5 top-[52px] w-[320px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.14)] z-50 animate-in fade-in zoom-in-95 font-sans overflow-visible text-[13px]">
              {/* Pointer Arrow Notch */}
              <div className="absolute -top-[6px] left-[88px] w-3 h-3 bg-white dark:bg-zinc-900 border-t border-l border-zinc-200/90 dark:border-zinc-800 rotate-45 z-30" />

              {/* Search accounts... */}
              <div className="relative z-20 flex items-center gap-3 px-4 py-3 border-b border-zinc-200/80 dark:border-zinc-800 rounded-t-2xl bg-white dark:bg-zinc-900">
                <Search className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 stroke-[1.75]" />
                <input
                  type="text"
                  value={accountSearchQuery}
                  onChange={(e) => setAccountSearchQuery(e.target.value)}
                  placeholder="Search accounts..."
                  autoFocus
                  className="w-full bg-transparent text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none font-normal"
                />
              </div>

              {/* Accounts list */}
              <div className="relative z-20 p-2 space-y-1 max-h-64 overflow-y-auto bg-white dark:bg-zinc-900">
                {filteredAccounts.map(acc => {
                  const isSelected = activeAccountEmail.toLowerCase() === acc.email.toLowerCase()
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => {
                        switchAccount(acc.email)
                        setIsAccountMenuOpen(false)
                        if (acc.role === 'rider') {
                          navigate('/logistics/rider-portal')
                        } else if (location.pathname.startsWith('/logistics/rider-portal')) {
                          navigate('/overview')
                        }
                      }}
                      className={cn(
                        "w-full px-3.5 py-2.5 rounded-xl text-left text-[13px] transition-colors cursor-pointer flex items-center justify-between",
                        isSelected
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 font-normal"
                      )}
                    >
                      <span className="truncate pr-2 font-sans">
                        {acc.email}'s Account
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-zinc-900 dark:text-zinc-100 stroke-[2] shrink-0" />
                      )}
                    </button>
                  )
                })}
                {filteredAccounts.length === 0 && (
                  <div className="px-3 py-4 text-center text-[13px] text-zinc-400 dark:text-zinc-500">
                    No accounts found
                  </div>
                )}
              </div>

              {/* Action Footer: + Create Account (Super Admin only) & Manage Account */}
              <div className="relative z-20 border-t border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-b-2xl">
                {currentAccount.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountMenuOpen(false)
                      navigate('/accounts/create')
                      onCloseMobile()
                    }}
                    className="w-full px-4 py-3 text-left text-[13px] font-normal text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 flex items-center gap-3 cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4 text-zinc-800 dark:text-zinc-200 stroke-[1.75] shrink-0" />
                    <span>Create Account</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false)
                    navigate('/accounts')
                    onCloseMobile()
                  }}
                  className={cn(
                    "w-full px-4 py-3 text-left text-[13px] font-normal text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 flex items-center gap-3 cursor-pointer transition-colors",
                    currentAccount.role === 'admin' && "border-t border-zinc-100 dark:border-zinc-800/80"
                  )}
                >
                  <Settings className="w-4 h-4 text-zinc-800 dark:text-zinc-200 stroke-[1.75] shrink-0" />
                  <span>Manage Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false)
                    navigate('/offices')
                    onCloseMobile()
                  }}
                  className="w-full px-4 py-3 text-left text-[13px] font-normal text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 flex items-center gap-3 cursor-pointer transition-colors border-t border-zinc-100 dark:border-zinc-800/80 rounded-b-2xl"
                >
                  <Building2 className="w-4 h-4 text-zinc-800 dark:text-zinc-200 stroke-[1.75] shrink-0" />
                  <span>Manage Offices</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 2. Quick Search & Navigation (Recents removed per design update) */}
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

          {/* Home Overview Link (Hidden for Rider Profile) */}
          {currentAccount.role !== 'rider' && (
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
              <span className="truncate">Home overview</span>
            </Link>
          )}
        </div>
      )}

      {/* 3. Main Navigation Sections */}
      <div 
        ref={navScrollRef}
        onScroll={handleNavScroll}
        className="flex-1 overflow-y-auto px-2 py-3 space-y-4"
      >
        {navSections.map(section => {
          const SectionIcon = section.icon
          const isOpen = openSections[section.id]
          const isSectionActive = section.items.some(item => location.pathname === item.href || location.pathname.startsWith(`${item.href}/`))

          return (
            <div key={section.id} className="space-y-1">
              {/* Section Header Button */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer transition-colors text-left',
                  isSectionActive
                    ? 'text-primary bg-primary/5'
                    : 'text-kumo-strong hover:bg-kumo-tint'
                )}
                title={isCollapsed ? section.title : undefined}
              >
                <SectionIcon className={cn('w-4 h-4 shrink-0', isSectionActive ? 'text-primary' : 'text-kumo-subtle')} />
                
                {!isCollapsed && (
                  <>
                    <span
                      className="truncate flex-1 tracking-wider uppercase text-[13px] font-[550]"
                      style={{ fontSize: '13px', fontWeight: 550 }}
                    >
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
                      const isSubActive = subItem.href === activeHref

                      return (
                        <li key={subItem.href} className="relative">
                          <Link
                            ref={isSubActive ? activeItemRef : undefined}
                            data-active={isSubActive ? 'true' : undefined}
                            to={subItem.href}
                            onClick={onCloseMobile}
                            className={cn(
                              'group/menu-button relative flex min-h-[32px] w-full min-w-0 cursor-pointer items-center justify-between rounded-md px-2.5 py-1 text-[13px] font-normal outline-none transition-colors',
                              isSubActive
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-kumo-default font-normal hover:bg-kumo-tint hover:text-kumo-strong'
                            )}
                          >
                            <span
                              className="truncate flex-1 text-[13px] font-normal"
                              style={{ fontSize: '13px', fontWeight: 400 }}
                            >
                              {subItem.label}
                            </span>
                            {subItem.badge !== undefined && subItem.badge !== null && subItem.badge !== '' && (
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

      {/* 4. Footer: Sign-in Activity & Sign Out */}
      <div className="border-t border-kumo-line p-2 shrink-0 bg-kumo-canvas">
        {!isCollapsed ? (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setIsActivityModalOpen(true)}
              className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs font-medium text-kumo-default hover:bg-kumo-tint hover:text-kumo-strong transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-4 h-4 text-black dark:text-white shrink-0" />
                <span className="truncate">Sign-in activity</span>
              </div>
              <span className="text-[9px] uppercase tracking-wider font-bold bg-kumo-tint text-kumo-strong px-1.5 py-0.2 rounded shrink-0">
                Admin
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onCloseMobile()
                logout()
                navigate('/login', { replace: true })
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-xs font-medium text-kumo-default hover:bg-kumo-tint hover:text-kumo-strong transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4 text-black dark:text-white shrink-0" />
              <span className="truncate">Sign out</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-1">
            <button
              type="button"
              onClick={() => setIsActivityModalOpen(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-black dark:text-white hover:bg-kumo-tint transition-colors cursor-pointer"
              title="Sign-in Activity (Admin)"
            >
              <ShieldCheck className="w-4 h-4 text-black dark:text-white" />
            </button>
            <button
              type="button"
              onClick={() => {
                onCloseMobile()
                logout()
                navigate('/login', { replace: true })
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-black dark:text-white hover:bg-kumo-tint transition-colors cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-black dark:text-white" />
            </button>
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
          isCollapsed ? 'w-[57px] overflow-hidden' : 'w-[16.25rem] overflow-visible'
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
          <div className="relative w-[16.25rem] max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200 z-10 overflow-visible">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Sign-in Activity Modal */}
      <SignInActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
      />
    </>
  )
}
export default Sidebar
