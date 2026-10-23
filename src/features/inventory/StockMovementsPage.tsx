import React, { useState, useMemo } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { SalesMovement } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { type DateRange, isWithinDateRange } from '@/components/ui/DateRangePicker'
import { formatNaira, formatQuantity, formatDate } from '@/lib/utils'
import { 
  Layers, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RotateCcw, 
  Activity, 
  Filter 
} from 'lucide-react'

export const StockMovementsPage: React.FC = () => {
  const { salesMovements } = useSmokeyOps()
  const [filterType, setFilterType] = useState<string>('all')

  const filteredMovements = useMemo(() => {
    if (filterType === 'all') return salesMovements
    return salesMovements.filter(m => m.movement_type === filterType)
  }, [salesMovements, filterType])

  const [dateRange, setDateRange] = useState<DateRange | null>(null)

  const activeMovementsForKPI = useMemo(() => {
    if (!dateRange) return salesMovements
    return salesMovements.filter(m => isWithinDateRange(m.created_at, dateRange))
  }, [salesMovements, dateRange])

  const totalMovements = activeMovementsForKPI.length
  const totalProductionDeposits = activeMovementsForKPI
    .filter(m => m.movement_type === 'production_output')
    .reduce((acc, m) => acc + m.quantity, 0)
  const totalSalesDispatched = activeMovementsForKPI
    .filter(m => m.movement_type === 'sale')
    .reduce((acc, m) => acc + Math.abs(m.quantity), 0)
  const totalReversals = activeMovementsForKPI
    .filter(m => m.movement_type === 'adjustment' || m.movement_type === 'waste')
    .length

  const columns: ColumnDef<SalesMovement>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      accessor: (m) => <span className="text-xs text-kumo-subtle font-sans">{formatDate(m.created_at)}</span>,
      sortValue: (m) => m.created_at,
    },
    {
      key: 'product_name',
      header: 'Product / Item',
      accessor: (m) => (
        <div>
          <div className="font-medium text-kumo-strong font-sans">{m.product_name}</div>
          <div className="text-[11px] text-kumo-subtle font-sans">{m.sku}</div>
        </div>
      ),
      sortValue: (m) => m.product_name,
    },
    {
      key: 'movement_type',
      header: 'Movement Type',
      accessor: (m) => {
        const badgeMap: Record<string, { status: 'active' | 'pending' | 'inactive'; label: string }> = {
          production_output: { status: 'active', label: 'batch yield' },
          sale: { status: 'pending', label: 'customer sale' },
          adjustment: { status: 'pending', label: 'adjustment' },
          waste: { status: 'inactive', label: 'scrap / waste' },
          reversal: { status: 'inactive', label: 'reversal' },
        }
        const b = badgeMap[m.movement_type] || { status: 'pending', label: m.movement_type.toLowerCase().replace(/_/g, ' ') }
        return <StatusBadge status={b.status} label={b.label} />
      },
      sortValue: (m) => m.movement_type,
    },
    {
      key: 'location',
      header: 'Inventory Bin',
      accessor: (m) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-sans bg-kumo-surface text-kumo-default border border-kumo-line uppercase whitespace-nowrap shrink-0">
          {m.location}
        </span>
      ),
      sortValue: (m) => m.location,
    },
    {
      key: 'quantity',
      header: 'Quantity Delta',
      accessor: (m) => (
        <span className={`font-medium font-sans ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.unit}
        </span>
      ),
      sortValue: (m) => m.quantity,
    },
    {
      key: 'balance_after',
      header: 'Balance After',
      accessor: (m) => <span className="text-xs font-medium text-kumo-strong font-sans">{formatQuantity(m.balance_after)} {m.unit}</span>,
      sortValue: (m) => m.balance_after,
    },
    {
      key: 'value_amount',
      header: 'Total Value',
      accessor: (m) => <span className="text-xs font-medium text-kumo-default font-sans">{formatNaira(m.value_amount)}</span>,
      sortValue: (m) => m.value_amount,
    },
    {
      key: 'notes',
      header: 'Reason / Ref',
      accessor: (m) => <span className="text-xs text-kumo-default">{m.notes}</span>,
    },
    {
      key: 'user_name',
      header: 'Recorded By',
      accessor: (m) => <span className="text-xs text-kumo-subtle">{m.user_name}</span>,
      sortValue: (m) => m.user_name,
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Sales Stock Movements Ledger"
        subtitle="Real-time ledger of finished goods additions from kitchen batches, customer order deductions, and balance sheet corrections."
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Ledger Entries"
          value={totalMovements}
          description="Activity log entries"
          icon={<Activity className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Production Yield Added"
          value={`+${totalProductionDeposits} units`}
          description="Deposited from kitchen batches"
          icon={<ArrowDownLeft className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Sales Deductions"
          value={`-${totalSalesDispatched} units`}
          description="Dispatched to customer orders"
          icon={<ArrowUpRight className="w-4 h-4 text-blue-500" />}
        />
        <MetricCard
          title="Manual Corrections"
          value={totalReversals}
          description="Audits & shrinkage entries"
          icon={<RotateCcw className="w-4 h-4 text-amber-500" />}
        />
      </div>

      {/* Filter Tabs matching Smokey-React/Tab specification */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={filterType}
          onChange={(val) => setFilterType(val as any)}
          tabs={[
            { id: 'all', label: 'All Changes', badge: totalMovements },
            { id: 'production_output', label: 'Kitchen Cooked' },
            { id: 'sale', label: 'Customer Orders' },
          ]}
        />
      </div>

      {/* DataTable */}
      <DataTable
        data={filteredMovements}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search movement notes, product, or actor..."
        title="Movement Ledger Entry"
        exportFilename="smokey-sales-movements-ledger"
        onDateRangeChange={setDateRange}
      />
    </div>
  )
}
export default StockMovementsPage
