import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { MetricCard } from '@/components/ui/MetricCard'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { SingleDatePicker } from '@/components/ui/SingleDatePicker'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { StatusBadge, BadgeStatus } from '@/components/ui/Badge'
import { useSmokeyOps, getOfficeOpeningHourForDate } from '@/context/SmokeyOpsContext'
import { supabase } from '@/lib/supabase'
import { SEED_WEBSITE_ORDERS } from '@/lib/smokeyData'
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
  ChevronRight,
  Receipt,
  User,
  UtensilsCrossed,
  CreditCard,
  Package
} from 'lucide-react'

export interface WebsiteOrder {
  id: string | number
  order_ref: string
  customer_name: string
  customer_email?: string
  phone: string
  address: string
  items_summary: string
  raw_items?: any[]
  total_amount: number
  delivery_fee: number
  channel: string
  payment_status: 'paid' | 'pending' | 'refunded'
  payment_method?: string
  fulfillment_status: 'in_intake' | 'packaging' | 'ready_for_dispatch' | 'in_transit' | 'delivered'
  created_at: string
  scheduled_delivery_at: string
  paid_at?: string
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
  if (status.includes('deliver')) {
    fulfillment_status = 'delivered'
  } else if (status.includes('transit') || status.includes('dispatch') || status.includes('shipped') || status.includes('out_for_delivery') || status.includes('on_road')) {
    fulfillment_status = 'in_transit'
  } else if (status.includes('ready') || status.includes('packed') || status.includes('packaged')) {
    fulfillment_status = 'ready_for_dispatch'
  } else if (status.includes('pack') || status.includes('process') || status.includes('prep') || status.includes('cook') || status.includes('paid')) {
    fulfillment_status = 'packaging'
  } else {
    fulfillment_status = 'in_intake'
  }

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

  let scheduledAt = raw.scheduled_delivery_date ? String(raw.scheduled_delivery_date) : ''
  if (!scheduledAt && raw.notes && raw.notes.includes('[Scheduled Delivery:')) {
    const match = raw.notes.match(/\[Scheduled Delivery:\s*([^\]]+)\]/)
    if (match && match[1]) {
      scheduledAt = match[1].trim()
    }
  }

  return {
    id: raw.id,
    order_ref: String(raw.id || ''),
    customer_name: raw.customer_name || 'Storefront Customer',
    customer_email: raw.customer_email || '',
    phone: raw.customer_phone || 'N/A',
    address: raw.delivery_address || 'Storefront Counter Pickup',
    items_summary: items,
    raw_items: Array.isArray(raw.order_items) ? raw.order_items : [],
    total_amount: Number(raw.total) || 0,
    delivery_fee: Number(raw.delivery_fee) || 0,
    channel,
    payment_status: isPaid ? 'paid' : (raw.status === 'cancelled' ? 'refunded' : 'pending'),
    payment_method: raw.payment_method || raw.payment_channel || 'Paystack',
    fulfillment_status,
    created_at: raw.created_at || raw.scheduled_delivery_date || new Date().toISOString(),
    scheduled_delivery_at: scheduledAt,
    paid_at: raw.paid_at || '',
    rider_name: raw.delivery_status ? 'Assigned Rider' : 'Pending Rider',
    notes: raw.notes || ''
  }
}

export const WebsiteOrdersPage: React.FC = () => {
  const navigate = useNavigate()
  const { logisticsDeliveries, packagingQueue, scheduledOrders, rescheduleOrderDelivery } = useSmokeyOps()
  const [orders, setOrders] = useState<WebsiteOrder[]>(SEED_WEBSITE_ORDERS)
  const [loading, setLoading] = useState<boolean>(false)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'all' | 'intake' | 'packaging' | 'transit' | 'delivered'>('all')
  const [selectedOrder, setSelectedOrder] = useState<WebsiteOrder | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Reschedule / Schedule Delivery State
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('12:00')
  const [rescheduleDateTime, setRescheduleDateTime] = useState('')
  const [rescheduleNotes, setRescheduleNotes] = useState('')
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false)

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
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setOrders(json.data.map(mapSupabaseOrderToWebsiteOrder))
          return
        }
      }

      // 3. Graceful fallback to authentic snapshot seed data if live API is unavailable
      setOrders(SEED_WEBSITE_ORDERS)
    } catch (err) {
      console.error('Failed to load live website orders, falling back to snapshot:', err)
      setOrders(SEED_WEBSITE_ORDERS)
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

  // Enrich orders with live operational workflow state from SmokeyOpsContext (logistics, packaging, and scheduled pipeline)
  const displayOrders = useMemo(() => {
    const deliveryMap = new Map(logisticsDeliveries.map(d => [d.order_ref, d]))
    const packagingMap = new Map(packagingQueue.map(p => [p.order_ref, p]))
    const scheduledMap = new Map(scheduledOrders.map(s => [s.order_ref, s]))

    const enriched = orders.map(ord => {
      const activeDelivery = deliveryMap.get(ord.order_ref)
      const activePkg = packagingMap.get(ord.order_ref)
      const activeSched = scheduledMap.get(ord.order_ref)

      let fulfillment_status: WebsiteOrder['fulfillment_status'] = ord.fulfillment_status
      let rider_name = ord.rider_name

      if (activeDelivery) {
        if (activeDelivery.status === 'delivered') {
          fulfillment_status = 'delivered'
          rider_name = activeDelivery.assigned_rider || 'Delivered'
        } else if (activeDelivery.status === 'in_transit' || activeDelivery.status === 'out_for_delivery' || activeDelivery.status === 'assigned') {
          fulfillment_status = 'in_transit'
          rider_name = activeDelivery.assigned_rider || 'Assigned Rider'
        } else if (activeDelivery.status === 'pending') {
          fulfillment_status = 'ready_for_dispatch'
          rider_name = 'Awaiting Rider Assignment'
        }
      } else if (activePkg) {
        if (activePkg.order_status === 'packaged') {
          fulfillment_status = 'ready_for_dispatch'
          rider_name = 'Packaged — Ready for Dispatch'
        } else if (activePkg.order_status === 'in_packaging') {
          fulfillment_status = 'packaging'
          rider_name = 'Packing in Progress'
        } else if (activePkg.order_status === 'ready_for_fulfillment') {
          fulfillment_status = 'packaging'
          rider_name = 'Queued for Pack'
        }
      } else if (activeSched && activeSched.order_status === 'payment_confirmed') {
        fulfillment_status = 'in_intake'
        rider_name = 'Scheduled Pre-order'
      }

      return {
        ...ord,
        fulfillment_status,
        rider_name,
        scheduled_delivery_at: activeSched?.scheduled_delivery_at || ord.scheduled_delivery_at
      }
    })

    // Also include any scheduled pre-orders from scheduledOrders so they show under Order Intake
    scheduledOrders.forEach(so => {
      if (!enriched.some(o => o.order_ref === so.order_ref)) {
        enriched.push({
          id: so.id,
          order_ref: so.order_ref,
          customer_name: so.customer_name,
          phone: so.phone,
          address: so.address,
          items_summary: so.notes || 'Scheduled Pre-order Feast',
          total_amount: so.total_amount,
          delivery_fee: so.delivery_fee,
          channel: 'Website Storefront',
          payment_status: so.payment_status,
          fulfillment_status: 'in_intake',
          created_at: so.scheduled_delivery_at,
          scheduled_delivery_at: so.scheduled_delivery_at,
          rider_name: 'Scheduled Pre-order',
          notes: so.notes
        })
      }
    })

    return enriched
  }, [orders, logisticsDeliveries, packagingQueue, scheduledOrders])

  // KPIs
  const totalOrdersCount = displayOrders.length
  const totalGrossRevenue = displayOrders.reduce((sum, ord) => sum + ord.total_amount, 0)
  const intakeCount = displayOrders.filter((o) => o.fulfillment_status === 'in_intake').length
  const activeFulfillmentCount = displayOrders.filter(
    (o) => o.fulfillment_status === 'packaging' || o.fulfillment_status === 'ready_for_dispatch'
  ).length
  const outForDeliveryCount = displayOrders.filter((o) => o.fulfillment_status === 'in_transit').length
  const deliveredCount = displayOrders.filter((o) => o.fulfillment_status === 'delivered').length

  // Filtered orders by tab
  const tabFilteredOrders = useMemo(() => {
    switch (activeTab) {
      case 'intake':
        return displayOrders.filter((o) => o.fulfillment_status === 'in_intake')
      case 'packaging':
        return displayOrders.filter((o) => o.fulfillment_status === 'packaging' || o.fulfillment_status === 'ready_for_dispatch')
      case 'transit':
        return displayOrders.filter((o) => o.fulfillment_status === 'in_transit')
      case 'delivered':
        return displayOrders.filter((o) => o.fulfillment_status === 'delivered')
      default:
        return displayOrders
    }
  }, [displayOrders, activeTab])

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
      defaultWidth: 120,
      accessor: (o) => (
        <span className="font-semibold text-xs text-kumo-strong font-mono">
          {o.order_ref}
        </span>
      ),
      sortValue: (o) => o.order_ref
    },
    {
      key: 'created_at',
      header: 'Date & Time',
      defaultWidth: 155,
      accessor: (o) => {
        const d = o.created_at ? new Date(o.created_at) : null
        const isValid = d && !isNaN(d.getTime())
        if (!isValid) return <span className="text-kumo-subtle text-xs">-</span>
        return (
          <div className="font-sans">
            <div className="font-medium text-xs text-kumo-strong">
              {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div className="text-[11px] text-kumo-subtle font-mono mt-0.5 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 shrink-0 opacity-70" />
              <span>{d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>
        )
      },
      sortValue: (o) => new Date(o.created_at || 0).getTime()
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
      defaultWidth: 155,
      accessor: (o) => {
        const stageMap: Record<string, { status: BadgeStatus | string; label: string }> = {
          in_intake: { status: 'ORDER_INTAKE', label: 'Order Intake' },
          packaging: { status: 'PACKAGING', label: 'Packaging' },
          ready_for_dispatch: { status: 'IN_TRANSIT', label: 'Ready for Dispatch' },
          in_transit: { status: 'IN_TRANSIT', label: 'In Transit' },
          delivered: { status: 'DELIVERED', label: 'Delivered' }
        }
        const config = stageMap[o.fulfillment_status] || { status: 'PACKAGING', label: 'Packaging' }
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
          title="Packaging Queue"
          value={loading ? '...' : activeFulfillmentCount}
          description="Orders being packed from sales stock"
          icon={<Package className="w-4 h-4 text-amber-500" />}
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
            { id: 'all', label: 'All Orders', badge: totalOrdersCount },
            {
              id: 'intake',
              label: 'Order Intake',
              badge: intakeCount
            },
            {
              id: 'packaging',
              label: 'Packaging Queue',
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
                        {formatDate(order.scheduled_delivery_at || order.created_at)}
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
        onRowClick={handleOpenDetails}
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

      {/* 5. Order Details Modal — Desaturated Grey Layout with Clean Aligned Rows */}
      {selectedOrder && (
        <Dialog
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Order Details: ${selectedOrder.order_ref}`}
          description="Detailed customer information, ordered dish breakdown, and real-time fulfillment timeline."
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close
              </Button>
              <div className="flex items-center gap-2">
                {/* Only allow scheduling / rescheduling for orders that are not already out for delivery or delivered */}
                {selectedOrder.fulfillment_status !== 'in_transit' && selectedOrder.fulfillment_status !== 'delivered' && (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      const initialDate = selectedOrder.scheduled_delivery_at
                        ? selectedOrder.scheduled_delivery_at.split('T')[0].split(' ')[0]
                        : new Date().toISOString().split('T')[0]
                      const initialTime = selectedOrder.scheduled_delivery_at && selectedOrder.scheduled_delivery_at.includes(':')
                        ? (selectedOrder.scheduled_delivery_at.split(' ')[1] || '12:00').substring(0, 5)
                        : '12:00'
                      setRescheduleDate(initialDate)
                      setRescheduleTime(initialTime)
                      setRescheduleDateTime(`${initialDate} ${initialTime}`)
                      setRescheduleNotes(selectedOrder.notes || '')
                      setIsRescheduleModalOpen(true)
                    }}
                    leftIcon={<Calendar className="w-3.5 h-3.5 text-zinc-500" />}
                  >
                    {selectedOrder.scheduled_delivery_at ? 'Reschedule Delivery' : 'Schedule for Later'}
                  </Button>
                )}
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
          }
        >
          <div className="space-y-4 font-sans text-xs">
            {/* Master Divided Card Container (Desaturated Grey matching Image 2) */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs">
              
              {/* Section 1: Order Information & Timestamps */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Order Information
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Order Reference</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-semibold">{selectedOrder.order_ref}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Date & Time</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                      {(() => {
                        const d = selectedOrder.created_at ? new Date(selectedOrder.created_at) : null
                        const isValid = d && !isNaN(d.getTime())
                        if (!isValid) return '-'
                        return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                      })()}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Payment Status</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 capitalize">
                      {selectedOrder.payment_status}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Fulfillment Stage</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                      {
                        selectedOrder.fulfillment_status === 'in_intake' ? 'Order Intake' :
                        selectedOrder.fulfillment_status === 'packaging' ? 'Packaging' :
                        selectedOrder.fulfillment_status === 'ready_for_dispatch' ? 'Ready for Dispatch' :
                        selectedOrder.fulfillment_status === 'in_transit' ? 'In Transit' : 'Delivered'
                      }
                    </span>
                  </div>
                  {selectedOrder.scheduled_delivery_at && (
                    <div className="flex items-start text-[13px]">
                      <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Delivery Timing</span>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                        <Calendar className="w-3 h-3 text-blue-500" />
                        Scheduled: {selectedOrder.scheduled_delivery_at}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Sales Channel</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedOrder.channel}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Payment Method</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium capitalize">
                      {selectedOrder.payment_method || 'Paystack'}
                      {selectedOrder.paid_at && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal ml-2">
                          (Paid on {new Date(selectedOrder.paid_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} at {new Date(selectedOrder.paid_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Customer & Delivery Details */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Customer & Destination
                  </span>
                  <a
                    href={`tel:${selectedOrder.phone}`}
                    className="inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium underline underline-offset-2"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call Customer</span>
                  </a>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Customer Name</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Phone Number</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono">{selectedOrder.phone}</span>
                  </div>
                  {selectedOrder.customer_email && (
                    <div className="flex items-start text-[13px]">
                      <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Email Address</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedOrder.customer_email}</span>
                    </div>
                  )}
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Delivery Address</span>
                    <span className="flex-1 text-zinc-900 dark:text-zinc-100 font-medium block leading-snug">{selectedOrder.address}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Assigned Courier</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                      {selectedOrder.rider_name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Ordered Dishes */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Ordered Dishes
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                    {selectedOrder.raw_items && selectedOrder.raw_items.length > 0
                      ? `${selectedOrder.raw_items.length} item(s)`
                      : 'Kitchen Pack'}
                  </span>
                </div>

                <div className="pt-1">
                  {selectedOrder.raw_items && selectedOrder.raw_items.length > 0 ? (
                    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {selectedOrder.raw_items.map((item: any, idx: number) => (
                        <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-[13px]">
                          <div className="flex items-center gap-2.5">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300 font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                              {item.qty || 1}x
                            </span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.name || 'Smokey Dish'}</span>
                          </div>
                          {item.price && (
                            <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                              {formatNaira((item.qty || 1) * item.price)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedOrder.items_summary.split(' + ').map((dish, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[13px] text-zinc-900 dark:text-zinc-100 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 shrink-0" />
                          <span>{dish.trim()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Billing Breakdown */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Billing & Payment
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Meals Subtotal</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-medium">
                      {formatNaira(Math.max(0, selectedOrder.total_amount - selectedOrder.delivery_fee))}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Delivery Fee</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-medium">
                      {selectedOrder.delivery_fee > 0 ? formatNaira(selectedOrder.delivery_fee) : 'Free Delivery'}
                    </span>
                  </div>
                  <div className="flex items-start text-[14px] pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-900 dark:text-zinc-100 font-semibold">Total Amount</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold text-base">
                      {formatNaira(selectedOrder.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 5: Order Notes (if present) */}
              {selectedOrder.notes && (
                <div className="p-4 space-y-2 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      Order Notes
                    </span>
                  </div>
                  <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed pt-0.5">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Dialog>
      )}

      {/* Schedule / Reschedule Delivery Modal */}
      {selectedOrder && (
        <Dialog
          isOpen={isRescheduleModalOpen}
          onClose={() => setIsRescheduleModalOpen(false)}
          title={`Schedule Delivery: ${selectedOrder.order_ref}`}
          description="Assign or modify the scheduled delivery date for this order."
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <Button
                variant="secondary"
                size="md"
                type="button"
                onClick={() => setIsRescheduleModalOpen(false)}
                disabled={isSubmittingSchedule}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                form="schedule-delivery-form"
                disabled={isSubmittingSchedule || !rescheduleDate}
                leftIcon={isSubmittingSchedule ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
              >
                {isSubmittingSchedule ? 'Saving...' : 'Save Schedule'}
              </Button>
            </div>
          }
        >
          <form
            id="schedule-delivery-form"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!rescheduleDate) return
              setIsSubmittingSchedule(true)
              const opening = getOfficeOpeningHourForDate(rescheduleDate)
              const timePart = rescheduleTime || opening.timeStr
              const success = await rescheduleOrderDelivery(
                selectedOrder.order_ref,
                rescheduleDate,
                timePart,
                rescheduleNotes,
                {
                  customer_name: selectedOrder.customer_name,
                  phone: selectedOrder.phone,
                  address: selectedOrder.address,
                  total_amount: selectedOrder.total_amount,
                  delivery_fee: selectedOrder.delivery_fee,
                  notes: selectedOrder.notes
                }
              )
              setIsSubmittingSchedule(false)
              if (success) {
                setSelectedOrder(prev => prev ? {
                  ...prev,
                  scheduled_delivery_at: `${rescheduleDate} ${timePart}`,
                  fulfillment_status: 'in_intake'
                } : null)
                setIsRescheduleModalOpen(false)
              }
            }}
            className="space-y-4 font-sans text-xs"
          >
            {/* Master Divided Card Container (stacked label and value) */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs">
              <div className="p-3.5 space-y-1">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400 font-normal">Customer</span>
                <span className="block text-zinc-900 dark:text-zinc-100 font-semibold text-[13px]">{selectedOrder.customer_name}</span>
              </div>
              <div className="p-3.5 space-y-1">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400 font-normal">Delivery Address</span>
                <span className="block text-zinc-900 dark:text-zinc-100 font-medium text-[13px] leading-snug">{selectedOrder.address}</span>
              </div>
              <div className="p-3.5 space-y-1">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400 font-normal">Current Schedule</span>
                <span className="block text-zinc-900 dark:text-zinc-100 font-medium text-[13px]">
                  {selectedOrder.scheduled_delivery_at ? formatDate(selectedOrder.scheduled_delivery_at) : 'Immediate ASAP Fulfillment'}
                </span>
              </div>
            </div>

            <DateTimePicker
              label="Delivery Date & Time"
              value={rescheduleDateTime}
              onChange={(val, details) => {
                setRescheduleDateTime(val)
                if (details) {
                  setRescheduleDate(details.date)
                  setRescheduleTime(details.time)
                }
              }}
              helperText={rescheduleDate ? `Office Opening Time: ${getOfficeOpeningHourForDate(rescheduleDate).label} (Standard dispatch start)` : undefined}
              required
            />

            <Input
              label="Dispatch & Kitchen Notes (Optional)"
              value={rescheduleNotes}
              onChange={(e) => setRescheduleNotes(e.target.value)}
              placeholder="e.g. Deliver before 2pm for office party, ring doorbell on arrival."
            />
          </form>
        </Dialog>
      )}
    </div>
  )
}

export default WebsiteOrdersPage
