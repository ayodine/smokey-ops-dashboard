import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { ScheduledOrder } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { KumoTabs } from '@/components/ui/Tabs'
import { Tooltip } from '@/components/ui/Tooltip'
import { type DateRange, isWithinDateRange } from '@/components/ui/DateRangePicker'
import { formatNaira, formatDate } from '@/lib/utils'
import { 
  CalendarDays, 
  Clock, 
  Send, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  Play,
  ArrowUpRight 
} from 'lucide-react'

export const DeliverySchedulePage: React.FC = () => {
  const { scheduledOrders, startScheduledOrder, autoReleaseDuePreOrders } = useSmokeyOps()
  const [filterMode, setFilterMode] = useState<'all' | 'ready_to_start'>('all')
  const [releaseFeedback, setReleaseFeedback] = useState<string | null>(null)

  const [dateRange, setDateRange] = useState<DateRange | null>(null)

  const filteredOrders = filterMode === 'all' 
    ? scheduledOrders 
    : scheduledOrders.filter(o => o.can_start_schedule)

  const activeOrdersForKPI = useMemo(() => {
    if (!dateRange) return scheduledOrders
    return scheduledOrders.filter(o => isWithinDateRange(o.scheduled_delivery_at, dateRange))
  }, [scheduledOrders, dateRange])

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
          payment_confirmed: { status: 'pending' as const, label: 'SCHEDULED PRE-ORDER' },
          in_queue: { status: 'active' as const, label: 'RELEASED TO KITCHEN' },
          dispatched: { status: 'active' as const, label: 'DISPATCHED' },
        }
        const s = statusMap[o.order_status] || { status: 'pending' as const, label: o.order_status.toUpperCase() }
        return <StatusBadge status={s.status} label={s.label} />
      },
      sortValue: (o) => o.order_status,
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 180,
      accessor: (o) => (
        <div onClick={e => e.stopPropagation()} className="shrink-0 flex items-center gap-2">
          {o.can_start_schedule ? (
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
          ) : (
            <Tooltip content="Open Kitchen Packaging Execution & Pack Queue table">
              <Link
                to="/production/packaging"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400 rounded-lg transition-colors group font-sans whitespace-nowrap shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>In Packaging Queue</span>
                <ArrowUpRight className="w-3 h-3 text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
              </Link>
            </Tooltip>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-kumo-strong">
            Delivery Schedule & Pre-Orders
          </h1>
          <p className="text-xs text-kumo-subtle mt-1 leading-relaxed">
            Multi-day delivery scheduling for advance corporate lunches, weekend feast pre-orders, and event bulk deliveries.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={handleAutoReleaseAll}
            leftIcon={<Play className="w-4 h-4 fill-current" />}
            className="h-10 px-4 text-sm font-medium shadow-xs"
          >
            Send Due Orders to Kitchen
          </Button>
        </div>
      </div>

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
          activeTab={filterMode}
          onChange={(val: string) => setFilterMode(val as any)}
          tabs={[
            { id: 'all', label: 'All Scheduled', badge: totalScheduled },
            { id: 'ready_to_start', label: 'Ready to Send', badge: readyToStartCount },
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
      />
    </div>
  )
}
export default DeliverySchedulePage
