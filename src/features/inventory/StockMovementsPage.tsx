import React, { useState, useMemo } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { SalesMovement } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
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
  Filter,
  Eye
} from 'lucide-react'

export const StockMovementsPage: React.FC = () => {
  const { salesMovements } = useSmokeyOps()
  const [filterType, setFilterType] = useState<string>('all')
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedMovement, setSelectedMovement] = useState<SalesMovement | null>(null)

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
        onRowClick={(m) => {
          setSelectedMovement(m)
          setIsDetailsModalOpen(true)
        }}
      />

      {/* Movement Details Modal — Desaturated Grey Layout with Clean Aligned Rows */}
      {selectedMovement && (
        <Dialog
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Stock Movement Audit: ${selectedMovement.sku}`}
          description="Detailed inventory ledger entry, quantity delta, and audit trail."
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
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Done
              </Button>
            </div>
          }
        >
          <div className="space-y-4 font-sans text-xs">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs">
              {/* Section 1: Movement Overview */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Movement Record
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Timestamp</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                      {formatDate(selectedMovement.created_at)}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Product / Item</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                      {selectedMovement.product_name}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">SKU Reference</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-medium">
                      {selectedMovement.sku}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Movement Type</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 capitalize">
                      {selectedMovement.movement_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Inventory Location</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium font-mono uppercase">
                      {selectedMovement.location}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Quantities & Accounting */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Balance & Accounting
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Quantity Delta</span>
                    <span className={`font-bold font-mono text-sm ${selectedMovement.quantity > 0 ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {selectedMovement.quantity > 0 ? `+${selectedMovement.quantity}` : selectedMovement.quantity} {selectedMovement.unit}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Balance After</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold font-mono">
                      {formatQuantity(selectedMovement.balance_after)} {selectedMovement.unit}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Financial Valuation</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold font-mono">
                      {formatNaira(selectedMovement.value_amount)}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Audit / Reference Notes</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-normal">
                      {selectedMovement.notes || 'Automated inventory ledger log'}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Recorded By</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                      {selectedMovement.user_name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
export default StockMovementsPage
