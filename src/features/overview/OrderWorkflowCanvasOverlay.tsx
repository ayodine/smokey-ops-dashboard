import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  Globe,
  ChevronDown,
  ChevronUp,
  Play,
  Zap,
  Plus,
  RefreshCw,
  Flame,
  Check,
  CreditCard,
  ShieldCheck,
  ShoppingBag,
  PackageCheck,
  Truck
} from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { cn, formatNaira } from '@/lib/utils'

export type PipelineStage =
  | 'sales_webhook'
  | 'payment_verification'
  | 'fraud_check'
  | 'inventory_check'
  | 'production_queue'
  | 'production_cook'
  | 'production_qa'
  | 'logistics_packing'
  | 'logistics_dispatch'
  | 'logistics_delivery'
  | 'completed'

export interface PipelineOrder {
  id: string
  customerName: string
  dishName: string
  totalAmount: number
  portions: number
  channel: 'Website Storefront' | 'Walk-in POS' | 'WhatsApp Direct'
  hasStock: boolean
  currentStage: PipelineStage
  paymentRef: string
  batchId?: string
  riderName?: string
  destinationAddress: string
  etaMinutes?: number
  otpCode: string
  history: PipelineStage[]
}

const SMOKEY_OPERATIONAL_ORDERS: PipelineOrder[] = [
  {
    id: 'SHD-09853',
    customerName: 'Babajide Sanwo',
    dishName: 'Smoked Beef Brisket Feast & Jollof',
    totalAmount: 18500,
    portions: 3,
    channel: 'Website Storefront',
    hasStock: false, // Stockout fallback into Production Kitchen Batches!
    currentStage: 'production_cook',
    paymentRef: 'pay_smk_99182',
    batchId: 'BAT-SMK-402',
    riderName: 'Rider Yusuf (Internal Fleet)',
    destinationAddress: '8c Taiwo Osipitan Way, Ogba, Lagos',
    etaMinutes: 22,
    otpCode: '4821',
    history: ['sales_webhook', 'payment_verification', 'fraud_check', 'inventory_check', 'production_queue', 'production_cook']
  },
  {
    id: 'SHD-09854',
    customerName: 'Amaka Okafor',
    dishName: '1L Guineafowl Rice & Smoked Catfish',
    totalAmount: 24000,
    portions: 2,
    channel: 'Website Storefront',
    hasStock: true, // In stock: direct path to Packaging Dock!
    currentStage: 'logistics_packing',
    paymentRef: 'pay_smk_99183',
    riderName: 'Rider Yusuf (Internal Fleet)',
    destinationAddress: 'Plot 12 Admiralty Way, Lekki Phase 1',
    etaMinutes: 28,
    otpCode: '7239',
    history: ['sales_webhook', 'payment_verification', 'fraud_check', 'inventory_check', 'logistics_packing']
  },
  {
    id: 'SHD-09855',
    customerName: 'Chinedu Eze',
    dishName: 'Peppered Turkey Wings Platter',
    totalAmount: 9500,
    portions: 1,
    channel: 'WhatsApp Direct',
    hasStock: true,
    currentStage: 'payment_verification',
    paymentRef: 'pay_smk_99184',
    destinationAddress: 'Akowonjo Roundabout, Egbeda, Lagos',
    otpCode: '1092',
    history: ['sales_webhook', 'payment_verification']
  },
  {
    id: 'SHD-09856',
    customerName: 'Folake Adeleke',
    dishName: 'Fire-Smoked BBQ Ribs Combo',
    totalAmount: 16000,
    portions: 2,
    channel: 'Walk-in POS',
    hasStock: true,
    currentStage: 'completed',
    paymentRef: 'pay_smk_99180',
    riderName: 'Rider Yusuf (Internal Fleet)',
    destinationAddress: 'Isaac John Street, GRA Ikeja',
    etaMinutes: 0,
    otpCode: '8834',
    history: ['sales_webhook', 'payment_verification', 'fraud_check', 'inventory_check', 'logistics_packing', 'logistics_dispatch', 'logistics_delivery', 'completed']
  }
]

interface AnchorPoint {
  x: number
  y: number
}

interface CanvasCoordinates {
  domains: AnchorPoint
  workers: AnchorPoint
  queues: AnchorPoint
  centerLeft: AnchorPoint
  centerRight: AnchorPoint
  centerBottom: AnchorPoint
  productionTop: AnchorPoint
  productionRight: AnchorPoint
  bindingsLeft: AnchorPoint
}

export const OrderWorkflowCanvasOverlay: React.FC = () => {
  const { showToast } = useSmokeyOps()

  // Full canvas collapse/expand state (matching Screenshot 2 bottom chevron)
  const [isCanvasExpanded, setIsCanvasExpanded] = useState<boolean>(true)

  // Auto-stream interval toggle
  const [isAutoStreamActive, setIsAutoStreamActive] = useState<boolean>(false)

  // Orders in pipeline state
  const [orders, setOrders] = useState<PipelineOrder[]>(SMOKEY_OPERATIONAL_ORDERS)
  const [selectedOrderId, setSelectedOrderId] = useState<string>('SHD-09853')

  // Node cards expansion state matching Screenshot 1 (collapsed) vs Screenshot 2 & 5 (expanded)
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    webhooks: false,
    payments: false,
    fraud: false,
    inventory: true,
    production: true,
    fulfillment: true
  })

  // DOM Refs for dynamic anchor alignment
  const containerRef = useRef<HTMLDivElement | null>(null)
  const webhooksHeaderRef = useRef<HTMLDivElement | null>(null)
  const paymentsHeaderRef = useRef<HTMLDivElement | null>(null)
  const fraudHeaderRef = useRef<HTMLDivElement | null>(null)
  const centerCardRef = useRef<HTMLDivElement | null>(null)
  const centerHeaderRef = useRef<HTMLDivElement | null>(null)
  const productionCardRef = useRef<HTMLDivElement | null>(null)
  const productionHeaderRef = useRef<HTMLDivElement | null>(null)
  const fulfillmentHeaderRef = useRef<HTMLDivElement | null>(null)

  // Measured coordinates state
  const [coords, setCoords] = useState<CanvasCoordinates | null>(null)

  const toggleNodeExpansion = (nodeKey: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeKey]: !prev[nodeKey] }))
  }

  // Active Order
  const activeOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || orders[0]
  }, [orders, selectedOrderId])

  // Sequential Stage Progression Logic
  const getNextStage = (current: PipelineStage, hasStock: boolean): PipelineStage => {
    switch (current) {
      case 'sales_webhook':
        return 'payment_verification'
      case 'payment_verification':
        return 'fraud_check'
      case 'fraud_check':
        return 'inventory_check'
      case 'inventory_check':
        // Fallback branching: stockout goes to production queue; in-stock goes directly to packaging dock
        return hasStock ? 'logistics_packing' : 'production_queue'
      case 'production_queue':
        return 'production_cook'
      case 'production_cook':
        return 'production_qa'
      case 'production_qa':
        // QA Passed: replenish sales inventory and merge branch into packaging dock
        return 'logistics_packing'
      case 'logistics_packing':
        return 'logistics_dispatch'
      case 'logistics_dispatch':
        return 'logistics_delivery'
      case 'logistics_delivery':
        return 'completed'
      case 'completed':
        return 'completed'
      default:
        return 'sales_webhook'
    }
  }

  // Step Order Forward
  const stepOrderForward = () => {
    if (!activeOrder) return

    if (activeOrder.currentStage === 'completed') {
      showToast(`Order ${activeOrder.id} is already completed. Terminal customer webhook triggered.`, 'info')
      return
    }

    const next = getNextStage(activeOrder.currentStage, activeOrder.hasStock)

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === activeOrder.id) {
          const updatedHistory = Array.from(new Set([...o.history, next]))
          return {
            ...o,
            currentStage: next,
            history: updatedHistory
          }
        }
        return o
      })
    )

    if (next === 'completed') {
      showToast(`Terminal Node Fired: Customer ${activeOrder.customerName} verified OTP #${activeOrder.otpCode}. SMS & WhatsApp receipt dispatched!`, 'success')
    } else if (next === 'production_queue' && !activeOrder.hasStock) {
      showToast(`Stockout Fallback: Order ${activeOrder.id} dynamically routed to Kitchen Smoking Pit BAT-SMK-402!`, 'info')
    } else if (next === 'logistics_packing') {
      showToast(`Order ${activeOrder.id} ready at Packaging Dock: Packaging materials decremented!`, 'success')
    } else {
      showToast(`Order ${activeOrder.id} transitioned to ${next.replace(/_/g, ' ').toUpperCase()}`, 'info')
    }
  }

  // Simulate Brand New Webhook Incoming Order
  const triggerNewWebhookOrder = () => {
    const randomNum = Math.floor(9857 + Math.random() * 500)
    const newId = `SHD-0${randomNum}`
    const dishes = [
      { name: 'Peppered Asun Goat Meat Plate', amount: 8500, stock: true },
      { name: 'Smoked Giant Turkey Drumstick', amount: 11000, stock: false },
      { name: '1L Guineafowl Rice Bowl Combo', amount: 22000, stock: true },
      { name: 'Smokey Hut Jollof & Smoked Catfish', amount: 14500, stock: false }
    ]
    const chosen = dishes[Math.floor(Math.random() * dishes.length)]
    const channels: Array<'Website Storefront' | 'Walk-in POS' | 'WhatsApp Direct'> = [
      'Website Storefront',
      'Walk-in POS',
      'WhatsApp Direct'
    ]
    const chosenChannel = channels[Math.floor(Math.random() * channels.length)]

    const newOrder: PipelineOrder = {
      id: newId,
      customerName: ['Tomiwa Alabi', 'Ngozi Obi', 'Olumide Jacobs', 'Zainab Bello'][Math.floor(Math.random() * 4)],
      dishName: chosen.name,
      totalAmount: chosen.amount,
      portions: Math.floor(1 + Math.random() * 3),
      channel: chosenChannel,
      hasStock: chosen.stock,
      currentStage: 'sales_webhook',
      paymentRef: `pay_smk_${Math.floor(10000 + Math.random() * 90000)}`,
      destinationAddress: 'Victoria Island, Lagos',
      otpCode: `${Math.floor(1000 + Math.random() * 9000)}`,
      history: ['sales_webhook']
    }

    setOrders((prev) => [newOrder, ...prev])
    setSelectedOrderId(newId)
    showToast(`Incoming Webhook Ingested: New order ${newId} received via ${chosenChannel}!`, 'success')
  }

  // Auto-stream interval effect
  useEffect(() => {
    if (!isAutoStreamActive) return

    const interval = setInterval(() => {
      setOrders((prevOrders) => {
        return prevOrders.map((ord) => {
          if (ord.currentStage === 'completed') return ord
          const next = getNextStage(ord.currentStage, ord.hasStock)
          return {
            ...ord,
            currentStage: next,
            history: Array.from(new Set([...ord.history, next]))
          }
        })
      })
    }, 3500)

    return () => clearInterval(interval)
  }, [isAutoStreamActive])

  // Precise dynamic measurement function
  const updateCoordinates = () => {
    if (!containerRef.current) return
    const cRect = containerRef.current.getBoundingClientRect()

    const getRightMiddle = (el: HTMLElement | null): AnchorPoint => {
      if (!el) return { x: 0, y: 0 }
      const r = el.getBoundingClientRect()
      return {
        x: r.right - cRect.left,
        y: r.top + r.height / 2 - cRect.top
      }
    }

    const getLeftMiddle = (el: HTMLElement | null): AnchorPoint => {
      if (!el) return { x: 0, y: 0 }
      const r = el.getBoundingClientRect()
      return {
        x: r.left - cRect.left,
        y: r.top + r.height / 2 - cRect.top
      }
    }

    const getBottomCenter = (el: HTMLElement | null): AnchorPoint => {
      if (!el) return { x: 0, y: 0 }
      const r = el.getBoundingClientRect()
      return {
        x: r.left + r.width / 2 - cRect.left,
        y: r.bottom - cRect.top
      }
    }

    const getTopCenter = (el: HTMLElement | null): AnchorPoint => {
      if (!el) return { x: 0, y: 0 }
      const r = el.getBoundingClientRect()
      return {
        x: r.left + r.width / 2 - cRect.left,
        y: r.top - cRect.top
      }
    }

    const domains = getRightMiddle(webhooksHeaderRef.current)
    const workers = getRightMiddle(paymentsHeaderRef.current)
    const queues = getRightMiddle(fraudHeaderRef.current)
    const centerLeft = getLeftMiddle(centerHeaderRef.current)
    const centerRight = getRightMiddle(centerHeaderRef.current)
    const centerBottom = getBottomCenter(centerCardRef.current)
    const productionTop = getTopCenter(productionCardRef.current)
    const productionRight = getRightMiddle(productionHeaderRef.current)
    const bindingsLeft = getLeftMiddle(fulfillmentHeaderRef.current)

    setCoords({
      domains,
      workers,
      queues,
      centerLeft,
      centerRight,
      centerBottom,
      productionTop,
      productionRight,
      bindingsLeft
    })
  }

  // Recalculate coordinates on mount, resize, expansion toggle, and DOM mutation
  useLayoutEffect(() => {
    updateCoordinates()
    const timeout = setTimeout(updateCoordinates, 40)
    return () => clearTimeout(timeout)
  }, [expandedNodes, isCanvasExpanded, activeOrder?.hasStock, selectedOrderId])

  useEffect(() => {
    window.addEventListener('resize', updateCoordinates)
    let ro: ResizeObserver | null = null
    if (containerRef.current && window.ResizeObserver) {
      ro = new ResizeObserver(() => {
        updateCoordinates()
      })
      ro.observe(containerRef.current)
    }
    return () => {
      window.removeEventListener('resize', updateCoordinates)
      ro?.disconnect()
    }
  }, [])

  // Live Counts for Triggers matching Smokey Ops data
  const incomingWebhooksCount = orders.filter((o) => o.currentStage === 'sales_webhook').length + 2
  const pendingPaymentsCount = orders.filter((o) => o.currentStage === 'payment_verification').length
  const fraudEvaluationsCount = 0

  // Calculate SVG paths based on measured coordinates
  const svgPaths = useMemo(() => {
    if (!coords || coords.centerLeft.x === 0) {
      return null
    }

    const {
      domains: d,
      workers: w,
      queues: q,
      centerLeft: cL,
      centerRight: cR,
      centerBottom: cB,
      productionTop: pT,
      productionRight: pR,
      bindingsLeft: bL
    } = coords

    const maxTriggerX = Math.max(d.x, w.x, q.x)
    const trunkGap = Math.max(16, cL.x - maxTriggerX)
    const trunkX = Math.round(maxTriggerX + trunkGap * 0.42)
    const radius = 10

    // Path 1: From Storefront Webhooks right edge to bus trunk and down to centerLeft y
    const domainsPath = `M ${d.x} ${d.y} H ${trunkX - radius} Q ${trunkX} ${d.y} ${trunkX} ${d.y + radius} V ${cL.y}`

    // Path 2: From Payments right edge into bus trunk
    let workersPath = `M ${w.x} ${w.y} H ${trunkX}`
    if (Math.abs(w.y - cL.y) > 4) {
      if (w.y > cL.y) {
        workersPath = `M ${w.x} ${w.y} H ${trunkX - radius} Q ${trunkX} ${w.y} ${trunkX} ${w.y - radius} V ${cL.y}`
      } else {
        workersPath = `M ${w.x} ${w.y} H ${trunkX - radius} Q ${trunkX} ${w.y} ${trunkX} ${w.y + radius} V ${cL.y}`
      }
    }

    // Path 3: From Fraud Checks right edge to bus trunk and up to centerLeft y
    const queuesPath = `M ${q.x} ${q.y} H ${trunkX - radius} Q ${trunkX} ${q.y} ${trunkX} ${q.y - radius} V ${cL.y}`

    // Path 4: Trunk arrow horizontally straight into the left edge of Inventory Management Node
    const trunkToCenterPath = `M ${trunkX} ${cL.y} H ${cL.x}`

    // Path 5: Center Right to Packaging Dock & Logistics Left (Direct In-Stock Path)
    const centerToBindingsPath = `M ${cR.x} ${cR.y} H ${bL.x}`

    // Path 6: Center Bottom to Production Batches Top (Fallback Path)
    const centerToProdPath = `M ${cB.x} ${cB.y} V ${pT.y}`

    // Path 7: Production Right to Packaging Dock Left (Merge upon QA clearance)
    const mergeMidX = Math.round(pR.x + (bL.x - pR.x) * 0.5)
    const prodToBindingsPath = `M ${pR.x} ${pR.y} H ${mergeMidX - radius} Q ${mergeMidX} ${pR.y} ${mergeMidX} ${pR.y - radius} V ${cL.y + radius} Q ${mergeMidX} ${cL.y} ${mergeMidX + radius} ${cL.y} H ${bL.x}`

    return {
      domainsPath,
      workersPath,
      queuesPath,
      trunkToCenterPath,
      centerToBindingsPath,
      centerToProdPath,
      prodToBindingsPath
    }
  }, [coords])

  return (
    <div className="space-y-3 font-sans transition-all">
      {/* =========================================================================
          1. TOP BAR (MATCHING SCREENSHOT 1 & 2 TOP BAR - WITH REAL SMOKEY OPERATIONAL DATA)
         ========================================================================= */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        {/* Left: Globe and Route Text */}
        <div className="flex items-center gap-2.5 text-[#18181b]">
          <Globe className="w-4 h-4 text-[#71717a] shrink-0" />
          <span className="font-normal text-[13px] tracking-tight">
            smokeyhut.streetmbasolution.com/orders/pipeline/*+4 pillars
          </span>
          <span className="text-[#a1a1aa] font-mono text-[11px] hidden sm:inline">
            (End-to-End Visual Order Stream)
          </span>
        </div>

        {/* Right: Controls + Author info */}
        <div className="flex items-center gap-3">
          {/* Active Order Switcher */}
          <div className="flex items-center gap-1.5 bg-[#f4f4f5] p-0.5 rounded-lg border border-[#e4e4e7]">
            {orders.slice(0, 4).map((ord) => (
              <button
                key={ord.id}
                type="button"
                onClick={() => setSelectedOrderId(ord.id)}
                className={cn(
                  "px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer",
                  selectedOrderId === ord.id
                    ? "bg-white text-[#18181b] shadow-xs font-semibold"
                    : "text-[#71717a] hover:text-[#18181b]"
                )}
              >
                {ord.id}
                {!ord.hasStock && (
                  <span className="ml-1 text-[9px] text-[#f59e0b] font-bold" title="Stockout Fallback">★</span>
                )}
              </button>
            ))}
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={stepOrderForward}
              disabled={activeOrder?.currentStage === 'completed'}
              className="h-7 px-2.5 rounded-lg border border-[#d4d4d8] bg-white hover:bg-[#f4f4f5] text-[12px] font-medium text-[#18181b] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <Play className="w-3 h-3 text-[#2563eb] fill-[#2563eb]" />
              <span>Step Stage</span>
            </button>

            <button
              type="button"
              onClick={triggerNewWebhookOrder}
              className="h-7 px-2.5 rounded-lg border border-[#d4d4d8] bg-white hover:bg-[#f4f4f5] text-[12px] font-medium text-[#18181b] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Zap className="w-3 h-3 text-[#f59e0b]" />
              <span>+ Ingest Order</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAutoStreamActive(!isAutoStreamActive)}
              className={cn(
                "h-7 px-2.5 rounded-lg border text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs",
                isAutoStreamActive
                  ? "bg-[#2563eb] text-white border-[#2563eb]"
                  : "bg-white border-[#d4d4d8] text-[#18181b] hover:bg-[#f4f4f5]"
              )}
            >
              <RefreshCw className={cn("w-3 h-3", isAutoStreamActive && "animate-spin")} />
              <span>{isAutoStreamActive ? 'Streaming' : 'Auto-Stream'}</span>
            </button>
          </div>

          <span className="text-[12px] text-[#71717a] hidden lg:inline">
            by ayodine47 <span className="text-[#a1a1aa]">3 days ago</span>
          </span>
        </div>
      </div>

      {/* =========================================================================
          2. MAIN WORKFLOW CANVAS (EXACT CLOUDFLARE REFERENCE SCREENSHOT CARD)
         ========================================================================= */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 sm:p-8 relative shadow-2xs transition-all overflow-hidden">
        {/* ACTIVE ORDER SUB-BAR */}
        <div className="flex flex-wrap items-center justify-between pb-6 mb-6 border-b border-[#f4f4f5] gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#71717a]">Order Payload:</span>
            <span className="font-semibold text-[13px] text-[#18181b]">{activeOrder?.id}</span>
            <span className="text-[#a1a1aa]">·</span>
            <span className="text-[13px] text-[#52525b]">{activeOrder?.dishName}</span>
            <span className="text-[#a1a1aa]">·</span>
            <span className="font-medium text-[13px] text-[#18181b]">{formatNaira(activeOrder?.totalAmount || 0)}</span>
            <span className="text-[#a1a1aa]">·</span>
            <span className="text-[12px] text-[#71717a]">({activeOrder?.channel})</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#71717a]">Branch State:</span>
            {activeOrder?.hasStock ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                In Stock (Direct to Packaging)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Stockout Fallback (Production Batch Required)
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f4f4f5] text-[#18181b] border border-[#e4e4e7] capitalize">
              Phase: {activeOrder?.currentStage.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* WORKFLOW CANVAS GRAPH CONTAINER */}
        {isCanvasExpanded && (
          <div ref={containerRef} className="relative min-h-[460px] pb-4">
            {/* SVG DIRECTIONAL CONNECTING PATHS (DYNAMICALLY LOCKED TO CARD REFS) */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Gray Default Arrowhead */}
                <marker
                  id="cf-arrow-default"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <polygon points="0 2, 7 5, 0 8" fill="#9ca3af" />
                </marker>

                {/* Blue Active Glowing Arrowhead */}
                <marker
                  id="cf-arrow-blue"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <polygon points="0 2, 7 5, 0 8" fill="#2563eb" />
                </marker>

                {/* Amber Production Fallback Arrowhead */}
                <marker
                  id="cf-arrow-amber"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <polygon points="0 2, 7 5, 0 8" fill="#f59e0b" />
                </marker>

                {/* Emerald Completed Arrowhead */}
                <marker
                  id="cf-arrow-emerald"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <polygon points="0 2, 7 5, 0 8" fill="#10b981" />
                </marker>
              </defs>

              {svgPaths && (
                <>
                  {/* Curve 1: From Storefront Webhooks down to bus trunk */}
                  <path
                    d={svgPaths.domainsPath}
                    fill="none"
                    stroke={activeOrder?.history.includes('sales_webhook') ? '#2563eb' : '#9ca3af'}
                    strokeWidth={1.75}
                  />

                  {/* Curve 2: From Payments straight into bus trunk */}
                  <path
                    d={svgPaths.workersPath}
                    fill="none"
                    stroke={activeOrder?.history.includes('payment_verification') ? '#2563eb' : '#9ca3af'}
                    strokeWidth={1.75}
                  />

                  {/* Curve 3: From Fraud Checks up to bus trunk */}
                  <path
                    d={svgPaths.queuesPath}
                    fill="none"
                    stroke={activeOrder?.history.includes('fraud_check') ? '#2563eb' : '#9ca3af'}
                    strokeWidth={1.75}
                  />

                  {/* Single Arrow Stem from bus trunk into thecentralreport / Inventory Node */}
                  <path
                    d={svgPaths.trunkToCenterPath}
                    fill="none"
                    stroke={activeOrder?.history.includes('inventory_check') ? '#2563eb' : '#9ca3af'}
                    strokeWidth={1.75}
                    markerEnd={
                      activeOrder?.history.includes('inventory_check')
                        ? 'url(#cf-arrow-blue)'
                        : 'url(#cf-arrow-default)'
                    }
                  />

                  {/* Direct Path (In-stock flow) from Inventory Management to Fulfillment Dock */}
                  <path
                    d={svgPaths.centerToBindingsPath}
                    fill="none"
                    stroke={
                      activeOrder?.hasStock && activeOrder?.history.includes('logistics_packing')
                        ? '#10b981'
                        : activeOrder?.hasStock && activeOrder?.currentStage === 'inventory_check'
                        ? '#2563eb'
                        : '#9ca3af'
                    }
                    strokeWidth={activeOrder?.hasStock ? 2 : 1.75}
                    strokeDasharray={activeOrder?.hasStock && activeOrder?.currentStage === 'inventory_check' ? '5,5' : 'none'}
                    markerEnd={
                      activeOrder?.hasStock && activeOrder?.history.includes('logistics_packing')
                        ? 'url(#cf-arrow-emerald)'
                        : activeOrder?.hasStock && activeOrder?.currentStage === 'inventory_check'
                        ? 'url(#cf-arrow-blue)'
                        : 'url(#cf-arrow-default)'
                    }
                  />

                  {/* Dynamic Fallback Branch: Inventory -> Production Batches */}
                  {!activeOrder?.hasStock && (
                    <>
                      {/* Branch down from center engine to production pit engine */}
                      <path
                        d={svgPaths.centerToProdPath}
                        fill="none"
                        stroke={
                          activeOrder?.history.includes('production_queue') || activeOrder?.currentStage.startsWith('production')
                            ? '#f59e0b'
                            : '#9ca3af'
                        }
                        strokeWidth={2}
                        strokeDasharray={activeOrder?.currentStage === 'inventory_check' ? '5,5' : 'none'}
                        markerEnd="url(#cf-arrow-amber)"
                      />

                      {/* Branch from production engine QA Pass back up and into Fulfillment */}
                      <path
                        d={svgPaths.prodToBindingsPath}
                        fill="none"
                        stroke={
                          activeOrder?.history.includes('logistics_packing')
                            ? '#10b981'
                            : activeOrder?.currentStage === 'production_qa'
                            ? '#2563eb'
                            : '#9ca3af'
                        }
                        strokeWidth={2}
                        strokeDasharray={activeOrder?.currentStage === 'production_qa' ? '5,5' : 'none'}
                        markerEnd={
                          activeOrder?.history.includes('logistics_packing')
                            ? 'url(#cf-arrow-emerald)'
                            : 'url(#cf-arrow-default)'
                        }
                      />
                    </>
                  )}
                </>
              )}
            </svg>

            {/* THREE-COLUMN HORIZONTAL WORKFLOW FLOW (EXACT SCREENSHOT LAYOUT WITH REAL SMOKEY DATA) */}
            <div className="flex flex-row items-start justify-between gap-10 sm:gap-14 relative z-10 overflow-x-auto pb-4">
              {/* =========================================================================
                  COLUMN 1: THE 3 TRIGGER CARDS (PILLAR 1: SALES & ENTRY TRIGGERS)
                  (Domains -> Storefront Ingestion, Workers -> Payment Clearance, Queues -> Fraud & Geofence)
                 ========================================================================= */}
              <div className="w-[215px] sm:w-[230px] shrink-0 space-y-3.5">
                {/* 1A. STOREFRONT INGESTION (Replaces Domains) */}
                <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs hover:border-[#a1a1aa]">
                  <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                    {/* Header */}
                    <div
                      ref={webhooksHeaderRef}
                      onClick={() => toggleNodeExpansion('webhooks')}
                      className="px-4 py-2.5 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-[#fafafa] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[15px] font-normal text-[#18181b]">Webhooks</span>
                        <span className="bg-[#52525b] text-white text-[12px] font-semibold px-2 py-0.5 rounded-[5px] min-w-[20px] text-center inline-block leading-tight">
                          {incomingWebhooksCount}
                        </span>
                      </div>
                      {expandedNodes.webhooks ? (
                        <ChevronUp className="w-4 h-4 text-[#71717a] stroke-[2]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#71717a] stroke-[2]" />
                      )}
                    </div>

                    {/* Expanded Content (Smokey Hut Order Ingestion Endpoints) */}
                    {expandedNodes.webhooks && (
                      <div className="border-t border-[#f4f4f5] bg-white">
                        {/* Section 1: Ingestion API */}
                        <div className="px-4 py-2.5 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] text-[#52525b]">paystack.webhook</span>
                            <span className="bg-[#e4e4e7] text-[#52525b] text-[11px] px-2 py-0.5 rounded-full font-medium">
                              Active
                            </span>
                          </div>
                          <p className="text-[12px] text-[#71717a] font-normal truncate">
                            smokeyhut.streetmbasolution.com/api/v1/orders
                          </p>
                        </div>

                        {/* Section 2: Active Payload */}
                        <div className="border-t border-[#f4f4f5] px-4 py-2.5 space-y-1">
                          <div className="text-[13px] text-[#71717a]">Order Payload</div>
                          <div className="flex items-center justify-between text-[13px] text-[#52525b] hover:text-[#18181b] cursor-pointer">
                            <span className="font-mono text-xs">{activeOrder?.id} · {formatNaira(activeOrder?.totalAmount || 0)}</span>
                            <Plus className="w-3.5 h-3.5 text-[#71717a]" />
                          </div>
                        </div>

                        {/* Section 3: Ingestion Channels */}
                        <div className="border-t border-[#f4f4f5] px-4 py-2.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] text-[#71717a]">Channels</span>
                            <Plus className="w-3.5 h-3.5 text-[#71717a] cursor-pointer" />
                          </div>
                          <p className="text-[13px] text-[#18181b] font-normal leading-snug">
                            website.smokeyhut.com/*
                          </p>
                          <p className="text-[13px] text-[#18181b] font-normal leading-snug">
                            whatsapp.smokeyhut.com/menu/*
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 1B. PAYMENT CLEARANCE (Replaces Workers) */}
                <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs hover:border-[#a1a1aa]">
                  <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                    {/* Header */}
                    <div
                      ref={paymentsHeaderRef}
                      onClick={() => toggleNodeExpansion('payments')}
                      className="px-4 py-2.5 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-[#fafafa] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[15px] font-normal text-[#18181b]">Payments</span>
                        <span className="bg-[#e4e4e7] text-[#71717a] text-[12px] font-semibold px-2 py-0.5 rounded-[5px] min-w-[20px] text-center inline-block leading-tight">
                          {pendingPaymentsCount}
                        </span>
                      </div>
                      {expandedNodes.payments ? (
                        <ChevronUp className="w-4 h-4 text-[#71717a] stroke-[2]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#71717a] stroke-[2]" />
                      )}
                    </div>

                    {/* Expanded Content */}
                    {expandedNodes.payments && (
                      <div className="border-t border-[#f4f4f5] px-4 py-3 bg-white">
                        <p className="text-[13px] text-[#71717a] font-normal">
                          Paystack Escrow Settlement Verified
                        </p>
                        <div className="mt-2 pt-2 border-t border-[#f4f4f5] text-[11px] text-[#a1a1aa]">
                          Ref: <strong className="font-mono text-[#18181b]">{activeOrder?.paymentRef}</strong> (3DS Secured)
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 1C. FRAUD & GEOFENCE CHECKS (Replaces Queues) */}
                <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs hover:border-[#a1a1aa]">
                  <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                    {/* Header */}
                    <div
                      ref={fraudHeaderRef}
                      onClick={() => toggleNodeExpansion('fraud')}
                      className="px-4 py-2.5 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-[#fafafa] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[15px] font-normal text-[#18181b]">Risk & Geo</span>
                        <span className="bg-[#e4e4e7] text-[#71717a] text-[12px] font-semibold px-2 py-0.5 rounded-[5px] min-w-[20px] text-center inline-block leading-tight">
                          {fraudEvaluationsCount}
                        </span>
                      </div>
                      {expandedNodes.fraud ? (
                        <ChevronUp className="w-4 h-4 text-[#71717a] stroke-[2]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#71717a] stroke-[2]" />
                      )}
                    </div>

                    {/* Expanded Content */}
                    {expandedNodes.fraud && (
                      <div className="border-t border-[#f4f4f5] px-4 py-3 bg-white">
                        <div className="flex items-center justify-between text-[13px] text-[#52525b] hover:text-[#18181b] cursor-pointer">
                          <span>Address Geofence Check</span>
                          <Plus className="w-3.5 h-3.5 text-[#71717a]" />
                        </div>
                        <div className="mt-2 pt-2 border-t border-[#f4f4f5] text-[11px] text-[#a1a1aa]">
                          {activeOrder?.destinationAddress} · <span className="font-bold text-emerald-600">Risk Score 0.01 (Safe)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* =========================================================================
                  COLUMN 2: CENTER ENGINE (PILLAR 2: INVENTORY MANAGEMENT NODE)
                  (thecentralreport -> smokeyhut-inventory-engine)
                 ========================================================================= */}
              <div className="w-[270px] sm:w-[300px] shrink-0 space-y-5">
                {/* PRIMARY INVENTORY ENGINE CARD */}
                <div
                  ref={centerCardRef}
                  className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs"
                >
                  <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                    {/* Header: Exact match for Screenshot 4 with Smokey Engine branding */}
                    <div
                      ref={centerHeaderRef}
                      className="px-4 py-3 flex items-center justify-between bg-white"
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Workers Diamond Code Icon */}
                        <svg
                          className="w-5 h-5 text-[#18181b] shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="7 8 3 12 7 16" />
                          <polyline points="11 6 15 12 11 18" />
                          <polyline points="17 8 21 12 17 16" />
                        </svg>
                        <span className="text-[15px] font-normal text-[#18181b]">
                          smokeyhut-inventory
                        </span>
                      </div>

                      {/* Blue Status Dot with Outer Aura */}
                      <span className="w-4 h-4 rounded-full bg-[#bfdbfe]/60 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
                      </span>
                    </div>

                    {/* Body: Observability & Leader lines */}
                    <div className="border-t border-[#f4f4f5] px-4 py-3 space-y-3 bg-white">
                      <div className="text-[13px] text-[#71717a] font-normal">
                        Sales Inventory Telemetry
                      </div>

                      {/* Row 1: Stock Database Check with Leader Line */}
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#18181b] font-normal whitespace-nowrap">
                          Stock Check
                        </span>
                        <div className="flex-1 h-[1px] bg-[#e4e4e7] mx-3" />
                        <span className={cn(
                          "border rounded-full px-2.5 py-0.5 text-[12px] font-medium",
                          activeOrder?.hasStock
                            ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                            : "border-amber-300 text-amber-700 bg-amber-50"
                        )}>
                          {activeOrder?.hasStock ? 'Available' : 'Stockout'}
                        </span>
                      </div>

                      {/* Row 2: Recipe & BOM Allocation with Leader Line */}
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#18181b] font-normal whitespace-nowrap">
                          BOM Deduct
                        </span>
                        <div className="flex-1 h-[1px] bg-[#e4e4e7] mx-3" />
                        <span className="border border-[#d4d4d8] rounded-full px-2.5 py-0.5 text-[12px] text-[#52525b] bg-white">
                          Automated
                        </span>
                      </div>

                      {/* Operational Stock Status Note */}
                      <div className="pt-2 border-t border-[#f4f4f5] flex items-center justify-between text-[12px]">
                        <span className="text-[#71717a]">Storage Bin Pick:</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded font-medium text-[11px]",
                          activeOrder?.hasStock
                            ? "bg-emerald-50 text-emerald-700 font-semibold"
                            : "bg-amber-50 text-amber-700 font-semibold"
                        )}>
                          {activeOrder?.hasStock ? 'Sales Bins Verified' : 'Branch to Smoking Pit'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* =========================================================================
                    PILLAR 3: PRODUCTION BATCHES NODE (Bulk Smoking Pit & QA Clearance)
                    (Rendered when stockout fallback occurs)
                   ========================================================================= */}
                {!activeOrder?.hasStock && (
                  <div
                    ref={productionCardRef}
                    className="p-[2.5px] rounded-[16px] border border-[#f59e0b]/50 bg-white transition-all shadow-2xs animate-in fade-in"
                  >
                    <div className="rounded-[12px] border border-[#f59e0b]/40 bg-white overflow-hidden">
                      {/* Header */}
                      <div
                        ref={productionHeaderRef}
                        className="px-4 py-3 flex items-center justify-between bg-white"
                      >
                        <div className="flex items-center gap-2.5">
                          <Flame className="w-5 h-5 text-[#f59e0b]" />
                          <span className="text-[15px] font-normal text-[#18181b]">
                            production-kitchen
                          </span>
                        </div>
                        <span className="w-4 h-4 rounded-full bg-[#fed7aa]/60 flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                        </span>
                      </div>

                      {/* Sequential Processing Markers */}
                      <div className="border-t border-[#f4f4f5] px-4 py-3 space-y-2.5 bg-white text-[13px]">
                        <div className="text-[13px] text-[#71717a]">Sequential Processing Markers</div>

                        <div className="flex items-center justify-between">
                          <span className="text-[#18181b]">Queue Assignment</span>
                          <div className="flex-1 h-[1px] bg-[#e4e4e7] mx-2" />
                          <span className="text-[11px] font-mono font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {activeOrder?.batchId || 'BAT-SMK-402'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[#18181b]">Manufacturing Phase</span>
                          <div className="flex-1 h-[1px] bg-[#e4e4e7] mx-2" />
                          <span className="text-[11px] font-mono text-[#f59e0b] bg-amber-50 px-1.5 py-0.5 rounded">
                            110°C / Smoke
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[#18181b]">Quality Assurance</span>
                          <div className="flex-1 h-[1px] bg-[#e4e4e7] mx-2" />
                          <span className={cn(
                            "text-[11px] font-semibold px-1.5 py-0.5 rounded",
                            activeOrder?.history.includes('production_qa')
                              ? "text-emerald-700 bg-emerald-50"
                              : "text-[#71717a] bg-[#f4f4f5]"
                          )}>
                            {activeOrder?.history.includes('production_qa') ? 'QA Passed' : 'In Smoker'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* =========================================================================
                  COLUMN 3: BINDINGS CARD (PILLAR 4: LOGISTICS & FULFILLMENT NODE)
                  (Bindings -> Fulfillment Dock)
                 ========================================================================= */}
              <div className="w-[280px] sm:w-[320px] shrink-0">
                <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs hover:border-[#a1a1aa]">
                  <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                    {/* Header */}
                    <div
                      ref={fulfillmentHeaderRef}
                      onClick={() => toggleNodeExpansion('fulfillment')}
                      className="px-4 py-2.5 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-[#fafafa] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[15px] font-normal text-[#18181b]">Fulfillment</span>
                        <span className="bg-[#52525b] text-white text-[12px] font-semibold px-2 py-0.5 rounded-[5px] min-w-[20px] text-center inline-block leading-tight">
                          2
                        </span>
                      </div>
                      {expandedNodes.fulfillment ? (
                        <ChevronUp className="w-4 h-4 text-[#71717a] stroke-[2]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#71717a] stroke-[2]" />
                      )}
                    </div>

                    {/* Body: Action + Packaging Materials + Carrier Fleet Dispatch */}
                    {expandedNodes.fulfillment && (
                      <div className="border-t border-[#f4f4f5] bg-white">
                        {/* Action Row */}
                        <div className="px-4 py-2.5 flex items-center justify-between text-[13px] text-[#52525b] hover:text-[#18181b] cursor-pointer">
                          <span>Add a dispatch assignment</span>
                          <Plus className="w-3.5 h-3.5 text-[#71717a]" />
                        </div>

                        {/* Section 1: Packaging Materials (Replaces Assets) */}
                        <div className="border-t border-[#f4f4f5] px-4 py-2.5 space-y-1">
                          <div className="text-[12px] text-[#71717a]">Packaging Materials</div>
                          <div className="text-[13px] font-mono font-bold text-[#18181b] tracking-wider">
                            BAG_SEALED_CONFIRMED
                          </div>
                          <p className="text-[11px] text-[#a1a1aa]">
                            Thermal insulated box · Packaging inventory decremented
                          </p>
                        </div>

                        {/* Section 2: Fleet Carrier API (Replaces Images) */}
                        <div className="border-t border-[#f4f4f5] px-4 py-2.5 space-y-1">
                          <div className="text-[12px] text-[#71717a]">Logistics Dispatch Board</div>
                          <div className="text-[13px] font-mono font-bold text-[#18181b] tracking-wider">
                            RIDER_YUSUF_ASSIGNED
                          </div>
                          <p className="text-[11px] text-[#a1a1aa]">
                            Assignee: <strong className="text-[#18181b]">{activeOrder?.riderName || 'Rider Yusuf (Fleet)'}</strong> · GPS Active
                          </p>
                        </div>

                        {/* Terminal Webhook Trigger Row */}
                        <div className="border-t border-[#f4f4f5] px-4 py-2.5 bg-[#fafafa]">
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] text-[#71717a]">Doorstep Handover:</span>
                            <span className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded",
                              activeOrder?.currentStage === 'completed'
                                ? "bg-emerald-600 text-white"
                                : "bg-[#e4e4e7] text-[#52525b]"
                            )}>
                              {activeOrder?.currentStage === 'completed' ? 'Delivered & Settled' : `Awaiting OTP: ${activeOrder?.otpCode}`}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#71717a] mt-1">
                            Fires instant customer receipt & auto-credits ₦4,000 delivery fee to Rider wallet upon sign-off.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            3. BOTTOM COLLAPSE / EXPAND CHEVRON HANDLE (EXACT MATCH FOR SCREENSHOT 2)
           ========================================================================= */}
        <div className="mt-4 pt-2 border-t border-[#f4f4f5] flex items-center justify-center">
          <button
            type="button"
            onClick={() => setIsCanvasExpanded(!isCanvasExpanded)}
            className="text-[#71717a] hover:text-[#18181b] transition-colors p-1 cursor-pointer"
            aria-label={isCanvasExpanded ? 'Collapse canvas' : 'Expand canvas'}
          >
            {isCanvasExpanded ? (
              <ChevronUp className="w-5 h-5 stroke-[1.75]" />
            ) : (
              <ChevronDown className="w-5 h-5 stroke-[1.75]" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrderWorkflowCanvasOverlay
