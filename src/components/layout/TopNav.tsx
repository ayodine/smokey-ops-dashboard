import React, { useState } from 'react'
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
import { Button } from '@/components/ui/Button'

interface TopNavProps {
  onOpenMobileSidebar: () => void
  onOpenCommandMenu?: () => void
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenMobileSidebar, onOpenCommandMenu }) => {
  const { selectedWarehouse, setSelectedWarehouse, facilities, addFacility } = useWarehouse()
  const { theme, toggleTheme } = useTheme()
  const [isWarehouseDropdownOpen, setIsWarehouseDropdownOpen] = useState(false)
  const [isAlertsOpen, setIsAlertsOpen] = useState(false)
  const [isAddFacilityModalOpen, setIsAddFacilityModalOpen] = useState(false)
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
          className="group flex items-center justify-between w-full h-8 px-3 rounded-lg bg-kumo-base ring ring-kumo-line hover:bg-kumo-tint text-xs font-normal text-kumo-subtle transition-colors cursor-pointer shadow-xs font-sans"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 shrink-0 opacity-60" />
            <span className="truncate">Search SKUs, batches, POs, waybills...</span>
          </div>
          <kbd className="font-sans text-[11px] px-1.5 py-0.5 rounded-md border border-kumo-line bg-kumo-tint text-kumo-subtle shrink-0">
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
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#f6821f] ring-2 ring-kumo-canvas" />
          </button>

          {isAlertsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsAlertsOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-80 rounded-lg border border-kumo-line bg-kumo-base shadow-xl z-50 animate-in fade-in zoom-in-95 font-sans">
                <div className="px-3.5 py-2.5 border-b border-kumo-line flex items-center justify-between">
                  <span className="text-xs font-semibold text-kumo-strong">
                    Operational Alerts
                  </span>
                  <span className="text-[10px] bg-[#f6821f]/15 text-[#f6821f] px-1.5 py-0.5 rounded-full font-bold">
                    3 Active
                  </span>
                </div>
                <div className="divide-y divide-kumo-line text-xs">
                  <div className="p-3 hover:bg-kumo-tint transition-colors flex gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-kumo-strong">
                        Low Stock Alert: Hardwood Charcoal
                      </p>
                      <p className="text-kumo-subtle text-[11px] mt-0.5">
                        Current: 14 kg. Below safety threshold of 50 kg.
                      </p>
                      <span className="text-[10px] text-kumo-subtle">12 mins ago</span>
                    </div>
                  </div>
                  <div className="p-3 hover:bg-kumo-tint transition-colors flex gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-kumo-strong">
                        QC Inspection Passed: Batch PRD-2026-081
                      </p>
                      <p className="text-kumo-subtle text-[11px] mt-0.5">
                        120 units Whole Smoked Chicken credited to stock.
                      </p>
                      <span className="text-[10px] text-kumo-subtle">45 mins ago</span>
                    </div>
                  </div>
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

        {/* Office / Facility Selector Moved to Far Right (Replaces Profile, No Office Icon, No Mono Font) */}
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
              <span className="block text-xs font-semibold truncate text-kumo-strong max-w-[140px] sm:max-w-[200px]">
                {selectedWarehouse.name}
              </span>
              <span className="text-[10px] text-kumo-subtle font-sans truncate">
                {selectedWarehouse.code} • {selectedWarehouse.city}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-kumo-subtle ml-0.5" />
          </button>

          {/* Switcher Dropdown Popover (Right Aligned) */}
          {isWarehouseDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsWarehouseDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-1.5 w-80 rounded-lg border border-kumo-line bg-kumo-base shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 font-sans">
                <div className="px-3.5 py-2 text-[11px] font-semibold tracking-wider uppercase text-kumo-subtle font-sans border-b border-kumo-line flex items-center justify-between">
                  <span>Operational Facilities</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-kumo-tint rounded text-kumo-default font-medium">
                    {facilities.length} Active
                  </span>
                </div>
                <div className="py-1 max-h-60 overflow-y-auto">
                  {facilities.map(fac => {
                    const isSelected = fac.id === selectedWarehouse.id
                    return (
                      <button
                        key={fac.id}
                        type="button"
                        onClick={() => {
                          setSelectedWarehouse(fac)
                          setIsWarehouseDropdownOpen(false)
                        }}
                        className="w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-kumo-tint text-xs transition-colors cursor-pointer font-sans"
                      >
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={
                                isSelected
                                  ? 'font-bold text-kumo-link text-[13px]'
                                  : 'font-medium text-kumo-strong text-[13px]'
                              }
                            >
                              {fac.name}
                            </span>
                            {fac.isPrimary && (
                              <span className="text-[9px] px-1.5 py-0.2 font-sans font-semibold uppercase bg-emerald-500/10 text-emerald-600 rounded">
                                Main HQ
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-kumo-subtle font-sans mt-0.5">
                            {fac.code} • {fac.city}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-kumo-link shrink-0 ml-2" />}
                      </button>
                    )
                  })}
                </div>

                {/* Option to Add New Facility */}
                <div className="p-1.5 border-t border-kumo-line bg-kumo-canvas/50">
                  <button
                    type="button"
                    onClick={handleOpenAddFacility}
                    className="w-full px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Operational Facility</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL: Register New Operational Facility */}
      <Dialog
        isOpen={isAddFacilityModalOpen}
        onClose={() => setIsAddFacilityModalOpen(false)}
        title="Register New Operational Facility"
        description="Add a regional fulfillment depot, dark kitchen, or retail collection center."
      >
        <form onSubmit={handleAddFacilitySubmit} className="space-y-4">
          <Input
            label="Facility Name"
            placeholder="e.g. Lekki Distribution Depot"
            value={facilityForm.name}
            onChange={(e) => setFacilityForm(prev => ({ ...prev, name: e.target.value }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Facility Code"
              placeholder="e.g. DEPOT-LEKKI"
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

          <div className="flex justify-end gap-2 pt-2 border-t border-kumo-line">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsAddFacilityModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save & Switch Facility
            </Button>
          </div>
        </form>
      </Dialog>
    </header>
  )
}
