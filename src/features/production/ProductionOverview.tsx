import React, { useState } from 'react'
import { INITIAL_PRODUCTION_ORDERS } from '@/lib/mockData'
import { ProductionOrder } from '@/types/production'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { Link } from 'react-router-dom'
import { 
  Factory, 
  Flame, 
  CheckCircle2, 
  CalendarDays,
  Plus
} from 'lucide-react'

export const ProductionOverview: React.FC = () => {
  const [orders] = useState<ProductionOrder[]>(INITIAL_PRODUCTION_ORDERS)

  const inProductionCount = orders.filter(o => o.status === 'IN_PRODUCTION').length
  const plannedCount = orders.filter(o => o.status === 'PLANNED' || o.status === 'MATERIALS_RESERVED').length
  const totalProducedUnits = orders.reduce((acc, o) => acc + (o.actual_quantity_produced || 0), 0)
  const totalScrapUnits = orders.reduce((acc, o) => acc + (o.scrap_quantity || 0), 0)
  const averageYield = totalProducedUnits + totalScrapUnits > 0
    ? Math.round((totalProducedUnits / (totalProducedUnits + totalScrapUnits)) * 100)
    : 95

  const columns: ColumnDef<ProductionOrder>[] = [
    {
      key: 'order_code',
      header: 'Batch Order ID',
      sortable: true,
      sortValue: o => o.order_code,
      accessor: o => (
        <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
          {o.order_code}
        </span>
      ),
    },
    {
      key: 'finished_product_name',
      header: 'Target Product',
      sortable: true,
      sortValue: o => o.finished_product_name,
      accessor: o => (
        <div className="flex flex-col max-w-xs">
          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
            {o.finished_product_name}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">{o.finished_product_sku}</span>
        </div>
      ),
    },
    {
      key: 'work_center',
      header: 'Work Center',
      accessor: o => (
        <div className="flex items-center gap-1 font-mono text-xs text-slate-700 dark:text-slate-300">
          <Flame className="w-3.5 h-3.5 text-[#F38020]" />
          <span>{o.work_center}</span>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Planned / Actual Yield',
      align: 'right',
      sortable: true,
      sortValue: o => o.planned_quantity,
      accessor: o => (
        <div className="flex flex-col text-right font-mono text-xs">
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {o.actual_quantity_produced > 0 ? o.actual_quantity_produced : o.planned_quantity} {o.uom}
          </span>
          <span className="text-[10px] text-slate-400">Target: {o.planned_quantity}</span>
        </div>
      ),
    },
    {
      key: 'operator',
      header: 'Assigned Operator',
      accessor: o => (
        <span className="text-xs text-slate-700 dark:text-slate-300">{o.assigned_operator_name}</span>
      ),
    },
    {
      key: 'status',
      header: 'Lifecycle Status',
      defaultWidth: 160,
      accessor: o => <StatusBadge status={o.status} size="sm" />,
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Production Management"
        subtitle="Assembly line scheduling, smoke cycle tracking, recipe material allocations, and batch yield controls."
        actions={
          <Link to="/production/orders">
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              Launch Production Run
            </Button>
          </Link>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Grill Runs (WIP)"
          value={inProductionCount}
          delta={{ value: '2 Grills Active', isPositive: true }}
          subtext="Batches currently undergoing cooking cycle"
          icon={<Flame className="w-5 h-5 text-[#f6821f]" />}
        />

        <MetricCard
          title="Completed Today"
          value={`${totalProducedUnits} units`}
          delta={{ value: '+48 units this shift', isPositive: true }}
          subtext="Inspected and received into finished stock"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        />

        <MetricCard
          title="Average Batch Yield"
          value={`${averageYield}%`}
          delta={{ value: `Scrap: ${totalScrapUnits} units`, isNeutral: true }}
          subtext="Target standard yield is 94%"
          icon={<Factory className="w-5 h-5 text-kumo-brand" />}
        />

        <MetricCard
          title="Queued Batches"
          value={plannedCount}
          subtext="Materials reserved & staged for next shift"
          icon={<CalendarDays className="w-5 h-5 text-indigo-500" />}
        />
      </div>

      <DataTable
        title="Active Production Schedules and Batches"
        data={orders}
        columns={columns}
        keyExtractor={o => o.id}
        searchablePlaceholder="Search by batch ID, product, or oven supervisor..."
        secondaryAction={{
          label: 'Export Batches',
          onClick: () => {},
        }}
        searchFilter={(o, q) =>
          o.order_code.toLowerCase().includes(q) ||
          o.finished_product_name.toLowerCase().includes(q) ||
          o.assigned_operator_name.toLowerCase().includes(q) ||
          o.work_center.toLowerCase().includes(q)
        }
      />
    </div>
  )
}
