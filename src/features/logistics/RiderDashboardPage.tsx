import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { LogisticsDelivery, RiderPayout, RiderTask } from '@/lib/smokeyData'
import { MetricCard } from '@/components/ui/MetricCard'
import { KumoTabs } from '@/components/ui/Tabs'
import { SingleDatePicker } from '@/components/ui/SingleDatePicker'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Badge'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatNaira } from '@/lib/utils'
import {
  Bike,
  Phone,
  MapPin,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  Bell,
  Search,
  Calendar,
  DollarSign,
  Receipt,
  ShieldCheck,
  Clock,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ClipboardList,
  ChevronDown,
  Info,
  CheckSquare,
  Square,
  UserCheck
} from 'lucide-react'

// Synthesize pleasant two-tone delivery notification chime via Web Audio API
function playDeliveryChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    const now = ctx.currentTime

    // First tone (D5 ~ 587.33 Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now)
    gain1.gain.setValueAtTime(0.18, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.35)

    // Second tone (A5 ~ 880 Hz)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, now + 0.12)
    gain2.gain.setValueAtTime(0.22, now + 0.12)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.12)
    osc2.stop(now + 0.55)
  } catch (err) {
    console.warn('Audio chime playback failed:', err)
  }
}

export const RiderDashboardPage: React.FC = () => {
  const {
    riders,
    logisticsDeliveries,
    riderTasks,
    markDelivered,
    declineDelivery,
    updateRiderTask,
    showToast,
  } = useSmokeyOps()

  // Selected rider state (Defaults to Rider Yusuf, user_id: 455 per specification)
  const [selectedRiderId, setSelectedRiderId] = useState<number>(455)

  // Current active rider profile
  const currentRider = useMemo(() => {
    return riders.find(r => r.rider_user_id === selectedRiderId) || riders.find(r => r.rider_user_id === 455) || riders[0]
  }, [riders, selectedRiderId])

  // Active Tab: 'assigned' | 'delivered' | 'earnings' | 'tasks'
  const [activeTab, setActiveTab] = useState<string>('assigned')

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState<string>('')

  // In-App Audio Bell notification engine
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('smokey_rider_sound_enabled')
    return saved !== null ? saved === 'true' : true
  })

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev
      localStorage.setItem('smokey_rider_sound_enabled', String(next))
      if (next) {
        playDeliveryChime()
        showToast('Notification audio chime activated', 'info')
      } else {
        showToast('Notification audio muted', 'info')
      }
      return next
    })
  }

  const handleTestSound = () => {
    playDeliveryChime()
    showToast('Testing audio alert chime...', 'info')
  }

  // Track active deliveries for auto-sound chime trigger when new orders are assigned
  const prevActiveIdsRef = useRef<number[]>([])

  // Filter deliveries belonging to this internal rider
  const riderDeliveries = useMemo(() => {
    if (!currentRider) return []
    return logisticsDeliveries.filter(
      d => d.rider_type === 'internal' && d.assigned_rider_id === currentRider.rider_user_id
    )
  }, [logisticsDeliveries, currentRider])

  // Active orders assigned to this rider
  const activeOrders = useMemo(() => {
    return riderDeliveries.filter(d => d.status === 'assigned' || d.status === 'in_transit' || d.status === 'out_for_delivery')
  }, [riderDeliveries])

  // Completed orders for this rider
  const completedOrders = useMemo(() => {
    return riderDeliveries.filter(d => d.status === 'delivered')
  }, [riderDeliveries])

  // Detect newly assigned deliveries and chime if sound is enabled
  useEffect(() => {
    const currentActiveIds = activeOrders.map(o => o.id)
    const prevIds = prevActiveIdsRef.current

    if (prevIds.length > 0) {
      const hasNewOrder = currentActiveIds.some(id => !prevIds.includes(id))
      if (hasNewOrder && soundEnabled) {
        playDeliveryChime()
        showToast('New delivery assignment received!', 'success')
      }
    }
    prevActiveIdsRef.current = currentActiveIds
  }, [activeOrders, soundEnabled, showToast])

  // Filter active and completed deliveries by search text & date
  const filteredActiveOrders = useMemo(() => {
    return activeOrders.filter(order => {
      const matchSearch = !searchQuery ||
        order.order_ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.phone.includes(searchQuery) ||
        order.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.items_summary && order.items_summary.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchDate = !selectedDate || order.dispatch_date === selectedDate
      return matchSearch && matchDate
    })
  }, [activeOrders, searchQuery, selectedDate])

  const filteredCompletedOrders = useMemo(() => {
    return completedOrders.filter(order => {
      const matchSearch = !searchQuery ||
        order.order_ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.phone.includes(searchQuery) ||
        order.address.toLowerCase().includes(searchQuery.toLowerCase())

      const matchDate = !selectedDate ||
        order.dispatch_date === selectedDate ||
        (order.delivered_at && order.delivered_at.startsWith(selectedDate))

      return matchSearch && matchDate
    })
  }, [completedOrders, searchQuery, selectedDate])

  // Tasks assigned to current rider
  const riderAssignedTasks = useMemo(() => {
    if (!currentRider) return []
    return riderTasks.filter(
      t => t.assignee_id === currentRider.rider_user_id || t.assignee_name === currentRider.rider_name
    )
  }, [riderTasks, currentRider])

  // Decline Dialog state
  const [declineTargetOrder, setDeclineTargetOrder] = useState<LogisticsDelivery | null>(null)
  const [declineReason, setDeclineReason] = useState<string>('Bike mechanical issue / flat tire')
  const [customDeclineNotes, setCustomDeclineNotes] = useState<string>('')

  const handleOpenDecline = (order: LogisticsDelivery) => {
    setDeclineTargetOrder(order)
    setDeclineReason('Bike mechanical issue / flat tire')
    setCustomDeclineNotes('')
  }

  const handleConfirmDecline = () => {
    if (!declineTargetOrder) return
    const finalReason = customDeclineNotes.trim()
      ? `${declineReason}: ${customDeclineNotes.trim()}`
      : declineReason

    declineDelivery(declineTargetOrder.id, finalReason)
    setDeclineTargetOrder(null)
  }

  // Delivery Handover Confirmation Modal state
  const [confirmDeliveryTarget, setConfirmDeliveryTarget] = useState<LogisticsDelivery | null>(null)

  const handleConfirmDelivered = (order: LogisticsDelivery) => {
    markDelivered(order.id)
    setConfirmDeliveryTarget(null)
  }

  // Tabs configuration
  const tabs = [
    {
      id: 'assigned',
      label: (
        <span className="flex items-center gap-1.5">
          <Bike className="w-3.5 h-3.5" />
          <span>Assigned Orders</span>
        </span>
      ),
      badge: activeOrders.length > 0 ? activeOrders.length : undefined,
    },
    {
      id: 'delivered',
      label: (
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Delivered Orders</span>
        </span>
      ),
      badge: completedOrders.length > 0 ? completedOrders.length : undefined,
    },
    {
      id: 'earnings',
      label: (
        <span className="flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5" />
          <span>Earnings & Wallet</span>
        </span>
      ),
    },
    {
      id: 'tasks',
      label: (
        <span className="flex items-center gap-1.5">
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Shift Tasks</span>
        </span>
      ),
      badge: riderAssignedTasks.filter(t => t.status !== 'done').length > 0 
        ? riderAssignedTasks.filter(t => t.status !== 'done').length 
        : undefined,
    },
  ]

  const totalCompletedTrips = currentRider?.total_completed ?? 362
  const lifetimeEarned = currentRider?.lifetime_earnings ?? 1183000
  const pendingPayoutBalance = currentRider?.pending_payout ?? 0

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto pb-12">
      {/* 5.1 Top Banner & Rider Identity */}
      <div className="bg-kumo-surface border border-kumo-line rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Identity info */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-kumo-strong">
                  {currentRider?.rider_name || 'RIDER YUSUF'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                  <UserCheck className="w-3 h-3" />
                  Delivery Rider
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-kumo-canvas text-kumo-subtle border border-kumo-line">
                  Staff ID: {currentRider?.staff_id || 'RDR-003'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-kumo-subtle">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-kumo-subtle" />
                  <a href={`tel:${currentRider?.phone}`} className="hover:text-kumo-strong font-medium underline">
                    {currentRider?.phone || '07087141351'}
                  </a>
                </span>
                <span>•</span>
                <span>{currentRider?.email || 'Ridersmokeyyusuf@gmail.com'}</span>
                <span>•</span>
                <span className="text-kumo-default font-medium">
                  {currentRider?.vehicle_type || 'Honda CB125 Motorcycle'} ({currentRider?.plate_number || 'KTU-193-BD'})
                </span>
              </div>
            </div>
          </div>

          {/* Controls: Audio Bell & Rider Switcher */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-kumo-line">
            {/* Audio Notification Bell Toggle */}
            <Tooltip content={soundEnabled ? 'Click to mute active trip audio alerts' : 'Click to enable repeating trip sound'}>
              <button
                type="button"
                onClick={toggleSound}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                  soundEnabled
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                    : 'bg-kumo-canvas border-kumo-line text-kumo-subtle hover:text-kumo-strong'
                }`}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>Sound alert: <strong className="font-semibold">ON</strong></span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-kumo-subtle" />
                    <span>Sound alert: <strong>OFF</strong></span>
                  </>
                )}
              </button>
            </Tooltip>

            {soundEnabled && (
              <button
                type="button"
                onClick={handleTestSound}
                className="px-2.5 py-2 text-xs font-medium text-kumo-subtle hover:text-kumo-strong bg-kumo-canvas hover:bg-kumo-surface border border-kumo-line rounded-xl transition"
              >
                Test chime
              </button>
            )}

            {/* Rider Account Switcher (For operational testing) */}
            <div className="relative">
              <label htmlFor="rider-select" className="sr-only">Switch rider</label>
              <select
                id="rider-select"
                value={selectedRiderId}
                onChange={(e) => setSelectedRiderId(Number(e.target.value))}
                className="text-xs bg-kumo-canvas text-kumo-strong border border-kumo-line rounded-xl px-3 py-2 font-medium focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer pr-7"
              >
                {riders.map(r => (
                  <option key={r.rider_user_id} value={r.rider_user_id}>
                    {r.rider_name} ({r.staff_id || `ID: ${r.rider_user_id}`})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 5.2 KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Lifetime Earnings */}
        <MetricCard
          title="Total Earned (Lifetime)"
          value={formatNaira(lifetimeEarned)}
          description="Cumulative historical gross earnings"
          icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
        />

        {/* 2. Outstanding / Unpaid */}
        <MetricCard
          title="Outstanding / Unpaid"
          value={formatNaira(pendingPayoutBalance)}
          description={pendingPayoutBalance === 0 ? "Account settled — ₦0.00 owed" : "Current balance awaiting payout"}
          icon={<Receipt className={`w-4 h-4 ${pendingPayoutBalance > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />}
        />

        {/* 3. Active Assignments */}
        <MetricCard
          title="Active Assignments"
          value={`${activeOrders.length} ${activeOrders.length === 1 ? 'Trip' : 'Trips'}`}
          description={activeOrders.length > 0 ? "In transit / pickup ready" : "No active orders on queue"}
          icon={<Bike className={`w-4 h-4 ${activeOrders.length > 0 ? 'text-primary' : 'text-kumo-subtle'}`} />}
        />

        {/* 4. Delivered (Lifetime) */}
        <MetricCard
          title="Delivered (Lifetime)"
          value={`${totalCompletedTrips} Runs`}
          description={`${completedOrders.length} recorded in current ledger`}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        />
      </div>

      {/* 5.3 Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-kumo-surface border border-kumo-line p-3 sm:p-4 rounded-xl shadow-2xs">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-kumo-subtle absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order #, customer, phone, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-kumo-canvas text-kumo-strong border border-kumo-line rounded-lg focus:outline-hidden focus:ring-1 focus:ring-primary placeholder:text-kumo-subtle/70"
          />
        </div>

        {/* Date Filter & "All days" button */}
        <div className="flex items-center gap-2">
          <div className="min-w-[170px]">
            <SingleDatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Filter by date"
            />
          </div>

          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate('')}
              className="text-xs px-3 py-2 bg-kumo-canvas hover:bg-kumo-surface text-kumo-subtle hover:text-kumo-strong border border-kumo-line rounded-lg font-medium transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>All days</span>
            </button>
          )}

          {(searchQuery || selectedDate) && (
            <span className="text-xs text-kumo-subtle pl-1 font-medium">
              Filter: {filteredActiveOrders.length + filteredCompletedOrders.length} orders
            </span>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-kumo-line pb-0">
        <KumoTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          size="md"
        />
      </div>

      {/* TAB CONTENT AREA */}
      <div>
        {/* ------------------------------------------------------------- */}
        {/* TAB 1: ASSIGNED ORDERS (ACTIVE TRIPS)                          */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'assigned' && (
          <div className="space-y-4">
            {filteredActiveOrders.length === 0 ? (
              <div className="text-center py-14 px-4 bg-kumo-surface border border-kumo-line rounded-2xl">
                <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
                  <Bike className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-kumo-strong">
                  No active assignments
                </h3>
                <p className="text-xs text-kumo-subtle mt-1.5 max-w-md mx-auto leading-relaxed">
                  In Logistics Dispatch Board, choose <strong>Assign → Rider</strong> and select this rider account (not Third-party).
                </p>
                <div className="mt-5 flex justify-center gap-2">
                  <Link
                    to="/logistics/board"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition shadow-xs"
                  >
                    <span>View Dispatch Board</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  {selectedDate && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate('')}
                      className="px-4 py-2 rounded-lg bg-kumo-canvas border border-kumo-line text-xs font-medium text-kumo-strong hover:bg-kumo-surface transition"
                    >
                      Clear date filter
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredActiveOrders.map(order => (
                  <div
                    key={order.id}
                    className="bg-kumo-surface border border-kumo-line rounded-2xl p-4 sm:p-5 shadow-xs hover:border-kumo-line/80 transition flex flex-col justify-between"
                  >
                    {/* Header */}
                    <div>
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-kumo-line">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-kumo-subtle font-medium uppercase tracking-wider">
                              Order Ref
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-semibold uppercase">
                              {order.status === 'out_for_delivery' ? 'Out for delivery' : 'Assigned to you'}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-kumo-strong mt-0.5">
                            #{order.order_ref}
                          </h3>
                        </div>

                        {/* Trip Earning Badge */}
                        <div className="text-right">
                          <span className="text-xs text-kumo-subtle font-medium block">Trip Fee</span>
                          <span className="inline-flex items-center px-2.5 py-1 text-sm font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            +{formatNaira(order.delivery_fee)}
                          </span>
                        </div>
                      </div>

                      {/* Customer Contact & Address info */}
                      <div className="space-y-3 py-3.5 text-xs text-kumo-default border-b border-kumo-line">
                        {/* Customer & Click to Dial */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-kumo-subtle block">Customer:</span>
                            <span className="font-semibold text-kumo-strong text-sm">
                              {order.customer_name}
                            </span>
                          </div>
                          <a
                            href={`tel:${order.phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg font-semibold transition shrink-0"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call {order.phone}</span>
                          </a>
                        </div>

                        {/* Address & Google Maps Route Launcher */}
                        <div>
                          <span className="text-kumo-subtle block">Delivery Address:</span>
                          <div className="mt-1 flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium text-kumo-strong leading-snug">
                                {order.address}
                              </p>
                              <a
                                href={`https://maps.google.com/?q=${encodeURIComponent(order.address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline mt-1"
                              >
                                <span>Navigate with Google Maps</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Meal / Item Summary */}
                        {order.items_summary && (
                          <div className="bg-kumo-canvas p-2.5 rounded-xl border border-kumo-line">
                            <span className="text-[11px] font-semibold text-kumo-subtle uppercase tracking-wider block mb-1">
                              Kitchen Pack Summary:
                            </span>
                            <p className="text-xs text-kumo-strong font-medium leading-relaxed">
                              {order.items_summary}
                            </p>
                          </div>
                        )}

                        {/* Special Landmark or Gate Note */}
                        {order.notes && (
                          <div className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span><strong>Note:</strong> {order.notes}</span>
                          </div>
                        )}

                        {/* Dispatch date & Payment mode */}
                        <div className="flex items-center justify-between text-[11px] text-kumo-subtle pt-1">
                          <span>Dispatch Date: <strong>{order.dispatch_date}</strong></span>
                          <span>
                            Payment Mode: <strong className={order.payment_mode === 'cod' ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                              {order.payment_mode === 'cod' ? `COD (Collect ₦${order.cod_amount?.toLocaleString() || '0'})` : 'Online Prepaid'}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dual Action CTAs: Confirm Delivered & Decline */}
                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => handleOpenDecline(order)}
                        className="h-11 px-4 rounded-xl border border-kumo-line hover:border-rose-300 dark:hover:border-rose-800 bg-kumo-canvas hover:bg-rose-50 dark:hover:bg-rose-950/20 text-kumo-subtle hover:text-rose-600 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4 text-rose-500" />
                        <span>Decline order</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmDeliveryTarget(order)}
                        className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm delivered</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: DELIVERED ORDERS (HISTORICAL ARCHIVE)                  */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'delivered' && (
          <div className="bg-kumo-surface border border-kumo-line rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-kumo-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-kumo-strong">
                  Historical Delivered Trips ({filteredCompletedOrders.length})
                </h3>
                <p className="text-xs text-kumo-subtle mt-0.5">
                  Searchable proof-of-delivery ledger for fee audit and commission reconciliation.
                </p>
              </div>
            </div>

            {filteredCompletedOrders.length === 0 ? (
              <div className="p-12 text-center text-xs text-kumo-subtle">
                <CheckCircle2 className="w-8 h-8 text-kumo-subtle mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-kumo-strong">No delivered trips found</p>
                <p className="mt-1">Completed orders will appear here automatically when customer handover is confirmed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-kumo-canvas border-b border-kumo-line text-kumo-subtle uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Delivered Time</th>
                      <th className="py-3 px-4">Order Ref</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Delivery Address</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4 text-right">Delivery Fee</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-kumo-line">
                    {filteredCompletedOrders.map(order => (
                      <tr key={order.id} className="hover:bg-kumo-canvas/50 transition">
                        <td className="py-3.5 px-4 font-medium text-kumo-strong whitespace-nowrap">
                          {order.delivered_at || `${order.dispatch_date} (Delivered)`}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-kumo-strong whitespace-nowrap">
                          #{order.order_ref}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-medium text-kumo-strong block">{order.customer_name}</span>
                          <span className="text-[11px] text-kumo-subtle">{order.phone}</span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-kumo-default" title={order.address}>
                          {order.address}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-kumo-subtle" title={order.items_summary}>
                          {order.items_summary || 'Smokey meal package'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          +{formatNaira(order.delivery_fee)}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            <Check className="w-3 h-3" />
                            Delivered
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: EARNINGS & PAYMENTS (WALLET)                           */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            {/* Wallet Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-kumo-surface border border-kumo-line rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-semibold text-kumo-subtle uppercase tracking-wider block">
                  Outstanding Balance
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-kumo-strong mt-2">
                  {formatNaira(pendingPayoutBalance)}
                </div>
                <div className="mt-2 text-xs">
                  {pendingPayoutBalance === 0 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Account fully settled
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      Pending management disbursement
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-kumo-surface border border-kumo-line rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-semibold text-kumo-subtle uppercase tracking-wider block">
                  Lifetime Historically Settled
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-kumo-strong mt-2">
                  {formatNaira(currentRider?.paid_total ?? 1183000)}
                </div>
                <span className="text-xs text-kumo-subtle mt-2 block">
                  Cumulative disbursements cleared to rider bank account
                </span>
              </div>

              <div className="bg-kumo-surface border border-kumo-line rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-semibold text-kumo-subtle uppercase tracking-wider block">
                  Total Gross Earned
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
                  {formatNaira(lifetimeEarned)}
                </div>
                <span className="text-xs text-kumo-subtle mt-2 block">
                  Sum of historical paid total + current pending payout
                </span>
              </div>
            </div>

            {/* Account Status / Settled Ledger Banner */}
            {pendingPayoutBalance === 0 ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 text-emerald-800 dark:text-emerald-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Account settled — outstanding balance is ₦0.00</h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed">
                      All completed trips have been disbursed and audited. Settled historical payment records and receipts are kept securely in management finance logs.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-kumo-surface border border-kumo-line rounded-2xl p-5 shadow-xs">
                <h4 className="font-bold text-sm text-kumo-strong mb-3">Pending Trip Earnings Ledger</h4>
                <div className="divide-y divide-kumo-line">
                  {completedOrders.slice(0, 5).map(o => (
                    <div key={o.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-kumo-strong">Order #{o.order_ref}</span>
                        <span className="text-kumo-subtle ml-2">{o.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-600">+{formatNaira(o.delivery_fee)}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          Pending Payout
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Security Invariant (Spec 2.3) */}
            <div className="bg-kumo-canvas border border-kumo-line rounded-2xl p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <h4 className="font-bold text-kumo-strong">
                    Financial Policy & RBAC Invariant (can_clear_payment: false)
                  </h4>
                  <p className="text-kumo-subtle mt-1 leading-relaxed">
                    Per Smokey Hut Enterprise Operations Security, fleet delivery riders cannot self-clear or approve their own commission balances. Cash remittances and weekly bank transfers are audited and disbursed exclusively by Store Administrators or Logistics Managers on the central dispatch directory.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: SHIFT DUTIES & VEHICLE CHECKLIST (TASKS)               */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="bg-kumo-surface border border-kumo-line rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-kumo-strong">
                    Shift Duties & Daily Vehicle Safety Checklist
                  </h3>
                  <p className="text-xs text-kumo-subtle mt-0.5">
                    Operational protocols required for fleet riders before, during, and after dispatch runs.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-kumo-canvas text-kumo-subtle border border-kumo-line self-start sm:self-auto font-medium">
                  {riderAssignedTasks.filter(t => t.status === 'done').length} of {riderAssignedTasks.length} Completed
                </span>
              </div>

              <div className="space-y-3">
                {riderAssignedTasks.map(task => {
                  const isDone = task.status === 'done'
                  const isInProgress = task.status === 'in_progress'

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition ${
                        isDone
                          ? 'bg-kumo-canvas/40 border-kumo-line/60 opacity-80'
                          : isInProgress
                            ? 'bg-primary/5 border-primary/20'
                            : 'bg-kumo-canvas border-kumo-line'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => updateRiderTask(task.id, isDone ? 'pending' : 'done')}
                            className="mt-0.5 text-kumo-subtle hover:text-primary transition"
                          >
                            {isDone ? (
                              <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Square className="w-5 h-5 text-kumo-subtle" />
                            )}
                          </button>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-mono font-semibold text-kumo-subtle">
                                {task.task_ref}
                              </span>
                              <h4 className={`text-xs font-bold ${isDone ? 'line-through text-kumo-subtle' : 'text-kumo-strong'}`}>
                                {task.title}
                              </h4>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                                task.priority === 'urgent'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                  : task.priority === 'normal'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                    : 'bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                              }`}>
                                {task.priority}
                              </span>
                            </div>

                            {task.description && (
                              <p className="text-xs text-kumo-subtle mt-1 leading-relaxed">
                                {task.description}
                              </p>
                            )}

                            <div className="flex items-center gap-3 mt-2 text-[11px] text-kumo-subtle">
                              <span>Due: <strong>{task.due_date}</strong></span>
                              <span>•</span>
                              <span>Status: <strong className="capitalize">{task.status.replace('_', ' ')}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Status Toggle Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {task.status !== 'done' && (
                            <button
                              type="button"
                              onClick={() => updateRiderTask(task.id, 'done')}
                              className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                            >
                              Complete
                            </button>
                          )}
                          {task.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => updateRiderTask(task.id, 'in_progress')}
                              className="px-2.5 py-1 text-xs font-medium bg-kumo-canvas hover:bg-kumo-surface text-kumo-strong border border-kumo-line rounded-lg transition"
                            >
                              Start
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DECLINE DELIVERY (Spec 4.4)                            */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        isOpen={declineTargetOrder !== null}
        onClose={() => setDeclineTargetOrder(null)}
        title="Decline Delivery Order"
        maxWidth="md"
      >
        <div className="space-y-4 font-sans text-xs">
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-amber-800 dark:text-amber-200">
            <p className="font-semibold">
              Declining Order #{declineTargetOrder?.order_ref}
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
              This order will immediately return to the central Logistics Dispatch Board under <em>Awaiting Assignment</em> for re-dispatch to another fleet rider or 3PL courier.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-kumo-strong mb-1.5">
              Reason for Declining:
            </label>
            <select
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="w-full text-xs bg-kumo-canvas text-kumo-strong border border-kumo-line rounded-lg p-2.5 font-medium focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <option value="Bike mechanical issue / flat tire">Bike mechanical issue / flat tire</option>
              <option value="Outside current delivery zone">Outside current operational delivery zone</option>
              <option value="Delivery bag at full capacity">Delivery bag at full capacity / overloaded</option>
              <option value="Severe weather / impassable road">Severe weather / impassable flooded road</option>
              <option value="Personal / health emergency">Personal / health emergency</option>
              <option value="Other / custom reason">Other reason (describe below)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-kumo-strong mb-1.5">
              Additional Dispatch Notes (Optional):
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Chain snapped on Lekki-Ikoyi link bridge, waiting for repair..."
              value={customDeclineNotes}
              onChange={(e) => setCustomDeclineNotes(e.target.value)}
              className="w-full text-xs bg-kumo-canvas text-kumo-strong border border-kumo-line rounded-lg p-2.5 focus:outline-hidden focus:ring-1 focus:ring-primary placeholder:text-kumo-subtle/70"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-kumo-line">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeclineTargetOrder(null)}
            >
              Keep Assignment
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDecline}
            >
              Confirm Decline
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CONFIRM DELIVERY HANDOVER (Spec 4.3)                   */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        isOpen={confirmDeliveryTarget !== null}
        onClose={() => setConfirmDeliveryTarget(null)}
        title="Confirm Customer Handover"
        maxWidth="md"
      >
        <div className="space-y-4 font-sans text-xs">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl text-emerald-800 dark:text-emerald-200">
            <h4 className="font-bold text-sm">
              Deliver Order #{confirmDeliveryTarget?.order_ref}?
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
              Customer: <strong>{confirmDeliveryTarget?.customer_name}</strong> ({confirmDeliveryTarget?.phone})
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
              Address: {confirmDeliveryTarget?.address}
            </p>
          </div>

          <div className="p-3 bg-kumo-canvas border border-kumo-line rounded-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="text-kumo-subtle">Commission Credited:</span>
              <span className="font-bold text-emerald-600 text-sm">
                +{formatNaira(confirmDeliveryTarget?.delivery_fee || 0)}
              </span>
            </div>
            <p className="text-[11px] text-kumo-subtle mt-1">
              The fee will be auto-credited to your outstanding wallet balance and moved to your Delivered Orders archive.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-kumo-line">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeliveryTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => confirmDeliveryTarget && handleConfirmDelivered(confirmDeliveryTarget)}
            >
              Confirm Delivered
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default RiderDashboardPage
