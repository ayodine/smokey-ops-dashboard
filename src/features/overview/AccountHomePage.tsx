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
  HelpCircle,
  Sparkles,
  RefreshCw,
  XCircle,
  Archive,
  Ban,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Data structure for the Mockup SKUs / Items
interface SkuItem {
  id: string
  name: string
  sku: string
  batch: string
  category: string
  currentStock: number
  maxStock: number
  unit: string
  expiryDate: string
  expiryText: string
  daysToExpiry: number
  status: 'critical' | 'low' | 'out_of_stock' | 'expiring' | 'healthy'
  priority: 'urgent' | 'high' | 'normal'
  isExpiringSoon?: boolean
  isLowStock?: boolean
}

const INITIAL_SKUS: SkuItem[] = [
  {
    id: 'sku-1',
    name: 'Metformin 500mg',
    sku: 'MET-500-T',
    batch: 'Batch M2041-A',
    category: 'Antidiabetic',
    currentStock: 12,
    maxStock: 240,
    unit: 'tabs',
    expiryDate: 'Jul 2026',
    expiryText: 'in 62 days',
    daysToExpiry: 62,
    status: 'critical',
    priority: 'urgent',
    isExpiringSoon: true,
    isLowStock: true
  },
  {
    id: 'sku-2',
    name: 'Atorvastatin 20mg',
    sku: 'ATO-020-T',
    batch: 'Batch A1108-C',
    category: 'Statin',
    currentStock: 18,
    maxStock: 120,
    unit: 'tabs',
    expiryDate: 'Apr 2027',
    expiryText: 'in 330 days',
    daysToExpiry: 330,
    status: 'low',
    priority: 'high',
    isLowStock: true
  },
  {
    id: 'sku-3',
    name: 'Amoxicillin 250mg',
    sku: 'AMO-250-C',
    batch: 'Batch AX2207-D',
    category: 'Antibiotic',
    currentStock: 0,
    maxStock: 90,
    unit: 'caps',
    expiryDate: '—',
    expiryText: '—',
    daysToExpiry: 999,
    status: 'out_of_stock',
    priority: 'urgent',
    isLowStock: true
  },
  {
    id: 'sku-4',
    name: 'Warfarin 5mg',
    sku: 'WAR-005-T',
    batch: 'Batch W4011-B',
    category: 'Anticoagulant',
    currentStock: 42,
    maxStock: 120,
    unit: 'tabs',
    expiryDate: 'May 2026',
    expiryText: 'in 6 days',
    daysToExpiry: 6,
    status: 'expiring',
    priority: 'urgent',
    isExpiringSoon: true
  },
  {
    id: 'sku-5',
    name: 'Insulin Glargine',
    sku: 'INS-GLA-V',
    batch: 'Batch I9923-A',
    category: 'Hormone',
    currentStock: 24,
    maxStock: 60,
    unit: 'vials',
    expiryDate: 'Jun 2026',
    expiryText: 'in 35 days',
    daysToExpiry: 35,
    status: 'low',
    priority: 'high',
    isExpiringSoon: true,
    isLowStock: true
  },
  {
    id: 'sku-6',
    name: 'Lisinopril 10mg',
    sku: 'LIS-010-T',
    batch: 'Batch L8845-B',
    category: 'ACE inhibitor',
    currentStock: 215,
    maxStock: 300,
    unit: 'tabs',
    expiryDate: 'Mar 2027',
    expiryText: 'in 300 days',
    daysToExpiry: 300,
    status: 'healthy',
    priority: 'normal'
  },
  {
    id: 'sku-7',
    name: 'Sertraline 50mg',
    sku: 'SER-050-T',
    batch: 'Batch S2142-D',
    category: 'Antidepressant',
    currentStock: 184,
    maxStock: 240,
    unit: 'tabs',
    expiryDate: 'Feb 2027',
    expiryText: 'in 280 days',
    daysToExpiry: 280,
    status: 'healthy',
    priority: 'normal'
  },
  {
    id: 'sku-8',
    name: 'Albuterol 90mcg',
    sku: 'ALB-090-I',
    batch: 'Batch AL5562-A',
    category: 'Bronchodilator',
    currentStock: 31,
    maxStock: 60,
    unit: 'inhalers',
    expiryDate: 'May 2026',
    expiryText: 'in 14 days',
    daysToExpiry: 14,
    status: 'expiring',
    priority: 'urgent',
    isExpiringSoon: true
  },
  {
    id: 'sku-9',
    name: 'Levothyroxine 50mcg',
    sku: 'LEV-050-T',
    batch: 'Batch LV1188-B',
    category: 'Hormone',
    currentStock: 198,
    maxStock: 300,
    unit: 'tabs',
    expiryDate: 'Nov 2026',
    expiryText: 'in 185 days',
    daysToExpiry: 185,
    status: 'healthy',
    priority: 'normal'
  },
  {
    id: 'sku-10',
    name: 'Donepezil 5mg',
    sku: 'DON-005-T',
    batch: 'Batch D0204-A',
    category: 'Cognitive',
    currentStock: 8,
    maxStock: 60,
    unit: 'tabs',
    expiryDate: 'Sep 2026',
    expiryText: 'in 120 days',
    daysToExpiry: 120,
    status: 'critical',
    priority: 'urgent',
    isLowStock: true
  },
  {
    id: 'sku-11',
    name: 'Pravastatin 40mg',
    sku: 'PRA-040-T',
    batch: 'Batch P7021-C',
    category: 'Statin',
    currentStock: 96,
    maxStock: 120,
    unit: 'tabs',
    expiryDate: 'Jan 2027',
    expiryText: 'in 240 days',
    daysToExpiry: 240,
    status: 'healthy',
    priority: 'normal'
  }
]

export const AccountHomePage: React.FC = () => {
  const navigate = useNavigate()
  const {
    rawProducts,
    packagingProducts,
    productionBatches,
    logisticsDeliveries,
    riders
  } = useSmokeyOps()

  // Tab mode: Default to the exact Mockup SKU & Pharmacy View, with optional Smokey Ops toggle
  const [activeView, setActiveView] = useState<'pharmacy' | 'ops'>('pharmacy')

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  // SKUs state
  const [skus, setSkus] = useState<SkuItem[]>(INITIAL_SKUS)

  // Action Modals State
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false)
  const [actionItem, setActionItem] = useState<{ item: SkuItem; action: string } | null>(null)
  const [actionQuantity, setActionQuantity] = useState('50')
  const [actionNotes, setActionNotes] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // New stock form
  const [newStockForm, setNewStockForm] = useState({
    name: '',
    sku: '',
    batch: '',
    category: 'Antidiabetic',
    stock: '100',
    maxStock: '200',
    unit: 'tabs',
    expiryDate: 'Dec 2026'
  })

  // Filtered SKUs
  const filteredSkus = useMemo(() => {
    return skus.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batch.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter

      const matchesPriority =
        priorityFilter === 'all' || item.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [skus, searchQuery, statusFilter, priorityFilter])

  // Low stock and Expiring items for the right widgets
  const expiringSoonList = useMemo(() => {
    return [
      {
        days: 6,
        badgeBg: 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900',
        name: 'Warfarin 5mg',
        sub: 'WAR-005-T · exp May 11, 2026'
      },
      {
        days: 14,
        badgeBg: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
        name: 'Albuterol 90mcg',
        sub: 'ALB-090-I · exp May 19, 2026'
      },
      {
        days: 35,
        badgeBg: 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-900',
        name: 'Insulin Glargine',
        sub: 'INS-GLA-V · exp Jun 09, 2026'
      },
      {
        days: 62,
        badgeBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
        name: 'Metformin 500mg',
        sub: 'MET-500-T · exp Jul 06, 2026'
      }
    ]
  }, [])

  const lowStockAlertsList = useMemo(() => {
    return [
      {
        name: 'Metformin 500mg',
        sku: 'MET-500-T',
        stockText: '12 / 240 (5%)',
        percentage: 5,
        barColor: 'bg-[#c0201f]',
        btnVariant: 'danger' as const
      },
      {
        name: 'Donepezil 5mg',
        sku: 'DON-005-T',
        stockText: '8 / 60 (13%)',
        percentage: 13,
        barColor: 'bg-[#c0201f]',
        btnVariant: 'danger' as const
      },
      {
        name: 'Atorvastatin 20mg',
        sku: 'ATO-020-T',
        stockText: '18 / 120 (15%)',
        percentage: 15,
        barColor: 'bg-amber-500',
        btnVariant: 'dark' as const
      }
    ]
  }, [])

  // Action handlers
  const handleOpenAction = (item: SkuItem, action: string) => {
    setActionItem({ item, action })
    setActionQuantity(action === 'Reorder' || action === 'Restock' ? '100' : '0')
    setActionNotes('')
  }

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault()
    if (!actionItem) return

    const qty = parseInt(actionQuantity, 10) || 0
    if (qty > 0) {
      setSkus(prev =>
        prev.map(i => {
          if (i.id === actionItem.item.id) {
            const nextStock = Math.min(i.maxStock, i.currentStock + qty)
            return {
              ...i,
              currentStock: nextStock,
              status: nextStock > i.maxStock * 0.3 ? 'healthy' : i.status
            }
          }
          return i
        })
      )
    }

    setToastMessage(`Successfully processed ${actionItem.action} for ${actionItem.item.name}`)
    setTimeout(() => setToastMessage(null), 3500)
    setActionItem(null)
  }

  const handleAddStockSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStockForm.name.trim()) return

    const newItem: SkuItem = {
      id: `sku-${Date.now()}`,
      name: newStockForm.name.trim(),
      sku: newStockForm.sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      batch: newStockForm.batch.trim() || `Batch B-${Date.now().toString().slice(-3)}`,
      category: newStockForm.category,
      currentStock: parseInt(newStockForm.stock, 10) || 50,
      maxStock: parseInt(newStockForm.maxStock, 10) || 100,
      unit: newStockForm.unit || 'units',
      expiryDate: newStockForm.expiryDate || 'Dec 2026',
      expiryText: 'in 220 days',
      daysToExpiry: 220,
      status: 'healthy',
      priority: 'normal'
    }

    setSkus(prev => [newItem, ...prev])
    setIsAddStockModalOpen(false)
    setToastMessage(`Added new stock item: ${newItem.name}`)
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

      {/* Top Operational Bar: Brand & Shift Info (Matches Mockup Top Header) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 py-1">
        {/* Left: RxFlow / Pharmacy or Smokey Ops brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 dark:bg-emerald-700 flex items-center justify-center text-white shadow-xs">
              <span className="font-bold text-sm leading-none">+</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-kumo-strong">
              <span>RxFlow</span>
              <span className="text-kumo-subtle font-normal">/</span>
              <span className="text-kumo-subtle font-normal">Pharmacy</span>
            </div>
          </div>

          {/* Quick toggle pill */}
          <div className="hidden md:flex items-center bg-kumo-tint p-0.5 rounded-lg border border-kumo-line text-[11px]">
            <button
              type="button"
              onClick={() => setActiveView('pharmacy')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer',
                activeView === 'pharmacy'
                  ? 'bg-kumo-base text-kumo-strong shadow-2xs'
                  : 'text-kumo-subtle hover:text-kumo-strong'
              )}
            >
              Pharmacy Inventory View
            </button>
            <button
              type="button"
              onClick={() => setActiveView('ops')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer',
                activeView === 'ops'
                  ? 'bg-kumo-base text-kumo-strong shadow-2xs'
                  : 'text-kumo-subtle hover:text-kumo-strong'
              )}
            >
              Smokey Kitchen & Fleet Pulse
            </button>
          </div>
        </div>

        {/* Right: Shift Pill, Bell, Share, User Profile */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Shift Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/70 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800/60 dark:text-emerald-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Morning Shift · 06:00–14:00</span>
          </div>

          {/* Icon Button: Bell */}
          <button
            type="button"
            className="size-8 rounded-lg border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-strong flex items-center justify-center transition-colors cursor-pointer"
            title="Operational Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>

          {/* Icon Button: Share / Copy */}
          <button
            type="button"
            className="size-8 rounded-lg border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-strong flex items-center justify-center transition-colors cursor-pointer"
            title="Share Dashboard"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* User Profile Mini Card */}
          <Link
            to="/auth"
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-kumo-line bg-kumo-base hover:bg-kumo-tint transition-colors cursor-pointer"
            title="Aria Devani · Senior Pharmacist - RPh (Click to view Auth Screen)"
          >
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1594824813589-4a9f390d4023?auto=format&fit=crop&w=80&q=80"
                alt="Aria Devani"
                className="w-6 h-6 rounded-full object-cover border border-kumo-line"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-black" />
            </div>
            <span className="hidden xl:inline text-xs font-semibold text-kumo-strong pr-1">
              Aria Devani
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
            1,247 SKUs · 8 below reorder · 12 expiring within 30 days
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      {/* 4 Metric KPI Cards (Exact replica of Mockup) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: TOTAL PRESCRIPTIONS */}
        <div className="p-4 rounded-xl border border-kumo-line bg-kumo-base shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-kumo-subtle uppercase">
              Total Prescriptions
            </span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">
              R
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-kumo-strong">
              1,247
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              +18 new this week
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
              8
            </span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              +2 below reorder point
            </span>
          </div>
        </div>

        {/* Metric 3: EXPIRING 30D */}
        <div className="p-4 rounded-xl border border-kumo-line bg-kumo-base shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-kumo-subtle uppercase">
              Expiring 30D
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-kumo-strong">
              12
            </span>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              3 urgent within 7 days
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
              3
            </span>
            <span className="text-xs font-medium text-kumo-subtle">
              -1 vs yesterday
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
                11 alerts
              </span>
            </div>

            {/* Controls: Search input, Status filter, Priority filter, Maximize */}
            <div className="flex items-center flex-wrap gap-2 text-xs">
              {/* Search Bar */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-kumo-subtle pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search drug, SKU, batch..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full h-8 pl-8 pr-3 rounded-lg border border-kumo-line bg-kumo-canvas text-xs text-kumo-strong placeholder:text-kumo-subtle focus:outline-none focus:ring-1 focus:ring-kumo-link"
                />
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
                className="size-8 rounded-lg border border-kumo-line bg-kumo-canvas hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-strong flex items-center justify-center transition-colors cursor-pointer"
                title="Expand View"
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
                  <th className="py-2.5 px-4 font-semibold">DRUG</th>
                  <th className="py-2.5 px-4 font-semibold">CATEGORY</th>
                  <th className="py-2.5 px-4 font-semibold">STOCK</th>
                  <th className="py-2.5 px-4 font-semibold">NEXT EXPIRY</th>
                  <th className="py-2.5 px-4 font-semibold">STATUS</th>
                  <th className="py-2.5 px-4 font-semibold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kumo-line/60">
                {filteredSkus.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-kumo-subtle">
                      No stock items match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSkus.map((item) => {
                    const percent = Math.round((item.currentStock / item.maxStock) * 100)
                    
                    // Determine stock progress bar color
                    let barColor = 'bg-emerald-500'
                    if (item.status === 'critical' || percent <= 10) {
                      barColor = 'bg-[#c0201f]'
                    } else if (item.status === 'low' || percent <= 25) {
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
                        {/* Drug & SKU/Batch */}
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
                            {item.sku} · {item.batch}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 text-kumo-subtle">
                          {item.category}
                        </td>

                        {/* Stock with Mini Progress Bar */}
                        <td className="py-3 px-4 min-w-[130px]">
                          <div className="font-medium text-kumo-strong flex items-center gap-1">
                            <span>{item.currentStock}</span>
                            <span className="text-kumo-subtle text-[11px]">/ {item.maxStock} {item.unit}</span>
                          </div>
                          <div className="w-24 h-1.5 rounded-full bg-kumo-line mt-1.5 overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all duration-300', barColor)}
                              style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                            />
                          </div>
                        </td>

                        {/* Next Expiry */}
                        <td className="py-3 px-4">
                          <div className="text-kumo-strong font-medium">
                            {item.expiryDate}
                          </div>
                          <div className={cn(
                            'text-[11px] mt-0.5',
                            item.daysToExpiry <= 7 ? 'text-rose-600 font-semibold dark:text-rose-400' :
                            item.daysToExpiry <= 30 ? 'text-amber-600 font-medium dark:text-amber-400' :
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

                        {/* Action Buttons (Matches Mockup button colors) */}
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
              Showing {filteredSkus.length} of 1,247 SKUs
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
          {/* Widget 1: Expiring Soon */}
          <div className="rounded-xl border border-kumo-line bg-kumo-base p-4 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-kumo-line">
              <h3 className="text-sm font-bold text-kumo-strong">
                Expiring Soon
              </h3>
              <span className="text-[11px] text-kumo-subtle font-medium">
                12 within 30 days
              </span>
            </div>

            <div className="space-y-3">
              {expiringSoonList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs">
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
              ))}
            </div>

            <div className="pt-2 border-t border-kumo-line/60">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('expiring')
                  setToastMessage('Filtered table to show all expiring SKUs')
                }}
                className="w-full text-center text-xs font-semibold text-kumo-subtle hover:text-kumo-strong py-1 flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>View all 12 expiring</span>
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
                8 below reorder
              </span>
            </div>

            <div className="space-y-3.5">
              {lowStockAlertsList.map((item, idx) => (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-kumo-strong">{item.name}</div>
                      <div className="text-[11px] text-kumo-subtle">{item.sku}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAction({
                        id: `low-${idx}`,
                        name: item.name,
                        sku: item.sku,
                        batch: 'Immediate',
                        category: 'Low Buffer',
                        currentStock: 10,
                        maxStock: 100,
                        unit: 'units',
                        expiryDate: '2026',
                        expiryText: 'Valid',
                        daysToExpiry: 180,
                        status: 'critical',
                        priority: 'urgent'
                      }, 'Reorder')}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer shadow-2xs',
                        item.btnVariant === 'danger'
                          ? 'bg-[#c0201f] text-white hover:bg-[#a01817]'
                          : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                      )}
                    >
                      Reorder
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-kumo-subtle font-medium">
                    <span>{item.stockText}</span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-kumo-line overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-300', item.barColor)}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-kumo-line/60">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('low')
                  setToastMessage('Filtered table to show all low stock items')
                }}
                className="w-full text-center text-xs font-semibold text-kumo-subtle hover:text-kumo-strong py-1 flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>View all 8 low stock</span>
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
        description="Register a new SKU, medication, or operational raw material in this facility."
      >
        <form onSubmit={handleAddStockSubmit} className="space-y-4 text-xs font-sans">
          <Input
            label="Item / Drug Name"
            placeholder="e.g. Amoxicillin Clavulanate 625mg"
            value={newStockForm.name}
            onChange={(e) => setNewStockForm(prev => ({ ...prev, name: e.target.value }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="SKU Code"
              placeholder="e.g. AMX-625-T"
              value={newStockForm.sku}
              onChange={(e) => setNewStockForm(prev => ({ ...prev, sku: e.target.value }))}
              required
            />
            <Input
              label="Batch / Lot Number"
              placeholder="e.g. Batch B8821"
              value={newStockForm.batch}
              onChange={(e) => setNewStockForm(prev => ({ ...prev, batch: e.target.value }))}
              required
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
                <option value="Antidiabetic">Antidiabetic</option>
                <option value="Statin">Statin</option>
                <option value="Antibiotic">Antibiotic</option>
                <option value="Anticoagulant">Anticoagulant</option>
                <option value="Hormone">Hormone</option>
                <option value="ACE inhibitor">ACE inhibitor</option>
                <option value="Bronchodilator">Bronchodilator</option>
                <option value="Raw Protein">Raw Protein (Smokey)</option>
                <option value="Wood & Fuel">Wood & Fuel (Smokey)</option>
              </select>
            </div>

            <Input
              label="Unit Type"
              placeholder="tabs, caps, vials, kg"
              value={newStockForm.unit}
              onChange={(e) => setNewStockForm(prev => ({ ...prev, unit: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Initial Quantity"
              type="number"
              placeholder="100"
              value={newStockForm.stock}
              onChange={(e) => setNewStockForm(prev => ({ ...prev, stock: e.target.value }))}
              required
            />
            <Input
              label="Max Stock Capacity"
              type="number"
              placeholder="250"
              value={newStockForm.maxStock}
              onChange={(e) => setNewStockForm(prev => ({ ...prev, maxStock: e.target.value }))}
              required
            />
          </div>

          <Input
            label="Expiry Date"
            placeholder="e.g. Nov 2026"
            value={newStockForm.expiryDate}
            onChange={(e) => setNewStockForm(prev => ({ ...prev, expiryDate: e.target.value }))}
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-kumo-line">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsAddStockModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save & Register Stock
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
          description={`Execute inventory action for ${actionItem.item.sku} (${actionItem.item.batch}).`}
        >
          <form onSubmit={handleConfirmAction} className="space-y-4 text-xs font-sans">
            <div className="p-3 rounded-lg bg-kumo-canvas border border-kumo-line space-y-1">
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Current Stock:</span>
                <span className="font-semibold text-kumo-strong">{actionItem.item.currentStock} / {actionItem.item.maxStock} {actionItem.item.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Expiry Status:</span>
                <span className="font-semibold text-kumo-strong">{actionItem.item.expiryDate} ({actionItem.item.expiryText})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Category:</span>
                <span className="font-semibold text-kumo-strong">{actionItem.item.category}</span>
              </div>
            </div>

            {actionItem.action === 'Inspect' ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-kumo-strong">
                  Inspection Notes & Quality Clearance
                </label>
                <textarea
                  rows={3}
                  placeholder="Record batch condition, storage temperature, packaging seal..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong focus:outline-none"
                  required
                />
              </div>
            ) : actionItem.action === 'View' ? (
              <div className="space-y-2 text-kumo-subtle">
                <p>This item is currently healthy and within standard operational parameters.</p>
                <p>Last checked: Today by Aria Devani (Senior Pharmacist · RPh).</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  label={`Order Quantity (${actionItem.item.unit})`}
                  type="number"
                  placeholder="e.g. 100"
                  value={actionQuantity}
                  onChange={(e) => setActionQuantity(e.target.value)}
                  required
                />
                <Input
                  label="Supplier / Purchase Order Ref"
                  placeholder="e.g. PO-2026-MED-092"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                />
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
