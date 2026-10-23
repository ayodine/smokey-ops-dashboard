import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWarehouse } from '@/context/WarehouseContext'
import { useTheme } from '@/context/ThemeContext'
import {
  Menu,
  ChevronDown,
  Sun,
  Moon,
  Bell,
  Search,
  Check,
  ShieldAlert,
  ArrowRight,
  Plus
} from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/button'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/reui/alert'
import { cn } from '@/lib/utils'

interface TopNavProps {
  onOpenMobileSidebar: () => void
  onOpenCommandMenu?: () => void
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenMobileSidebar, onOpenCommandMenu }) => {
  const navigate = useNavigate()
  const { selectedWarehouse, setSelectedWarehouse, facilities, addFacility } = useWarehouse()
  const { theme, toggleTheme } = useTheme()
  const [isWarehouseDropdownOpen, setIsWarehouseDropdownOpen] = useState(false)
  const [isAlertsOpen, setIsAlertsOpen] = useState(false)
  const [alerts, setAlerts] = useState([
    {
      id: 'alert-1',
      variant: 'warning' as const,
      icon: ShieldAlert,
      title: 'Low Stock Alert: Hardwood Charcoal',
      time: '12m ago',
      desc: 'Current: 14 kg. Below safety threshold of 50 kg.',
      linkText: 'View raw inventory',
      linkUrl: '/inventory/raw',
    },
    {
      id: 'alert-2',
      variant: 'success' as const,
      icon: Check,
      title: 'QC Inspection Passed: Batch PRD-2026-081',
      time: '45m ago',
      desc: '120 units Whole Smoked Chicken credited to stock.',
      linkText: 'View production batches',
      linkUrl: '/production/batches',
    },
    {
      id: 'alert-3',
      variant: 'info' as const,
      icon: ArrowRight,
      title: 'Scheduled Dispatch: Lekki Phase 1',
      time: '1h ago',
      desc: '3 scheduled delivery orders awaiting rider assignment.',
      linkText: 'Open delivery schedule',
      linkUrl: '/logistics/schedule',
    },
  ])
  const [isAddFacilityModalOpen, setIsAddFacilityModalOpen] = useState(false)
  const [facilitySearchQuery, setFacilitySearchQuery] = useState('')
  const [facilityForm, setFacilityForm] = useState({
    name: '',
    code: '',
    city: '',
    address: ''
  })

  const handleOpenAddFacility = () => {
    setIsWarehouseDropdownOpen(false)
    setFacilityForm({
      name: '',
      code: `DEPOT-${String(facilities.length + 1).padStart(2, '0')}`,
      city: 'Lagos',
      address: ''
    })
    setIsAddFacilityModalOpen(true)
  }

  const handleAddFacilitySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!facilityForm.name.trim()) return
    addFacility({
      name: facilityForm.name.trim(),
      code: facilityForm.code.trim().toUpperCase() || `FAC-${Date.now().toString().slice(-4)}`,
      city: facilityForm.city.trim() || 'Lagos',
      address: facilityForm.address.trim()
    })
    setIsAddFacilityModalOpen(false)
  }

  return (
    <header
      data-sentry-component="CollapsedHeaderInner"
      className="h-[58px] bg-kumo-canvas shrink-0 border-b border-kumo-line flex items-center px-4 z-20 sticky top-0 gap-2 select-none"
    >
      {/* Left: Mobile Toggle */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          data-kumo-component="Button"
          aria-label="Open mobile navigation"
          className="md:hidden size-8 flex items-center justify-center rounded-lg text-kumo-default hover:bg-kumo-tint transition-colors cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Center Search Pill (Desktop) */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-auto">
        <button
          type="button"
          onClick={onOpenCommandMenu}
          data-kumo-component="Button"
          className="group flex items-center justify-between w-full h-10 px-3.5 rounded-lg bg-kumo-base border border-kumo-line hover:bg-kumo-tint text-xs font-normal text-kumo-subtle transition-colors cursor-pointer shadow-2xs font-sans"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-4 h-4 shrink-0 opacity-60 text-kumo-subtle" />
            <span className="truncate text-[13px]">Search SKUs, batches, POs, waybills...</span>
          </div>
          <kbd className="font-sans text-[10px] font-semibold leading-none tracking-normal px-1.5 py-0.5 min-w-[22px] h-[18px] rounded-[4px] border border-kumo-line bg-kumo-canvas/90 text-kumo-subtle shrink-0 inline-flex items-center justify-center select-none">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Header Utilities (Cloudflare Kumo Toolbar) */}
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {/* System Notifications Bell */}
        <div className="relative">
          <button
            type="button"
            data-kumo-component="Button"
            onClick={() => setIsAlertsOpen(prev => !prev)}
            aria-label="View system alerts"
            className="size-8 flex items-center justify-center rounded-lg text-kumo-default hover:bg-kumo-tint transition-colors relative cursor-pointer"
          >
            <Bell className="w-4 h-4 text-kumo-subtle" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#f6821f] ring-2 ring-kumo-canvas" />
            )}
          </button>

          {isAlertsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsAlertsOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-96 rounded-xl border border-kumo-line bg-kumo-base shadow-xl z-50 animate-in fade-in zoom-in-95 font-sans overflow-hidden">
                <div className="px-3.5 py-2.5 border-b border-kumo-line flex items-center justify-between">
                  <span className="text-xs font-semibold text-kumo-strong">
                    Alerts
                  </span>
                  <span className="text-[10px] bg-[#f6821f]/15 text-[#f6821f] px-1.5 py-0.5 rounded-full font-bold">
                    {alerts.length} Active
                  </span>
                </div>
                <div className="text-xs max-h-[380px] overflow-y-auto p-2 space-y-2">
                  {alerts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-kumo-subtle">
                      No active alerts
                    </div>
                  ) : (
                    alerts.map((item) => {
                      const IconComponent = item.icon
                      return (
                        <Alert key={item.id} variant={item.variant} className="p-2.5 shadow-none border-kumo-line">
                          <IconComponent className="w-4 h-4 shrink-0" />
                          <AlertTitle
                            className="cursor-pointer hover:underline text-xs"
                            onClick={() => {
                              navigate(item.linkUrl)
                              setIsAlertsOpen(false)
                            }}
                          >
                            {item.title}
                          </AlertTitle>
                          <AlertDescription className="text-[11px] gap-1">
                            <span>{item.desc}</span>
                            <span
                              className="text-[10px] text-primary font-medium inline-flex items-center gap-1 mt-0.5 cursor-pointer hover:underline"
                              onClick={() => {
                                navigate(item.linkUrl)
                                setIsAlertsOpen(false)
                              }}
                            >
                              <span>{item.linkText}</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </span>
                          </AlertDescription>
                          <AlertAction>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                setAlerts((prev) => prev.filter((a) => a.id !== item.id))
                              }}
                            >
                              Dismiss
                            </Button>
                          </AlertAction>
                        </Alert>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Theme Mode Toggle Button */}
        <button
          type="button"
          data-kumo-component="Button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="size-8 flex items-center justify-center rounded-lg text-kumo-default hover:bg-kumo-tint transition-colors cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-kumo-subtle" />
          )}
        </button>

        {/* Office / Facility Selector Moved to Far Right (Inheriting Select Account Dropdown UI Style) */}
        <div className="relative pl-1 border-l border-kumo-line">
          <button
            type="button"
            data-kumo-component="Popover"
            data-kumo-part="trigger"
            onClick={() => setIsWarehouseDropdownOpen(prev => !prev)}
            aria-expanded={isWarehouseDropdownOpen}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-left bg-transparent border-0 font-sans hover:bg-kumo-tint transition-colors cursor-pointer"
          >
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="block text-xs font-semibold truncate text-zinc-900 dark:text-zinc-100 max-w-[140px] sm:max-w-[200px]">
                {selectedWarehouse.name}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-sans truncate">
                {selectedWarehouse.code} • {selectedWarehouse.city}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-zinc-500 dark:text-zinc-400 ml-0.5" />
          </button>

          {/* Switcher Dropdown Popover (Right Aligned, matching Account Menu Popover) */}
          {isWarehouseDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => {
                  setIsWarehouseDropdownOpen(false)
                  setFacilitySearchQuery('')
                }}
              />
              <div className="absolute right-0 top-[52px] w-[320px] bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.14)] z-50 animate-in fade-in zoom-in-95 font-sans overflow-visible text-xs">
                {/* Pointer Arrow Notch */}
                <div className="absolute -top-[6px] right-6 w-3 h-3 bg-white dark:bg-zinc-900 border-t border-l border-zinc-200/90 dark:border-zinc-800 rotate-45 z-30" />

                {/* Search facilities... */}
                <div className="relative z-20 flex items-center gap-3 px-4 py-3 border-b border-zinc-200/80 dark:border-zinc-800 rounded-t-2xl bg-white dark:bg-zinc-900">
                  <Search className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 stroke-[1.75]" />
                  <input
                    type="text"
                    value={facilitySearchQuery}
                    onChange={(e) => setFacilitySearchQuery(e.target.value)}
                    placeholder="Search facilities..."
                    autoFocus
                    className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none font-normal"
                  />
                </div>

                {/* Facilities list */}
                <div className="relative z-20 p-2 space-y-1 max-h-64 overflow-y-auto bg-white dark:bg-zinc-900">
                  {facilities
                    .filter(fac =>
                      fac.name.toLowerCase().includes(facilitySearchQuery.toLowerCase()) ||
                      fac.code.toLowerCase().includes(facilitySearchQuery.toLowerCase()) ||
                      fac.city.toLowerCase().includes(facilitySearchQuery.toLowerCase())
                    )
                    .map(fac => {
                      const isSelected = fac.id === selectedWarehouse.id
                      return (
                        <button
                          key={fac.id}
                          type="button"
                          onClick={() => {
                            setSelectedWarehouse(fac)
                            setIsWarehouseDropdownOpen(false)
                            setFacilitySearchQuery('')
                          }}
                          className={cn(
                            "w-full px-3.5 py-2.5 rounded-xl text-left text-sm transition-colors cursor-pointer flex items-center justify-between",
                            isSelected
                              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                              : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 font-normal"
                          )}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-sans font-medium text-sm text-zinc-900 dark:text-zinc-100">
                                {fac.name}
                              </span>
                              {fac.isPrimary && (
                                <span className="text-[10px] px-1.5 py-0.5 font-sans font-semibold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded shrink-0">
                                  Main HQ
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-sans mt-0.5">
                              {fac.code} • {fac.city}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-zinc-900 dark:text-zinc-100 stroke-[2] shrink-0 ml-2" />
                          )}
                        </button>
                      )
                    })}
                </div>

                {/* Action Footer: + Add New Office / Branch */}
                <div className="relative z-20 border-t border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={handleOpenAddFacility}
                    className="w-full px-4 py-3 text-left text-sm font-normal text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 flex items-center gap-3 cursor-pointer transition-colors rounded-b-2xl"
                  >
                    <Plus className="w-4 h-4 text-zinc-800 dark:text-zinc-200 stroke-[1.75] shrink-0" />
                    <span>Add New Office / Branch</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL: Register New Office / Branch */}
      <Dialog
        isOpen={isAddFacilityModalOpen}
        onClose={() => setIsAddFacilityModalOpen(false)}
        title="Register New Office / Branch"
        description="Add a regional branch office, fulfillment depot, or dark kitchen."
      >
        <form onSubmit={handleAddFacilitySubmit} className="space-y-4">
          <Input
            label="Branch / Office Name"
            placeholder="e.g. Lekki Branch Office"
            value={facilityForm.name}
            onChange={(e) => setFacilityForm(prev => ({ ...prev, name: e.target.value }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Branch / Office Code"
              placeholder="e.g. BR-LEKKI"
              value={facilityForm.code}
              onChange={(e) => setFacilityForm(prev => ({ ...prev, code: e.target.value }))}
              required
            />
            <Input
              label="City / Region"
              placeholder="e.g. Lekki Phase 1, Lagos"
              value={facilityForm.city}
              onChange={(e) => setFacilityForm(prev => ({ ...prev, city: e.target.value }))}
              required
            />
          </div>

          <Input
            label="Physical Street Address / Landmark"
            placeholder="e.g. Plot 12 Admiralty Way, Lekki, Lagos"
            value={facilityForm.address}
            onChange={(e) => setFacilityForm(prev => ({ ...prev, address: e.target.value }))}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-kumo-line">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setIsAddFacilityModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Save & Switch Branch/Office
            </Button>
          </div>
        </form>
      </Dialog>
    </header>
  )
}
