import React, { useState, useMemo } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { LogisticsDelivery } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { KumoTabs } from '@/components/ui/Tabs'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
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
  ArrowRight
} from 'lucide-react'

export const RiderDashboardPage: React.FC = () => {
  const {
    riders,
    logisticsDeliveries,
    markDelivered,
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

  // Active trips assigned to this rider
  const activeOrders = useMemo(() => {
    return riderDeliveries.filter(
      d => d.status === 'assigned' || d.status === 'in_transit' || d.status === 'out_for_delivery'
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

  const handleConfirmDelivered = (order: LogisticsDelivery) => {
    markDelivered(order.id)
    setConfirmDeliveryTarget(null)
  }

  // Clean Tab configuration (No icons in front of labels, per user requirement)
  const tabs = [
    {
      id: 'assigned',
      label: 'Assigned Orders',
      badge: activeOrders.length > 0 ? activeOrders.length : undefined,
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
  const activeFees = activeOrders.reduce((sum, o) => sum + o.delivery_fee, 0)
  const activeCodTotal = activeOrders.reduce(
    (sum, o) => sum + (o.payment_mode === 'cod' ? (o.cod_amount || 0) : 0),
    0
  )
  const totalCompletedTrips = currentRider?.total_completed ?? 362
  const deliveredFeesTotal = completedOrders.reduce((sum, o) => sum + o.delivery_fee, 0)
  const lifetimeEarned = currentRider?.lifetime_earnings ?? 1183000
  const pendingPayoutBalance = currentRider?.pending_payout ?? 0

  // -----------------------------------------------------------------
  // TABLE COLUMNS: 1. ASSIGNED ORDERS
  // -----------------------------------------------------------------
  const assignedColumns: ColumnDef<LogisticsDelivery>[] = [
    {
      key: 'order_ref',
      header: 'Order Ref',
      accessor: (d) => (
        <div>
          <span className="font-bold text-xs text-kumo-strong font-sans">
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
      accessor: (d) => (
        <div className="font-sans">
          <div className="font-semibold text-xs text-kumo-strong">{d.customer_name}</div>
          <a
            href={`tel:${d.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium mt-0.5"
          >
            <Phone className="w-3 h-3 text-primary" />
            <span>{d.phone}</span>
          </a>
        </div>
      ),
      sortValue: (d) => d.customer_name,
    },
    {
      key: 'address',
      header: 'Delivery Address & Route',
      accessor: (d) => (
        <div className="max-w-xs font-sans">
          <p className="text-xs text-kumo-default font-normal leading-snug truncate" title={d.address}>
            {d.address}
          </p>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(d.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium mt-0.5"
          >
            <MapPin className="w-3 h-3 text-amber-500" />
            <span>Navigate Maps</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      ),
      sortValue: (d) => d.address,
    },
    {
      key: 'items_summary',
      header: 'Kitchen Pack Items',
      accessor: (d) => (
        <div className="max-w-xs font-sans">
          <div className="text-xs text-kumo-strong font-normal truncate" title={d.items_summary}>
            {d.items_summary || 'Standard Meal Package'}
          </div>
          {d.notes && (
            <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium truncate mt-0.5" title={d.notes}>
              Note: {d.notes}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'payment',
      header: 'Payment Mode',
      accessor: (d) => (
        <div className="font-sans">
          {d.payment_mode === 'cod' ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800">
              COD: {formatNaira(d.cod_amount || 0)}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800">
              Online Prepaid
            </span>
          )}
        </div>
      ),
      sortValue: (d) => d.payment_mode || 'online',
    },
    {
      key: 'delivery_fee',
      header: 'Trip Fee',
      accessor: (d) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 font-sans">
          +{formatNaira(d.delivery_fee)}
        </span>
      ),
      sortValue: (d) => d.delivery_fee,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (d) => {
        const isOut = d.status === 'out_for_delivery'
        return (
          <StatusBadge
            status={isOut ? 'pending' : 'pending'}
            label={isOut ? 'Out for delivery' : 'Assigned to you'}
          />
        )
      },
      sortValue: (d) => d.status,
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (d) => (
        <div className="flex items-center gap-1.5 font-sans" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenDecline(d)}
            className="h-7 px-2 text-xs font-medium text-kumo-subtle hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800"
          >
            Decline
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setConfirmDeliveryTarget(d)}
            className="h-7 px-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            Confirm Delivered
          </Button>
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
      accessor: (d) => (
        <span className="text-xs font-medium text-kumo-strong font-sans">
          {d.delivered_at || `${d.dispatch_date} (Completed)`}
        </span>
      ),
      sortValue: (d) => d.delivered_at || d.dispatch_date,
    },
    {
      key: 'order_ref',
      header: 'Order Ref',
      accessor: (d) => (
        <span className="font-bold text-xs text-kumo-strong font-sans">
          #{d.order_ref}
        </span>
      ),
      sortValue: (d) => d.order_ref,
    },
    {
      key: 'customer',
      header: 'Customer',
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
      header: 'Delivery Location',
      accessor: (d) => (
        <span className="text-xs text-kumo-default font-normal max-w-xs truncate block font-sans" title={d.address}>
          {d.address}
        </span>
      ),
      sortValue: (d) => d.address,
    },
    {
      key: 'items_summary',
      header: 'Package Items',
      accessor: (d) => (
        <span className="text-xs text-kumo-subtle font-normal max-w-xs truncate block font-sans" title={d.items_summary}>
          {d.items_summary || 'Smokey meal package'}
        </span>
      ),
    },
    {
      key: 'delivery_fee',
      header: 'Trip Fee Earned',
      accessor: (d) => (
        <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 font-sans">
          +{formatNaira(d.delivery_fee)}
        </span>
      ),
      sortValue: (d) => d.delivery_fee,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: () => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-sans">
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
      accessor: (d) => (
        <span className="text-xs font-medium text-kumo-strong font-sans">
          {d.delivered_at ? d.delivered_at.substring(0, 10) : d.dispatch_date}
        </span>
      ),
      sortValue: (d) => d.delivered_at || d.dispatch_date,
    },
    {
      key: 'order_ref',
      header: 'Order Ref',
      accessor: (d) => (
        <span className="font-bold text-xs text-kumo-strong font-sans">
          #{d.order_ref}
        </span>
      ),
      sortValue: (d) => d.order_ref,
    },
    {
      key: 'customer',
      header: 'Customer Destination',
      accessor: (d) => (
        <div className="font-sans">
          <div className="font-medium text-xs text-kumo-strong">{d.customer_name}</div>
          <div className="text-[11px] text-kumo-subtle font-normal truncate max-w-xs" title={d.address}>
            {d.address}
          </div>
        </div>
      ),
      sortValue: (d) => d.customer_name,
    },
    {
      key: 'payment_mode',
      header: 'Payment Type',
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
      accessor: (d) => (
        <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 font-sans">
          +{formatNaira(d.delivery_fee)}
        </span>
      ),
      sortValue: (d) => d.delivery_fee,
    },
    {
      key: 'status',
      header: 'Settlement Status',
      accessor: () => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800 font-sans">
          <Check className="w-3 h-3" />
          Settled (₦0.00 Owed)
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header (Matches SuppliersPage and other pages) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-kumo-strong">
            Rider Operations Portal
          </h1>
          <p className="text-xs text-kumo-subtle mt-1 leading-relaxed">
            Order fulfillment queue, trip milestones, proof of delivery, and earnings ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-9 px-3 text-xs font-medium text-kumo-subtle hover:text-kumo-strong"
            leftIcon={<RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI METRIC CARDS (Contextual to active tab) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* TAB 1: ASSIGNED ORDERS METRICS */}
        {activeTab === 'assigned' && (
          <>
            <MetricCard
              title="Active Assignments"
              value={`${activeOrders.length} ${activeOrders.length === 1 ? 'Trip' : 'Trips'}`}
              description="Orders in dispatch or transit"
              icon={<Bike className="w-4 h-4 text-primary" />}
            />
            <MetricCard
              title="Potential Fee Earning"
              value={formatNaira(activeFees)}
              description="Trip earnings upon completion"
              icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
            />
            <MetricCard
              title="Kitchen Packing Queue"
              value={`${activeOrders.filter(o => o.status === 'assigned').length} Pending`}
              description="Awaiting food bag collection"
              icon={<Clock className="w-4 h-4 text-amber-500" />}
            />
            <MetricCard
              title="Cash on Delivery (COD)"
              value={formatNaira(activeCodTotal)}
              description="Cash meal bills to collect"
              icon={<Receipt className="w-4 h-4 text-rose-500" />}
            />
          </>
        )}

        {/* TAB 2: DELIVERED ORDERS METRICS */}
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

        {/* TAB 3: EARNINGS & WALLET METRICS */}
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
              data={activeOrders}
              columns={assignedColumns}
              searchable={true}
              searchPlaceholder="Search order ref, customer, phone, address..."
              enableDateFilter={true}
              exportFilename="smokey-rider-assigned-orders"
              emptyMessage="No active trip assignments found. When kitchen dispatch assigns an order, it will appear here."
            />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: DELIVERED ORDERS TABLE                                 */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'delivered' && (
          <div className="space-y-4">
            <DataTable
              data={completedOrders}
              columns={deliveredColumns}
              searchable={true}
              searchPlaceholder="Search delivered order ref, customer, address..."
              enableDateFilter={true}
              exportFilename="smokey-rider-delivered-history"
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
              data={completedOrders}
              columns={earningsColumns}
              searchable={true}
              searchPlaceholder="Search trip earnings by order #, customer, address..."
              enableDateFilter={true}
              exportFilename="smokey-rider-earnings-ledger"
              emptyMessage="No trip earnings found matching criteria."
            />

            {/* RBAC Policy Notice */}
            <div className="bg-kumo-surface border border-kumo-line rounded-xl p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-kumo-strong">
                    Financial Clearing Policy (RBAC: can_clear_payment = false)
                  </span>
                  <p className="text-kumo-subtle mt-0.5 font-normal leading-relaxed">
                    Fleet delivery commissions are cleared and disbursed directly by Store Management and Logistics Dispatch. Self-clearing is strictly restricted to maintain financial integrity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
