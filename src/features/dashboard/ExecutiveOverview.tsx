import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MetricCard } from '@/components/ui/MetricCard'
import { KpiCarousel } from '@/components/ui/KpiCarousel'
import { StatusBadge } from '@/components/ui/Badge'
import { Heading, Subheading } from '@/components/ui/Heading'
import { Button } from '@/components/ui/Button'
import { formatNaira } from '@/lib/utils'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { type DateRange } from '@/components/ui/DateRangePicker'
import { 
  Boxes, 
  Flame, 
  ArrowRight, 
  Truck, 
  DollarSign, 
  Package, 
  CheckCircle2 
} from 'lucide-react'
import { useWarehouse } from '@/context/WarehouseContext'

export const ExecutiveOverview: React.FC = () => {
  const { 
    rawProducts, 
    packagingProducts, 
    salesProducts, 
    websiteOrders, 
    productionBatches, 
    packagingQueue, 
    logisticsDeliveries, 
    riders 
  } = useSmokeyOps()

  const { facilities, selectedWarehouse: currentOffice } = useWarehouse()
  const [selectedWarehouse, setSelectedWarehouse] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().setHours(0, 0, 0, 0)),
    end: new Date(new Date().setHours(23, 59, 59, 999)),
    presetKey: '24h'
  })

  // Authentically computed operational KPIs
  const totalRawValue = useMemo(() => {
    return (rawProducts || []).reduce((acc, p) => acc + (p.inventory_value || ((p.stock_qty || 0) * (p.unit_cost || 0))), 0)
  }, [rawProducts])

  const totalPackagingValue = useMemo(() => {
    return (packagingProducts || []).reduce((acc, p) => acc + (p.inventory_value || ((p.stock_qty || 0) * (p.unit_cost || 0))), 0)
  }, [packagingProducts])

  const totalSalesValue = useMemo(() => {
    return (salesProducts || []).reduce((acc, p) => acc + (p.inventory_value || ((p.stock_qty || 0) * (p.selling_price || 0))), 0)
  }, [salesProducts])

  const totalValuation = totalRawValue + totalPackagingValue + totalSalesValue

  const confirmedSalesRevenue = useMemo(() => {
    return (websiteOrders || [])
      .filter(o => o.payment_status === 'paid')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0)
  }, [websiteOrders])

  const activeBatches = useMemo(() => {
    return (productionBatches || []).filter(b => b.status === 'draft' || b.status === 'in_production')
  }, [productionBatches])

  const activePackagingOrders = useMemo(() => {
    return (packagingQueue || []).filter(p => p.order_status === 'ready_for_fulfillment' || p.order_status === 'in_packaging')
  }, [packagingQueue])

  const inTransitDeliveries = useMemo(() => {
    return (logisticsDeliveries || []).filter(d => d.status === 'in_transit' || d.status === 'out_for_delivery')
  }, [logisticsDeliveries])

  const onDutyRiders = useMemo(() => {
    return (riders || []).filter(r => r.status === 'active' || r.status === 'on_trip')
  }, [riders])

  const lowStockItems = useMemo(() => {
    const rawLow = (rawProducts || []).filter(p => p.stock_qty <= p.reorder_level)
    const salesLow = (salesProducts || []).filter(p => p.stock_qty <= p.reorder_level)
    return [...rawLow, ...salesLow]
  }, [rawProducts, salesProducts])

  return (
    <div className="space-y-6 font-sans">
      {/* Welcome Banner */}
      <div
        data-sentry-component="DashboardHeader"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg ring ring-kumo-line bg-kumo-base p-5 shadow-xs"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <Heading level={1} size="lg">
              Operations Control Center
            </Heading>
          </div>
          <Subheading size="xs" className="mt-1.5">
            Connected to <strong className="text-kumo-strong">{currentOffice?.name || 'Yaba Head Office'}</strong>. {activeBatches.length} cooking batches active · {activePackagingOrders.length} orders in packaging · {inTransitDeliveries.length} trips in transit.
          </Subheading>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link to="/inventory/raw">
            <Button size="sm" variant="secondary" leftIcon={<Boxes className="w-3.5 h-3.5" />}>
              Record Stock
            </Button>
          </Link>
          <Link to="/production/batches">
            <Button size="sm" variant="brand" leftIcon={<Flame className="w-3.5 h-3.5 fill-white" />}>
              Launch Production
            </Button>
          </Link>
        </div>
      </div>

      {/* Operations Metrics KPI Carousel */}
      <KpiCarousel
        titleFilter={{
          label: 'Filter Hub',
          value: selectedWarehouse,
          onChange: setSelectedWarehouse,
          options: [
            { label: 'All Operating Hubs', value: 'all' },
            ...(facilities || []).map(f => ({
              label: f.name,
              value: f.id.toString(),
            }))
          ],
        }}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onRefresh={() => {}}
        onSettings={() => {}}
      >
        <MetricCard
          title="Total Inventory Valuation"
          value={formatNaira(totalValuation)}
          description="Raw + packaging + finished stock"
          icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
        />

        <MetricCard
          title="Confirmed Sales Revenue"
          value={formatNaira(confirmedSalesRevenue)}
          description="Verified customer orders"
          icon={<DollarSign className="w-4 h-4 text-primary" />}
        />

        <MetricCard
          title="Active Cooking Batches"
          value={activeBatches.length}
          description="Smoking grills & ovens"
          icon={<Flame className="w-4 h-4 text-rose-500" />}
        />

        <MetricCard
          title="Orders in Packaging"
          value={activePackagingOrders.length}
          description="Awaiting box sealing & release"
          icon={<Package className="w-4 h-4 text-amber-500" />}
        />

        <MetricCard
          title="In-Transit Deliveries"
          value={inTransitDeliveries.length}
          description="Active trips across Lagos"
          icon={<Truck className="w-4 h-4 text-blue-500" />}
        />

        <MetricCard
          title="In-House Fleet on Duty"
          value={`${onDutyRiders.length} / ${(riders || []).length}`}
          description="Available or delivering"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        />
      </KpiCarousel>

      {/* Cross-Module Operational Pipelines Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pipeline 1: Inventory Stock Status */}
        <div className="rounded-lg ring ring-kumo-line bg-kumo-base p-4.5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-kumo-line pb-2.5">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-kumo-brand" />
              <h2 className="text-sm font-bold text-kumo-strong">
                Inventory Stock Status
              </h2>
            </div>
            <Link to="/inventory/raw" className="text-xs text-kumo-link hover:underline flex items-center gap-1 font-medium">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2 text-xs">
            {lowStockItems.length === 0 ? (
              <div className="p-4 rounded-lg bg-kumo-tint ring ring-kumo-line/50 text-center text-kumo-subtle py-6">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
                <p className="font-semibold text-kumo-strong">All stock levels healthy</p>
                <p className="text-[11px]">No items at or below reorder threshold</p>
              </div>
            ) : (
              lowStockItems.slice(0, 3).map(p => (
                <div key={p.id} className="p-2.5 rounded-lg bg-kumo-tint ring ring-kumo-line/50 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-kumo-strong">{p.name}</p>
                    <span className="text-[10px] text-kumo-subtle font-mono">{p.sku}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-kumo-strong block">{p.stock_qty} {p.unit}</span>
                    <StatusBadge status={p.stock_qty === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'} size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pipeline 2: Live Production Smoking Grill Status */}
        <div className="rounded-lg ring ring-kumo-line bg-kumo-base p-4.5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-kumo-line pb-2.5">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#f6821f]" />
              <h2 className="text-sm font-bold text-kumo-strong">
                Smoking Grill Runs
              </h2>
            </div>
            <Link to="/production/batches" className="text-xs text-kumo-link hover:underline flex items-center gap-1 font-medium">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2 text-xs">
            {activeBatches.length === 0 ? (
              <div className="p-4 rounded-lg bg-kumo-tint ring ring-kumo-line/50 text-center text-kumo-subtle py-6">
                <Flame className="w-6 h-6 mx-auto mb-1 text-amber-500/60" />
                <p className="font-semibold text-kumo-strong">No active grill runs</p>
                <p className="text-[11px]">Launch a production batch to start cooking</p>
              </div>
            ) : (
              activeBatches.slice(0, 3).map(b => (
                <div key={b.id} className="p-3 rounded-lg border border-kumo-brand/30 bg-kumo-brand/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-kumo-brand">
                      {b.batch_ref}
                    </span>
                    <StatusBadge status={b.status} size="sm" />
                  </div>
                  <p className="font-semibold text-kumo-strong">
                    {b.output_product_name} ({b.expected_output} portions)
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-kumo-subtle font-mono">
                    <span>Created: {b.created_by_name || 'Chef'}</span>
                    <span>Status: {b.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pipeline 3: Fulfillment & Couriers */}
        <div className="rounded-lg ring ring-kumo-line bg-kumo-base p-4.5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-kumo-line pb-2.5">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-kumo-brand" />
              <h2 className="text-sm font-bold text-kumo-strong">
                Fulfillment & Dispatch
              </h2>
            </div>
            <Link to="/logistics/board" className="text-xs text-kumo-link hover:underline flex items-center gap-1 font-medium">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2 text-xs">
            {inTransitDeliveries.length === 0 ? (
              <div className="p-4 rounded-lg bg-kumo-tint ring ring-kumo-line/50 text-center text-kumo-subtle py-6">
                <Truck className="w-6 h-6 mx-auto mb-1 text-blue-500/60" />
                <p className="font-semibold text-kumo-strong">No active in-transit dispatches</p>
                <p className="text-[11px]">Orders ready for delivery will appear here</p>
              </div>
            ) : (
              inTransitDeliveries.slice(0, 3).map(d => (
                <div key={d.id} className="p-3 rounded-lg bg-kumo-tint ring ring-kumo-line/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-kumo-strong">
                      {d.order_ref}
                    </span>
                    <StatusBadge status={d.status} size="sm" />
                  </div>
                  <p className="font-medium text-kumo-strong truncate">
                    To: {d.address || 'Customer Address'}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-kumo-subtle">
                    <span>Rider: {d.assigned_rider || 'Unassigned'}</span>
                    <span className="font-mono text-emerald-600 font-medium">{formatNaira(d.delivery_fee)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
