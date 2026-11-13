import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { MetricCard } from '@/components/ui/MetricCard'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { StatusBadge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { formatNaira, formatDate } from '@/lib/utils'
import { getCanonicalOrderRef } from '@/lib/orderCanonical'
import {
  DollarSign,
  Landmark,
  Banknote,
  CreditCard,
  RefreshCw,
  Clock,
  Phone
} from 'lucide-react'

export interface PaymentRecord {
  id: string | number
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  paystack_ref?: string
  total: number
  delivery_fee?: number
  payment_method?: string
  status: string
  paid_at?: string
  created_at: string
  notes?: string
}

export const PaymentsPage: React.FC = () => {
  const { hasPermission, showToast, currentAccount } = useSmokeyOps()
  const isAdmin = currentAccount?.role === 'admin'
  const canViewKPIs = hasPermission('perm_orders_kpi_view')
  const canVerifyPayments = isAdmin || hasPermission('perm_payments_verify') || hasPermission('perm_finance')

  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [allTransactionsCount, setAllTransactionsCount] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeMethod, setActiveMethod] = useState<'all' | 'paystack' | 'bank_transfer' | 'cash' | 'pos'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null)

  const [kpis, setKpis] = useState({
    total: 0,
    bank_transfer: 0,
    cash: 0,
    pos: 0
  })

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      let q = supabase
        .from('orders')
        .select('id, customer_name, customer_email, customer_phone, paystack_ref, total, delivery_fee, payment_method, status, paid_at, created_at, notes', { count: 'exact' })
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1)

      if (activeMethod !== 'all') {
        if (activeMethod === 'paystack') {
          q = q.or('payment_method.eq.paystack,payment_method.eq.card,payment_method.eq.online')
        } else {
          q = q.eq('payment_method', activeMethod)
        }
      }

      if (search.trim()) {
        const s = search.trim().replace(/[,()]/g, '')
        q = q.or(`id.ilike.%${s}%,customer_name.ilike.%${s}%,customer_email.ilike.%${s}%,customer_phone.ilike.%${s}%,paystack_ref.ilike.%${s}%`)
      }

      const [ordersRes, kpisRes] = await Promise.all([
        q,
        canViewKPIs ? supabase.rpc('get_payment_kpis') : Promise.resolve({ data: null, error: null })
      ])

      if (ordersRes.error) throw ordersRes.error

      setPayments(ordersRes.data || [])
      setTotalCount(ordersRes.count || 0)
      if (activeMethod === 'all' && !search.trim()) {
        setAllTransactionsCount(ordersRes.count || 0)
      }

      if (canViewKPIs && kpisRes?.data) {
        setKpis(kpisRes.data)
      } else if (canViewKPIs) {
        // Fallback KPI summation from confirmed orders
        const { data: confirmed } = await supabase
          .from('orders')
          .select('total, payment_method')
          .is('deleted_at', null)
          .in('status', ['processing', 'shipped', 'delivered', 'paid'])
          .not('paid_at', 'is', null)

        if (confirmed) {
          const sum = (m: string) => confirmed.filter(p => (p.payment_method || '').toLowerCase() === m).reduce((s, p) => s + Number(p.total || 0), 0)
          setKpis({
            total: confirmed.reduce((s, p) => s + Number(p.total || 0), 0),
            bank_transfer: sum('bank_transfer'),
            cash: sum('cash'),
            pos: sum('pos')
          })
        }
      }
    } catch (err: any) {
      console.warn('Failed to load payments:', err)
      showToast(err.message || 'Error loading payments', 'error', 'Payments')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeMethod, search, page, perPage, canViewKPIs, showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const columns: ColumnDef<PaymentRecord>[] = [
    {
      key: 'id',
      header: 'Order Reference',
      defaultWidth: 150,
      accessor: (p) => {
        const ref = getCanonicalOrderRef(p)
        return (
          <span className="font-semibold text-xs text-kumo-strong font-mono">
            {ref}
          </span>
        )
      },
      sortValue: (p) => getCanonicalOrderRef(p)
    },
    {
      key: 'created_at',
      header: 'Date & Time',
      defaultWidth: 150,
      accessor: (p) => {
        const d = p.created_at ? new Date(p.created_at) : null
        if (!d || isNaN(d.getTime())) return <span className="text-zinc-400">-</span>
        return (
          <div className="font-sans">
            <div className="text-xs text-kumo-strong font-medium">
              {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div className="text-[11px] text-kumo-subtle font-mono flex items-center gap-1 mt-0.5">
              <Clock className="w-2.5 h-2.5 opacity-70" />
              <span>{d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
            </div>
          </div>
        )
      },
      sortValue: (p) => new Date(p.created_at || 0).getTime()
    },
    {
      key: 'customer',
      header: 'Customer',
      defaultWidth: 200,
      accessor: (p) => (
        <div>
          <div className="font-semibold text-xs text-kumo-strong">
            {p.customer_name || 'Customer'}
          </div>
          {p.customer_phone && (
            <div className="text-[11px] text-kumo-subtle flex items-center gap-1 mt-0.5 font-mono">
              <Phone className="w-2.5 h-2.5 shrink-0" />
              <span>{p.customer_phone}</span>
            </div>
          )}
          {p.customer_email && (
            <div className="text-[11px] text-zinc-500 truncate mt-0.5">
              {p.customer_email}
            </div>
          )}
        </div>
      ),
      sortValue: (p) => p.customer_name || ''
    },
    {
      key: 'method',
      header: 'Payment Channel',
      defaultWidth: 150,
      accessor: (p) => {
        const raw = (p.payment_method || 'Paystack').toLowerCase()
        const methodLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
          paystack: { label: 'Paystack Online', icon: CreditCard },
          card: { label: 'Online Card', icon: CreditCard },
          bank_transfer: { label: 'Bank Transfer', icon: Landmark },
          pos: { label: 'POS Terminal', icon: CreditCard },
          cash: { label: 'Cash Counter', icon: Banknote },
        }
        const cfg = methodLabels[raw] || { label: p.payment_method || 'Online', icon: CreditCard }
        const IconComponent = cfg.icon
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium border border-zinc-200 dark:border-zinc-700">
            <IconComponent className="w-3 h-3 text-zinc-500 shrink-0" />
            <span>{cfg.label}</span>
          </span>
        )
      },
      sortValue: (p) => p.payment_method || ''
    },
    {
      key: 'amount',
      header: 'Total Paid',
      defaultWidth: 130,
      accessor: (p) => (
        <div className="text-right">
          <span className="font-bold text-xs text-kumo-strong font-mono">
            {formatNaira(p.total)}
          </span>
        </div>
      ),
      sortValue: (p) => p.total
    },
    {
      key: 'status',
      header: 'Payment Status',
      defaultWidth: 130,
      accessor: (p) => {
        const isPaid = Boolean(p.paid_at) || ['processing', 'shipped', 'delivered', 'paid'].includes(p.status)
        const isCancelled = p.status === 'cancelled'
        if (isCancelled) {
          return <StatusBadge status="FAILED" label="Cancelled" size="sm" />
        }
        if (p.status === 'pending_payment') {
          return <StatusBadge status="PENDING" label="Unpaid" size="sm" />
        }
        if (isPaid) {
          return <StatusBadge status="PAID" label="Paid" size="sm" />
        }
        return <StatusBadge status="PENDING" label="Pending Verification" size="sm" />
      },
      sortValue: (p) => p.status
    },
    {
      key: 'reference',
      header: 'Gateway Reference',
      defaultWidth: 180,
      accessor: (p) => {
        if (p.paystack_ref) {
          return (
            <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300 truncate block">
              {p.paystack_ref}
            </span>
          )
        }
        return <span className="text-zinc-400 text-xs">—</span>
      }
    }
  ]

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Header */}
      <PageHeader
        title="Payments & Transactions"
        subtitle="Audited ledger of customer payments across Paystack online checkout, in-store POS terminals, bank transfers, and counter cash."
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
              {refreshing ? 'Refreshing...' : 'Refresh Payments'}
            </Button>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Gross Revenue"
          value={loading ? '...' : formatNaira(kpis.total)}
          description="Total confirmed customer settlement"
          icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
          isLocked={!canViewKPIs}
          lockedMessage="Confidential Revenue"
        />
        <MetricCard
          title="Bank Transfer"
          value={loading ? '...' : formatNaira(kpis.bank_transfer)}
          description="Manual bank transfer receipts"
          icon={<Landmark className="w-4 h-4 text-amber-500" />}
          isLocked={!canViewKPIs}
          lockedMessage="Confidential Revenue"
        />
        <MetricCard
          title="Counter Cash"
          value={loading ? '...' : formatNaira(kpis.cash)}
          description="Physical cash drawer intake"
          icon={<Banknote className="w-4 h-4 text-rose-500" />}
          isLocked={!canViewKPIs}
          lockedMessage="Confidential Revenue"
        />
        <MetricCard
          title="In-Store POS"
          value={loading ? '...' : formatNaira(kpis.pos)}
          description="Card POS counter terminals"
          icon={<CreditCard className="w-4 h-4 text-blue-500" />}
          isLocked={!canViewKPIs}
          lockedMessage="Confidential Revenue"
        />
      </div>

      {/* 3. Method Filter Tabs */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeMethod}
          onChange={(val) => {
            setActiveMethod(val as any)
            setPage(1)
          }}
          tabs={[
            { id: 'all', label: 'All Transactions', badge: allTransactionsCount || undefined },
            { id: 'paystack', label: 'Paystack Online' },
            { id: 'bank_transfer', label: 'Bank Transfer' },
            { id: 'pos', label: 'POS Terminal' },
            { id: 'cash', label: 'Cash at Counter' }
          ]}
        />
      </div>

      {/* 4. DataTable with Built-in Search & Precision Date Filtering */}
      <DataTable
        data={payments}
        keyExtractor={(p) => String(p.id)}
        columns={columns}
        onRowClick={(p) => setSelectedPayment(p)}
        tableId="payments_table"
        exportFilename="payments_transactions.csv"
        searchable={true}
        onSearchChange={(q) => {
          setSearch(q)
          setPage(1)
        }}
        serverTotalCount={totalCount}
        currentPage={page}
        itemsPerPage={perPage}
        onPageChange={setPage}
        onItemsPerPageChange={(limit) => {
          setPerPage(limit)
          setPage(1)
        }}
        isLoading={loading || refreshing}
        itemsPerPageOptions={[10, 25, 50, 100]}
        emptyMessage="No transaction records match the specified filters."
      />

      {/* 5. Payment Details Modal */}
      {selectedPayment && (
        <Dialog
          isOpen={Boolean(selectedPayment)}
          onClose={() => setSelectedPayment(null)}
          title={`Payment Details: ${getCanonicalOrderRef(selectedPayment)}`}
          description="Audited transaction details, payment gateway verification, and settlement breakdown."
          maxWidth="xl"
          footer={
            <div className="flex items-center justify-end w-full">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setSelectedPayment(null)}
              >
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4 font-sans text-xs">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs">
              <div className="p-4 space-y-3">
                <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block">
                  Transaction Summary
                </span>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Order Reference</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold text-[13px]">
                      {getCanonicalOrderRef(selectedPayment)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Total Settlement</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold text-[14px]">
                      {formatNaira(selectedPayment.total)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Payment Method</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium text-[13px] capitalize">
                      {selectedPayment.payment_method || 'Online'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px] mb-1">Payment Status</span>
                    {(() => {
                      const isPaid = Boolean(selectedPayment.paid_at) || ['processing', 'shipped', 'delivered', 'paid'].includes(selectedPayment.status)
                      const isCancelled = selectedPayment.status === 'cancelled'
                      if (isCancelled) {
                        return <StatusBadge status="FAILED" label="Cancelled" size="sm" />
                      }
                      if (selectedPayment.status === 'pending_payment') {
                        return <StatusBadge status="PENDING" label="Unpaid" size="sm" />
                      }
                      if (isPaid) {
                        return <StatusBadge status="PAID" label="Paid" size="sm" />
                      }
                      return <StatusBadge status="PENDING" label="Pending" size="sm" />
                    })()}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block">
                  Gateway & Verification Timestamps
                </span>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Paystack Reference</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono text-xs truncate block">
                      {selectedPayment.paystack_ref || 'None (Direct In-Store)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Paid At Timestamp</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono text-xs block">
                      {selectedPayment.paid_at ? formatDate(selectedPayment.paid_at) : 'Awaiting Payment'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Initiated Date</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono text-xs block">
                      {formatDate(selectedPayment.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block">
                  Payer Information
                </span>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Customer Name</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium text-[13px]">
                      {selectedPayment.customer_name || 'Customer'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Phone Number</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono text-xs">
                      {selectedPayment.customer_phone || 'None'}
                    </span>
                  </div>
                  {selectedPayment.customer_email && (
                    <div className="col-span-2">
                      <span className="text-zinc-500 block text-[11px]">Email Address</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-mono text-xs">
                        {selectedPayment.customer_email}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}

export default PaymentsPage

