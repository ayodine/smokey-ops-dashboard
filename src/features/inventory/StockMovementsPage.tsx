import React, { useState, useMemo } from 'react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { InterStationTransfer } from '@/lib/smokeyData'
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
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity, 
  ArrowRightLeft,
  Boxes,
  Package,
  Layers,
  ChefHat,
  ArrowDownRight
} from 'lucide-react'

export interface UnifiedStockMovement {
  id: string
  product_id: number
  product_name: string
  sku: string
  unit: string
  category: 'raw' | 'packaging' | 'sales'
  movement_type: 'receipt' | 'consumption' | 'production_output' | 'sale' | 'waste' | 'adjustment' | 'transfer' | 'reversal'
  quantity: number
  unit_cost: number
  value_amount: number
  balance_after: number
  notes: string
  created_at: string
  user_name: string
}

const normalizeUnit = (u?: string) => {
  if (!u) return 'units'
  const lower = u.toLowerCase().trim()
  if (lower === 'pieces' || lower === 'piece' || lower === 'pcs') return 'pcs'
  if (lower === 'packs' || lower === 'pack') return 'pack'
  return lower
}

export const StockMovementsPage: React.FC = () => {
  const { rawMovements, salesMovements, interStationTransfers } = useSmokeyOps()
  const [activeTab, setActiveTab] = useState<'all' | 'raw' | 'packaging' | 'sales' | 'transfers'>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | null>(null)

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedMovement, setSelectedMovement] = useState<UnifiedStockMovement | null>(null)
  const [selectedTransfer, setSelectedTransfer] = useState<InterStationTransfer | null>(null)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)

  // 1. Unified Movements Data Engine
  const unifiedMovements = useMemo<UnifiedStockMovement[]>(() => {
    const rawList: UnifiedStockMovement[] = (rawMovements || []).map(m => ({
      id: `raw-${m.id}`,
      product_id: m.product_id,
      product_name: m.product_name,
      sku: m.sku,
      unit: normalizeUnit(m.unit),
      category: 'raw',
      movement_type: m.movement_type,
      quantity: m.quantity,
      unit_cost: m.unit_cost,
      value_amount: m.value_amount,
      balance_after: m.balance_after,
      notes: m.notes,
      created_at: m.created_at,
      user_name: m.user_name || 'Inventory Staff',
    }))

    const salesList: UnifiedStockMovement[] = (salesMovements || []).map(m => {
      const isPkg = m.location === 'packaging'
      let derivedType: UnifiedStockMovement['movement_type'] = m.movement_type
      if (isPkg) {
        if (m.notes.toLowerCase().includes('consumed') || m.notes.toLowerCase().includes('order') || m.quantity < 0) {
          derivedType = 'consumption'
        } else if (m.quantity > 0) {
          derivedType = 'receipt'
        }
      } else {
        if (m.movement_type === 'production_output') {
          derivedType = 'production_output'
        } else if (m.notes.toLowerCase().includes('order') || m.movement_type === 'sale') {
          derivedType = 'sale'
        }
      }

      return {
        id: `sales-${m.id}`,
        product_id: m.product_id,
        product_name: m.product_name,
        sku: m.sku,
        unit: normalizeUnit(m.unit),
        category: isPkg ? 'packaging' : 'sales',
        movement_type: derivedType,
        quantity: m.quantity,
        unit_cost: m.unit_cost,
        value_amount: m.value_amount,
        balance_after: m.balance_after,
        notes: m.notes,
        created_at: m.created_at,
        user_name: m.user_name || 'Operations Staff',
      }
    })

    return [...rawList, ...salesList].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [rawMovements, salesMovements])

  // 2. Active Tab & Action Category Filtering
  const movementsByTab = useMemo(() => {
    if (activeTab === 'all') return unifiedMovements
    if (activeTab === 'transfers') return []
    return unifiedMovements.filter(m => m.category === activeTab)
  }, [unifiedMovements, activeTab])

  // Apply Action Filter if selected
  const filteredMovements = useMemo(() => {
    let result = movementsByTab
    if (actionFilter !== 'all') {
      result = result.filter(m => m.movement_type === actionFilter)
    }
    if (dateRange) {
      result = result.filter(m => isWithinDateRange(m.created_at, dateRange))
    }
    return result
  }, [movementsByTab, actionFilter, dateRange])

  // Filter transfers by dateRange as well
  const filteredTransfers = useMemo(() => {
    if (!dateRange) return interStationTransfers
    return interStationTransfers.filter(t => isWithinDateRange(t.created_at, dateRange))
  }, [interStationTransfers, dateRange])

  // 3. Tab Badge Counts
  const rawCount = useMemo(() => unifiedMovements.filter(m => m.category === 'raw').length, [unifiedMovements])
  const packagingCount = useMemo(() => unifiedMovements.filter(m => m.category === 'packaging').length, [unifiedMovements])
  const salesCount = useMemo(() => unifiedMovements.filter(m => m.category === 'sales').length, [unifiedMovements])

  // 4. Honest Dynamic KPI Metrics (Calculated for current view / date range)
  const activeScopedMovements = useMemo(() => {
    if (activeTab === 'transfers') return []
    return filteredMovements
  }, [activeTab, filteredMovements])

  const totalMovementsCount = activeScopedMovements.length
  const totalInflowValue = activeScopedMovements
    .filter(m => m.quantity > 0)
    .reduce((acc, m) => acc + m.value_amount, 0)
  const totalOutflowValue = activeScopedMovements
    .filter(m => m.quantity < 0)
    .reduce((acc, m) => acc + m.value_amount, 0)
  const totalTransfersCount = filteredTransfers.length

  // 5. Unified Movements Columns
  const columns: ColumnDef<UnifiedStockMovement>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      accessor: (m) => <span className="text-xs text-kumo-subtle font-sans">{formatDate(m.created_at)}</span>,
      sortValue: (m) => m.created_at,
    },
    {
      key: 'product_name',
      header: 'Item SKU & Description',
      accessor: (m) => (
        <div>
          <div className="font-medium text-kumo-strong font-sans">{m.product_name}</div>
          <div className="text-[11px] font-mono text-kumo-subtle">{m.sku}</div>
        </div>
      ),
      sortValue: (m) => m.product_name,
    },
    {
      key: 'category',
      header: 'Department / Store',
      accessor: (m) => {
        if (m.category === 'raw') {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              <Boxes className="w-3 h-3 shrink-0" />
              <span>Raw Materials</span>
            </span>
          )
        }
        if (m.category === 'packaging') {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
              <Package className="w-3 h-3 shrink-0" />
              <span>Packaging Store</span>
            </span>
          )
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
            <ChefHat className="w-3 h-3 shrink-0" />
            <span>Finished Goods</span>
          </span>
        )
      },
      sortValue: (m) => m.category,
    },
    {
      key: 'movement_type',
      header: 'Movement Action',
      accessor: (m) => {
        const badgeMap: Record<string, { status: 'active' | 'pending' | 'inactive'; label: string }> = {
          receipt: { status: 'active', label: 'supplier intake' },
          production_output: { status: 'active', label: 'batch yield' },
          consumption: { status: 'pending', label: 'production use' },
          sale: { status: 'pending', label: 'customer dispatch' },
          adjustment: { status: 'pending', label: 'audit reconciliation' },
          waste: { status: 'inactive', label: 'waste write-off' },
          transfer: { status: 'pending', label: 'store transfer' },
          reversal: { status: 'inactive', label: 'reversal' },
        }
        const b = badgeMap[m.movement_type] || { status: 'pending', label: m.movement_type.toLowerCase().replace(/_/g, ' ') }
        return <StatusBadge status={b.status} label={b.label} />
      },
      sortValue: (m) => m.movement_type,
    },
    {
      key: 'quantity',
      header: 'Quantity Delta',
      accessor: (m) => (
        <span className={`font-mono font-semibold ${m.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.unit}
        </span>
      ),
      sortValue: (m) => m.quantity,
    },
    {
      key: 'balance_after',
      header: 'Balance After',
      accessor: (m) => <span className="text-xs font-mono font-medium text-kumo-strong">{formatQuantity(m.balance_after)} {m.unit}</span>,
      sortValue: (m) => m.balance_after,
    },
    {
      key: 'value_amount',
      header: 'Valuation Impact',
      accessor: (m) => (
        <span className={`text-xs font-mono font-medium ${m.quantity > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-kumo-default'}`}>
          {m.quantity > 0 ? `+${formatNaira(m.value_amount)}` : `-${formatNaira(m.value_amount)}`}
        </span>
      ),
      sortValue: (m) => m.value_amount,
    },
    {
      key: 'notes',
      header: 'Reason / Reference',
      accessor: (m) => <span className="text-xs text-kumo-default max-w-[260px] truncate block font-sans" title={m.notes}>{m.notes}</span>,
    },
    {
      key: 'user_name',
      header: 'Recorded By',
      accessor: (m) => <span className="text-xs text-kumo-subtle font-sans">{m.user_name}</span>,
      sortValue: (m) => m.user_name,
    },
  ]

  // 6. Transfer Columns
  const transferColumns: ColumnDef<InterStationTransfer>[] = [
    {
      key: 'transfer_ref',
      header: 'Transfer Voucher',
      accessor: (t) => <span className="font-mono text-xs font-bold text-kumo-strong">{t.transfer_ref}</span>,
      sortValue: (t) => t.transfer_ref,
    },
    {
      key: 'created_at',
      header: 'Timestamp',
      accessor: (t) => <span className="text-xs text-kumo-subtle">{formatDate(t.created_at)}</span>,
      sortValue: (t) => t.created_at,
    },
    {
      key: 'transfer_type',
      header: 'Station Route',
      accessor: (t) => {
        const fromLabel = t.from_station.replace('central_warehouse', 'central_store').replace('production_floor', 'production_bench').replace(/_/g, ' ')
        const toLabel = t.to_station.replace('central_warehouse', 'central_store').replace('production_floor', 'production_bench').replace(/_/g, ' ')
        return (
          <div className="flex items-center gap-1.5 text-xs font-medium capitalize">
            <span className="text-kumo-subtle">{fromLabel}</span>
            <ArrowRightLeft className="w-3.5 h-3.5 text-kumo-brand shrink-0" />
            <span className="text-kumo-strong font-semibold">{toLabel}</span>
          </div>
        )
      },
      sortValue: (t) => t.transfer_type,
    },
    {
      key: 'items',
      header: 'Items Dispatched / Returned',
      accessor: (t) => (
        <div className="text-xs space-y-0.5">
          {t.items.map((it, idx) => (
            <div key={idx} className="font-mono text-[11px] text-kumo-strong">
              {it.quantity} {it.unit.toLowerCase()} &bull; {it.product_name}
            </div>
          ))}
        </div>
      ),
      sortValue: (t) => t.items.length,
    },
    {
      key: 'authorized_by',
      header: 'Authorized By',
      accessor: (t) => <span className="text-xs text-kumo-default font-sans">{t.authorized_by}</span>,
      sortValue: (t) => t.authorized_by,
    },
    {
      key: 'notes',
      header: 'Audit Notes',
      accessor: (t) => <span className="text-xs text-kumo-subtle max-w-[220px] truncate block font-sans" title={t.notes}>{t.notes}</span>,
      sortValue: (t) => t.notes,
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Stock Movements & Store Transfer Ledger"
        subtitle="Complete chronological audit trail across Central Store, Raw Materials, Packaging Bench, and Finished Kitchen Yield."
      />

      {/* KPI Strip with honest live metrics and no hallucinated deltas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title={activeTab === 'transfers' ? "Station Transfers" : "Ledger Audit Entries"}
          value={activeTab === 'transfers' ? totalTransfersCount : totalMovementsCount}
          description={activeTab === 'transfers' ? "Internal transit vouchers" : "Logged inventory movements"}
          icon={<Activity className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Stock Inflow Added"
          value={totalInflowValue > 0 ? `+${formatNaira(totalInflowValue)}` : '₦0'}
          description="Supplier receipts & batch yield"
          icon={<ArrowDownLeft className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Stock Outflow Deducted"
          value={totalOutflowValue > 0 ? `-${formatNaira(totalOutflowValue)}` : '₦0'}
          description="Cooking use, packaging & orders"
          icon={<ArrowUpRight className="w-4 h-4 text-rose-500" />}
        />
        <MetricCard
          title="Store Transfers Logged"
          value={`${totalTransfersCount} vouchers`}
          description="Central Store ↔ Outlet benches"
          icon={<ArrowRightLeft className="w-4 h-4 text-blue-600" />}
        />
      </div>

      {/* Department-Based Split Tabs */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val) => {
            setActiveTab(val as any)
            setActionFilter('all')
          }}
          tabs={[
            { id: 'all', label: 'All Movements', badge: unifiedMovements.length },
            { id: 'raw', label: 'Raw Ingredients', badge: rawCount },
            { id: 'packaging', label: 'Packaging Store', badge: packagingCount },
            { id: 'sales', label: 'Finished Goods & Yield', badge: salesCount },
            { id: 'transfers', label: 'Store Transfers', badge: interStationTransfers.length },
          ]}
        />
      </div>

      {/* DataTable */}
      {activeTab === 'transfers' ? (
        <DataTable
          data={filteredTransfers}
          columns={transferColumns}
          searchable={true}
          searchPlaceholder="Search transfer voucher, items, or actor..."
          title="Store Transfers Ledger"
          exportFilename={`smokey-store-transfers-${new Date().toISOString().slice(0, 10)}`}
          dateField={(t) => t.created_at}
          onDateRangeChange={setDateRange}
          onRowClick={(t) => {
            setSelectedTransfer(t)
            setIsTransferModalOpen(true)
          }}
        />
      ) : (
        <DataTable
          data={filteredMovements}
          columns={columns}
          searchable={true}
          searchPlaceholder="Search item name, SKU, reference notes, or recorded actor..."
          title={
            activeTab === 'raw'
              ? 'Raw Materials Inventory Movements'
              : activeTab === 'packaging'
              ? 'Packaging Materials Consumption & Receipts'
              : activeTab === 'sales'
              ? 'Finished Goods Deposits & Dispatches'
              : 'Master Stock Movement Ledger'
          }
          exportFilename={`smokey-stock-movements-${activeTab}-${new Date().toISOString().slice(0, 10)}`}
          dateField={(m) => m.created_at}
          onDateRangeChange={setDateRange}
          filterCategories={[
            {
              name: 'Action Type',
              key: 'movement_type',
              options: [
                { label: 'All Actions', value: 'all' },
                { label: 'Supplier Receipts', value: 'receipt' },
                { label: 'Batch Oven Yield', value: 'production_output' },
                { label: 'Kitchen & Order Consumption', value: 'consumption' },
                { label: 'Customer Dispatches', value: 'sale' },
                { label: 'Waste & Spoilage', value: 'waste' },
                { label: 'Audit Reconciliations', value: 'adjustment' },
              ],
              activeValue: actionFilter,
              onChange: setActionFilter,
            }
          ]}
          onRowClick={(m) => {
            setSelectedMovement(m)
            setIsDetailsModalOpen(true)
          }}
        />
      )}

      {/* Movement Details Modal — Clean Aligned Rows with Fixed Pinned Footer */}
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
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close
              </Button>
              <span className="font-mono text-xs text-kumo-subtle font-medium">
                Audit Trail ID: #{selectedMovement.id}
              </span>
            </div>
          }
        >
          <div className="space-y-4 font-sans text-xs">
            <div className="rounded-xl border border-kumo-line bg-kumo-base overflow-hidden divide-y divide-kumo-line shadow-2xs">
              {/* Section 1: Movement Overview */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-kumo-strong uppercase tracking-wider">
                    Movement Record
                  </span>
                  <span className="text-xs font-mono text-kumo-subtle">
                    {selectedMovement.sku}
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-kumo-subtle font-normal">Timestamp</span>
                    <span className="text-kumo-strong font-medium">
                      {formatDate(selectedMovement.created_at)}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-kumo-subtle font-normal">Product / Item</span>
                    <span className="text-kumo-strong font-semibold">
                      {selectedMovement.product_name}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-kumo-subtle font-normal">SKU Reference</span>
                    <span className="text-kumo-strong font-mono font-medium">
                      {selectedMovement.sku}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-kumo-subtle font-normal">Department / Store</span>
                    <span className="text-kumo-strong font-medium capitalize">
                      {selectedMovement.category === 'raw' ? 'Raw Materials' : selectedMovement.category === 'packaging' ? 'Packaging Store' : 'Finished Goods'}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-kumo-subtle font-normal">Movement Action</span>
                    <span className="text-kumo-strong font-medium capitalize">
                      {selectedMovement.movement_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Quantities & Accounting */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-kumo-strong uppercase tracking-wider">
                    Balance & Accounting
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-kumo-subtle font-normal">Quantity Delta</span>
                    <span className={`font-bold font-mono text-sm ${selectedMovement.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {selectedMovement.quantity > 0 ? `+${selectedMovement.quantity}` : selectedMovement.quantity} {selectedMovement.unit}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-kumo-subtle font-normal">Balance After</span>
                    <span className="text-kumo-strong font-semibold font-mono">
                      {formatQuantity(selectedMovement.balance_after)} {selectedMovement.unit}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-kumo-subtle font-normal">Financial Valuation</span>
                    <span className="text-kumo-strong font-semibold font-mono">
                      {formatNaira(selectedMovement.value_amount)}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-kumo-subtle font-normal">Reason / Reference</span>
                    <span className="text-kumo-default font-normal">
                      {selectedMovement.notes || 'Automated inventory ledger log'}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-kumo-subtle font-normal">Recorded By</span>
                    <span className="text-kumo-strong font-medium">
                      {selectedMovement.user_name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* Transfer Details Modal */}
      {selectedTransfer && (
        <Dialog
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          title={`Store Transfer Audit: ${selectedTransfer.transfer_ref}`}
          description="Immutable ledger record of materials moved between Central Store and outlet stations."
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="secondary"
                size="md"
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
              >
                Close
              </Button>
              <span className="font-mono text-xs text-kumo-subtle font-medium">
                {selectedTransfer.transfer_ref} • Authorized
              </span>
            </div>
          }
        >
          <div className="space-y-4 font-sans text-xs">
            <div className="rounded-xl border border-kumo-line bg-kumo-base overflow-hidden divide-y divide-kumo-line shadow-2xs">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-kumo-strong uppercase tracking-wider">
                    Transfer Dispatch Route
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-kumo-subtle font-normal">Origin Location</span>
                    <span className="text-kumo-strong font-semibold capitalize">
                      {selectedTransfer.from_station.replace('central_warehouse', 'central_store').replace('production_floor', 'production_bench').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-kumo-subtle font-normal">Destination Station</span>
                    <span className="text-kumo-strong font-semibold capitalize">
                      {selectedTransfer.to_station.replace('central_warehouse', 'central_store').replace('production_floor', 'production_bench').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-kumo-subtle font-normal">Timestamp</span>
                    <span className="text-kumo-strong font-medium">{formatDate(selectedTransfer.created_at)}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-kumo-subtle font-normal">Authorized By</span>
                    <span className="text-kumo-strong font-semibold">{selectedTransfer.authorized_by}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-40 sm:w-52 shrink-0 text-kumo-subtle font-normal">Transfer Notes</span>
                    <span className="text-kumo-default">{selectedTransfer.notes}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-kumo-strong uppercase tracking-wider">
                    Transferred Inventory Items
                  </span>
                </div>

                <div className="divide-y divide-kumo-line pt-1">
                  {selectedTransfer.items.map((it, idx) => (
                    <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-[13px]">
                      <span className="font-medium text-kumo-strong">{it.product_name}</span>
                      <span className="font-mono font-semibold text-kumo-strong">
                        {it.quantity} {it.unit.toLowerCase()}
                      </span>
                    </div>
                  ))}
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
