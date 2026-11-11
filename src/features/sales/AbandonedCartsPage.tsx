import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { MetricCard } from '@/components/ui/MetricCard'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { StatusBadge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { formatNaira, formatDate } from '@/lib/utils'
import { parseCartSessionAttribution, ParsedAttribution } from '@/lib/cartAttribution'
import {
  ShoppingCart,
  DollarSign,
  TrendingDown,
  CheckCircle2,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  Search,
  RefreshCw,
  ExternalLink,
  User,
  AlertCircle,
  Eye,
  Trash2,
  Check,
  Globe,
  Tag,
  ArrowRight,
  Filter
} from 'lucide-react'

const PER_PAGE = 30

export interface CartSession {
  session_id: string
  customer_name?: string
  customer_phone?: string
  customer_email?: string
  delivery_zone?: string
  delivery_address?: string
  cart_total: number
  item_count: number
  items: any[] | string
  stage: string
  recovered: boolean
  order_id?: string
  last_active_at?: string
  created_at: string
  metadata?: any
}

export function safeItems(rawItems: any): Array<{ name: string; qty: number; price: number; id?: string }> {
  if (Array.isArray(rawItems)) return rawItems
  if (typeof rawItems === 'string') {
    try {
      const parsed = JSON.parse(rawItems)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

export function normalizeNigerianPhone(phone: string): string {
  if (!phone) return ''
  let cleaned = String(phone).replace(/\D/g, '')
  if (cleaned.startsWith('2340') && cleaned.length === 14) {
    return '234' + cleaned.slice(4)
  }
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return '234' + cleaned.slice(1)
  }
  if (cleaned.startsWith('234') && cleaned.length === 13) {
    return cleaned
  }
  if (cleaned.length === 10) {
    return '234' + cleaned
  }
  return cleaned
}

function timeAgo(dateString?: string): string {
  if (!dateString) return '—'
  const now = new Date()
  const date = new Date(dateString)
  const diffInSec = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diffInSec < 60) return 'Just now'
  if (diffInSec < 3600) return `${Math.floor(diffInSec / 60)}m ago`
  if (diffInSec < 86400) return `${Math.floor(diffInSec / 3600)}h ago`
  if (diffInSec < 604800) return `${Math.floor(diffInSec / 86400)}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export const AbandonedCartsPage: React.FC = () => {
  const { hasPermission, showToast, currentAccount } = useSmokeyOps()
  const canViewKPIs = hasPermission('perm_orders_kpi_view')
  const isAdmin = currentAccount?.role === 'admin'
  const canManage = isAdmin || hasPermission('perm_orders_status')

  const [stats, setStats] = useState({
    total_sessions: 0,
    converted_sessions: 0,
    abandoned_sessions: 0,
    abandonment_rate: 0,
    lost_revenue: 0,
    recoverable_count: 0,
    recovered_count: 0,
    recovered_revenue: 0,
    stages: { cart: 0, checkout: 0, contact_captured: 0, payment_pending: 0, converted: 0, recovered: 0 },
    funnel: { cart_created: 0, checkout_reached: 0, contact_captured: 0, payment_started: 0, converted: 0 }
  })

  const [records, setRecords] = useState<CartSession[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'abandoned' | 'recoverable' | 'checkout' | 'contact_captured' | 'payment_pending' | 'recovered' | 'all'>('abandoned')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedSession, setSelectedSession] = useState<CartSession | null>(null)
  const [deletingSession, setDeletingSession] = useState<CartSession | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      // 1. Fetch KPI Stats
      const { data: statsData, error: statsError } = await supabase.rpc('get_abandoned_cart_stats', {
        p_start: null,
        p_end: null
      })

      if (!statsError && statsData) {
        setStats(statsData)
      }

      // 2. Fetch Paginated Records via RPC
      const offset = (page - 1) * PER_PAGE
      const { data: listData, error: listError } = await supabase.rpc('get_abandoned_cart_list', {
        p_start: null,
        p_end: null,
        p_filter: activeTab,
        p_search: search || null,
        p_limit: PER_PAGE,
        p_offset: offset,
        p_source: sourceFilter,
      })

      if (!listError && listData) {
        setRecords(listData.data || listData.records || [])
        setTotalCount(listData.total || 0)
        return
      }

      // 3. Resilient Fallback: Direct table query if RPC encounters any issue
      let query = supabase
        .from('cart_sessions')
        .select('*', { count: 'exact' })

      if (activeTab === 'abandoned') {
        query = query.neq('stage', 'converted')
      } else if (activeTab === 'recoverable') {
        query = query.neq('stage', 'converted').or('customer_phone.not.is.null,customer_email.not.is.null')
      } else if (activeTab === 'recovered') {
        query = query.eq('recovered', true)
      } else if (activeTab !== 'all') {
        query = query.eq('stage', activeTab)
      }

      if (search && search.trim()) {
        const s = search.trim()
        query = query.or(`customer_name.ilike.%${s}%,customer_phone.ilike.%${s}%,customer_email.ilike.%${s}%,session_id.ilike.%${s}%`)
      }

      query = query
        .order('last_active_at', { ascending: false })
        .range(offset, offset + PER_PAGE - 1)

      const { data: fallbackRows, count, error: fallbackError } = await query

      if (fallbackError) {
        throw fallbackError
      }

      if (fallbackRows) {
        setRecords(fallbackRows as CartSession[])
        setTotalCount(count || fallbackRows.length)
      }
    } catch (err: any) {
      console.warn('Failed to load abandoned carts data:', err)
      showToast(err.message || 'Error loading carts', 'error', 'Abandoned Carts')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeTab, sourceFilter, search, page, showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleToggleRecovered = async (session: CartSession, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!canManage) {
      showToast('You do not have permission to modify cart recovery status.', 'error', 'Permission Denied')
      return
    }
    const newStatus = !session.recovered
    setTogglingId(session.session_id)
    try {
      const { error: rpcErr } = await supabase.rpc('toggle_cart_recovered', {
        p_session_id: session.session_id,
        p_recovered: newStatus
      })
      if (rpcErr) {
        const { error: updErr } = await supabase
          .from('cart_sessions')
          .update({ recovered: newStatus })
          .eq('session_id', session.session_id)
        if (updErr) throw updErr
      }
      showToast(`Cart marked as ${newStatus ? 'Recovered' : 'Open'}`, 'success', 'Cart Status')
      setRecords(prev => prev.map(r => r.session_id === session.session_id ? { ...r, recovered: newStatus } : r))
      if (selectedSession?.session_id === session.session_id) {
        setSelectedSession(prev => prev ? { ...prev, recovered: newStatus } : null)
      }
      fetchData(true)
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error', 'Recovery Update Error')
    } finally {
      setTogglingId(null)
    }
  }

  const executeDelete = async () => {
    if (!isAdmin) {
      showToast('Only administrators can delete cart records.', 'error', 'Permission Denied')
      return
    }
    if (!deletingSession) return
    setIsDeleting(true)
    try {
      const { error: rpcError } = await supabase.rpc('delete_cart_session', {
        p_session_id: deletingSession.session_id
      })

      if (rpcError) {
        const { error: delError } = await supabase
          .from('cart_sessions')
          .delete()
          .eq('session_id', deletingSession.session_id)
        if (delError) throw delError
      }

      showToast('The cart session has been permanently removed.', 'success', 'Cart Deleted')
      setRecords(prev => prev.filter(r => r.session_id !== deletingSession.session_id))
      setTotalCount(prev => Math.max(0, prev - 1))
      if (selectedSession?.session_id === deletingSession.session_id) {
        setSelectedSession(null)
      }
      setDeletingSession(null)
    } catch (err: any) {
      showToast(err.message || 'Could not delete cart record.', 'error', 'Delete Failed')
    } finally {
      setIsDeleting(false)
    }
  }

  const openWhatsAppOutreach = (session: CartSession, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!session.customer_phone) return
    const phone = normalizeNigerianPhone(session.customer_phone)
    if (!phone) {
      showToast('No valid Nigerian phone number found for this lead.', 'error', 'Invalid Phone')
      return
    }

    const rawName = session.customer_name?.trim()
    const isGuest = !rawName || rawName.toLowerCase().startsWith('guest')
    const firstName = isGuest ? 'there' : rawName.split(' ')[0]
    const items = safeItems(session.items)
    const itemsList = items.map(i => `${i.qty}x ${i.name}`).slice(0, 3).join(', ')

    const siteUrl = 'https://smokeyhutdelight.com'
    const wave = '\u{1F44B}'
    const chicken = '\u{1F357}'
    const sparkle = '\u{2728}'

    const msg = [
      `Hello ${firstName}! ${wave}`,
      '',
      `This is Smokeyhut Delight. We noticed you left some delicious items in your cart (${itemsList || 'Smokeyhut Order'}${items.length > 3 ? '...' : ''}).`,
      '',
      'Would you like help completing your order or delivery? You can also complete it here anytime:',
      `${siteUrl}/checkout`,
      '',
      `Let us know if you have any questions! ${chicken}${sparkle}`
    ].join('\n')

    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Funnel conversion percentages
  const funnelCart = stats.funnel?.cart_created ?? stats.total_sessions ?? 0
  const funnelCheckout = stats.funnel?.checkout_reached ?? 0
  const funnelContact = stats.funnel?.contact_captured ?? 0
  const funnelPending = stats.funnel?.payment_started ?? 0
  const funnelConverted = stats.funnel?.converted ?? stats.converted_sessions ?? 0

  const getPercent = (count: number) => {
    if (!funnelCart || funnelCart === 0) return 0
    return Math.min(100, Math.max(0, Math.round((count / funnelCart) * 100)))
  }

  const columns: ColumnDef<CartSession>[] = [
    {
      key: 'customer',
      header: 'Customer Lead',
      defaultWidth: 200,
      accessor: (r) => (
        <div>
          <div className="font-semibold text-xs text-kumo-strong">
            {r.customer_name || 'Guest Visitor'}
          </div>
          {r.customer_phone ? (
            <div className="text-[11px] text-kumo-subtle flex items-center gap-1 mt-0.5 font-mono">
              <Phone className="w-2.5 h-2.5 shrink-0" />
              <span>{r.customer_phone}</span>
            </div>
          ) : (
            <div className="text-[11px] text-zinc-400 italic">No phone captured</div>
          )}
          {r.customer_email && (
            <div className="text-[11px] text-zinc-500 truncate mt-0.5">
              {r.customer_email}
            </div>
          )}
        </div>
      ),
      sortValue: (r) => r.customer_name || 'Guest'
    },
    {
      key: 'items',
      header: 'Cart Items',
      defaultWidth: 250,
      accessor: (r) => {
        const items = safeItems(r.items)
        const summary = items.map(i => `${i.qty}x ${i.name}`).join(' + ') || `${r.item_count} item(s)`
        return (
          <div>
            <span className="text-xs font-medium text-kumo-strong line-clamp-1">
              {summary}
            </span>
            <span className="text-[11px] text-kumo-subtle block">
              {items.length} item line(s) · Zone: {r.delivery_zone || 'Standard'}
            </span>
          </div>
        )
      },
      sortValue: (r) => r.item_count
    },
    {
      key: 'amount',
      header: 'Cart Total',
      defaultWidth: 120,
      accessor: (r) => (
        <div className="text-right">
          <span className="font-semibold text-xs text-kumo-strong font-mono">
            {formatNaira(r.cart_total)}
          </span>
        </div>
      ),
      sortValue: (r) => r.cart_total
    },
    {
      key: 'stage',
      header: 'Abandonment Stage',
      defaultWidth: 160,
      accessor: (r) => {
        const stageLabels: Record<string, { label: string; status: any }> = {
          cart: { label: 'Cart Created', status: 'DEFAULT' },
          cart_created: { label: 'Cart Created', status: 'DEFAULT' },
          checkout: { label: 'Checkout Reached', status: 'WARNING' },
          contact_captured: { label: 'Contact Captured', status: 'INFO' },
          payment_pending: { label: 'Payment Awaiting', status: 'WARNING' },
          converted: { label: 'Converted', status: 'SUCCESS' }
        }
        const s = stageLabels[r.stage] || { label: r.stage || 'Cart', status: 'DEFAULT' }
        return <StatusBadge status={s.status} label={s.label} size="sm" />
      },
      sortValue: (r) => r.stage
    },
    {
      key: 'source',
      header: 'Traffic Source',
      defaultWidth: 150,
      accessor: (r) => {
        const attr = parseCartSessionAttribution(r)
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{ backgroundColor: attr.bg, color: attr.color, border: `1px solid ${attr.border}` }}
          >
            {attr.badgeText}
          </span>
        )
      }
    },
    {
      key: 'last_active',
      header: 'Last Active',
      defaultWidth: 130,
      accessor: (r) => (
        <div className="font-sans">
          <div className="text-xs text-kumo-strong font-medium">
            {timeAgo(r.last_active_at || r.created_at)}
          </div>
          <div className="text-[11px] text-kumo-subtle font-mono">
            {formatDate(r.created_at).split(' at ')[0]}
          </div>
        </div>
      ),
      sortValue: (r) => new Date(r.last_active_at || r.created_at).getTime()
    },
    {
      key: 'status',
      header: 'Recovery',
      defaultWidth: 120,
      accessor: (r) => (
        <StatusBadge
          status={r.recovered ? 'PAID' : 'PENDING'}
          label={r.recovered ? 'Recovered' : 'Open Lead'}
          size="sm"
        />
      ),
      sortValue: (r) => (r.recovered ? 1 : 0)
    },
    {
      key: 'actions',
      header: 'Actions',
      defaultWidth: 180,
      accessor: (r) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <TableActionButton
            variant="outline"
            onClick={() => setSelectedSession(r)}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
          >
            Details
          </TableActionButton>
          {r.customer_phone && (
            <TableActionButton
              variant="primary"
              onClick={(e) => openWhatsAppOutreach(r, e)}
              leftIcon={<MessageCircle className="w-3.5 h-3.5" />}
              title="Open WhatsApp Outreach"
            >
              WhatsApp
            </TableActionButton>
          )}
          {isAdmin && (
            <TableActionButton
              variant="outline"
              onClick={() => setDeletingSession(r)}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              title="Delete Cart Session"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </TableActionButton>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Header */}
      <PageHeader
        title="Abandoned Carts & Leads"
        subtitle="Recover high-intent visitors who added delicacies to their cart, monitor drop-off stages, and conduct instant WhatsApp outreach."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              leftIcon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
            >
              {refreshing ? 'Refreshing...' : 'Refresh Carts'}
            </Button>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Lost Revenue"
          value={loading ? '...' : formatNaira(stats.lost_revenue)}
          description="Potential cart gross uncollected"
          icon={<TrendingDown className="w-4 h-4 text-rose-500" />}
          isLocked={!canViewKPIs}
          lockedMessage="Restricted Revenue"
        />
        <MetricCard
          title="Abandonment Rate"
          value={loading ? '...' : `${stats.abandonment_rate}%`}
          description={`${stats.abandoned_sessions} abandoned of ${stats.total_sessions}`}
          icon={<ShoppingCart className="w-4 h-4 text-amber-500" />}
          isLocked={!canViewKPIs}
          lockedMessage="Restricted Metric"
        />
        <MetricCard
          title="Recoverable Leads"
          value={loading ? '...' : stats.recoverable_count}
          description="Carts with phone / email captured"
          icon={<Phone className="w-4 h-4 text-blue-500" />}
          isLocked={!canViewKPIs}
          lockedMessage="Restricted Metric"
        />
        <MetricCard
          title="Recovered Revenue"
          value={loading ? '...' : formatNaira(stats.recovered_revenue)}
          description={`${stats.recovered_count} recovered orders`}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          isLocked={!canViewKPIs}
          lockedMessage="Restricted Metric"
        />
      </div>

      {/* 3. Funnel Progression Overview */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-2xs font-sans">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>Checkout Funnel Progression</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Visitor transition from cart initialization to verified storefront payment settlement.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <span className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">1. Cart Started</span>
            <span className="block text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">{funnelCart}</span>
            <span className="block text-[11px] text-zinc-400 mt-0.5">100% baseline</span>
          </div>
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <span className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">2. Checkout</span>
            <span className="block text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">{funnelCheckout}</span>
            <span className="block text-[11px] text-zinc-500 mt-0.5">{getPercent(funnelCheckout)}% reached</span>
          </div>
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <span className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">3. Contact Lead</span>
            <span className="block text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">{funnelContact}</span>
            <span className="block text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">{getPercent(funnelContact)}% reachable</span>
          </div>
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <span className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">4. Paystack Start</span>
            <span className="block text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">{funnelPending}</span>
            <span className="block text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">{getPercent(funnelPending)}% initiated</span>
          </div>
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
            <span className="block text-[11px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">5. Converted</span>
            <span className="block text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-1 font-mono">{funnelConverted}</span>
            <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">{getPercent(funnelConverted)}% paid</span>
          </div>
        </div>
      </div>

      {/* 4. Stage Filter Tabs */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val) => {
            setActiveTab(val as any)
            setPage(1)
          }}
          tabs={[
            { id: 'abandoned', label: 'All Abandoned', badge: stats.abandoned_sessions || undefined },
            { id: 'recoverable', label: 'Recoverable Leads', badge: stats.recoverable_count || undefined },
            { id: 'checkout', label: 'Checkout Step', badge: stats.stages?.checkout || undefined },
            { id: 'contact_captured', label: 'Contact Captured', badge: stats.stages?.contact_captured || undefined },
            { id: 'payment_pending', label: 'Payment Pending', badge: stats.stages?.payment_pending || undefined },
            { id: 'recovered', label: 'Recovered', badge: stats.recovered_count || undefined },
            { id: 'all', label: 'All Sessions', badge: stats.total_sessions || undefined }
          ]}
        />
      </div>

      {/* 5. Main DataTable */}
      <DataTable
        data={records}
        keyExtractor={(r) => r.session_id}
        columns={columns}
        onRowClick={(r) => setSelectedSession(r)}
        tableId="abandoned_carts_table"
        exportFilename="abandoned_carts.csv"
        searchable={true}
        onSearchChange={(q) => {
          setSearch(q)
          setPage(1)
        }}
        emptyMessage="No cart sessions match the current stage filter. As visitors browse and initiate checkouts, abandoned sessions stream here in real time."
      />

      {/* 6. Cart Session Details Modal */}
      {selectedSession && (
        <Dialog
          isOpen={Boolean(selectedSession)}
          onClose={() => setSelectedSession(null)}
          title={`Cart Session Details`}
          description={`Session ID: ${selectedSession.session_id}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setSelectedSession(null)}
              >
                Close
              </Button>
              <div className="flex items-center gap-2">
                {selectedSession.customer_phone && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={(e) => openWhatsAppOutreach(selectedSession, e)}
                    leftIcon={<MessageCircle className="w-3.5 h-3.5" />}
                  >
                    Send WhatsApp Outreach
                  </Button>
                )}
                {canManage && (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={(e) => handleToggleRecovered(selectedSession, e)}
                    disabled={togglingId === selectedSession.session_id}
                  >
                    {selectedSession.recovered ? 'Mark as Unrecovered' : 'Mark as Recovered'}
                  </Button>
                )}
              </div>
            </div>
          }
        >
          {(() => {
            const items = safeItems(selectedSession.items)
            const attr = parseCartSessionAttribution(selectedSession)
            return (
              <div className="space-y-4 font-sans text-xs">
                {/* Customer Information */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs">
                  <div className="p-4 space-y-3">
                    <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block">
                      Lead Contact Information
                    </span>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-zinc-500 block text-[11px]">Customer Name</span>
                        <span className="text-zinc-900 dark:text-zinc-100 font-semibold text-[13px]">
                          {selectedSession.customer_name || 'Guest Visitor'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[11px]">Phone Number</span>
                        <span className="text-zinc-900 dark:text-zinc-100 font-mono font-medium text-[13px]">
                          {selectedSession.customer_phone || 'None provided'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[11px]">Email Address</span>
                        <span className="text-zinc-900 dark:text-zinc-100 font-medium text-[13px]">
                          {selectedSession.customer_email || 'None provided'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[11px]">Delivery Location</span>
                        <span className="text-zinc-900 dark:text-zinc-100 font-medium text-[13px]">
                          {selectedSession.delivery_address || selectedSession.delivery_zone || 'Standard'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attribution Source */}
                  <div className="p-4 space-y-2">
                    <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block">
                      Traffic & Marketing Attribution
                    </span>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-zinc-500 block text-[11px]">Traffic Channel</span>
                        <span className="text-zinc-900 dark:text-zinc-100 font-medium text-[13px]">
                          {attr.badgeText}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[11px]">Platform</span>
                        <span className="text-zinc-900 dark:text-zinc-100 font-medium text-[13px]">
                          {attr.platform}
                        </span>
                      </div>
                      {attr.campaign && (
                        <div>
                          <span className="text-zinc-500 block text-[11px]">UTM Campaign</span>
                          <span className="text-zinc-900 dark:text-zinc-100 font-mono text-xs">{attr.campaign}</span>
                        </div>
                      )}
                      {attr.clickId && (
                        <div>
                          <span className="text-zinc-500 block text-[11px]">Ad Click ID</span>
                          <span className="text-zinc-900 dark:text-zinc-100 font-mono text-xs truncate block">{attr.clickId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                        Cart Delicacies ({items.length} items)
                      </span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                        Total: {formatNaira(selectedSession.cart_total)}
                      </span>
                    </div>

                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden">
                      {items.map((item, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[11px] flex items-center justify-center font-mono">
                              {item.qty}
                            </span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100 text-xs">
                              {item.name}
                            </span>
                          </div>
                          <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                            {formatNaira(Number(item.price || 0) * Number(item.qty || 1))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </Dialog>
      )}

      {/* 7. Delete Confirmation Modal */}
      {deletingSession && (
        <Dialog
          isOpen={Boolean(deletingSession)}
          onClose={() => setDeletingSession(null)}
          title="Delete Abandoned Cart Record"
          description="Are you sure you want to permanently delete this cart session? This action cannot be undone."
          maxWidth="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setDeletingSession(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="md"
                onClick={executeDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Cart'}
              </Button>
            </div>
          }
        >
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-300 text-xs font-sans">
            Session ID: <strong className="font-mono">{deletingSession.session_id}</strong>
            <br />
            Customer: <strong>{deletingSession.customer_name || 'Guest'}</strong> (Total: {formatNaira(deletingSession.cart_total)})
          </div>
        </Dialog>
      )}
    </div>
  )
}

export default AbandonedCartsPage

