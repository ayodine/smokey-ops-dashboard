import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Globe,
  ChevronDown,
  ChevronUp,
  Play,
  Zap,
  RefreshCw,
  Layers,
  Network,
  Search,
  ExternalLink,
  X,
  Check,
  User,
  CheckCircle2,
  Package,
  Bike,
  Sparkles,
  ShoppingBag,
  Boxes,
  Flame,
  Truck,
  Clock,
  CornerDownLeft
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
    id: 'SHD-10837',
    customerName: 'Judeets Xoxo',
    dishName: '1x Full Smokey Guineafowl (Chopped)',
    totalAmount: 19500,
    portions: 1,
    channel: 'Website Storefront',
    hasStock: true,
    currentStage: 'p2_in_packaging',
    paymentRef: 'pay_smk_10837',
    riderName: 'FRESH LOGISTICS',
    destinationAddress: 'Lekki Phase 1, Lagos',
    etaMinutes: 25,
    otpCode: '8912',
    deliveryFee: 3000,
    history: ['p1_ingestion', 'p1_inventory_deduct', 'p2_in_packaging']
  },
  {
    id: 'SHD-10836',
    customerName: 'Sylvester Ezechukwu',
    dishName: '1x KING SIZE SMOKEY GUINEAFOWL + GIZZARD',
    totalAmount: 21500,
    portions: 1,
    channel: 'Website Storefront',
    hasStock: true,
    currentStage: 'p2_in_packaging',
    paymentRef: 'pay_smk_10836',
    riderName: 'RIDER ABU',
    destinationAddress: 'Victoria Island, Lagos',
    etaMinutes: 22,
    otpCode: '4821',
    deliveryFee: 3500,
    history: ['p1_ingestion', 'p1_inventory_deduct', 'p2_in_packaging']
  },
  {
    id: 'SHD-10835',
    customerName: 'Montana Tony',
    dishName: '3x Undiluted Palmwine (50cl Bottle) + 1x Full Smokey Guineafowl',
    totalAmount: 25500,
    portions: 4,
    channel: 'Website Storefront',
    hasStock: true,
    currentStage: 'p2_materials_picked',
    paymentRef: 'pay_smk_10835',
    riderName: 'John Doe',
    destinationAddress: 'Ikeja GRA, Lagos',
    etaMinutes: 30,
    otpCode: '3189',
    deliveryFee: 3000,
    history: ['p1_ingestion', 'p1_inventory_deduct', 'p2_in_packaging', 'p2_materials_picked']
  },
  {
    id: 'SHD-10719',
    customerName: 'Shamz Os',
    dishName: '1x Full Smokey Guineafowl (Chopped) + 1x 1 Liter Bowl Guineafowl Rice',
    totalAmount: 26500,
    portions: 2,
    channel: 'Website Storefront',
    hasStock: true,
    currentStage: 'p3_in_transit',
    paymentRef: 'pay_smk_10719',
    riderName: 'FRESH LOGISTICS',
    destinationAddress: 'Victoria Crest Estate, Pinnock Beach, Lekki',
    etaMinutes: 14,
    otpCode: '5521',
    deliveryFee: 3500,
    history: [
      'p1_ingestion',
      'p1_inventory_deduct',
      'p2_in_packaging',
      'p2_materials_picked',
      'p2_dispatched',
      'p3_delivery_assigned',
      'p3_in_transit'
    ]
  },
  {
    id: 'SHD-10717',
    customerName: 'Mercy Moses',
    dishName: '1x KING SIZE SMOKEY GUINEAFOWL + GIZZARD + 2x Chilled Spiced Zobo Drink (50cl)',
    totalAmount: 24500,
    portions: 3,
    channel: 'Website Storefront',
    hasStock: true,
    currentStage: 'p3_delivery_assigned',
    paymentRef: 'pay_smk_10717',
    riderName: 'RIDER ABU',
    destinationAddress: '35 Coker Road, Ilupeju, Lagos',
    etaMinutes: 35,
    otpCode: '9182',
    deliveryFee: 2500,
    history: [
      'p1_ingestion',
      'p1_inventory_deduct',
      'p2_in_packaging',
      'p2_materials_picked',
      'p2_dispatched',
      'p3_delivery_assigned'
    ]
  },
  {
    id: 'SHD-10714',
    customerName: 'Naomi Olasunkanmi',
    dishName: '1x Smoked Whole Rabbit (Marinated) + 1x Spiced Beef Kilishi (250g Pack)',
    totalAmount: 28000,
    portions: 2,
    channel: 'Direct WhatsApp',
    hasStock: true,
    currentStage: 'p3_delivered',
    paymentRef: 'pay_smk_10714',
    riderName: 'John Doe',
    destinationAddress: 'No 29 Alhaji Lambo Street, Ketu, Lagos',
    etaMinutes: 0,
    otpCode: '8834',
    deliveryFee: 3000,
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

import { StatusPill, type FigmaBadgeState, type StatusPillProps } from '@/components/ui/StatusPill'
export { StatusPill, type FigmaBadgeState, type StatusPillProps }


export const CountBadge: React.FC<{ count: string | number; className?: string }> = ({ count, className }) => (
  <span
    className={cn(
      'inline-flex items-center justify-center px-1.5 py-0.5 rounded-[6px] text-[11px] font-semibold bg-[#52525b] dark:bg-zinc-700 text-white min-w-[20px] leading-tight select-none',
      className
    )}
  >
    {count}
  </span>
)

export interface WorkflowTaskRowProps {
  title: string
  status: 'Done' | 'In Progress' | 'In Review' | 'Pending' | 'Flagged'
  isAutomatic?: boolean
  actionUrl?: string
  actionTitle?: string
}

export const WorkflowTaskRow: React.FC<WorkflowTaskRowProps> = ({
  title,
  status,
  isAutomatic = false,
  actionUrl,
  actionTitle = 'Attend to pending action'
}) => {
  const navigate = useNavigate()

  const figmaState: FigmaBadgeState =
    status === 'Done'
      ? 'completed'
      : status === 'In Progress'
      ? 'in-progress'
      : status === 'In Review'
      ? 'in-review'
      : status === 'Flagged'
      ? 'flagged'
      : 'draft'

  return (
    <div className="relative px-3.5 py-2.5 flex items-center justify-between hover:bg-zinc-50/70 dark:hover:bg-zinc-800/60 transition-colors group select-none">
      {/* Tiny Process Indicator Dot at Top Right Corner of Container: Grey for Automatic, Red for Action Required */}
      <span
        title={isAutomatic ? 'Automatic Process' : 'Action Required'}
        className={cn(
          'absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full shrink-0',
          isAutomatic ? 'bg-[#9ca3af]' : 'bg-[#ef4444]'
        )}
      />

      {/* Task Title with optional small open-link icon at top-right corner of text */}
      <div className="flex items-center min-w-0 pr-2">
        <span className="text-[#374151] dark:text-zinc-200 font-normal text-[13.5px] truncate">
          {title}
        </span>
        {actionUrl && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate(actionUrl)
            }}
            title={actionTitle}
            className="inline-flex items-start text-[#9ca3af] dark:text-zinc-400 hover:text-[#0051c3] dark:hover:text-blue-400 transition-colors cursor-pointer ml-1 self-start -translate-y-1 shrink-0 p-0.5 rounded"
          >
            <ExternalLink className="w-2.5 h-2.5 stroke-[2]" />
          </button>
        )}
      </div>

      {/* Right side: Icon-only Badge alone */}
      <div className="flex items-center shrink-0">
        <StatusPill state={figmaState} short={true} />
      </div>
    </div>
  )
}

export const getStageLabel = (stage?: PipelineStage): string => {
  switch (stage) {
    case 'p1_ingestion':
      return 'Order Received & Paid'
    case 'p1_inventory_deduct':
      return 'Sales Stock Allocated'
    case 'p1_production_batch':
      return 'Production Batch Running'
    case 'p2_in_packaging':
      return 'Added to Packaging Queue'
    case 'p2_materials_picked':
      return 'In Packaging'
    case 'p2_dispatched':
      return 'Packaged for Dispatch'
    case 'p3_delivery_assigned':
      return 'Rider Assigned'
    case 'p3_in_transit':
      return 'In Transit'
    case 'p3_doorstep_handover':
    case 'p3_delivered':
      return 'Delivered'
    case 'p3_settled_closed':
      return 'Rider Payout Cleared'
    default:
      return 'Order Processing'
  }
}

/** Helper function to highlight query match inside customer name or text with desaturated neutral grey */
const highlightSearchMatch = (
  text: string,
  query: string,
  isDarkBadge = false
): React.ReactNode => {
  if (!query.trim()) return text
  const cleanQ = query.trim().toLowerCase()
  const lowerText = text.toLowerCase()
  const matchIndex = lowerText.indexOf(cleanQ)
  if (matchIndex === -1) return text

  const before = text.slice(0, matchIndex)
  const matched = text.slice(matchIndex, matchIndex + cleanQ.length)
  const after = text.slice(matchIndex + cleanQ.length)

  return (
    <span>
      {before}
      <span
        className={cn(
          'font-bold px-0.5 rounded',
          isDarkBadge
            ? 'bg-zinc-700 text-white shadow-2xs'
            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
        )}
      >
        {matched}
      </span>
      {after}
    </span>
  )
}

export const OrderWorkflowCanvasOverlay: React.FC = () => {
  const {
    showToast,
    websiteOrders,
    packagingQueue,
    logisticsDeliveries,
    scheduledOrders,
    productionBatches
  } = useSmokeyOps()

  // Full canvas collapse/expand state (matching Screenshot 2 bottom chevron)
  const [isCanvasExpanded, setIsCanvasExpanded] = useState<boolean>(true)

  // View Mode: 'canvas' (Cloudflare 3-column node canvas) vs 'tree' (Vertical 3-pillar hierarchy)
  const [viewMode, setViewMode] = useState<'canvas' | 'tree'>('canvas')

  // Auto-stream interval toggle
  const [isAutoStreamActive, setIsAutoStreamActive] = useState<boolean>(false)

  const mapRowToPipelineOrder = (row: any): PipelineOrder => {
    const orderRef = String(row.order_ref || row.id)
    const status = String(row.fulfillment_status || 'delivered').toLowerCase()

    // Cross-reference live operational queues from SmokeyOpsContext
    const matchedDelivery = logisticsDeliveries?.find((d) => String(d.order_ref) === orderRef)
    const matchedPkg = packagingQueue?.find((p) => String(p.order_ref) === orderRef)
    const matchedSched = scheduledOrders?.find((s) => String(s.order_ref) === orderRef)

    let currentStage: PipelineStage = 'p3_settled_closed'
    let history: PipelineStage[] = [
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

    if (matchedDelivery) {
      if (matchedDelivery.status === 'delivered') {
        currentStage = 'p3_settled_closed'
      } else if (matchedDelivery.status === 'in_transit' || matchedDelivery.status === 'out_for_delivery') {
        currentStage = 'p3_in_transit'
        history = [
          'p1_ingestion',
          'p1_inventory_deduct',
          'p2_in_packaging',
          'p2_materials_picked',
          'p2_dispatched',
          'p3_delivery_assigned',
          'p3_in_transit'
        ]
      } else if (matchedDelivery.status === 'assigned') {
        currentStage = 'p3_delivery_assigned'
        history = [
          'p1_ingestion',
          'p1_inventory_deduct',
          'p2_in_packaging',
          'p2_materials_picked',
          'p2_dispatched',
          'p3_delivery_assigned'
        ]
      } else {
        currentStage = 'p2_dispatched'
        history = [
          'p1_ingestion',
          'p1_inventory_deduct',
          'p2_in_packaging',
          'p2_materials_picked',
          'p2_dispatched'
        ]
      }
    } else if (matchedSched) {
      currentStage = 'p1_inventory_deduct'
      history = ['p1_ingestion', 'p1_inventory_deduct']
    } else if (matchedPkg) {
      if (matchedPkg.order_status === 'packaged') {
        currentStage = 'p2_dispatched'
        history = [
          'p1_ingestion',
          'p1_inventory_deduct',
          'p2_in_packaging',
          'p2_materials_picked',
          'p2_dispatched'
        ]
      } else if (matchedPkg.order_status === 'in_packaging') {
        currentStage = 'p2_materials_picked'
        history = ['p1_ingestion', 'p1_inventory_deduct', 'p2_in_packaging', 'p2_materials_picked']
      } else {
        currentStage = 'p2_in_packaging'
        history = ['p1_ingestion', 'p1_inventory_deduct', 'p2_in_packaging']
      }
    } else if (status === 'in_intake') {
      currentStage = 'p1_ingestion'
      history = ['p1_ingestion']
    } else if (status === 'cooking') {
      currentStage = 'p1_production_batch'
      history = ['p1_ingestion', 'p1_inventory_deduct', 'p1_production_batch']
    } else if (status === 'packaging') {
      currentStage = 'p2_in_packaging'
      history = ['p1_ingestion', 'p1_inventory_deduct', 'p2_in_packaging']
    } else if (status === 'ready_for_dispatch') {
      currentStage = 'p2_dispatched'
      history = [
        'p1_ingestion',
        'p1_inventory_deduct',
        'p2_in_packaging',
        'p2_materials_picked',
        'p2_dispatched'
      ]
    } else if (status === 'in_transit') {
      currentStage = 'p3_in_transit'
      history = [
        'p1_ingestion',
        'p1_inventory_deduct',
        'p2_in_packaging',
        'p2_materials_picked',
        'p2_dispatched',
        'p3_delivery_assigned',
        'p3_in_transit'
      ]
    }

    const ch = String(row.channel || '').toLowerCase()
    return {
      id: orderRef,
      customerName: row.customer_name || 'Customer',
      dishName: row.items_summary || 'Smokey Order Product',
      totalAmount: Number(row.total_amount ?? row.total) || 0,
      portions: 1,
      channel:
        ch.includes('whatsapp')
          ? 'Direct WhatsApp'
          : ch.includes('pos') || ch.includes('in_store') || ch.includes('walk-in')
          ? 'In Store Checkout'
          : 'Website Storefront',
      hasStock: true,
      currentStage,
      paymentRef: row.payment_reference || `pay_${orderRef.toLowerCase()}`,
      riderName: matchedDelivery?.assigned_rider || row.rider_name || 'FRESH LOGISTICS',
      destinationAddress: row.address || row.delivery_address || 'Lagos, Nigeria',
      otpCode: '5842',
      deliveryFee: Number(row.delivery_fee) || 3000,
      history
    }
  }

  // Orders in pipeline state — pre-populated from context websiteOrders to prevent mount jump
  const [orders, setOrders] = useState<PipelineOrder[]>(() => {
    if (websiteOrders && websiteOrders.length > 0) {
      const mapped = websiteOrders.map(mapRowToPipelineOrder)
      const ids = new Set(mapped.map((m) => m.id))
      const remaining = SMOKEY_OPERATIONAL_ORDERS.filter((p) => !ids.has(p.id))
      return [...mapped, ...remaining]
    }
    return SMOKEY_OPERATIONAL_ORDERS
  })
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [orderSearchInput, setOrderSearchInput] = useState<string>('')
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(0)
  const searchContainerRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  // URL Query Deep Linking (e.g. ?orderId=SHD-06247)
  const [searchParams] = useSearchParams()
  useEffect(() => {
    const paramId = searchParams.get('orderId')
    if (paramId) {
      setSelectedOrderId(paramId)
    }
  }, [searchParams])

  // Keep in sync when websiteOrders or operational queues update in context
  useEffect(() => {
    if (websiteOrders && websiteOrders.length > 0) {
      const mapped = websiteOrders.map(mapRowToPipelineOrder)
      setOrders((prev) => {
        const ids = new Set(mapped.map((m) => m.id))
        const remaining = prev.filter((p) => !ids.has(p.id))
        return [...mapped, ...remaining]
      })
    }
  }, [websiteOrders, packagingQueue, logisticsDeliveries, scheduledOrders])

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Comprehensive multi-field search index scoring & sorting
  const searchResults = useMemo(() => {
    const q = orderSearchInput.trim().toLowerCase()
    if (!q) {
      // Default: show all available orders in natural pipeline order
      return orders.map((order) => ({
        order,
        matchType: 'all' as const,
        score: 0
      }))
    }

    const matches: Array<{
      order: PipelineOrder
      matchType: 'customer' | 'id' | 'product' | 'address' | 'payment'
      score: number
    }> = []

    orders.forEach((order) => {
      const nameLower = order.customerName.toLowerCase()
      const idLower = order.id.toLowerCase()
      const idNum = order.id.replace(/[^0-9]/g, '')
      const dishLower = order.dishName.toLowerCase()
      const addrLower = order.destinationAddress.toLowerCase()
      const payLower = order.paymentRef.toLowerCase()

      let score = 0
      let matchType: 'customer' | 'id' | 'product' | 'address' | 'payment' = 'customer'

      // Exact Order ID match (Highest priority for technical index searches)
      if (idLower === q || idNum === q) {
        score += 120
        matchType = 'id'
      } else if (idLower.startsWith(q) || idNum.startsWith(q)) {
        score += 105
        matchType = 'id'
      } else if (idLower.includes(q) || idNum.includes(q)) {
        score += 90
        matchType = 'id'
      }
      // Customer name match
      else if (nameLower === q) {
        score += 100
        matchType = 'customer'
      } else if (nameLower.startsWith(q)) {
        score += 85
        matchType = 'customer'
      } else if (nameLower.split(' ').some((word) => word.startsWith(q))) {
        score += 75
        matchType = 'customer'
      } else if (nameLower.includes(q)) {
        score += 60
        matchType = 'customer'
      }
      // Product name match
      else if (dishLower.includes(q)) {
        score += 45
        matchType = 'product'
      }
      // Address match
      else if (addrLower.includes(q)) {
        score += 35
        matchType = 'address'
      }
      // Payment ref match
      else if (payLower.includes(q)) {
        score += 25
        matchType = 'payment'
      }

      if (score > 0) {
        matches.push({ order, matchType, score })
      }
    })

    return matches.sort((a, b) => b.score - a.score)
  }, [orders, orderSearchInput])

  // Count matches by customer name to flag multiple orders for the same person
  const customerOrderCounts = useMemo(() => {
    const map = new Map<string, number>()
    orders.forEach((o) => {
      map.set(o.customerName, (map.get(o.customerName) || 0) + 1)
    })
    return map
  }, [orders])

  // Top autocomplete candidate for ghost inline text and Tab/Enter completion
  const topSuggestion = useMemo(() => {
    const q = orderSearchInput.trim().toLowerCase()
    if (!q || searchResults.length === 0) return null

    const top = searchResults[0].order
    const nameLower = top.customerName.toLowerCase()
    const idLower = top.id.toLowerCase()
    const idNum = top.id.replace(/[^0-9]/g, '')

    // Check ID match first for numeric or SHD queries
    if (idLower.startsWith(q)) {
      const completion = top.id.slice(orderSearchInput.trim().length)
      if (completion.length > 0) {
        return {
          order: top,
          completionText: completion,
          fullText: top.id,
          type: 'id' as const
        }
      }
    } else if (idNum.startsWith(q)) {
      const completion = idNum.slice(orderSearchInput.trim().length)
      if (completion.length > 0) {
        return {
          order: top,
          completionText: completion,
          fullText: top.id,
          type: 'id' as const
        }
      }
    }

    if (nameLower.startsWith(q)) {
      const completion = top.customerName.slice(orderSearchInput.trim().length)
      if (completion.length > 0) {
        return {
          order: top,
          completionText: completion,
          fullText: top.customerName,
          type: 'name' as const
        }
      }
    }

    return null
  }, [orderSearchInput, searchResults])

  // Select order handler
  const handleSelectOrder = (order: PipelineOrder) => {
    setSelectedOrderId(order.id)
    setOrderSearchInput(order.customerName)
    setIsSearchOpen(false)
    showToast(`Tracking order ${order.id} for ${order.customerName}`, 'info')
  }

  // Clear search handler
  const handleClearSearch = () => {
    setOrderSearchInput('')
    setSelectedOrderId(null)
    setActiveSuggestionIndex(0)
    searchInputRef.current?.focus()
  }

  // Keyboard navigation for search dropdown & autocomplete
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsSearchOpen(true)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestionIndex((prev) =>
        searchResults.length > 0 ? (prev + 1) % searchResults.length : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestionIndex((prev) =>
        searchResults.length > 0 ? (prev - 1 + searchResults.length) % searchResults.length : 0
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (searchResults.length > 0 && searchResults[activeSuggestionIndex]) {
        handleSelectOrder(searchResults[activeSuggestionIndex].order)
      } else if (topSuggestion) {
        handleSelectOrder(topSuggestion.order)
      }
    } else if (
      e.key === 'Tab' ||
      (e.key === 'ArrowRight' && searchInputRef.current?.selectionStart === orderSearchInput.length)
    ) {
      if (topSuggestion) {
        e.preventDefault()
        setOrderSearchInput(topSuggestion.fullText)
        handleSelectOrder(topSuggestion.order)
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false)
      searchInputRef.current?.blur()
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

  // Active Order - only present when user has explicitly selected/queried an order
  const activeOrder = useMemo(() => {
    if (!selectedOrderId) return null
    return orders.find((o) => o.id === selectedOrderId) || null
  }, [orders, selectedOrderId])

  // Sub-group status and count metrics for all main categories
  const pipelineMetrics = useMemo(() => {
    const isFulfilled =
      activeOrder?.currentStage === 'p3_delivered' ||
      activeOrder?.currentStage === 'p3_settled_closed' ||
      activeOrder?.history.includes('p3_delivered') ||
      activeOrder?.history.includes('p3_settled_closed')

    // If order has been delivered and fulfilled, mark all pipeline nodes as completed
    if (isFulfilled) {
      return {
        isFulfilled: true,
        intake: {
          validation: 'Done' as const,
          payment: 'Done' as const,
          channel: 'Done' as const,
          doneCount: 3,
          totalCount: 3,
          badgeLabel: '3/3'
        },
        inventory: {
          stock: 'Done' as const,
          allocation: 'Done' as const,
          ingredients: 'Done' as const,
          doneCount: 3,
          totalCount: 3,
          badgeLabel: '3/3'
        },
        cooking: {
          schedule: 'Done' as const,
          cooking: 'Done' as const,
          output: 'Done' as const,
          doneCount: 3,
          totalCount: 3,
          badgeLabel: '3/3'
        },
        packaging: {
          queue: 'Done' as const,
          materials: 'Done' as const,
          deduction: 'Done' as const,
          sealing: 'Done' as const,
          doneCount: 3,
          totalCount: 3,
          badgeLabel: '3/3'
        },
        delivery: {
          driver: 'Done' as const,
          pickup: 'Done' as const,
          delivered: 'Done' as const,
          payout: 'Done' as const,
          doneCount: 4,
          totalCount: 4,
          badgeLabel: '4/4'
        }
      }
    }

    // Card 1: Order Intake (3 tasks)
    const intakeValidation: 'Done' | 'In Progress' | 'Pending' = activeOrder?.history.includes('p1_ingestion')
      ? 'Done'
      : 'Pending'
    const intakePayment: 'Done' | 'In Progress' | 'Pending' = activeOrder?.paymentRef ? 'Done' : 'Pending'
    const intakeChannel: 'Done' | 'In Progress' | 'Pending' = activeOrder?.channel ? 'Done' : 'Pending'
    const intakeDoneCount = [intakeValidation, intakePayment, intakeChannel].filter((s) => s === 'Done').length

    // Card 2: Sales Stock (3 tasks)
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

    // Card 3: Production Batches (3 tasks: Create Batch, Start Smoking Batch, Complete Batch & Add to Stock)
    const cookSchedule: 'Done' | 'In Progress' | 'Pending' = activeOrder?.hasStock
      ? 'Done'
      : activeOrder?.history.includes('p1_production_batch') ||
        activeOrder?.history.includes('p2_in_packaging') ||
        activeOrder?.history.includes('p3_delivery_assigned')
      ? 'Done'
      : 'Pending'
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
    const cookDoneCount = [cookSchedule, cookCooking, cookOutput].filter((s) => s === 'Done').length

    // Card 4: Packaging Execution (3 tasks: Order Added to Packaging Queue, Start Packaging & Deduct Materials, Confirm Packaged for Dispatch)
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
    const pkgDoneCount = [pkgQueue, pkgDeduction, pkgSealing].filter((s) => s === 'Done').length

    // Card 5: Logistics & Delivery (4 real tasks: Assign Rider/Courier, Confirm Rider Pickup, Mark Delivered/Handover, Clear Rider Payout/Fee)
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
    const delDelivered: 'Done' | 'In Progress' | 'Pending' = activeOrder?.history.includes('p3_delivered')
      ? 'Done'
      : activeOrder?.history.includes('p3_in_transit')
      ? 'In Progress'
      : 'Pending'
    const delPayout: 'Done' | 'In Progress' | 'Pending' = activeOrder?.history.includes('p3_settled_closed')
      ? 'Done'
      : activeOrder?.history.includes('p3_delivered')
      ? 'In Progress'
      : 'Pending'
    const delDoneCount = [
      delDriver,
      delPickup,
      delDelivered,
      delPayout
    ].filter((s) => s === 'Done').length

    return {
      isFulfilled: false,
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
        schedule: cookSchedule,
        cooking: cookCooking,
        output: cookOutput,
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
        totalCount: 3,
        badgeLabel: `${pkgDoneCount}/3`
      },
      delivery: {
        driver: delDriver,
        pickup: delPickup,
        delivered: delDelivered,
        payout: delPayout,
        doneCount: delDoneCount,
        totalCount: 4,
        badgeLabel: `${delDoneCount}/4`
      }
    }
  }, [activeOrder])

  // Individual items extracted from dishName for showing each item's flow diagram
  const orderItems = useMemo(() => {
    if (!activeOrder?.dishName) return []
    const parts = activeOrder.dishName
      .split(/(?:,|\+|\band\b|&)/i)
      .map((s) => s.trim())
      .filter(Boolean)
    return parts.map((part) => {
      const match = part.match(/^(?:(\d+)\s*[xX×]\s*)|(?:[xX×]\s*(\d+)$)|(?:×\s*(\d+)$)/)
      const qty = match ? parseInt(match[1] || match[2] || match[3], 10) : 1
      const cleanName = part.replace(/^(?:\d+\s*[xX×]\s*)|(?:[xX×]\s*\d+$)|(?:×\s*\d+$)/g, '').trim()
      return {
        name: cleanName || part,
        quantity: qty || 1
      }
    })
  }, [activeOrder])

  const getStatusVariant = (status: 'Done' | 'In Progress' | 'In Review' | 'Pending'): 'emerald' | 'amber' | 'blue' | 'zinc' => {
    switch (status) {
      case 'Done':
        return 'emerald'
      case 'In Progress':
        return 'amber'
      case 'In Review':
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
        return 'p2_in_packaging'
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
      showToast(`Payout Cleared: Order ${activeOrder.id} is already completed and rider payout cleared.`, 'info')
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
      showToast(`Rider Payout Cleared: ${formatNaira(activeOrder.deliveryFee)} cleared for ${activeOrder.riderName || 'Rider'}.`, 'success')
    } else if (next === 'p3_delivered') {
      showToast(`Order Delivered: Order ${activeOrder.id} marked as delivered.`, 'success')
    } else if (next === 'p2_in_packaging') {
      showToast(`Packaging Queue: Order ${activeOrder.id} added to Packaging Execution.`, 'info')
    } else {
      showToast(`Order ${activeOrder.id} progressed to ${getStageLabel(next)}`, 'info')
    }
  }

  // Simulate Brand New Webhook Incoming Order
  const triggerNewWebhookOrder = () => {
    const randomNum = Math.floor(10838 + Math.random() * 200)
    const newId = `SHD-${randomNum}`
    const products = [
      { name: '1x Full Smokey Guineafowl (Chopped)', amount: 19500, stock: true },
      { name: '1x KING SIZE SMOKEY GUINEAFOWL + GIZZARD', amount: 21500, stock: true },
      { name: '1x 1 Liter Bowl Guineafowl Rice + 2x Undiluted Palmwine (50cl Bottle)', amount: 15500, stock: true },
      { name: '1x Smoked Whole Rabbit (Marinated) + 1x Spiced Beef Kilishi (250g Pack)', amount: 28000, stock: false }
    ]
    const chosen = products[Math.floor(Math.random() * products.length)]
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
      deliveryFee: 3500,
      history: ['p1_ingestion']
    }

    setOrders((prev) => [newOrder, ...prev])
    setSelectedOrderId(newId)
    showToast(`Order Ingested: New order ${newId} received via ${chosenChannel}`, 'success')
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
    const trunkX = Math.round(maxTriggerX + trunkGap * 0.42)
    const radius = 12

    // Target Y is the vertical center of Pillar 2 header
    const targetY = cL.y

    // Path 1A: From Node 1A across the top to the merge point with the trunk curve
    const path1A = `M ${a.x} ${targetY} H ${trunkX + radius}`

    // Path 1B: From Node 1B (middle) merging into trunk at (trunkX, b.y - radius)
    const path1B = `M ${b.x} ${b.y} H ${trunkX - radius} Q ${trunkX} ${b.y} ${trunkX} ${b.y - radius}`

    // Path 1C: From Node 1C (bottom) merging UP into trunk and continuing straight up to (trunkX, b.y - radius)
    const path1C = `M ${c.x} ${c.y} H ${trunkX - radius} Q ${trunkX} ${c.y} ${trunkX} ${c.y - radius} V ${b.y - radius}`

    // Upper Trunk: Continuous vertical trunk connecting the merge point up to the top curve
    const upperTrunk = `M ${trunkX} ${b.y - radius} V ${targetY + radius}`

    // Trunk Merge Curve: Smooth curve from vertical trunk turning RIGHT into horizontal flow
    const trunkMergeCurve = `M ${trunkX} ${targetY + radius} Q ${trunkX} ${targetY} ${trunkX + radius} ${targetY}`

    // Branch from merged joint directly into Pillar 2 container at cL.x
    // Tip of arrowhead will touch exactly at cL.x
    const trunkToPillar2 = `M ${trunkX + radius} ${targetY} H ${cL.x}`

    // Stem from Pillar 2 to Pillar 3 (Logistics and Handover)
    // Runs from right border of Pillar 2 to left border of Pillar 3 (touching at bL.x)
    const pillar2ToPillar3 = `M ${cR.x} ${cR.y} H ${bL.x}`

    return {
      trunkMergeX: trunkX + radius,
      targetY,
      path1A,
      path1B,
      path1C,
      upperTrunk,
      trunkMergeCurve,
      trunkToPillar2,
      pillar2ToPillar3
    }
  }, [coords])

  return (
    <div className="space-y-3 font-sans transition-all">
      {/* =========================================================================
          MAIN WORKFLOW CONTAINER
         ========================================================================= */}
      <div className="rounded-2xl border border-[#e5e7eb] dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 relative shadow-2xs transition-all overflow-hidden">
        {/* CONTAINER HEADING */}
        <div className={cn(
          "flex flex-col sm:flex-row sm:items-center justify-between gap-4",
          isCanvasExpanded ? "pb-5 mb-6 border-b border-[#e4e4e7] dark:border-zinc-800" : ""
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center font-bold shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[17px] font-semibold text-[#18181b] dark:text-zinc-100 tracking-tight">
                  Order Tracking Diagram
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80">
                  Live Pipeline
                </span>
              </div>
              <p className="text-xs text-[#71717a] dark:text-zinc-400 mt-0.5">
                End-to-end operational pipeline tracking from customer checkout through kitchen production to delivery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCanvasExpanded(!isCanvasExpanded)}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[#e4e4e7] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-[#18181b] dark:text-zinc-200 hover:bg-[#fafafa] dark:hover:bg-zinc-700 transition-colors"
            >
              <span>{isCanvasExpanded ? 'Collapse' : 'Expand'}</span>
              {isCanvasExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[#71717a] dark:text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-[#71717a] dark:text-zinc-400" />}
            </button>
          </div>
        </div>

        {/* WORKFLOW INTERFACE, SEARCH & STATUS LEGEND (VISIBLE WHEN EXPANDED) */}
        {isCanvasExpanded && (
          <>
            {/* ACTIVE ORDER SEARCH & FIGMA STATUS LEGEND */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 pb-4 mb-4 border-b border-[#e4e4e7] dark:border-zinc-800">
              {/* Left: Design System Search Field with Responsive Fixed Width & Autocomplete Dropdown */}
              <div
                ref={searchContainerRef}
                className="relative w-full sm:w-[260px] md:w-[280px] xl:w-[320px] shrink-0 font-sans"
              >
            <div className="relative w-full">
              {/* Search Icon */}
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-kumo-subtle pointer-events-none z-20" />

              {/* Autocomplete Ghost Preview Behind Input (Zero Layout Shift) */}
              {topSuggestion && (
                <div
                  className="absolute inset-0 pl-9 pr-14 flex items-center pointer-events-none text-xs sm:text-[13px] font-sans text-zinc-400 select-none overflow-hidden whitespace-pre z-10"
                  aria-hidden="true"
                >
                  <span className="invisible">{orderSearchInput}</span>
                  <span className="text-zinc-400/90">{topSuggestion.completionText}</span>
                  <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 font-mono">
                    Tab <CornerDownLeft className="w-2.5 h-2.5" />
                  </span>
                </div>
              )}

              {/* Main Search Input: Neutral grey focus ring */}
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search customer name or ID (e.g. Babajide, 07662)..."
                value={orderSearchInput}
                onChange={(e) => {
                  setOrderSearchInput(e.target.value)
                  setIsSearchOpen(true)
                  setActiveSuggestionIndex(0)
                }}
                onFocus={() => {
                  setIsSearchOpen(true)
                }}
                onKeyDown={handleSearchKeyDown}
                className="w-full h-10 pl-9 pr-14 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors font-sans shadow-2xs"
              />

              {/* Clear button positioned absolutely inside input (never alters input/container width) */}
              {orderSearchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 p-1 text-kumo-subtle hover:text-kumo-strong rounded-md hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Clean Dropdown (Matching Reference Image Style: Simple, Neat, No Badges) */}
            {isSearchOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsSearchOpen(false)}
                />
                <div
                  className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.14)] z-50 animate-in fade-in zoom-in-95 font-sans overflow-visible text-xs"
                  role="listbox"
                >
                  {/* Pointer Arrow Notch */}
                  <div className="absolute -top-[6px] left-6 w-3 h-3 bg-white dark:bg-zinc-900 border-t border-l border-zinc-200/90 dark:border-zinc-800 rotate-45 z-30" />

                  {/* Orders List */}
                  <div className="relative z-20 p-2 space-y-1 max-h-64 overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl">
                    {searchResults.length === 0 ? (
                      <div className="px-3 py-6 text-center text-xs text-zinc-400 dark:text-zinc-500 font-sans">
                        No orders found
                      </div>
                    ) : (
                      searchResults.map(({ order }, index) => {
                        const isSelected = order.id === selectedOrderId
                        const isKeyboardActive = index === activeSuggestionIndex

                        return (
                          <button
                            key={order.id}
                            type="button"
                            onClick={() => handleSelectOrder(order)}
                            onMouseEnter={() => setActiveSuggestionIndex(index)}
                            className={cn(
                              "w-full px-3.5 py-2.5 rounded-xl text-left text-sm transition-colors cursor-pointer flex items-center justify-between",
                              isSelected
                                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                                : isKeyboardActive
                                ? "bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 font-normal"
                                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 font-normal"
                            )}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <span className="truncate pr-2 font-sans flex items-center gap-2">
                              <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">
                                {order.id}
                              </span>
                              <span className="text-zinc-400 dark:text-zinc-500">•</span>
                              <span className="truncate text-zinc-800 dark:text-zinc-200 font-sans">
                                {order.customerName}
                              </span>
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-zinc-900 dark:text-zinc-100 stroke-[2] shrink-0" />
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right: Status States & Process Dots Legend extracted from Figma */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a] dark:text-zinc-400 mr-1 shrink-0">
                Badge states:
              </span>
              <StatusPill state="draft" label="no-action" size="sm" />
              <StatusPill state="in-progress" label="in-progress" size="sm" />
              <StatusPill state="in-review" label="in-review" size="sm" />
              <StatusPill state="completed" label="completed" size="sm" />
              <StatusPill state="flagged" label="flagged" size="sm" />
            </div>

            <div className="h-3.5 w-px bg-[#e4e4e7] dark:bg-zinc-700 shrink-0 hidden sm:block" />

            {/* Process Indicator Legend: Grey for Automatic, Red for Action Required */}
            <div className="flex items-center gap-2.5 text-xs text-[#71717a] dark:text-zinc-400 shrink-0">
              <div className="flex items-center gap-1.5" title="Automated system task">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] shrink-0" />
                <span className="text-[11px] font-medium text-[#52525b] dark:text-zinc-300">Automatic</span>
              </div>
              <div className="flex items-center gap-1.5" title="Human action required to attend to pending step">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] shrink-0" />
                <span className="text-[11px] font-medium text-[#52525b] dark:text-zinc-300">Action required</span>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVE ORDER & ITEM FLOW SUMMARY BANNER (VISIBLE ONLY WHEN AN ORDER HAS BEEN SEARCHED / SELECTED) */}
        {activeOrder && (
          <div className="mb-6 p-4 rounded-xl border border-kumo-line bg-kumo-canvas/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-sans">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-xs text-kumo-strong px-2 py-0.5 rounded-md bg-kumo-base border border-kumo-line">
                  {activeOrder.id}
                </span>
                <span className="font-semibold text-[13px] text-kumo-strong">
                  {activeOrder.customerName}
                </span>
                <span className="text-kumo-subtle">•</span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-kumo-tint text-kumo-subtle border border-kumo-line">
                  {activeOrder.channel}
                </span>
                {pipelineMetrics.isFulfilled ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Fulfilled & Delivered
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    In Progress • {getStageLabel(activeOrder.currentStage)}
                  </span>
                )}
              </div>

              {/* Individual Product Flow Badges */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-kumo-subtle font-medium mr-1 shrink-0">
                  Products Flowing:
                </span>
                {orderItems.map((item, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border border-kumo-line",
                      pipelineMetrics.isFulfilled
                        ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300"
                        : "bg-kumo-base text-kumo-strong"
                    )}
                  >
                    <Package className="w-3 h-3 opacity-60 shrink-0" />
                    <span>{item.quantity}x {item.name}</span>
                    {pipelineMetrics.isFulfilled && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 ml-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[2.5]" /> Done
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-right shrink-0 flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-2.5 md:pt-0 border-kumo-line pl-0 md:pl-4">
              <div className="font-semibold text-sm text-kumo-strong">
                {formatNaira(activeOrder.totalAmount)}
              </div>
              <div className="text-[11px] text-kumo-subtle flex items-center gap-1 mt-0.5">
                <Bike className="w-3 h-3" />
                <span>{activeOrder.riderName || 'Rider Internal Fleet'}</span>
              </div>
            </div>
          </div>
        )}
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
                    {/* Cloudflare Design System Rounded Bullet Arrowhead - Inactive / Default */}
                    <marker
                      id="cf-arrow-default"
                      viewBox="0 0 12 12"
                      refX="10.5"
                      refY="6"
                      markerWidth="9"
                      markerHeight="9"
                      orient="auto"
                      markerUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 1.5 2.0 C 1.5 0.9 2.7 0.3 3.7 0.9 L 10.5 5.0 C 11.4 5.5 11.4 6.5 10.5 7.0 L 3.7 11.1 C 2.7 11.7 1.5 11.1 1.5 10.0 Z"
                        fill="#9ca3af"
                      />
                    </marker>
                    {/* Cloudflare Design System Rounded Bullet Arrowhead - Active Red */}
                    <marker
                      id="cf-arrow-red"
                      viewBox="0 0 12 12"
                      refX="10.5"
                      refY="6"
                      markerWidth="9"
                      markerHeight="9"
                      orient="auto"
                      markerUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 1.5 2.0 C 1.5 0.9 2.7 0.3 3.7 0.9 L 10.5 5.0 C 11.4 5.5 11.4 6.5 10.5 7.0 L 3.7 11.1 C 2.7 11.7 1.5 11.1 1.5 10.0 Z"
                        fill="#dc2626"
                      />
                    </marker>

                    {/* Linear gradient for flow link branching to Pillar 2 (fades from red to gray seamlessly) */}
                    {svgPaths && coords && (
                      <linearGradient
                        id="cf-flow-gradient-p1-p2"
                        gradientUnits="userSpaceOnUse"
                        x1={svgPaths.trunkMergeX}
                        y1={svgPaths.targetY}
                        x2={coords.centerLeft.x}
                        y2={svgPaths.targetY}
                      >
                        <stop offset="0%" stopColor="#dc2626" />
                        <stop offset="100%" stopColor="#9ca3af" />
                      </linearGradient>
                    )}
                  </defs>

                  {svgPaths && (
                    <>
                      {/* Path 1A: From Ingestion horizontal across to merged trunk */}
                      <path
                        d={svgPaths.path1A}
                        fill="none"
                        stroke={pipelineMetrics.isFulfilled || activeOrder?.history.includes('p1_ingestion') ? '#dc2626' : '#9ca3af'}
                        strokeWidth={1.75}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Path 1B: From Stock/BOM into trunk */}
                      <path
                        d={svgPaths.path1B}
                        fill="none"
                        stroke={pipelineMetrics.isFulfilled || activeOrder?.history.includes('p1_inventory_deduct') ? '#dc2626' : '#9ca3af'}
                        strokeWidth={1.75}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Path 1C: From Production Batches up to trunk */}
                      <path
                        d={svgPaths.path1C}
                        fill="none"
                        stroke={pipelineMetrics.isFulfilled || activeOrder?.history.includes('p1_production_batch') ? '#dc2626' : '#9ca3af'}
                        strokeWidth={1.75}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Upper Trunk: Continuous vertical line connecting middle merge point to top curve */}
                      <path
                        d={svgPaths.upperTrunk}
                        fill="none"
                        stroke={
                          pipelineMetrics.isFulfilled ||
                          activeOrder?.history.includes('p1_inventory_deduct') ||
                          activeOrder?.history.includes('p1_production_batch')
                            ? '#dc2626'
                            : '#9ca3af'
                        }
                        strokeWidth={1.75}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Trunk Merge Curve: Smooth curve merging upward trunk right into horizontal line */}
                      <path
                        d={svgPaths.trunkMergeCurve}
                        fill="none"
                        stroke={
                          pipelineMetrics.isFulfilled ||
                          activeOrder?.history.includes('p1_inventory_deduct') ||
                          activeOrder?.history.includes('p1_production_batch')
                            ? '#dc2626'
                            : '#9ca3af'
                        }
                        strokeWidth={1.75}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Branch from merged joint into Pillar 2 container with active red directional arrow */}
                      <path
                        d={svgPaths.trunkToPillar2}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth={1.75}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        markerEnd="url(#cf-arrow-red)"
                      />
                      {/* Arrow from Column 2 into Column 3 container */}
                      <path
                        d={svgPaths.pillar2ToPillar3}
                        fill="none"
                        stroke={
                          pipelineMetrics.isFulfilled ||
                          activeOrder?.history.includes('p3_delivery_assigned') ||
                          activeOrder?.history.includes('p3_in_transit') ||
                          activeOrder?.history.includes('p3_delivered') ||
                          activeOrder?.history.includes('p3_settled_closed')
                            ? '#dc2626'
                            : '#9ca3af'
                        }
                        strokeWidth={1.75}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        markerEnd={
                          pipelineMetrics.isFulfilled ||
                          activeOrder?.history.includes('p3_delivery_assigned') ||
                          activeOrder?.history.includes('p3_in_transit') ||
                          activeOrder?.history.includes('p3_delivered') ||
                          activeOrder?.history.includes('p3_settled_closed')
                            ? 'url(#cf-arrow-red)'
                            : 'url(#cf-arrow-default)'
                        }
                      />
                    </>
                  )}
                </svg>

                {/* THREE COLUMNS (MATCHING CLOUDFLARE 3-NODE ARCHITECTURE) */}
                <div className="flex flex-row items-start justify-between gap-8 sm:gap-10 relative z-10 overflow-x-auto pb-4">
                  {/* =====================================================================
                      COLUMN 1: ORDER INTAKE, INVENTORY & PRODUCTION
                     ===================================================================== */}
                  <div className="w-[260px] sm:w-[290px] shrink-0 space-y-3.5">
                    {/* Node 1A: Order Intake */}
                    <div ref={node1ACardRef} className="p-1 rounded-[16px] border border-[#d4d4d8] dark:border-zinc-800 bg-white dark:bg-zinc-900/90 transition-all shadow-2xs hover:border-[#a1a1aa] dark:hover:border-zinc-700">
                      <div
                        ref={node1AHeaderRef}
                        onClick={() => toggleNodeExpansion('node1A')}
                        className="rounded-[12px] border border-[#d4d4d8] dark:border-zinc-800 bg-white dark:bg-zinc-800/80 px-3.5 py-2.5 flex items-center justify-between cursor-pointer select-none hover:bg-[#fafafa] dark:hover:bg-zinc-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-[#52525b] dark:text-zinc-400 stroke-[1.75] shrink-0" />
                          <span className="text-[14px] font-semibold text-[#18181b] dark:text-zinc-100">Order Intake</span>
                          <CountBadge count={pipelineMetrics.intake.badgeLabel} />
                        </div>
                        {expandedNodes.node1A ? (
                          <ChevronUp className="w-4 h-4 text-[#27272a] dark:text-zinc-400 stroke-[2]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#27272a] dark:text-zinc-400 stroke-[2]" />
                        )}
                      </div>

                      {expandedNodes.node1A && (
                        <div className="mt-1 divide-y divide-[#e5e7eb] dark:divide-zinc-800 text-xs">
                          <WorkflowTaskRow
                            title="Website Order Received"
                            status={pipelineMetrics.intake.validation}
                            isAutomatic={true}
                            actionUrl="/sales/orders"
                            actionTitle="View Website Orders"
                          />
                          <WorkflowTaskRow
                            title="Payment Confirmed"
                            status={pipelineMetrics.intake.payment}
                            isAutomatic={true}
                          />
                          <WorkflowTaskRow
                            title="Schedule or Send to Queue"
                            status={pipelineMetrics.intake.channel}
                            isAutomatic={true}
                            actionUrl="/logistics/schedule"
                            actionTitle="View Delivery Schedule"
                          />
                        </div>
                      )}
                    </div>

                    {/* Node 1B: Sales Stock */}
                    <div ref={node1BCardRef} className="p-1 rounded-[16px] border border-[#d4d4d8] dark:border-zinc-800 bg-white dark:bg-zinc-900/90 transition-all shadow-2xs hover:border-[#a1a1aa] dark:hover:border-zinc-700">
                      <div
                        ref={node1BHeaderRef}
                        onClick={() => toggleNodeExpansion('node1B')}
                        className="rounded-[12px] border border-[#d4d4d8] dark:border-zinc-800 bg-white dark:bg-zinc-800/80 px-3.5 py-2.5 flex items-center justify-between cursor-pointer select-none hover:bg-[#fafafa] dark:hover:bg-zinc-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Boxes className="w-4 h-4 text-[#52525b] dark:text-zinc-400 stroke-[1.75] shrink-0" />
                          <span className="text-[14px] font-semibold text-[#18181b] dark:text-zinc-100">Sales Stock</span>
                          <CountBadge count={pipelineMetrics.inventory.badgeLabel} />
                        </div>
                        {expandedNodes.node1B ? (
                          <ChevronUp className="w-4 h-4 text-[#27272a] dark:text-zinc-400 stroke-[2]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#27272a] dark:text-zinc-400 stroke-[2]" />
                        )}
                      </div>

                      {expandedNodes.node1B && (
                        <div className="mt-1 divide-y divide-[#e5e7eb] dark:divide-zinc-800 text-xs">
                          <WorkflowTaskRow
                            title="Check Available Sales Stock"
                            status={pipelineMetrics.inventory.stock}
                            isAutomatic={true}
                            actionUrl="/inventory/sales"
                            actionTitle="View Sales Stock"
                          />
                          <WorkflowTaskRow
                            title="Allocate Stock to Order"
                            status={pipelineMetrics.inventory.allocation}
                            isAutomatic={true}
                          />
                          <WorkflowTaskRow
                            title="Deduct Stock on Fulfillment"
                            status={pipelineMetrics.inventory.ingredients}
                            isAutomatic={true}
                          />

                          {/* Individual Product Allocation Flow */}
                          {orderItems.length > 0 && (
                            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/50 space-y-1.5">
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                                <span>Product Allocation</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                  {pipelineMetrics.isFulfilled || activeOrder?.hasStock ? 'Ready in stock' : 'Queued'}
                                </span>
                              </div>
                              {orderItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                                  <span className="truncate text-zinc-700 dark:text-zinc-300 font-medium">
                                    {item.name}
                                  </span>
                                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 ml-1.5">
                                    <span>{item.quantity}x</span>
                                    {pipelineMetrics.isFulfilled || activeOrder?.hasStock ? (
                                      <span className="inline-flex items-center gap-0.5">
                                        <Check className="w-3 h-3 stroke-[2.5]" /> Allocated
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                                        <Clock className="w-3 h-3" /> Hold
                                      </span>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Node 1C: Production Batches */}
                    <div ref={node1CCardRef} className="p-1 rounded-[16px] border border-[#d4d4d8] dark:border-zinc-800 bg-white dark:bg-zinc-900/90 transition-all shadow-2xs hover:border-[#a1a1aa] dark:hover:border-zinc-700">
                      <div
                        ref={node1CHeaderRef}
                        onClick={() => toggleNodeExpansion('node1C')}
                        className="rounded-[12px] border border-[#d4d4d8] dark:border-zinc-800 bg-white dark:bg-zinc-800/80 px-3.5 py-2.5 flex items-center justify-between cursor-pointer select-none hover:bg-[#fafafa] dark:hover:bg-zinc-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Flame className="w-4 h-4 text-[#52525b] dark:text-zinc-400 stroke-[1.75] shrink-0" />
                          <span className="text-[14px] font-semibold text-[#18181b] dark:text-zinc-100">Production Batches</span>
                          <CountBadge count={pipelineMetrics.cooking.badgeLabel} />
                        </div>
                        {expandedNodes.node1C ? (
                          <ChevronUp className="w-4 h-4 text-[#27272a] dark:text-zinc-400 stroke-[2]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#27272a] dark:text-zinc-400 stroke-[2]" />
                        )}
                      </div>

                      {expandedNodes.node1C && (
                        <div className="mt-1 divide-y divide-[#e5e7eb] dark:divide-zinc-800 text-xs">
                          <WorkflowTaskRow
                            title="Create Production Batch"
                            status={pipelineMetrics.cooking.schedule}
                            isAutomatic={false}
                            actionUrl="/production/batches"
                            actionTitle="Create Batch in Production Batches"
                          />
                          <WorkflowTaskRow
                            title="Start Smoking Batch"
                            status={pipelineMetrics.cooking.cooking}
                            isAutomatic={false}
                            actionUrl="/production/batches"
                            actionTitle="Start Smoking in Production Batches"
                          />
                          <WorkflowTaskRow
                            title="Complete Batch & Add to Stock"
                            status={pipelineMetrics.cooking.output}
                            isAutomatic={false}
                            actionUrl="/production/batches"
                            actionTitle="Complete Batch in Production Batches"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* =====================================================================
                      COLUMN 2: PACKAGING EXECUTION (CENTER ENGINE)
                     ===================================================================== */}
                  <div className="w-[280px] sm:w-[310px] shrink-0 space-y-3.5">
                    <div ref={centerCardRef} className="p-1 rounded-[16px] border border-[#d4d4d8] dark:border-zinc-800 bg-white dark:bg-zinc-900/90 transition-all shadow-2xs hover:border-[#a1a1aa] dark:hover:border-zinc-700">
                      <div
                        ref={centerHeaderRef}
                        onClick={() => toggleNodeExpansion('pillar2')}
                        className="rounded-[12px] border border-[#d4d4d8] dark:border-zinc-800 bg-white dark:bg-zinc-800/80 px-3.5 py-2.5 flex items-center justify-between cursor-pointer select-none hover:bg-[#fafafa] dark:hover:bg-zinc-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-[#52525b] dark:text-zinc-400 stroke-[1.75] shrink-0" />
                          <span className="text-[14px] font-semibold text-[#18181b] dark:text-zinc-100">Packaging Execution</span>
                          <CountBadge count={pipelineMetrics.packaging.badgeLabel} />
                        </div>
                        {expandedNodes.pillar2 ? (
                          <ChevronUp className="w-4 h-4 text-[#27272a] dark:text-zinc-400 stroke-[2]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#27272a] dark:text-zinc-400 stroke-[2]" />
                        )}
                      </div>

                      {expandedNodes.pillar2 && (
                        <div className="mt-1 divide-y divide-[#e5e7eb] dark:divide-zinc-800 text-xs">
                          <WorkflowTaskRow
                            title="Order Added to Packaging Queue"
                            status={pipelineMetrics.packaging.queue}
                            isAutomatic={true}
                          />
                          <WorkflowTaskRow
                            title="Start Packaging & Deduct Materials"
                            status={pipelineMetrics.packaging.deduction}
                            isAutomatic={false}
                            actionUrl="/production/packaging"
                            actionTitle="Start Packaging in Packaging Execution"
                          />
                          <WorkflowTaskRow
                            title="Confirm Packaged for Dispatch"
                            status={pipelineMetrics.packaging.sealing}
                            isAutomatic={false}
                            actionUrl="/production/packaging"
                            actionTitle="Confirm Packaged in Packaging Execution"
                          />

                          {/* Individual Product Packaging Confirmation */}
                          {orderItems.length > 0 && (
                            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/50 space-y-1.5">
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                                <span>Products in Packaging</span>
                                <span className={cn("text-[10px] font-semibold", pipelineMetrics.isFulfilled || pipelineMetrics.packaging.sealing === 'Done' ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                                  {pipelineMetrics.isFulfilled || pipelineMetrics.packaging.sealing === 'Done' ? '100% Packed' : 'In Packaging'}
                                </span>
                              </div>
                              {orderItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                                  <span className="truncate text-zinc-700 dark:text-zinc-300 font-medium">
                                    {item.name}
                                  </span>
                                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 shrink-0 ml-1.5">
                                    <span>{item.quantity}x</span>
                                    {pipelineMetrics.isFulfilled || pipelineMetrics.packaging.sealing === 'Done' ? (
                                      <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                                        <Check className="w-3 h-3 stroke-[2.5]" /> Packaged
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                                        <Clock className="w-3 h-3" /> Packing
                                      </span>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* =====================================================================
                      COLUMN 3: LOGISTICS & DELIVERY
                     ===================================================================== */}
                  <div className="w-[290px] sm:w-[330px] shrink-0 space-y-3.5">
                    <div ref={bindingsCardRef} className="p-1 rounded-[16px] border border-[#d4d4d8] dark:border-zinc-800 bg-white dark:bg-zinc-900/90 transition-all shadow-2xs hover:border-[#a1a1aa] dark:hover:border-zinc-700">
                      <div
                        ref={bindingsHeaderRef}
                        onClick={() => toggleNodeExpansion('pillar3')}
                        className="rounded-[12px] border border-[#d4d4d8] dark:border-zinc-800 bg-white dark:bg-zinc-800/80 px-3.5 py-2.5 flex items-center justify-between cursor-pointer select-none hover:bg-[#fafafa] dark:hover:bg-zinc-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-[#52525b] dark:text-zinc-400 stroke-[1.75] shrink-0" />
                          <span className="text-[14px] font-semibold text-[#18181b] dark:text-zinc-100">Logistics & Delivery</span>
                          <CountBadge count={pipelineMetrics.delivery.badgeLabel} />
                        </div>
                        {expandedNodes.pillar3 ? (
                          <ChevronUp className="w-4 h-4 text-[#27272a] dark:text-zinc-400 stroke-[2]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#27272a] dark:text-zinc-400 stroke-[2]" />
                        )}
                      </div>

                      {expandedNodes.pillar3 && (
                        <div className="mt-1 divide-y divide-[#e5e7eb] dark:divide-zinc-800 text-xs">
                          <WorkflowTaskRow
                            title="Assign Rider or External Courier"
                            status={pipelineMetrics.delivery.driver}
                            isAutomatic={false}
                            actionUrl="/logistics/board"
                            actionTitle="Assign Rider on Dispatch Board"
                          />
                          <WorkflowTaskRow
                            title="Confirm Rider Pickup (In Transit)"
                            status={pipelineMetrics.delivery.pickup}
                            isAutomatic={false}
                            actionUrl="/logistics/board"
                            actionTitle="Confirm Rider Pickup on Dispatch Board"
                          />
                          <WorkflowTaskRow
                            title="Mark Delivered or Store Handover"
                            status={pipelineMetrics.delivery.delivered}
                            isAutomatic={false}
                            actionUrl="/logistics/board"
                            actionTitle="Mark Delivered on Dispatch Board"
                          />
                          <WorkflowTaskRow
                            title="Clear Rider Payout or Courier Fee"
                            status={pipelineMetrics.delivery.payout}
                            isAutomatic={false}
                            actionUrl="/logistics/riders"
                            actionTitle="Clear Rider Payout in Delivery Team"
                          />
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
                <div className="p-1 rounded-[16px] border border-[#d4d4d8] dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-2xs hover:border-[#a1a1aa] dark:hover:border-zinc-700 transition-all">
                  <div
                    onClick={() => toggleNodeExpansion('tree1')}
                    className="rounded-[12px] border border-[#d4d4d8] dark:border-zinc-800 bg-white dark:bg-zinc-800/80 px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-[#fafafa] dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-[#52525b] dark:text-zinc-400 stroke-[1.75] shrink-0" />
                      <span className="text-[14px] font-semibold text-[#18181b] dark:text-zinc-100">Order Intake</span>
                      <CountBadge count={pipelineMetrics.intake.badgeLabel} />
                    </div>
                    {expandedNodes.tree1 !== false ? (
                      <ChevronUp className="w-4 h-4 text-[#27272a] dark:text-zinc-400 stroke-[2]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#27272a] dark:text-zinc-400 stroke-[2]" />
                    )}
                  </div>

                  {expandedNodes.tree1 !== false && (
                    <div className="mt-1 divide-y divide-[#e5e7eb] dark:divide-zinc-800 text-xs">
                      <WorkflowTaskRow
                        title="Website Order Received"
                        status={pipelineMetrics.intake.validation}
                        isAutomatic={true}
                        actionUrl="/sales/orders"
                        actionTitle="View Website Orders"
                      />
                      <WorkflowTaskRow
                        title="Payment Confirmed"
                        status={pipelineMetrics.intake.payment}
                        isAutomatic={true}
                      />
                      <WorkflowTaskRow
                        title="Schedule or Send to Queue"
                        status={pipelineMetrics.intake.channel}
                        isAutomatic={true}
                        actionUrl="/logistics/schedule"
                        actionTitle="View Delivery Schedule"
                      />
                    </div>
                  )}
                </div>

                {/* STEM 1 TO 2 */}
                <div className="flex flex-col items-center justify-center -my-3">
                  <div className="w-[1.5px] h-6 bg-[#94a3b8] dark:bg-zinc-600" />
                  <div className="w-2 h-2 rotate-45 border-r-[1.5px] border-b-[1.5px] border-[#94a3b8] dark:border-zinc-600 -mt-1" />
                </div>

                {/* 2. SALES STOCK */}
                <div className="p-1 rounded-[16px] border border-[#d4d4d8] dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-2xs hover:border-[#a1a1aa] dark:hover:border-zinc-700 transition-all">
                  <div
                    onClick={() => toggleNodeExpansion('tree2')}
                    className="rounded-[12px] border border-[#d4d4d8] dark:border-zinc-800 bg-white dark:bg-zinc-800/80 px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-[#fafafa] dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-[#52525b] dark:text-zinc-400 stroke-[1.75] shrink-0" />
                      <span className="text-[14px] font-semibold text-[#18181b] dark:text-zinc-100">Sales Stock</span>
                      <CountBadge count={pipelineMetrics.inventory.badgeLabel} />
                    </div>
                    {expandedNodes.tree2 !== false ? (
                      <ChevronUp className="w-4 h-4 text-[#27272a] dark:text-zinc-400 stroke-[2]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#27272a] dark:text-zinc-400 stroke-[2]" />
                    )}
                  </div>

                  {expandedNodes.tree2 !== false && (
                    <div className="mt-1 divide-y divide-[#e5e7eb] dark:divide-zinc-800 text-xs">
                      <WorkflowTaskRow
                        title="Check Available Sales Stock"
                        status={pipelineMetrics.inventory.stock}
                        isAutomatic={true}
                        actionUrl="/inventory/sales"
                        actionTitle="View Sales Stock"
                      />
                      <WorkflowTaskRow
                        title="Allocate Stock to Order"
                        status={pipelineMetrics.inventory.allocation}
                        isAutomatic={true}
                      />
                      <WorkflowTaskRow
                        title="Deduct Stock on Fulfillment"
                        status={pipelineMetrics.inventory.ingredients}
                        isAutomatic={true}
                      />

                      {/* Product Allocation Flow in Tree View */}
                      {orderItems.length > 0 && (
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 space-y-1.5">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                            <span>Product Allocation</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              {pipelineMetrics.isFulfilled || activeOrder?.hasStock ? 'Ready in stock' : 'Queued'}
                            </span>
                          </div>
                          {orderItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                              <span className="truncate text-zinc-700 dark:text-zinc-300 font-medium">
                                {item.name}
                              </span>
                              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 ml-1.5">
                                <span>{item.quantity}x</span>
                                {pipelineMetrics.isFulfilled || activeOrder?.hasStock ? (
                                  <span className="inline-flex items-center gap-0.5">
                                    <Check className="w-3 h-3 stroke-[2.5]" /> Allocated
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                                    <Clock className="w-3 h-3" /> Hold
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* STEM 2 TO 3 */}
                <div className="flex flex-col items-center justify-center -my-3">
                  <div className="w-[1.5px] h-6 bg-[#94a3b8] dark:bg-zinc-600" />
                  <div className="w-2 h-2 rotate-45 border-r-[1.5px] border-b-[1.5px] border-[#94a3b8] dark:border-zinc-600 -mt-1" />
                </div>

                {/* 3. PRODUCTION BATCHES */}
                <div className="p-1 rounded-[16px] border border-[#d4d4d8] dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-2xs hover:border-[#a1a1aa] dark:hover:border-zinc-700 transition-all">
                  <div
                    onClick={() => toggleNodeExpansion('tree3')}
                    className="rounded-[12px] border border-[#d4d4d8] dark:border-zinc-800 bg-white dark:bg-zinc-800/80 px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-[#fafafa] dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-[#52525b] dark:text-zinc-400 stroke-[1.75] shrink-0" />
                      <span className="text-[14px] font-semibold text-[#18181b] dark:text-zinc-100">Production Batches</span>
                      <CountBadge count={pipelineMetrics.cooking.badgeLabel} />
                    </div>
                    {expandedNodes.tree3 !== false ? (
                      <ChevronUp className="w-4 h-4 text-[#27272a] dark:text-zinc-400 stroke-[2]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#27272a] dark:text-zinc-400 stroke-[2]" />
                    )}
                  </div>

                  {expandedNodes.tree3 !== false && (
                    <div className="mt-1 divide-y divide-[#e5e7eb] dark:divide-zinc-800 text-xs">
                      <WorkflowTaskRow
                        title="Create Production Batch"
                        status={pipelineMetrics.cooking.schedule}
                        isAutomatic={false}
                        actionUrl="/production/batches"
                        actionTitle="Create Batch in Production Batches"
                      />
                      <WorkflowTaskRow
                        title="Start Smoking Batch"
                        status={pipelineMetrics.cooking.cooking}
                        isAutomatic={false}
                        actionUrl="/production/batches"
                        actionTitle="Start Smoking in Production Batches"
                      />
                      <WorkflowTaskRow
                        title="Complete Batch & Add to Stock"
                        status={pipelineMetrics.cooking.output}
                        isAutomatic={false}
                        actionUrl="/production/batches"
                        actionTitle="Complete Batch in Production Batches"
                      />
                    </div>
                  )}
                </div>

                {/* STEM 3 TO 4 */}
                <div className="flex flex-col items-center justify-center -my-3">
                  <div className="w-[1.5px] h-6 bg-[#94a3b8] dark:bg-zinc-600" />
                  <div className="w-2 h-2 rotate-45 border-r-[1.5px] border-b-[1.5px] border-[#94a3b8] dark:border-zinc-600 -mt-1" />
                </div>

                {/* 4. PACKAGING EXECUTION */}
                <div className="p-1 rounded-[16px] border border-[#d4d4d8] dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-2xs hover:border-[#a1a1aa] dark:hover:border-zinc-700 transition-all">
                  <div
                    onClick={() => toggleNodeExpansion('tree4')}
                    className="rounded-[12px] border border-[#d4d4d8] dark:border-zinc-800 bg-white dark:bg-zinc-800/80 px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-[#fafafa] dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#52525b] dark:text-zinc-400 stroke-[1.75] shrink-0" />
                      <span className="text-[14px] font-semibold text-[#18181b] dark:text-zinc-100">Packaging Execution</span>
                      <CountBadge count={pipelineMetrics.packaging.badgeLabel} />
                    </div>
                    {expandedNodes.tree4 !== false ? (
                      <ChevronUp className="w-4 h-4 text-[#27272a] dark:text-zinc-400 stroke-[2]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#27272a] dark:text-zinc-400 stroke-[2]" />
                    )}
                  </div>

                  {expandedNodes.tree4 !== false && (
                    <div className="mt-1 divide-y divide-[#e5e7eb] dark:divide-zinc-800 text-xs">
                      <WorkflowTaskRow
                        title="Order Added to Packaging Queue"
                        status={pipelineMetrics.packaging.queue}
                        isAutomatic={true}
                      />
                      <WorkflowTaskRow
                        title="Start Packaging & Deduct Materials"
                        status={pipelineMetrics.packaging.deduction}
                        isAutomatic={false}
                        actionUrl="/production/packaging"
                        actionTitle="Start Packaging in Packaging Execution"
                      />
                      <WorkflowTaskRow
                        title="Confirm Packaged for Dispatch"
                        status={pipelineMetrics.packaging.sealing}
                        isAutomatic={false}
                        actionUrl="/production/packaging"
                        actionTitle="Confirm Packaged in Packaging Execution"
                      />

                      {/* Products in packaging */}
                      {orderItems.length > 0 && (
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 space-y-1.5">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                            <span>Products in Packaging</span>
                            <span className={cn("text-[10px] font-semibold", pipelineMetrics.isFulfilled || pipelineMetrics.packaging.sealing === 'Done' ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                              {pipelineMetrics.isFulfilled || pipelineMetrics.packaging.sealing === 'Done' ? '100% Packed' : 'In Packaging'}
                            </span>
                          </div>
                          {orderItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                              <span className="truncate text-zinc-700 dark:text-zinc-300 font-medium">
                                {item.name}
                              </span>
                              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 shrink-0 ml-1.5">
                                <span>{item.quantity}x</span>
                                {pipelineMetrics.isFulfilled || pipelineMetrics.packaging.sealing === 'Done' ? (
                                  <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                                    <Check className="w-3 h-3 stroke-[2.5]" /> Packaged
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                                    <Clock className="w-3 h-3" /> Packing
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* STEM 4 TO 5 */}
                <div className="flex flex-col items-center justify-center -my-3">
                  <div className="w-[1.5px] h-6 bg-[#94a3b8] dark:bg-zinc-600" />
                  <div className="w-2 h-2 rotate-45 border-r-[1.5px] border-b-[1.5px] border-[#94a3b8] dark:border-zinc-600 -mt-1" />
                </div>

                {/* 5. LOGISTICS & DELIVERY */}
                <div className="p-1 rounded-[16px] border border-[#d4d4d8] dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-2xs hover:border-[#a1a1aa] dark:hover:border-zinc-700 transition-all">
                  <div
                    onClick={() => toggleNodeExpansion('tree5')}
                    className="rounded-[12px] border border-[#d4d4d8] dark:border-zinc-800 bg-white dark:bg-zinc-800/80 px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-[#fafafa] dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#52525b] dark:text-zinc-400 stroke-[1.75] shrink-0" />
                      <span className="text-[14px] font-semibold text-[#18181b] dark:text-zinc-100">Logistics & Delivery</span>
                      <CountBadge count={pipelineMetrics.delivery.badgeLabel} />
                    </div>
                    {expandedNodes.tree5 !== false ? (
                      <ChevronUp className="w-4 h-4 text-[#27272a] dark:text-zinc-400 stroke-[2]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#27272a] dark:text-zinc-400 stroke-[2]" />
                    )}
                  </div>

                  {expandedNodes.tree5 !== false && (
                    <div className="mt-1 divide-y divide-[#e5e7eb] dark:divide-zinc-800 text-xs">
                      <WorkflowTaskRow
                        title="Assign Rider or External Courier"
                        status={pipelineMetrics.delivery.driver}
                        isAutomatic={false}
                        actionUrl="/logistics/board"
                        actionTitle="Assign Rider on Dispatch Board"
                      />
                      <WorkflowTaskRow
                        title="Confirm Rider Pickup (In Transit)"
                        status={pipelineMetrics.delivery.pickup}
                        isAutomatic={false}
                        actionUrl="/logistics/board"
                        actionTitle="Confirm Rider Pickup on Dispatch Board"
                      />
                      <WorkflowTaskRow
                        title="Mark Delivered or Store Handover"
                        status={pipelineMetrics.delivery.delivered}
                        isAutomatic={false}
                        actionUrl="/logistics/board"
                        actionTitle="Mark Delivered on Dispatch Board"
                      />
                      <WorkflowTaskRow
                        title="Clear Rider Payout or Courier Fee"
                        status={pipelineMetrics.delivery.payout}
                        isAutomatic={false}
                        actionUrl="/logistics/riders"
                        actionTitle="Clear Rider Payout in Delivery Team"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* =========================================================================
            3. BOTTOM COLLAPSE / EXPAND CHEVRON HANDLE (VISIBLE WHEN EXPANDED)
           ========================================================================= */}
        {isCanvasExpanded && (
          <div className="mt-4 pt-2 border-t border-[#f4f4f5] dark:border-zinc-800 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setIsCanvasExpanded(false)}
              className="text-[#71717a] dark:text-zinc-400 hover:text-[#18181b] dark:hover:text-zinc-200 transition-colors p-1 cursor-pointer"
              aria-label="Collapse canvas"
            >
              <ChevronUp className="w-5 h-5 stroke-[1.75]" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderWorkflowCanvasOverlay
