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
  const { rawProducts, inventoryLots, hasPermission, isRouteAllowed } = useSmokeyOps()
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const canViewKpis = hasPermission('perm_overview_kpis')
  const canViewLinks = hasPermission('perm_overview_links')
  const canViewFlowDiagram = hasPermission('perm_overview_flow_diagram')
  const canViewAnalytics = hasPermission('perm_overview_analytics')
  const canNavigateToRaw = canViewLinks && isRouteAllowed('/inventory/raw')

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
          SECTION 1: KPI CARDS (Controlled by perm_overview_kpis)
         ========================================================================= */}
      {canViewKpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: TOTAL STOCK VALUE */}
          <div
            onClick={() => canNavigateToRaw && navigate('/inventory/raw')}
            className={`p-4 rounded-xl border border-kumo-line bg-kumo-base shadow-2xs space-y-3 transition-colors ${canNavigateToRaw ? 'cursor-pointer hover:border-[#d4d4d8]' : ''}`}
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
            onClick={() => canNavigateToRaw && navigate('/inventory/raw')}
            className={`p-4 rounded-xl border border-kumo-line bg-kumo-base shadow-2xs space-y-3 transition-colors ${canNavigateToRaw ? 'cursor-pointer hover:border-[#d4d4d8]' : ''}`}
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
            onClick={() => canNavigateToRaw && navigate('/inventory/raw')}
            className={`p-4 rounded-xl border border-kumo-line bg-kumo-base shadow-2xs space-y-3 transition-colors ${canNavigateToRaw ? 'cursor-pointer hover:border-[#d4d4d8]' : ''}`}
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
            onClick={() => canNavigateToRaw && navigate('/inventory/raw')}
            className={`p-4 rounded-xl border border-kumo-line bg-kumo-base shadow-2xs space-y-3 transition-colors ${canNavigateToRaw ? 'cursor-pointer hover:border-[#d4d4d8]' : ''}`}
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
      )}

      {/* =========================================================================
          SECTION 2: CLOUDFLARE NAVIGATION SECTION (Controlled by perm_overview_links)
         ========================================================================= */}
      {canViewLinks && <CloudflareNavigationHub />}

      {/* =========================================================================
          SECTION 3: ORDER TRACKING FLOWCHART DIAGRAM (Controlled by perm_overview_flow_diagram)
         ========================================================================= */}
      {canViewFlowDiagram && <OrderWorkflowCanvasOverlay />}

      {/* =========================================================================
          SECTION 4: ANALYTICS SECTION (Controlled by perm_overview_analytics)
         ========================================================================= */}
      {canViewAnalytics && <CloudflareAnalyticsSection />}

      {!canViewKpis && !canViewLinks && !canViewFlowDiagram && !canViewAnalytics && (
        <div className="p-10 rounded-xl border border-kumo-line bg-kumo-base text-center space-y-2">
          <p className="text-sm font-semibold text-kumo-strong">No Home Overview Sections Enabled</p>
          <p className="text-xs text-kumo-subtle">
            Your account has access to the Home Overview page, but all individual overview widgets (KPI Cards, Quick Navigation Links, Live Order Flow Diagram, and Operational Analytics) are currently toggled off in your role policy.
          </p>
        </div>
      )}
    </div>
  )
}

export default AccountHomePage
