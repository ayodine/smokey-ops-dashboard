import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { MetricCard } from '@/components/ui/MetricCard'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { StatusBadge, BadgeStatus } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { formatNaira, formatDate, cn } from '@/lib/utils'
import {
  ShoppingBag,
  DollarSign,
  Truck,
  CheckCircle2,
  Clock,
  Eye,
  ArrowRight,
  ExternalLink,
  Plus,
  RefreshCw,
  Phone,
  MapPin,
  FileText,
  Search,
  X,
  Loader2,
  Calendar,
  Sparkles,
  ChevronRight
} from 'lucide-react'

export interface WebsiteOrder {
  id: string | number
  order_ref: string
  customer_name: string
  phone: string
  address: string
  items_summary: string
  total_amount: number
  delivery_fee: number
  channel: string
  payment_status: 'paid' | 'pending' | 'refunded'
  fulfillment_status: 'in_intake' | 'cooking' | 'packaging' | 'in_transit' | 'delivered'
  scheduled_delivery_at: string
  rider_name: string
  notes: string
}

// Helper to highlight matching characters in auto-complete suggestions
export const highlightSearchMatch = (text: string, query: string) => {
  if (!query || !query.trim() || !text) return text
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <span
            key={i}
            className="bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold px-0.5 rounded"
          >
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  )
}

// Convert raw Supabase orders + order_items records into typed WebsiteOrder objects
export const mapSupabaseOrderToWebsiteOrder = (raw: any): WebsiteOrder => {
  const status = String(raw.delivery_status || raw.status || '').toLowerCase()
  let fulfillment_status: WebsiteOrder['fulfillment_status'] = 'in_intake'
  if (status.includes('deliver')) fulfillment_status = 'delivered'
  else if (status.includes('transit') || status.includes('dispatch') || status.includes('shipped') || status.includes('out_for_delivery')) fulfillment_status = 'in_transit'
  else if (status.includes('cook') || status.includes('prep') || status.includes('process')) fulfillment_status = 'cooking'
  else if (status.includes('pack')) fulfillment_status = 'packaging'
  else fulfillment_status = 'in_intake'

  const items = Array.isArray(raw.order_items) && raw.order_items.length > 0
    ? raw.order_items.map((i: any) => `${i.qty || 1}x ${i.name || 'Smokey Dish'}`).join(' + ')
    : 'Assorted Smokey Delicacies'

  let channel = 'Website Storefront'
  if (raw.traffic_source) {
    channel = raw.traffic_source
  } else if (raw.notes && raw.notes.includes('[via WhatsApp Menu]')) {
    channel = 'WhatsApp Store'
  } else if (raw.notes && raw.notes.includes('[via Walk-in POS]')) {
    channel = 'Walk-in POS'
  } else if (raw.channel === 'storefront') {
    channel = 'Website Storefront'
  }

  const isPaid = Boolean(raw.paid_at) || raw.status === 'processing' || raw.status === 'delivered' || raw.status === 'paid'

  return {
    id: raw.id,
    order_ref: String(raw.id || ''),
    customer_name: raw.customer_name || 'Storefront Customer',
    phone: raw.customer_phone || 'N/A',
    address: raw.delivery_address || 'Storefront Counter Pickup',
    items_summary: items,
    total_amount: Number(raw.total) || 0,
    delivery_fee: Number(raw.delivery_fee) || 0,
    channel,
    payment_status: isPaid ? 'paid' : (raw.status === 'cancelled' ? 'refunded' : 'pending'),
    fulfillment_status,
    scheduled_delivery_at: raw.scheduled_delivery_date || raw.created_at || new Date().toISOString(),
    rider_name: raw.delivery_status ? 'Assigned Rider' : 'Pending Rider',
    notes: raw.notes || ''
  }
}

export const WebsiteOrdersPage: React.FC = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<WebsiteOrder[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'all' | 'intake' | 'kitchen' | 'transit' | 'delivered'>('all')
  const [selectedOrder, setSelectedOrder] = useState<WebsiteOrder | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Search State with Full Historical Supabase Querying & Autocomplete Suggestions
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSearchingBackend, setIsSearchingBackend] = useState(false)
  const [backendSuggestions, setBackendSuggestions] = useState<WebsiteOrder[]>([])
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const fetchLiveOrders = async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true)
    try {
      // 1. First attempt direct Supabase client query
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(200)

      if (!error && Array.isArray(data) && data.length > 0) {
        setOrders(data.map(mapSupabaseOrderToWebsiteOrder))
        return
      }

      // 2. Fallback to Vite dev server API proxy (uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS in local dev)
      const res = await fetch('/api/live-orders')
      if (res.ok) {
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          setOrders(json.data.map(mapSupabaseOrderToWebsiteOrder))
        }
      }
    } catch (err) {
      console.error('Failed to load live website orders:', err)
    } finally {
      setLoading(false)
      if (showIndicator) setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLiveOrders()

    // Real-time Supabase postgres_changes listener
    const channel = supabase
      .channel('ops_website_orders_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchLiveOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Debounced Historical Backend Search (queries orders as far back as sales database inception)
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q || q.length < 2) {
      setBackendSuggestions([])
      setIsSearchingBackend(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearchingBackend(true)
      try {
        const res = await fetch(`/api/live-orders?q=${encodeURIComponent(q)}`)
        if (res.ok) {
          const json = await res.json()
          if (json.data && Array.isArray(json.data)) {
            setBackendSuggestions(json.data.map(mapSupabaseOrderToWebsiteOrder))
          }
        } else {
          // Direct fallback to Supabase
          const { data } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .is('deleted_at', null)
            .or(`customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,delivery_address.ilike.%${q}%,id.ilike.%${q}%,notes.ilike.%${q}%`)
            .order('created_at', { ascending: false })
            .limit(30)
          if (Array.isArray(data)) {
            setBackendSuggestions(data.map(mapSupabaseOrderToWebsiteOrder))
          }
        }
      } catch (err) {
        console.warn('Historical search error:', err)
      } finally {
        setIsSearchingBackend(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Merge client-loaded orders and historical backend search results for instant autocomplete suggestions
  const suggestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return []

    const map = new Map<string | number, { order: WebsiteOrder; matchType: string; matchedValue: string }>()

    const evaluateOrder = (o: WebsiteOrder) => {
      if (map.has(o.id)) return
      if (o.order_ref.toLowerCase().includes(q)) {
        map.set(o.id, { order: o, matchType: 'Order ID', matchedValue: o.order_ref })
      } else if (o.customer_name.toLowerCase().includes(q)) {
        map.set(o.id, { order: o, matchType: 'Customer', matchedValue: o.customer_name })
      } else if (o.phone.toLowerCase().includes(q)) {
        map.set(o.id, { order: o, matchType: 'Phone', matchedValue: o.phone })
      } else if (o.items_summary.toLowerCase().includes(q)) {
        map.set(o.id, { order: o, matchType: 'Dish', matchedValue: o.items_summary })
      } else if (o.address.toLowerCase().includes(q)) {
        map.set(o.id, { order: o, matchType: 'Address', matchedValue: o.address })
      } else if (o.notes.toLowerCase().includes(q)) {
        map.set(o.id, { order: o, matchType: 'Notes', matchedValue: o.notes })
      }
    }

    // Client memory orders first
    orders.forEach(evaluateOrder)

    // Deep historical backend orders second
    backendSuggestions.forEach(evaluateOrder)

    return Array.from(map.values()).slice(0, 8)
  }, [searchQuery, orders, backendSuggestions])

  const handleSelectSuggestion = (order: WebsiteOrder) => {
    setSearchQuery(order.order_ref)
    setIsSearchOpen(false)
    // If not in current orders list (e.g. from 6 months ago), prepend it so table displays it!
    setOrders((prev) => {
      if (prev.some((o) => o.id === order.id)) return prev
      return [order, ...prev]
    })
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        setIsSearchOpen(false)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions[activeSuggestionIndex]) {
        handleSelectSuggestion(suggestions[activeSuggestionIndex].order)
      } else {
        setIsSearchOpen(false)
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false)
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // KPIs
  const totalOrdersCount = orders.length
  const totalGrossRevenue = orders.reduce((sum, ord) => sum + ord.total_amount, 0)
  const activeFulfillmentCount = orders.filter(
    (o) => o.fulfillment_status === 'cooking' || o.fulfillment_status === 'packaging'
  ).length
  const outForDeliveryCount = orders.filter((o) => o.fulfillment_status === 'in_transit').length
  const deliveredCount = orders.filter((o) => o.fulfillment_status === 'delivered').length

  // Filtered orders by tab
  const tabFilteredOrders = useMemo(() => {
    switch (activeTab) {
      case 'intake':
        return orders.filter((o) => o.fulfillment_status === 'in_intake')
      case 'kitchen':
        return orders.filter((o) => o.fulfillment_status === 'cooking' || o.fulfillment_status === 'packaging')
      case 'transit':
        return orders.filter((o) => o.fulfillment_status === 'in_transit')
      case 'delivered':
        return orders.filter((o) => o.fulfillment_status === 'delivered')
      default:
        return orders
    }
  }, [orders, activeTab])

  // Combined searched orders matching search query
  const searchedOrders = useMemo(() => {
    if (!searchQuery.trim()) return tabFilteredOrders
    const q = searchQuery.toLowerCase().trim()
    return tabFilteredOrders.filter((o) => {
      return (
        o.order_ref.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q) ||
        o.items_summary.toLowerCase().includes(q) ||
        o.channel.toLowerCase().includes(q) ||
        o.notes.toLowerCase().includes(q)
      )
    })
  }, [tabFilteredOrders, searchQuery])

  const handleOpenDetails = (order: WebsiteOrder) => {
    setSelectedOrder(order)
    setIsDetailsModalOpen(true)
  }

  // Column definitions matching project DataTable standards
  const columns: ColumnDef<WebsiteOrder>[] = [
    {
      key: 'order_ref',
      header: 'Order Ref',
      defaultWidth: 130,
      accessor: (o) => (
        <span className="font-semibold text-xs text-kumo-strong font-mono">
          {o.order_ref}
        </span>
      ),
      sortValue: (o) => o.order_ref
    },
    {
      key: 'customer',
      header: 'Customer',
      defaultWidth: 190,
      accessor: (o) => (
        <div>
          <div className="font-medium text-xs text-kumo-strong">{o.customer_name}</div>
          <div className="text-[11px] text-kumo-subtle flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3 text-kumo-subtle shrink-0" />
            <span>{o.phone}</span>
          </div>
        </div>
      ),
      sortValue: (o) => o.customer_name
    },
    {
      key: 'items',
      header: 'Items Ordered',
      defaultWidth: 260,
      accessor: (o) => (
        <div>
          <span className="text-xs font-medium text-kumo-strong line-clamp-1">
            {o.items_summary}
          </span>
          <span className="text-[11px] text-kumo-subtle block">
            Channel: {o.channel}
          </span>
        </div>
      ),
      sortValue: (o) => o.items_summary
    },
    {
      key: 'address',
      header: 'Delivery Location',
      defaultWidth: 220,
      accessor: (o) => (
        <div className="flex items-start gap-1 text-xs text-kumo-default">
          <MapPin className="w-3.5 h-3.5 text-kumo-subtle shrink-0 mt-0.5" />
          <span className="line-clamp-1">{o.address}</span>
        </div>
      ),
      sortValue: (o) => o.address
    },
    {
      key: 'amount',
      header: 'Amount',
      defaultWidth: 120,
      accessor: (o) => (
        <div className="text-right">
          <span className="font-semibold text-xs text-kumo-strong">
            {formatNaira(o.total_amount)}
          </span>
        </div>
      ),
      sortValue: (o) => o.total_amount
    },
    {
      key: 'payment',
      header: 'Payment',
      defaultWidth: 120,
      accessor: (o) => (
        <StatusBadge
          status={o.payment_status === 'paid' ? 'PAID' : 'PENDING'}
          label={o.payment_status === 'paid' ? 'Paid' : 'Pending'}
          size="sm"
        />
      ),
      sortValue: (o) => o.payment_status
    },
    {
      key: 'status',
      header: 'Fulfillment',
      defaultWidth: 145,
      accessor: (o) => {
        const stageMap: Record<string, { status: BadgeStatus | string; label: string }> = {
          in_intake: { status: 'ORDER_INTAKE', label: 'Order Intake' },
          cooking: { status: 'COOKING', label: 'Production' },
          packaging: { status: 'PACKAGING', label: 'Packaging' },
          in_transit: { status: 'IN_TRANSIT', label: 'In Transit' },
          delivered: { status: 'DELIVERED', label: 'Delivered' }
        }
        const config = stageMap[o.fulfillment_status] || { status: 'PENDING', label: 'Pending' }
        return <StatusBadge status={config.status} label={config.label} size="sm" />
      },
      sortValue: (o) => o.fulfillment_status
    },
    {
      key: 'rider',
      header: 'Rider Assigned',
      defaultWidth: 160,
      accessor: (o) => (
        <span className="text-xs text-kumo-default truncate block">
          {o.rider_name}
        </span>
      ),
      sortValue: (o) => o.rider_name
    },
    {
      key: 'actions',
      header: 'Actions',
      defaultWidth: 140,
      accessor: (o) => (
        <div className="flex items-center gap-2">
          <TableActionButton
            variant="outline"
            onClick={() => handleOpenDetails(o)}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
          >
            Details
          </TableActionButton>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Page Header */}
      <PageHeader
        title="Website Sales Orders"
        subtitle="Manage customer orders originating directly from the website storefront, track payment confirmation, and monitor live kitchen-to-doorstep dispatch."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/overview')}
              leftIcon={<ExternalLink className="w-4 h-4 text-blue-600" />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
            >
              Order Flow Canvas
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => fetchLiveOrders(true)}
              disabled={isRefreshing}
              leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Live Orders'}
            </Button>
          </div>
        }
      />

      {/* 2. KPI Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Web Orders"
          value={loading ? '...' : totalOrdersCount}
          description="Storefront customer intake"
          icon={<ShoppingBag className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Total Gross Revenue"
          value={loading ? '...' : formatNaira(totalGrossRevenue)}
          description="Customer payment settlement"
          trend={{ value: 12.5, isPositive: true }}
          icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Production & Packaging"
          value={loading ? '...' : activeFulfillmentCount}
          description="Orders being prepped"
          icon={<Clock className="w-4 h-4 text-amber-500" />}
          variant="default"
        />
        <MetricCard
          title="Out for Delivery"
          value={loading ? '...' : outForDeliveryCount}
          description="Active riders on transit"
          icon={<Truck className="w-4 h-4 text-blue-500" />}
        />
      </div>

      {/* 3. Filter Tabs */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          tabs={[
            { id: 'all', label: 'All Orders', badge: orders.length },
            {
              id: 'intake',
              label: 'Order Intake',
              badge: orders.filter((o) => o.fulfillment_status === 'in_intake').length
            },
            {
              id: 'kitchen',
              label: 'Production & Packaging',
              badge: activeFulfillmentCount
            },
            {
              id: 'transit',
              label: 'Out for Delivery',
              badge: outForDeliveryCount
            },
            {
              id: 'delivered',
              label: 'Delivered',
              badge: deliveredCount
            }
          ]}
        />
      </div>

      {/* 4. Historical Search & Dropdown Autocomplete Assist */}
      <div className="relative font-sans" ref={searchContainerRef}>
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-kumo-subtle pointer-events-none z-10" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsSearchOpen(true)
              setActiveSuggestionIndex(0)
            }}
            onFocus={() => {
              if (searchQuery.trim().length > 0) setIsSearchOpen(true)
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search orders as far back as database inception (Order ID, Customer, Phone, Dish, Address)..."
            className="w-full h-11 pl-10 pr-24 rounded-xl border border-kumo-line bg-kumo-card text-xs sm:text-sm text-kumo-strong placeholder:text-kumo-subtle focus:outline-none focus:ring-2 focus:ring-zinc-400/20 focus:border-zinc-400 dark:focus:border-zinc-600 transition-all shadow-2xs font-sans"
          />

          <div className="absolute right-3 flex items-center gap-2">
            {isSearchingBackend && (
              <span className="flex items-center gap-1.5 text-[11px] text-kumo-subtle">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
                <span className="hidden sm:inline">Indexing...</span>
              </span>
            )}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setIsSearchOpen(false)
                }}
                className="p-1 rounded-md text-kumo-subtle hover:text-kumo-strong hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Autocomplete Dropdown with Highlighted Suggestions */}
        {isSearchOpen && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-800/40 px-3 font-sans">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                Historical Sales Database Matches
              </span>
              <span>Use ↑ ↓ to navigate, Enter to view in table</span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 p-1">
              {suggestions.map(({ order, matchType, matchedValue }, idx) => {
                const isActive = idx === activeSuggestionIndex
                return (
                  <div
                    key={order.id}
                    onClick={() => handleSelectSuggestion(order)}
                    onMouseEnter={() => setActiveSuggestionIndex(idx)}
                    className={cn(
                      "p-3 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs",
                      isActive
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {matchType}
                        </span>
                        <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                          {highlightSearchMatch(matchedValue, searchQuery)}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2 truncate">
                        <span className="font-mono text-zinc-700 dark:text-zinc-300 font-medium">{order.order_ref}</span>
                        <span>•</span>
                        <span>{highlightSearchMatch(order.customer_name, searchQuery)}</span>
                        <span>•</span>
                        <span>{order.items_summary}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 font-mono">
                        {formatNaira(order.total_amount)}
                      </div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {formatDate(order.scheduled_delivery_at)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Active Query Filter Pill — Clean Desaturated Grey */}
        {searchQuery.trim() && (
          <div className="mt-2.5 flex items-center justify-between px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 font-sans shadow-2xs">
            <span className="flex items-center gap-1.5">
              <span>Showing results filtered across sales database for:</span>
              <strong className="underline underline-offset-2 font-semibold text-zinc-900 dark:text-zinc-100">"{searchQuery.trim()}"</strong>
              <span className="text-[11px] text-zinc-500 font-mono">({searchedOrders.length} orders found)</span>
            </span>
            <button
              onClick={() => {
                setSearchQuery('')
                setIsSearchOpen(false)
              }}
              className="text-xs font-semibold hover:underline flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Reset Search Filter
            </button>
          </div>
        )}
      </div>

      {/* 5. DataTable with Search, Category filters, and Full Order Data */}
      <DataTable
        data={searchedOrders}
        columns={columns}
        searchable={false}
        tableId="website_orders_table"
        exportFilename="website_orders.csv"
        searchFilter={(order, query) => {
          const q = query.toLowerCase()
          return (
            order.order_ref.toLowerCase().includes(q) ||
            order.customer_name.toLowerCase().includes(q) ||
            order.phone.toLowerCase().includes(q) ||
            order.address.toLowerCase().includes(q) ||
            order.items_summary.toLowerCase().includes(q) ||
            order.channel.toLowerCase().includes(q) ||
            order.notes.toLowerCase().includes(q)
          )
        }}
      />

      {/* 5. Order Details Modal */}
      {selectedOrder && (
        <Dialog
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Order Details: ${selectedOrder.order_ref}`}
          className="max-w-lg"
        >
          <div className="space-y-3 text-xs font-sans">
            <div className="rounded-xl bg-kumo-canvas border border-kumo-line p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-kumo-subtle">Customer:</span>
                <span className="font-semibold text-kumo-strong text-xs">{selectedOrder.customer_name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-kumo-subtle">Phone:</span>
                <span className="font-medium text-kumo-default text-xs">{selectedOrder.phone}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-kumo-subtle">Delivery Address:</span>
                <span className="font-medium text-kumo-strong text-right max-w-[240px] text-xs leading-normal">
                  {selectedOrder.address}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-kumo-canvas border border-kumo-line p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-kumo-subtle">Ordered Items:</span>
                <span className="font-semibold text-kumo-strong text-right text-xs leading-normal max-w-[240px]">
                  {selectedOrder.items_summary}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-kumo-subtle">Order Total:</span>
                <span className="font-bold text-xs sm:text-sm text-kumo-strong">
                  {formatNaira(selectedOrder.total_amount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-kumo-subtle">Delivery Fee:</span>
                <span className="font-medium text-kumo-default text-xs">
                  {formatNaira(selectedOrder.delivery_fee)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-kumo-subtle">Payment Status:</span>
                <StatusBadge
                  status={selectedOrder.payment_status === 'paid' ? 'PAID' : 'PENDING'}
                  label={selectedOrder.payment_status === 'paid' ? 'Paid' : 'Pending'}
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-kumo-subtle">Fulfillment Stage:</span>
                <StatusBadge
                  status={
                    selectedOrder.fulfillment_status === 'in_intake' ? 'ORDER_INTAKE' :
                    selectedOrder.fulfillment_status === 'cooking' ? 'COOKING' :
                    selectedOrder.fulfillment_status === 'packaging' ? 'PACKAGING' :
                    selectedOrder.fulfillment_status === 'in_transit' ? 'IN_TRANSIT' : 'DELIVERED'
                  }
                  label={
                    selectedOrder.fulfillment_status === 'in_intake' ? 'Order Intake' :
                    selectedOrder.fulfillment_status === 'cooking' ? 'Kitchen Production' :
                    selectedOrder.fulfillment_status === 'packaging' ? 'Packaging' :
                    selectedOrder.fulfillment_status === 'in_transit' ? 'In Transit' : 'Delivered'
                  }
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-kumo-subtle">Assigned Rider:</span>
                <span className="font-medium text-kumo-strong text-xs">{selectedOrder.rider_name}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300">
              <span className="font-semibold block mb-0.5 text-xs">Order Notes:</span>
              <span className="text-xs leading-normal">{selectedOrder.notes}</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-kumo-line">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setIsDetailsModalOpen(false)
                  navigate(`/overview?orderId=${encodeURIComponent(selectedOrder.order_ref)}`)
                }}
                leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                View in Flow Diagram
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}

export default WebsiteOrdersPage
