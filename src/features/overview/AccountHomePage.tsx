import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatNaira } from '@/lib/utils'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/reui/alert'
import {
  ShieldCheckIcon
} from 'lucide-react'
import { CloudflareNavigationHub } from './CloudflareNavigationHub'
import { CloudflareAnalyticsSection } from './CloudflareAnalyticsSection'
import { OrderWorkflowCanvasOverlay } from './OrderWorkflowCanvasOverlay'

export const AccountHomePage: React.FC = () => {
  const navigate = useNavigate()
  const { rawProducts, inventoryLots } = useSmokeyOps()
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Operational KPI calculations computed from raw products and inventory lots
  const {
    totalValuation,
    totalItemCount,
    lowStockCount,
    expiringCount,
    outOfStockCount
  } = useMemo(() => {
    let valuation = 0
    let low = 0
    let expiring = 0
    let out = 0

    rawProducts.forEach((raw) => {
      valuation += (raw.stock_qty || 0) * (raw.unit_cost || 0)
      if (raw.stock_qty === 0) {
        out += 1
      } else if (raw.stock_qty <= raw.reorder_level) {
        low += 1
      }

      const matchingLot = inventoryLots.find(lot => lot.product_id === raw.id || lot.sku === raw.sku)
      if (raw.is_perishable || raw.expiry_date || matchingLot) {
        const days = matchingLot?.days_to_expiry ?? 14
        if (days <= 7) {
          expiring += 1
        }
      }
    })

    return {
      totalValuation: valuation,
      totalItemCount: rawProducts.length,
      lowStockCount: low,
      expiringCount: expiring,
      outOfStockCount: out
    }
  }, [rawProducts, inventoryLots])

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Toast Alert Banner if present */}
      {toastMessage && (
        <div className="animate-in fade-in slide-in-from-top duration-200">
          <Alert variant="default" className="border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <AlertTitle>Notification</AlertTitle>
            <AlertDescription>{toastMessage}</AlertDescription>
            <AlertAction>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-xs font-medium text-emerald-700 hover:underline"
              >
                Dismiss
              </button>
            </AlertAction>
          </Alert>
        </div>
      )}

      {/* Page Title & Subtitle: Renamed to Operation Overview */}
      <PageHeader
        title="Operation Overview"
        subtitle={`${totalItemCount} stock items · ${lowStockCount} running low · ${expiringCount} expiring within 30 days`}
      />

      {/* =========================================================================
          SECTION 1: KPI CARDS (De-saturated to Clean Grey / Neutral Palette)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: TOTAL STOCK VALUE */}
        <div
          onClick={() => navigate('/inventory/raw')}
          className="p-4 rounded-xl border border-kumo-line bg-kumo-base shadow-2xs space-y-3 cursor-pointer hover:border-[#d4d4d8] transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-kumo-subtle uppercase">
              Total stock value
            </span>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-[-0.012em] text-kumo-strong font-display">
              {formatNaira(totalValuation)}
            </span>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {totalItemCount} items
            </span>
          </div>
        </div>

        {/* Metric 2: RUNNING LOW */}
        <div
          onClick={() => navigate('/inventory/raw')}
          className="p-4 rounded-xl border border-kumo-line bg-kumo-base shadow-2xs space-y-3 cursor-pointer hover:border-[#d4d4d8] transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-kumo-subtle uppercase">
              Running low
            </span>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-[-0.012em] text-kumo-strong font-display">
              {lowStockCount}
            </span>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              needs reorder
            </span>
          </div>
        </div>

        {/* Metric 3: EXPIRING SOON */}
        <div
          onClick={() => navigate('/inventory/raw')}
          className="p-4 rounded-xl border border-kumo-line bg-kumo-base shadow-2xs space-y-3 cursor-pointer hover:border-[#d4d4d8] transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-kumo-subtle uppercase">
              Expiring soon
            </span>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-[-0.012em] text-kumo-strong font-display">
              {expiringCount}
            </span>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              within 7 days
            </span>
          </div>
        </div>

        {/* Metric 4: OUT OF STOCK */}
        <div
          onClick={() => navigate('/inventory/raw')}
          className="p-4 rounded-xl border border-kumo-line bg-kumo-base shadow-2xs space-y-3 cursor-pointer hover:border-[#d4d4d8] transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-kumo-subtle uppercase">
              Out of stock
            </span>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-[-0.012em] text-kumo-strong font-display">
              {outOfStockCount}
            </span>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              needs supplier order
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: CLOUDFLARE NAVIGATION SECTION (3-COLUMN HUB)
          - Inventory Control
          - Production Runs (with clean production icon)
          - Recents
         ========================================================================= */}
      <CloudflareNavigationHub />

      {/* =========================================================================
          SECTION 3: ORDER TRACKING FLOWCHART DIAGRAM
         ========================================================================= */}
      <OrderWorkflowCanvasOverlay />

      {/* =========================================================================
          SECTION 4: ANALYTICS SECTION (METRIC GRAPH & LIGHT-MODE INTERACTIVE TOOLTIP)
         ========================================================================= */}
      <CloudflareAnalyticsSection />
    </div>
  )
}

export default AccountHomePage
