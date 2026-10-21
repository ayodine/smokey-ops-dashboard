import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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

type SortField = 'name' | 'category' | 'currentStock' | 'daysToExpiry' | 'status'
type SortOrder = 'asc' | 'desc'

const categoryFilterOptions = [
  { value: 'all', label: 'All categories' },
  { value: 'Raw Proteins', label: 'Raw Proteins' },
  { value: 'Spices & Seasoning', label: 'Spices & Seasoning' },
  { value: 'Fuel & Charcoal', label: 'Fuel & Charcoal' },
  { value: 'Cooking Oils', label: 'Cooking Oils' },
  { value: 'Packaging Materials', label: 'Packaging' },
  { value: 'Finished Goods', label: 'Finished Goods' },
]

const statusFilterOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'critical', label: 'Critical' },
  { value: 'low', label: 'Running low' },
  { value: 'out_of_stock', label: 'Out of stock' },
  { value: 'expiring', label: 'Expiring soon' },
  { value: 'healthy', label: 'Healthy' },
]

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
  } = useSmokeyOps()

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  // Custom dropdown open states (In-line custom popovers matching project design system)
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)

  // Sorting state (Inherited from project table standard)
  const [sortField, setSortField] = useState<SortField>('currentStock')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Pagination: Strictly 10 rows per table as requested
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

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
      const matchingLot = inventoryLots.find(lot => lot.product_id === raw.id || lot.sku === raw.sku)
      
      let days = 999
      let expText = '—'
      let expDateFormatted = 'Non-perishable'

      if (raw.is_perishable || raw.expiry_date || matchingLot) {
        const expStr = matchingLot?.expiry_date || raw.expiry_date || '2026-10-05'
        days = matchingLot?.days_to_expiry ?? 14
        expDateFormatted = formatDate(expStr)
        expText = days <= 0 ? 'Expires today' : `in ${days} days`
      }

      // Determine Category in plain English
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

      const maxStock = Math.max(raw.stock_qty, raw.reorder_level * 2.5, 50)

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
        batchLot: matchingLot?.lot_number ? `Batch ${matchingLot.lot_number.replace('LOT-', '')}` : `Batch ${raw.sku.slice(-4)}`,
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
        batchLot: `Batch ${pack.sku.slice(-3)}`,
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
        batchLot: `Batch ${sales.sku.slice(4, 9)}`,
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
        supplierName: 'Smokey Kitchen'
      })
    })

    return items
  }, [rawProducts, packagingProducts, salesProducts, inventoryLots])

  // 2. Dynamic KPI metrics in plain English
  const totalItemCount = allInventoryItems.length
  const lowStockCount = allInventoryItems.filter(i => i.status === 'low' || i.status === 'critical').length
  const outOfStockCount = allInventoryItems.filter(i => i.status === 'out_of_stock').length
  const expiringCount = allInventoryItems.filter(i => i.status === 'expiring' || (i.isPerishable && i.daysToExpiry <= 14)).length
  const totalValuation = useMemo(() => {
    const rawVal = rawProducts.reduce((s, p) => s + (p.stock_qty * p.unit_cost), 0)
    const packVal = packagingProducts.reduce((s, p) => s + (p.stock_qty * p.unit_cost), 0)
    const salesVal = salesProducts.reduce((s, p) => s + (p.stock_qty * p.unit_cost), 0)
    return rawVal + packVal + salesVal
  }, [rawProducts, packagingProducts, salesProducts])

  // 3. Filtered & Sorted Items
  const filteredAndSortedItems = useMemo(() => {
    const filtered = allInventoryItems.filter(item => {
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

    // Sort items
    return filtered.sort((a, b) => {
      let comparison = 0
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category)
      } else if (sortField === 'currentStock') {
        comparison = a.currentStock - b.currentStock
      } else if (sortField === 'daysToExpiry') {
        comparison = a.daysToExpiry - b.daysToExpiry
      } else if (sortField === 'status') {
        const statusOrder = { critical: 1, out_of_stock: 2, expiring: 3, low: 4, healthy: 5 }
        comparison = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99)
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [allInventoryItems, searchQuery, statusFilter, categoryFilter, priorityFilter, sortField, sortOrder])

  // Pagination calculations (max 10 rows per table)
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedItems.length / pageSize))
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredAndSortedItems.slice(startIndex, startIndex + pageSize)
  }, [filteredAndSortedItems, currentPage, pageSize])

  // Sorting toggle handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  // 4. Expiring Soon list (Perishable lots mapped in plain English)
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
        sub: `${item.sku} · expires ${item.expiryDate}`
      }
    })
  }, [allInventoryItems])

  // 5. Low Stock Alerts list (Items running low)
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
        barColor: isCritical ? 'bg-[#c0201f]' : 'bg-amber-500'
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
          notes: `${actionItem.action} via Home overview. Order ref: ${actionPoRef}. ${actionNotes}`
        })
      } else if (actionItem.item.itemType === 'packaging') {
        receivePackaging({
          productId: actionItem.item.originalId,
          quantity: qty,
          unitCost: actionItem.item.unitCost
        })
      }
    }

    setToastMessage(`Confirmed order for ${actionItem.item.name} (${qty} ${actionItem.item.unit})`)
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
    setToastMessage(`Added ${newStockForm.name} to inventory`)
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

      {/* Page Title & Action Bar (Using Design System PageHeader) */}
      <PageHeader
        title="Home overview"
        subtitle={`${totalItemCount} stock items · ${lowStockCount} running low · ${expiringCount} expiring within 30 days`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/inventory/raw')}
              leftIcon={<Boxes className="w-4 h-4 text-primary" />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
            >
              Inventory management
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddStockModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
            >
              Add stock
            </Button>
          </>
        }
      />

      {/* 4 Metric KPI Cards in Plain English */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: TOTAL STOCK VALUE */}
        <div className="p-4 rounded-xl border border-kumo-line bg-kumo-base shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-kumo-subtle uppercase">
              Total stock value
            </span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">
              ₦
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-[-0.012em] text-kumo-strong font-display">
              {formatNaira(totalValuation)}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {totalItemCount} items
            </span>
          </div>
        </div>

        {/* Metric 2: RUNNING LOW */}
        <div className="p-4 rounded-xl border border-kumo-line bg-kumo-base shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-kumo-subtle uppercase">
              Running low
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-[-0.012em] text-kumo-strong font-display">
              {lowStockCount}
            </span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              needs reorder
            </span>
          </div>
        </div>

        {/* Metric 3: EXPIRING SOON */}
        <div className="p-4 rounded-xl border border-kumo-line bg-kumo-base shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-kumo-subtle uppercase">
              Expiring soon
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-[-0.012em] text-kumo-strong font-display">
              {expiringCount}
            </span>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              urgent within 7 days
            </span>
          </div>
        </div>

        {/* Metric 4: OUT OF STOCK */}
        <div className="p-4 rounded-xl border border-kumo-line bg-kumo-base shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-kumo-subtle uppercase">
              Out of stock
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-[-0.012em] text-kumo-strong font-display">
              {outOfStockCount}
            </span>
            <span className="text-xs font-medium text-kumo-subtle">
              needs supplier order
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
            {/* Title & Alerts Badge in Plain English */}
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-kumo-strong">
                Stock items
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900">
                {lowStockCount + outOfStockCount} need attention
              </span>
            </div>

            {/* Controls: Search input, Category filter, Status filter, Reset */}
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

              {/* Custom Category Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryDropdownOpen(prev => !prev)
                    setIsStatusDropdownOpen(false)
                  }}
                  className={cn(
                    "h-8 px-2.5 rounded-lg border border-kumo-line bg-kumo-canvas text-xs text-kumo-default hover:text-kumo-strong hover:bg-kumo-tint flex items-center gap-1.5 transition-colors cursor-pointer select-none shadow-2xs",
                    categoryFilter !== 'all' && "border-kumo-strong text-kumo-strong font-medium bg-kumo-tint"
                  )}
                >
                  <span className="truncate max-w-[115px]">
                    {categoryFilterOptions.find(c => c.value === categoryFilter)?.label || 'All categories'}
                  </span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-kumo-subtle transition-transform duration-200", isCategoryDropdownOpen && "rotate-180 text-kumo-strong")} />
                </button>

                {isCategoryDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30 cursor-default"
                      onClick={() => setIsCategoryDropdownOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-1.5 w-48 bg-kumo-base border border-kumo-line shadow-xl rounded-lg z-40 py-1 animate-in fade-in zoom-in-95 font-sans">
                      <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-kumo-subtle border-b border-kumo-line/60">
                        Category filter
                      </div>
                      <div className="py-0.5 max-h-56 overflow-y-auto">
                        {categoryFilterOptions.map(opt => {
                          const isSelected = categoryFilter === opt.value
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setCategoryFilter(opt.value)
                                setCurrentPage(1)
                                setIsCategoryDropdownOpen(false)
                              }}
                              className={cn(
                                "w-full px-3 py-1.5 text-left text-xs hover:bg-kumo-tint flex items-center justify-between cursor-pointer transition-colors",
                                isSelected
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : "text-kumo-default hover:text-kumo-strong"
                              )}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Custom Status Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsStatusDropdownOpen(prev => !prev)
                    setIsCategoryDropdownOpen(false)
                  }}
                  className={cn(
                    "h-8 px-2.5 rounded-lg border border-kumo-line bg-kumo-canvas text-xs text-kumo-default hover:text-kumo-strong hover:bg-kumo-tint flex items-center gap-1.5 transition-colors cursor-pointer select-none shadow-2xs",
                    statusFilter !== 'all' && "border-kumo-strong text-kumo-strong font-medium bg-kumo-tint"
                  )}
                >
                  <span className="truncate max-w-[115px]">
                    {statusFilterOptions.find(s => s.value === statusFilter)?.label || 'All statuses'}
                  </span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-kumo-subtle transition-transform duration-200", isStatusDropdownOpen && "rotate-180 text-kumo-strong")} />
                </button>

                {isStatusDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30 cursor-default"
                      onClick={() => setIsStatusDropdownOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-1.5 w-44 bg-kumo-base border border-kumo-line shadow-xl rounded-lg z-40 py-1 animate-in fade-in zoom-in-95 font-sans">
                      <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-kumo-subtle border-b border-kumo-line/60">
                        Status filter
                      </div>
                      <div className="py-0.5">
                        {statusFilterOptions.map(opt => {
                          const isSelected = statusFilter === opt.value
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setStatusFilter(opt.value)
                                setCurrentPage(1)
                                setIsStatusDropdownOpen(false)
                              }}
                              className={cn(
                                "w-full px-3 py-1.5 text-left text-xs hover:bg-kumo-tint flex items-center justify-between cursor-pointer transition-colors",
                                isSelected
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : "text-kumo-default hover:text-kumo-strong"
                              )}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Reset Filter Button */}
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setCategoryFilter('all')
                  setPriorityFilter('all')
                  setSortField('currentStock')
                  setSortOrder('asc')
                  setCurrentPage(1)
                  setIsCategoryDropdownOpen(false)
                  setIsStatusDropdownOpen(false)
                  setToastMessage('Filters reset to default')
                }}
                className="size-8 rounded-lg border border-kumo-line bg-kumo-canvas hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-strong flex items-center justify-center transition-colors cursor-pointer"
                title="Reset Filters"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Table Container (Inherited from other pages with interactive Column Sorting) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-kumo-line bg-kumo-canvas/60 text-[11px] font-semibold text-kumo-subtle uppercase tracking-wider select-none">
                  {/* Item Name Column Header */}
                  <th
                    onClick={() => handleSort('name')}
                    className="py-2.5 px-4 font-semibold cursor-pointer hover:text-kumo-strong transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Item name</span>
                      {sortField === 'name' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </div>
                  </th>

                  {/* Category Column Header */}
                  <th
                    onClick={() => handleSort('category')}
                    className="py-2.5 px-4 font-semibold cursor-pointer hover:text-kumo-strong transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Category</span>
                      {sortField === 'category' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </div>
                  </th>

                  {/* Stock Column Header */}
                  <th
                    onClick={() => handleSort('currentStock')}
                    className="py-2.5 px-4 font-semibold cursor-pointer hover:text-kumo-strong transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>In stock</span>
                      {sortField === 'currentStock' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </div>
                  </th>

                  {/* Expiration Column Header */}
                  <th
                    onClick={() => handleSort('daysToExpiry')}
                    className="py-2.5 px-4 font-semibold cursor-pointer hover:text-kumo-strong transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Expires</span>
                      {sortField === 'daysToExpiry' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </div>
                  </th>

                  {/* Status Column Header */}
                  <th
                    onClick={() => handleSort('status')}
                    className="py-2.5 px-4 font-semibold cursor-pointer hover:text-kumo-strong transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {sortField === 'status' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </div>
                  </th>

                  {/* Action Column Header */}
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kumo-line/60">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-kumo-subtle">
                      No stock items match your search.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => {
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
                        {/* Item Name & SKU / Batch */}
                        <td className="py-3 px-4">
                          <div className={cn(
                            'font-semibold text-xs',
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
                        <td className="py-3 px-4 text-kumo-subtle text-xs">
                          {item.category}
                        </td>

                        {/* Stock with Mini Progress Bar */}
                        <td className="py-3 px-4 min-w-[130px]">
                          <div className="font-medium text-kumo-strong flex items-center gap-1 text-xs">
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

                        {/* Expiration date */}
                        <td className="py-3 px-4">
                          <div className="text-kumo-strong font-medium text-xs">
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

                        {/* Status Dot Pill in Plain English */}
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
                              Running low
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
                              Expiring soon
                            </span>
                          )}
                          {item.status === 'healthy' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900">
                              <span className="size-1.5 rounded-full bg-emerald-600" />
                              Healthy
                            </span>
                          )}
                        </td>

                        {/* Action Buttons: Consistent Width (w-[80px]), View Button Style (Outline) for All Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end">
                            {item.status === 'critical' || item.status === 'low' || item.status === 'out_of_stock' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenAction(item, item.status === 'out_of_stock' ? 'Restock' : 'Reorder')}
                                className="w-[80px] h-7 flex items-center justify-center rounded-md text-xs font-medium border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-kumo-strong transition-colors cursor-pointer"
                              >
                                {item.status === 'out_of_stock' ? 'Restock' : 'Reorder'}
                              </button>
                            ) : item.status === 'expiring' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenAction(item, 'Inspect')}
                                className="w-[80px] h-7 flex items-center justify-center rounded-md text-xs font-medium border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-kumo-strong transition-colors cursor-pointer"
                              >
                                Inspect
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenAction(item, 'View')}
                                className="w-[80px] h-7 flex items-center justify-center rounded-md text-xs font-medium border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-kumo-strong transition-colors cursor-pointer"
                              >
                                View
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer: Max 10 Rows per Page Pagination */}
          <div className="p-3 border-t border-kumo-line bg-kumo-canvas/30 flex items-center justify-between text-xs text-kumo-subtle">
            <div>
              Showing {paginatedItems.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredAndSortedItems.length)} of {filteredAndSortedItems.length} items
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-md border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-kumo-default transition-colors cursor-pointer disabled:opacity-40"
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    'w-7 h-7 rounded-md text-xs font-medium flex items-center justify-center transition-colors cursor-pointer',
                    currentPage === pageNum
                      ? 'border border-kumo-line bg-kumo-base text-kumo-strong font-semibold shadow-2xs'
                      : 'border border-transparent hover:border-kumo-line/50 hover:bg-kumo-tint text-kumo-default'
                  )}
                >
                  {pageNum}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-md border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-kumo-default transition-colors cursor-pointer disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols ~ 30%): Expiring Soon & Low Stock Alerts */}
        <div className="lg:col-span-4 space-y-6">
          {/* Widget 1: Expiring Soon */}
          <div className="rounded-xl border border-kumo-line bg-kumo-base p-4 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-kumo-line">
              <h3 className="text-sm font-bold text-kumo-strong">
                Expiring soon
              </h3>
              <span className="text-[11px] text-kumo-subtle font-medium">
                {expiringCount} within 30 days
              </span>
            </div>

            <div className="space-y-3">
              {expiringSoonList.length === 0 ? (
                <p className="text-xs text-kumo-subtle py-2 text-center">No items expiring within 30 days.</p>
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
                  setCurrentPage(1)
                  setToastMessage('Filtered table to show expiring items')
                }}
                className="w-full text-center text-xs font-semibold text-kumo-subtle hover:text-kumo-strong py-1 flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>View all expiring items</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Widget 2: Items running low (Uniform Brand Red Buttons, No Black/Orange) */}
          <div className="rounded-xl border border-kumo-line bg-kumo-base p-4 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-kumo-line">
              <h3 className="text-sm font-bold text-kumo-strong">
                Items running low
              </h3>
              <span className="text-[11px] text-kumo-subtle font-medium">
                {lowStockCount} need reorder
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
                        className="w-[76px] h-6 flex items-center justify-center rounded-md text-xs font-medium border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-kumo-strong transition-colors cursor-pointer shadow-2xs"
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
                  setCurrentPage(1)
                  setToastMessage('Filtered table to show items running low')
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
        title="Add Stock Item to Inventory"
        description="Register a new food ingredient, spice, fuel material, or packaging stock."
      >
        <form onSubmit={handleAddStockSubmit} className="space-y-4 text-xs font-sans">
          <Input
            label="Item description / Material name"
            placeholder="e.g. Fresh Quail / Applewood Smoking Chips"
            value={newStockForm.name}
            onChange={(e) => setNewStockForm(prev => ({ ...prev, name: e.target.value }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Item code (SKU)"
              placeholder="e.g. SKU-00045"
              value={newStockForm.sku}
              onChange={(e) => setNewStockForm(prev => ({ ...prev, sku: e.target.value }))}
              required
            />
            <Input
              label="Batch or delivery number"
              placeholder="e.g. Batch B8821"
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
              label="Unit of measure"
              placeholder="Pieces, kg, bundle, rolls"
              value={newStockForm.unit}
              onChange={(e) => setNewStockForm(prev => ({ ...prev, unit: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Initial quantity in stock"
              type="number"
              placeholder="50"
              value={newStockForm.stock}
              onChange={(e) => setNewStockForm(prev => ({ ...prev, stock: e.target.value }))}
              required
            />
            <Input
              label="Reorder safety alert level"
              type="number"
              placeholder="20"
              value={newStockForm.reorderLevel}
              onChange={(e) => setNewStockForm(prev => ({ ...prev, reorderLevel: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Cost per unit (₦)"
              type="number"
              placeholder="6500"
              value={newStockForm.unitCost}
              onChange={(e) => setNewStockForm(prev => ({ ...prev, unitCost: e.target.value }))}
              required
            />
            <Input
              label="Expiration date (if perishable)"
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
            <Button
              variant="primary"
              type="submit"
              className="bg-[#c0201f] hover:bg-[#a01817] text-white font-semibold"
            >
              Save stock item
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
          description={`Order or inspect inventory for ${actionItem.item.sku} (${actionItem.item.batchLot}).`}
        >
          <form onSubmit={handleConfirmAction} className="space-y-4 text-xs font-sans">
            <div className="p-3 rounded-lg bg-kumo-canvas border border-kumo-line space-y-1">
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Current in stock:</span>
                <span className="font-semibold text-kumo-strong">
                  {formatQuantity(actionItem.item.currentStock)} {actionItem.item.unit.toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Reorder level:</span>
                <span className="font-semibold text-kumo-strong">
                  {formatQuantity(actionItem.item.reorderLevel)} {actionItem.item.unit.toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Expiration status:</span>
                <span className="font-semibold text-kumo-strong">
                  {actionItem.item.expiryDate} ({actionItem.item.expiryText})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Cost per unit:</span>
                <span className="font-semibold text-kumo-strong">{formatNaira(actionItem.item.unitCost)}</span>
              </div>
            </div>

            {actionItem.action === 'Inspect' ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-kumo-strong">
                  Inspection notes & quality clearance
                </label>
                <textarea
                  rows={3}
                  placeholder="Record storage temperature, package condition, meat freshness..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong focus:outline-none"
                  required
                />
              </div>
            ) : actionItem.action === 'View' ? (
              <div className="space-y-2 text-kumo-subtle">
                <p>This inventory item is healthy and within normal operating levels.</p>
                <p>Managed by: Smokey Hut Central Depot.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={`Order quantity (${actionItem.item.unit.toLowerCase()})`}
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
                  label="Purchase order reference or note"
                  value={actionPoRef}
                  onChange={(e) => setActionPoRef(e.target.value)}
                  required
                />

                <Input
                  label="Receiving instructions (optional)"
                  placeholder="e.g. Verify scale weight on arrival at receiving dock"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                />

                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-between text-xs">
                  <span>Estimated total cost:</span>
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
                variant="primary"
                type="submit"
                className="bg-[#c0201f] hover:bg-[#a01817] text-white font-semibold"
              >
                Confirm {actionItem.action.toLowerCase()}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  )
}
export default AccountHomePage
