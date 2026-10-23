import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSmokeyOps, type UserRole } from '@/context/SmokeyOpsContext'
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
  Plus,
  ShieldCheck,
  LogOut,
  UserPlus,
  MapPin,
  Settings,
  Key,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  UserCheck,
  ShoppingBag,
  Building2,
} from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { useWarehouse } from '@/context/WarehouseContext'
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

const RECENT_NAV_ITEMS = [
  { label: 'Raw Inventory', href: '/inventory/raw' },
  { label: 'Packaging Materials', href: '/inventory/packaging' },
  { label: 'Stock Movements', href: '/inventory/movements' },
  { label: 'Production Batches', href: '/production/batches' },
  { label: 'Delivery Fleet & Riders', href: '/logistics/riders' },
]

const NAV_SECTIONS: NavSection[] = [
  {
    id: 'sale',
    title: 'Sale',
    icon: ShoppingBag,
    defaultHref: '/sales/orders',
    items: [
      { label: 'Website Orders', href: '/sales/orders', badge: '14' },
      { label: 'Sales Inventory', href: '/inventory/sales', badge: '15' },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory Control',
    icon: Boxes,
    defaultHref: '/inventory/raw',
    items: [
      { label: 'Raw Inventory', href: '/inventory/raw', badge: '13' },
      { label: 'Packaging Materials', href: '/inventory/packaging', badge: '14' },
      { label: 'Sales Inventory', href: '/inventory/sales', badge: '15' },
      { label: 'Stock Movements', href: '/inventory/movements', badge: '16' },
      { label: 'Suppliers & Vendors', href: '/inventory/suppliers', badge: '12' },
    ],
  },
  {
    id: 'production',
    title: 'Production Runs',
    icon: Factory,
    defaultHref: '/production/batches',
    items: [
      { label: 'Production Batches', href: '/production/batches', badge: '12' },
      { label: 'Packaging Execution', href: '/production/packaging', badge: '11' },
      { label: 'Kitchen Shift Tasks', href: '/production/tasks', badge: '12' },
    ],
  },
  {
    id: 'logistics',
    title: 'Logistics & Dispatch',
    icon: Truck,
    defaultHref: '/logistics/board',
    items: [
      { label: 'Dispatch Board', href: '/logistics/board', badge: '12' },
      { label: 'Delivery Schedule', href: '/logistics/schedule', badge: '11' },
      { label: 'Delivery Fleet & Riders', href: '/logistics/riders', badge: '11' },
      { label: 'Store Pickup Counter', href: '/logistics/pickup', badge: '11' },
      { label: 'Third Party Delivery', href: '/logistics/third-party', badge: '12' },
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
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('ops_sidebar_collapsed') === 'true'
  })

  const { activeAccountEmail, currentAccount, switchAccount, availableAccounts, createAccount } = useSmokeyOps()
  const { facilities, selectedWarehouse } = useWarehouse()

  // Sign-in activity modal state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [accountSearchQuery, setAccountSearchQuery] = useState('')
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('admin')
  const [newUsername, setNewUsername] = useState('')
  const [newTempPassword, setNewTempPassword] = useState(() => `Smk@${Math.floor(1000 + Math.random() * 9000)}!`)
  const [showPassword, setShowPassword] = useState(false)
  const [mustChangePassword, setMustChangePassword] = useState(true)
  const [copiedTempCreds, setCopiedTempCreds] = useState(false)
  const [createdAccountSummary, setCreatedAccountSummary] = useState<{
    name: string
    email: string
    username: string
    tempPass: string
    role: string
  } | null>(null)
  const [newPhone, setNewPhone] = useState('')
  const [newStaffId, setNewStaffId] = useState('')
  const [newAssignedHub, setNewAssignedHub] = useState(selectedWarehouse?.name || 'Yaba Head Office')
  const [newNationalId, setNewNationalId] = useState('')
  const [newVehicleType, setNewVehicleType] = useState('Bajaj Boxer 150 Motorcycle')
  const [newPlateNumber, setNewPlateNumber] = useState('')
  const [newLicenseNumber, setNewLicenseNumber] = useState('')
  const [newCodLimit, setNewCodLimit] = useState(50000)

  const filteredAccounts = useMemo(() => {
    if (!accountSearchQuery.trim()) return availableAccounts
    const q = accountSearchQuery.toLowerCase()
    return availableAccounts.filter(acc =>
      acc.email.toLowerCase().includes(q) ||
      acc.name.toLowerCase().includes(q)
    )
  }, [availableAccounts, accountSearchQuery])

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim()) return
    const roleLabels: Record<UserRole, string> = {
      admin: 'Administrator',
      manager: 'Operations Manager',
      kitchen: 'Kitchen Chef / Lead',
      inventory: 'Inventory & Stock Officer',
      dispatcher: 'Logistics Dispatcher',
      rider: 'Delivery Fleet Rider',
    }
    const derivedUsername = newUsername.trim() || newEmail.split('@')[0].toLowerCase()
    const finalPassword = newTempPassword.trim() || `Smk@${Math.floor(1000 + Math.random() * 9000)}!`
    const accName = newName.trim() || newEmail.split('@')[0]

    createAccount({
      email: newEmail.trim(),
      name: accName,
      role: newRole,
      roleLabel: roleLabels[newRole],
      phone: newPhone.trim() || '080' + Math.floor(10000000 + Math.random() * 90000000),
      staff_id: newStaffId.trim() || `SHD-${newRole.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      assigned_hub: newAssignedHub,
      national_id_nin: newNationalId.trim() || '7829-4821-9921',
      vehicle_type: newRole === 'rider' ? newVehicleType : undefined,
      plate_number: newRole === 'rider' ? (newPlateNumber.trim() || 'LND-482-XA') : undefined,
      license_number: newRole === 'rider' ? (newLicenseNumber.trim() || 'DL-98234-LAG') : undefined,
      cod_limit: newRole === 'rider' ? Number(newCodLimit) : undefined,
    })

    setCreatedAccountSummary({
      name: accName,
      email: newEmail.trim(),
      username: derivedUsername,
      tempPass: finalPassword,
      role: roleLabels[newRole],
    })

    setNewEmail('')
    setNewName('')
    setNewUsername('')
    setNewTempPassword(`Smk@${Math.floor(1000 + Math.random() * 9000)}!`)
    setNewPhone('')
    setNewStaffId('')
    setNewNationalId('')
    setNewPlateNumber('')
    setNewLicenseNumber('')
    setIsCreateAccountOpen(false)
  }

  // Recents collapsible state with persistence
  const [isRecentsOpen, setIsRecentsOpen] = useState(() => {
    return localStorage.getItem('ops_sidebar_recents_open') !== 'false'
  })

  const toggleRecents = () => {
    setIsRecentsOpen(prev => {
      const next = !prev
      localStorage.setItem('ops_sidebar_recents_open', String(next))
      return next
    })
  }

  // Filter sections based on account role (RBAC)
  const navSections = useMemo(() => {
    if (currentAccount.role === 'rider') {
      return [
        {
          id: 'logistics',
          title: 'Logistics & Dispatch',
          icon: Truck,
          defaultHref: '/logistics/rider-portal',
          items: [
            { label: 'Rider Portal (My Trips)', href: '/logistics/rider-portal', badge: 'Active' },
          ],
        },
      ]
    }
    return NAV_SECTIONS
  }, [currentAccount.role])

  const recentNavItems = useMemo(() => {
    if (currentAccount.role === 'rider') {
      return []
    }
    return RECENT_NAV_ITEMS
  }, [currentAccount.role])

  // Track expanded collapsible sections with persistence
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('ops_sidebar_open_sections')
    const defaults = {
      sale: true,
      inventory: true,
      production: true,
      logistics: true,
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

              {/* Action Footer: + Create Account & Manage Account */}
              <div className="relative z-20 border-t border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false)
                    setIsCreateAccountOpen(true)
                  }}
                  className="w-full px-4 py-3 text-left text-[13px] font-normal text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 flex items-center gap-3 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4 text-zinc-800 dark:text-zinc-200 stroke-[1.75] shrink-0" />
                  <span>Create Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false)
                    navigate('/accounts')
                    onCloseMobile()
                  }}
                  className="w-full px-4 py-3 text-left text-[13px] font-normal text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 flex items-center gap-3 cursor-pointer transition-colors border-t border-zinc-100 dark:border-zinc-800/80"
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

          {/* Recents Collapsible Sub-menu (Hidden on Rider Portal) */}
          {currentAccount.role !== 'rider' && location.pathname !== '/logistics/rider-portal' && (
            <div>
              <button
                type="button"
                onClick={toggleRecents}
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
                  {recentNavItems.map(rec => {
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
                    <span className="truncate flex-1 tracking-wider uppercase text-[11px] font-semibold">
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
                            <span className="truncate flex-1 text-[13px] font-normal">{subItem.label}</span>
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
              onClick={() => navigate('/login')}
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
              onClick={() => navigate('/login')}
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

      {/* Create Account Modal with Role-Based KYC */}
      <Dialog
        isOpen={isCreateAccountOpen}
        onClose={() => setIsCreateAccountOpen(false)}
        title="Create Staff / Driver Account"
        description="Configure role permissions and operational KYC details."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAccount} className="space-y-4 font-sans text-xs">
          <Select
            label="Role & Permissions"
            value={newRole}
            onValueChange={(val) => setNewRole(val as UserRole)}
            options={[
              { value: 'admin', label: 'Administrator (Full Access)' },
              { value: 'manager', label: 'Operations Manager (Kitchen & Logistics)' },
              { value: 'kitchen', label: 'Kitchen Chef / Prep Lead' },
              { value: 'inventory', label: 'Inventory & Stock Officer' },
              { value: 'dispatcher', label: 'Logistics Dispatcher' },
              { value: 'rider', label: 'Delivery Fleet Rider (Trip Portal & Wallet)' },
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Yusuf Alabi"
                className="w-full h-9 px-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Account Email</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="staff@smokeyhut.com"
                className="w-full h-9 px-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Phone Number</label>
              <input
                type="text"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="08012345678"
                className="w-full h-9 px-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Staff / Employee ID</label>
              <input
                type="text"
                value={newStaffId}
                onChange={(e) => setNewStaffId(e.target.value)}
                placeholder="e.g. SHD-FLT-18"
                className="w-full h-9 px-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Operating Hub / Office
              </label>
              <div className="flex items-center justify-between h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="font-medium truncate">
                    {selectedWarehouse?.name || facilities[0]?.name || 'Yaba Head Office'}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 shrink-0">
                  Active HQ
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">National ID / NIN</label>
              <input
                type="text"
                value={newNationalId}
                onChange={(e) => setNewNationalId(e.target.value)}
                placeholder="7829-4821-9921"
                className="w-full h-9 px-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          {/* Rider Specific KYC Details */}
          {newRole === 'rider' && (
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-3 animate-in fade-in">
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                <span>Driver Fleet KYC Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Vehicle Model</label>
                  <input
                    type="text"
                    value={newVehicleType}
                    onChange={(e) => setNewVehicleType(e.target.value)}
                    placeholder="e.g. Bajaj Boxer 150 Motorcycle"
                    className="w-full h-9 px-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Plate Number</label>
                  <input
                    type="text"
                    value={newPlateNumber}
                    onChange={(e) => setNewPlateNumber(e.target.value)}
                    placeholder="LND-482-XA"
                    className="w-full h-9 px-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Driver's License No</label>
                  <input
                    type="text"
                    value={newLicenseNumber}
                    onChange={(e) => setNewLicenseNumber(e.target.value)}
                    placeholder="DL-98234-LAG"
                    className="w-full h-9 px-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Max COD Cash Limit (₦)</label>
                  <input
                    type="number"
                    min="5000"
                    step="5000"
                    value={newCodLimit}
                    onChange={(e) => setNewCodLimit(Number(e.target.value))}
                    className="w-full h-9 px-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Temporary Sign-in Credentials Flow */}
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-500" />
                <span>Temporary Sign-in Credentials</span>
              </div>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 font-medium">
                Auto-Provisioned
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Sign-in Username / Handle
                </label>
                <input
                  type="text"
                  required
                  value={newUsername || (newEmail ? newEmail.split('@')[0].toLowerCase() : '')}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. yusuf.ops"
                  className="w-full h-9 px-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Temporary Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewTempPassword(`Smk@${Math.floor(1000 + Math.random() * 9000)}!`)}
                    className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Regenerate</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newTempPassword}
                    onChange={(e) => setNewTempPassword(e.target.value)}
                    className="w-full h-9 pl-3 pr-10 py-2 text-xs sm:text-sm font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={mustChangePassword}
                onChange={(e) => setMustChangePassword(e.target.checked)}
                className="rounded border-zinc-300 text-primary focus:ring-primary w-4 h-4"
              />
              <span>Force password change on first sign-in (Recommended)</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsCreateAccountOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-4 py-2 text-sm font-semibold text-white bg-[#c0201f] hover:bg-[#a01817] active:bg-[#8a1413] rounded-lg cursor-pointer shadow-xs transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          </div>
        </form>
      </Dialog>

      {/* Temporary Credentials Provisioned Confirmation */}
      <Dialog
        isOpen={Boolean(createdAccountSummary)}
        onClose={() => setCreatedAccountSummary(null)}
        title="Temporary Credentials Created"
        description="Provide these temporary access credentials to the newly created operator."
        maxWidth="md"
      >
        {createdAccountSummary && (
          <div className="space-y-4 font-sans text-xs">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2 text-amber-900 dark:text-amber-200">
              <div className="font-semibold text-xs flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Onboarding Credentials for {createdAccountSummary.name}</span>
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">
                A temporary password has been set. The operator will be prompted to choose a permanent password on first login.
              </p>
            </div>

            <div className="p-3.5 bg-kumo-surface border border-kumo-line rounded-xl space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-kumo-subtle">Username:</span>
                <span className="font-mono font-bold text-kumo-strong text-xs px-2.5 py-1 bg-kumo-base border border-kumo-line rounded">
                  {createdAccountSummary.username}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-kumo-subtle">Account Email:</span>
                <span className="font-mono font-medium text-kumo-strong text-xs">
                  {createdAccountSummary.email}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-kumo-subtle">Temporary Password:</span>
                <span className="font-mono font-bold text-emerald-600 text-xs px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded">
                  {createdAccountSummary.tempPass}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-kumo-subtle">Role:</span>
                <span className="font-semibold text-kumo-strong capitalize text-xs">
                  {createdAccountSummary.role}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const text = `Smokey Hut Ops Login\nUsername: ${createdAccountSummary.username}\nEmail: ${createdAccountSummary.email}\nTemp Password: ${createdAccountSummary.tempPass}\nRole: ${createdAccountSummary.role}`
                  navigator.clipboard.writeText(text)
                  setCopiedTempCreds(true)
                  setTimeout(() => setCopiedTempCreds(false), 2000)
                }}
                className="h-10 px-4 py-2 text-sm font-semibold rounded-lg bg-kumo-tint hover:bg-kumo-line border border-kumo-line text-kumo-strong transition-colors flex items-center gap-2 cursor-pointer"
              >
                {copiedTempCreds ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedTempCreds ? 'Copied to Clipboard' : 'Copy Credentials'}</span>
              </button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setCreatedAccountSummary(null)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  )
}
export default Sidebar
