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
  CheckCircle2,
  Clock,
  ArrowDown,
  Layers,
  Network
} from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'
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
  channel: 'Website Storefront' | 'Walk-in POS' | 'WhatsApp Direct'
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
    dishName: 'Smoked Beef Brisket Feast & Jollof',
    totalAmount: 18500,
    portions: 3,
    channel: 'Website Storefront',
    hasStock: false, // Required kitchen production batch!
    currentStage: 'p1_production_batch',
    paymentRef: 'pay_smk_99182',
    batchId: 'BAT-SMK-402',
    riderName: 'Rider Yusuf (Internal Fleet)',
    destinationAddress: '8c Taiwo Osipitan Way, Ogba, Lagos',
    etaMinutes: 22,
    otpCode: '4821',
    deliveryFee: 4000,
    history: ['p1_ingestion', 'p1_inventory_deduct', 'p1_production_batch']
  },
  {
    id: 'SHD-09854',
    customerName: 'Amaka Okafor',
    dishName: '1L Guineafowl Rice & Smoked Catfish',
    totalAmount: 24000,
    portions: 2,
    channel: 'Website Storefront',
    hasStock: true, // In stock: directly decremented from sales inventory
    currentStage: 'p2_in_packaging',
    paymentRef: 'pay_smk_99183',
    riderName: 'Rider Yusuf (Internal Fleet)',
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
    channel: 'WhatsApp Direct',
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
    channel: 'Walk-in POS',
    hasStock: true,
    currentStage: 'p3_settled_closed',
    paymentRef: 'pay_smk_99180',
    riderName: 'Rider Yusuf (Internal Fleet)',
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
      showToast(`Order ${activeOrder.id} is already closed. Delivery fee settled into rider ledger.`, 'info')
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
      showToast(`Settlement Complete: ₦${activeOrder.deliveryFee.toLocaleString()} credited to Rider Yusuf ledger. Order closed!`, 'success')
    } else if (next === 'p3_doorstep_handover') {
      showToast(`Doorstep Handover: Customer verified OTP #${activeOrder.otpCode}. Handover confirmed!`, 'success')
    } else if (next === 'p2_in_packaging') {
      showToast(`Fulfillment Initiated: Order ${activeOrder.id} status = 'in_packaging'.`, 'info')
    } else {
      showToast(`Order ${activeOrder.id} progressed to ${next.replace(/_/g, ' ').toUpperCase()}`, 'info')
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
      currentStage: 'p1_ingestion',
      paymentRef: `pay_smk_${Math.floor(10000 + Math.random() * 90000)}`,
      destinationAddress: 'Victoria Island, Lagos',
      otpCode: `${Math.floor(1000 + Math.random() * 9000)}`,
      deliveryFee: 4000,
      history: ['p1_ingestion']
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

    // Path 1B: From Inventory/BOM into trunk
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

    // Stem from trunk into Pillar 2 (Packaging & Assembly)
    const trunkToPillar2 = `M ${trunkX} ${cL.y} H ${cL.x}`

    // Stem from Pillar 2 to Pillar 3 (Logistics & Handover)
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
        {/* Left: Globe & Route info */}
        <div className="flex items-center gap-2.5 text-[#18181b]">
          <Globe className="w-4 h-4 text-[#71717a] shrink-0" />
          <span className="font-normal text-[13px] tracking-tight">
            smokeyhut.streetmbasolution.com/orders/pipeline/*+3 pillars
          </span>
          <span className="text-[#a1a1aa] font-mono text-[11px] hidden md:inline">
            (Pillar 1 $\rightarrow$ Pillar 2 $\rightarrow$ Pillar 3)
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
                  "px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer",
                  selectedOrderId === ord.id
                    ? "bg-white text-[#18181b] shadow-xs font-semibold"
                    : "text-[#71717a] hover:text-[#18181b]"
                )}
              >
                {ord.id}
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

          <span className="text-[12px] text-[#71717a] hidden xl:inline">
            by ayodine47 <span className="text-[#a1a1aa]">3 days ago</span>
          </span>
        </div>
      </div>

      {/* =========================================================================
          2. MAIN WORKFLOW CONTAINER
         ========================================================================= */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 sm:p-8 relative shadow-2xs transition-all overflow-hidden">
        {/* ACTIVE ORDER SUB-BAR */}
        <div className="flex flex-wrap items-center justify-between pb-5 mb-6 border-b border-[#f4f4f5] gap-3">
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
            <span className="text-[12px] text-[#71717a]">Current Stage:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#f4f4f5] text-[#18181b] border border-[#e4e4e7]">
              {activeOrder?.currentStage}
            </span>
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
                <div className="flex flex-row items-start justify-between gap-10 sm:gap-14 relative z-10 overflow-x-auto pb-4">
                  {/* =====================================================================
                      COLUMN 1: PILLAR 1: INGESTION & PRODUCTION
                     ===================================================================== */}
                  <div className="w-[230px] sm:w-[250px] shrink-0 space-y-3.5">
                    <div className="text-[11px] font-bold text-[#71717a] uppercase tracking-wider px-1">
                      Pillar 1: Ingestion & Production
                    </div>

                    {/* Node 1A: Ingestion State */}
                    <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs hover:border-[#a1a1aa]">
                      <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                        <div
                          ref={node1AHeaderRef}
                          onClick={() => toggleNodeExpansion('node1A')}
                          className="px-4 py-2.5 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-[#fafafa] transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-[14px] font-normal text-[#18181b]">Order Ingestion</span>
                            <span className="bg-[#52525b] text-white text-[11px] font-semibold px-2 py-0.5 rounded-[5px] min-w-[20px] text-center inline-block leading-tight">
                              paid
                            </span>
                          </div>
                          {expandedNodes.node1A ? (
                            <ChevronUp className="w-4 h-4 text-[#71717a] stroke-[2]" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[#71717a] stroke-[2]" />
                          )}
                        </div>

                        {expandedNodes.node1A && (
                          <div className="border-t border-[#f4f4f5] px-3.5 py-2.5 bg-white space-y-1 text-xs">
                            <p className="font-mono text-[11px] text-[#18181b]">
                              orders.order_status = <strong className="text-emerald-700">'ready_for_fulfillment'</strong>
                            </p>
                            <p className="font-mono text-[11px] text-[#18181b]">
                              orders.payment_status = <strong className="text-emerald-700">'paid'</strong>
                            </p>
                            <p className="text-[11px] text-[#71717a] pt-1">
                              Paystack ref: {activeOrder?.paymentRef}
                            </p>
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
                          className="px-4 py-2.5 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-[#fafafa] transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-[14px] font-normal text-[#18181b]">Inventory Allocation</span>
                            <span className={cn(
                              "text-[11px] font-semibold px-2 py-0.5 rounded-[5px] min-w-[20px] text-center inline-block leading-tight",
                              activeOrder?.hasStock ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                            )}>
                              {activeOrder?.hasStock ? 'sales' : 'raw BOM'}
                            </span>
                          </div>
                          {expandedNodes.node1B ? (
                            <ChevronUp className="w-4 h-4 text-[#71717a] stroke-[2]" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[#71717a] stroke-[2]" />
                          )}
                        </div>

                        {expandedNodes.node1B && (
                          <div className="border-t border-[#f4f4f5] px-3.5 py-2.5 bg-white space-y-1 text-xs">
                            <p className="font-mono text-[11px] text-[#18181b]">
                              products (sales): <span className="text-emerald-700 font-semibold">stock_qty decremented</span>
                            </p>
                            <p className="font-mono text-[11px] text-[#71717a]">
                              OR recipe_ingredients decremented from products (raw)
                            </p>
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
                          className="px-4 py-2.5 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-[#fafafa] transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-[14px] font-normal text-[#18181b]">Production Batches</span>
                            <span className="bg-[#52525b] text-white text-[11px] font-semibold px-2 py-0.5 rounded-[5px] min-w-[20px] text-center inline-block leading-tight">
                              BAT
                            </span>
                          </div>
                          {expandedNodes.node1C ? (
                            <ChevronUp className="w-4 h-4 text-[#71717a] stroke-[2]" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[#71717a] stroke-[2]" />
                          )}
                        </div>

                        {expandedNodes.node1C && (
                          <div className="border-t border-[#f4f4f5] px-3.5 py-2.5 bg-white space-y-1 text-xs">
                            <p className="font-mono text-[11px] text-[#18181b]">
                              production_batches: status = <strong className="text-emerald-700">'completed'</strong>
                            </p>
                            <p className="font-mono text-[11px] text-[#18181b]">
                              actual_output = <strong className="text-emerald-700">recorded</strong> ({activeOrder?.batchId || 'BAT-SMK-402'})
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* =====================================================================
                      COLUMN 2: PILLAR 2: FULFILLMENT ASSEMBLY & PACKAGING (CENTER ENGINE)
                     ===================================================================== */}
                  <div className="w-[280px] sm:w-[310px] shrink-0 space-y-3.5">
                    <div className="text-[11px] font-bold text-[#71717a] uppercase tracking-wider px-1">
                      Pillar 2: Assembly & Packaging
                    </div>

                    <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs">
                      <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                        {/* Header */}
                        <div
                          ref={centerHeaderRef}
                          onClick={() => toggleNodeExpansion('pillar2')}
                          className="px-4 py-3 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-[#fafafa]"
                        >
                          <div className="flex items-center gap-2.5">
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
                              assembly-packaging
                            </span>
                          </div>

                          <span className="w-4 h-4 rounded-full bg-[#bfdbfe]/60 flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
                          </span>
                        </div>

                        {/* Observability Rows with Leader lines */}
                        {expandedNodes.pillar2 && (
                          <div className="border-t border-[#f4f4f5] px-4 py-3 space-y-2.5 bg-white text-[13px]">
                            {/* Step 2.1 */}
                            <div className="flex items-center justify-between">
                              <span className="text-[#18181b] font-mono text-[11px]">orders.order_status</span>
                              <div className="flex-1 h-[1px] bg-[#e4e4e7] mx-2" />
                              <span className="border border-[#d4d4d8] rounded-full px-2 py-0.5 text-[11px] text-[#52525b] bg-white font-mono">
                                'in_packaging'
                              </span>
                            </div>

                            {/* Step 2.2 */}
                            <div className="flex items-center justify-between">
                              <span className="text-[#18181b] font-mono text-[11px]">materials_pick</span>
                              <div className="flex-1 h-[1px] bg-[#e4e4e7] mx-2" />
                              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                1L bowls & tape
                              </span>
                            </div>

                            {/* Step 2.3 */}
                            <div className="flex items-center justify-between">
                              <span className="text-[#18181b] font-mono text-[11px]">products (packaging)</span>
                              <div className="flex-1 h-[1px] bg-[#e4e4e7] mx-2" />
                              <span className="text-[10px] text-[#52525b] bg-[#f4f4f5] px-1.5 py-0.5 rounded">
                                decremented
                              </span>
                            </div>

                            {/* Step 2.4 */}
                            <div className="pt-2 border-t border-[#f4f4f5] flex items-center justify-between">
                              <span className="text-[#18181b] font-mono text-[11px]">orders.order_status</span>
                              <div className="flex-1 h-[1px] bg-[#e4e4e7] mx-2" />
                              <span className={cn(
                                "border rounded-full px-2 py-0.5 text-[11px] font-mono font-medium",
                                activeOrder?.history.includes('p2_dispatched')
                                  ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                                  : "border-[#d4d4d8] text-[#52525b] bg-white"
                              )}>
                                'dispatched'
                              </span>
                            </div>
                            <p className="text-[10px] font-mono text-[#a1a1aa] text-right">
                              packaged_at = NOW()
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* =====================================================================
                      COLUMN 3: PILLAR 3: LAST-MILE LOGISTICS & CONSUMER HANDOVER
                     ===================================================================== */}
                  <div className="w-[290px] sm:w-[330px] shrink-0 space-y-3.5">
                    <div className="text-[11px] font-bold text-[#71717a] uppercase tracking-wider px-1">
                      Pillar 3: Last-Mile & Settlement
                    </div>

                    <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs hover:border-[#a1a1aa]">
                      <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                        {/* Header */}
                        <div
                          ref={bindingsHeaderRef}
                          onClick={() => toggleNodeExpansion('pillar3')}
                          className="px-4 py-2.5 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-[#fafafa] transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-[15px] font-normal text-[#18181b]">Last-Mile Logistics</span>
                            <span className="bg-[#52525b] text-white text-[12px] font-semibold px-2 py-0.5 rounded-[5px] min-w-[20px] text-center inline-block leading-tight">
                              4
                            </span>
                          </div>
                          {expandedNodes.pillar3 ? (
                            <ChevronUp className="w-4 h-4 text-[#71717a] stroke-[2]" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[#71717a] stroke-[2]" />
                          )}
                        </div>

                        {expandedNodes.pillar3 && (
                          <div className="border-t border-[#f4f4f5] bg-white text-xs divide-y divide-[#f4f4f5]">
                            {/* 3.1 & 3.2 Assignment & In Transit */}
                            <div className="px-4 py-2.5 space-y-1">
                              <div className="flex items-center justify-between font-mono text-[11px]">
                                <span className="text-[#52525b]">logistics_deliveries:</span>
                                <span className="font-semibold text-[#18181b]">'assigned' $\rightarrow$ 'in_transit'</span>
                              </div>
                              <p className="font-mono text-[10px] text-[#71717a]">
                                orders.order_status = <strong className="text-blue-600">'in_transit'</strong>
                              </p>
                              <p className="text-[10px] text-[#a1a1aa]">
                                assigned_at = NOW() · pickup_at = NOW()
                              </p>
                            </div>

                            {/* 3.3 Doorstep Handover */}
                            <div className="px-4 py-2.5 bg-emerald-50/30 space-y-1">
                              <div className="flex items-center justify-between font-semibold text-[11px] text-[#18181b]">
                                <span>[DOORSTEP HANDOVER TO CONSUMER]</span>
                                <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                  OTP #{activeOrder?.otpCode}
                                </span>
                              </div>
                              <p className="font-mono text-[10px] text-[#52525b]">
                                logistics_deliveries: <strong className="text-emerald-700">'delivered'</strong> (delivered_at = NOW())
                              </p>
                              <p className="font-mono text-[10px] text-[#52525b]">
                                orders.order_status = <strong className="text-emerald-700">'delivered'</strong>
                              </p>
                            </div>

                            {/* 3.4 Ledger Credit & Closed */}
                            <div className="px-4 py-2.5 space-y-1 bg-[#fafafa]">
                              <div className="flex items-center justify-between font-mono text-[11px]">
                                <span className="text-[#52525b]">rider_financial_ledger:</span>
                                <span className="text-emerald-700 font-bold">credit_commission</span>
                              </div>
                              <p className="font-mono text-[10px] text-[#18181b]">
                                pending_payout += ₦{activeOrder?.deliveryFee.toLocaleString()}
                              </p>
                              <div className="flex items-center justify-between pt-1">
                                <span className="font-mono text-[11px] text-[#71717a]">orders.order_status:</span>
                                <span className={cn(
                                  "font-mono text-[10px] font-bold px-1.5 py-0.5 rounded",
                                  activeOrder?.currentStage === 'p3_settled_closed'
                                    ? "bg-emerald-600 text-white"
                                    : "bg-[#e4e4e7] text-[#52525b]"
                                )}>
                                  'closed'
                                </span>
                              </div>
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
                  MODE B: EXACT VERTICAL FLOW TREE (MATCHING USER DIAGRAM)
                 ===================================================================== */
              <div className="max-w-4xl mx-auto space-y-6 py-2">
                {/* PILLAR 1 CARD */}
                <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white shadow-2xs">
                  <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                    <div className="px-5 py-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <h4 className="font-mono font-bold text-xs uppercase tracking-wider text-[#0f172a]">
                          PILLAR 1: INGESTION & PRODUCTION
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono text-[#64748b]">
                        orders · products (sales/raw) · production_batches
                      </span>
                    </div>

                    <div className="p-4 sm:p-5 space-y-2.5 font-mono text-xs text-[#334155] leading-relaxed">
                      <div className="flex items-start gap-2">
                        <span className="text-[#64748b]">•</span>
                        <div>
                          <strong>orders:</strong> order_status = <code className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">'ready_for_fulfillment'</code>, payment_status = <code className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">'paid'</code>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#64748b]">•</span>
                        <div>
                          <strong>products (sales):</strong> stock_qty decremented <span className="text-[#64748b]">OR</span> recipe_ingredients decremented from <strong>products (raw)</strong>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#64748b]">•</span>
                        <div>
                          <strong>production_batches:</strong> status = <code className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">'completed'</code>, actual_output recorded
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* STEM 1 -> 2 */}
                <div className="flex flex-col items-center justify-center -my-3">
                  <div className="w-[1.5px] h-6 bg-[#94a3b8]" />
                  <ArrowDown className="w-4 h-4 text-[#64748b] -mt-1" />
                </div>

                {/* PILLAR 2 CARD */}
                <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white shadow-2xs">
                  <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                    <div className="px-5 py-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <h4 className="font-mono font-bold text-xs uppercase tracking-wider text-[#0f172a]">
                          PILLAR 2: FULFILLMENT ASSEMBLY & PACKAGING
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono text-[#64748b]">
                        orders · packaging_materials_pick · products (packaging)
                      </span>
                    </div>

                    <div className="p-4 sm:p-5 space-y-2.5 font-mono text-xs text-[#334155] leading-relaxed">
                      <div className="flex items-start gap-2">
                        <span className="text-[#64748b]">•</span>
                        <div>
                          <strong>orders:</strong> order_status = <code className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">'in_packaging'</code>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#64748b]">•</span>
                        <div>
                          <strong>packaging_materials_pick:</strong> 1L bowls & tamper tape picked
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#64748b]">•</span>
                        <div>
                          <strong>products (packaging):</strong> packaging inventory stock decremented
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#64748b]">•</span>
                        <div>
                          <strong>orders:</strong> order_status = <code className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">'dispatched'</code>, packaged_at = NOW()
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* STEM 2 -> 3 */}
                <div className="flex flex-col items-center justify-center -my-3">
                  <div className="w-[1.5px] h-6 bg-[#94a3b8]" />
                  <ArrowDown className="w-4 h-4 text-[#64748b] -mt-1" />
                </div>

                {/* PILLAR 3 CARD */}
                <div className="p-[2.5px] rounded-[16px] border border-[#d4d4d8] bg-white shadow-2xs">
                  <div className="rounded-[12px] border border-[#d4d4d8] bg-white overflow-hidden">
                    <div className="px-5 py-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <h4 className="font-mono font-bold text-xs uppercase tracking-wider text-[#0f172a]">
                          PILLAR 3: LAST-MILE LOGISTICS & CONSUMER HANDOVER
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono text-[#64748b]">
                        logistics_deliveries · orders · rider_financial_ledger
                      </span>
                    </div>

                    <div className="p-4 sm:p-5 space-y-2.5 font-mono text-xs text-[#334155] leading-relaxed">
                      <div className="flex items-start gap-2">
                        <span className="text-[#64748b]">•</span>
                        <div>
                          <strong>logistics_deliveries:</strong> status = <code className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">'assigned'</code>, assigned_at = NOW()
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#64748b]">•</span>
                        <div>
                          <strong>logistics_deliveries:</strong> status = <code className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">'in_transit'</code>, pickup_at = NOW()
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#64748b]">•</span>
                        <div>
                          <strong>orders:</strong> order_status = <code className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">'in_transit'</code>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-emerald-900 font-bold flex items-center justify-between">
                        <span>• [DOORSTEP HANDOVER TO CONSUMER]</span>
                        <span className="text-[11px] font-normal text-emerald-700">Doorstep OTP verification</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#64748b]">•</span>
                        <div>
                          <strong>logistics_deliveries:</strong> status = <code className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">'delivered'</code>, delivered_at = NOW()
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#64748b]">•</span>
                        <div>
                          <strong>orders:</strong> order_status = <code className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">'delivered'</code>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#64748b]">•</span>
                        <div>
                          <strong>rider_financial_ledger:</strong> credit_commission written, pending_payout += delivery_fee (₦{activeOrder?.deliveryFee.toLocaleString()})
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#64748b]">•</span>
                        <div>
                          <strong>orders:</strong> order_status = <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-300 font-bold">'closed'</code>
                        </div>
                      </div>
                    </div>
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
