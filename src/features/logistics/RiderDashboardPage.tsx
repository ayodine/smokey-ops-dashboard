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
import { Select } from '@/components/ui/Select'
import { formatNaira } from '@/lib/utils'
import {
  Bike,
  Phone,
  MapPin,
  ExternalLink,
  CheckCircle2,
  DollarSign,
  Receipt,
  Clock,
  RotateCcw,
  Check,
  Layers,
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
    currentAccount,
  } = useSmokeyOps()

  // Dynamically match the logged-in rider profile strictly to currentAccount
  const currentRider = useMemo(() => {
    if (!riders || riders.length === 0) return undefined
    const emailLower = (currentAccount?.email || '').toLowerCase().trim()
    const nameLower = (currentAccount?.name || '').toLowerCase().trim()
    return (
      riders.find(r => currentAccount?.rider_user_id && r.rider_user_id === currentAccount.rider_user_id) ||
      riders.find(r => r.email && r.email.toLowerCase().trim() === emailLower) ||
      riders.find(r => r.rider_name.toLowerCase().trim() === nameLower) ||
      riders[0]
    )
  }, [riders, currentAccount])

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
      d =>
        d.rider_type === 'internal' &&
        (Number(d.assigned_rider_id) === Number(currentRider.rider_user_id) ||
          (d.assigned_rider && d.assigned_rider.toLowerCase().trim() === currentRider.rider_name.toLowerCase().trim()))
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

  // Calculated metrics strictly derived from verified rider deliveries
  const assignedFees = assignedOrders.reduce((sum, o) => sum + o.delivery_fee, 0)
  const inTransitFees = inTransitOrders.reduce((sum, o) => sum + o.delivery_fee, 0)
  const totalCompletedTrips = completedOrders.length
  const deliveredFeesTotal = completedOrders.reduce((sum, o) => sum + o.delivery_fee, 0)
  const lifetimeEarned = deliveredFeesTotal
  const paidTotalBalance = Math.min(currentRider?.paid_total ?? 0, lifetimeEarned)
  const pendingPayoutBalance = Math.max(0, lifetimeEarned - paidTotalBalance)

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
            variant="primary"
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 font-sans whitespace-nowrap shrink-0">
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
      accessor: () =>
        pendingPayoutBalance > 0 ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 font-sans whitespace-nowrap shrink-0">
            <Clock className="w-3 h-3" />
            Pending Payout
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 font-sans whitespace-nowrap shrink-0">
            <Check className="w-3 h-3" />
            Settled
          </span>
        ),
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Rider Operations Portal"
        subtitle={
          currentRider
            ? `Viewing fulfillment queue, trip milestones, and wallet ledger for ${currentRider.rider_name} (${currentRider.staff_id || 'SHD-RDR-001'}).`
            : 'Order fulfillment queue, trip milestones, proof of delivery, and earnings ledger.'
        }
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
              icon={<Bike className="w-4 h-4 text-zinc-500" />}
            />
            <MetricCard
              title="Available Trip Fees"
              value={formatNaira(assignedFees)}
              description="Trip earnings upon completion"
              icon={<DollarSign className="w-4 h-4 text-zinc-500" />}
            />
            <MetricCard
              title="Payment Verification"
              value="100% Prepaid"
              description="Prepaid online before dispatch"
              icon={<CheckCircle2 className="w-4 h-4 text-zinc-500" />}
            />
            <MetricCard
              title="Duty Status"
              value={currentRider?.status === 'on_trip' ? 'On Road' : 'Available'}
              description={currentRider?.vehicle_type || 'Fleet motorbike'}
              icon={<Clock className="w-4 h-4 text-zinc-500" />}
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
              icon={<Navigation className="w-4 h-4 text-zinc-500" />}
            />
            <MetricCard
              title="Trip Fees to Earn"
              value={formatNaira(inTransitFees)}
              description="Credited upon customer handover"
              icon={<DollarSign className="w-4 h-4 text-zinc-500" />}
            />
            <MetricCard
              title="Cash Handling"
              value="₦0 (Prepaid)"
              description="Zero cash to collect or remit"
              icon={<Receipt className="w-4 h-4 text-zinc-500" />}
            />
            <MetricCard
              title="Active Load"
              value={`${inTransitOrders.length} ${inTransitOrders.length === 1 ? 'Package' : 'Packages'}`}
              description="Packages currently in delivery bag"
              icon={<Clock className="w-4 h-4 text-zinc-500" />}
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
              icon={<CheckCircle2 className="w-4 h-4 text-zinc-500" />}
            />
            <MetricCard
              title="Delivered in Ledger"
              value={`${completedOrders.length} Trips`}
              description="Historical trips recorded"
              icon={<Layers className="w-4 h-4 text-zinc-500" />}
            />
            <MetricCard
              title="Total Delivered Fees"
              value={formatNaira(deliveredFeesTotal)}
              description="Commissions from verified runs"
              icon={<DollarSign className="w-4 h-4 text-zinc-500" />}
            />
            <MetricCard
              title="On-Time Rate"
              value={totalCompletedTrips > 0 ? `${currentRider?.on_time_rate ?? 100}%` : '100%'}
              description="Verified on-time delivery rate"
              icon={<Check className="w-4 h-4 text-zinc-500" />}
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
              icon={<Receipt className="w-4 h-4 text-zinc-500" />}
            />
            <MetricCard
              title="Total Gross Earned"
              value={formatNaira(lifetimeEarned)}
              description="Cumulative gross historical earnings"
              icon={<DollarSign className="w-4 h-4 text-zinc-500" />}
            />
            <MetricCard
              title="Historically Settled"
              value={formatNaira(currentRider?.paid_total ?? 0)}
              description="Cleared to rider bank account"
              icon={<CheckCircle2 className="w-4 h-4 text-zinc-500" />}
            />
            <MetricCard
              title="This Month's Gross"
              value={formatNaira(currentRider?.earnings_month ?? 0)}
              description="Current calendar month total"
              icon={<DollarSign className="w-4 h-4 text-zinc-500" />}
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
        {/* TAB 3: DELIVERED ORDERS TABLE                                 */}
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
        {/* TAB 4: EARNINGS & WALLET TABLE                                */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'earnings' && (
          <div className="space-y-5">
            {/* Settled Ledger Banner */}
            {pendingPayoutBalance === 0 ? (
              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-zinc-900 dark:text-zinc-100">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">Account settled — outstanding balance is ₦0.00</h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed font-normal">
                      All completed trips have been disbursed and audited. Settled payment history is preserved below for your records.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-zinc-900 dark:text-zinc-100">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">Pending disbursement balance: {formatNaira(pendingPayoutBalance)}</h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed font-normal">
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
        maxWidth="2xl"
        footer={
          previewOrder && (
            <div className="flex items-center justify-between w-full">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setPreviewOrder(null)}
              >
                Close
              </Button>
              {previewOrder.status !== 'delivered' && (
                <div className="flex items-center gap-2">
                  {previewOrder.status === 'assigned' && (
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => {
                        const target = previewOrder
                        setPreviewOrder(null)
                        handleOpenDecline(target)
                      }}
                    >
                      Decline Order
                    </Button>
                  )}
                  {previewOrder.status === 'assigned' ? (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => {
                        const target = previewOrder
                        setPreviewOrder(null)
                        acceptDelivery(target.id)
                      }}
                    >
                      Accept Order
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => {
                        const target = previewOrder
                        setPreviewOrder(null)
                        setConfirmDeliveryTarget(target)
                      }}
                    >
                      Confirm Delivered
                    </Button>
                  )}
                </div>
              )}
            </div>
          )
        }
      >
        {previewOrder && (
          <div className="space-y-4 font-sans text-xs">
            {/* Master Divided Card Container */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs">
              
              {/* Section 1: Order & Timing */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Order Information
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Order Reference</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-semibold">#{previewOrder.order_ref}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Delivery Status</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                      {previewOrder.status === 'delivered'
                        ? 'Delivered'
                        : previewOrder.status === 'in_transit' || previewOrder.status === 'out_for_delivery'
                        ? 'In Transit'
                        : 'Assigned'}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Dispatched Date</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">{previewOrder.dispatch_date}</span>
                  </div>
                  {previewOrder.delivered_at && (
                    <div className="flex items-start text-[13px]">
                      <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Delivered At</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-medium">{previewOrder.delivered_at}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Customer & Route Details */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Customer & Destination Route
                  </span>
                  <a
                    href={`tel:${previewOrder.phone}`}
                    className="inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium underline underline-offset-2"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call Recipient</span>
                  </a>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Recipient Name</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{previewOrder.customer_name}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Phone Contact</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono">{previewOrder.phone}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Drop-off Address</span>
                    <div className="flex-1">
                      <span className="text-zinc-900 dark:text-zinc-100 font-medium block leading-snug">{previewOrder.address}</span>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(previewOrder.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 underline mt-1 font-medium"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Open in Google Maps for Navigation</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Kitchen Food Package */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Kitchen Packaged Items
                  </span>
                </div>
                <div className="pt-1">
                  <p className="text-zinc-900 dark:text-zinc-100 font-medium text-[13px] leading-relaxed">
                    {previewOrder.items_summary || 'Smokey Hut Kitchen Meal Pack'}
                  </p>
                  {previewOrder.notes && (
                    <div className="mt-2.5 p-2.5 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-700 dark:text-zinc-300">
                      <span className="font-semibold text-zinc-500 block mb-0.5">Special Instructions:</span>
                      {previewOrder.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Commission & Payment */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Trip Commission & Payment Status
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Trip Fee Earned</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold text-sm">
                      {formatNaira(previewOrder.delivery_fee)}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Payment Mode</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                      Prepaid Online (No Cash to Collect)
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Settlement Status</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                      {previewOrder.status === 'delivered'
                        ? pendingPayoutBalance > 0
                          ? 'Pending Rider Payout'
                          : 'Settled'
                        : 'Pending Delivery Confirmation'}
                    </span>
                  </div>

                  {previewOrder.fee_evidence_path && (
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 mt-2">
                      <span className="text-zinc-500 text-[13px] block mb-1 font-medium">Attached Courier Receipt Proof:</span>
                      <div className="max-w-xs border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                        <img
                          src={previewOrder.fee_evidence_path}
                          alt="Courier Receipt"
                          className="w-full h-auto object-cover max-h-48"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setDeclineTargetOrder(null)}
            >
              Keep Assignment
            </Button>
            <Button
              variant="destructive"
              size="md"
              onClick={handleConfirmDecline}
            >
              Confirm Decline
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 font-sans text-xs">
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-lg text-zinc-900 dark:text-zinc-100">
            <p className="font-semibold text-sm">
              Declining Order #{declineTargetOrder?.order_ref}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-normal">
              This order will return to the central Logistics Dispatch Board under <em>Awaiting Assignment</em> for re-dispatch to another fleet rider or 3PL courier.
            </p>
          </div>

          <div>
            <Select
              label="Reason for Declining"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              options={[
                { value: 'Bike mechanical issue / flat tire', label: 'Bike mechanical issue / flat tire' },
                { value: 'Outside current delivery zone', label: 'Outside current operational delivery zone' },
                { value: 'Delivery bag at full capacity', label: 'Delivery bag at full capacity / overloaded' },
                { value: 'Severe weather / impassable road', label: 'Severe weather / impassable flooded road' },
                { value: 'Personal / health emergency', label: 'Personal / health emergency' },
                { value: 'Other / custom reason', label: 'Other reason (describe below)' },
              ]}
            />
          </div>

          <div>
            <label className="block font-semibold text-kumo-strong text-xs mb-1">
              Additional Dispatch Notes (Optional):
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Chain snapped on Lekki-Ikoyi link bridge, waiting for repair..."
              value={customDeclineNotes}
              onChange={(e) => setCustomDeclineNotes(e.target.value)}
              className="w-full text-xs sm:text-sm bg-kumo-canvas text-kumo-strong border border-kumo-line rounded-lg p-2.5 focus:outline-hidden focus:ring-1 focus:ring-primary placeholder:text-kumo-subtle/70 font-normal"
            />
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
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setConfirmDeliveryTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => confirmDeliveryTarget && handleConfirmDelivered(confirmDeliveryTarget)}
            >
              Confirm Delivered
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 font-sans text-xs">
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-lg text-zinc-900 dark:text-zinc-100">
            <h4 className="font-semibold text-sm">
              Deliver Order #{confirmDeliveryTarget?.order_ref}?
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-normal">
              Customer: <strong>{confirmDeliveryTarget?.customer_name}</strong> ({confirmDeliveryTarget?.phone})
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 font-normal">
              Address: {confirmDeliveryTarget?.address}
            </p>
          </div>

          <div className="p-3 bg-kumo-canvas border border-kumo-line rounded-lg space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-kumo-subtle font-normal">Commission Credited:</span>
              <span className="font-bold text-kumo-strong font-mono text-sm">
                +{formatNaira(confirmDeliveryTarget?.delivery_fee || 0)}
              </span>
            </div>
            <p className="text-[11px] text-kumo-subtle font-normal">
              The fee will be auto-credited to your outstanding wallet balance and moved to your Delivered Orders archive.
            </p>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400 font-normal">Customer Order Bill:</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Prepaid Online (₦0 Cash to Collect)</span>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default RiderDashboardPage
