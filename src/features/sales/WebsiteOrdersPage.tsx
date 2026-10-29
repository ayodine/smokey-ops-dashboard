import React, { useState, useMemo, useEffect } from 'react'
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
import { formatNaira, formatDate } from '@/lib/utils'
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
  FileText
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

  // KPIs
  const totalOrdersCount = orders.length
  const totalGrossRevenue = orders.reduce((sum, ord) => sum + ord.total_amount, 0)
  const activeFulfillmentCount = orders.filter(
    (o) => o.fulfillment_status === 'cooking' || o.fulfillment_status === 'packaging'
  ).length
  const outForDeliveryCount = orders.filter((o) => o.fulfillment_status === 'in_transit').length
  const deliveredCount = orders.filter((o) => o.fulfillment_status === 'delivered').length

  // Filtered orders by tab
  const filteredOrders = useMemo(() => {
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
          cooking: { status: 'COOKING', label: 'Cooking' },
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
          title="Kitchen & Packaging"
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
              label: 'Kitchen & Packaging',
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

      {/* 4. DataTable with Search, Category filters, and Full Order Data */}
      <DataTable
        data={filteredOrders}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search order ID, customer name, phone, or address..."
        tableId="website_orders_table"
        exportFilename="website_orders.csv"
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
                    selectedOrder.fulfillment_status === 'cooking' ? 'Cooking' :
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
                  navigate('/overview')
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
