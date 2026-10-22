import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  Globe,
  ChevronDown,
  ChevronUp,
  Play,
  Zap,
  RefreshCw,
  Layers,
  Network
} from 'lucide-react'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { cn, formatNaira } from '@/lib/utils'

export type PipelineStage =
  | 'p1_ingestion'
  | 'p1_inventory_deduct'
  | 'p1_production_batch'
  | 'p2_in_packaging'
  | 'p2_materials_picked'
  | 'p2_dispatched'
  | 'p3_delivery_assigned'
  | 'p3_in_transit'
  | 'p3_doorstep_handover'
  | 'p3_delivered'
  | 'p3_settled_closed'

export interface PipelineOrder {
  id: string
  customerName: string
  dishName: string
  totalAmount: number
  portions: number
  channel: 'Website Storefront' | 'In Store Checkout' | 'Direct WhatsApp'
  hasStock: boolean
  currentStage: PipelineStage
  paymentRef: string
  batchId?: string
  riderName?: string
  destinationAddress: string
  etaMinutes?: number
  otpCode: string
  deliveryFee: number
  history: PipelineStage[]
}

const SMOKEY_OPERATIONAL_ORDERS: PipelineOrder[] = [
  {
    id: 'SHD-09853',
    customerName: 'Babajide Sanwo',
    dishName: 'Smoked Beef Brisket Feast and Jollof',
    totalAmount: 18500,
    portions: 3,
    channel: 'Website Storefront',
    hasStock: false,
    currentStage: 'p1_production_batch',
    paymentRef: 'pay_smk_99182',
    batchId: 'Batch 402',
    riderName: 'Rider Yusuf Internal Fleet',
    destinationAddress: '8c Taiwo Osipitan Way, Ogba, Lagos',
    etaMinutes: 22,
    otpCode: '4821',
    deliveryFee: 4000,
    history: ['p1_ingestion', 'p1_inventory_deduct', 'p1_production_batch']
  },
  {
    id: 'SHD-09854',
    customerName: 'Amaka Okafor',
    dishName: '1L Guineafowl Rice and Smoked Catfish',
    totalAmount: 24000,
    portions: 2,
    channel: 'Website Storefront',
    hasStock: true,
    currentStage: 'p2_in_packaging',
    paymentRef: 'pay_smk_99183',
    riderName: 'Rider Yusuf Internal Fleet',
    destinationAddress: 'Plot 12 Admiralty Way, Lekki Phase 1',
    etaMinutes: 28,
    otpCode: '7239',
    deliveryFee: 3500,
    history: ['p1_ingestion', 'p1_inventory_deduct', 'p2_in_packaging']
  },
  {
    id: 'SHD-09855',
    customerName: 'Chinedu Eze',
    dishName: 'Peppered Turkey Wings Platter',
    totalAmount: 9500,
    portions: 1,
    channel: 'Direct WhatsApp',
    hasStock: true,
    currentStage: 'p1_ingestion',
    paymentRef: 'pay_smk_99184',
    destinationAddress: 'Akowonjo Roundabout, Egbeda, Lagos',
    otpCode: '1092',
    deliveryFee: 2500,
    history: ['p1_ingestion']
  },
  {
    id: 'SHD-09856',
    customerName: 'Folake Adeleke',
    dishName: 'Fire-Smoked BBQ Ribs Combo',
    totalAmount: 16000,
    portions: 2,
    channel: 'In Store Checkout',
    hasStock: true,
    currentStage: 'p3_settled_closed',
    paymentRef: 'pay_smk_99180',
    riderName: 'Rider Yusuf Internal Fleet',
    destinationAddress: 'Isaac John Street, GRA Ikeja',
    etaMinutes: 0,
    otpCode: '8834',
    deliveryFee: 4000,
    history: [
      'p1_ingestion',
      'p1_inventory_deduct',
      'p2_in_packaging',
      'p2_materials_picked',
      'p2_dispatched',
      'p3_delivery_assigned',
      'p3_in_transit',
      'p3_doorstep_handover',
      'p3_delivered',
      'p3_settled_closed'
    ]
  }
]

interface AnchorPoint {
  x: number
  y: number
}

interface CanvasCoordinates {
  node1A: AnchorPoint
  node1B: AnchorPoint
  node1C: AnchorPoint
  centerLeft: AnchorPoint
  centerRight: AnchorPoint
  bindingsLeft: AnchorPoint
}

interface StatusPillProps {
  label: string
  variant?: 'emerald' | 'blue' | 'amber' | 'purple' | 'zinc'
  dot?: boolean
  className?: string
}

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  variant = 'zinc',
  dot = true,
  className
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/80',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/80',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
    zinc: 'bg-zinc-100 text-zinc-700 border-zinc-200/80'
  }

  const dotColors = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
    zinc: 'bg-zinc-400'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border shrink-0 leading-normal select-none',
        variantStyles[variant],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      <span className="whitespace-nowrap">{label}</span>
    </span>
  )
}

export const getStageLabel = (stage?: PipelineStage): string => {
  switch (stage) {
    case 'p1_ingestion':
      return 'Order Intake and Payment'
    case 'p1_inventory_deduct':
      return 'Stock Allocation'
    case 'p1_production_batch':
      return 'Kitchen Cooking'
    case 'p2_in_packaging':
      return 'Packaging Started'
    case 'p2_materials_picked':
      return 'Materials Picked'
    case 'p2_dispatched':
      return 'Ready for Dispatch'
    case 'p3_delivery_assigned':
      return 'Driver Assigned'
    case 'p3_in_transit':
      return 'Out for Delivery'
    case 'p3_doorstep_handover':
      return 'Customer Handover'
    case 'p3_delivered':
      return 'Delivered to Customer'
    case 'p3_settled_closed':
      return 'Completed and Closed'
    default:
      return 'Order Processing'
  }
}

export const OrderWorkflowCanvasOverlay: React.FC = () => {
  const { showToast } = useSmokeyOps()

  // Full canvas collapse/expand state (matching Screenshot 2 bottom chevron)
  const [isCanvasExpanded, setIsCanvasExpanded] = useState<boolean>(true)

  // View Mode: 'canvas' (Cloudflare 3-column node canvas) vs 'tree' (Vertical 3-pillar hierarchy)
  const [viewMode, setViewMode] = useState<'canvas' | 'tree'>('canvas')

  // Auto-stream interval toggle
  const [isAutoStreamActive, setIsAutoStreamActive] = useState<boolean>(false)

  // Orders in pipeline state
  const [orders, setOrders] = useState<PipelineOrder[]>(SMOKEY_OPERATIONAL_ORDERS)
  const [selectedOrderId, setSelectedOrderId] = useState<string>('SHD-09853')

  // Accordion expansion state matching Screenshot 1 (collapsed) vs Screenshot 2 & 5 (expanded)
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    node1A: false,
    node1B: false,
    node1C: true,
    pillar2: true,
    pillar3: true
  })

  // DOM Refs for dynamic anchor alignment
  const containerRef = useRef<HTMLDivElement | null>(null)
  const node1AHeaderRef = useRef<HTMLDivElement | null>(null)
  const node1BHeaderRef = useRef<HTMLDivElement | null>(null)
  const node1CHeaderRef = useRef<HTMLDivElement | null>(null)
  const centerHeaderRef = useRef<HTMLDivElement | null>(null)
  const bindingsHeaderRef = useRef<HTMLDivElement | null>(null)

  // Measured coordinates state
  const [coords, setCoords] = useState<CanvasCoordinates | null>(null)

  const toggleNodeExpansion = (nodeKey: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeKey]: !prev[nodeKey] }))
  }

  // Active Order
  const activeOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || orders[0]
  }, [orders, selectedOrderId])

  // Sequential Stage Progression Logic matching the 3-pillar flow tree:
  const getNextStage = (current: PipelineStage, hasStock: boolean): PipelineStage => {
    switch (current) {
      case 'p1_ingestion':
        return 'p1_inventory_deduct'
      case 'p1_inventory_deduct':
        return hasStock ? 'p2_in_packaging' : 'p1_production_batch'
      case 'p1_production_batch':
        return 'p2_in_packaging'
      case 'p2_in_packaging':
        return 'p2_materials_picked'
      case 'p2_materials_picked':
        return 'p2_dispatched'
      case 'p2_dispatched':
        return 'p3_delivery_assigned'
      case 'p3_delivery_assigned':
        return 'p3_in_transit'
      case 'p3_in_transit':
        return 'p3_doorstep_handover'
      case 'p3_doorstep_handover':
        return 'p3_delivered'
      case 'p3_delivered':
        return 'p3_settled_closed'
      case 'p3_settled_closed':
        return 'p3_settled_closed'
      default:
        return 'p1_ingestion'
    }
  }

  // Step Order Forward
  const stepOrderForward = () => {
    if (!activeOrder) return

    if (activeOrder.currentStage === 'p3_settled_closed') {
      showToast(`Settlement Complete: Order ${activeOrder.id} is already closed and settled into the driver ledger.`, 'info')
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

    if (next === 'p3_settled_closed') {
      showToast(`Settlement Complete: ${formatNaira(activeOrder.deliveryFee)} credited to Rider Yusuf ledger. Order closed.`, 'success')
    } else if (next === 'p3_doorstep_handover') {
      showToast(`Customer Handover: Verified delivery with customer code ${activeOrder.otpCode}.`, 'success')
    } else if (next === 'p2_in_packaging') {
      showToast(`Fulfillment Initiated: Order ${activeOrder.id} moved to Packaging and Assembly.`, 'info')
    } else {
      showToast(`Order ${activeOrder.id} progressed to ${getStageLabel(next)}`, 'info')
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
      { name: 'Smokey Hut Jollof and Smoked Catfish', amount: 14500, stock: false }
    ]
    const chosen = dishes[Math.floor(Math.random() * dishes.length)]
    const channels: Array<'Website Storefront' | 'In Store Checkout' | 'Direct WhatsApp'> = [
      'Website Storefront',
      'In Store Checkout',
      'Direct WhatsApp'
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
      currentStage: 'p1_ingestion',
      paymentRef: `pay_smk_${Math.floor(10000 + Math.random() * 90000)}`,
      destinationAddress: 'Victoria Island, Lagos',
      otpCode: `${Math.floor(1000 + Math.random() * 9000)}`,
      deliveryFee: 4000,
      history: ['p1_ingestion']
    }

    setOrders((prev) => [newOrder, ...prev])
    setSelectedOrderId(newId)
    showToast(`Order Ingested: New order ${newId.replace('SHD-0', 'Order ').replace('SHD-', 'Order ')} received via ${chosenChannel}`, 'success')
  }

  // Auto-stream interval effect
  useEffect(() => {
    if (!isAutoStreamActive) return

    const interval = setInterval(() => {
      setOrders((prevOrders) => {
        return prevOrders.map((ord) => {
          if (ord.currentStage === 'p3_settled_closed') return ord
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
    if (!containerRef.current || viewMode !== 'canvas') return
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

    const node1A = getRightMiddle(node1AHeaderRef.current)
    const node1B = getRightMiddle(node1BHeaderRef.current)
    const node1C = getRightMiddle(node1CHeaderRef.current)
    const centerLeft = getLeftMiddle(centerHeaderRef.current)
    const centerRight = getRightMiddle(centerHeaderRef.current)
    const bindingsLeft = getLeftMiddle(bindingsHeaderRef.current)

    setCoords({
      node1A,
      node1B,
      node1C,
      centerLeft,
      centerRight,
      bindingsLeft
    })
  }

  useLayoutEffect(() => {
    updateCoordinates()
    const timeout = setTimeout(updateCoordinates, 40)
    return () => clearTimeout(timeout)
  }, [expandedNodes, isCanvasExpanded, activeOrder?.hasStock, selectedOrderId, viewMode])

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
  }, [viewMode])

  // SVG paths calculation
  const svgPaths = useMemo(() => {
    if (!coords || coords.centerLeft.x === 0) return null

    const {
      node1A: a,
      node1B: b,
      node1C: c,
      centerLeft: cL,
      centerRight: cR,
      bindingsLeft: bL
    } = coords

    const maxTriggerX = Math.max(a.x, b.x, c.x)
    const trunkGap = Math.max(16, cL.x - maxTriggerX)
    const trunkX = Math.round(maxTriggerX + trunkGap * 0.42)
    const radius = 10

    // Path 1A: From Ingestion down to trunk
    const path1A = `M ${a.x} ${a.y} H ${trunkX - radius} Q ${trunkX} ${a.y} ${trunkX} ${a.y + radius} V ${cL.y}`

    // Path 1B: From Stock/BOM into trunk
    let path1B = `M ${b.x} ${b.y} H ${trunkX}`
    if (Math.abs(b.y - cL.y) > 4) {
      if (b.y > cL.y) {
        path1B = `M ${b.x} ${b.y} H ${trunkX - radius} Q ${trunkX} ${b.y} ${trunkX} ${b.y - radius} V ${cL.y}`
      } else {
        path1B = `M ${b.x} ${b.y} H ${trunkX - radius} Q ${trunkX} ${b.y} ${trunkX} ${b.y + radius} V ${cL.y}`
      }
    }

    // Path 1C: From Production Batches up to trunk
    const path1C = `M ${c.x} ${c.y} H ${trunkX - radius} Q ${trunkX} ${c.y} ${trunkX} ${c.y - radius} V ${cL.y}`

    // Stem from trunk into Pillar 2 (Packaging and Assembly)
    const trunkToPillar2 = `M ${trunkX} ${cL.y} H ${cL.x}`

    // Stem from Pillar 2 to Pillar 3 (Logistics and Handover)
    const pillar2ToPillar3 = `M ${cR.x} ${cR.y} H ${bL.x}`

    return {
      path1A,
      path1B,
      path1C,
      trunkToPillar2,
      pillar2ToPillar3
    }
  }, [coords])

  return (
    <div className="space-y-3 font-sans transition-all">
      {/* =========================================================================
          1. TOP BAR (MATCHING CLOUDFLARE SCREENSHOT 1 & 2 - WITH VIEW TOGGLE)
         ========================================================================= */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        {/* Left: Globe & Plain English Route Info */}
        <div className="flex items-center gap-2.5 text-[#18181b]">
          <Globe className="w-4 h-4 text-[#71717a] shrink-0" />
          <span className="font-medium text-[13px] tracking-tight">
            Smokey Hut Order Flow Pipeline
          </span>
          <span className="text-[#a1a1aa] text-[11px] hidden md:inline">
            Order Intake to Kitchen to Packaging to Customer Handover
          </span>
        </div>

        {/* Right: View mode switcher, order switcher & step controls */}
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#f4f4f5] p-0.5 rounded-lg border border-[#e4e4e7]">
            <button
              type="button"
              onClick={() => setViewMode('canvas')}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer",
                viewMode === 'canvas'
                  ? "bg-white text-[#18181b] shadow-xs font-semibold"
                  : "text-[#71717a] hover:text-[#18181b]"
              )}
            >
              <Network className="w-3 h-3 text-[#2563eb]" />
              <span>Node Canvas</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer",
                viewMode === 'tree'
                  ? "bg-white text-[#18181b] shadow-xs font-semibold"
                  : "text-[#71717a] hover:text-[#18181b]"
              )}
            >
              <Layers className="w-3 h-3 text-[#10b981]" />
              <span>Flow Tree</span>
            </button>
          </div>

          {/* Active Order Switcher */}
          <div className="flex items-center gap-1.5 bg-[#f4f4f5] p-0.5 rounded-lg border border-[#e4e4e7]">
            {orders.slice(0, 4).map((ord) => (
              <button
                key={ord.id}
                type="button"
                onClick={() => setSelectedOrderId(ord.id)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer",
                  selectedOrderId === ord.id
                    ? "bg-white text-[#18181b] shadow-xs font-semibold"
                    : "text-[#71717a] hover:text-[#18181b]"
                )}
              >
                {ord.id.replace('SHD-0', 'Order ').replace('SHD-', 'Order ')}
                {!ord.hasStock && (
                  <span className="ml-1 text-[9px] text-[#f59e0b] font-bold" title="Batch Cook Required">★</span>
                )}
              </button>
            ))}
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={stepOrderForward}
              disabled={activeOrder?.currentStage === 'p3_settled_closed'}
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
              <span>Ingest New Order</span>
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
              <span>{isAutoStreamActive ? 'Streaming' : 'Auto Stream'}</span>
            </button>
          </div>

          <span className="text-[12px] text-[#71717a] hidden xl:inline">
            Live Order Stream
          </span>
        </div>
      </div>

      {/* =========================================================================
          2. MAIN WORKFLOW CONTAINER
         ========================================================================= */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 sm:p-8 relative shadow-2xs transition-all overflow-hidden">
        {/* ACTIVE ORDER SUB-BAR (PLAIN ENGLISH ONLY) */}
        <div className="flex flex-wrap items-center justify-between pb-5 mb-6 border-b border-[#e4e4e7] gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-[13px]">
            <span className="text-[#71717a]">Active Order</span>
            <span className="font-semibold text-[#18181b]">
              {activeOrder?.id.replace('SHD-0', 'Order ').replace('SHD-', 'Order ')}
            </span>
            <span className="text-[#d4d4d8]">|</span>
            <span className="text-[#52525b]">{activeOrder?.dishName}</span>
            <span className="text-[#d4d4d8]">|</span>
            <span className="font-medium text-[#18181b]">{formatNaira(activeOrder?.totalAmount || 0)}</span>
            <span className="text-[#d4d4d8]">|</span>
            <span className="text-[#71717a]">{activeOrder?.channel}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#71717a]">Current Stage:</span>
            <StatusPill
              label={getStageLabel(activeOrder?.currentStage)}
              variant={
                activeOrder?.currentStage === 'p3_settled_closed'
                  ? 'zinc'
                  : activeOrder?.currentStage === 'p3_delivered'
                  ? 'emerald'
                  : activeOrder?.currentStage.startsWith('p3_')
                  ? 'blue'
                  : activeOrder?.currentStage.startsWith('p2_')
                  ? 'amber'
                  : 'emerald'
              }
            />
          </div>
        </div>

        {/* WORKFLOW INTERFACE */}
        {isCanvasExpanded && (
          <>
            {/* =====================================================================
                MODE A: INTERACTIVE NODE CANVAS (CLOUDFLARE 3-COLUMN MAPPING)
               ===================================================================== */}
            {viewMode === 'canvas' ? (
              <div ref={containerRef} className="relative min-h-[460px] pb-4">
                {/* SVG DIRECTIONAL CONNECTING PATHS */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-0"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
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
                      {/* Path 1A: From Ingestion down to trunk */}
                      <path
                        d={svgPaths.path1A}
                        fill="none"
                        stroke={activeOrder?.history.includes('p1_ingestion') ? '#2563eb' : '#9ca3af'}
                        strokeWidth={1.75}
                      />
                      {/* Path 1B: From Stock/BOM into trunk */}
                      <path
                        d={svgPaths.path1B}
                        fill="none"
                        stroke={activeOrder?.history.includes('p1_inventory_deduct') ? '#2563eb' : '#9ca3af'}
                        strokeWidth={1.75}
                      />
                      {/* Path 1C: From Production Batches up to trunk */}
                      <path
                        d={svgPaths.path1C}
                        fill="none"
                        stroke={activeOrder?.history.includes('p1_production_batch') ? '#2563eb' : '#9ca3af'}
                        strokeWidth={1.75}
                      />
                      {/* Arrow from Pillar 1 into Pillar 2 */}
                      <path
                        d={svgPaths.trunkToPillar2}
                        fill="none"
                        stroke={activeOrder?.history.includes('p2_in_packaging') ? '#2563eb' : '#9ca3af'}
                        strokeWidth={1.75}
                        markerEnd={activeOrder?.history.includes('p2_in_packaging') ? 'url(#cf-arrow-blue)' : 'url(#cf-arrow-default)'}
                      />
                      {/* Arrow from Pillar 2 into Pillar 3 */}
                      <path
                        d={svgPaths.pillar2ToPillar3}
                        fill="none"
                        stroke={activeOrder?.history.includes('p3_delivery_assigned') ? '#10b981' : '#9ca3af'}
                        strokeWidth={1.75}
                        markerEnd={activeOrder?.history.includes('p3_delivery_assigned') ? 'url(#cf-arrow-emerald)' : 'url(#cf-arrow-default)'}
                      />
                    </>
                  )}
                </svg>

                {/* THREE COLUMNS (MATCHING CLOUDFLARE 3-NODE ARCHITECTURE) */}
                <div className="flex flex-row items-start justify-between gap-8 sm:gap-10 relative z-10 overflow-x-auto pb-4">
                  {/* =====================================================================
                      COLUMN 1: PILLAR 1: ORDER INTAKE AND KITCHEN
                     ===================================================================== */}
                  <div className="w-[260px] sm:w-[290px] shrink-0 space-y-3.5">
                    <div className="flex items-center justify-between px-1 mb-2">
                      <span className="text-xs font-semibold text-[#52525b]">
                        Pillar 1: Order Intake and Kitchen
                      </span>
                      <StatusPill label="Intake and Cooking" variant="blue" />
                    </div>

                    {/* Node 1A: Ingestion State */}
                    <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs hover:border-[#a1a1aa]">
                      <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                        <div
                          ref={node1AHeaderRef}
                          onClick={() => toggleNodeExpansion('node1A')}
                          className="px-4 py-3 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-[#fafafa] transition-colors"
                        >
                          <span className="text-[14px] font-semibold text-[#18181b]">Order Intake</span>
                          <div className="flex items-center gap-2">
                            <StatusPill
                              label={activeOrder?.paymentRef ? 'Payment Confirmed' : 'Payment Pending'}
                              variant={activeOrder?.paymentRef ? 'emerald' : 'amber'}
                            />
                            <span className="w-5 h-5 rounded-md flex items-center justify-center text-[#71717a] hover:bg-[#f4f4f5] transition-colors">
                              {expandedNodes.node1A ? (
                                <ChevronUp className="w-4 h-4 stroke-[2]" />
                              ) : (
                                <ChevronDown className="w-4 h-4 stroke-[2]" />
                              )}
                            </span>
                          </div>
                        </div>

                        {expandedNodes.node1A && (
                          <div className="border-t border-[#e4e4e7] bg-white divide-y divide-[#e4e4e7] text-xs">
                            <div className="px-4 py-2.5 flex items-center justify-between">
                              <span className="text-[#52525b]">Order Ingestion and Validation</span>
                              <StatusPill
                                label={activeOrder?.history.includes('p1_ingestion') ? 'Ready for Fulfillment' : 'Pending Ingestion'}
                                variant="emerald"
                              />
                            </div>
                            <div className="px-4 py-2.5 flex items-center justify-between">
                              <span className="text-[#52525b]">Customer Payment Verification</span>
                              <StatusPill
                                label={activeOrder?.paymentRef ? 'Payment Confirmed' : 'Payment Pending'}
                                variant="emerald"
                              />
                            </div>
                            <div className="px-4 py-2.5 flex items-center justify-between">
                              <span className="text-[#52525b]">Ordering Channel Intake</span>
                              <StatusPill label={activeOrder?.channel || 'Website Storefront'} variant="blue" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Node 1B: Products Sales / BOM Deduction */}
                    <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs hover:border-[#a1a1aa]">
                      <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                        <div
                          ref={node1BHeaderRef}
                          onClick={() => toggleNodeExpansion('node1B')}
                          className="px-4 py-3 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-[#fafafa] transition-colors"
                        >
                          <span className="text-[14px] font-semibold text-[#18181b]">Inventory Allocation</span>
                          <div className="flex items-center gap-2">
                            <StatusPill
                              label={activeOrder?.hasStock ? 'Finished Stock Ready' : 'Batch Cooking Required'}
                              variant={activeOrder?.hasStock ? 'emerald' : 'amber'}
                            />
                            <span className="w-5 h-5 rounded-md flex items-center justify-center text-[#71717a] hover:bg-[#f4f4f5] transition-colors">
                              {expandedNodes.node1B ? (
                                <ChevronUp className="w-4 h-4 stroke-[2]" />
                              ) : (
                                <ChevronDown className="w-4 h-4 stroke-[2]" />
                              )}
                            </span>
                          </div>
                        </div>

                        {expandedNodes.node1B && (
                          <div className="border-t border-[#e4e4e7] bg-white divide-y divide-[#e4e4e7] text-xs">
                            <div className="px-4 py-2.5 flex items-center justify-between">
                              <span className="text-[#52525b]">Finished Meal Stock Check</span>
                              <StatusPill
                                label={activeOrder?.hasStock ? 'Stock Available' : 'Cooking Required'}
                                variant={activeOrder?.hasStock ? 'emerald' : 'amber'}
                              />
                            </div>
                            <div className="px-4 py-2.5 flex items-center justify-between">
                              <span className="text-[#52525b]">Inventory Stock Allocation</span>
                              <StatusPill
                                label={
                                  activeOrder?.history.includes('p1_inventory_deduct')
                                    ? activeOrder?.hasStock
                                      ? 'Reserved from Finished Stock'
                                      : 'Ingredients Allocated'
                                    : 'Pending Stock Check'
                                }
                                variant={
                                  activeOrder?.history.includes('p1_inventory_deduct')
                                    ? activeOrder?.hasStock
                                      ? 'emerald'
                                      : 'blue'
                                    : 'zinc'
                                }
                              />
                            </div>
                            <div className="px-4 py-2.5 flex items-center justify-between">
                              <span className="text-[#52525b]">Recipe Ingredients Deduction</span>
                              <StatusPill
                                label={
                                  activeOrder?.hasStock
                                    ? 'Direct Stock Item'
                                    : activeOrder?.history.includes('p1_inventory_deduct')
                                    ? 'Recipe Ingredients Deducted'
                                    : 'Pending Deduction'
                                }
                                variant={
                                  activeOrder?.hasStock
                                    ? 'zinc'
                                    : activeOrder?.history.includes('p1_inventory_deduct')
                                    ? 'blue'
                                    : 'zinc'
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Node 1C: Production Batches */}
                    <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs hover:border-[#a1a1aa]">
                      <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                        <div
                          ref={node1CHeaderRef}
                          onClick={() => toggleNodeExpansion('node1C')}
                          className="px-4 py-3 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-[#fafafa] transition-colors"
                        >
                          <span className="text-[14px] font-semibold text-[#18181b]">Kitchen Cooking</span>
                          <div className="flex items-center gap-2">
                            <StatusPill
                              label={
                                activeOrder?.hasStock
                                  ? 'Stock Fulfilled'
                                  : activeOrder?.history.includes('p1_production_batch')
                                  ? 'Cooking Completed'
                                  : activeOrder?.currentStage === 'p1_production_batch'
                                  ? 'Cooking in Progress'
                                  : 'Awaiting Kitchen'
                              }
                              variant={
                                activeOrder?.hasStock || activeOrder?.history.includes('p1_production_batch')
                                  ? 'emerald'
                                  : activeOrder?.currentStage === 'p1_production_batch'
                                  ? 'amber'
                                  : 'zinc'
                              }
                            />
                            <span className="w-5 h-5 rounded-md flex items-center justify-center text-[#71717a] hover:bg-[#f4f4f5] transition-colors">
                              {expandedNodes.node1C ? (
                                <ChevronUp className="w-4 h-4 stroke-[2]" />
                              ) : (
                                <ChevronDown className="w-4 h-4 stroke-[2]" />
                              )}
                            </span>
                          </div>
                        </div>

                        {expandedNodes.node1C && (
                          <div className="border-t border-[#e4e4e7] bg-white divide-y divide-[#e4e4e7] text-xs">
                            <div className="px-4 py-2.5 flex items-center justify-between">
                              <span className="text-[#52525b]">Kitchen Cooking Batch</span>
                              <StatusPill
                                label={
                                  activeOrder?.hasStock
                                    ? 'Direct Stock Fulfillment'
                                    : activeOrder?.history.includes('p1_production_batch')
                                    ? 'Cooking Completed'
                                    : activeOrder?.currentStage === 'p1_production_batch'
                                    ? 'Cooking in Progress'
                                    : 'Awaiting Kitchen'
                                }
                                variant={
                                  activeOrder?.hasStock || activeOrder?.history.includes('p1_production_batch')
                                    ? 'emerald'
                                    : activeOrder?.currentStage === 'p1_production_batch'
                                    ? 'amber'
                                    : 'zinc'
                                }
                              />
                            </div>
                            <div className="px-4 py-2.5 flex items-center justify-between">
                              <span className="text-[#52525b]">Kitchen Batch Record</span>
                              <StatusPill
                                label={
                                  activeOrder?.hasStock
                                    ? 'Existing Finished Inventory'
                                    : activeOrder?.history.includes('p1_production_batch')
                                    ? 'Full Batch Output Recorded'
                                    : 'Awaiting Cooking Batch'
                                }
                                variant={
                                  activeOrder?.hasStock || activeOrder?.history.includes('p1_production_batch')
                                    ? 'emerald'
                                    : 'zinc'
                                }
                              />
                            </div>
                            <div className="px-4 py-2.5 flex items-center justify-between">
                              <span className="text-[#52525b]">Cooking Batch Allocation</span>
                              <StatusPill
                                label={activeOrder?.hasStock ? 'Standard Stock Batch' : 'Batch 402'}
                                variant="zinc"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* =====================================================================
                      COLUMN 2: PILLAR 2: PACKAGING AND FOOD ASSEMBLY (CENTER ENGINE)
                     ===================================================================== */}
                  <div className="w-[280px] sm:w-[310px] shrink-0 space-y-3.5">
                    <div className="flex items-center justify-between px-1 mb-2">
                      <span className="text-xs font-semibold text-[#52525b]">
                        Pillar 2: Packaging and Assembly
                      </span>
                      <StatusPill label="Packaging and Assembly" variant="amber" />
                    </div>

                    <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs">
                      <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                        {/* Unified Header */}
                        <div
                          ref={centerHeaderRef}
                          onClick={() => toggleNodeExpansion('pillar2')}
                          className="px-4 py-3 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-[#fafafa] transition-colors"
                        >
                          <span className="text-[14px] font-semibold text-[#18181b]">
                            Packaging and Assembly
                          </span>

                          <div className="flex items-center gap-2">
                            <StatusPill
                              label={
                                activeOrder?.history.includes('p2_dispatched')
                                  ? 'Packaged and Sealed'
                                  : activeOrder?.history.includes('p2_in_packaging')
                                  ? 'In Packaging'
                                  : 'Awaiting Packaging'
                              }
                              variant={
                                activeOrder?.history.includes('p2_dispatched')
                                  ? 'emerald'
                                  : activeOrder?.history.includes('p2_in_packaging')
                                  ? 'amber'
                                  : 'zinc'
                              }
                            />
                            <span className="w-5 h-5 rounded-md flex items-center justify-center text-[#71717a] hover:bg-[#f4f4f5] transition-colors">
                              {expandedNodes.pillar2 ? (
                                <ChevronUp className="w-4 h-4 stroke-[2]" />
                              ) : (
                                <ChevronDown className="w-4 h-4 stroke-[2]" />
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Observability Rows with Divider Lines */}
                        {expandedNodes.pillar2 && (
                          <div className="border-t border-[#e4e4e7] bg-white divide-y divide-[#e4e4e7] text-xs">
                            <div className="px-4 py-2.5 flex items-center justify-between">
                              <span className="text-[#52525b]">Packaging Station Queue</span>
                              <StatusPill
                                label={
                                  activeOrder?.history.includes('p2_dispatched')
                                    ? 'Packaging Completed'
                                    : activeOrder?.history.includes('p2_in_packaging')
                                    ? 'Active at Packaging Bench'
                                    : 'Awaiting Packaging'
                                }
                                variant={
                                  activeOrder?.history.includes('p2_dispatched')
                                    ? 'emerald'
                                    : activeOrder?.history.includes('p2_in_packaging')
                                    ? 'amber'
                                    : 'zinc'
                                }
                              />
                            </div>

                            <div className="px-4 py-2.5 flex items-center justify-between">
                              <span className="text-[#52525b]">Takeaway Packaging Items</span>
                              <StatusPill
                                label={
                                  activeOrder?.history.includes('p2_materials_picked')
                                    ? 'Bowls and Bags Picked'
                                    : activeOrder?.history.includes('p2_in_packaging')
                                    ? 'Picking Packaging Items'
                                    : 'Awaiting Material Pick'
                                }
                                variant={
                                  activeOrder?.history.includes('p2_materials_picked')
                                    ? 'emerald'
                                    : activeOrder?.history.includes('p2_in_packaging')
                                    ? 'amber'
                                    : 'zinc'
                                }
                              />
                            </div>

                            <div className="px-4 py-2.5 flex items-center justify-between">
                              <span className="text-[#52525b]">Packaging Stock Deduction</span>
                              <StatusPill
                                label={
                                  activeOrder?.history.includes('p2_materials_picked')
                                    ? 'Containers Deducted from Stock'
                                    : 'Stock on Hand'
                                }
                                variant={activeOrder?.history.includes('p2_materials_picked') ? 'emerald' : 'zinc'}
                              />
                            </div>

                            <div className="px-4 py-2.5 flex items-center justify-between">
                              <span className="text-[#52525b]">Bag Sealing and Dispatch</span>
                              <StatusPill
                                label={
                                  activeOrder?.history.includes('p2_dispatched')
                                    ? 'Packaged and Sealed'
                                    : activeOrder?.history.includes('p2_materials_picked')
                                    ? 'Ready for Sealing'
                                    : 'Pending Bag Seal'
                                }
                                variant={
                                  activeOrder?.history.includes('p2_dispatched')
                                    ? 'emerald'
                                    : activeOrder?.history.includes('p2_materials_picked')
                                    ? 'amber'
                                    : 'zinc'
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* =====================================================================
                      COLUMN 3: PILLAR 3: DELIVERY AND CUSTOMER HANDOVER
                     ===================================================================== */}
                  <div className="w-[290px] sm:w-[330px] shrink-0 space-y-3.5">
                    <div className="flex items-center justify-between px-1 mb-2">
                      <span className="text-xs font-semibold text-[#52525b]">
                        Pillar 3: Delivery and Customer Handover
                      </span>
                      <StatusPill label="Delivery and Handover" variant="emerald" />
                    </div>

                    <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs hover:border-[#a1a1aa]">
                      <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                        {/* Unified Header */}
                        <div
                          ref={bindingsHeaderRef}
                          onClick={() => toggleNodeExpansion('pillar3')}
                          className="px-4 py-3 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-[#fafafa] transition-colors"
                        >
                          <span className="text-[14px] font-semibold text-[#18181b]">Delivery and Handover</span>
                          <div className="flex items-center gap-2">
                            <StatusPill
                              label={
                                activeOrder?.currentStage === 'p3_settled_closed'
                                  ? 'Delivered and Settled'
                                  : activeOrder?.history.includes('p3_delivered')
                                  ? 'Delivered to Customer'
                                  : activeOrder?.history.includes('p3_in_transit')
                                  ? 'Out for Delivery'
                                  : activeOrder?.history.includes('p3_delivery_assigned')
                                  ? 'Driver Assigned'
                                  : 'Awaiting Dispatch'
                              }
                              variant={
                                activeOrder?.currentStage === 'p3_settled_closed' || activeOrder?.history.includes('p3_delivered')
                                  ? 'emerald'
                                  : activeOrder?.history.includes('p3_in_transit') || activeOrder?.history.includes('p3_delivery_assigned')
                                  ? 'blue'
                                  : 'zinc'
                              }
                            />
                            <span className="w-5 h-5 rounded-md flex items-center justify-center text-[#71717a] hover:bg-[#f4f4f5] transition-colors">
                              {expandedNodes.pillar3 ? (
                                <ChevronUp className="w-4 h-4 stroke-[2]" />
                              ) : (
                                <ChevronDown className="w-4 h-4 stroke-[2]" />
                              )}
                            </span>
                          </div>
                        </div>

                        {expandedNodes.pillar3 && (
                          <div className="border-t border-[#e4e4e7] bg-white divide-y divide-[#e4e4e7] text-xs">
                            <div className="px-4 py-2.5 flex items-center justify-between">
                              <span className="text-[#52525b]">Driver Fleet Assignment</span>
                              <StatusPill
                                label={activeOrder?.history.includes('p3_delivery_assigned') ? 'Driver Assigned' : 'Awaiting Driver'}
                                variant={activeOrder?.history.includes('p3_delivery_assigned') ? 'blue' : 'zinc'}
                              />
                            </div>

                            <div className="px-4 py-2.5 flex items-center justify-between">
                              <span className="text-[#52525b]">Kitchen Parcel Handover</span>
                              <StatusPill
                                label={
                                  activeOrder?.history.includes('p3_in_transit')
                                    ? 'Collected from Kitchen'
                                    : activeOrder?.history.includes('p3_delivery_assigned')
                                    ? 'Ready for Driver Pickup'
                                    : 'At Packaging Bench'
                                }
                                variant={
                                  activeOrder?.history.includes('p3_in_transit')
                                    ? 'emerald'
                                    : activeOrder?.history.includes('p3_delivery_assigned')
                                    ? 'amber'
                                    : 'zinc'
                                }
                              />
                            </div>

                            <div className="px-4 py-2.5 flex items-center justify-between">
                              <span className="text-[#52525b]">Road Transit and Navigation</span>
                              <StatusPill
                                label={
                                  activeOrder?.history.includes('p3_delivered')
                                    ? 'Transit Completed'
                                    : activeOrder?.history.includes('p3_in_transit')
                                    ? 'Out for Delivery'
                                    : 'Pending Departure'
                                }
                                variant={
                                  activeOrder?.history.includes('p3_delivered')
                                    ? 'emerald'
                                    : activeOrder?.history.includes('p3_in_transit')
                                    ? 'blue'
                                    : 'zinc'
                                }
                              />
                            </div>

                            <div className="px-4 py-2.5 flex items-center justify-between bg-emerald-50/20">
                              <span className="text-[#18181b] font-medium">Customer Doorstep Handover</span>
                              <StatusPill
                                label={
                                  activeOrder?.history.includes('p3_delivered')
                                    ? 'Delivered to Customer'
                                    : activeOrder?.history.includes('p3_doorstep_handover')
                                    ? 'At Customer Location'
                                    : activeOrder?.history.includes('p3_in_transit')
                                    ? 'En Route to Address'
                                    : 'Awaiting Handover'
                                }
                                variant={
                                  activeOrder?.history.includes('p3_delivered')
                                    ? 'emerald'
                                    : activeOrder?.history.includes('p3_doorstep_handover')
                                    ? 'amber'
                                    : activeOrder?.history.includes('p3_in_transit')
                                    ? 'blue'
                                    : 'zinc'
                                }
                              />
                            </div>

                            <div className="px-4 py-2.5 flex items-center justify-between">
                              <span className="text-[#52525b]">Customer Delivery Verification</span>
                              <StatusPill
                                label={
                                  activeOrder?.history.includes('p3_doorstep_handover') || activeOrder?.history.includes('p3_delivered')
                                    ? 'Customer Code Verified'
                                    : activeOrder?.history.includes('p3_in_transit')
                                    ? 'Customer Code Pending'
                                    : 'Pending Verification'
                                }
                                variant={
                                  activeOrder?.history.includes('p3_doorstep_handover') || activeOrder?.history.includes('p3_delivered')
                                    ? 'emerald'
                                    : activeOrder?.history.includes('p3_in_transit')
                                    ? 'blue'
                                    : 'zinc'
                                }
                              />
                            </div>

                            <div className="px-4 py-2.5 flex items-center justify-between">
                              <span className="text-[#52525b]">Driver Delivery Fee</span>
                              <StatusPill
                                label={
                                  activeOrder?.history.includes('p3_settled_closed')
                                    ? 'Earnings Credited'
                                    : activeOrder?.history.includes('p3_delivered')
                                    ? 'Ready for Settlement'
                                    : 'Pending Completion'
                                }
                                variant={
                                  activeOrder?.history.includes('p3_settled_closed')
                                    ? 'emerald'
                                    : activeOrder?.history.includes('p3_delivered')
                                    ? 'amber'
                                    : 'zinc'
                                }
                              />
                            </div>

                            <div className="px-4 py-2.5 flex items-center justify-between bg-[#fafafa]">
                              <span className="text-[#52525b]">Final Order Completion</span>
                              <StatusPill
                                label={activeOrder?.currentStage === 'p3_settled_closed' ? 'Closed and Completed' : 'Active in Pipeline'}
                                variant={activeOrder?.currentStage === 'p3_settled_closed' ? 'emerald' : 'blue'}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* =====================================================================
                  MODE B: FLOW TREE VIEW (MATCHING USER DIAGRAM SPECIFICATION)
                 ===================================================================== */
              <div className="max-w-4xl mx-auto space-y-6 py-2">
                {/* PILLAR 1 CARD */}
                <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white shadow-2xs">
                  <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                    <div
                      onClick={() => toggleNodeExpansion('treePillar1')}
                      className="px-5 py-3.5 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between cursor-pointer select-none hover:bg-[#f1f5f9] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <h4 className="font-semibold text-xs tracking-wide text-[#0f172a]">
                          Pillar 1: Order Intake and Kitchen Cooking
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill label="Intake and Cooking" variant="blue" />
                        <span className="w-5 h-5 rounded-md flex items-center justify-center text-[#71717a] hover:bg-[#e2e8f0] transition-colors">
                          {expandedNodes.treePillar1 !== false ? (
                            <ChevronUp className="w-4 h-4 stroke-[2]" />
                          ) : (
                            <ChevronDown className="w-4 h-4 stroke-[2]" />
                          )}
                        </span>
                      </div>
                    </div>

                    {expandedNodes.treePillar1 !== false && (
                      <div className="divide-y divide-[#e4e4e7] text-xs text-[#334155]">
                        <div className="px-5 py-3 flex items-center justify-between">
                          <span className="text-[#52525b]">Order Ingestion and Validation</span>
                          <StatusPill
                            label={activeOrder?.history.includes('p1_ingestion') ? 'Ready for Fulfillment' : 'Pending Ingestion'}
                            variant="emerald"
                          />
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                          <span className="text-[#52525b]">Customer Payment Verification</span>
                          <StatusPill
                            label={activeOrder?.paymentRef ? 'Payment Confirmed' : 'Payment Pending'}
                            variant="emerald"
                          />
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                          <span className="text-[#52525b]">Finished Goods Stock Check</span>
                          <StatusPill
                            label={activeOrder?.hasStock ? 'Stock Available' : 'Cooking Required'}
                            variant={activeOrder?.hasStock ? 'emerald' : 'amber'}
                          />
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                          <span className="text-[#52525b]">Inventory Stock Allocation</span>
                          <StatusPill
                            label={
                              activeOrder?.history.includes('p1_inventory_deduct')
                                ? activeOrder?.hasStock
                                  ? 'Reserved from Finished Stock'
                                  : 'Ingredients Allocated'
                                : 'Pending Stock Check'
                            }
                            variant={
                              activeOrder?.history.includes('p1_inventory_deduct')
                                ? activeOrder?.hasStock
                                  ? 'emerald'
                                  : 'blue'
                                : 'zinc'
                            }
                          />
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                          <span className="text-[#52525b]">Recipe Ingredients Deduction</span>
                          <StatusPill
                            label={
                              activeOrder?.hasStock
                                ? 'Direct Stock Item'
                                : activeOrder?.history.includes('p1_inventory_deduct')
                                ? 'Recipe Ingredients Deducted'
                                : 'Pending Deduction'
                            }
                            variant={
                              activeOrder?.hasStock
                                ? 'zinc'
                                : activeOrder?.history.includes('p1_inventory_deduct')
                                ? 'blue'
                                : 'zinc'
                            }
                          />
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                          <span className="text-[#52525b]">Kitchen Cooking Batch</span>
                          <StatusPill
                            label={
                              activeOrder?.hasStock
                                ? 'Direct Stock Fulfillment'
                                : activeOrder?.history.includes('p1_production_batch')
                                ? 'Cooking Completed'
                                : activeOrder?.currentStage === 'p1_production_batch'
                                ? 'Cooking in Progress'
                                : 'Awaiting Kitchen'
                            }
                            variant={
                              activeOrder?.hasStock || activeOrder?.history.includes('p1_production_batch')
                                ? 'emerald'
                                : activeOrder?.currentStage === 'p1_production_batch'
                                ? 'amber'
                                : 'zinc'
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* STEM 1 TO 2 */}
                <div className="flex flex-col items-center justify-center -my-3">
                  <div className="w-[1.5px] h-6 bg-[#94a3b8]" />
                  <div className="w-2 h-2 rotate-45 border-r-[1.5px] border-b-[1.5px] border-[#94a3b8] -mt-1" />
                </div>

                {/* PILLAR 2 CARD */}
                <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white shadow-2xs">
                  <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                    <div
                      onClick={() => toggleNodeExpansion('treePillar2')}
                      className="px-5 py-3.5 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between cursor-pointer select-none hover:bg-[#f1f5f9] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <h4 className="font-semibold text-xs tracking-wide text-[#0f172a]">
                          Pillar 2: Packaging and Food Assembly
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill label="Packaging and Assembly" variant="amber" />
                        <span className="w-5 h-5 rounded-md flex items-center justify-center text-[#71717a] hover:bg-[#e2e8f0] transition-colors">
                          {expandedNodes.treePillar2 !== false ? (
                            <ChevronUp className="w-4 h-4 stroke-[2]" />
                          ) : (
                            <ChevronDown className="w-4 h-4 stroke-[2]" />
                          )}
                        </span>
                      </div>
                    </div>

                    {expandedNodes.treePillar2 !== false && (
                      <div className="divide-y divide-[#e4e4e7] text-xs text-[#334155]">
                        <div className="px-5 py-3 flex items-center justify-between">
                          <span className="text-[#52525b]">Packaging Station Queue</span>
                          <StatusPill
                            label={
                              activeOrder?.history.includes('p2_dispatched')
                                ? 'Packaging Completed'
                                : activeOrder?.history.includes('p2_in_packaging')
                                ? 'Active at Packaging Bench'
                                : 'Awaiting Packaging'
                            }
                            variant={
                              activeOrder?.history.includes('p2_dispatched')
                                ? 'emerald'
                                : activeOrder?.history.includes('p2_in_packaging')
                                ? 'amber'
                                : 'zinc'
                            }
                          />
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                          <span className="text-[#52525b]">Takeaway Packaging Items</span>
                          <StatusPill
                            label={
                              activeOrder?.history.includes('p2_materials_picked')
                                ? 'Bowls and Bags Picked'
                                : activeOrder?.history.includes('p2_in_packaging')
                                ? 'Picking Packaging Items'
                                : 'Awaiting Material Pick'
                            }
                            variant={
                              activeOrder?.history.includes('p2_materials_picked')
                                ? 'emerald'
                                : activeOrder?.history.includes('p2_in_packaging')
                                ? 'amber'
                                : 'zinc'
                            }
                          />
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                          <span className="text-[#52525b]">Packaging Stock Deduction</span>
                          <StatusPill
                            label={
                              activeOrder?.history.includes('p2_materials_picked')
                                ? 'Containers Deducted from Stock'
                                : 'Stock on Hand'
                            }
                            variant={activeOrder?.history.includes('p2_materials_picked') ? 'emerald' : 'zinc'}
                          />
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                          <span className="text-[#52525b]">Bag Sealing and Dispatch</span>
                          <StatusPill
                            label={
                              activeOrder?.history.includes('p2_dispatched')
                                ? 'Packaged and Sealed'
                                : activeOrder?.history.includes('p2_materials_picked')
                                ? 'Ready for Sealing'
                                : 'Pending Bag Seal'
                            }
                            variant={
                              activeOrder?.history.includes('p2_dispatched')
                                ? 'emerald'
                                : activeOrder?.history.includes('p2_materials_picked')
                                ? 'amber'
                                : 'zinc'
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* STEM 2 TO 3 */}
                <div className="flex flex-col items-center justify-center -my-3">
                  <div className="w-[1.5px] h-6 bg-[#94a3b8]" />
                  <div className="w-2 h-2 rotate-45 border-r-[1.5px] border-b-[1.5px] border-[#94a3b8] -mt-1" />
                </div>

                {/* PILLAR 3 CARD */}
                <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white shadow-2xs">
                  <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                    <div
                      onClick={() => toggleNodeExpansion('treePillar3')}
                      className="px-5 py-3.5 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between cursor-pointer select-none hover:bg-[#f1f5f9] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <h4 className="font-semibold text-xs tracking-wide text-[#0f172a]">
                          Pillar 3: Delivery and Customer Handover
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill label="Delivery and Handover" variant="emerald" />
                        <span className="w-5 h-5 rounded-md flex items-center justify-center text-[#71717a] hover:bg-[#e2e8f0] transition-colors">
                          {expandedNodes.treePillar3 !== false ? (
                            <ChevronUp className="w-4 h-4 stroke-[2]" />
                          ) : (
                            <ChevronDown className="w-4 h-4 stroke-[2]" />
                          )}
                        </span>
                      </div>
                    </div>

                    {expandedNodes.treePillar3 !== false && (
                      <div className="divide-y divide-[#e4e4e7] text-xs text-[#334155]">
                        <div className="px-5 py-3 flex items-center justify-between">
                          <span className="text-[#52525b]">Driver Fleet Assignment</span>
                          <StatusPill
                            label={activeOrder?.history.includes('p3_delivery_assigned') ? 'Driver Assigned' : 'Awaiting Driver'}
                            variant={activeOrder?.history.includes('p3_delivery_assigned') ? 'blue' : 'zinc'}
                          />
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                          <span className="text-[#52525b]">Kitchen Parcel Handover</span>
                          <StatusPill
                            label={
                              activeOrder?.history.includes('p3_in_transit')
                                ? 'Collected from Kitchen'
                                : activeOrder?.history.includes('p3_delivery_assigned')
                                ? 'Ready for Driver Pickup'
                                : 'At Packaging Bench'
                            }
                            variant={
                              activeOrder?.history.includes('p3_in_transit')
                                ? 'emerald'
                                : activeOrder?.history.includes('p3_delivery_assigned')
                                ? 'amber'
                                : 'zinc'
                            }
                          />
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                          <span className="text-[#52525b]">Road Transit and Navigation</span>
                          <StatusPill
                            label={
                              activeOrder?.history.includes('p3_delivered')
                                ? 'Transit Completed'
                                : activeOrder?.history.includes('p3_in_transit')
                                ? 'Out for Delivery'
                                : 'Pending Departure'
                            }
                            variant={
                              activeOrder?.history.includes('p3_delivered')
                                ? 'emerald'
                                : activeOrder?.history.includes('p3_in_transit')
                                ? 'blue'
                                : 'zinc'
                            }
                          />
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between bg-emerald-50/20">
                          <span className="text-[#18181b] font-medium">Customer Doorstep Handover</span>
                          <StatusPill
                            label={
                              activeOrder?.history.includes('p3_delivered')
                                ? 'Delivered to Customer'
                                : activeOrder?.history.includes('p3_doorstep_handover')
                                ? 'At Customer Location'
                                : activeOrder?.history.includes('p3_in_transit')
                                ? 'En Route to Address'
                                : 'Awaiting Handover'
                            }
                            variant={
                              activeOrder?.history.includes('p3_delivered')
                                ? 'emerald'
                                : activeOrder?.history.includes('p3_doorstep_handover')
                                ? 'amber'
                                : activeOrder?.history.includes('p3_in_transit')
                                ? 'blue'
                                : 'zinc'
                            }
                          />
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                          <span className="text-[#52525b]">Customer Delivery Verification</span>
                          <StatusPill
                            label={
                              activeOrder?.history.includes('p3_doorstep_handover') || activeOrder?.history.includes('p3_delivered')
                                ? 'Customer Code Verified'
                                : activeOrder?.history.includes('p3_in_transit')
                                ? 'Customer Code Pending'
                                : 'Pending Verification'
                            }
                            variant={
                              activeOrder?.history.includes('p3_doorstep_handover') || activeOrder?.history.includes('p3_delivered')
                                ? 'emerald'
                                : activeOrder?.history.includes('p3_in_transit')
                                ? 'blue'
                                : 'zinc'
                            }
                          />
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                          <span className="text-[#52525b]">Driver Delivery Fee</span>
                          <StatusPill
                            label={
                              activeOrder?.history.includes('p3_settled_closed')
                                ? 'Earnings Credited'
                                : activeOrder?.history.includes('p3_delivered')
                                ? 'Ready for Settlement'
                                : 'Pending Completion'
                            }
                            variant={
                              activeOrder?.history.includes('p3_settled_closed')
                                ? 'emerald'
                                : activeOrder?.history.includes('p3_delivered')
                                ? 'amber'
                                : 'zinc'
                            }
                          />
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between bg-[#fafafa]">
                          <span className="text-[#52525b]">Final Order Completion</span>
                          <StatusPill
                            label={activeOrder?.currentStage === 'p3_settled_closed' ? 'Closed and Completed' : 'Active in Pipeline'}
                            variant={activeOrder?.currentStage === 'p3_settled_closed' ? 'emerald' : 'blue'}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
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
