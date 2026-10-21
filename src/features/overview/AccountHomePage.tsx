import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { formatNaira, formatQuantity, formatDate } from '@/lib/utils'
import {
  Boxes,
  Flame,
  Truck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Package,
  Layers,
  Clock,
  CheckCircle2,
  Plus,
  Bike,
  Check,
  Search,
  Filter,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bell,
  Share2,
  AlertCircle,
  Archive,
  Ban,
  Activity,
  ShoppingBag,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SmokeyInventoryItem {
  id: string
  originalId: number
  itemType: 'raw' | 'packaging' | 'sales'
  name: string
  sku: string
  batchLot: string
  category: string
  currentStock: number
  maxStock: number
  reorderLevel: number
  unit: string
  unitCost: number
  expiryDate: string
  expiryText: string
  daysToExpiry: number
  isPerishable: boolean
  status: 'critical' | 'low' | 'out_of_stock' | 'expiring' | 'healthy'
  priority: 'urgent' | 'high' | 'normal'
  supplierName?: string
}

export const AccountHomePage: React.FC = () => {
  const navigate = useNavigate()
  const {
    rawProducts,
    packagingProducts,
    salesProducts,
    inventoryLots,
    suppliers,
    receiveRawStock,
    receivePackaging,
    saveRawProduct,
    productionBatches,
    logisticsDeliveries,
    riders
  } = useSmokeyOps()

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  // Action Modals State
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false)
  const [actionItem, setActionItem] = useState<{ item: SmokeyInventoryItem; action: string } | null>(null)
  const [actionQuantity, setActionQuantity] = useState('50')
  const [actionSupplierId, setActionSupplierId] = useState<string>('2')
  const [actionPoRef, setActionPoRef] = useState('')
  const [actionNotes, setActionNotes] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // New stock form
  const [newStockForm, setNewStockForm] = useState({
    name: '',
    sku: '',
    batch: '',
    category: 'Raw Proteins',
    itemType: 'raw' as 'raw' | 'packaging' | 'sales',
    stock: '50',
    reorderLevel: '20',
    unit: 'PIECES',
    unitCost: '6500',
    expiryDate: '2026-10-15',
    supplierId: '2'
  })

  // 1. Map all real project inventory into unified SmokeyInventoryItems
  const allInventoryItems: SmokeyInventoryItem[] = useMemo(() => {
    const items: SmokeyInventoryItem[] = []

    // Map Raw Ingredients & Meats
    rawProducts.forEach(raw => {
      // Find matching FEFO lot if available
      const matchingLot = inventoryLots.find(lot => lot.product_id === raw.id || lot.sku === raw.sku)
      
      let days = 999
      let expText = '—'
      let expDateFormatted = 'Non-perishable'

      if (raw.is_perishable || raw.expiry_date || matchingLot) {
        const expStr = matchingLot?.expiry_date || raw.expiry_date || '2026-10-05'
        days = matchingLot?.days_to_expiry ?? 14
        expDateFormatted = formatDate(expStr)
        expText = days <= 0 ? 'Expired today' : `in ${days} days`
      }

      // Determine Category
      let category = 'Raw Ingredients'
      const n = raw.name.toLowerCase()
      if (n.includes('guineafowl') || n.includes('chicken') || n.includes('turkey') || n.includes('catfish') || n.includes('beef') || n.includes('goat') || n.includes('gizzard')) {
        category = 'Raw Proteins'
      } else if (n.includes('pepper') || n.includes('spicies') || n.includes('cinnamon') || n.includes('clove') || n.includes('seasoning') || n.includes('salt')) {
        category = 'Spices & Seasoning'
      } else if (n.includes('firewood') || n.includes('wood chips') || n.includes('charcoal')) {
        category = 'Fuel & Charcoal'
      } else if (n.includes('oil')) {
        category = 'Cooking Oils'
      }

      // Max capacity reference (typically 2-3x reorder level)
      const maxStock = Math.max(raw.stock_qty, raw.reorder_level * 2.5, 50)

      // Determine Status
      let status: SmokeyInventoryItem['status'] = 'healthy'
      let priority: SmokeyInventoryItem['priority'] = 'normal'

      if (raw.stock_qty <= 0) {
        status = 'out_of_stock'
        priority = 'urgent'
      } else if (days <= 7) {
        status = 'expiring'
        priority = 'urgent'
      } else if (raw.stock_qty <= raw.reorder_level * 0.5) {
        status = 'critical'
        priority = 'urgent'
      } else if (raw.stock_qty <= raw.reorder_level) {
        status = 'low'
        priority = 'high'
      }

      items.push({
        id: `raw-${raw.id}`,
        originalId: raw.id,
        itemType: 'raw',
        name: raw.name,
        sku: raw.sku,
        batchLot: matchingLot?.lot_number || raw.fefo_lot || `LOT-${raw.sku.slice(-4)}`,
        category,
        currentStock: raw.stock_qty,
        maxStock: Math.round(maxStock),
        reorderLevel: raw.reorder_level,
        unit: raw.unit,
        unitCost: raw.unit_cost,
        expiryDate: expDateFormatted,
        expiryText: expText,
        daysToExpiry: days,
        isPerishable: !!raw.is_perishable,
        status,
        priority,
        supplierName: matchingLot?.supplier_name || 'Madam Poultry Co.'
      })
    })

    // Map Packaging Products
    packagingProducts.forEach(pack => {
      const maxStock = Math.max(pack.stock_qty, pack.reorder_level * 2, 100)
      let status: SmokeyInventoryItem['status'] = 'healthy'
      let priority: SmokeyInventoryItem['priority'] = 'normal'

      if (pack.stock_qty <= 0) {
        status = 'out_of_stock'
        priority = 'urgent'
      } else if (pack.stock_qty <= pack.reorder_level * 0.3) {
        status = 'critical'
        priority = 'urgent'
      } else if (pack.stock_qty <= pack.reorder_level) {
        status = 'low'
        priority = 'high'
      }

      items.push({
        id: `pack-${pack.id}`,
        originalId: pack.id,
        itemType: 'packaging',
        name: pack.name,
        sku: pack.sku,
        batchLot: `LOT-PCK-${pack.sku.slice(-3)}`,
        category: 'Packaging Materials',
        currentStock: pack.stock_qty,
        maxStock: Math.round(maxStock),
        reorderLevel: pack.reorder_level,
        unit: pack.unit,
        unitCost: pack.unit_cost,
        expiryDate: '—',
        expiryText: 'Non-perishable',
        daysToExpiry: 999,
        isPerishable: false,
        status,
        priority,
        supplierName: 'Prime Packaging Ltd'
      })
    })

    // Map Finished Sales Products
    salesProducts.forEach(sales => {
      const maxStock = Math.max(sales.stock_qty, sales.reorder_level * 2, 50)
      let status: SmokeyInventoryItem['status'] = 'healthy'
      let priority: SmokeyInventoryItem['priority'] = 'normal'

      if (sales.stock_qty <= 0) {
        status = 'out_of_stock'
        priority = 'urgent'
      } else if (sales.stock_qty <= sales.reorder_level * 0.4) {
        status = 'critical'
        priority = 'urgent'
      } else if (sales.stock_qty <= sales.reorder_level) {
        status = 'low'
        priority = 'high'
      }

      items.push({
        id: `sales-${sales.id}`,
        originalId: sales.id,
        itemType: 'sales',
        name: sales.name,
        sku: sales.sku,
        batchLot: `PRD-${sales.sku.slice(4, 10)}`,
        category: 'Finished Goods',
        currentStock: sales.stock_qty,
        maxStock: Math.round(maxStock),
        reorderLevel: sales.reorder_level,
        unit: sales.unit,
        unitCost: sales.unit_cost,
        expiryDate: 'Daily Prepared',
        expiryText: 'Fresh batch',
        daysToExpiry: 1,
        isPerishable: true,
        status,
        priority,
        supplierName: 'Smokey In-house Kitchen'
      })
    })

    return items
  }, [rawProducts, packagingProducts, salesProducts, inventoryLots])

  // 2. Compute dynamic KPIs
  const totalSkuCount = allInventoryItems.length
  const lowStockCount = allInventoryItems.filter(i => i.status === 'low' || i.status === 'critical').length
  const outOfStockCount = allInventoryItems.filter(i => i.status === 'out_of_stock').length
  const expiringCount = allInventoryItems.filter(i => i.status === 'expiring' || (i.isPerishable && i.daysToExpiry <= 14)).length
  const totalValuation = useMemo(() => {
    const rawVal = rawProducts.reduce((s, p) => s + (p.stock_qty * p.unit_cost), 0)
    const packVal = packagingProducts.reduce((s, p) => s + (p.stock_qty * p.unit_cost), 0)
    const salesVal = salesProducts.reduce((s, p) => s + (p.stock_qty * p.unit_cost), 0)
    return rawVal + packVal + salesVal
  }, [rawProducts, packagingProducts, salesProducts])

  // 3. Filtered Items
  const filteredItems = useMemo(() => {
    return allInventoryItems.filter(item => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.batchLot.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)

      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter

      const matchesCategory =
        categoryFilter === 'all' || item.category === categoryFilter

      const matchesPriority =
        priorityFilter === 'all' || item.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority
    })
  }, [allInventoryItems, searchQuery, statusFilter, categoryFilter, priorityFilter])

  // 4. Expiring Soon list (FEFO items mapped from real project inventory)
  const expiringSoonList = useMemo(() => {
    const perishables = allInventoryItems
      .filter(i => i.isPerishable && i.daysToExpiry <= 30 && i.currentStock > 0)
      .sort((a, b) => a.daysToExpiry - b.daysToExpiry)

    return perishables.slice(0, 4).map(item => {
      let badgeBg = 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900'
      if (item.daysToExpiry > 7 && item.daysToExpiry <= 14) {
        badgeBg = 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900'
      } else if (item.daysToExpiry > 14) {
        badgeBg = 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900'
      }

      return {
        id: item.id,
        days: item.daysToExpiry,
        badgeBg,
        name: item.name,
        sub: `${item.sku} · exp ${item.expiryDate}`
      }
    })
  }, [allInventoryItems])

  // 5. Low Stock Alerts list (Real items below reorder level)
  const lowStockAlertsList = useMemo(() => {
    const lows = allInventoryItems
      .filter(i => i.status === 'critical' || i.status === 'low' || i.currentStock <= i.reorderLevel)
      .sort((a, b) => (a.currentStock / a.maxStock) - (b.currentStock / b.maxStock))

    return lows.slice(0, 4).map(item => {
      const percentage = Math.round((item.currentStock / item.maxStock) * 100)
      const isCritical = item.status === 'critical' || percentage <= 15
      return {
        item,
        name: item.name,
        sku: item.sku,
        stockText: `${formatQuantity(item.currentStock)} / ${formatQuantity(item.maxStock)} ${item.unit.toLowerCase()} (${percentage}%)`,
        percentage,
        barColor: isCritical ? 'bg-[#c0201f]' : 'bg-amber-500',
        btnVariant: isCritical ? ('danger' as const) : ('dark' as const)
      }
    })
  }, [allInventoryItems])

  // Action Handlers
  const handleOpenAction = (item: SmokeyInventoryItem, action: string) => {
    setActionItem({ item, action })
    setActionQuantity(action === 'Reorder' || action === 'Restock' ? String(Math.max(item.reorderLevel * 2, 20)) : '0')
    setActionPoRef(`PO-${new Date().getFullYear()}-${item.sku.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4)}-${Math.floor(100 + Math.random() * 900)}`)
    setActionNotes('')
  }

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault()
    if (!actionItem) return

    const qty = parseFloat(actionQuantity) || 0
    if (qty > 0) {
      if (actionItem.item.itemType === 'raw') {
        receiveRawStock({
          supplierId: parseInt(actionSupplierId, 10) || 2,
          productId: actionItem.item.originalId,
          quantity: qty,
          unitCost: actionItem.item.unitCost,
          notes: `${actionItem.action} via Account Hub. Ref: ${actionPoRef}. ${actionNotes}`
        })
      } else if (actionItem.item.itemType === 'packaging') {
        receivePackaging({
          productId: actionItem.item.originalId,
          quantity: qty,
          unitCost: actionItem.item.unitCost
        })
      }
    }

    setToastMessage(`Confirmed ${actionItem.action} for ${actionItem.item.name} (${qty} ${actionItem.item.unit})`)
    setTimeout(() => setToastMessage(null), 3500)
    setActionItem(null)
  }

  const handleAddStockSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStockForm.name.trim()) return

    const qty = parseFloat(newStockForm.stock) || 0
    const reorder = parseFloat(newStockForm.reorderLevel) || 10
    const cost = parseFloat(newStockForm.unitCost) || 5000

    saveRawProduct({
      name: newStockForm.name.trim(),
      sku: newStockForm.sku.trim() || `SKU-${Date.now().toString().slice(-5)}`,
      unit: newStockForm.unit.trim().toUpperCase() || 'PIECES',
      unit_cost: cost,
      reorder_level: reorder,
      stock_qty: qty,
      is_perishable: newStockForm.category === 'Raw Proteins',
      expiry_date: newStockForm.expiryDate
    })

    setIsAddStockModalOpen(false)
    setToastMessage(`Successfully registered ${newStockForm.name} in inventory`)
    setTimeout(() => setToastMessage(null), 3500)
  }

  return (
    <div className="space-y-6 font-sans antialiased text-kumo-default pb-12">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-kumo-base border border-kumo-line shadow-xl text-xs font-medium text-kumo-strong">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Operational Bar: Brand & Shift Info (Remapped to Smokey Operations Hub) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 py-1">
        {/* Left: Brand & Facility Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#c0201f] flex items-center justify-center text-white shadow-xs">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-kumo-strong">
              <span>Smokey Hut</span>
              <span className="text-kumo-subtle font-normal">/</span>
              <span className="text-kumo-subtle font-normal">Operations & Inventory Hub</span>
            </div>
          </div>

          <span className="hidden md:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-primary/10 text-primary border border-primary/20">
            Lekki Central Depot
          </span>
        </div>

        {/* Right: Operational Shift Pill, Bell, Share, User Profile */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Shift Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/70 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800/60 dark:text-emerald-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Morning Shift · 06:00–14:00</span>
          </div>

          {/* Icon Button: Bell */}
          <button
            type="button"
            onClick={() => setToastMessage(`Active alerts: ${lowStockCount} items below reorder, ${expiringCount} perishable items expiring`)}
            className="size-8 rounded-lg border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-strong flex items-center justify-center transition-colors cursor-pointer relative"
            title="Operational Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {lowStockCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#c0201f] ring-2 ring-kumo-canvas" />
            )}
          </button>

          {/* Icon Button: Share / Copy */}
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href)
              setToastMessage('Copied dashboard link to clipboard!')
            }}
            className="size-8 rounded-lg border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-strong flex items-center justify-center transition-colors cursor-pointer"
            title="Share Dashboard"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* User Profile Mini Card */}
          <Link
            to="/auth"
            className="flex items-center gap-2 pl-2 pr-2 py-1 rounded-full border border-kumo-line bg-kumo-base hover:bg-kumo-tint transition-colors cursor-pointer"
            title="Pitmaster Babajide · Lead Operations & Kitchen Director (Click for Auth Screen)"
          >
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                alt="Babajide Ogundipe"
                className="w-6 h-6 rounded-full object-cover border border-kumo-line"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-black" />
            </div>
            <span className="hidden xl:inline text-xs font-semibold text-kumo-strong">
              Babajide (Pitmaster)
            </span>
          </Link>
        </div>
      </div>

      {/* Main Section Header with Title, Summary, and + Add Stock Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-kumo-strong">
            Inventory
          </h1>
          <p className="text-xs text-kumo-subtle mt-0.5">
            {totalSkuCount} SKUs · {lowStockCount} below reorder · {expiringCount} expiring within 30 days
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/inventory/raw')}
            className="h-9 px-3 text-xs"
          >
            Inventory Management
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsAddStockModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="h-9 px-4 text-xs font-semibold bg-[#0f172a] hover:bg-[#1e293b] text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 border-0 shadow-sm"
          >
            Add Stock
          </Button>
        </div>
      </div>

      {/* 4 Metric KPI Cards (Remapped to Smokey Hut Operations Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: TOTAL WORKING INVENTORY */}
        <div className="p-4 rounded-xl border border-kumo-line bg-kumo-base shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-kumo-subtle uppercase">
              Total Inventory Valuation
            </span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">
              ₦
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-kumo-strong">
              {formatNaira(totalValuation)}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {totalSkuCount} SKUs
            </span>
          </div>
        </div>

        {/* Metric 2: LOW STOCK */}
        <div className="p-4 rounded-xl border border-kumo-line bg-kumo-base shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-kumo-subtle uppercase">
              Low Stock
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-kumo-strong">
              {lowStockCount}
            </span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              +{lowStockCount} below reorder point
            </span>
          </div>
        </div>

        {/* Metric 3: EXPIRING 30D (Perishable FEFO Lots) */}
        <div className="p-4 rounded-xl border border-kumo-line bg-kumo-base shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-kumo-subtle uppercase">
              Expiring 30D (FEFO)
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-kumo-strong">
              {expiringCount}
            </span>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {allInventoryItems.filter(i => i.isPerishable && i.daysToExpiry <= 7).length} urgent within 7 days
            </span>
          </div>
        </div>

        {/* Metric 4: OUT OF STOCK */}
        <div className="p-4 rounded-xl border border-kumo-line bg-kumo-base shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-kumo-subtle uppercase">
              Out of Stock
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-kumo-strong">
              {outOfStockCount}
            </span>
            <span className="text-xs font-medium text-kumo-subtle">
              needs supplier PO
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Left 72% Table, Right 28% Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols ~ 70%): Stock items Table Area */}
        <div className="lg:col-span-8 rounded-xl border border-kumo-line bg-kumo-base shadow-2xs overflow-hidden">
          {/* Table Toolbar Header */}
          <div className="p-4 border-b border-kumo-line flex flex-wrap items-center justify-between gap-3">
            {/* Title & Alerts Badge */}
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-kumo-strong">
                Stock items
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900">
                {lowStockCount + outOfStockCount} alerts
              </span>
            </div>

            {/* Controls: Search input, Category filter, Status filter, Priority filter, Maximize */}
            <div className="flex items-center flex-wrap gap-2 text-xs">
              {/* Search Bar */}
              <div className="relative min-w-[190px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-kumo-subtle pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search meat, spices, packaging..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full h-8 pl-8 pr-3 rounded-lg border border-kumo-line bg-kumo-canvas text-xs text-kumo-strong placeholder:text-kumo-subtle focus:outline-none focus:ring-1 focus:ring-kumo-link"
                />
              </div>

              {/* Category Select */}
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="h-8 pl-2.5 pr-7 rounded-lg border border-kumo-line bg-kumo-canvas text-xs text-kumo-default appearance-none focus:outline-none cursor-pointer"
                >
                  <option value="all">All categories</option>
                  <option value="Raw Proteins">Raw Proteins</option>
                  <option value="Spices & Seasoning">Spices & Seasoning</option>
                  <option value="Fuel & Charcoal">Fuel & Charcoal</option>
                  <option value="Cooking Oils">Cooking Oils</option>
                  <option value="Packaging Materials">Packaging</option>
                  <option value="Finished Goods">Finished Goods</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-kumo-subtle pointer-events-none" />
              </div>

              {/* Status Select */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="h-8 pl-2.5 pr-7 rounded-lg border border-kumo-line bg-kumo-canvas text-xs text-kumo-default appearance-none focus:outline-none cursor-pointer"
                >
                  <option value="all">All statuses</option>
                  <option value="critical">Critical</option>
                  <option value="low">Low</option>
                  <option value="out_of_stock">Out of stock</option>
                  <option value="expiring">Expiring</option>
                  <option value="healthy">Healthy</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-kumo-subtle pointer-events-none" />
              </div>

              {/* Priority Select */}
              <div className="relative">
                <select
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="h-8 pl-2.5 pr-7 rounded-lg border border-kumo-line bg-kumo-canvas text-xs text-kumo-default appearance-none focus:outline-none cursor-pointer"
                >
                  <option value="all">All priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-kumo-subtle pointer-events-none" />
              </div>

              {/* Maximize Icon */}
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setCategoryFilter('all')
                  setPriorityFilter('all')
                  setToastMessage('Filters reset to default')
                }}
                className="size-8 rounded-lg border border-kumo-line bg-kumo-canvas hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-strong flex items-center justify-center transition-colors cursor-pointer"
                title="Reset Filters"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-kumo-line bg-kumo-canvas/40 text-[11px] font-semibold text-kumo-subtle uppercase tracking-wider select-none">
                  <th className="py-2.5 px-4 font-semibold">ITEM / SKU</th>
                  <th className="py-2.5 px-4 font-semibold">CATEGORY</th>
                  <th className="py-2.5 px-4 font-semibold">STOCK</th>
                  <th className="py-2.5 px-4 font-semibold">NEXT EXPIRY</th>
                  <th className="py-2.5 px-4 font-semibold">STATUS</th>
                  <th className="py-2.5 px-4 font-semibold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kumo-line/60">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-kumo-subtle">
                      No stock items match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const percent = Math.min(100, Math.round((item.currentStock / item.maxStock) * 100))
                    
                    // Determine stock progress bar color
                    let barColor = 'bg-emerald-500'
                    if (item.status === 'critical' || percent <= 15) {
                      barColor = 'bg-[#c0201f]'
                    } else if (item.status === 'low' || percent <= 30) {
                      barColor = 'bg-amber-500'
                    } else if (item.status === 'expiring') {
                      barColor = 'bg-orange-500'
                    } else if (item.status === 'out_of_stock' || item.currentStock === 0) {
                      barColor = 'bg-zinc-300 dark:bg-zinc-700'
                    }

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-kumo-tint/40 transition-colors group"
                      >
                        {/* Item Name & SKU / Batch Lot */}
                        <td className="py-3 px-4">
                          <div className={cn(
                            'font-semibold',
                            item.status === 'critical' ? 'text-rose-600 dark:text-rose-400' :
                            item.status === 'expiring' ? 'text-amber-700 dark:text-amber-400' :
                            'text-kumo-strong'
                          )}>
                            {item.name}
                          </div>
                          <div className="text-[11px] text-kumo-subtle mt-0.5">
                            {item.sku} · {item.batchLot}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 text-kumo-subtle">
                          {item.category}
                        </td>

                        {/* Stock with Mini Progress Bar */}
                        <td className="py-3 px-4 min-w-[130px]">
                          <div className="font-medium text-kumo-strong flex items-center gap-1">
                            <span>{formatQuantity(item.currentStock)}</span>
                            <span className="text-kumo-subtle text-[11px]">/ {formatQuantity(item.maxStock)} {item.unit.toLowerCase()}</span>
                          </div>
                          <div className="w-24 h-1.5 rounded-full bg-kumo-line mt-1.5 overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all duration-300', barColor)}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </td>

                        {/* Next Expiry (FEFO countdown) */}
                        <td className="py-3 px-4">
                          <div className="text-kumo-strong font-medium">
                            {item.expiryDate}
                          </div>
                          <div className={cn(
                            'text-[11px] mt-0.5',
                            item.daysToExpiry <= 7 ? 'text-rose-600 font-semibold dark:text-rose-400' :
                            item.daysToExpiry <= 14 ? 'text-amber-600 font-medium dark:text-amber-400' :
                            'text-kumo-subtle'
                          )}>
                            {item.expiryText}
                          </div>
                        </td>

                        {/* Status Dot Pill */}
                        <td className="py-3 px-4">
                          {item.status === 'critical' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900">
                              <span className="size-1.5 rounded-full bg-rose-600" />
                              Critical
                            </span>
                          )}
                          {item.status === 'low' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-900">
                              <span className="size-1.5 rounded-full bg-yellow-500" />
                              Low
                            </span>
                          )}
                          {item.status === 'out_of_stock' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-800">
                              <span className="size-1.5 rounded-full bg-slate-500" />
                              Out of stock
                            </span>
                          )}
                          {item.status === 'expiring' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900">
                              <span className="size-1.5 rounded-full bg-orange-500" />
                              Expiring
                            </span>
                          )}
                          {item.status === 'healthy' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900">
                              <span className="size-1.5 rounded-full bg-emerald-600" />
                              Healthy
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-4 text-right">
                          {item.status === 'critical' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenAction(item, 'Reorder')}
                              className="px-3 py-1 rounded-md text-xs font-semibold bg-[#c0201f] text-white hover:bg-[#a01817] transition-colors cursor-pointer shadow-2xs"
                            >
                              Reorder
                            </button>
                          ) : item.status === 'low' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenAction(item, 'Reorder')}
                              className="px-3 py-1 rounded-md text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors cursor-pointer shadow-2xs"
                            >
                              Reorder
                            </button>
                          ) : item.status === 'out_of_stock' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenAction(item, 'Restock')}
                              className="px-3 py-1 rounded-md text-xs font-semibold bg-[#115e59] text-white hover:bg-[#0f766e] transition-colors cursor-pointer shadow-2xs"
                            >
                              Restock
                            </button>
                          ) : item.status === 'expiring' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenAction(item, 'Inspect')}
                              className="px-3 py-1 rounded-md text-xs font-semibold bg-[#ea580c] text-white hover:bg-[#c2410c] transition-colors cursor-pointer shadow-2xs"
                            >
                              Inspect
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenAction(item, 'View')}
                              className="px-3 py-1 rounded-md text-xs font-medium border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-kumo-default hover:text-kumo-strong transition-colors cursor-pointer"
                            >
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer: Pagination */}
          <div className="p-3 border-t border-kumo-line bg-kumo-canvas/30 flex items-center justify-between text-xs text-kumo-subtle">
            <div>
              Showing {filteredItems.length} of {totalSkuCount} SKUs
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="px-2.5 py-1 rounded-md border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-kumo-default transition-colors cursor-pointer disabled:opacity-40"
                disabled
              >
                ← Prev
              </button>
              <button
                type="button"
                className="w-7 h-7 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-black font-semibold flex items-center justify-center shadow-2xs"
              >
                1
              </button>
              <button
                type="button"
                className="w-7 h-7 rounded-md hover:bg-kumo-tint text-kumo-default flex items-center justify-center transition-colors cursor-pointer"
              >
                2
              </button>
              <button
                type="button"
                className="w-7 h-7 rounded-md hover:bg-kumo-tint text-kumo-default flex items-center justify-center transition-colors cursor-pointer"
              >
                3
              </button>
              <button
                type="button"
                className="px-2.5 py-1 rounded-md border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-kumo-default transition-colors cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols ~ 30%): Expiring Soon & Low Stock Alerts */}
        <div className="lg:col-span-4 space-y-6">
          {/* Widget 1: Expiring Soon (FEFO Lots) */}
          <div className="rounded-xl border border-kumo-line bg-kumo-base p-4 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-kumo-line">
              <h3 className="text-sm font-bold text-kumo-strong">
                Expiring Soon (FEFO)
              </h3>
              <span className="text-[11px] text-kumo-subtle font-medium">
                {expiringCount} within 30 days
              </span>
            </div>

            <div className="space-y-3">
              {expiringSoonList.length === 0 ? (
                <p className="text-xs text-kumo-subtle py-2 text-center">No lots expiring within 30 days.</p>
              ) : (
                expiringSoonList.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-xs">
                    {/* Square Days Badge */}
                    <div className={cn('size-11 rounded-lg flex flex-col items-center justify-center shrink-0 font-bold leading-tight select-none', item.badgeBg)}>
                      <span className="text-sm font-extrabold">{item.days}</span>
                      <span className="text-[8px] uppercase tracking-wider font-semibold opacity-90">DAYS</span>
                    </div>

                    {/* Title & Sub */}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-kumo-strong truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-kumo-subtle truncate mt-0.5">
                        {item.sub}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-kumo-line/60">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('expiring')
                  setToastMessage('Filtered table to show expiring FEFO lots')
                }}
                className="w-full text-center text-xs font-semibold text-kumo-subtle hover:text-kumo-strong py-1 flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>View all expiring lots</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Widget 2: Low Stock Alerts */}
          <div className="rounded-xl border border-kumo-line bg-kumo-base p-4 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-kumo-line">
              <h3 className="text-sm font-bold text-kumo-strong">
                Low Stock Alerts
              </h3>
              <span className="text-[11px] text-kumo-subtle font-medium">
                {lowStockCount} below reorder
              </span>
            </div>

            <div className="space-y-3.5">
              {lowStockAlertsList.length === 0 ? (
                <p className="text-xs text-kumo-subtle py-2 text-center">All inventory above safety buffer.</p>
              ) : (
                lowStockAlertsList.map((entry, idx) => (
                  <div key={idx} className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-kumo-strong">{entry.name}</div>
                        <div className="text-[11px] text-kumo-subtle">{entry.sku}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenAction(entry.item, 'Reorder')}
                        className={cn(
                          'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer shadow-2xs',
                          entry.btnVariant === 'danger'
                            ? 'bg-[#c0201f] text-white hover:bg-[#a01817]'
                            : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                        )}
                      >
                        Reorder
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-kumo-subtle font-medium">
                      <span>{entry.stockText}</span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-kumo-line overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-300', entry.barColor)}
                        style={{ width: `${entry.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-kumo-line/60">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('low')
                  setToastMessage('Filtered table to show low stock items')
                }}
                className="w-full text-center text-xs font-semibold text-kumo-subtle hover:text-kumo-strong py-1 flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>View all low stock alerts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: + Add Stock */}
      <Dialog
        isOpen={isAddStockModalOpen}
        onClose={() => setIsAddStockModalOpen(false)}
        title="Register New Inventory SKU"
        description="Add a raw protein, spice blend, packaging stock, or fuel material to Smokey Hut."
      >
        <form onSubmit={handleAddStockSubmit} className="space-y-4 text-xs font-sans">
          <Input
            label="Item Description / Material Name"
            placeholder="e.g. Fresh Quail / Applewood Smoking Chips"
            value={newStockForm.name}
            onChange={(e) => setNewStockForm(prev => ({ ...prev, name: e.target.value }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="SKU Code"
              placeholder="e.g. SKU-00045"
              value={newStockForm.sku}
              onChange={(e) => setNewStockForm(prev => ({ ...prev, sku: e.target.value }))}
              required
            />
            <Input
              label="FEFO Lot / Consignment #"
              placeholder="e.g. LOT-QUA-1002"
              value={newStockForm.batch}
              onChange={(e) => setNewStockForm(prev => ({ ...prev, batch: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-kumo-strong mb-1.5">
                Category
              </label>
              <select
                value={newStockForm.category}
                onChange={(e) => setNewStockForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong focus:outline-none"
              >
                <option value="Raw Proteins">Raw Proteins</option>
                <option value="Spices & Seasoning">Spices & Seasoning</option>
                <option value="Fuel & Charcoal">Fuel & Charcoal</option>
                <option value="Cooking Oils">Cooking Oils</option>
                <option value="Packaging Materials">Packaging Materials</option>
                <option value="Finished Goods">Finished Goods</option>
              </select>
            </div>

            <Input
              label="Unit of Measurement"
              placeholder="PIECES, KG, BUNDLE, ROLLS"
              value={newStockForm.unit}
              onChange={(e) => setNewStockForm(prev => ({ ...prev, unit: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Initial Quantity On-Hand"
              type="number"
              placeholder="50"
              value={newStockForm.stock}
              onChange={(e) => setNewStockForm(prev => ({ ...prev, stock: e.target.value }))}
              required
            />
            <Input
              label="Reorder Safety Buffer"
              type="number"
              placeholder="20"
              value={newStockForm.reorderLevel}
              onChange={(e) => setNewStockForm(prev => ({ ...prev, reorderLevel: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Unit Cost (₦)"
              type="number"
              placeholder="6500"
              value={newStockForm.unitCost}
              onChange={(e) => setNewStockForm(prev => ({ ...prev, unitCost: e.target.value }))}
              required
            />
            <Input
              label="Expiry Date (if perishable)"
              type="date"
              value={newStockForm.expiryDate}
              onChange={(e) => setNewStockForm(prev => ({ ...prev, expiryDate: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-kumo-line">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsAddStockModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save & Credit Stock
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL: Reorder / Restock / Inspect Action */}
      {actionItem && (
        <Dialog
          isOpen={true}
          onClose={() => setActionItem(null)}
          title={`${actionItem.action}: ${actionItem.item.name}`}
          description={`Execute inventory action for ${actionItem.item.sku} (${actionItem.item.batchLot}).`}
        >
          <form onSubmit={handleConfirmAction} className="space-y-4 text-xs font-sans">
            <div className="p-3 rounded-lg bg-kumo-canvas border border-kumo-line space-y-1">
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Current On-Hand:</span>
                <span className="font-semibold text-kumo-strong">
                  {formatQuantity(actionItem.item.currentStock)} {actionItem.item.unit.toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Reorder Level:</span>
                <span className="font-semibold text-kumo-strong">
                  {formatQuantity(actionItem.item.reorderLevel)} {actionItem.item.unit.toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Expiry / FEFO:</span>
                <span className="font-semibold text-kumo-strong">
                  {actionItem.item.expiryDate} ({actionItem.item.expiryText})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Unit Cost:</span>
                <span className="font-semibold text-kumo-strong">{formatNaira(actionItem.item.unitCost)}</span>
              </div>
            </div>

            {actionItem.action === 'Inspect' ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-kumo-strong">
                  Quality Clearance & Cold-Chain Storage Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Record freezer temperature, marinade vacuum seal, meat color..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong focus:outline-none"
                  required
                />
              </div>
            ) : actionItem.action === 'View' ? (
              <div className="space-y-2 text-kumo-subtle">
                <p>This inventory material is healthy and within optimal operational thresholds.</p>
                <p>Managed by: Pitmaster Babajide (Lekki Central Facility).</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={`Reorder Quantity (${actionItem.item.unit})`}
                    type="number"
                    value={actionQuantity}
                    onChange={(e) => setActionQuantity(e.target.value)}
                    required
                  />
                  <div>
                    <label className="block text-xs font-semibold text-kumo-strong mb-1.5">
                      Supplier / Vendor
                    </label>
                    <select
                      value={actionSupplierId}
                      onChange={(e) => setActionSupplierId(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong focus:outline-none"
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Input
                  label="Purchase Order Ref / Delivery Waybill"
                  value={actionPoRef}
                  onChange={(e) => setActionPoRef(e.target.value)}
                  required
                />

                <Input
                  label="Special Receiving Instructions (Optional)"
                  placeholder="e.g. Weigh on scale upon delivery at back dock"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                />

                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-between text-xs">
                  <span>Estimated Total Invoiced:</span>
                  <span className="font-bold text-sm">
                    {formatNaira((parseFloat(actionQuantity) || 0) * actionItem.item.unitCost)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-kumo-line">
              <Button
                variant="outline"
                type="button"
                onClick={() => setActionItem(null)}
              >
                Close
              </Button>
              <Button
                variant={actionItem.action === 'Reorder' ? 'destructive' : 'primary'}
                type="submit"
              >
                Confirm {actionItem.action}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  )
}
export default AccountHomePage
