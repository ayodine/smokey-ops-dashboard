import React, { useState, useMemo } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { LogisticsDelivery } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { KumoTabs } from '@/components/ui/Tabs'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/Badge'
import { formatNaira, formatDate } from '@/lib/utils'
import {
  Bike,
  Phone,
  MapPin,
  ExternalLink,
  CheckCircle2,
  XCircle,
  DollarSign,
  Receipt,
  ShieldCheck,
  Clock,
  RotateCcw,
  Check,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Navigation
} from 'lucide-react'

export const RiderDashboardPage: React.FC = () => {
  const {
    riders,
    logisticsDeliveries,
    markDelivered,
    acceptDelivery,
    declineDelivery,
    showToast,
  } = useSmokeyOps()

  // Primary rider account: Rider Yusuf (Staff ID: RDR-003, user_id: 455 per enterprise spec)
  const currentRider = useMemo(() => {
    return riders.find(r => r.rider_user_id === 455) || riders[0]
  }, [riders])

  // Active Tab: 'assigned' | 'delivered' | 'earnings' | 'tasks'
  const [activeTab, setActiveTab] = useState<string>('assigned')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      showToast('Rider operations data refreshed', 'info')
    }, 450)
  }

  // Filter deliveries belonging to this internal rider
  const riderDeliveries = useMemo(() => {
    if (!currentRider) return []
    return logisticsDeliveries.filter(
      d => d.rider_type === 'internal' && d.assigned_rider_id === currentRider.rider_user_id
    )
  }, [logisticsDeliveries, currentRider])

  // Awaiting rider accept/decline action
  const assignedOrders = useMemo(() => {
    return riderDeliveries.filter(d => d.status === 'assigned')
  }, [riderDeliveries])

  // Accepted trips currently on the road
  const inTransitOrders = useMemo(() => {
    return riderDeliveries.filter(
      d => d.status === 'in_transit' || d.status === 'out_for_delivery'
    )
  }, [riderDeliveries])

  // Completed trips for this rider
  const completedOrders = useMemo(() => {
    return riderDeliveries.filter(d => d.status === 'delivered')
  }, [riderDeliveries])

  // Decline Dialog state
  const [declineTargetOrder, setDeclineTargetOrder] = useState<LogisticsDelivery | null>(null)
  const [declineReason, setDeclineReason] = useState<string>('Bike mechanical issue / flat tire')
  const [customDeclineNotes, setCustomDeclineNotes] = useState<string>('')

  const handleOpenDecline = (order: LogisticsDelivery) => {
    setDeclineTargetOrder(order)
    setDeclineReason('Bike mechanical issue / flat tire')
    setCustomDeclineNotes('')
  }

  const handleConfirmDecline = () => {
    if (!declineTargetOrder) return
    const finalReason = customDeclineNotes.trim()
      ? `${declineReason}: ${customDeclineNotes.trim()}`
      : declineReason

    declineDelivery(declineTargetOrder.id, finalReason)
    setDeclineTargetOrder(null)
  }

  // Confirm Handover Dialog state
  const [confirmDeliveryTarget, setConfirmDeliveryTarget] = useState<LogisticsDelivery | null>(null)
  const [previewOrder, setPreviewOrder] = useState<LogisticsDelivery | null>(null)

  const handleConfirmDelivered = (order: LogisticsDelivery) => {
    markDelivered(order.id)
    setConfirmDeliveryTarget(null)
  }

  // Clean Tab configuration (No icons in front of labels, per user requirement)
  const tabs = [
    {
      id: 'assigned',
      label: 'Assigned Orders',
      badge: assignedOrders.length > 0 ? assignedOrders.length : undefined,
    },
    {
      id: 'in_transit',
      label: 'In-Transit',
      badge: inTransitOrders.length > 0 ? inTransitOrders.length : undefined,
    },
    {
      id: 'delivered',
      label: 'Delivered Orders',
      badge: completedOrders.length > 0 ? completedOrders.length : undefined,
    },
    {
      id: 'earnings',
      label: 'Earnings & Wallet',
    },
  ]

  // Calculated metrics
  const assignedFees = assignedOrders.reduce((sum, o) => sum + o.delivery_fee, 0)
  const assignedCodTotal = assignedOrders.reduce(
    (sum, o) => sum + (o.payment_mode === 'cod' ? (o.cod_amount || 0) : 0),
    0
  )
  const inTransitFees = inTransitOrders.reduce((sum, o) => sum + o.delivery_fee, 0)
  const inTransitCodTotal = inTransitOrders.reduce(
    (sum, o) => sum + (o.payment_mode === 'cod' ? (o.cod_amount || 0) : 0),
    0
  )
  const totalCompletedTrips = currentRider?.total_completed ?? 362
  const deliveredFeesTotal = completedOrders.reduce((sum, o) => sum + o.delivery_fee, 0)
  const lifetimeEarned = currentRider?.lifetime_earnings ?? 1183000
  const pendingPayoutBalance = currentRider?.pending_payout ?? 0

  // -----------------------------------------------------------------
  // TABLE COLUMNS: 1. ASSIGNED ORDERS (Strictly 6 columns per spec)
  // -----------------------------------------------------------------
  const assignedColumns: ColumnDef<LogisticsDelivery>[] = [
    {
      key: 'order_ref',
      header: 'Order Ref',
      defaultWidth: 120,
      accessor: (d) => (
        <div>
          <span className="font-semibold text-xs text-kumo-strong font-sans">
            #{d.order_ref}
          </span>
          <div className="text-[11px] text-kumo-subtle font-normal font-sans">
            {d.dispatch_date}
          </div>
        </div>
      ),
      sortValue: (d) => d.order_ref,
    },
    {
      key: 'customer',
      header: 'Customer Contact',
      defaultWidth: 160,
      accessor: (d) => (
        <div className="font-sans">
          <div className="font-semibold text-xs text-kumo-strong">{d.customer_name}</div>
          <a
            href={`tel:${d.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] text-kumo-subtle hover:text-kumo-strong font-normal mt-0.5 transition-colors"
          >
            <Phone className="w-3 h-3 text-kumo-subtle shrink-0" />
            <span>{d.phone}</span>
          </a>
        </div>
      ),
      sortValue: (d) => d.customer_name,
    },
    {
      key: 'address',
      header: 'Delivery Address & Route',
      defaultWidth: 240,
      accessor: (d) => (
        <div className="w-full font-sans">
          <p className="text-xs text-kumo-strong font-normal leading-snug truncate" title={d.address}>
            {d.address}
          </p>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(d.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] text-kumo-subtle hover:text-kumo-strong font-normal mt-0.5 transition-colors"
          >
            <MapPin className="w-3 h-3 text-kumo-subtle shrink-0" />
            <span>Navigate Maps</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      ),
      sortValue: (d) => d.address,
    },
    {
      key: 'items_summary',
      header: 'Kitchen Packed Item',
      defaultWidth: 220,
      accessor: (d) => (
        <div className="w-full font-sans">
          <div className="text-xs text-kumo-strong font-normal truncate" title={d.items_summary}>
            {d.items_summary || 'Standard Meal Package'}
          </div>
          {d.notes && (
            <div className="text-[11px] text-kumo-subtle font-normal truncate mt-0.5" title={d.notes}>
              Note: {d.notes}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'delivery_fee',
      header: 'Trip Fee',
      defaultWidth: 110,
      accessor: (d) => (
        <span className="font-semibold text-xs text-kumo-strong font-mono">
          {formatNaira(d.delivery_fee)}
        </span>
      ),
      sortValue: (d) => d.delivery_fee,
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 230,
      accessor: (d) => (
        <div className="flex items-center gap-2 font-sans" onClick={(e) => e.stopPropagation()}>
          <TableActionButton
            variant="outline"
            onClick={() => handleOpenDecline(d)}
          >
            Decline
          </TableActionButton>
          <TableActionButton
            variant="primary"
            icon={<Check />}
            iconStrokeWidth={2.5}
            onClick={() => acceptDelivery(d.id)}
          >
            Accept Order
          </TableActionButton>
        </div>
      ),
    },
  ]

  // -----------------------------------------------------------------
  // TABLE COLUMNS: 2. IN-TRANSIT ACTIVE DELIVERIES
  // -----------------------------------------------------------------
  const inTransitColumns: ColumnDef<LogisticsDelivery>[] = [
    {
      key: 'order_ref',
      header: 'Order Ref',
      defaultWidth: 120,
      accessor: (d) => (
        <div>
          <span className="font-semibold text-xs text-kumo-strong font-sans">
            #{d.order_ref}
          </span>
          <div className="text-[11px] text-kumo-subtle font-normal font-sans">
            {d.dispatch_date}
          </div>
        </div>
      ),
      sortValue: (d) => d.order_ref,
    },
    {
      key: 'customer',
      header: 'Customer Contact',
      defaultWidth: 160,
      accessor: (d) => (
        <div className="font-sans">
          <div className="font-semibold text-xs text-kumo-strong">{d.customer_name}</div>
          <a
            href={`tel:${d.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] text-kumo-subtle hover:text-kumo-strong font-normal mt-0.5 transition-colors"
          >
            <Phone className="w-3 h-3 text-kumo-subtle shrink-0" />
            <span>{d.phone}</span>
          </a>
        </div>
      ),
      sortValue: (d) => d.customer_name,
    },
    {
      key: 'address',
      header: 'Delivery Address & Route',
      defaultWidth: 240,
      accessor: (d) => (
        <div className="w-full font-sans">
          <p className="text-xs text-kumo-strong font-normal leading-snug truncate" title={d.address}>
            {d.address}
          </p>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(d.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] text-kumo-subtle hover:text-kumo-strong font-normal mt-0.5 transition-colors"
          >
            <MapPin className="w-3 h-3 text-kumo-subtle shrink-0" />
            <span>Navigate Maps</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      ),
      sortValue: (d) => d.address,
    },
    {
      key: 'items_summary',
      header: 'Kitchen Packed Item',
      defaultWidth: 220,
      accessor: (d) => (
        <div className="w-full font-sans">
          <div className="text-xs text-kumo-strong font-normal truncate" title={d.items_summary}>
            {d.items_summary || 'Standard Meal Package'}
          </div>
          {d.notes && (
            <div className="text-[11px] text-kumo-subtle font-normal truncate mt-0.5" title={d.notes}>
              Note: {d.notes}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'delivery_fee',
      header: 'Trip Fee',
      defaultWidth: 110,
      accessor: (d) => (
        <span className="font-semibold text-xs text-kumo-strong font-mono">
          {formatNaira(d.delivery_fee)}
        </span>
      ),
      sortValue: (d) => d.delivery_fee,
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 180,
      accessor: (d) => (
        <div className="flex items-center gap-2 font-sans" onClick={(e) => e.stopPropagation()}>
          <TableActionButton
            variant="success"
            icon={<CheckCircle2 />}
            iconStrokeWidth={2}
            onClick={() => setConfirmDeliveryTarget(d)}
          >
            Confirm Delivered
          </TableActionButton>
        </div>
      ),
    },
  ]

  // -----------------------------------------------------------------
  // TABLE COLUMNS: 2. DELIVERED ORDERS
  // -----------------------------------------------------------------
  const deliveredColumns: ColumnDef<LogisticsDelivery>[] = [
    {
      key: 'delivered_at',
      header: 'Delivered Timestamp',
      defaultWidth: 180,
      accessor: (d) => (
        <span className="text-xs font-normal text-kumo-subtle font-sans">
          {d.delivered_at || `${d.dispatch_date} (Completed)`}
        </span>
      ),
      sortValue: (d) => d.delivered_at || d.dispatch_date,
    },
    {
      key: 'order_ref',
      header: 'Order Ref',
      defaultWidth: 130,
      accessor: (d) => (
        <span className="font-semibold text-xs text-kumo-strong font-sans">
          #{d.order_ref}
        </span>
      ),
      sortValue: (d) => d.order_ref,
    },
    {
      key: 'customer',
      header: 'Customer Contact',
      defaultWidth: 180,
      accessor: (d) => (
        <div className="font-sans">
          <div className="font-semibold text-xs text-kumo-strong">{d.customer_name}</div>
          <div className="text-[11px] text-kumo-subtle font-normal">{d.phone}</div>
        </div>
      ),
      sortValue: (d) => d.customer_name,
    },
    {
      key: 'address',
      header: 'Delivery Address',
      defaultWidth: 260,
      accessor: (d) => (
        <span className="text-xs text-kumo-strong font-normal w-full truncate block font-sans" title={d.address}>
          {d.address}
        </span>
      ),
      sortValue: (d) => d.address,
    },
    {
      key: 'items_summary',
      header: 'Package Items',
      defaultWidth: 220,
      accessor: (d) => (
        <span className="text-xs text-kumo-subtle font-normal w-full truncate block font-sans" title={d.items_summary}>
          {d.items_summary || 'Smokey meal package'}
        </span>
      ),
    },
    {
      key: 'delivery_fee',
      header: 'Trip Fee Earned',
      defaultWidth: 130,
      accessor: (d) => (
        <span className="font-semibold text-xs text-kumo-strong font-mono">
          {formatNaira(d.delivery_fee)}
        </span>
      ),
      sortValue: (d) => d.delivery_fee,
    },
    {
      key: 'status',
      header: 'Status',
      defaultWidth: 130,
      accessor: () => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-sans whitespace-nowrap shrink-0">
          <Check className="w-3 h-3" />
          Delivered
        </span>
      ),
    },
  ]

  // -----------------------------------------------------------------
  // TABLE COLUMNS: 3. EARNINGS & WALLET LEDGER
  // -----------------------------------------------------------------
  const earningsColumns: ColumnDef<LogisticsDelivery>[] = [
    {
      key: 'date',
      header: 'Trip Date',
      defaultWidth: 140,
      accessor: (d) => (
        <span className="text-xs font-normal text-kumo-subtle font-sans">
          {d.delivered_at ? d.delivered_at.substring(0, 10) : d.dispatch_date}
        </span>
      ),
      sortValue: (d) => d.delivered_at || d.dispatch_date,
    },
    {
      key: 'order_ref',
      header: 'Order Ref',
      defaultWidth: 130,
      accessor: (d) => (
        <span className="font-semibold text-xs text-kumo-strong font-sans">
          #{d.order_ref}
        </span>
      ),
      sortValue: (d) => d.order_ref,
    },
    {
      key: 'customer',
      header: 'Destination',
      defaultWidth: 260,
      accessor: (d) => (
        <div className="font-sans w-full">
          <div className="font-semibold text-xs text-kumo-strong">{d.customer_name}</div>
          <div className="text-[11px] text-kumo-subtle font-normal truncate" title={d.address}>
            {d.address}
          </div>
        </div>
      ),
      sortValue: (d) => d.customer_name,
    },
    {
      key: 'payment_mode',
      header: 'Payment Type',
      defaultWidth: 150,
      accessor: (d) => (
        <span className="text-xs text-kumo-subtle font-normal font-sans capitalize">
          {d.payment_mode === 'cod' ? 'Cash on delivery' : 'Online prepaid'}
        </span>
      ),
      sortValue: (d) => d.payment_mode || 'online',
    },
    {
      key: 'delivery_fee',
      header: 'Credit Amount',
      defaultWidth: 140,
      accessor: (d) => (
        <span className="font-semibold text-xs text-kumo-strong font-mono">
          {formatNaira(d.delivery_fee)}
        </span>
      ),
      sortValue: (d) => d.delivery_fee,
    },
    {
      key: 'status',
      header: 'Settlement Status',
      defaultWidth: 180,
      accessor: () => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800 font-sans whitespace-nowrap shrink-0">
          <Check className="w-3 h-3" />
          Settled (₦0.00 Owed)
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Rider Operations Portal"
        subtitle="Order fulfillment queue, trip milestones, proof of delivery, and earnings ledger."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-9 px-3 text-xs font-medium text-kumo-subtle hover:text-kumo-strong"
            leftIcon={<RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        }
      />

      {/* KPI METRIC CARDS (Contextual to active tab) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* TAB 1: ASSIGNED ORDERS METRICS */}
        {activeTab === 'assigned' && (
          <>
            <MetricCard
              title="Awaiting Acceptance"
              value={`${assignedOrders.length} ${assignedOrders.length === 1 ? 'Trip' : 'Trips'}`}
              description="Orders dispatched for your acceptance"
              icon={<Bike className="w-4 h-4 text-primary" />}
            />
            <MetricCard
              title="Available Trip Fees"
              value={formatNaira(assignedFees)}
              description="Trip earnings upon completion"
              icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
            />
            <MetricCard
              title="Cash on Delivery (COD)"
              value={formatNaira(assignedCodTotal)}
              description="Cash meal bills to collect"
              icon={<Receipt className="w-4 h-4 text-amber-500" />}
            />
            <MetricCard
              title="Acceptance SLA"
              value="< 3 mins"
              description="Fast dispatcher acceptance target"
              icon={<Clock className="w-4 h-4 text-blue-500" />}
            />
          </>
        )}

        {/* TAB 2: IN-TRANSIT ACTIVE METRICS */}
        {activeTab === 'in_transit' && (
          <>
            <MetricCard
              title="In-Transit Active Trips"
              value={`${inTransitOrders.length} ${inTransitOrders.length === 1 ? 'Trip' : 'Trips'}`}
              description="Currently accepted & on the road"
              icon={<Navigation className="w-4 h-4 text-primary" />}
            />
            <MetricCard
              title="Trip Fees to Earn"
              value={formatNaira(inTransitFees)}
              description="Credited upon customer handover"
              icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
            />
            <MetricCard
              title="COD to Collect"
              value={formatNaira(inTransitCodTotal)}
              description="Cash to remit to kitchen cashier"
              icon={<Receipt className="w-4 h-4 text-rose-500" />}
            />
            <MetricCard
              title="Avg Delivery Window"
              value="~28 Mins"
              description="On-track for hot smokehouse delivery"
              icon={<Clock className="w-4 h-4 text-emerald-500" />}
            />
          </>
        )}

        {/* TAB 3: DELIVERED ORDERS METRICS */}
        {activeTab === 'delivered' && (
          <>
            <MetricCard
              title="Delivered (Lifetime)"
              value={`${totalCompletedTrips} Runs`}
              description="Customer doorstep handovers"
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            />
            <MetricCard
              title="Delivered in Ledger"
              value={`${completedOrders.length} Trips`}
              description="Historical trips recorded"
              icon={<Layers className="w-4 h-4 text-primary" />}
            />
            <MetricCard
              title="Total Delivered Fees"
              value={formatNaira(deliveredFeesTotal)}
              description="Commissions from verified runs"
              icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
            />
            <MetricCard
              title="Punctuality Score"
              value={`${currentRider?.on_time_rate ?? 99.2}%`}
              description="Verified on-time delivery rate"
              icon={<Check className="w-4 h-4 text-blue-500" />}
            />
          </>
        )}

        {/* TAB 4: EARNINGS & WALLET METRICS */}
        {activeTab === 'earnings' && (
          <>
            <MetricCard
              title="Outstanding Balance"
              value={formatNaira(pendingPayoutBalance)}
              description={pendingPayoutBalance === 0 ? "Account settled — ₦0.00 owed" : "Current balance awaiting payout"}
              icon={<Receipt className={`w-4 h-4 ${pendingPayoutBalance > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />}
            />
            <MetricCard
              title="Total Gross Earned"
              value={formatNaira(lifetimeEarned)}
              description="Cumulative gross historical earnings"
              icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
            />
            <MetricCard
              title="Historically Settled"
              value={formatNaira(currentRider?.paid_total ?? 1183000)}
              description="Cleared to rider bank account"
              icon={<CheckCircle2 className="w-4 h-4 text-primary" />}
            />
            <MetricCard
              title="This Month's Gross"
              value={formatNaira(currentRider?.earnings_month ?? 185000)}
              description="Current calendar month total"
              icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
            />
          </>
        )}
      </div>

      {/* Tabs Navigation (No bottom border line, no icons in labels) */}
      <div>
        <KumoTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          size="md"
        />
      </div>

      {/* TAB DATA TABLES */}
      <div>
        {/* ------------------------------------------------------------- */}
        {/* TAB 1: ASSIGNED ORDERS TABLE                                  */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'assigned' && (
          <div className="space-y-4">
            <DataTable
              tableId="rider-assigned-orders"
              title="Assigned Orders (Pending Acceptance)"
              data={assignedOrders}
              columns={assignedColumns}
              searchable={true}
              searchPlaceholder="Search order ref, customer, phone, address..."
              searchFilter={(d, q) =>
                d.order_ref.toLowerCase().includes(q) ||
                d.customer_name.toLowerCase().includes(q) ||
                d.phone.toLowerCase().includes(q) ||
                d.address.toLowerCase().includes(q)
              }
              enableDateFilter={true}
              exportFilename="smokey-rider-assigned-orders"
              onRowClick={(order) => setPreviewOrder(order)}
              emptyMessage="No pending trip assignments found. When kitchen dispatch assigns an order, it will appear here."
            />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: IN-TRANSIT ORDERS TABLE                                */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'in_transit' && (
          <div className="space-y-4">
            <DataTable
              tableId="rider-in-transit-orders"
              title="In-Transit Active Deliveries"
              data={inTransitOrders}
              columns={inTransitColumns}
              searchable={true}
              searchPlaceholder="Search order ref, customer, phone, address..."
              searchFilter={(d, q) =>
                d.order_ref.toLowerCase().includes(q) ||
                d.customer_name.toLowerCase().includes(q) ||
                d.phone.toLowerCase().includes(q) ||
                d.address.toLowerCase().includes(q)
              }
              enableDateFilter={true}
              exportFilename="smokey-rider-in-transit-orders"
              onRowClick={(order) => setPreviewOrder(order)}
              emptyMessage="No in-transit orders currently on the road. Accept an assigned order above to start delivery."
            />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: DELIVERED ORDERS TABLE                                 */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'delivered' && (
          <div className="space-y-4">
            <DataTable
              tableId="rider-delivered-orders"
              title="Delivered Orders"
              data={completedOrders}
              columns={deliveredColumns}
              searchable={true}
              searchPlaceholder="Search delivered order ref, customer, address..."
              searchFilter={(d, q) =>
                d.order_ref.toLowerCase().includes(q) ||
                d.customer_name.toLowerCase().includes(q) ||
                d.phone.toLowerCase().includes(q) ||
                d.address.toLowerCase().includes(q)
              }
              enableDateFilter={true}
              exportFilename="smokey-rider-delivered-history"
              onRowClick={(order) => setPreviewOrder(order)}
              emptyMessage="No historical delivered orders found matching your search."
            />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: EARNINGS & WALLET TABLE                                */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'earnings' && (
          <div className="space-y-5">
            {/* Settled Ledger Banner */}
            {pendingPayoutBalance === 0 ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-800 dark:text-emerald-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">Account settled — outstanding balance is ₦0.00</h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5 leading-relaxed font-normal">
                      All completed trips have been disbursed and audited. Settled payment history is preserved below for your records.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-800 dark:text-amber-200">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">Pending disbursement balance: {formatNaira(pendingPayoutBalance)}</h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed font-normal">
                      Delivery commissions earned from recently confirmed trips awaiting scheduled accounting clearing.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Earnings Breakdown Table */}
            <DataTable
              tableId="rider-earnings-ledger"
              title="Earnings Ledger"
              data={completedOrders}
              columns={earningsColumns}
              searchable={true}
              searchPlaceholder="Search trip earnings by order #, customer, address..."
              searchFilter={(d, q) =>
                d.order_ref.toLowerCase().includes(q) ||
                d.customer_name.toLowerCase().includes(q) ||
                d.address.toLowerCase().includes(q)
              }
              enableDateFilter={true}
              exportFilename="smokey-rider-earnings-ledger"
              onRowClick={(order) => setPreviewOrder(order)}
              emptyMessage="No trip earnings found matching criteria."
            />
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ORDER DETAILS PREVIEW (Click to View)                   */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        isOpen={previewOrder !== null}
        onClose={() => setPreviewOrder(null)}
        title={`Delivery Order Details — #${previewOrder?.order_ref}`}
        description="Comprehensive customer route, kitchen packaging, and commission ledger details."
        maxWidth="lg"
      >
        {previewOrder && (
          <div className="space-y-4 font-sans text-xs">
            {/* Status & Timing Banner */}
            <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-kumo-subtle text-[11px] block">Order Reference</span>
                <span className="text-sm font-bold text-kumo-strong">#{previewOrder.order_ref}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-kumo-subtle">
                  {previewOrder.status === 'delivered' ? `Delivered: ${previewOrder.delivered_at || previewOrder.dispatch_date}` : `Dispatched: ${previewOrder.dispatch_date}`}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                  previewOrder.status === 'delivered'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                }`}>
                  {previewOrder.status === 'delivered' ? 'Delivered' : 'Assigned (Active)'}
                </span>
              </div>
            </div>

            {/* Customer & Route Details */}
            <div className="border border-kumo-line rounded-lg p-3.5 space-y-2 bg-kumo-canvas">
              <h4 className="font-semibold text-kumo-strong text-xs uppercase tracking-wider text-[11px]">
                Customer & Destination Route
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-kumo-subtle text-[11px] block">Recipient Name</span>
                  <span className="font-semibold text-kumo-strong">{previewOrder.customer_name}</span>
                </div>
                <div>
                  <span className="text-kumo-subtle text-[11px] block">Phone Contact</span>
                  <a
                    href={`tel:${previewOrder.phone}`}
                    className="inline-flex items-center gap-1 font-semibold text-kumo-strong hover:underline"
                  >
                    <Phone className="w-3 h-3 text-kumo-subtle" />
                    <span>{previewOrder.phone}</span>
                  </a>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-kumo-subtle text-[11px] block">Drop-off Address</span>
                  <p className="text-kumo-strong font-medium mt-0.5">{previewOrder.address}</p>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(previewOrder.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium mt-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Open in Google Maps for Navigation</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Kitchen Food Package */}
            <div className="border border-kumo-line rounded-lg p-3.5 space-y-2 bg-kumo-canvas">
              <h4 className="font-semibold text-kumo-strong text-xs uppercase tracking-wider text-[11px]">
                Kitchen Packaged Items
              </h4>
              <p className="text-kumo-strong font-medium text-xs">
                {previewOrder.items_summary || 'Smokey Hut Kitchen Meal Pack'}
              </p>
              {previewOrder.notes && (
                <div className="p-2.5 bg-muted/20 border border-kumo-line rounded text-[11px] text-kumo-strong">
                  <span className="font-semibold text-kumo-subtle block mb-0.5">Kitchen Special Instructions:</span>
                  {previewOrder.notes}
                </div>
              )}
            </div>

            {/* Financial Commission & Billing */}
            <div className="border border-kumo-line rounded-lg p-3.5 space-y-2 bg-kumo-canvas">
              <h4 className="font-semibold text-kumo-strong text-xs uppercase tracking-wider text-[11px]">
                Trip Commission & Payment Status
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-kumo-subtle text-[11px] block">Trip Fee Earned</span>
                  <span className="font-bold text-sm text-kumo-strong font-mono">
                    {formatNaira(previewOrder.delivery_fee)}
                  </span>
                </div>
                <div>
                  <span className="text-kumo-subtle text-[11px] block">Payment Mode</span>
                  <span className="font-medium text-kumo-strong">
                    {previewOrder.payment_mode === 'cod' ? `COD (${formatNaira(previewOrder.cod_amount || 0)})` : 'Online Prepaid'}
                  </span>
                </div>
                <div>
                  <span className="text-kumo-subtle text-[11px] block">Settlement Status</span>
                  <span className="font-medium text-kumo-strong">
                    {previewOrder.status === 'delivered' ? 'Settled to Wallet' : 'Pending Completion'}
                  </span>
                </div>
              </div>

              {/* Third-Party receipt proof if available */}
              {previewOrder.fee_evidence_path && (
                <div className="pt-2 border-t border-kumo-line mt-2">
                  <span className="text-kumo-subtle text-[11px] block mb-1 font-medium">Attached Courier Receipt Proof:</span>
                  <div className="max-w-xs border border-kumo-line rounded-lg overflow-hidden">
                    <img
                      src={previewOrder.fee_evidence_path}
                      alt="Courier Receipt"
                      className="w-full h-auto object-cover max-h-48"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions in Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-kumo-line">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewOrder(null)}
              >
                Close
              </Button>
              {previewOrder.status !== 'delivered' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const target = previewOrder
                      setPreviewOrder(null)
                      handleOpenDecline(target)
                    }}
                    className="text-rose-600 hover:border-rose-300"
                  >
                    Decline Order
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const target = previewOrder
                      setPreviewOrder(null)
                      setConfirmDeliveryTarget(target)
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    Confirm Delivered
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DECLINE DELIVERY (Spec 4.4)                            */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        isOpen={declineTargetOrder !== null}
        onClose={() => setDeclineTargetOrder(null)}
        title="Decline Delivery Order"
        maxWidth="md"
      >
        <div className="space-y-4 font-sans text-xs">
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-amber-800 dark:text-amber-200">
            <p className="font-semibold">
              Declining Order #{declineTargetOrder?.order_ref}
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 font-normal">
              This order will return to the central Logistics Dispatch Board under <em>Awaiting Assignment</em> for re-dispatch to another fleet rider or 3PL courier.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-kumo-strong mb-1.5">
              Reason for Declining:
            </label>
            <select
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="w-full text-xs bg-kumo-canvas text-kumo-strong border border-kumo-line rounded-lg p-2.5 font-medium focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <option value="Bike mechanical issue / flat tire">Bike mechanical issue / flat tire</option>
              <option value="Outside current delivery zone">Outside current operational delivery zone</option>
              <option value="Delivery bag at full capacity">Delivery bag at full capacity / overloaded</option>
              <option value="Severe weather / impassable road">Severe weather / impassable flooded road</option>
              <option value="Personal / health emergency">Personal / health emergency</option>
              <option value="Other / custom reason">Other reason (describe below)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-kumo-strong mb-1.5">
              Additional Dispatch Notes (Optional):
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Chain snapped on Lekki-Ikoyi link bridge, waiting for repair..."
              value={customDeclineNotes}
              onChange={(e) => setCustomDeclineNotes(e.target.value)}
              className="w-full text-xs bg-kumo-canvas text-kumo-strong border border-kumo-line rounded-lg p-2.5 focus:outline-hidden focus:ring-1 focus:ring-primary placeholder:text-kumo-subtle/70 font-normal"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-kumo-line">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeclineTargetOrder(null)}
            >
              Keep Assignment
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDecline}
            >
              Confirm Decline
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CONFIRM DELIVERY HANDOVER (Spec 4.3)                   */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        isOpen={confirmDeliveryTarget !== null}
        onClose={() => setConfirmDeliveryTarget(null)}
        title="Confirm Customer Handover"
        maxWidth="md"
      >
        <div className="space-y-4 font-sans text-xs">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl text-emerald-800 dark:text-emerald-200">
            <h4 className="font-bold text-sm">
              Deliver Order #{confirmDeliveryTarget?.order_ref}?
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 font-normal">
              Customer: <strong>{confirmDeliveryTarget?.customer_name}</strong> ({confirmDeliveryTarget?.phone})
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5 font-normal">
              Address: {confirmDeliveryTarget?.address}
            </p>
          </div>

          <div className="p-3 bg-kumo-canvas border border-kumo-line rounded-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="text-kumo-subtle font-normal">Commission Credited:</span>
              <span className="font-bold text-emerald-600 text-sm">
                +{formatNaira(confirmDeliveryTarget?.delivery_fee || 0)}
              </span>
            </div>
            <p className="text-[11px] text-kumo-subtle mt-1 font-normal">
              The fee will be auto-credited to your outstanding wallet balance and moved to your Delivered Orders archive.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-kumo-line">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeliveryTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => confirmDeliveryTarget && handleConfirmDelivered(confirmDeliveryTarget)}
            >
              Confirm Delivered
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default RiderDashboardPage
