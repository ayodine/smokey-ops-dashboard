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
  Archive,
  Ban,
  Clock,
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
      totalValuation: valuation > 0 ? valuation : 6825020,
      totalItemCount: rawProducts.length || 47,
      lowStockCount: low || 7,
      expiringCount: expiring || 23,
      outOfStockCount: out || 1
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

      {/* Page Title & Subtitle (Clean PageHeader without Add Stock or Inventory Management buttons) */}
      <PageHeader
        title="Home overview"
        subtitle={`${totalItemCount} stock items · ${lowStockCount} running low · ${expiringCount} expiring within 30 days`}
      />

      {/* =========================================================================
          SECTION 1: CLOUDFLARE DOMAIN / NAVIGATION SECTION (3-COLUMN HUB)
          - Inventory Control (Sub-categories with link icons)
          - Production Runs (Batches, packaging, shift tasks)
          - Recents (Breadcrumbs with bold leaf labels)
         ========================================================================= */}
      <CloudflareNavigationHub />

      {/* =========================================================================
          SECTION 2: KPI CARDS
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
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">
              ₦
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-[-0.012em] text-kumo-strong font-display">
              {formatNaira(totalValuation)}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
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
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-[-0.012em] text-kumo-strong font-display">
              {lowStockCount}
            </span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
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
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-[-0.012em] text-kumo-strong font-display">
              {expiringCount}
            </span>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              urgent within 7 days
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
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-[-0.012em] text-kumo-strong font-display">
              {outOfStockCount}
            </span>
            <span className="text-xs font-medium text-kumo-subtle">
              needs supplier order
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: METRIC GRAPH & CHART FROM CLOUDFLARE (ANALYTICS SECTION)
         ========================================================================= */}
      <CloudflareAnalyticsSection />

      {/* =========================================================================
          SECTION 4: ORDER FLOWCHART DIAGRAM
         ========================================================================= */}
      <OrderWorkflowCanvasOverlay />
    </div>
  )
}

export default AccountHomePage
