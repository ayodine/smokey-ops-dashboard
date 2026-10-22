import React, { useState, useEffect, useMemo } from 'react'
import {
  Globe,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  Zap,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
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
  channel: 'Storefront Webhook' | 'Mobile App' | 'WhatsApp Direct'
  hasStock: boolean
  currentStage: PipelineStage
  paymentRef: string
  batchId?: string
  riderName?: string
  etaMinutes?: number
  otpCode: string
  history: PipelineStage[]
}

const DEFAULT_ORDERS: PipelineOrder[] = [
  {
    id: 'ORD-8842',
    customerName: 'Babajide Sanwo',
    dishName: 'Smoked Beef Brisket Feast',
    totalAmount: 18500,
    portions: 3,
    channel: 'Storefront Webhook',
    hasStock: false, // Stockout fallback into Production Batches!
    currentStage: 'production_cook',
    paymentRef: 'pay_smk_99182',
    batchId: 'BATCH-SMK-402',
    riderName: 'Tunde Bakare',
    etaMinutes: 18,
    otpCode: '4821',
    history: ['sales_webhook', 'payment_verification', 'fraud_check', 'inventory_check', 'production_queue', 'production_cook']
  },
  {
    id: 'ORD-8843',
    customerName: 'Amaka Okafor',
    dishName: 'BBQ Smoked Pork Ribs Family Platter',
    totalAmount: 24000,
    portions: 2,
    channel: 'Mobile App',
    hasStock: true, // In stock, straight to packaging!
    currentStage: 'logistics_packing',
    paymentRef: 'pay_smk_99183',
    riderName: 'Femi Adeyemi',
    etaMinutes: 25,
    otpCode: '7239',
    history: ['sales_webhook', 'payment_verification', 'fraud_check', 'inventory_check', 'logistics_packing']
  },
  {
    id: 'ORD-8844',
    customerName: 'Chinedu Eze',
    dishName: 'Peppered Turkey Wings Pack',
    totalAmount: 9500,
    portions: 1,
    channel: 'WhatsApp Direct',
    hasStock: true,
    currentStage: 'payment_verification',
    paymentRef: 'pay_smk_99184',
    otpCode: '1092',
    history: ['sales_webhook', 'payment_verification']
  },
  {
    id: 'ORD-8845',
    customerName: 'Folake Adeleke',
    dishName: 'Smoked Pulled Pork Rice Bowl',
    totalAmount: 12000,
    portions: 2,
    channel: 'Storefront Webhook',
    hasStock: true,
    currentStage: 'completed',
    paymentRef: 'pay_smk_99180',
    riderName: 'Segun Ojo',
    etaMinutes: 0,
    otpCode: '8834',
    history: ['sales_webhook', 'payment_verification', 'fraud_check', 'inventory_check', 'logistics_packing', 'logistics_dispatch', 'logistics_delivery', 'completed']
  }
]

export const OrderWorkflowCanvasOverlay: React.FC = () => {
  const { showToast } = useSmokeyOps()

  // Full canvas collapse/expand state (matching Screenshot 2 bottom chevron)
  const [isCanvasExpanded, setIsCanvasExpanded] = useState<boolean>(true)

  // Auto-stream interval toggle
  const [isAutoStreamActive, setIsAutoStreamActive] = useState<boolean>(false)

  // Orders in pipeline state
  const [orders, setOrders] = useState<PipelineOrder[]>(DEFAULT_ORDERS)
  const [selectedOrderId, setSelectedOrderId] = useState<string>('ORD-8842')

  // Node cards expansion state matching Screenshot 1 (collapsed) vs Screenshot 2 & 5 (expanded)
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    domains: false,
    workers: false,
    queues: false,
    inventory: true,
    production: true,
    bindings: true
  })

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
        // Fallback branching: stockout goes to production queue; in-stock goes directly to logistics
        return hasStock ? 'logistics_packing' : 'production_queue'
      case 'production_queue':
        return 'production_cook'
      case 'production_cook':
        return 'production_qa'
      case 'production_qa':
        // QA Passed: merge branch into Logistics
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
      showToast(`Order ${activeOrder.id} is already completed. Terminal webhook triggered.`, 'info')
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
      showToast(`Terminal Node Triggered: Customer ${activeOrder.customerName} notified via SMS/WhatsApp with OTP!`, 'success')
    } else if (next === 'production_queue' && !activeOrder.hasStock) {
      showToast(`Stockout Fallback: Order ${activeOrder.id} dynamically routed to Smoking Pit Queue!`, 'info')
    } else {
      showToast(`Order ${activeOrder.id} transitioned to ${next.replace(/_/g, ' ').toUpperCase()}`, 'info')
    }
  }

  // Simulate Brand New Webhook Incoming Order
  const triggerNewWebhookOrder = () => {
    const randomNum = Math.floor(8846 + Math.random() * 500)
    const newId = `ORD-${randomNum}`
    const dishes = [
      { name: 'Peppered Asun Meat Plate', amount: 8500, stock: true },
      { name: 'Smoked Giant Turkey Drumstick', amount: 11000, stock: false },
      { name: 'Fire-Smoked BBQ Ribs Combo', amount: 22000, stock: true },
      { name: 'Smokey Hut Jollof & Brisket', amount: 14500, stock: false }
    ]
    const chosen = dishes[Math.floor(Math.random() * dishes.length)]
    const channels: Array<'Storefront Webhook' | 'Mobile App' | 'WhatsApp Direct'> = [
      'Storefront Webhook',
      'Mobile App',
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
      otpCode: `${Math.floor(1000 + Math.random() * 9000)}`,
      history: ['sales_webhook']
    }

    setOrders((prev) => [newOrder, ...prev])
    setSelectedOrderId(newId)
    showToast(`Incoming Webhook Triggered: New order ${newId} received from ${chosenChannel}!`, 'success')
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

  // Count states for trigger badges matching screenshot
  const webhookCount = 2
  const workersCount = 0
  const queuesCount = 0

  return (
    <div className="space-y-3 font-sans transition-all">
      {/* =========================================================================
          1. TOP BAR (EXACT CLOUDFLARE REFERENCE SCREENSHOT 1 & 2 TOP BAR)
         ========================================================================= */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        {/* Left: Globe and Route Text */}
        <div className="flex items-center gap-2.5 text-[#18181b]">
          <Globe className="w-4 h-4 text-[#71717a] shrink-0" />
          <span className="font-normal text-[13px] tracking-tight">
            thecentralreport.com/*+1 routes
          </span>
          <span className="text-[#a1a1aa] font-mono text-[11px] hidden sm:inline">
            (mapped to smokeyhut.com/orders/*)
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
                  <span className="ml-1 text-[9px] text-[#f59e0b] font-bold">★</span>
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
              <span>+ Webhook</span>
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
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-8 relative shadow-2xs transition-all overflow-hidden">
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
                In Stock (Direct Packaging)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Stockout Fallback (Production Branch)
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f4f4f5] text-[#18181b] border border-[#e4e4e7] capitalize">
              Phase: {activeOrder?.currentStage.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* WORKFLOW CANVAS GRAPH */}
        {isCanvasExpanded && (
          <div className="relative min-h-[460px] pb-4">
            {/* SVG DIRECTIONAL CONNECTING PATHS (EXACT SHAPE & CURVES FROM SCREENSHOT 3) */}
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

              {/* -----------------------------------------------------------------
                  TRIGGER BUS TO CENTER ENGINE (Exact Match for Screenshot 3)
                  3 cards feed horizontally, curve into a vertical trunk, then arrow to center
                 ----------------------------------------------------------------- */}
              {/* Curve 1: From Domains (y ≈ 26) down to bus trunk (y = 86) */}
              <path
                d="M 230 26 H 252 Q 262 26 262 36 V 86"
                fill="none"
                stroke={activeOrder?.history.includes('sales_webhook') ? '#2563eb' : '#9ca3af'}
                strokeWidth={1.75}
              />

              {/* Curve 2: From Workers (y ≈ 86) straight into bus trunk */}
              <path
                d="M 230 86 H 262"
                fill="none"
                stroke={activeOrder?.history.includes('payment_verification') ? '#2563eb' : '#9ca3af'}
                strokeWidth={1.75}
              />

              {/* Curve 3: From Queues (y ≈ 146) up to bus trunk (y = 86) */}
              <path
                d="M 230 146 H 252 Q 262 146 262 136 V 86"
                fill="none"
                stroke={activeOrder?.history.includes('fraud_check') ? '#2563eb' : '#9ca3af'}
                strokeWidth={1.75}
              />

              {/* Single Arrow Stem from bus trunk into thecentralreport / center node (y = 86) */}
              <path
                d="M 262 86 H 312"
                fill="none"
                stroke={activeOrder?.history.includes('inventory_check') ? '#2563eb' : '#9ca3af'}
                strokeWidth={1.75}
                markerEnd={
                  activeOrder?.history.includes('inventory_check')
                    ? 'url(#cf-arrow-blue)'
                    : 'url(#cf-arrow-default)'
                }
              />

              {/* -----------------------------------------------------------------
                  PATH FROM CENTER ENGINE TO RIGHT (BINDINGS / LOGISTICS)
                 ----------------------------------------------------------------- */}
              {/* Direct Path (In-stock flow) from thecentralreport (right edge x ≈ 570) to Bindings (x ≈ 640) */}
              <path
                d="M 570 86 H 638"
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

              {/* -----------------------------------------------------------------
                  FALLBACK BRANCH: INVENTORY -> PRODUCTION BATCHES (When Out of Stock)
                 ----------------------------------------------------------------- */}
              {!activeOrder?.hasStock && (
                <>
                  {/* Branch down from center engine to production engine (x ≈ 445, y from 160 to 240) */}
                  <path
                    d="M 445 160 V 238"
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

                  {/* Branch from production engine QA Pass back up and into Logistics (x ≈ 570, y ≈ 290 to x ≈ 638, y ≈ 110) */}
                  <path
                    d="M 570 290 H 598 Q 608 290 608 280 V 118 Q 608 108 618 108 H 638"
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
            </svg>

            {/* NODE GRID COLUMNS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10 items-start">
              {/* =========================================================================
                  COLUMN 1: THE 3 TRIGGER CARDS (PILLAR 1: SALES & TRIGGERS)
                  (EXACT MATCH FOR SCREENSHOT 1, 2, 3, 5 - DOUBLE CONCENTRIC BORDERS)
                 ========================================================================= */}
              <div className="md:col-span-3 space-y-3.5 max-w-[230px]">
                {/* 1A. DOMAINS CARD (Storefront Checkout Webhook) */}
                <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs hover:border-[#a1a1aa]">
                  <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                    {/* Header */}
                    <div
                      onClick={() => toggleNodeExpansion('domains')}
                      className="px-4 py-2.5 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-[#fafafa] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[15px] font-normal text-[#18181b]">Domains</span>
                        <span className="bg-[#52525b] text-white text-[12px] font-semibold px-2 py-0.5 rounded-[5px] min-w-[20px] text-center inline-block leading-tight">
                          {webhookCount}
                        </span>
                      </div>
                      {expandedNodes.domains ? (
                        <ChevronUp className="w-4 h-4 text-[#71717a] stroke-[2]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#71717a] stroke-[2]" />
                      )}
                    </div>

                    {/* Expanded Content (Exact match for Screenshot 5) */}
                    {expandedNodes.domains && (
                      <div className="border-t border-[#f4f4f5] bg-white">
                        {/* Section 1: workers.dev */}
                        <div className="px-4 py-2.5 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] text-[#52525b]">workers.dev</span>
                            <span className="bg-[#e4e4e7] text-[#52525b] text-[11px] px-2 py-0.5 rounded-full font-medium">
                              Disabled
                            </span>
                          </div>
                          <p className="text-[12px] text-[#71717a] font-normal truncate">
                            thecentralreport.ayodine47.workers.d...
                          </p>
                        </div>

                        {/* Section 2: Custom domains */}
                        <div className="border-t border-[#f4f4f5] px-4 py-2.5 space-y-1">
                          <div className="text-[13px] text-[#71717a]">Custom domains</div>
                          <div className="flex items-center justify-between text-[13px] text-[#52525b] hover:text-[#18181b] cursor-pointer">
                            <span>Add a custom domain</span>
                            <Plus className="w-3.5 h-3.5 text-[#71717a]" />
                          </div>
                        </div>

                        {/* Section 3: Routes */}
                        <div className="border-t border-[#f4f4f5] px-4 py-2.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] text-[#71717a]">Routes</span>
                            <Plus className="w-3.5 h-3.5 text-[#71717a] cursor-pointer" />
                          </div>
                          <p className="text-[13px] text-[#18181b] font-normal leading-snug">
                            thecentralreport.com/*
                          </p>
                          <p className="text-[13px] text-[#18181b] font-normal leading-snug">
                            www.thecentralreport.com/*
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 1B. WORKERS CARD (Payment Gateway Verification) */}
                <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs hover:border-[#a1a1aa]">
                  <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                    {/* Header */}
                    <div
                      onClick={() => toggleNodeExpansion('workers')}
                      className="px-4 py-2.5 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-[#fafafa] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[15px] font-normal text-[#18181b]">Workers</span>
                        <span className="bg-[#e4e4e7] text-[#71717a] text-[12px] font-semibold px-2 py-0.5 rounded-[5px] min-w-[20px] text-center inline-block leading-tight">
                          {workersCount}
                        </span>
                      </div>
                      {expandedNodes.workers ? (
                        <ChevronUp className="w-4 h-4 text-[#71717a] stroke-[2]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#71717a] stroke-[2]" />
                      )}
                    </div>

                    {/* Expanded Content (Exact match for Screenshot 2) */}
                    {expandedNodes.workers && (
                      <div className="border-t border-[#f4f4f5] px-4 py-3 bg-white">
                        <p className="text-[13px] text-[#71717a] font-normal">
                          No workers bound to this worker
                        </p>
                        <div className="mt-2 pt-2 border-t border-[#f4f4f5] text-[11px] text-[#a1a1aa]">
                          Payment Ref: <strong className="font-mono text-[#18181b]">{activeOrder?.paymentRef}</strong> (3DS Verified)
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 1C. QUEUES CARD (Fraud & Geofence Risk Evaluation) */}
                <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs hover:border-[#a1a1aa]">
                  <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                    {/* Header */}
                    <div
                      onClick={() => toggleNodeExpansion('queues')}
                      className="px-4 py-2.5 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-[#fafafa] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[15px] font-normal text-[#18181b]">Queues</span>
                        <span className="bg-[#e4e4e7] text-[#71717a] text-[12px] font-semibold px-2 py-0.5 rounded-[5px] min-w-[20px] text-center inline-block leading-tight">
                          {queuesCount}
                        </span>
                      </div>
                      {expandedNodes.queues ? (
                        <ChevronUp className="w-4 h-4 text-[#71717a] stroke-[2]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#71717a] stroke-[2]" />
                      )}
                    </div>

                    {/* Expanded Content (Exact match for Screenshot 2) */}
                    {expandedNodes.queues && (
                      <div className="border-t border-[#f4f4f5] px-4 py-3 bg-white">
                        <div className="flex items-center justify-between text-[13px] text-[#52525b] hover:text-[#18181b] cursor-pointer">
                          <span>Add a queue consumer</span>
                          <Plus className="w-3.5 h-3.5 text-[#71717a]" />
                        </div>
                        <div className="mt-2 pt-2 border-t border-[#f4f4f5] text-[11px] text-[#a1a1aa]">
                          Fraud Score: <span className="font-bold text-emerald-600">0.02 (Safe)</span> · Victoria Island, Lagos
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* =========================================================================
                  COLUMN 2: CENTER ENGINE (PILLAR 2: INVENTORY MANAGEMENT NODE)
                  (EXACT MATCH FOR SCREENSHOT 1, 2, 4 - thecentralreport & OBSERVABILITY)
                 ========================================================================= */}
              <div className="md:col-span-5 space-y-5">
                {/* PRIMARY INVENTORY ENGINE CARD */}
                <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs max-w-[310px]">
                  <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                    {/* Header: Exact match for Screenshot 4 */}
                    <div className="px-4 py-3 flex items-center justify-between bg-white">
                      <div className="flex items-center gap-2.5">
                        {/* Cloudflare Workers Code Icon */}
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
                          thecentralreport
                        </span>
                      </div>

                      {/* Blue Indicator Dot with Outer Aura (Exact match for Screenshot 4) */}
                      <span className="w-4 h-4 rounded-full bg-[#bfdbfe]/60 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
                      </span>
                    </div>

                    {/* Body: Observability & Leader lines (Exact match for Screenshot 4) */}
                    <div className="border-t border-[#f4f4f5] px-4 py-3 space-y-3 bg-white">
                      <div className="text-[13px] text-[#71717a] font-normal">
                        Observability
                      </div>

                      {/* Row 1: Workers Logs with Leader Line */}
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#18181b] font-normal whitespace-nowrap">
                          Workers Logs
                        </span>
                        <div className="flex-1 h-[1px] bg-[#e4e4e7] mx-3" />
                        <span className="border border-[#d4d4d8] rounded-full px-2.5 py-0.5 text-[12px] text-[#52525b] bg-white">
                          Disabled
                        </span>
                      </div>

                      {/* Row 2: Workers Traces with Leader Line */}
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#18181b] font-normal whitespace-nowrap">
                          Workers Traces
                        </span>
                        <div className="flex-1 h-[1px] bg-[#e4e4e7] mx-3" />
                        <span className="border border-[#d4d4d8] rounded-full px-2.5 py-0.5 text-[12px] text-[#52525b] bg-white">
                          Disabled
                        </span>
                      </div>

                      {/* Operational Stock Mapping Row */}
                      <div className="pt-2 border-t border-[#f4f4f5] flex items-center justify-between text-[12px]">
                        <span className="text-[#71717a]">Stock Database Check:</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded font-medium text-[11px]",
                          activeOrder?.hasStock
                            ? "bg-emerald-50 text-emerald-700 font-semibold"
                            : "bg-amber-50 text-amber-700 font-semibold"
                        )}>
                          {activeOrder?.hasStock ? 'Available (Deducted)' : 'Stockout (Fallback to Pit)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* =========================================================================
                    PILLAR 3: PRODUCTION BATCHES NODE (Bulk Smoking Pit & QA Pass)
                    (Rendered when stockout fallback occurs, matching concentric styling)
                   ========================================================================= */}
                {!activeOrder?.hasStock && (
                  <div className="p-[2.5px] rounded-[16px] border border-[#f59e0b]/50 bg-white transition-all shadow-2xs max-w-[310px] animate-in fade-in">
                    <div className="rounded-[12px] border border-[#f59e0b]/40 bg-white overflow-hidden">
                      {/* Header */}
                      <div className="px-4 py-3 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-2.5">
                          <Flame className="w-5 h-5 text-[#f59e0b]" />
                          <span className="text-[15px] font-normal text-[#18181b]">
                            production-pit-engine
                          </span>
                        </div>
                        <span className="w-4 h-4 rounded-full bg-[#fed7aa]/60 flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                        </span>
                      </div>

                      {/* Sequential Markers */}
                      <div className="border-t border-[#f4f4f5] px-4 py-3 space-y-2.5 bg-white text-[13px]">
                        <div className="text-[13px] text-[#71717a]">Sequential Phase Markers</div>

                        <div className="flex items-center justify-between">
                          <span className="text-[#18181b]">Queue Assignment</span>
                          <div className="flex-1 h-[1px] bg-[#e4e4e7] mx-2" />
                          <span className="text-[11px] font-mono font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {activeOrder?.batchId || 'BATCH-402'}
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
                  COLUMN 3: BINDINGS CARD (PILLAR 4: LOGISTICS NODE)
                  (EXACT MATCH FOR SCREENSHOT 1 & 2 BINDINGS 2 CARD)
                 ========================================================================= */}
              <div className="md:col-span-4 max-w-[310px]">
                <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs hover:border-[#a1a1aa]">
                  <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                    {/* Header: Exact match for Screenshot 1 & 2 */}
                    <div
                      onClick={() => toggleNodeExpansion('bindings')}
                      className="px-4 py-2.5 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-[#fafafa] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[15px] font-normal text-[#18181b]">Bindings</span>
                        <span className="bg-[#52525b] text-white text-[12px] font-semibold px-2 py-0.5 rounded-[5px] min-w-[20px] text-center inline-block leading-tight">
                          2
                        </span>
                      </div>
                      {expandedNodes.bindings ? (
                        <ChevronUp className="w-4 h-4 text-[#71717a] stroke-[2]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#71717a] stroke-[2]" />
                      )}
                    </div>

                    {/* Body: Add a binding + Assets + Images (Exact match for Screenshot 1 & 2) */}
                    {expandedNodes.bindings && (
                      <div className="border-t border-[#f4f4f5] bg-white">
                        {/* Action Row */}
                        <div className="px-4 py-2.5 flex items-center justify-between text-[13px] text-[#52525b] hover:text-[#18181b] cursor-pointer">
                          <span>Add a binding</span>
                          <Plus className="w-3.5 h-3.5 text-[#71717a]" />
                        </div>

                        {/* Section 1: Assets */}
                        <div className="border-t border-[#f4f4f5] px-4 py-2.5 space-y-1">
                          <div className="text-[12px] text-[#71717a]">Assets</div>
                          <div className="text-[13px] font-mono font-bold text-[#18181b] tracking-wider">
                            ASSETS
                          </div>
                          <p className="text-[11px] text-[#a1a1aa]">
                            Packing Slip: Insulated Box · Slip generated
                          </p>
                        </div>

                        {/* Section 2: Images */}
                        <div className="border-t border-[#f4f4f5] px-4 py-2.5 space-y-1">
                          <div className="text-[12px] text-[#71717a]">Images</div>
                          <div className="text-[13px] font-mono font-bold text-[#18181b] tracking-wider">
                            IMAGES
                          </div>
                          <p className="text-[11px] text-[#a1a1aa]">
                            Carrier Fleet: <strong className="text-[#18181b]">{activeOrder?.riderName || 'Tunde Bakare'}</strong> (SHD-TRK-8842)
                          </p>
                        </div>

                        {/* Terminal Webhook Trigger Row */}
                        <div className="border-t border-[#f4f4f5] px-4 py-2.5 bg-[#fafafa]">
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] text-[#71717a]">Terminal Handover:</span>
                            <span className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded",
                              activeOrder?.currentStage === 'completed'
                                ? "bg-emerald-600 text-white"
                                : "bg-[#e4e4e7] text-[#52525b]"
                            )}>
                              {activeOrder?.currentStage === 'completed' ? 'Delivered' : `OTP: ${activeOrder?.otpCode}`}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#71717a] mt-1">
                            Webhook triggers instant customer SMS/WhatsApp receipt upon rider sign-off.
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
