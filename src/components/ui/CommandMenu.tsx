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
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  LifeBuoy,
} from 'lucide-react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { formatNaira } from '@/lib/utils'

export interface CommandItem {
  id: string
  title: string
  subtitle?: string
  category: 'Quick Actions' | 'Pages' | 'Inventory & SKUs' | 'Deliveries & Orders'
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

interface CommandMenuProps {
  isOpen: boolean
  onClose: () => void
}

export const CommandMenu: React.FC<CommandMenuProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const {
    rawProducts,
    packagingProducts,
    salesProducts,
    productionBatches,
    kitchenTasks,
    packagingQueue,
    logisticsDeliveries,
    scheduledOrders,
    riders,
    websiteOrders,
  } = useSmokeyOps()

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

  // Build tailored command items list reflecting authentic live operational state
  const commandItems = useMemo<CommandItem[]>(() => {
    // 1. Core Pages strictly matching operational navigation
    const pages: CommandItem[] = [
      {
        id: 'page-overview',
        title: 'Operations Overview',
        subtitle: 'Live kitchen canvas, multi-stage order tracking, and sales analytics',
        category: 'Pages',
        href: '/overview',
        icon: Sparkles,
      },
      {
        id: 'page-website-orders',
        title: 'Website Orders',
        subtitle: 'Customer storefront orders, Paystack payment verification, and dispatch intake',
        category: 'Pages',
        href: '/sales/orders',
        icon: ShoppingBag,
        badge: `${websiteOrders.length} Orders`,
      },
      {
        id: 'page-sales-inventory',
        title: 'Sales Inventory',
        subtitle: 'Finished smoked guineafowl, chicken, gizzard & palmwine ready for sale',
        category: 'Pages',
        href: '/inventory/sales',
        icon: Layers,
        badge: `${salesProducts.length} Items`,
      },
      {
        id: 'page-raw-inventory',
        title: 'Raw Inventory',
        subtitle: 'Fresh poultry, rabbit, spices, firewood, and safety reorder tracking',
        category: 'Pages',
        href: '/inventory/raw',
        icon: Boxes,
        badge: `${rawProducts.length} SKUs`,
      },
      {
        id: 'page-packaging-materials',
        title: 'Packaging Materials',
        subtitle: 'Branded polybags, brown bags, size 8/12 nylon, and central store stock',
        category: 'Pages',
        href: '/inventory/packaging',
        icon: Package,
        badge: `${packagingProducts.length} Items`,
      },
      {
        id: 'page-stock-movements',
        title: 'Stock Movements',
        subtitle: 'Audit log of kitchen consumption, stock intake, and balance adjustments',
        category: 'Pages',
        href: '/inventory/movements',
        icon: FileText,
      },
      {
        id: 'page-suppliers',
        title: 'Suppliers & Vendors',
        subtitle: 'Verified poultry farms, spice vendors, and packaging suppliers',
        category: 'Pages',
        href: '/inventory/suppliers',
        icon: Building2,
      },
      {
        id: 'page-batches',
        title: 'Production Batches',
        subtitle: 'Active smoking batches, cooking yields, core temperature QC sign-offs',
        category: 'Pages',
        href: '/production/batches',
        icon: Flame,
        badge: `${productionBatches.filter(b => b.status === 'in_production').length} Active`,
      },
      {
        id: 'page-packaging-exec',
        title: 'Packaging Execution',
        subtitle: 'Order packaging queue, bag allocation, and dispatch bay staging',
        category: 'Pages',
        href: '/production/packaging',
        icon: Package,
        badge: `${packagingQueue.filter(q => q.order_status !== 'packaged').length} Due`,
      },
      {
        id: 'page-tasks',
        title: 'Kitchen Tasks',
        subtitle: 'Daily food hygiene checklists, temperature logs, and prep tasks',
        category: 'Pages',
        href: '/production/tasks',
        icon: ClipboardList,
        badge: `${kitchenTasks.filter(t => t.status !== 'done').length} Tasks`,
      },
      {
        id: 'page-board',
        title: 'Dispatch Board',
        subtitle: 'Real-time order dispatch, in-house rider assignment, waybill slips',
        category: 'Pages',
        href: '/logistics/board',
        icon: Truck,
        badge: `${logisticsDeliveries.filter(d => ['pending', 'assigned', 'in_transit'].includes(d.status)).length} Active`,
      },
      {
        id: 'page-schedule',
        title: 'Delivery Schedule',
        subtitle: 'Scheduled pre-orders, corporate event slots, and advance delivery dates',
        category: 'Pages',
        href: '/logistics/schedule',
        icon: Calendar,
        badge: `${scheduledOrders.length} Scheduled`,
      },
      {
        id: 'page-riders',
        title: 'In-House Riders & Delivery Team',
        subtitle: 'In-house riders, trip completion audits, and delivery payout disbursements',
        category: 'Pages',
        href: '/logistics/riders',
        icon: Users,
        badge: `${riders.length} Riders`,
      },
      {
        id: 'page-pickup',
        title: 'Store Pickup Counter',
        subtitle: 'Walk-in and takeaway customer order handovers at kitchen hub',
        category: 'Pages',
        href: '/logistics/pickup',
        icon: Building2,
      },
      {
        id: 'page-3pl',
        title: 'Third-Party Delivery',
        subtitle: 'Third-party riders (Uber, Bolt, GIG) tracking and fee verification',
        category: 'Pages',
        href: '/logistics/third-party',
        icon: Truck,
      },
      {
        id: 'page-accounts',
        title: 'Staff Accounts & Access Controls',
        subtitle: 'Administrator management of roles, shift permissions, and KYC profiles',
        category: 'Pages',
        href: '/accounts',
        icon: ShieldCheck,
      },
      {
        id: 'page-offices',
        title: 'Operating Offices & Hubs',
        subtitle: 'Kitchen depots, dispatch hubs, and workspace branch locations',
        category: 'Pages',
        href: '/offices',
        icon: Building2,
      },
      {
        id: 'page-support',
        title: 'Support & Help Desk',
        subtitle: 'Submit operational cases, request equipment support, report fraud or view FAQ',
        category: 'Pages',
        href: '/support',
        icon: HelpCircle,
      },
    ]

    // 2. Focused Quick Actions tailored to daily food operations
    const quickActions: CommandItem[] = [
      {
        id: 'action-receive',
        title: 'Log Received Raw Delivery',
        subtitle: 'Record supplier intake of fresh poultry, firewood, or seasonings',
        category: 'Quick Actions',
        href: '/inventory/raw',
        icon: PlusCircle,
      },
      {
        id: 'action-stockcheck',
        title: 'Physical Stock Count',
        subtitle: 'Perform daily inventory audit and log actual vs recorded counts',
        category: 'Quick Actions',
        href: '/inventory/raw',
        icon: ClipboardList,
      },
      {
        id: 'action-start-batch',
        title: 'Start Production Batch',
        subtitle: 'Launch a new smoking run with recipe ingredient deductions',
        category: 'Quick Actions',
        href: '/production/batches',
        icon: Flame,
      },
      {
        id: 'action-assign-rider',
        title: 'Assign Rider to Delivery',
        subtitle: 'Hand over packaged orders to in-house or third-party riders',
        category: 'Quick Actions',
        href: '/logistics/board',
        icon: Truck,
      },
      {
        id: 'action-support',
        title: 'Open Support & Help Desk',
        subtitle: 'Submit a case, report an operational bug, or request equipment help',
        category: 'Quick Actions',
        href: '/support',
        icon: LifeBuoy,
      },
    ]

    // 3. Real Inventory SKUs from live stock
    const skuItems: CommandItem[] = [
      ...rawProducts.slice(0, 5).map(r => ({
        id: `sku-raw-${r.id}`,
        title: r.name,
        subtitle: `${r.sku} • Raw Material • ${r.stock_qty} ${r.unit} on hand`,
        category: 'Inventory & SKUs' as const,
        href: '/inventory/raw',
        icon: Boxes,
        badge: r.stock_qty <= (r.reorder_level || 10) ? 'Low Stock' : `${formatNaira(r.unit_cost)}/${r.unit}`,
      })),
      ...packagingProducts.slice(0, 3).map(p => ({
        id: `sku-pkg-${p.id}`,
        title: p.name,
        subtitle: `${p.sku} • Packaging Material • ${p.stock_qty} ${p.unit} in store`,
        category: 'Inventory & SKUs' as const,
        href: '/inventory/packaging',
        icon: Package,
        badge: `${formatNaira(p.unit_cost)}`,
      })),
      ...salesProducts.slice(0, 4).map(sp => ({
        id: `sku-sales-${sp.id}`,
        title: sp.name,
        subtitle: `${sp.sku} • Finished Product • ${sp.stock_qty} units ready`,
        category: 'Inventory & SKUs' as const,
        href: '/inventory/sales',
        icon: Layers,
        badge: formatNaira(sp.selling_price),
      })),
    ]

    // 4. Real Recent Orders from operational queue
    const orderItems: CommandItem[] = websiteOrders.slice(0, 4).map(ord => ({
      id: `order-live-${ord.id}`,
      title: `Order #${ord.order_ref || ord.id}: ${ord.customer_name}`,
      subtitle: `${formatNaira(ord.total_amount)} • ${ord.address || 'Lagos'} • ${ord.channel || 'Storefront'}`,
      category: 'Deliveries & Orders' as const,
      href: '/sales/orders',
      icon: Truck,
      badge: ord.fulfillment_status?.replace(/_/g, ' ').toUpperCase() || 'CONFIRMED',
    }))

    return [...quickActions, ...pages, ...skuItems, ...orderItems]
  }, [
    rawProducts,
    packagingProducts,
    salesProducts,
    productionBatches,
    kitchenTasks,
    packagingQueue,
    logisticsDeliveries,
    scheduledOrders,
    riders,
    websiteOrders,
  ])

  // Filter items matching query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return commandItems
    const q = query.toLowerCase().trim()
    return commandItems.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    )
  }, [query, commandItems])

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
            className="flex-1 bg-transparent text-[14px] text-kumo-strong placeholder:text-kumo-subtle/70 focus:outline-none"
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
          className="flex-1 overflow-y-auto p-2 divide-y divide-kumo-line/40 text-[13px] text-kumo-default"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-kumo-subtle">
              <p className="font-semibold text-[14px] text-kumo-strong">No results found for "{query}"</p>
              <p className="text-[13px] mt-1">Try searching for an ingredient, page name, or SKU.</p>
            </div>
          ) : (
            categories.map(cat => {
              const itemsInCat = filteredItems.filter(item => item.category === cat)
              if (itemsInCat.length === 0) return null

              return (
                <div key={cat} className="py-1.5 first:pt-0 last:pb-0">
                  <div className="px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-kumo-subtle">
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
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-kumo-tint text-kumo-strong'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-primary text-white shadow-xs'
                                  : 'bg-kumo-tint text-kumo-default border border-kumo-line/60'
                              }`}
                            >
                              <Icon className="w-[19px] h-[19px]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-[14px] truncate leading-snug">
                                {item.title}
                              </p>
                              {item.subtitle && (
                                <p className="text-[13px] text-kumo-subtle truncate mt-0.5">
                                  {item.subtitle}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 ml-3">
                            {item.badge && (
                              <span
                                className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${
                                  isSelected
                                    ? 'bg-primary/20 text-primary border-primary/30'
                                    : 'bg-kumo-tint text-kumo-subtle border-kumo-line'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                            <ArrowRight
                              className={`w-4 h-4 transition-transform ${
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
