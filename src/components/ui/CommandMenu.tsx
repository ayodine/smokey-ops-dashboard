import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  ArrowRight,
  Boxes,
  ShoppingBag,
  Flame,
  Truck,
  Users,
  Building2,
  Calendar,
  ClipboardList,
  Layers,
  Sparkles,
  Command,
  X,
  FileText,
  Package,
} from 'lucide-react'

export interface CommandItem {
  id: string
  title: string
  subtitle?: string
  category: 'Pages' | 'Inventory & SKUs' | 'Deliveries & Orders' | 'Quick Actions'
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const COMMAND_INDEX: CommandItem[] = [
  // Pages
  {
    id: 'page-raw',
    title: 'Raw Ingredients',
    subtitle: 'Meats, spices, charcoal, stock levels and expiry tracking',
    category: 'Pages',
    href: '/inventory/raw',
    icon: Boxes,
    badge: '18 SKUs',
  },
  {
    id: 'page-packaging',
    title: 'Packaging Materials',
    subtitle: 'Food bowls, branded polybags, aluminum foil, thermal labels',
    category: 'Pages',
    href: '/inventory/packaging',
    icon: ShoppingBag,
    badge: '7 Items',
  },
  {
    id: 'page-sales',
    title: 'Sales Inventory',
    subtitle: 'Smoked catfish, guinea fowl, turkey ready for delivery',
    category: 'Pages',
    href: '/inventory/sales',
    icon: Layers,
    badge: 'Ready to Dispatch',
  },
  {
    id: 'page-movements',
    title: 'Stock Movements',
    subtitle: 'Audit log of all stock consumed, received, or adjusted',
    category: 'Pages',
    href: '/inventory/movements',
    icon: FileText,
  },
  {
    id: 'page-suppliers',
    title: 'Suppliers & Vendors',
    subtitle: 'Verified poultry farms, packaging suppliers, spice distributors',
    category: 'Pages',
    href: '/inventory/suppliers',
    icon: Building2,
    badge: '4 Vendors',
  },
  {
    id: 'page-batches',
    title: 'Production Batches',
    subtitle: 'Live smoker pit runs, cooking logs, yields, and QC logs',
    category: 'Pages',
    href: '/production/batches',
    icon: Flame,
    badge: '3 Active',
  },
  {
    id: 'page-packaging-exec',
    title: 'Packaging Execution',
    subtitle: 'Order packing queue, bowl allocation, and sealing station',
    category: 'Pages',
    href: '/production/packaging',
    icon: Package,
    badge: '3 Due',
  },
  {
    id: 'page-tasks',
    title: 'Kitchen Tasks',
    subtitle: 'Hygiene checks, temperature logs, pit seasoning and safety',
    category: 'Pages',
    href: '/production/tasks',
    icon: ClipboardList,
    badge: '4 Tasks',
  },
  {
    id: 'page-board',
    title: 'Dispatch Board',
    subtitle: 'Real-time order dispatch, driver assignment, waybill tracking',
    category: 'Pages',
    href: '/logistics/board',
    icon: Truck,
    badge: '5 Active',
  },
  {
    id: 'page-schedule',
    title: 'Delivery Schedule',
    subtitle: 'Advance pre-orders, corporate event catering slots, time windows',
    category: 'Pages',
    href: '/logistics/schedule',
    icon: Calendar,
    badge: '3 Scheduled',
  },
  {
    id: 'page-riders',
    title: 'Delivery Fleet & Drivers',
    subtitle: 'Dispatch riders, cash on delivery reconciliation, anti-drift audit',
    category: 'Pages',
    href: '/logistics/riders',
    icon: Users,
    badge: '4 Drivers',
  },
  {
    id: 'page-pickup',
    title: 'Store Pickup Counter',
    subtitle: 'Customer storefront order collections at Yaba kitchen hub',
    category: 'Pages',
    href: '/logistics/pickup',
    icon: Building2,
    badge: '2 Ready',
  },
  {
    id: 'page-3pl',
    title: 'Courier Fees & Delivery',
    subtitle: 'Third-party dispatch logistics, customer fees vs courier costs',
    category: 'Pages',
    href: '/logistics/third-party',
    icon: Truck,
  },
  {
    id: 'page-exec',
    title: 'Executive Overview',
    subtitle: 'High-level operational metrics, daily revenue, and kitchen health',
    category: 'Pages',
    href: '/dashboard/executive',
    icon: Sparkles,
  },

  // Inventory & SKUs
  {
    id: 'sku-catfish',
    title: 'Fresh Catfish (Large)',
    subtitle: 'SKU-00001 • Raw Protein • 240 kg on hand',
    category: 'Inventory & SKUs',
    href: '/inventory/raw',
    icon: Boxes,
    badge: '₦3,800/kg',
  },
  {
    id: 'sku-charcoal',
    title: 'Hardwood Charcoal Sacks',
    subtitle: 'SKU-00002 • Kitchen Fuel • 14 Sacks remaining',
    category: 'Inventory & SKUs',
    href: '/inventory/raw',
    icon: Flame,
    badge: 'Low Stock',
  },
  {
    id: 'sku-guineafowl',
    title: 'Guineafowl (Dressed)',
    subtitle: 'SKU-00003 • Raw Poultry • 85 birds on hand',
    category: 'Inventory & SKUs',
    href: '/inventory/raw',
    icon: Boxes,
    badge: '₦6,500/bird',
  },
  {
    id: 'sku-turkey',
    title: 'Smoked Turkey Wings',
    subtitle: 'SKU-00004 • Frozen Protein • 120 kg on hand',
    category: 'Inventory & SKUs',
    href: '/inventory/raw',
    icon: Boxes,
  },
  {
    id: 'sku-bowl-750',
    title: '750ml Heavy-duty Food Bowl',
    subtitle: 'PKG-001 • Packaging • 850 pcs on hand',
    category: 'Inventory & SKUs',
    href: '/inventory/packaging',
    icon: ShoppingBag,
    badge: 'Safe Grade',
  },
  {
    id: 'sku-polybag',
    title: 'Smokey Hut Branded Kraft Polybags',
    subtitle: 'PKG-002 • Packaging • 1,200 pcs on hand',
    category: 'Inventory & SKUs',
    href: '/inventory/packaging',
    icon: ShoppingBag,
  },

  // Deliveries & Orders
  {
    id: 'order-7621',
    title: 'Order SHD-07621: Folake Adeleke',
    subtitle: '₦48,500 • Victoria Island, Lagos • Dispatched via Ibrahim S.',
    category: 'Deliveries & Orders',
    href: '/logistics/board',
    icon: Truck,
    badge: 'In Transit',
  },
  {
    id: 'order-7619',
    title: 'Order SHD-07619: Olubunmi Cole',
    subtitle: '₦75,200 • Yaba Counter Pickup • 6x Whole Catfish',
    category: 'Deliveries & Orders',
    href: '/logistics/pickup',
    icon: Building2,
    badge: 'Ready for Pickup',
  },
  {
    id: 'order-7614',
    title: 'Order SHD-07614: Tunde Balogun',
    subtitle: '₦125,000 • Lekki Phase 1 • Bulk Weekend Pre-Order',
    category: 'Deliveries & Orders',
    href: '/logistics/schedule',
    icon: Calendar,
    badge: 'Scheduled',
  },

  // Quick Actions
  {
    id: 'action-receive',
    title: 'Add Received Stock',
    subtitle: 'Log a new supplier delivery of meats, charcoal, or packaging',
    category: 'Quick Actions',
    href: '/inventory/raw',
    icon: Boxes,
  },
  {
    id: 'action-stocktake',
    title: 'Daily Stock Check',
    subtitle: 'Perform physical count check and log discrepancy variances',
    category: 'Quick Actions',
    href: '/inventory/raw',
    icon: ClipboardList,
  },
  {
    id: 'action-batch',
    title: 'Start Cooking Batch',
    subtitle: 'Launch a new smoker pit run with recipe ingredient deductions',
    category: 'Quick Actions',
    href: '/production/batches',
    icon: Flame,
  },
]

interface CommandMenuProps {
  isOpen: boolean
  onClose: () => void
}

export const CommandMenu: React.FC<CommandMenuProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Filter items matching query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return COMMAND_INDEX
    const q = query.toLowerCase().trim()
    return COMMAND_INDEX.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    )
  }, [query])

  // Reset selectedIndex when filter changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1 < filteredItems.length ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 >= 0 ? prev - 1 : Math.max(0, filteredItems.length - 1)))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredItems[selectedIndex]) {
        handleSelectItem(filteredItems[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  // Handle item selection
  const handleSelectItem = (item: CommandItem) => {
    onClose()
    navigate(item.href)
  }

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector<HTMLElement>('[data-active="true"]')
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  if (!isOpen) return null

  // Group filtered items by category
  const categories: Array<CommandItem['category']> = [
    'Quick Actions',
    'Pages',
    'Inventory & SKUs',
    'Deliveries & Orders',
  ]

  let runningIndex = 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-4 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-kumo-contrast/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command Menu"
        className="relative w-full max-w-2xl bg-kumo-base ring ring-kumo-line rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150 font-sans z-10"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-kumo-line bg-kumo-base">
          <Search className="w-4 h-4 text-kumo-subtle shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, items, SKUs, batches, orders..."
            className="flex-1 bg-transparent text-sm text-kumo-strong placeholder:text-kumo-subtle/70 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-kumo-subtle hover:text-kumo-strong hover:bg-kumo-tint cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-1 text-[11px] font-mono text-kumo-subtle bg-kumo-tint px-2 py-0.5 rounded border border-kumo-line">
              <span>ESC</span>
            </div>
          )}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 divide-y divide-kumo-line/40 text-xs text-kumo-default"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-kumo-subtle">
              <p className="font-medium text-sm">No results found for "{query}"</p>
              <p className="text-xs mt-1">Try searching for an ingredient, page name, or SKU.</p>
            </div>
          ) : (
            categories.map(cat => {
              const itemsInCat = filteredItems.filter(item => item.category === cat)
              if (itemsInCat.length === 0) return null

              return (
                <div key={cat} className="py-1.5 first:pt-0 last:pb-0">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-kumo-subtle">
                    {cat}
                  </div>
                  <div className="space-y-0.5 mt-0.5">
                    {itemsInCat.map(item => {
                      const itemIdx = runningIndex++
                      const isSelected = itemIdx === selectedIndex
                      const Icon = item.icon

                      return (
                        <div
                          key={item.id}
                          role="option"
                          aria-selected={isSelected}
                          data-active={isSelected}
                          onClick={() => handleSelectItem(item)}
                          onMouseEnter={() => setSelectedIndex(itemIdx)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-kumo-tint text-kumo-strong'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-primary text-white shadow-xs'
                                  : 'bg-kumo-tint text-kumo-default border border-kumo-line/60'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-xs truncate leading-snug">
                                {item.title}
                              </p>
                              {item.subtitle && (
                                <p className="text-[11px] text-kumo-subtle truncate mt-0.5">
                                  {item.subtitle}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            {item.badge && (
                              <span
                                className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                                  isSelected
                                    ? 'bg-primary/20 text-primary border-primary/30'
                                    : 'bg-kumo-tint text-kumo-subtle border-kumo-line'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                            <ArrowRight
                              className={`w-3.5 h-3.5 transition-transform ${
                                isSelected
                                  ? 'opacity-100 translate-x-0 text-primary'
                                  : 'opacity-0 -translate-x-1'
                              }`}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="px-4 py-2 border-t border-kumo-line bg-kumo-canvas/60 flex items-center justify-between text-[11px] text-kumo-subtle shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-kumo-line bg-kumo-base font-mono text-[10px]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded border border-kumo-line bg-kumo-base font-mono text-[10px]">
                ↓
              </kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-kumo-line bg-kumo-base font-mono text-[10px]">
                ↵
              </kbd>
              <span>to select</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="w-3 h-3 opacity-60" />
            <span>Smokey Ops Search</span>
          </div>
        </div>
      </div>
    </div>
  )
}
export default CommandMenu
