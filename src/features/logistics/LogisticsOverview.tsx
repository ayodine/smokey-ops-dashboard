import React, { useState } from 'react'
import { INITIAL_DISPATCH_QUEUE, INITIAL_SHIPMENTS } from '@/lib/mockData'
import { DispatchItem, Shipment } from '@/types/logistics'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'
import { 
  Truck, 
  Send, 
  CheckCircle2, 
  ArrowRight,
  Clock
} from 'lucide-react'

export const LogisticsOverview: React.FC = () => {
  const [dispatchQueue] = useState<DispatchItem[]>(INITIAL_DISPATCH_QUEUE)
  const [shipments] = useState<Shipment[]>(INITIAL_SHIPMENTS)

  const awaitingDispatchCount = dispatchQueue.filter(d => d.status !== 'DISPATCHED').length
  const inTransitCount = shipments.filter(s => s.status === 'IN_TRANSIT').length
  const deliveredCount = shipments.filter(s => s.status === 'DELIVERED').length

  const queueColumns: ColumnDef<DispatchItem>[] = [
    {
      key: 'order_id',
      header: 'Order Ref',
      sortable: true,
      sortValue: d => d.order_id,
      accessor: d => (
        <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
          {d.order_id}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer & Zone',
      accessor: d => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
            {d.customer_name}
          </span>
          <span className="text-[10px] text-slate-400">{d.delivery_zone}</span>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Package Contents',
      accessor: d => (
        <span className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-xs block">
          {d.items_summary}
        </span>
      ),
    },
    {
      key: 'weight',
      header: 'Weight / Bags',
      align: 'right',
      accessor: d => (
        <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
          {d.weight_kg} kg ({d.package_count} pkgs)
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Dispatch State',
      defaultWidth: 160,
      accessor: d => <StatusBadge status={d.status} size="sm" />,
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-kumo-strong">
            Logistics & Fulfilment Control
          </h1>
          <p className="text-xs text-kumo-subtle mt-1 leading-relaxed">
            Real-time courier fleet dispatching, live milestone tracking, waybill manifests, and reverse logistics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/logistics/dispatch">
            <Button variant="primary" leftIcon={<Send className="w-4 h-4" />}>
              Process Dispatch Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* 4-Plate Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Awaiting Dispatch"
          value={awaitingDispatchCount}
          delta={{ value: '3 Ready for handover', isPositive: true }}
          subtext="Orders packed in thermal delivery bags"
          icon={<Send className="w-5 h-5 text-kumo-brand" />}
        />

        <MetricCard
          title="Active In-Transit"
          value={inTransitCount}
          delta={{ value: 'Fleet Riders active', isPositive: true }}
          subtext="En route to Victoria Island & Lekki"
          icon={<Truck className="w-5 h-5 text-[#f6821f]" />}
        />

        <MetricCard
          title="Delivered Today"
          value={deliveredCount}
          delta={{ value: '100% On-time delivery rate', isPositive: true }}
          subtext="Signed with digital POD confirmation"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        />

        <MetricCard
          title="Pending Returns (RMA)"
          value="1"
          subtext="Inspected and restocked without spoilage"
          icon={<Clock className="w-5 h-5 text-purple-500" />}
        />
      </div>

      <DataTable
        title="Live Fulfillment and Dispatch Queue"
        data={dispatchQueue}
        columns={queueColumns}
        keyExtractor={d => d.id}
        searchablePlaceholder="Search orders, customers, or zones..."
        secondaryAction={{
          label: 'Export Queue',
          onClick: () => {},
        }}
        searchFilter={(d, q) =>
          d.order_id.toLowerCase().includes(q) ||
          d.customer_name.toLowerCase().includes(q) ||
          d.delivery_zone.toLowerCase().includes(q)
        }
      />
    </div>
  )
}
