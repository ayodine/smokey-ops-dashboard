import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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
  User
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
    id: 'SHD-07662',
    customerName: 'Babajide Sanwo',
    dishName: '1 Liter Bowl Guineafowl Rice',
    totalAmount: 9500,
    portions: 1,
    channel: 'Website Storefront',
    hasStock: true,
    currentStage: 'p2_in_packaging',
    paymentRef: 'pay_smk_77201',
    riderName: 'Rider Yusuf Internal Fleet',
    destinationAddress: 'Plot 12 Admiralty Way, Lekki Phase 1',
    etaMinutes: 35,
    otpCode: '3189',
    deliveryFee: 3000,
    history: ['p1_ingestion', 'p1_inventory_deduct', 'p2_in_packaging']
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
    id: 'SHD-07667',
    customerName: 'Amaka Okafor',
    dishName: 'Smoked Goat Meat Asun Bowl',
    totalAmount: 15000,
    portions: 2,
    channel: 'Direct WhatsApp',
    hasStock: true,
    currentStage: 'p3_in_transit',
    paymentRef: 'pay_smk_88412',
    riderName: 'Rider Chuka Fleet',
    destinationAddress: 'Chevy View Estate, Chevron Drive, Lekki',
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
    id: 'SHD-07661',
    customerName: 'Anita Ihaza',
    dishName: 'Full Smokey Guineafowl (Chopped) × 2',
    totalAmount: 27700,
    portions: 2,
    channel: 'Website Storefront',
    hasStock: true,
    currentStage: 'p3_delivery_assigned',
    paymentRef: 'pay_smk_66190',
    riderName: 'Rider Yusuf Internal Fleet',
    destinationAddress: '4 Awoseyin Lane, Shomolu, Lagos',
    etaMinutes: 40,
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
    id: 'SHD-07668',
    customerName: 'Anita Ihaza',
    dishName: 'Peppered Jumbo Snail & Plantain',
    totalAmount: 18000,
    portions: 1,
    channel: 'Website Storefront',
    hasStock: false,
    currentStage: 'p1_inventory_deduct',
    paymentRef: 'pay_smk_99215',
    destinationAddress: '4 Awoseyin Lane, Shomolu, Lagos',
    otpCode: '4410',
    deliveryFee: 2500,
    history: ['p1_ingestion', 'p1_inventory_deduct']
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
    id: 'SHD-07672',
    customerName: 'Chinedu Eze',
    dishName: 'VIP Guineafowl & Plantain Platter',
    totalAmount: 32000,
    portions: 3,
    channel: 'Direct WhatsApp',
    hasStock: true,
    currentStage: 'p2_dispatched',
    paymentRef: 'pay_smk_55418',
    destinationAddress: 'Akowonjo Roundabout, Egbeda, Lagos',
    otpCode: '8721',
    deliveryFee: 3000,
    history: [
      'p1_ingestion',
      'p1_inventory_deduct',
      'p2_in_packaging',
      'p2_materials_picked',
      'p2_dispatched'
    ]
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
  },
  {
    id: 'SHD-09857',
    customerName: 'Tunde Bakare',
    dishName: 'Smoked Turkey and Jollof Rice Special',
    totalAmount: 21500,
    portions: 2,
    channel: 'Website Storefront',
    hasStock: true,
    currentStage: 'p3_doorstep_handover',
    paymentRef: 'pay_smk_99185',
    riderName: 'Rider Yusuf Internal Fleet',
    destinationAddress: '14 Karimu Kotun St, Victoria Island',
    etaMinutes: 4,
    otpCode: '6143',
    deliveryFee: 3500,
    history: [
      'p1_ingestion',
      'p1_inventory_deduct',
      'p2_in_packaging',
      'p2_materials_picked',
      'p2_dispatched',
      'p3_delivery_assigned',
      'p3_in_transit',
      'p3_doorstep_handover'
    ]
  },
  {
    id: 'SHD-07680',
    customerName: 'Tunde Bakare',
    dishName: 'Smokey Jumbo Turkey Wings Feast',
    totalAmount: 14500,
    portions: 2,
    channel: 'Website Storefront',
    hasStock: false,
    currentStage: 'p1_production_batch',
    paymentRef: 'pay_smk_33109',
    batchId: 'Batch 408',
    destinationAddress: '14 Karimu Kotun St, Victoria Island',
    otpCode: '2290',
    deliveryFee: 3500,
    history: ['p1_ingestion', 'p1_inventory_deduct', 'p1_production_batch']
  },
  {
    id: 'SHD-07663',
    customerName: 'Ogunnowo Oyewale',
    dishName: 'Full Smokey Guineafowl & Palmwine',
    totalAmount: 15300,
    portions: 1,
    channel: 'Website Storefront',
    hasStock: true,
    currentStage: 'p2_materials_picked',
    paymentRef: 'pay_smk_44298',
    destinationAddress: 'Store Pickup — Lagos Mainland',
    otpCode: '7714',
    deliveryFee: 0,
    history: ['p1_ingestion', 'p1_inventory_deduct', 'p2_in_packaging', 'p2_materials_picked']
  },
  {
    id: 'SHD-07664',
    customerName: 'Kolawole Durojaiye',
    dishName: 'Smokey Jumbo Turkey Wings (Pair) × 2',
    totalAmount: 32000,
    portions: 2,
    channel: 'Website Storefront',
    hasStock: true,
    currentStage: 'p3_in_transit',
    paymentRef: 'pay_smk_55198',
    riderName: 'Rider Yusuf Internal Fleet',
    destinationAddress: '12 Isaac John Street, GRA Ikeja',
    etaMinutes: 18,
    otpCode: '3941',
    deliveryFee: 3000,
    history: [
      'p1_ingestion',
      'p1_inventory_deduct',
      'p2_in_packaging',
      'p2_materials_picked',
      'p2_dispatched',
      'p3_delivery_assigned',
      'p3_in_transit'
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
      'inline-flex items-center justify-center px-1.5 py-0.5 rounded-[6px] text-[11px] font-semibold bg-[#52525b] text-white min-w-[20px] leading-tight select-none',
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
    <div className="relative px-3.5 py-2.5 flex items-center justify-between hover:bg-zinc-50/70 transition-colors group select-none">
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
        <span className="text-[#374151] font-normal text-[13.5px] truncate">
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
            className="inline-flex items-start text-[#9ca3af] hover:text-[#0051c3] transition-colors cursor-pointer ml-1 self-start -translate-y-1 shrink-0 p-0.5 rounded"
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

/** Helper function to highlight query match inside customer name or text with design system brand red */
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
            ? 'bg-[#c0201f] text-white shadow-2xs'
            : 'bg-red-100 text-[#c0201f] underline decoration-[#c0201f]/30 decoration-2'
        )}
      >
        {matched}
      </span>
      {after}
    </span>
  )
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
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(0)
  const searchContainerRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

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
      matchType: 'customer' | 'id' | 'dish' | 'address' | 'payment'
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
      let matchType: 'customer' | 'id' | 'dish' | 'address' | 'payment' = 'customer'

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
      // Dish name match
      else if (dishLower.includes(q)) {
        score += 45
        matchType = 'dish'
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

    // Card 3: Kitchen Cooking (2 tasks: Batch Cooking & Kitchen Output - automated background production)
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
    const cookDoneCount = [cookCooking, cookOutput].filter((s) => s === 'Done').length

    // Card 4: Packaging and Assembly (4 tasks: Queue Routing, Material Pick, Deduct Consumables, Sealing)
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

    // Card 5: Delivery and Handover (6 tasks: Assign Driver, Kitchen Pickup, Transit, OTP Handover, Payout, Complete)
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
    const delVerification: 'Done' | 'In Progress' | 'In Review' | 'Pending' =
      activeOrder?.history.includes('p3_delivered')
        ? 'Done'
        : activeOrder?.currentStage === 'p3_doorstep_handover'
        ? 'In Review'
        : activeOrder?.history.includes('p3_in_transit')
        ? 'In Progress'
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
        doneCount: cookDoneCount,
        totalCount: 2,
        badgeLabel: `${cookDoneCount}/2`
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
        verification: delVerification,
        payout: delPayout,
        completion: delCompletion,
        doneCount: delDoneCount,
        totalCount: 6,
        badgeLabel: `${delDoneCount}/6`
      }
    }
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
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 sm:p-8 relative shadow-2xs transition-all overflow-hidden">
        {/* CONTAINER HEADING */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-[#e4e4e7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0051c3] flex items-center justify-center font-bold shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[17px] font-semibold text-[#18181b] tracking-tight">
                  Order Tracking Diagram
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ecfdf5] text-[#15803d]">
                  Live Pipeline
                </span>
              </div>
              <p className="text-xs text-[#71717a] mt-0.5">
                End-to-end operational pipeline tracking from customer checkout through kitchen cooking to delivery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#71717a] hidden sm:inline">
              Active Order:{' '}
              <span className="inline-flex items-center font-mono font-bold text-xs px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 tracking-tight shadow-2xs">
                {activeOrder.id}
              </span>{' '}
              <span className="text-[#a1a1aa]">({activeOrder.customerName})</span>
            </span>
            <button
              type="button"
              onClick={() => setIsCanvasExpanded(!isCanvasExpanded)}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[#e4e4e7] bg-white text-xs font-medium text-[#18181b] hover:bg-[#fafafa] transition-colors"
            >
              <span>{isCanvasExpanded ? 'Collapse' : 'Expand'}</span>
              {isCanvasExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[#71717a]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#71717a]" />}
            </button>
          </div>
        </div>

        {/* ACTIVE ORDER SEARCH & FIGMA STATUS LEGEND */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 mb-6 border-b border-[#e4e4e7]">
          {/* Left: Design System Search Field with Rock-Solid Fixed Width & Autocomplete Dropdown */}
          <div
            ref={searchContainerRef}
            className="relative w-full sm:w-[420px] lg:w-[480px] shrink-0 font-sans"
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
                  <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200 font-mono">
                    Tab ⇥
                  </span>
                </div>
              )}

              {/* Main Search Input: Constant width & padding, no resize jitter */}
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
                className="w-full h-10 pl-9 pr-14 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#c0201f] focus:border-[#c0201f] transition-colors font-sans shadow-2xs"
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

            {/* Live Autocomplete & Indexed Order Suggestion Dropdown */}
            {isSearchOpen && (
              <div
                className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden font-sans max-h-96 flex flex-col animate-in fade-in slide-in-from-top-1 duration-150"
                role="listbox"
              >
                {/* Dropdown Header */}
                <div className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-300 shrink-0">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                    {orderSearchInput.trim()
                      ? `Found ${searchResults.length} order${searchResults.length === 1 ? '' : 's'}`
                      : `Active Pipeline Orders (${orders.length})`}
                  </span>
                  <span className="text-[10px] hidden sm:flex items-center gap-1.5 text-zinc-400">
                    <kbd className="px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-[9px] text-zinc-600 dark:text-zinc-300 shadow-2xs">
                      ↑↓
                    </kbd>{' '}
                    navigate
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <kbd className="px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-[9px] text-zinc-600 dark:text-zinc-300 shadow-2xs">
                      ↵
                    </kbd>{' '}
                    select
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <kbd className="px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-[9px] text-zinc-600 dark:text-zinc-300 shadow-2xs">
                      Esc
                    </kbd>{' '}
                    close
                  </span>
                </div>

                {/* Dropdown Scrollable List */}
                <div className="overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 max-h-80">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-zinc-500">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-2">
                        <Search className="w-4 h-4" />
                      </div>
                      <p className="font-medium text-zinc-800 dark:text-zinc-200">
                        No orders found matching "{orderSearchInput}"
                      </p>
                      <p className="text-[11px] mt-1 text-zinc-400">
                        Try searching by order ID (e.g. 09853, 07662) or customer name (e.g. Babajide, Amaka)
                      </p>
                    </div>
                  ) : (
                    searchResults.map(({ order }, index) => {
                      const isSelected = order.id === selectedOrderId
                      const isKeyboardActive = index === activeSuggestionIndex
                      const count = customerOrderCounts.get(order.customerName) || 1
                      const hasMultiple = count > 1

                      return (
                        <div
                          key={order.id}
                          onClick={() => handleSelectOrder(order)}
                          onMouseEnter={() => setActiveSuggestionIndex(index)}
                          className={cn(
                            'px-3.5 py-2.5 transition-colors cursor-pointer text-left',
                            isKeyboardActive
                              ? 'bg-red-50/50 dark:bg-red-950/20 border-l-[3px] border-[#c0201f]'
                              : isSelected
                              ? 'bg-zinc-50 dark:bg-zinc-800/40 border-l-[3px] border-zinc-400'
                              : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 border-l-[3px] border-transparent'
                          )}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <div className="flex items-center justify-between gap-3">
                            {/* Left: Prominent Order ID + Customer Name + Status Indicators */}
                            <div className="min-w-0 flex-1">
                              {/* Row 1: Order ID (Primary Prominence) + Customer Name + Badges */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* High-Prominence Order ID: Monospace contrast pill */}
                                <span className="inline-flex items-center font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 tracking-tight shrink-0 shadow-2xs">
                                  {highlightSearchMatch(order.id, orderSearchInput, true)}
                                </span>

                                {/* Customer Name */}
                                <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                                  {highlightSearchMatch(order.customerName, orderSearchInput)}
                                </span>

                                {/* Selected Badge: Design System Brand Red */}
                                {isSelected && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#c0201f] bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60 px-1.5 py-0.5 rounded shrink-0">
                                    <Check className="w-2.5 h-2.5" /> Selected
                                  </span>
                                )}

                                {/* Multiple Orders Badge: Design System Warning Spec (#FFFBEB / #FDE68A / #B45309) */}
                                {hasMultiple && (
                                  <span className="inline-flex items-center text-[10px] font-medium text-[#B45309] bg-[#FFFBEB] dark:bg-amber-950/30 border border-[#FDE68A] dark:border-amber-800/50 px-1.5 py-0.5 rounded-full shrink-0">
                                    Multiple orders ({count})
                                  </span>
                                )}
                              </div>

                              {/* Row 2: Dish Name, Price, and Channel Metadata */}
                              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                <span className="truncate text-zinc-600 dark:text-zinc-300 font-normal">
                                  {order.dishName}
                                </span>
                                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                <span className="shrink-0 font-medium text-zinc-800 dark:text-zinc-200">
                                  {formatNaira(order.totalAmount)}
                                </span>
                                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                <span className="shrink-0 text-zinc-400 dark:text-zinc-500 capitalize">
                                  {order.channel || 'Website'}
                                </span>
                              </div>
                            </div>

                            {/* Right: Stage Status Pill */}
                            <div className="shrink-0">
                              <StatusPill
                                state={
                                  order.currentStage === 'p3_settled_closed' ||
                                  order.currentStage === 'p3_delivered'
                                    ? 'completed'
                                    : order.currentStage === 'p1_ingestion'
                                    ? 'draft'
                                    : order.currentStage === 'p1_inventory_deduct'
                                    ? 'in-review'
                                    : 'in-progress'
                                }
                                label={getStageLabel(order.currentStage)}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Status States & Process Dots Legend extracted from Figma */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717a] mr-1 hidden sm:inline">
                Badge states:
              </span>
              <StatusPill state="draft" label="no-action" />
              <StatusPill state="in-progress" label="in-progress" />
              <StatusPill state="in-review" label="in-review" />
              <StatusPill state="completed" label="completed" />
              <StatusPill state="flagged" label="flagged" />
            </div>

            <div className="h-4 w-px bg-[#e4e4e7] hidden md:block" />

            {/* Process Indicator Legend: Grey for Automatic, Red for Action Required */}
            <div className="flex items-center gap-3 text-xs text-[#71717a]">
              <div className="flex items-center gap-1.5" title="Automated system task">
                <span className="w-2 h-2 rounded-full bg-[#9ca3af] shrink-0" />
                <span className="text-[11px] font-medium text-[#52525b]">Automatic</span>
              </div>
              <div className="flex items-center gap-1.5" title="Human action required to attend to pending step">
                <span className="w-2 h-2 rounded-full bg-[#ef4444] shrink-0" />
                <span className="text-[11px] font-medium text-[#52525b]">Action required</span>
              </div>
            </div>
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
                      {/* Upper Trunk: Continuous vertical line connecting middle merge point to top curve */}
                      <path
                        d={svgPaths.upperTrunk}
                        fill="none"
                        stroke={
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
                          <WorkflowTaskRow
                            title="Order Ingestion"
                            status={pipelineMetrics.intake.validation}
                            isAutomatic={true}
                          />
                          <WorkflowTaskRow
                            title="Payment Verification"
                            status={pipelineMetrics.intake.payment}
                            isAutomatic={true}
                          />
                          <WorkflowTaskRow
                            title="Sales Channel Sync"
                            status={pipelineMetrics.intake.channel}
                            isAutomatic={true}
                          />
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
                          <WorkflowTaskRow
                            title="Sales Stock Deduction"
                            status={pipelineMetrics.inventory.stock}
                            isAutomatic={true}
                          />
                          <WorkflowTaskRow
                            title="Low Stock Reorder Alert"
                            status={pipelineMetrics.inventory.allocation}
                            isAutomatic={false}
                            actionUrl="/inventory/raw"
                            actionTitle="Review Low Stock in Raw Inventory"
                          />
                          <WorkflowTaskRow
                            title="Batch Allocation"
                            status={pipelineMetrics.inventory.ingredients}
                            isAutomatic={true}
                          />
                        </div>
                      )}
                    </div>

                    {/* Node 1C: Kitchen Cooking (Automated Batch Production) */}
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
                          <WorkflowTaskRow
                            title="Batch Cooking"
                            status={pipelineMetrics.cooking.cooking}
                            isAutomatic={true}
                          />
                          <WorkflowTaskRow
                            title="Kitchen Output"
                            status={pipelineMetrics.cooking.output}
                            isAutomatic={true}
                          />
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
                          <WorkflowTaskRow
                            title="Packing Queue Routing"
                            status={pipelineMetrics.packaging.queue}
                            isAutomatic={true}
                          />
                          <WorkflowTaskRow
                            title="Pick Packaging supplies"
                            status={pipelineMetrics.packaging.materials}
                            isAutomatic={false}
                            actionUrl="/inventory/packaging"
                            actionTitle="Pick Supplies in Packaging Inventory"
                          />
                          <WorkflowTaskRow
                            title="Deduct Consumables"
                            status={pipelineMetrics.packaging.deduction}
                            isAutomatic={true}
                          />
                          <WorkflowTaskRow
                            title="Bag Sealing"
                            status={pipelineMetrics.packaging.sealing}
                            isAutomatic={false}
                            actionUrl="/production/packaging"
                            actionTitle="Complete Sealing in Packaging Queue"
                          />
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
                          <WorkflowTaskRow
                            title="Assign Driver"
                            status={pipelineMetrics.delivery.driver}
                            isAutomatic={false}
                            actionUrl="/logistics/board"
                            actionTitle="Assign Driver on Logistics Board"
                          />
                          <WorkflowTaskRow
                            title="Kitchen Pickup Handover"
                            status={pipelineMetrics.delivery.pickup}
                            isAutomatic={false}
                            actionUrl="/logistics/board"
                            actionTitle="Confirm Pickup Handover"
                          />
                          <WorkflowTaskRow
                            title="Transit Route Tracking"
                            status={pipelineMetrics.delivery.transit}
                            isAutomatic={true}
                          />
                          <WorkflowTaskRow
                            title="Customer OTP Confirmation"
                            status={pipelineMetrics.delivery.verification}
                            isAutomatic={false}
                            actionUrl="/logistics/board"
                            actionTitle="Verify Customer Delivery OTP"
                          />
                          <WorkflowTaskRow
                            title="Driver Payment Clearance"
                            status={pipelineMetrics.delivery.payout}
                            isAutomatic={false}
                            actionUrl="/logistics/riders"
                            actionTitle="Clear Driver Payout Ledger"
                          />
                          <WorkflowTaskRow
                            title="Order Complete"
                            status={pipelineMetrics.delivery.completion}
                            isAutomatic={true}
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
                      <WorkflowTaskRow
                        title="Order Ingestion"
                        status={pipelineMetrics.intake.validation}
                        isAutomatic={true}
                      />
                      <WorkflowTaskRow
                        title="Payment Verification"
                        status={pipelineMetrics.intake.payment}
                        isAutomatic={true}
                      />
                      <WorkflowTaskRow
                        title="Sales Channel Sync"
                        status={pipelineMetrics.intake.channel}
                        isAutomatic={true}
                      />
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
                      <WorkflowTaskRow
                        title="Sales Stock Deduction"
                        status={pipelineMetrics.inventory.stock}
                        isAutomatic={true}
                      />
                      <WorkflowTaskRow
                        title="Low Stock Reorder"
                        status={pipelineMetrics.inventory.allocation}
                        isAutomatic={false}
                        actionUrl="/inventory/raw"
                        actionTitle="Manage raw stock in Raw Inventory"
                      />
                      <WorkflowTaskRow
                        title="Batch Allocation"
                        status={pipelineMetrics.inventory.ingredients}
                        isAutomatic={true}
                      />
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
                      <WorkflowTaskRow
                        title="Batch Cooking"
                        status={pipelineMetrics.cooking.cooking}
                        isAutomatic={true}
                      />
                      <WorkflowTaskRow
                        title="Kitchen Output"
                        status={pipelineMetrics.cooking.output}
                        isAutomatic={true}
                      />
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
                      <WorkflowTaskRow
                        title="Packing Queue Routing"
                        status={pipelineMetrics.packaging.queue}
                        isAutomatic={true}
                      />
                      <WorkflowTaskRow
                        title="Pick Packaging supplies"
                        status={pipelineMetrics.packaging.materials}
                        isAutomatic={false}
                        actionUrl="/inventory/packaging"
                        actionTitle="Pick supplies in Packaging Materials"
                      />
                      <WorkflowTaskRow
                        title="Deduct Consumables"
                        status={pipelineMetrics.packaging.deduction}
                        isAutomatic={true}
                      />
                      <WorkflowTaskRow
                        title="Bag Sealing"
                        status={pipelineMetrics.packaging.sealing}
                        isAutomatic={false}
                        actionUrl="/production/packaging"
                        actionTitle="Complete sealing in Packaging Queue"
                      />
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
                      <WorkflowTaskRow
                        title="Assign Driver"
                        status={pipelineMetrics.delivery.driver}
                        isAutomatic={false}
                        actionUrl="/logistics/board"
                        actionTitle="Assign rider on Dispatch Board"
                      />
                      <WorkflowTaskRow
                        title="Kitchen Pickup Handover"
                        status={pipelineMetrics.delivery.pickup}
                        isAutomatic={false}
                        actionUrl="/logistics/board"
                        actionTitle="Confirm pickup on Dispatch Board"
                      />
                      <WorkflowTaskRow
                        title="Transit Route Tracking"
                        status={pipelineMetrics.delivery.transit}
                        isAutomatic={true}
                      />
                      <WorkflowTaskRow
                        title="Customer OTP Confirmation"
                        status={pipelineMetrics.delivery.verification}
                        isAutomatic={false}
                        actionUrl="/logistics/board"
                        actionTitle="Verify delivery OTP on Dispatch Board"
                      />
                      <WorkflowTaskRow
                        title="Driver Payment Clearance"
                        status={pipelineMetrics.delivery.payout}
                        isAutomatic={false}
                        actionUrl="/logistics/riders"
                        actionTitle="Clear payout on Rider Management"
                      />
                      <WorkflowTaskRow
                        title="Order Complete"
                        status={pipelineMetrics.delivery.completion}
                        isAutomatic={true}
                      />
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
