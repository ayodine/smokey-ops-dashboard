import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { ScheduledOrder } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { KumoTabs } from '@/components/ui/Tabs'
import { Tooltip } from '@/components/ui/Tooltip'
import { type DateRange, isWithinDateRange } from '@/components/ui/DateRangePicker'
import { formatNaira, formatDate } from '@/lib/utils'
import { Dialog } from '@/components/ui/Dialog'
import { 
  CalendarDays, 
  Clock, 
  Send, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  Play,
  ArrowUpRight,
  Truck,
  Eye
} from 'lucide-react'

export const DeliverySchedulePage: React.FC = () => {
  const { scheduledOrders, startScheduledOrder, autoReleaseDuePreOrders } = useSmokeyOps()
  const [releaseFeedback, setReleaseFeedback] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const [selectedScheduledOrder, setSelectedScheduledOrder] = useState<ScheduledOrder | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const handleOpenDetails = (o: ScheduledOrder) => {
    setSelectedScheduledOrder(o)
    setIsDetailsModalOpen(true)
  }

  const activeOrdersForKPI = useMemo(() => {
    if (!dateRange) return scheduledOrders
    return scheduledOrders.filter(o => isWithinDateRange(o.scheduled_delivery_at, dateRange))
  }, [scheduledOrders, dateRange])

  const filteredOrders = activeOrdersForKPI

  const totalScheduled = activeOrdersForKPI.length
  const readyToStartCount = activeOrdersForKPI.filter(o => o.can_start_schedule).length
  const queuedCount = activeOrdersForKPI.filter(o => o.order_status === 'in_queue').length

  const handleAutoReleaseAll = () => {
    const count = autoReleaseDuePreOrders()
    if (count > 0) {
      setReleaseFeedback(`Released ${count} due order(s) directly to the Kitchen Packaging Queue.`)
    } else {
      setReleaseFeedback("All orders are currently outside their preparation lead-time window.")
    }
    setTimeout(() => setReleaseFeedback(null), 4000)
  }

  const columns: ColumnDef<ScheduledOrder>[] = [
    {
      key: 'order_ref',
      header: 'Order Ref',
      accessor: (o) => <span className="font-medium text-xs text-kumo-strong font-sans">{o.order_ref}</span>,
      sortValue: (o) => o.order_ref,
    },
    {
      key: 'customer_name',
      header: 'Customer',
      accessor: (o) => (
        <div>
          <div className="font-semibold text-kumo-strong font-sans">{o.customer_name}</div>
          <div className="text-xs text-kumo-subtle flex items-center gap-1 font-sans">
            <Phone className="w-3 h-3" /> {o.phone}
          </div>
        </div>
      ),
      sortValue: (o) => o.customer_name,
    },
    {
      key: 'address',
      header: 'Delivery Zone',
      accessor: (o) => (
        <span className="text-xs text-kumo-default max-w-xs truncate font-sans">
          {o.address}
        </span>
      ),
    },
    {
      key: 'scheduled_delivery_at',
      header: 'Scheduled Slot',
      accessor: (o) => (
        <span className="text-xs font-medium text-kumo-strong font-sans">{formatDate(o.scheduled_delivery_at)}</span>
      ),
      sortValue: (o) => o.scheduled_delivery_at,
    },
    {
      key: 'total_amount',
      header: 'Order Amount',
      accessor: (o) => <span className="font-medium text-kumo-strong font-sans">{formatNaira(o.total_amount)}</span>,
      sortValue: (o) => o.total_amount,
    },
    {
      key: 'delivery_fee',
      header: 'Delivery Fee',
      accessor: (o) => <span className="text-xs font-medium text-emerald-600 font-sans">{formatNaira(o.delivery_fee)}</span>,
      sortValue: (o) => o.delivery_fee,
    },
    {
      key: 'status',
      header: 'Schedule State',
      accessor: (o) => {
        const statusMap = {
          payment_confirmed: { status: 'pending' as const, label: 'scheduled pre-order' },
          in_queue: { status: 'active' as const, label: 'released to kitchen' },
          dispatched: { status: 'active' as const, label: 'dispatched' },
        }
        const s = statusMap[o.order_status] || { status: 'pending' as const, label: o.order_status.toLowerCase() }
        return <StatusBadge status={s.status} label={s.label} />
      },
      sortValue: (o) => o.order_status,
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 260,
      accessor: (o) => (
        <div onClick={e => e.stopPropagation()} className="shrink-0 flex items-center gap-1.5">
          <Tooltip content="View scheduled pre-order details and timeline">
            <TableActionButton
              variant="outline"
              onClick={() => handleOpenDetails(o)}
              leftIcon={<Eye className="w-3.5 h-3.5 text-zinc-500" />}
            >
              Details
            </TableActionButton>
          </Tooltip>

          {o.order_status === 'in_queue' ? (
            <Tooltip content="Open Kitchen Packaging Execution & Pack Queue table">
              <Link
                to="/production/packaging"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 rounded-lg transition-colors group font-sans whitespace-nowrap shrink-0 shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>In Packaging Queue</span>
                <ArrowUpRight className="w-3 h-3 text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
              </Link>
            </Tooltip>
          ) : o.order_status === 'dispatched' ? (
            <Tooltip content="View live dispatch status on logistics board">
              <Link
                to="/logistics/board"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300 rounded-lg transition-colors group font-sans whitespace-nowrap shrink-0 shadow-2xs"
              >
                <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Track Dispatch</span>
                <ArrowUpRight className="w-3 h-3 text-blue-500 opacity-60 group-hover:opacity-100 transition-opacity" />
              </Link>
            </Tooltip>
          ) : (
            <Tooltip content="Send scheduled order to kitchen packaging queue">
              <TableActionButton
                variant="primary"
                icon={<Play className="fill-current" />}
                iconStrokeWidth={2}
                onClick={() => startScheduledOrder(o.id)}
              >
                Send to Kitchen
              </TableActionButton>
            </Tooltip>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Delivery Schedule & Pre-Orders"
        subtitle="Multi-day delivery scheduling for advance corporate lunches, weekend feast pre-orders, and event bulk deliveries."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleAutoReleaseAll}
            leftIcon={<Play className="w-4 h-4 fill-current" />}
            className="h-10 px-4 text-sm font-medium shadow-xs"
          >
            Send Due Orders to Kitchen
          </Button>
        }
      />

      {releaseFeedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 font-sans">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{releaseFeedback}</span>
        </div>
      )}

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Scheduled Orders"
          value={totalScheduled}
          description="Advance delivery slots"
          icon={<CalendarDays className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Ready to Start Pack"
          value={readyToStartCount}
          description="Due for release today"
          icon={<Play className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Released to Packaging"
          value={queuedCount}
          description="Sent to kitchen pack table"
          icon={<CheckCircle2 className="w-4 h-4 text-blue-500" />}
        />
        <MetricCard
          title="Average Schedule Horizon"
          value="2.4 Days"
          description="Advance notice window"
          icon={<Clock className="w-4 h-4 text-amber-500" />}
        />
      </div>

      {/* Filter Tabs */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab="all"
          onChange={() => {}}
          tabs={[
            { id: 'all', label: 'All Scheduled', badge: totalScheduled },
          ]}
        />
      </div>

      {/* Table */}
      <DataTable
        data={filteredOrders}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search scheduled customer or reference..."
        title="Scheduled Delivery Order"
        exportFilename="smokey-delivery-schedules"
        onDateRangeChange={setDateRange}
        onRowClick={(o) => handleOpenDetails(o)}
      />

      {/* Scheduled Order Details Modal */}
      {selectedScheduledOrder && (
        <Dialog
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Scheduled Order: ${selectedScheduledOrder.order_ref}`}
          description="Customer pre-order details, delivery schedule, and kitchen dispatch timing."
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
              {selectedScheduledOrder.order_status === 'payment_confirmed' && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    startScheduledOrder(selectedScheduledOrder.id)
                    setIsDetailsModalOpen(false)
                  }}
                >
                  Send to Kitchen
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-4 font-sans">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs">
              <div className="p-4 space-y-3">
                <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block">
                  Customer & Delivery Schedule
                </span>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Customer Name</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{selectedScheduledOrder.customer_name}</span>
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Phone Number</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-mono">{selectedScheduledOrder.phone}</span>
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Delivery Address</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedScheduledOrder.address}</span>
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Scheduled Delivery Slot</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{formatDate(selectedScheduledOrder.scheduled_delivery_at)}</span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block">
                  Order Value & Status
                </span>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Order Total</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold font-mono">{formatNaira(selectedScheduledOrder.total_amount)}</span>
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Delivery Fee Paid</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold font-mono text-emerald-600">{formatNaira(selectedScheduledOrder.delivery_fee)}</span>
                </div>
                <div className="flex items-start text-[13px]">
                  <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Schedule State</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-medium capitalize">{selectedScheduledOrder.order_status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
export default DeliverySchedulePage
