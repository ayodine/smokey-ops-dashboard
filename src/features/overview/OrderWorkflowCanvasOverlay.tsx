import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  Globe,
  ChevronDown,
  ChevronUp,
  Play,
  Zap,
  RefreshCw,
  Layers,
  Network,
  Search
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
  dot = false,
  className
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/80',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/80',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
    zinc: 'bg-[#e4e4e7] text-[#18181b] border-transparent'
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
        'inline-flex items-center justify-center w-[92px] py-0.5 rounded-[4px] text-[11px] font-medium border shrink-0 leading-normal select-none text-center',
        variantStyles[variant],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0 mr-1', dotColors[variant])} />}
      <span className="truncate">{label}</span>
    </span>
  )
}

export const CountBadge: React.FC<{ count: string | number; className?: string }> = ({ count, className }) => (
  <span
    className={cn(
      'inline-flex items-center justify-center px-1.5 py-0.5 rounded-[6px] text-[11px] font-semibold bg-[#52525b] text-white min-w-[20px] leading-tight select-none',
      className
    )}
  >
    {count}
  </span>
)

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
  const [orderSearchInput, setOrderSearchInput] = useState<string>('')

  const handleOrderSearch = (query: string) => {
    setOrderSearchInput(query)
    if (!query.trim()) return
    const cleanQ = query.trim().toLowerCase()
    const matched = orders.find(o => 
      o.id.toLowerCase().includes(cleanQ) || 
      o.id.replace('shd-', '').replace('0', '').includes(cleanQ) ||
      o.customerName.toLowerCase().includes(cleanQ) ||
      o.dishName.toLowerCase().includes(cleanQ)
    )
    if (matched) {
      setSelectedOrderId(matched.id)
    }
  }

  // Accordion expansion state matching Screenshot 1 (collapsed) vs Screenshot 2 & 5 (expanded)
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    node1A: true,
    node1B: true,
    node1C: true,
    pillar2: true,
    pillar3: true,
    tree1: true,
    tree2: true,
    tree3: true,
    tree4: true,
    tree5: true
  })

  // DOM Refs for dynamic anchor alignment
  const containerRef = useRef<HTMLDivElement | null>(null)
  const node1ACardRef = useRef<HTMLDivElement | null>(null)
  const node1BCardRef = useRef<HTMLDivElement | null>(null)
  const node1CCardRef = useRef<HTMLDivElement | null>(null)
  const centerCardRef = useRef<HTMLDivElement | null>(null)
  const bindingsCardRef = useRef<HTMLDivElement | null>(null)

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

  // Sub-group status and count metrics for all main categories
  const pipelineMetrics = useMemo(() => {
    // Card 1: Order Intake (3 tasks)
    const intakeValidation: 'Done' | 'In Progress' | 'Pending' = activeOrder?.history.includes('p1_ingestion')
      ? 'Done'
      : 'Pending'
    const intakePayment: 'Done' | 'In Progress' | 'Pending' = activeOrder?.paymentRef ? 'Done' : 'Pending'
    const intakeChannel: 'Done' | 'In Progress' | 'Pending' = activeOrder?.channel ? 'Done' : 'Pending'
    const intakeDoneCount = [intakeValidation, intakePayment, intakeChannel].filter((s) => s === 'Done').length

    // Card 2: Inventory Allocation (3 tasks)
    const invStock: 'Done' | 'In Progress' | 'Pending' =
      activeOrder?.history.includes('p1_inventory_deduct') ||
      activeOrder?.history.includes('p2_in_packaging') ||
      activeOrder?.history.includes('p3_delivery_assigned')
        ? 'Done'
        : activeOrder?.currentStage === 'p1_ingestion'
        ? 'In Progress'
        : 'Pending'
    const invAllocation: 'Done' | 'In Progress' | 'Pending' =
      activeOrder?.history.includes('p2_in_packaging') ||
      activeOrder?.history.includes('p1_production_batch') ||
      activeOrder?.history.includes('p3_delivery_assigned')
        ? 'Done'
        : activeOrder?.currentStage === 'p1_inventory_deduct'
        ? 'In Progress'
        : 'Pending'
    const invIngredients: 'Done' | 'In Progress' | 'Pending' = activeOrder?.hasStock
      ? activeOrder?.history.includes('p1_inventory_deduct') ||
        activeOrder?.history.includes('p2_in_packaging') ||
        activeOrder?.history.includes('p3_delivery_assigned')
        ? 'Done'
        : 'Pending'
      : activeOrder?.history.includes('p1_production_batch') ||
        activeOrder?.history.includes('p2_in_packaging') ||
        activeOrder?.history.includes('p3_delivery_assigned')
      ? 'Done'
      : activeOrder?.currentStage === 'p1_inventory_deduct'
      ? 'In Progress'
      : 'Pending'
    const invDoneCount = [invStock, invAllocation, invIngredients].filter((s) => s === 'Done').length

    // Card 3: Kitchen Cooking (3 tasks)
    const cookCooking: 'Done' | 'In Progress' | 'Pending' = activeOrder?.hasStock
      ? 'Done'
      : activeOrder?.history.includes('p2_in_packaging') || activeOrder?.history.includes('p3_delivery_assigned')
      ? 'Done'
      : activeOrder?.currentStage === 'p1_production_batch'
      ? 'In Progress'
      : 'Pending'
    const cookOutput: 'Done' | 'In Progress' | 'Pending' = activeOrder?.hasStock
      ? 'Done'
      : activeOrder?.history.includes('p2_in_packaging') || activeOrder?.history.includes('p3_delivery_assigned')
      ? 'Done'
      : activeOrder?.currentStage === 'p1_production_batch'
      ? 'In Progress'
      : 'Pending'
    const cookBatch: 'Done' | 'In Progress' | 'Pending' = activeOrder?.hasStock
      ? 'Done'
      : activeOrder?.history.includes('p1_production_batch') ||
        activeOrder?.history.includes('p2_in_packaging') ||
        activeOrder?.history.includes('p3_delivery_assigned')
      ? 'Done'
      : activeOrder?.currentStage === 'p1_inventory_deduct'
      ? 'In Progress'
      : 'Pending'
    const cookDoneCount = [cookCooking, cookOutput, cookBatch].filter((s) => s === 'Done').length

    // Card 4: Packaging and Assembly (4 tasks)
    const pkgQueue: 'Done' | 'In Progress' | 'Pending' =
      activeOrder?.history.includes('p2_in_packaging') || activeOrder?.history.includes('p3_delivery_assigned')
        ? 'Done'
        : activeOrder?.currentStage === 'p1_production_batch'
        ? 'In Progress'
        : 'Pending'
    const pkgMaterials: 'Done' | 'In Progress' | 'Pending' =
      activeOrder?.history.includes('p2_materials_picked') ||
      activeOrder?.history.includes('p2_dispatched') ||
      activeOrder?.history.includes('p3_delivery_assigned')
        ? 'Done'
        : activeOrder?.currentStage === 'p2_in_packaging'
        ? 'In Progress'
        : 'Pending'
    const pkgDeduction: 'Done' | 'In Progress' | 'Pending' =
      activeOrder?.history.includes('p2_materials_picked') ||
      activeOrder?.history.includes('p2_dispatched') ||
      activeOrder?.history.includes('p3_delivery_assigned')
        ? 'Done'
        : activeOrder?.currentStage === 'p2_in_packaging'
        ? 'In Progress'
        : 'Pending'
    const pkgSealing: 'Done' | 'In Progress' | 'Pending' =
      activeOrder?.history.includes('p2_dispatched') || activeOrder?.history.includes('p3_delivery_assigned')
        ? 'Done'
        : activeOrder?.currentStage === 'p2_materials_picked'
        ? 'In Progress'
        : 'Pending'
    const pkgDoneCount = [pkgQueue, pkgMaterials, pkgDeduction, pkgSealing].filter((s) => s === 'Done').length

    // Card 5: Delivery and Handover (7 tasks)
    const delDriver: 'Done' | 'In Progress' | 'Pending' = activeOrder?.history.includes('p3_delivery_assigned')
      ? 'Done'
      : activeOrder?.currentStage === 'p2_dispatched'
      ? 'In Progress'
      : 'Pending'
    const delPickup: 'Done' | 'In Progress' | 'Pending' = activeOrder?.history.includes('p3_in_transit')
      ? 'Done'
      : activeOrder?.currentStage === 'p3_delivery_assigned'
      ? 'In Progress'
      : 'Pending'
    const delTransit: 'Done' | 'In Progress' | 'Pending' = activeOrder?.history.includes('p3_delivered')
      ? 'Done'
      : activeOrder?.history.includes('p3_in_transit')
      ? 'In Progress'
      : 'Pending'
    const delArrival: 'Done' | 'In Progress' | 'Pending' = activeOrder?.history.includes('p3_delivered')
      ? 'Done'
      : activeOrder?.history.includes('p3_doorstep_handover') || activeOrder?.history.includes('p3_in_transit')
      ? 'In Progress'
      : 'Pending'
    const delVerification: 'Done' | 'In Progress' | 'Pending' =
      activeOrder?.history.includes('p3_doorstep_handover') || activeOrder?.history.includes('p3_delivered')
        ? 'Done'
        : 'Pending'
    const delPayout: 'Done' | 'In Progress' | 'Pending' = activeOrder?.history.includes('p3_settled_closed')
      ? 'Done'
      : activeOrder?.history.includes('p3_delivered')
      ? 'In Progress'
      : 'Pending'
    const delCompletion: 'Done' | 'In Progress' | 'Pending' =
      activeOrder?.currentStage === 'p3_settled_closed'
        ? 'Done'
        : activeOrder?.history.includes('p3_delivered')
        ? 'In Progress'
        : 'Pending'
    const delDoneCount = [
      delDriver,
      delPickup,
      delTransit,
      delArrival,
      delVerification,
      delPayout,
      delCompletion
    ].filter((s) => s === 'Done').length

    return {
      intake: {
        validation: intakeValidation,
        payment: intakePayment,
        channel: intakeChannel,
        doneCount: intakeDoneCount,
        totalCount: 3,
        badgeLabel: `${intakeDoneCount}/3`
      },
      inventory: {
        stock: invStock,
        allocation: invAllocation,
        ingredients: invIngredients,
        doneCount: invDoneCount,
        totalCount: 3,
        badgeLabel: `${invDoneCount}/3`
      },
      cooking: {
        cooking: cookCooking,
        output: cookOutput,
        batch: cookBatch,
        doneCount: cookDoneCount,
        totalCount: 3,
        badgeLabel: `${cookDoneCount}/3`
      },
      packaging: {
        queue: pkgQueue,
        materials: pkgMaterials,
        deduction: pkgDeduction,
        sealing: pkgSealing,
        doneCount: pkgDoneCount,
        totalCount: 4,
        badgeLabel: `${pkgDoneCount}/4`
      },
      delivery: {
        driver: delDriver,
        pickup: delPickup,
        transit: delTransit,
        arrival: delArrival,
        verification: delVerification,
        payout: delPayout,
        completion: delCompletion,
        doneCount: delDoneCount,
        totalCount: 7,
        badgeLabel: `${delDoneCount}/7`
      }
    }
  }, [activeOrder])

  const getStatusVariant = (status: 'Done' | 'In Progress' | 'Pending'): 'emerald' | 'blue' | 'zinc' => {
    switch (status) {
      case 'Done':
        return 'emerald'
      case 'In Progress':
        return 'blue'
      case 'Pending':
        return 'zinc'
    }
  }

  const getCountVariant = (done: number, total: number): 'emerald' | 'blue' | 'zinc' => {
    if (done === total) return 'emerald'
    if (done > 0) return 'blue'
    return 'zinc'
  }

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

    // Outer right edge for Column 1 cards, aligned with header vertical center
    const node1A: AnchorPoint = {
      x: node1ACardRef.current ? node1ACardRef.current.getBoundingClientRect().right - cRect.left : getRightMiddle(node1AHeaderRef.current).x,
      y: node1AHeaderRef.current ? node1AHeaderRef.current.getBoundingClientRect().top + node1AHeaderRef.current.getBoundingClientRect().height / 2 - cRect.top : 0
    }
    const node1B: AnchorPoint = {
      x: node1BCardRef.current ? node1BCardRef.current.getBoundingClientRect().right - cRect.left : getRightMiddle(node1BHeaderRef.current).x,
      y: node1BHeaderRef.current ? node1BHeaderRef.current.getBoundingClientRect().top + node1BHeaderRef.current.getBoundingClientRect().height / 2 - cRect.top : 0
    }
    const node1C: AnchorPoint = {
      x: node1CCardRef.current ? node1CCardRef.current.getBoundingClientRect().right - cRect.left : getRightMiddle(node1CHeaderRef.current).x,
      y: node1CHeaderRef.current ? node1CHeaderRef.current.getBoundingClientRect().top + node1CHeaderRef.current.getBoundingClientRect().height / 2 - cRect.top : 0
    }

    // Outer left and right edges for Pillar 2 (Packaging) container, aligned with header vertical center
    const centerLeft: AnchorPoint = {
      x: centerCardRef.current ? centerCardRef.current.getBoundingClientRect().left - cRect.left : getLeftMiddle(centerHeaderRef.current).x,
      y: centerHeaderRef.current ? centerHeaderRef.current.getBoundingClientRect().top + centerHeaderRef.current.getBoundingClientRect().height / 2 - cRect.top : 0
    }
    const centerRight: AnchorPoint = {
      x: centerCardRef.current ? centerCardRef.current.getBoundingClientRect().right - cRect.left : getRightMiddle(centerHeaderRef.current).x,
      y: centerHeaderRef.current ? centerHeaderRef.current.getBoundingClientRect().top + centerHeaderRef.current.getBoundingClientRect().height / 2 - cRect.top : 0
    }

    // Outer left edge for Pillar 3 (Delivery) container, aligned with header vertical center
    const bindingsLeft: AnchorPoint = {
      x: bindingsCardRef.current ? bindingsCardRef.current.getBoundingClientRect().left - cRect.left : getLeftMiddle(bindingsHeaderRef.current).x,
      y: bindingsHeaderRef.current ? bindingsHeaderRef.current.getBoundingClientRect().top + bindingsHeaderRef.current.getBoundingClientRect().height / 2 - cRect.top : 0
    }

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

  // SVG paths calculation with smooth rounded corners and container-touching arrowheads
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
    const trunkGap = Math.max(24, cL.x - maxTriggerX)
    const trunkX = Math.round(maxTriggerX + trunkGap * 0.45)
    const radius = 12

    // Target Y is the vertical center of Pillar 2 header
    const targetY = cL.y

    // Path 1A: From Node 1A across the top to trunkX + radius
    const path1A = `M ${a.x} ${targetY} H ${trunkX + radius}`

    // Branch from Node 1A turning DOWN into trunk (smooth curve of radius 12 on left side of trunk)
    const path1ADown = `M ${a.x} ${targetY} H ${trunkX - radius} Q ${trunkX} ${targetY} ${trunkX} ${targetY + radius} V ${b.y}`

    // Path 1B: From Node 1B (middle) merging into trunk with smooth curve
    const path1B = `M ${b.x} ${b.y} H ${trunkX - radius} Q ${trunkX} ${b.y} ${trunkX} ${b.y - radius} V ${targetY + radius}`

    // Path 1C: From Node 1C (bottom) merging UP into trunk with smooth curve
    const path1C = `M ${c.x} ${c.y} H ${trunkX - radius} Q ${trunkX} ${c.y} ${trunkX} ${c.y - radius} V ${b.y}`

    // Trunk into Pillar 2:
    // Curves smoothly from vertical trunk turning RIGHT into horizontal line entering Pillar 2 container
    // Tip of arrowhead will touch exactly at cL.x (Pillar 2 outer border)
    const trunkToPillar2 = `M ${trunkX} ${targetY + radius} Q ${trunkX} ${targetY} ${trunkX + radius} ${targetY} H ${cL.x}`

    // Stem from Pillar 2 to Pillar 3 (Logistics and Handover)
    // Runs from right border of Pillar 2 to left border of Pillar 3 (touching at bL.x)
    const pillar2ToPillar3 = `M ${cR.x} ${cR.y} H ${bL.x}`

    return {
      path1A,
      path1ADown,
      path1B,
      path1C,
      trunkToPillar2,
      pillar2ToPillar3
    }
  }, [coords])

  return (
    <div className="space-y-3 font-sans transition-all">
      {/* =========================================================================
          MAIN WORKFLOW CONTAINER
         ========================================================================= */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 sm:p-8 relative shadow-2xs transition-all overflow-hidden">
        {/* ACTIVE ORDER SEARCH (DESIGN SYSTEM STANDARD) */}
        <div className="flex items-center pb-5 mb-6 border-b border-[#e4e4e7]">
          {/* Left: Design System Search Field to Search Orders by ID */}
          <div className="flex items-center gap-3 flex-1 min-w-[260px] max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-kumo-subtle pointer-events-none" />
              <input
                type="text"
                placeholder="Search order ID (e.g. 9853, SHD-07662)..."
                value={orderSearchInput}
                onChange={(e) => handleOrderSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-kumo-line bg-kumo-canvas text-xs text-kumo-strong placeholder:text-kumo-subtle focus:outline-none focus:ring-1 focus:ring-kumo-link transition-all"
              />
            </div>
            {orderSearchInput && (
              <button
                type="button"
                onClick={() => setOrderSearchInput('')}
                className="text-[11px] text-kumo-subtle hover:text-kumo-strong cursor-pointer"
              >
                Clear
              </button>
            )}
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
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <marker
                      id="cf-arrow-default"
                      viewBox="0 0 10 10"
                      refX="10"
                      refY="5"
                      markerWidth="8"
                      markerHeight="8"
                      orient="auto"
                      markerUnits="userSpaceOnUse"
                    >
                      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#9ca3af" />
                    </marker>
                    <marker
                      id="cf-arrow-red"
                      viewBox="0 0 10 10"
                      refX="10"
                      refY="5"
                      markerWidth="8"
                      markerHeight="8"
                      orient="auto"
                      markerUnits="userSpaceOnUse"
                    >
                      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#dc2626" />
                    </marker>
                  </defs>

                  {svgPaths && (
                    <>
                      {/* Path 1A: From Ingestion horizontal across to trunk */}
                      <path
                        d={svgPaths.path1A}
                        fill="none"
                        stroke={activeOrder?.history.includes('p1_ingestion') ? '#dc2626' : '#9ca3af'}
                        strokeWidth={1.75}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Branch from Node 1A turning down into trunk (smooth rounded curve) */}
                      <path
                        d={svgPaths.path1ADown}
                        fill="none"
                        stroke={activeOrder?.history.includes('p1_ingestion') ? '#dc2626' : '#9ca3af'}
                        strokeWidth={1.75}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Path 1B: From Stock/BOM into trunk */}
                      <path
                        d={svgPaths.path1B}
                        fill="none"
                        stroke={activeOrder?.history.includes('p1_inventory_deduct') ? '#dc2626' : '#9ca3af'}
                        strokeWidth={1.75}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Path 1C: From Production Batches up to trunk */}
                      <path
                        d={svgPaths.path1C}
                        fill="none"
                        stroke={activeOrder?.history.includes('p1_production_batch') ? '#dc2626' : '#9ca3af'}
                        strokeWidth={1.75}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Arrow from Column 1 into Column 2 container (touching container border) */}
                      <path
                        d={svgPaths.trunkToPillar2}
                        fill="none"
                        stroke={activeOrder?.history.includes('p2_in_packaging') ? '#dc2626' : '#9ca3af'}
                        strokeWidth={1.75}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        markerEnd={activeOrder?.history.includes('p2_in_packaging') ? 'url(#cf-arrow-red)' : 'url(#cf-arrow-default)'}
                      />
                      {/* Arrow from Column 2 into Column 3 container (touching container border) */}
                      <path
                        d={svgPaths.pillar2ToPillar3}
                        fill="none"
                        stroke={activeOrder?.history.includes('p3_delivery_assigned') || activeOrder?.history.includes('p3_in_transit') || activeOrder?.history.includes('p3_delivered') || activeOrder?.history.includes('p3_settled_closed') ? '#dc2626' : '#9ca3af'}
                        strokeWidth={1.75}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        markerEnd={activeOrder?.history.includes('p3_delivery_assigned') || activeOrder?.history.includes('p3_in_transit') || activeOrder?.history.includes('p3_delivered') || activeOrder?.history.includes('p3_settled_closed') ? 'url(#cf-arrow-red)' : 'url(#cf-arrow-default)'}
                      />
                    </>
                  )}
                </svg>

                {/* THREE COLUMNS (MATCHING CLOUDFLARE 3-NODE ARCHITECTURE) */}
                <div className="flex flex-row items-start justify-between gap-8 sm:gap-10 relative z-10 overflow-x-auto pb-4">
                  {/* =====================================================================
                      COLUMN 1: ORDER INTAKE, INVENTORY & KITCHEN
                     ===================================================================== */}
                  <div className="w-[260px] sm:w-[290px] shrink-0 space-y-3.5">
                    {/* Node 1A: Order Intake */}
                    <div ref={node1ACardRef} className="p-1 rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs hover:border-[#a1a1aa]">
                      <div
                        ref={node1AHeaderRef}
                        onClick={() => toggleNodeExpansion('node1A')}
                        className="rounded-[12px] border border-[#d4d4d8] bg-white px-3.5 py-2.5 flex items-center justify-between cursor-pointer select-none hover:bg-[#fafafa] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-[#18181b]">Order Intake</span>
                          <CountBadge count={pipelineMetrics.intake.badgeLabel} />
                        </div>
                        {expandedNodes.node1A ? (
                          <ChevronUp className="w-4 h-4 text-[#27272a] stroke-[2]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#27272a] stroke-[2]" />
                        )}
                      </div>

                      {expandedNodes.node1A && (
                        <div className="mt-1 divide-y divide-[#e5e7eb] text-xs">
                          <div className="px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[#3f3f46] font-medium text-[13px]">Order Validation</span>
                            <StatusPill
                              label={pipelineMetrics.intake.validation}
                              variant={getStatusVariant(pipelineMetrics.intake.validation)}
                            />
                          </div>
                          <div className="px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[#3f3f46] font-medium text-[13px]">Payment Check</span>
                            <StatusPill
                              label={pipelineMetrics.intake.payment}
                              variant={getStatusVariant(pipelineMetrics.intake.payment)}
                            />
                          </div>
                          <div className="px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[#3f3f46] font-medium text-[13px]">Sales Channel</span>
                            <StatusPill
                              label={pipelineMetrics.intake.channel}
                              variant={getStatusVariant(pipelineMetrics.intake.channel)}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Node 1B: Inventory Allocation */}
                    <div ref={node1BCardRef} className="p-1 rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs hover:border-[#a1a1aa]">
                      <div
                        ref={node1BHeaderRef}
                        onClick={() => toggleNodeExpansion('node1B')}
                        className="rounded-[12px] border border-[#d4d4d8] bg-white px-3.5 py-2.5 flex items-center justify-between cursor-pointer select-none hover:bg-[#fafafa] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-[#18181b]">Inventory Allocation</span>
                          <CountBadge count={pipelineMetrics.inventory.badgeLabel} />
                        </div>
                        {expandedNodes.node1B ? (
                          <ChevronUp className="w-4 h-4 text-[#27272a] stroke-[2]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#27272a] stroke-[2]" />
                        )}
                      </div>

                      {expandedNodes.node1B && (
                        <div className="mt-1 divide-y divide-[#e5e7eb] text-xs">
                          <div className="px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[#3f3f46] font-medium text-[13px]">Stock Check</span>
                            <StatusPill
                              label={pipelineMetrics.inventory.stock}
                              variant={getStatusVariant(pipelineMetrics.inventory.stock)}
                            />
                          </div>
                          <div className="px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[#3f3f46] font-medium text-[13px]">Item Reserve</span>
                            <StatusPill
                              label={pipelineMetrics.inventory.allocation}
                              variant={getStatusVariant(pipelineMetrics.inventory.allocation)}
                            />
                          </div>
                          <div className="px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[#3f3f46] font-medium text-[13px]">Recipe Ingredients</span>
                            <StatusPill
                              label={pipelineMetrics.inventory.ingredients}
                              variant={getStatusVariant(pipelineMetrics.inventory.ingredients)}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Node 1C: Kitchen Cooking */}
                    <div ref={node1CCardRef} className="p-1 rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs hover:border-[#a1a1aa]">
                      <div
                        ref={node1CHeaderRef}
                        onClick={() => toggleNodeExpansion('node1C')}
                        className="rounded-[12px] border border-[#d4d4d8] bg-white px-3.5 py-2.5 flex items-center justify-between cursor-pointer select-none hover:bg-[#fafafa] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-[#18181b]">Kitchen Cooking</span>
                          <CountBadge count={pipelineMetrics.cooking.badgeLabel} />
                        </div>
                        {expandedNodes.node1C ? (
                          <ChevronUp className="w-4 h-4 text-[#27272a] stroke-[2]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#27272a] stroke-[2]" />
                        )}
                      </div>

                      {expandedNodes.node1C && (
                        <div className="mt-1 divide-y divide-[#e5e7eb] text-xs">
                          <div className="px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[#3f3f46] font-medium text-[13px]">Batch Cooking</span>
                            <StatusPill
                              label={pipelineMetrics.cooking.cooking}
                              variant={getStatusVariant(pipelineMetrics.cooking.cooking)}
                            />
                          </div>
                          <div className="px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[#3f3f46] font-medium text-[13px]">Kitchen Output</span>
                            <StatusPill
                              label={pipelineMetrics.cooking.output}
                              variant={getStatusVariant(pipelineMetrics.cooking.output)}
                            />
                          </div>
                          <div className="px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[#3f3f46] font-medium text-[13px]">Portion Control</span>
                            <StatusPill
                              label={pipelineMetrics.cooking.batch}
                              variant={getStatusVariant(pipelineMetrics.cooking.batch)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* =====================================================================
                      COLUMN 2: PACKAGING AND ASSEMBLY (CENTER ENGINE)
                     ===================================================================== */}
                  <div className="w-[280px] sm:w-[310px] shrink-0 space-y-3.5">
                    <div ref={centerCardRef} className="p-1 rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs hover:border-[#a1a1aa]">
                      <div
                        ref={centerHeaderRef}
                        onClick={() => toggleNodeExpansion('pillar2')}
                        className="rounded-[12px] border border-[#d4d4d8] bg-white px-3.5 py-2.5 flex items-center justify-between cursor-pointer select-none hover:bg-[#fafafa] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-[#18181b]">Packaging and Assembly</span>
                          <CountBadge count={pipelineMetrics.packaging.badgeLabel} />
                        </div>
                        {expandedNodes.pillar2 ? (
                          <ChevronUp className="w-4 h-4 text-[#27272a] stroke-[2]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#27272a] stroke-[2]" />
                        )}
                      </div>

                      {expandedNodes.pillar2 && (
                        <div className="mt-1 divide-y divide-[#e5e7eb] text-xs">
                          <div className="px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[#3f3f46] font-medium text-[13px]">Packing Queue</span>
                            <StatusPill
                              label={pipelineMetrics.packaging.queue}
                              variant={getStatusVariant(pipelineMetrics.packaging.queue)}
                            />
                          </div>
                          <div className="px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[#3f3f46] font-medium text-[13px]">Packaging Items</span>
                            <StatusPill
                              label={pipelineMetrics.packaging.materials}
                              variant={getStatusVariant(pipelineMetrics.packaging.materials)}
                            />
                          </div>
                          <div className="px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[#3f3f46] font-medium text-[13px]">Package Deduction</span>
                            <StatusPill
                              label={pipelineMetrics.packaging.deduction}
                              variant={getStatusVariant(pipelineMetrics.packaging.deduction)}
                            />
                          </div>
                          <div className="px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[#3f3f46] font-medium text-[13px]">Bag Sealing</span>
                            <StatusPill
                              label={pipelineMetrics.packaging.sealing}
                              variant={getStatusVariant(pipelineMetrics.packaging.sealing)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* =====================================================================
                      COLUMN 3: DELIVERY AND CUSTOMER HANDOVER
                     ===================================================================== */}
                  <div className="w-[290px] sm:w-[330px] shrink-0 space-y-3.5">
                    <div ref={bindingsCardRef} className="p-1 rounded-[16px] border border-[#d4d4d8] bg-white transition-all shadow-2xs hover:border-[#a1a1aa]">
                      <div
                        ref={bindingsHeaderRef}
                        onClick={() => toggleNodeExpansion('pillar3')}
                        className="rounded-[12px] border border-[#d4d4d8] bg-white px-3.5 py-2.5 flex items-center justify-between cursor-pointer select-none hover:bg-[#fafafa] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-[#18181b]">Delivery and Handover</span>
                          <CountBadge count={pipelineMetrics.delivery.badgeLabel} />
                        </div>
                        {expandedNodes.pillar3 ? (
                          <ChevronUp className="w-4 h-4 text-[#27272a] stroke-[2]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#27272a] stroke-[2]" />
                        )}
                      </div>

                      {expandedNodes.pillar3 && (
                        <div className="mt-1 divide-y divide-[#e5e7eb] text-xs">
                          <div className="px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[#3f3f46] font-medium text-[13px]">Driver Assign</span>
                            <StatusPill
                              label={pipelineMetrics.delivery.driver}
                              variant={getStatusVariant(pipelineMetrics.delivery.driver)}
                            />
                          </div>
                          <div className="px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[#3f3f46] font-medium text-[13px]">Kitchen Pickup</span>
                            <StatusPill
                              label={pipelineMetrics.delivery.pickup}
                              variant={getStatusVariant(pipelineMetrics.delivery.pickup)}
                            />
                          </div>
                          <div className="px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[#3f3f46] font-medium text-[13px]">Transit Route</span>
                            <StatusPill
                              label={pipelineMetrics.delivery.transit}
                              variant={getStatusVariant(pipelineMetrics.delivery.transit)}
                            />
                          </div>
                          <div className="px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[#3f3f46] font-medium text-[13px]">Customer Arrival</span>
                            <StatusPill
                              label={pipelineMetrics.delivery.arrival}
                              variant={getStatusVariant(pipelineMetrics.delivery.arrival)}
                            />
                          </div>
                          <div className="px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[#3f3f46] font-medium text-[13px]">Delivery Confirm</span>
                            <StatusPill
                              label={pipelineMetrics.delivery.verification}
                              variant={getStatusVariant(pipelineMetrics.delivery.verification)}
                            />
                          </div>
                          <div className="px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[#3f3f46] font-medium text-[13px]">Driver Payment</span>
                            <StatusPill
                              label={pipelineMetrics.delivery.payout}
                              variant={getStatusVariant(pipelineMetrics.delivery.payout)}
                            />
                          </div>
                          <div className="px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[#3f3f46] font-medium text-[13px]">Order Complete</span>
                            <StatusPill
                              label={pipelineMetrics.delivery.completion}
                              variant={getStatusVariant(pipelineMetrics.delivery.completion)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* =====================================================================
                  MODE B: FLOW TREE VIEW (MATCHING USER DIAGRAM SPECIFICATION)
                 ===================================================================== */
              <div className="max-w-4xl mx-auto space-y-6 py-2">
                {/* 1. ORDER INTAKE */}
                <div className="p-1 rounded-[16px] border border-[#d4d4d8] bg-white shadow-2xs hover:border-[#a1a1aa] transition-all">
                  <div
                    onClick={() => toggleNodeExpansion('tree1')}
                    className="rounded-[12px] border border-[#d4d4d8] bg-white px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-[#fafafa] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-[#18181b]">Order Intake</span>
                      <CountBadge count={pipelineMetrics.intake.badgeLabel} />
                    </div>
                    {expandedNodes.tree1 !== false ? (
                      <ChevronUp className="w-4 h-4 text-[#27272a] stroke-[2]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#27272a] stroke-[2]" />
                    )}
                  </div>

                  {expandedNodes.tree1 !== false && (
                    <div className="mt-1 divide-y divide-[#e5e7eb] text-xs">
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[#3f3f46] font-medium text-[13px]">Order Validation</span>
                        <StatusPill
                          label={pipelineMetrics.intake.validation}
                          variant={getStatusVariant(pipelineMetrics.intake.validation)}
                        />
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[#3f3f46] font-medium text-[13px]">Payment Check</span>
                        <StatusPill
                          label={pipelineMetrics.intake.payment}
                          variant={getStatusVariant(pipelineMetrics.intake.payment)}
                        />
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[#3f3f46] font-medium text-[13px]">Sales Channel</span>
                        <StatusPill
                          label={pipelineMetrics.intake.channel}
                          variant={getStatusVariant(pipelineMetrics.intake.channel)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* STEM 1 TO 2 */}
                <div className="flex flex-col items-center justify-center -my-3">
                  <div className="w-[1.5px] h-6 bg-[#94a3b8]" />
                  <div className="w-2 h-2 rotate-45 border-r-[1.5px] border-b-[1.5px] border-[#94a3b8] -mt-1" />
                </div>

                {/* 2. INVENTORY ALLOCATION */}
                <div className="p-1 rounded-[16px] border border-[#d4d4d8] bg-white shadow-2xs hover:border-[#a1a1aa] transition-all">
                  <div
                    onClick={() => toggleNodeExpansion('tree2')}
                    className="rounded-[12px] border border-[#d4d4d8] bg-white px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-[#fafafa] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-[#18181b]">Inventory Allocation</span>
                      <CountBadge count={pipelineMetrics.inventory.badgeLabel} />
                    </div>
                    {expandedNodes.tree2 !== false ? (
                      <ChevronUp className="w-4 h-4 text-[#27272a] stroke-[2]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#27272a] stroke-[2]" />
                    )}
                  </div>

                  {expandedNodes.tree2 !== false && (
                    <div className="mt-1 divide-y divide-[#e5e7eb] text-xs">
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[#3f3f46] font-medium text-[13px]">Stock Check</span>
                        <StatusPill
                          label={pipelineMetrics.inventory.stock}
                          variant={getStatusVariant(pipelineMetrics.inventory.stock)}
                        />
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[#3f3f46] font-medium text-[13px]">Item Reserve</span>
                        <StatusPill
                          label={pipelineMetrics.inventory.allocation}
                          variant={getStatusVariant(pipelineMetrics.inventory.allocation)}
                        />
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[#3f3f46] font-medium text-[13px]">Recipe Ingredients</span>
                        <StatusPill
                          label={pipelineMetrics.inventory.ingredients}
                          variant={getStatusVariant(pipelineMetrics.inventory.ingredients)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* STEM 2 TO 3 */}
                <div className="flex flex-col items-center justify-center -my-3">
                  <div className="w-[1.5px] h-6 bg-[#94a3b8]" />
                  <div className="w-2 h-2 rotate-45 border-r-[1.5px] border-b-[1.5px] border-[#94a3b8] -mt-1" />
                </div>

                {/* 3. KITCHEN COOKING */}
                <div className="p-1 rounded-[16px] border border-[#d4d4d8] bg-white shadow-2xs hover:border-[#a1a1aa] transition-all">
                  <div
                    onClick={() => toggleNodeExpansion('tree3')}
                    className="rounded-[12px] border border-[#d4d4d8] bg-white px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-[#fafafa] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-[#18181b]">Kitchen Cooking</span>
                      <CountBadge count={pipelineMetrics.cooking.badgeLabel} />
                    </div>
                    {expandedNodes.tree3 !== false ? (
                      <ChevronUp className="w-4 h-4 text-[#27272a] stroke-[2]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#27272a] stroke-[2]" />
                    )}
                  </div>

                  {expandedNodes.tree3 !== false && (
                    <div className="mt-1 divide-y divide-[#e5e7eb] text-xs">
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[#3f3f46] font-medium text-[13px]">Batch Cooking</span>
                        <StatusPill
                          label={pipelineMetrics.cooking.cooking}
                          variant={getStatusVariant(pipelineMetrics.cooking.cooking)}
                        />
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[#3f3f46] font-medium text-[13px]">Kitchen Output</span>
                        <StatusPill
                          label={pipelineMetrics.cooking.output}
                          variant={getStatusVariant(pipelineMetrics.cooking.output)}
                        />
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[#3f3f46] font-medium text-[13px]">Portion Control</span>
                        <StatusPill
                          label={pipelineMetrics.cooking.batch}
                          variant={getStatusVariant(pipelineMetrics.cooking.batch)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* STEM 3 TO 4 */}
                <div className="flex flex-col items-center justify-center -my-3">
                  <div className="w-[1.5px] h-6 bg-[#94a3b8]" />
                  <div className="w-2 h-2 rotate-45 border-r-[1.5px] border-b-[1.5px] border-[#94a3b8] -mt-1" />
                </div>

                {/* 4. PACKAGING AND ASSEMBLY */}
                <div className="p-1 rounded-[16px] border border-[#d4d4d8] bg-white shadow-2xs hover:border-[#a1a1aa] transition-all">
                  <div
                    onClick={() => toggleNodeExpansion('tree4')}
                    className="rounded-[12px] border border-[#d4d4d8] bg-white px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-[#fafafa] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-[#18181b]">Packaging and Assembly</span>
                      <CountBadge count={pipelineMetrics.packaging.badgeLabel} />
                    </div>
                    {expandedNodes.tree4 !== false ? (
                      <ChevronUp className="w-4 h-4 text-[#27272a] stroke-[2]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#27272a] stroke-[2]" />
                    )}
                  </div>

                  {expandedNodes.tree4 !== false && (
                    <div className="mt-1 divide-y divide-[#e5e7eb] text-xs">
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[#3f3f46] font-medium text-[13px]">Packing Queue</span>
                        <StatusPill
                          label={pipelineMetrics.packaging.queue}
                          variant={getStatusVariant(pipelineMetrics.packaging.queue)}
                        />
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[#3f3f46] font-medium text-[13px]">Packaging Items</span>
                        <StatusPill
                          label={pipelineMetrics.packaging.materials}
                          variant={getStatusVariant(pipelineMetrics.packaging.materials)}
                        />
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[#3f3f46] font-medium text-[13px]">Package Deduction</span>
                        <StatusPill
                          label={pipelineMetrics.packaging.deduction}
                          variant={getStatusVariant(pipelineMetrics.packaging.deduction)}
                        />
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[#3f3f46] font-medium text-[13px]">Bag Sealing</span>
                        <StatusPill
                          label={pipelineMetrics.packaging.sealing}
                          variant={getStatusVariant(pipelineMetrics.packaging.sealing)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* STEM 4 TO 5 */}
                <div className="flex flex-col items-center justify-center -my-3">
                  <div className="w-[1.5px] h-6 bg-[#94a3b8]" />
                  <div className="w-2 h-2 rotate-45 border-r-[1.5px] border-b-[1.5px] border-[#94a3b8] -mt-1" />
                </div>

                {/* 5. DELIVERY AND CUSTOMER HANDOVER */}
                <div className="p-1 rounded-[16px] border border-[#d4d4d8] bg-white shadow-2xs hover:border-[#a1a1aa] transition-all">
                  <div
                    onClick={() => toggleNodeExpansion('tree5')}
                    className="rounded-[12px] border border-[#d4d4d8] bg-white px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-[#fafafa] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-[#18181b]">Delivery and Handover</span>
                      <CountBadge count={pipelineMetrics.delivery.badgeLabel} />
                    </div>
                    {expandedNodes.tree5 !== false ? (
                      <ChevronUp className="w-4 h-4 text-[#27272a] stroke-[2]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#27272a] stroke-[2]" />
                    )}
                  </div>

                  {expandedNodes.tree5 !== false && (
                    <div className="mt-1 divide-y divide-[#e5e7eb] text-xs">
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[#3f3f46] font-medium text-[13px]">Driver Assign</span>
                        <StatusPill
                          label={pipelineMetrics.delivery.driver}
                          variant={getStatusVariant(pipelineMetrics.delivery.driver)}
                        />
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[#3f3f46] font-medium text-[13px]">Kitchen Pickup</span>
                        <StatusPill
                          label={pipelineMetrics.delivery.pickup}
                          variant={getStatusVariant(pipelineMetrics.delivery.pickup)}
                        />
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[#3f3f46] font-medium text-[13px]">Transit Route</span>
                        <StatusPill
                          label={pipelineMetrics.delivery.transit}
                          variant={getStatusVariant(pipelineMetrics.delivery.transit)}
                        />
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[#3f3f46] font-medium text-[13px]">Customer Arrival</span>
                        <StatusPill
                          label={pipelineMetrics.delivery.arrival}
                          variant={getStatusVariant(pipelineMetrics.delivery.arrival)}
                        />
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[#3f3f46] font-medium text-[13px]">Delivery Confirm</span>
                        <StatusPill
                          label={pipelineMetrics.delivery.verification}
                          variant={getStatusVariant(pipelineMetrics.delivery.verification)}
                        />
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[#3f3f46] font-medium text-[13px]">Driver Payment</span>
                        <StatusPill
                          label={pipelineMetrics.delivery.payout}
                          variant={getStatusVariant(pipelineMetrics.delivery.payout)}
                        />
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[#3f3f46] font-medium text-[13px]">Order Complete</span>
                        <StatusPill
                          label={pipelineMetrics.delivery.completion}
                          variant={getStatusVariant(pipelineMetrics.delivery.completion)}
                        />
                      </div>
                    </div>
                  )}
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
