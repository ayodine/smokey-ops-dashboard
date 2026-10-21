import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { MetricCard } from '@/components/ui/MetricCard'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatNaira, formatQuantity, formatDate } from '@/lib/utils'
import {
  Boxes,
  Flame,
  Truck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Package,
  Layers,
  Clock,
  CheckCircle2,
  Plus,
  Bike,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const AccountHomePage: React.FC = () => {
  const navigate = useNavigate()
  const {
    rawProducts,
    packagingProducts,
    salesProducts,
    productionBatches,
    logisticsDeliveries,
    riders
  } = useSmokeyOps()

  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    'c1': true,
    'c2': true,
    'c3': true,
    'c4': true,
    'c5': true,
    'c6': false,
    'c7': false,
    'c8': false,
    'c9': false
  })

  const toggleCheck = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Calculate dynamic metrics
  const rawValuation = rawProducts.reduce((sum, p) => sum + p.inventory_value, 0)
  const packagingValuation = packagingProducts.reduce((sum, p) => sum + (p.stock_qty * p.unit_cost), 0)
  const totalInventoryValuation = rawValuation + packagingValuation

  const lowStockItems = [
    ...rawProducts.filter(p => p.stock_qty <= p.reorder_level).map(p => ({
      id: `raw-${p.id}`,
      name: p.name,
      category: 'Raw Ingredient',
      stock: `${formatQuantity(p.stock_qty)} ${p.unit.toLowerCase()}`,
      reorder: `${formatQuantity(p.reorder_level)} ${p.unit.toLowerCase()}`,
      urgency: 'Critical',
      link: '/inventory/raw'
    })),
    ...packagingProducts.filter(p => p.stock_qty <= p.reorder_level).map(p => ({
      id: `pack-${p.id}`,
      name: p.name,
      category: 'Packaging',
      stock: `${formatQuantity(p.stock_qty)} ${p.unit.toLowerCase()}`,
      reorder: `${formatQuantity(p.reorder_level)} ${p.unit.toLowerCase()}`,
      urgency: 'Low Buffer',
      link: '/inventory/packaging'
    }))
  ]

  const activeBatches = productionBatches.filter(b => b.status === 'in_production' || b.status === 'draft')
  const completedBatches = productionBatches.filter(b => b.status === 'completed')

  const activeRiders = riders.filter(r => r.status === 'active' || r.status === 'on_trip')
  const inTransitDeliveries = logisticsDeliveries.filter(d => d.status === 'in_transit' || d.status === 'assigned')

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-kumo-line">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-kumo-strong">
            Account Overview & Operations Pulse
          </h1>
          <p className="text-xs text-kumo-subtle mt-1 leading-relaxed">
            Operational overview across raw inventory, kitchen cooking batches, and delivery drivers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/inventory/raw')}
            leftIcon={<Boxes className="w-3.5 h-3.5" />}
            className="h-9 px-3 text-xs"
          >
            Raw Inventory
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate('/production/batches')}
            leftIcon={<Flame className="w-3.5 h-3.5" />}
            className="h-9 px-3 text-xs shadow-xs"
          >
            Smoker Batches
          </Button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Daily Operational Revenue"
          value="₦1,420,500"
          trend={{ value: 14.2, isPositive: true }}
          description="Gross sales across Lagos channels"
          icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
          sparklineType="wave"
        />
        <MetricCard
          title="Active Smoker Batches"
          value={`${activeBatches.length} Pit Runs`}
          description="In pre-prep or smoking pits"
          icon={<Flame className="w-4 h-4 text-amber-500" />}
          sparklineType="dense"
        />
        <MetricCard
          title="Total Working Inventory"
          value={formatNaira(totalInventoryValuation)}
          trend={{ value: 4.8, isPositive: true }}
          description="Raw meat, spices & packaging stock"
          icon={<Layers className="w-4 h-4 text-primary" />}
          sparklineType="wave"
        />
        <MetricCard
          title="Active Dispatch Couriers"
          value={`${activeRiders.length} Couriers`}
          description={`${inTransitDeliveries.length} orders in transit right now`}
          icon={<Bike className="w-4 h-4 text-blue-500" />}
          sparklineType="spikes"
        />
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Low-Stock Warnings & Active Smoker Batches */}
        <div className="lg:col-span-7 space-y-6">
          {/* Low Stock Alerts */}
          <div className="rounded-lg border border-kumo-line bg-kumo-base p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-kumo-line">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-kumo-strong">
                  Immediate Reorder & Buffer Warnings
                </h3>
                <span
                  data-badge="critical-low"
                  className="badge-red-pill px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                  style={{ backgroundColor: '#FCE8EC', borderColor: '#F3B0BB', color: '#C8102E' }}
                >
                  {lowStockItems.length} items
                </span>
              </div>
              <Link
                to="/inventory/raw"
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                View all inventory <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-kumo-line/60">
              {lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-kumo-strong">{item.name}</div>
                    <div className="text-[11px] text-kumo-subtle flex items-center gap-2">
                      <span>{item.category}</span>
                      <span>•</span>
                      <span>Min reorder: {item.reorder}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      data-badge="critical-low"
                      className="badge-red-pill font-semibold px-2.5 py-0.5 rounded-full border text-[11px]"
                      style={{ backgroundColor: '#FCE8EC', borderColor: '#F3B0BB', color: '#C8102E' }}
                    >
                      {item.stock} left
                    </span>
                    <Link
                      to={item.link}
                      className="px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 border border-primary/30 rounded-lg transition-colors"
                    >
                      Restock
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Smoker Batches */}
          <div className="rounded-lg border border-kumo-line bg-kumo-base p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-kumo-line">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-kumo-strong">
                  Active Smoker Pit Batches
                </h3>
              </div>
              <Link
                to="/production/batches"
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                All batches <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {activeBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="p-3 rounded-lg border border-kumo-line bg-kumo-surface text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-kumo-strong">{batch.batch_ref}</span>
                      <span className="text-kumo-subtle">•</span>
                      <span className="font-medium text-kumo-default">{batch.output_product_name}</span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                      {batch.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-kumo-subtle pt-1 border-t border-kumo-line/50">
                    <span>Target Output: <strong className="text-kumo-strong">{batch.expected_output} units</strong></span>
                    <span>Cook: <strong className="text-kumo-strong">{batch.created_by_name}</strong></span>
                    <span>Started: <strong className="text-kumo-strong">{batch.started_at ? formatDate(batch.started_at) : 'Queued in prep'}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Logistics & Dispatch */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Dispatch Tracking */}
          <div className="rounded-lg border border-kumo-line bg-kumo-base p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-kumo-line">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-kumo-strong">
                  Live Dispatch & Courier Trips
                </h3>
              </div>
              <Link
                to="/logistics/board"
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                Dispatch board <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {logisticsDeliveries.slice(0, 4).map((del) => (
                <div
                  key={del.id}
                  className="p-3 rounded-lg border border-kumo-line bg-kumo-surface text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-kumo-strong">{del.delivery_ref}</span>
                    <StatusBadge status={del.status} size="sm" />
                  </div>
                  <div className="text-kumo-default truncate font-medium">
                    {del.customer_name} ({del.address})
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-kumo-subtle pt-1">
                    <span>Rider: <strong className="text-kumo-strong">{del.assigned_rider}</strong></span>
                    <span className="font-semibold text-kumo-strong">{formatNaira(del.delivery_fee)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Domain Navigation Cards */}
          <div className="rounded-lg border border-kumo-line bg-kumo-base p-4 shadow-xs space-y-2.5">
            <h3 className="text-sm font-semibold text-kumo-strong pb-2 border-b border-kumo-line">
              Operations Domains
            </h3>
            <Link
              to="/inventory/raw"
              className="flex items-center justify-between p-2.5 rounded-lg border border-kumo-line hover:bg-kumo-tint transition-colors text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Boxes className="w-4 h-4 text-primary" />
                <div>
                  <div className="font-semibold text-kumo-strong">Inventory Control</div>
                  <div className="text-[11px] text-kumo-subtle">Raw proteins, spices, packaging materials</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-kumo-subtle" />
            </Link>

            <Link
              to="/production/batches"
              className="flex items-center justify-between p-2.5 rounded-lg border border-kumo-line hover:bg-kumo-tint transition-colors text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="font-semibold text-kumo-strong">Kitchen Production</div>
                  <div className="text-[11px] text-kumo-subtle">Recipes, smoker logs, packing</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-kumo-subtle" />
            </Link>

            <Link
              to="/logistics/board"
              className="flex items-center justify-between p-2.5 rounded-lg border border-kumo-line hover:bg-kumo-tint transition-colors text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="font-semibold text-kumo-strong">Fleet Logistics</div>
                  <div className="text-[11px] text-kumo-subtle">Dispatch board, rider clearing & payouts</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-kumo-subtle" />
            </Link>
          </div>

          {/* Daily Operational Shift Cadence */}
          <div className="rounded-lg border border-kumo-line bg-kumo-base p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-kumo-line">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-kumo-strong">
                  Daily Shift Checklist
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                Daily Checklist
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-kumo-surface rounded-lg border border-kumo-line space-y-1.5">
                <div className="font-semibold text-kumo-strong text-[11px] uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                  Morning Opening (Kitchen Supervisor)
                </div>
                <div onClick={() => toggleCheck('c1')} className="flex items-center gap-2 text-kumo-default cursor-pointer">
                  <div className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer bg-white dark:bg-zinc-900 shrink-0',
                    checklist['c1'] ? 'border-[#c0201f]' : 'border-border/80'
                  )}>
                    {checklist['c1'] && <Check className="w-3.5 h-3.5 text-[#c0201f] stroke-[2.5]" />}
                  </div>
                  <span>Review Raw Inventory Low-Stock Alerts</span>
                </div>
                <div onClick={() => toggleCheck('c2')} className="flex items-center gap-2 text-kumo-default cursor-pointer">
                  <div className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer bg-white dark:bg-zinc-900 shrink-0',
                    checklist['c2'] ? 'border-[#c0201f]' : 'border-border/80'
                  )}>
                    {checklist['c2'] && <Check className="w-3.5 h-3.5 text-[#c0201f] stroke-[2.5]" />}
                  </div>
                  <span>Verify Delivery Schedule auto-release for today</span>
                </div>
                <div onClick={() => toggleCheck('c3')} className="flex items-center gap-2 text-kumo-default cursor-pointer">
                  <div className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer bg-white dark:bg-zinc-900 shrink-0',
                    checklist['c3'] ? 'border-[#c0201f]' : 'border-border/80'
                  )}>
                    {checklist['c3'] && <Check className="w-3.5 h-3.5 text-[#c0201f] stroke-[2.5]" />}
                  </div>
                  <span>Perform 5-item Random Stock Check</span>
                </div>
              </div>

              <div className="p-2.5 bg-kumo-surface rounded-lg border border-kumo-line space-y-1.5">
                <div className="font-semibold text-kumo-strong text-[11px] uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                  Mid-Day Shift Transition (Production Lead)
                </div>
                <div onClick={() => toggleCheck('c4')} className="flex items-center gap-2 text-kumo-default cursor-pointer">
                  <div className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer bg-white dark:bg-zinc-900 shrink-0',
                    checklist['c4'] ? 'border-[#c0201f]' : 'border-border/80'
                  )}>
                    {checklist['c4'] && <Check className="w-3.5 h-3.5 text-[#c0201f] stroke-[2.5]" />}
                  </div>
                  <span>Close completed batches; verify yield tolerance (±5%)</span>
                </div>
                <div onClick={() => toggleCheck('c5')} className="flex items-center gap-2 text-kumo-default cursor-pointer">
                  <div className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer bg-white dark:bg-zinc-900 shrink-0',
                    checklist['c5'] ? 'border-[#c0201f]' : 'border-border/80'
                  )}>
                    {checklist['c5'] && <Check className="w-3.5 h-3.5 text-[#c0201f] stroke-[2.5]" />}
                  </div>
                  <span>Audit Packaging Materials consumption vs orders</span>
                </div>
                <div onClick={() => toggleCheck('c6')} className="flex items-center gap-2 text-kumo-default cursor-pointer">
                  <div className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer bg-white dark:bg-zinc-900 shrink-0',
                    checklist['c6'] ? 'border-[#c0201f]' : 'border-border/80'
                  )}>
                    {checklist['c6'] && <Check className="w-3.5 h-3.5 text-[#c0201f] stroke-[2.5]" />}
                  </div>
                  <span>Check courier fee audit for any fee losses</span>
                </div>
              </div>

              <div className="p-2.5 bg-kumo-surface rounded-lg border border-kumo-line space-y-1.5">
                <div className="font-semibold text-kumo-strong text-[11px] uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
                  Night Closing (Logistics Lead & Cashier)
                </div>
                <div onClick={() => toggleCheck('c7')} className="flex items-center gap-2 text-kumo-default cursor-pointer">
                  <div className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer bg-white dark:bg-zinc-900 shrink-0',
                    checklist['c7'] ? 'border-[#c0201f]' : 'border-border/80'
                  )}>
                    {checklist['c7'] && <Check className="w-3.5 h-3.5 text-[#c0201f] stroke-[2.5]" />}
                  </div>
                  <span>Hand over cash on delivery for all active drivers</span>
                </div>
                <div onClick={() => toggleCheck('c8')} className="flex items-center gap-2 text-kumo-default cursor-pointer">
                  <div className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer bg-white dark:bg-zinc-900 shrink-0',
                    checklist['c8'] ? 'border-[#c0201f]' : 'border-border/80'
                  )}>
                    {checklist['c8'] && <Check className="w-3.5 h-3.5 text-[#c0201f] stroke-[2.5]" />}
                  </div>
                  <span>Verify zero orders remain stranded in Packaging or Dispatch</span>
                </div>
                <div onClick={() => toggleCheck('c9')} className="flex items-center gap-2 text-kumo-default cursor-pointer">
                  <div className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer bg-white dark:bg-zinc-900 shrink-0',
                    checklist['c9'] ? 'border-[#c0201f]' : 'border-border/80'
                  )}>
                    {checklist['c9'] && <Check className="w-3.5 h-3.5 text-[#c0201f] stroke-[2.5]" />}
                  </div>
                  <span>Review Sales Stock Movements log for unreversed manual entries</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default AccountHomePage
