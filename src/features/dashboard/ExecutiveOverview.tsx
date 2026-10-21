import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { MetricCard } from '@/components/ui/MetricCard'
import { KpiCarousel } from '@/components/ui/KpiCarousel'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatNaira } from '@/lib/utils'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { type DateRange } from '@/components/ui/DateRangePicker'
import { 
  Boxes, 
  Flame, 
  ArrowRight, 
  Truck, 
  Info,
  GitCommit
} from 'lucide-react'

export const ExecutiveOverview: React.FC = () => {
  const { rawProducts, salesProducts } = useSmokeyOps()
  const [selectedWarehouse, setSelectedWarehouse] = useState('central-ikeja')
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(2026, 9, 20, 0, 0, 0),
    end: new Date(2026, 9, 21, 23, 59, 59),
    presetKey: '24h'
  })

  // Calculate duration in days for dynamic metric reflection
  const startTime = dateRange.start ? new Date(dateRange.start).getTime() : new Date(2026, 9, 20).getTime()
  const endTime = dateRange.end ? new Date(dateRange.end).getTime() : new Date(2026, 9, 21, 23, 59, 59).getTime()
  const durationHours = Math.max(1, (endTime - startTime) / (1000 * 60 * 60))
  const durationDays = Math.max(1, Math.round(durationHours / 24))

  // Dynamically calculated KPI metrics reflecting the chosen date range
  const totalRawValue = rawProducts.reduce((acc, p) => acc + (p.inventory_value || p.stock_qty * p.unit_cost), 0)
  const totalSalesValue = salesProducts.reduce((acc, p) => acc + (p.inventory_value || p.stock_qty * p.selling_price), 0)
  const baseValuation = totalRawValue + totalSalesValue
  const dynamicValuation = Math.round(baseValuation * (0.85 + 0.15 * Math.min(durationDays, 14)))

  const invocationsValue = durationDays === 1 
    ? '1.85k' 
    : durationDays < 7 
      ? `${(1.85 * durationDays * 0.75).toFixed(1)}k`
      : `${(1.85 * (durationDays / 7) * 4.2).toFixed(1)}k`

  const subrequestsValue = durationDays === 1
    ? '17.7k'
    : `${(17.7 * Math.sqrt(durationDays)).toFixed(1)}k`

  const hitRate = durationDays > 14 ? '98.20%' : durationDays > 3 ? '97.45%' : '96.05%'

  const req2xx = 291 * durationDays
  const req3xx = 240 * durationDays
  const host1 = 472 * durationDays
  const host2 = 59 * durationDays

  return (
    <div className="space-y-6 font-sans">
      {/* Welcome Banner (Kumo Elevated Base) */}
      <div
        data-sentry-component="DashboardHeader"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg ring ring-kumo-line bg-kumo-base p-5 shadow-xs"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-lg sm:text-xl font-bold tracking-normal text-kumo-strong">
              Operations Control Center
            </h1>
          </div>
          <p className="text-xs text-kumo-subtle mt-1.5 leading-relaxed">
            Connected to <strong className="text-kumo-strong">Central Production Kitchen (Ikeja)</strong>. 2 pit runs active, 3 orders staged for courier dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link to="/inventory">
            <Button size="sm" variant="secondary" leftIcon={<Boxes className="w-3.5 h-3.5" />}>
              Record Stock
            </Button>
          </Link>
          <Link to="/production/orders">
            <Button size="sm" variant="brand" leftIcon={<Flame className="w-3.5 h-3.5 fill-white" />}>
              Launch Production
            </Button>
          </Link>
        </div>
      </div>

      {/* Cloudflare-exact Metrics KPI Carousel with Dynamic Date Range Picker */}
      <KpiCarousel
        titleFilter={{
          label: 'Filter Hub',
          value: selectedWarehouse,
          onChange: setSelectedWarehouse,
          options: [
            { value: 'all', label: 'All operational hubs' },
            { value: 'central-ikeja', label: 'Central Kitchen - Ikeja' },
            { value: 'lekki-fulfillment', label: 'Lekki Fulfillment Staging' },
            { value: 'cold-storage-vi', label: 'Cold Storage VI' },
          ],
        }}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onRefresh={() => {}}
        onSettings={() => {}}
      >
        <MetricCard
          title="Stock valuation requests"
          value={formatNaira(dynamicValuation)}
          delta={{ value: `${(4.8 * Math.sqrt(durationDays)).toFixed(1)}%`, isPositive: true }}
          sparklineType="spikes"
        />

        <MetricCard
          title="Fulfillment hit rate"
          value={hitRate}
          delta={{ value: '2.4%', isPositive: true }}
          sparklineType="wave"
        />

        <MetricCard
          title="Active pit invocations"
          value={invocationsValue}
          delta={{ value: '51.0%', isPositive: false }}
          sparklineType="spikes"
        />

        <MetricCard
          title="Fulfillment subrequests"
          value={subrequestsValue}
          delta={{ value: '30.1%', isPositive: false }}
          sparklineType="spikes"
        />

        <MetricCard
          title="Critical stockout errors"
          value="0"
          noData={true}
        />

        <MetricCard
          title="Smoker pit cycle time"
          value="73 min"
          delta={{ value: '536.9%', isPositive: false }}
          sparklineType="dense"
        />
      </KpiCarousel>

      {/* Cloudflare "Active Deployment" Table Card */}
      <div className="rounded-lg ring ring-kumo-line bg-kumo-base shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-kumo-line flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-kumo-strong">Active deployment</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-medium text-kumo-subtle border-b border-kumo-line">
              <tr>
                <th className="py-2.5 px-5 font-normal whitespace-nowrap">Version ID</th>
                <th className="py-2.5 px-4 font-normal whitespace-nowrap">Deployed</th>
                <th className="py-2.5 px-4 font-normal whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <span>Traffic %</span>
                    <Info className="w-3 h-3 text-kumo-subtle/70" />
                  </div>
                </th>
                <th className="py-2.5 px-4 font-normal whitespace-nowrap">Requests/sec</th>
                <th className="py-2.5 px-4 font-normal whitespace-nowrap">Error rate</th>
                <th className="py-2.5 px-5 font-normal whitespace-nowrap">Median CPU time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kumo-line/50">
              {[
                { commit: 'c3945e13', when: 'Just now', traffic: '100%', percent: 100, reqSec: '14 req/sec', err: '0%', latency: '347.32 ms', path: 'M 0 14 L 10 12 L 20 18 L 30 8 L 40 15 L 50 11 L 60 17 L 70 5 L 80 14 L 90 9 L 100 12' },
                { commit: 'b819f4a2', when: '4 hours ago', traffic: '0%', percent: 0, reqSec: '0 req/sec', err: '0%', latency: '320.15 ms', path: 'M 0 16 L 10 14 L 20 15 L 30 11 L 40 13 L 50 10 L 60 14 L 70 8 L 80 12 L 90 10 L 100 11' },
                { commit: 'a712e091', when: 'Yesterday', traffic: '0%', percent: 0, reqSec: '0 req/sec', err: '0%', latency: '360.40 ms', path: 'M 0 12 L 10 16 L 20 14 L 30 10 L 40 18 L 50 12 L 60 15 L 70 9 L 80 16 L 90 11 L 100 14' },
                { commit: 'f942d87e', when: '2 days ago', traffic: '0%', percent: 0, reqSec: '0 req/sec', err: '0%', latency: '315.80 ms', path: 'M 0 15 L 10 13 L 20 16 L 30 9 L 40 14 L 50 12 L 60 16 L 70 7 L 80 13 L 90 10 L 100 12' },
                { commit: 'e631c76a', when: '3 days ago', traffic: '0%', percent: 0, reqSec: '0 req/sec', err: '0.01%', latency: '390.12 ms', path: 'M 0 18 L 10 15 L 20 17 L 30 12 L 40 16 L 50 14 L 60 18 L 70 10 L 80 15 L 90 12 L 100 15' },
                { commit: 'd520b65f', when: '4 days ago', traffic: '0%', percent: 0, reqSec: '0 req/sec', err: '0%', latency: '335.50 ms', path: 'M 0 13 L 10 11 L 20 15 L 30 8 L 40 12 L 50 10 L 60 13 L 70 6 L 80 11 L 90 9 L 100 10' },
                { commit: 'c419a54e', when: '5 days ago', traffic: '0%', percent: 0, reqSec: '0 req/sec', err: '0%', latency: '342.20 ms', path: 'M 0 14 L 10 12 L 20 18 L 30 8 L 40 15 L 50 11 L 60 17 L 70 5 L 80 14 L 90 9 L 100 12' },
                { commit: 'b308943d', when: '6 days ago', traffic: '0%', percent: 0, reqSec: '0 req/sec', err: '0%', latency: '328.90 ms', path: 'M 0 15 L 10 14 L 20 16 L 30 10 L 40 13 L 50 11 L 60 15 L 70 8 L 80 12 L 90 10 L 100 11' },
                { commit: 'a297832c', when: '1 week ago', traffic: '0%', percent: 0, reqSec: '0 req/sec', err: '0.02%', latency: '355.60 ms', path: 'M 0 16 L 10 15 L 20 17 L 30 11 L 40 15 L 50 13 L 60 16 L 70 9 L 80 14 L 90 11 L 100 13' },
                { commit: '9186721b', when: '10 days ago', traffic: '0%', percent: 0, reqSec: '0 req/sec', err: '0%', latency: '310.45 ms', path: 'M 0 14 L 10 12 L 20 14 L 30 9 L 40 12 L 50 10 L 60 13 L 70 7 L 80 11 L 90 8 L 100 10' },
                { commit: '8075610a', when: '2 weeks ago', traffic: '0%', percent: 0, reqSec: '0 req/sec', err: '0%', latency: '305.20 ms', path: 'M 0 13 L 10 11 L 20 13 L 30 8 L 40 11 L 50 9 L 60 12 L 70 6 L 80 10 L 90 8 L 100 9' },
              ].map((dep, idx) => (
                <tr key={dep.commit} className="hover:bg-kumo-tint/50 transition-colors">
                  <td className="py-3 px-5 font-mono text-xs font-medium text-kumo-strong whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <GitCommit className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
                      <span>{dep.commit}</span>
                      {idx === 0 && (
                        <span className="text-[10px] font-sans font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-kumo-subtle whitespace-nowrap text-xs">
                    {dep.when}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-3 min-w-[160px] max-w-[200px]">
                      <span className="font-mono text-xs text-kumo-strong w-10 shrink-0">{dep.traffic}</span>
                      <div className="h-1.5 flex-1 bg-kumo-tint rounded-full overflow-hidden">
                        <div
                          className="h-full bg-kumo-brand rounded-full transition-all duration-300"
                          style={{ width: `${dep.percent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-kumo-strong whitespace-nowrap">
                    {dep.reqSec}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-kumo-strong whitespace-nowrap">
                    {dep.err}
                  </td>
                  <td className="py-3 px-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-kumo-strong shrink-0">{dep.latency}</span>
                      <div className="w-28 h-5 flex items-center shrink-0">
                        <svg className="w-full h-4 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 24">
                          <path
                            d={dep.path}
                            fill="none"
                            stroke="currentColor"
                            className={idx === 0 ? "text-kumo-brand" : "text-kumo-subtle/50"}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cloudflare Bottom Dual Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Asset requests by status code */}
        <div className="rounded-lg ring ring-kumo-line bg-kumo-base p-4.5 shadow-xs space-y-4">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[13px] font-semibold text-kumo-strong">Asset requests by status code</h3>
            <Info className="w-3.5 h-3.5 text-kumo-subtle/70" />
          </div>

          {/* Status code legend pills matching screenshot */}
          <div className="flex items-center gap-4 text-xs font-mono flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="text-kumo-subtle">2xx</span>
              <span className="font-bold text-kumo-strong">{req2xx}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-400" />
              <span className="text-kumo-subtle">3xx</span>
              <span className="font-bold text-kumo-strong">{req3xx}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              <span className="text-kumo-subtle">4xx</span>
              <span className="font-bold text-kumo-strong">0</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-red-500" />
              <span className="text-kumo-subtle">5xx</span>
              <span className="font-bold text-kumo-strong">0</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-slate-400" />
              <span className="text-kumo-subtle">Other</span>
              <span className="font-bold text-kumo-strong">0</span>
            </div>
          </div>

          {/* Bar Chart Visualization with Gridlines */}
          <div className="h-44 pt-4 border-t border-kumo-line flex flex-col justify-between text-[10px] text-kumo-subtle font-mono">
            <div className="flex items-center gap-3">
              <span className="w-6 text-right">250</span>
              <div className="flex-1 border-b border-dashed border-kumo-line/60" />
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 text-right">200</span>
              <div className="flex-1 border-b border-dashed border-kumo-line/60" />
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 text-right">150</span>
              <div className="flex-1 border-b border-dashed border-kumo-line/60" />
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 text-right">100</span>
              <div className="flex-1 border-b border-dashed border-kumo-line/60 relative">
                {/* Visual Bars matching the screenshot */}
                <div className="absolute bottom-0 left-[48%] flex items-end gap-1.5 h-32">
                  <div className="w-2.5 h-20 bg-emerald-500 rounded-t-xs" />
                  <div className="w-2.5 h-32 bg-blue-300 rounded-t-xs" />
                </div>
                <div className="absolute bottom-0 left-[42%] flex items-end gap-1.5 h-16">
                  <div className="w-2.5 h-14 bg-emerald-500 rounded-t-xs" />
                </div>
                <div className="absolute bottom-0 left-[55%] flex items-end gap-1.5 h-12">
                  <div className="w-2.5 h-8 bg-blue-200 rounded-t-xs" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 text-right">50</span>
              <div className="flex-1 border-b border-dashed border-kumo-line/60" />
            </div>
          </div>
        </div>

        {/* Card 2: Top asset hostnames */}
        <div className="rounded-lg ring ring-kumo-line bg-kumo-base p-4.5 shadow-xs space-y-4">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[13px] font-semibold text-kumo-strong">Top asset hostnames</h3>
            <Info className="w-3.5 h-3.5 text-kumo-subtle/70" />
          </div>

          <div className="pt-2 space-y-4 text-xs font-sans">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-kumo-strong">
                <span className="font-mono text-xs">thecentralreport.com</span>
                <span className="font-mono font-semibold text-kumo-default">{host1}</span>
              </div>
              <div className="h-2 w-full bg-kumo-tint rounded-full overflow-hidden flex">
                <div className="h-full bg-kumo-brand rounded-full w-[88%]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-kumo-strong">
                <span className="font-mono text-xs">www.thecentralreport.com</span>
                <span className="font-mono font-semibold text-kumo-default">{host2}</span>
              </div>
              <div className="h-2 w-full bg-kumo-tint rounded-full overflow-hidden flex">
                <div className="h-full bg-kumo-brand rounded-full w-[12%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Module Operational Pipelines Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pipeline 1: Inventory Health */}
        <div className="rounded-lg ring ring-kumo-line bg-kumo-base p-4.5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-kumo-line pb-2.5">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-kumo-brand" />
              <h2 className="text-sm font-bold text-kumo-strong">
                Inventory Health
              </h2>
            </div>
            <Link to="/inventory" className="text-xs text-kumo-link hover:underline flex items-center gap-1 font-medium">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-kumo-tint ring ring-kumo-line/50 flex items-center justify-between">
              <div>
                <p className="font-semibold text-kumo-strong">Whole Smoked Chicken</p>
                <span className="text-[10px] text-kumo-subtle font-mono">FG-CHICK-SMK-01</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-kumo-strong block">70 Available</span>
                <StatusBadge status="IN_STOCK" size="sm" />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-kumo-tint ring ring-kumo-line/50 flex items-center justify-between">
              <div>
                <p className="font-semibold text-kumo-strong">Quarter Cut Portions</p>
                <span className="text-[10px] text-kumo-subtle font-mono">FG-CHICK-PRT-02</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-kumo-badge-orange block">6 Available</span>
                <StatusBadge status="LOW_STOCK" size="sm" />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-kumo-tint ring ring-kumo-line/50 flex items-center justify-between">
              <div>
                <p className="font-semibold text-kumo-strong">Hardwood Charcoal Lump</p>
                <span className="text-[10px] text-kumo-subtle font-mono">ING-COAL-HARD-05</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-kumo-badge-red block">0 kg</span>
                <StatusBadge status="OUT_OF_STOCK" size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline 2: Live Production Pit Status */}
        <div className="rounded-lg ring ring-kumo-line bg-kumo-base p-4.5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-kumo-line pb-2.5">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#f6821f]" />
              <h2 className="text-sm font-bold text-kumo-strong">
                Smokery Pit Runs
              </h2>
            </div>
            <Link to="/production" className="text-xs text-kumo-link hover:underline flex items-center gap-1 font-medium">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg border border-kumo-brand/30 bg-kumo-brand/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-kumo-brand">
                  PRD-2026-082 (Pit 2)
                </span>
                <StatusBadge status="IN_PRODUCTION" size="sm" />
              </div>
              <p className="font-semibold text-kumo-strong">
                40 units Whole Smoked Chicken
              </p>
              <div className="flex items-center justify-between text-[11px] text-kumo-subtle font-mono">
                <span>Chamber Temp: 112°C</span>
                <span>Time left: ~1h 45m</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-kumo-tint ring ring-kumo-line/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-kumo-strong">
                  PRD-2026-081 (Pit 1)
                </span>
                <StatusBadge status="COMPLETED" size="sm" />
              </div>
              <p className="font-semibold text-kumo-strong">
                48 units Sound Yield (2 scrap)
              </p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold block">
                QC Passed & Credited to Stock
              </span>
            </div>
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
            <Link to="/logistics" className="text-xs text-kumo-link hover:underline flex items-center gap-1 font-medium">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg bg-kumo-tint ring ring-kumo-line/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-kumo-strong">
                  DSP-2026-1049
                </span>
                <StatusBadge status="IN_TRANSIT" size="sm" />
              </div>
              <p className="font-medium text-kumo-strong">
                To: Victoria Island (Plot 14B)
              </p>
              <div className="flex items-center justify-between text-[11px] text-kumo-subtle">
                <span>Rider: Tunde B. (Bike 04)</span>
                <span className="font-mono text-emerald-600 font-medium">ETA: 18m</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-kumo-tint ring ring-kumo-line/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-kumo-strong">
                  DSP-2026-1048
                </span>
                <StatusBadge status="READY_FOR_PICKUP" size="sm" />
              </div>
              <p className="font-medium text-kumo-strong">
                To: Ikeja GRA (Smokey Express)
              </p>
              <div className="flex items-center justify-between text-[11px] text-kumo-subtle">
                <span>Staged at Bay 2</span>
                <span className="text-kumo-subtle">Awaiting Carrier</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
