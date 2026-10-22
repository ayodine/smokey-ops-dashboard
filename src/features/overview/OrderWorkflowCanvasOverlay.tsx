import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Globe,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  Package,
  Flame,
  Truck,
  CreditCard,
  ShieldCheck,
  Smartphone,
  Check,
  ArrowRight,
  Plus,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import { Toggle } from '@/components/ui/Toggle'
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
  isFailed?: boolean
  failureReason?: string
  history: PipelineStage[]
}

const DEFAULT_SIMULATED_ORDERS: PipelineOrder[] = [
  {
    id: 'ORD-8842',
    customerName: 'Babajide Sanwo',
    dishName: 'Smoked Beef Brisket Feast',
    totalAmount: 18500,
    portions: 3,
    channel: 'Storefront Webhook',
    hasStock: false, // Triggers production branch fallback!
    currentStage: 'production_qa',
    paymentRef: 'pay_smk_99182',
    batchId: 'BATCH-SMK-402',
    riderName: 'Tunde Bakare',
    etaMinutes: 18,
    otpCode: '4821',
    history: ['sales_webhook', 'payment_verification', 'fraud_check', 'inventory_check', 'production_queue', 'production_cook', 'production_qa']
  },
  {
    id: 'ORD-8843',
    customerName: 'Amaka Okafor',
    dishName: 'BBQ Smoked Pork Ribs Family Platter',
    totalAmount: 24000,
    portions: 2,
    channel: 'Mobile App',
    hasStock: true, // In stock, direct path!
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
  const { packagingQueue, productionBatches, logisticsDeliveries, showToast } = useSmokeyOps()

  // Collapse / Expand full canvas container state
  const [isCanvasExpanded, setIsCanvasExpanded] = useState<boolean>(true)

  // Auto-stream interval toggle
  const [isAutoStreamActive, setIsAutoStreamActive] = useState<boolean>(false)

  // Orders in pipeline state
  const [orders, setOrders] = useState<PipelineOrder[]>(DEFAULT_SIMULATED_ORDERS)
  const [selectedOrderId, setSelectedOrderId] = useState<string>('ORD-8842')

  // Node cards expansion state matching Reference Screenshots 1 & 2
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

  // Selected Active Order
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
        // Dynamic Branching: if stockout, fall back to production batches; otherwise go straight to logistics
        return hasStock ? 'logistics_packing' : 'production_queue'
      case 'production_queue':
        return 'production_cook'
      case 'production_cook':
        return 'production_qa'
      case 'production_qa':
        // Merge flow branch back down into logistics packaging
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

  // Step Order Forward through Pipeline
  const stepOrderForward = () => {
    if (!activeOrder) return

    if (activeOrder.currentStage === 'completed') {
      showToast(`Order ${activeOrder.id} is already completed! Terminal webhook fired.`, 'info')
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
      showToast(`Terminal Node Triggered: Customer ${activeOrder.customerName} notified via SMS/WhatsApp with OTP clearance!`, 'success')
    } else if (next === 'production_queue' && !activeOrder.hasStock) {
      showToast(`Stockout Fallback: Order ${activeOrder.id} dynamically branched to Smoking Pit Queue!`, 'info')
    } else {
      showToast(`Order ${activeOrder.id} progressed to ${next.replace('_', ' ').toUpperCase()}`, 'info')
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
    }, 4000)

    return () => clearInterval(interval)
  }, [isAutoStreamActive])

  // Helper function to check stage status for active order
  const getStageStatus = (stage: PipelineStage): 'completed' | 'active' | 'pending' | 'fallback' => {
    if (!activeOrder) return 'pending'
    if (activeOrder.currentStage === stage) return 'active'
    if (activeOrder.history.includes(stage)) return 'completed'
    return 'pending'
  }

  // Real Database Counts from Context
  const incomingWebhookCount = orders.filter((o) => o.currentStage === 'sales_webhook' || o.currentStage === 'payment_verification').length
  const inventoryCheckCount = orders.filter((o) => o.currentStage === 'inventory_check').length
  const activeBatchesCount = productionBatches.length > 0 ? productionBatches.length : 2
  const activeDispatchCount = logisticsDeliveries.length > 0 ? logisticsDeliveries.length : 3

  return (
    <div className="space-y-3 font-sans transition-all">
      {/* 1. TOP PIPELINE BAR (Matching Reference Screenshot Top Bar) */}
      <div className="rounded-xl border border-kumo-line bg-kumo-base px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-kumo-subtle shrink-0" />
          <span className="font-mono text-xs font-semibold text-kumo-strong tracking-tight">
            smokeyhut.com/orders/pipeline/*+4 pillars
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Workflow Stream
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-kumo-subtle hidden sm:inline">
            Active tracking: <strong className="text-kumo-strong font-semibold">{activeOrder?.id} ({activeOrder?.customerName})</strong>
          </span>

          <span className="text-kumo-line">|</span>

          {/* Stepper Controls */}
          <div className="flex items-center gap-1.5">
            <Tooltip content="Progress active order to next pipeline phase">
              <Button
                variant="outline"
                size="xs"
                onClick={stepOrderForward}
                disabled={activeOrder?.currentStage === 'completed'}
                leftIcon={<Play className="w-3 h-3 text-primary fill-primary" />}
                className="h-7 text-xs px-2.5 font-medium shadow-2xs cursor-pointer"
              >
                Step Stage
              </Button>
            </Tooltip>

            <Tooltip content="Fire an incoming storefront order webhook">
              <Button
                variant="outline"
                size="xs"
                onClick={triggerNewWebhookOrder}
                leftIcon={<Zap className="w-3 h-3 text-amber-500" />}
                className="h-7 text-xs px-2.5 font-medium shadow-2xs cursor-pointer"
              >
                + Webhook
              </Button>
            </Tooltip>

            <Tooltip content="Toggle automatic continuous pipeline streaming">
              <button
                type="button"
                onClick={() => setIsAutoStreamActive(!isAutoStreamActive)}
                className={cn(
                  "h-7 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs",
                  isAutoStreamActive
                    ? "bg-primary text-white border-primary"
                    : "bg-kumo-base border-kumo-line text-kumo-default hover:bg-kumo-tint"
                )}
              >
                <RefreshCw className={cn("w-3 h-3", isAutoStreamActive && "animate-spin")} />
                <span>{isAutoStreamActive ? 'Streaming' : 'Auto-Stream'}</span>
              </button>
            </Tooltip>
          </div>

          <span className="text-[11px] text-kumo-subtle hidden md:inline">
            by ayodine47 · synced now
          </span>
        </div>
      </div>

      {/* 2. MAIN WORKFLOW CANVAS CONTAINER (Matching Reference Screenshot Card) */}
      <div className="rounded-2xl border border-kumo-line bg-kumo-base p-6 relative shadow-xs transition-all overflow-hidden">
        {/* Stream Selector Pills Header */}
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-kumo-line/80 gap-3">
          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none]">
            <span className="text-[11px] font-semibold text-kumo-subtle uppercase tracking-wider shrink-0">
              Select Order Stream:
            </span>
            {orders.map((ord) => {
              const isSelected = ord.id === activeOrder?.id
              return (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => setSelectedOrderId(ord.id)}
                  className={cn(
                    "px-3 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs",
                    isSelected
                      ? "bg-kumo-strong text-kumo-base border-kumo-strong font-semibold"
                      : "bg-kumo-base text-kumo-default border-kumo-line hover:bg-kumo-tint"
                  )}
                >
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    ord.currentStage === 'completed'
                      ? "bg-emerald-500"
                      : ord.hasStock
                      ? "bg-blue-500"
                      : "bg-amber-500"
                  )} />
                  <span>{ord.id}</span>
                  <span className="opacity-60 text-[10px]">({ord.dishName.split(' ')[0]})</span>
                </button>
              )
            })}
          </div>

          {/* Active Order Stage Summary Badge */}
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs text-kumo-subtle hidden lg:inline">Current Phase:</span>
            <span
              className={cn(
                "capitalize text-xs font-semibold py-1 px-2.5 rounded-full border inline-flex items-center gap-1.5",
                activeOrder?.currentStage === 'completed'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                  : !activeOrder?.hasStock && activeOrder?.currentStage.startsWith('production')
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                  : 'bg-kumo-tint text-kumo-strong border-kumo-line'
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  activeOrder?.currentStage === 'completed'
                    ? 'bg-emerald-500'
                    : !activeOrder?.hasStock && activeOrder?.currentStage.startsWith('production')
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                )}
              />
              {activeOrder?.currentStage.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* WORKFLOW CANVAS INTERFACE (Only rendered when canvas is not collapsed) */}
        {isCanvasExpanded && (
          <div className="relative min-h-[460px] pb-6">
            {/* SVG Connecting Curves Overlay (Directional Edges) */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <marker
                  id="arrow-default"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 2 L 8 5 L 0 8 z" fill="#a1a1aa" />
                </marker>
                <marker
                  id="arrow-active"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 2 L 8 5 L 0 8 z" fill="#3b82f6" />
                </marker>
                <marker
                  id="arrow-success"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 2 L 8 5 L 0 8 z" fill="#10b981" />
                </marker>
                <marker
                  id="arrow-production"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 2 L 8 5 L 0 8 z" fill="#f59e0b" />
                </marker>
              </defs>

              {/* Edge 1: Sales stacked nodes to Inventory Node (Left to Center) */}
              <path
                d="M 230 46 C 265 46, 265 140, 290 140"
                fill="none"
                stroke={
                  activeOrder?.history.includes('payment_verification')
                    ? '#10b981'
                    : '#d4d4d8'
                }
                strokeWidth={activeOrder?.currentStage === 'sales_webhook' ? 2.5 : 1.5}
                strokeDasharray={activeOrder?.currentStage === 'sales_webhook' ? '5,5' : 'none'}
                className={activeOrder?.currentStage === 'sales_webhook' ? 'animate-pulse' : ''}
              />
              <path
                d="M 230 140 L 290 140"
                fill="none"
                stroke={
                  activeOrder?.history.includes('fraud_check')
                    ? '#10b981'
                    : '#d4d4d8'
                }
                strokeWidth={activeOrder?.currentStage === 'payment_verification' ? 2.5 : 1.5}
                strokeDasharray={activeOrder?.currentStage === 'payment_verification' ? '5,5' : 'none'}
              />
              <path
                d="M 230 234 C 265 234, 265 140, 290 140"
                fill="none"
                stroke={
                  activeOrder?.history.includes('inventory_check')
                    ? '#10b981'
                    : '#d4d4d8'
                }
                strokeWidth={activeOrder?.currentStage === 'fraud_check' ? 2.5 : 1.5}
                strokeDasharray={activeOrder?.currentStage === 'fraud_check' ? '5,5' : 'none'}
              />

              {/* Shared arrow entering Inventory Node */}
              <path
                d="M 285 140 L 305 140"
                fill="none"
                stroke={activeOrder?.history.includes('inventory_check') ? '#10b981' : '#a1a1aa'}
                strokeWidth={2}
                markerEnd={activeOrder?.history.includes('inventory_check') ? 'url(#arrow-success)' : 'url(#arrow-default)'}
              />

              {/* Edge 2: In-Stock Primary Path (Inventory -> Logistics) */}
              <path
                d="M 525 140 C 580 140, 580 140, 640 140"
                fill="none"
                stroke={
                  activeOrder?.hasStock && activeOrder?.history.includes('logistics_packing')
                    ? '#10b981'
                    : activeOrder?.hasStock && activeOrder?.currentStage === 'inventory_check'
                    ? '#3b82f6'
                    : '#e4e4e7'
                }
                strokeWidth={activeOrder?.hasStock ? 2.5 : 1.5}
                strokeDasharray={activeOrder?.hasStock && activeOrder?.currentStage === 'inventory_check' ? '6,6' : 'none'}
                markerEnd={
                  activeOrder?.hasStock && activeOrder?.history.includes('logistics_packing')
                    ? 'url(#arrow-success)'
                    : 'url(#arrow-default)'
                }
              />

              {/* Edge 3: Stockout Fallback Path (Inventory -> Production Batches) */}
              <path
                d="M 415 220 C 415 270, 415 290, 415 320"
                fill="none"
                stroke={
                  !activeOrder?.hasStock &&
                  (activeOrder?.history.includes('production_queue') || activeOrder?.currentStage.startsWith('production'))
                    ? '#f59e0b'
                    : '#e4e4e7'
                }
                strokeWidth={!activeOrder?.hasStock ? 2.5 : 1.5}
                strokeDasharray={!activeOrder?.hasStock && activeOrder?.currentStage === 'inventory_check' ? '5,5' : 'none'}
                markerEnd={!activeOrder?.hasStock ? 'url(#arrow-production)' : 'url(#arrow-default)'}
              />

              {/* Edge 4: Production QA Clear -> Merge back into Logistics */}
              <path
                d="M 525 385 C 600 385, 600 240, 640 240"
                fill="none"
                stroke={
                  !activeOrder?.hasStock && activeOrder?.history.includes('logistics_packing')
                    ? '#10b981'
                    : !activeOrder?.hasStock && activeOrder?.currentStage === 'production_qa'
                    ? '#3b82f6'
                    : '#e4e4e7'
                }
                strokeWidth={!activeOrder?.hasStock && activeOrder?.history.includes('logistics_packing') ? 2.5 : 1.5}
                strokeDasharray={!activeOrder?.hasStock && activeOrder?.currentStage === 'production_qa' ? '6,6' : 'none'}
                markerEnd={
                  !activeOrder?.hasStock && activeOrder?.history.includes('logistics_packing')
                    ? 'url(#arrow-success)'
                    : 'url(#arrow-default)'
                }
              />
            </svg>

            {/* 4-COLUMN LOGICAL PILLARS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10 items-start">
              {/* =========================================================================
                  PILLAR 1: SALES & ENTRY TRIGGER (STACKED PILL NODES - MATCHING SCREENSHOT)
                 ========================================================================= */}
              <div className="md:col-span-3 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-kumo-strong tracking-wide uppercase">
                    1. Sales & Triggers
                  </span>
                  <span className="text-[10px] text-kumo-subtle font-mono">Webhooks</span>
                </div>

                {/* Node 1A: Storefront Webhooks (Matching 'Domains 2' in screenshot) */}
                <div className={cn(
                  "rounded-2xl border bg-kumo-base p-3.5 shadow-2xs transition-all",
                  activeOrder?.currentStage === 'sales_webhook'
                    ? "border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/10"
                    : activeOrder?.history.includes('sales_webhook')
                    ? "border-emerald-500/60"
                    : "border-kumo-line"
                )}>
                  <div
                    onClick={() => toggleNodeExpansion('domains')}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-kumo-subtle" />
                      <span className="text-xs font-semibold text-kumo-strong">Storefront Webhook</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-kumo-tint text-[10px] font-bold text-kumo-strong border border-kumo-line">
                        3
                      </span>
                    </div>
                    {expandedNodes.domains ? (
                      <ChevronUp className="w-4 h-4 text-kumo-subtle" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-kumo-subtle" />
                    )}
                  </div>

                  {expandedNodes.domains && (
                    <div className="mt-3 pt-3 border-t border-kumo-line/60 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-kumo-subtle">checkout.webhook</span>
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-kumo-strong truncate">
                        smokeyhut.com/api/v1/orders
                      </p>
                      <div className="pt-1 text-[11px] text-kumo-subtle">
                        Channels: Online Cart, Mobile App, WhatsApp
                      </div>
                    </div>
                  )}
                </div>

                {/* Node 1B: Payment Verification (Matching 'Workers 0' in screenshot) */}
                <div className={cn(
                  "rounded-2xl border bg-kumo-base p-3.5 shadow-2xs transition-all",
                  activeOrder?.currentStage === 'payment_verification'
                    ? "border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/10"
                    : activeOrder?.history.includes('payment_verification')
                    ? "border-emerald-500/60"
                    : "border-kumo-line"
                )}>
                  <div
                    onClick={() => toggleNodeExpansion('workers')}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-kumo-subtle" />
                      <span className="text-xs font-semibold text-kumo-strong">Payment Clearance</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-kumo-tint text-[10px] font-bold text-kumo-strong border border-kumo-line">
                        2
                      </span>
                    </div>
                    {expandedNodes.workers ? (
                      <ChevronUp className="w-4 h-4 text-kumo-subtle" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-kumo-subtle" />
                    )}
                  </div>

                  {expandedNodes.workers && (
                    <div className="mt-3 pt-3 border-t border-kumo-line/60 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-kumo-subtle">Paystack Gateway</span>
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Cleared
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-kumo-strong truncate">
                        {activeOrder?.paymentRef}
                      </p>
                      <div className="text-[11px] text-kumo-subtle">
                        Escrow settlement auto-verified
                      </div>
                    </div>
                  )}
                </div>

                {/* Node 1C: Fraud & Risk Check (Matching 'Queues 0' in screenshot) */}
                <div className={cn(
                  "rounded-2xl border bg-kumo-base p-3.5 shadow-2xs transition-all",
                  activeOrder?.currentStage === 'fraud_check'
                    ? "border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/10"
                    : activeOrder?.history.includes('fraud_check')
                    ? "border-emerald-500/60"
                    : "border-kumo-line"
                )}>
                  <div
                    onClick={() => toggleNodeExpansion('queues')}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-kumo-subtle" />
                      <span className="text-xs font-semibold text-kumo-strong">Fraud & Risk Check</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-kumo-tint text-[10px] font-bold text-kumo-strong border border-kumo-line">
                        0
                      </span>
                    </div>
                    {expandedNodes.queues ? (
                      <ChevronUp className="w-4 h-4 text-kumo-subtle" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-kumo-subtle" />
                    )}
                  </div>

                  {expandedNodes.queues && (
                    <div className="mt-3 pt-3 border-t border-kumo-line/60 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-kumo-subtle">Address Geofence</span>
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Zone 1 Passed
                        </span>
                      </div>
                      <p className="text-[11px] text-kumo-subtle">
                        Risk score: 0.02 (Safe) · OTP cleared
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* =========================================================================
                  PILLAR 2: INVENTORY ALLOCATION ENGINE (CENTER CARD - MATCHING SCREENSHOT)
                 ========================================================================= */}
              <div className="md:col-span-4 space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-kumo-strong tracking-wide uppercase">
                    2. Inventory Engine
                  </span>
                  <span className="text-[10px] text-kumo-subtle font-mono">Stock Routing</span>
                </div>

                {/* Central Engine Card matching 'thecentralreport' card in screenshot */}
                <div className={cn(
                  "rounded-2xl border bg-kumo-base p-4 shadow-sm transition-all",
                  activeOrder?.currentStage === 'inventory_check'
                    ? "border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/10"
                    : activeOrder?.history.includes('inventory_check')
                    ? "border-emerald-500/60"
                    : "border-kumo-line"
                )}>
                  <div className="flex items-center justify-between pb-3 border-b border-kumo-line/70">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-kumo-subtle" />
                      <span className="font-mono text-xs font-semibold text-kumo-strong">
                        smokey-inventory-allocator
                      </span>
                    </div>
                    {/* Glowing status dot matching blue dot in screenshot */}
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={cn(
                        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                        activeOrder?.currentStage === 'inventory_check'
                          ? "bg-blue-400"
                          : activeOrder?.hasStock
                          ? "bg-emerald-400"
                          : "bg-amber-400"
                      )} />
                      <span className={cn(
                        "relative inline-flex rounded-full h-2.5 w-2.5",
                        activeOrder?.currentStage === 'inventory_check'
                          ? "bg-blue-500"
                          : activeOrder?.hasStock
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      )} />
                    </span>
                  </div>

                  {/* Observability / Real-time Stock Routing Lines matching screenshot */}
                  <div className="py-3 space-y-2.5 text-xs">
                    <span className="text-[11px] font-semibold text-kumo-subtle block">
                      Database Stock Verification
                    </span>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-kumo-default">Target SKU Check</span>
                      <span className="font-mono text-xs font-medium text-kumo-strong">
                        {activeOrder?.hasStock ? 'IN_STOCK' : 'BACKORDER_OUT'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-kumo-default">Threshold Auto-Deduct</span>
                      <span className="font-mono text-xs font-medium text-kumo-strong">
                        {activeOrder?.portions} portions
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-kumo-default">Routing Path</span>
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        activeOrder?.hasStock
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                      )}>
                        {activeOrder?.hasStock ? 'Direct -> Logistics' : 'Fallback -> Kitchen Batches'}
                      </span>
                    </div>
                  </div>

                  {/* Branch Action Indicators */}
                  <div className="pt-2 border-t border-kumo-line/60">
                    {activeOrder?.hasStock ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready in warehouse inventory · Forwarded to packaging</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Stockout trigger · Routed to Kitchen Smoking Pit Run</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* =========================================================================
                    PILLAR 3: PRODUCTION BATCHES NODE (SEQUENTIAL PROCESSING LOOP)
                   ========================================================================= */}
                <div className={cn(
                  "rounded-2xl border bg-kumo-base p-4 shadow-sm transition-all mt-4",
                  activeOrder?.currentStage.startsWith('production')
                    ? "border-amber-500 ring-2 ring-amber-500/10 bg-amber-50/10"
                    : activeOrder?.history.includes('production_qa')
                    ? "border-emerald-500/60"
                    : "border-kumo-line"
                )}>
                  <div
                    onClick={() => toggleNodeExpansion('production')}
                    className="flex items-center justify-between cursor-pointer select-none pb-2 border-b border-kumo-line/60"
                  >
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-semibold text-kumo-strong">
                        3. Kitchen Smoking Pit Run
                      </span>
                      <span className="px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                        {activeOrder?.batchId || 'BATCH-SMK-402'}
                      </span>
                    </div>
                    {expandedNodes.production ? (
                      <ChevronUp className="w-4 h-4 text-kumo-subtle" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-kumo-subtle" />
                    )}
                  </div>

                  {expandedNodes.production && (
                    <div className="mt-3 space-y-2.5 text-xs">
                      {/* Step 1: Queue Assignment */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            activeOrder?.history.includes('production_queue')
                              ? "bg-emerald-500"
                              : "bg-kumo-line"
                          )} />
                          <span className="text-kumo-default">Queue Assignment</span>
                        </div>
                        <span className="text-[10px] font-mono text-kumo-subtle">
                          Pitmaster Ade
                        </span>
                      </div>

                      {/* Step 2: Manufacturing Phase */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            activeOrder?.history.includes('production_cook')
                              ? "bg-emerald-500"
                              : activeOrder?.currentStage === 'production_cook'
                              ? "bg-amber-500 animate-pulse"
                              : "bg-kumo-line"
                          )} />
                          <span className="text-kumo-default">Manufacturing Phase</span>
                        </div>
                        <span className="text-[10px] font-mono text-kumo-subtle">
                          Wood Smoking Run
                        </span>
                      </div>

                      {/* Step 3: Quality Assurance Pass */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            activeOrder?.history.includes('production_qa')
                              ? "bg-emerald-500"
                              : activeOrder?.currentStage === 'production_qa'
                              ? "bg-blue-500 animate-pulse"
                              : "bg-kumo-line"
                          )} />
                          <span className="text-kumo-default">Quality Assurance Pass</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-600 font-semibold">
                          Probe 76°C · Passed
                        </span>
                      </div>

                      <div className="pt-2 border-t border-kumo-line/60 flex items-center justify-between text-[11px] text-kumo-subtle">
                        <span>QA Output:</span>
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                          <span>Merge into Logistics Dock</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* =========================================================================
                  PILLAR 4: LOGISTICS & FULFILLMENT (MATCHING 'BINDINGS' IN SCREENSHOT)
                 ========================================================================= */}
              <div className="md:col-span-5 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-kumo-strong tracking-wide uppercase">
                    4. Logistics & Delivery
                  </span>
                  <span className="text-[10px] text-kumo-subtle font-mono">Terminal Handover</span>
                </div>

                {/* Logistics Node Card matching 'Bindings 2' in screenshot */}
                <div className={cn(
                  "rounded-2xl border bg-kumo-base p-4 shadow-sm transition-all",
                  activeOrder?.currentStage.startsWith('logistics')
                    ? "border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/10"
                    : activeOrder?.currentStage === 'completed'
                    ? "border-emerald-500/60"
                    : "border-kumo-line"
                )}>
                  <div
                    onClick={() => toggleNodeExpansion('bindings')}
                    className="flex items-center justify-between cursor-pointer select-none pb-2 border-b border-kumo-line/60"
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-kumo-subtle" />
                      <span className="text-xs font-semibold text-kumo-strong">Fulfillment Pipeline</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-kumo-tint text-[10px] font-bold text-kumo-strong border border-kumo-line">
                        3
                      </span>
                    </div>
                    {expandedNodes.bindings ? (
                      <ChevronUp className="w-4 h-4 text-kumo-subtle" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-kumo-subtle" />
                    )}
                  </div>

                  {expandedNodes.bindings && (
                    <div className="mt-3 space-y-3 text-xs">
                      {/* Sub-item 1: Picking & Packing Slip */}
                      <div className={cn(
                        "p-2.5 rounded-xl border transition-colors",
                        activeOrder?.history.includes('logistics_packing')
                          ? "bg-kumo-tint/20 border-emerald-500/30"
                          : "bg-kumo-tint/10 border-kumo-line/60"
                      )}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-kumo-strong">Picking/Packing Slip</span>
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {activeOrder?.history.includes('logistics_packing') ? 'Generated' : 'Queued'}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-kumo-subtle mt-1">
                          Thermal insulated bag · Vacuum seal confirmed
                        </p>
                      </div>

                      {/* Sub-item 2: Carrier Tracking Labels */}
                      <div className={cn(
                        "p-2.5 rounded-xl border transition-colors",
                        activeOrder?.history.includes('logistics_dispatch')
                          ? "bg-kumo-tint/20 border-emerald-500/30"
                          : "bg-kumo-tint/10 border-kumo-line/60"
                      )}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-kumo-strong">Carrier & Fleet API</span>
                          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {activeOrder?.riderName || 'Internal Fleet'}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-kumo-subtle mt-1">
                          Label: SHD-TRK-{activeOrder?.id.replace('ORD-', '')} · GPS Live
                        </p>
                      </div>

                      {/* Sub-item 3: Terminal Node Handover Trigger */}
                      <div className={cn(
                        "p-2.5 rounded-xl border transition-colors",
                        activeOrder?.currentStage === 'completed'
                          ? "bg-emerald-500/10 border-emerald-500/40"
                          : "bg-kumo-tint/10 border-kumo-line/60"
                      )}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-kumo-strong">Terminal Customer Handover</span>
                          <span className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded",
                            activeOrder?.currentStage === 'completed'
                              ? "bg-emerald-600 text-white"
                              : "bg-kumo-tint text-kumo-subtle"
                          )}>
                            {activeOrder?.currentStage === 'completed' ? 'Delivered' : 'Awaiting OTP'}
                          </span>
                        </div>
                        <p className="text-[11px] text-kumo-subtle mt-1">
                          OTP: <strong className="font-mono text-kumo-strong">{activeOrder?.otpCode}</strong> · Webhook fires instant SMS & WhatsApp receipt upon sign-off
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. BOTTOM COLLAPSE / EXPAND CHEVRON BAR (Matching Reference Screenshot 2) */}
        <div className="pt-2 border-t border-kumo-line/60 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setIsCanvasExpanded(!isCanvasExpanded)}
            className="w-8 h-8 rounded-full border border-kumo-line bg-kumo-base hover:bg-kumo-tint flex items-center justify-center text-kumo-subtle hover:text-kumo-strong transition-colors cursor-pointer shadow-2xs"
            aria-label={isCanvasExpanded ? 'Collapse workflow canvas' : 'Expand workflow canvas'}
          >
            {isCanvasExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrderWorkflowCanvasOverlay
