import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { MetricCard } from '@/components/ui/MetricCard'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { SingleDatePicker } from '@/components/ui/SingleDatePicker'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { StatusBadge, BadgeStatus } from '@/components/ui/Badge'
import { useSmokeyOps, getOfficeOpeningHourForDate, OPS_FRESH_START_CUTOFF, resolveOrderItemsSummary } from '@/context/SmokeyOpsContext'
import { supabase } from '@/lib/supabase'
import { SEED_WEBSITE_ORDERS } from '@/lib/smokeyData'
import { formatNaira, formatDate, cleanOrderNotes, parseOrderNotes, cn } from '@/lib/utils'
import {
  ShoppingBag,
  DollarSign,
  Truck,
  CheckCircle2,
  Clock,
  Eye,
  ArrowRight,
  ExternalLink,
  Plus,
  RefreshCw,
  Phone,
  MapPin,
  FileText,
  Search,
  X,
  Loader2,
  Calendar,
  Sparkles,
  ChevronRight,
  Receipt,
  User,
  UtensilsCrossed,
  CreditCard,
  Package,
  Printer,
  Volume2,
  VolumeX
} from 'lucide-react'
import { playOrderRingtone5s, stopOrderRingtone, isOrderRingtonePlaying } from '@/lib/notificationAudio'
import { getCanonicalOrderRef, extractNumericOrderId, deduplicateByOrderRef } from '@/lib/orderCanonical'

export interface WebsiteOrder {
  id: string | number
  order_ref: string
  customer_name: string
  customer_email?: string
  phone: string
  address: string
  items_summary: string
  raw_items?: any[]
  total_amount: number
  delivery_fee: number
  channel: string
  payment_status: 'paid' | 'pending' | 'refunded'
  payment_method?: string
  fulfillment_status: 'in_intake' | 'packaging' | 'ready_for_dispatch' | 'in_transit' | 'delivered'
  created_at: string
  scheduled_delivery_at: string
  paid_at?: string
  rider_name: string
  notes: string
}

// Helper to highlight matching characters in auto-complete suggestions
export const highlightSearchMatch = (text: string, query: string) => {
  if (!query || !query.trim() || !text) return text
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <span
            key={i}
            className="bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold px-0.5 rounded"
          >
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  )
}

// Convert raw Supabase orders + order_items records into typed WebsiteOrder objects
export const mapSupabaseOrderToWebsiteOrder = (raw: any): WebsiteOrder => {
  const status = String(raw.delivery_status || raw.status || '').toLowerCase()
  let fulfillment_status: WebsiteOrder['fulfillment_status'] = 'in_intake'
  if (status.includes('deliver') || status.includes('collect') || Boolean(raw.delivered_at)) {
    fulfillment_status = 'delivered'
  } else if (status.includes('transit') || status.includes('dispatch') || status.includes('shipped') || status.includes('out_for_delivery') || status.includes('on_road')) {
    fulfillment_status = 'in_transit'
  } else if (status.includes('ready') || status.includes('packed') || status.includes('packaged')) {
    fulfillment_status = 'ready_for_dispatch'
  } else if (status.includes('pack') || status.includes('process') || status.includes('prep') || status.includes('cook') || status.includes('paid')) {
    fulfillment_status = 'packaging'
  } else {
    fulfillment_status = 'in_intake'
  }

  const items = resolveOrderItemsSummary(raw)

  let channel = 'Website Storefront'
  if (raw.traffic_source) {
    channel = raw.traffic_source
  } else if (raw.notes && raw.notes.includes('[via WhatsApp Menu]')) {
    channel = 'WhatsApp Store'
  } else if (raw.notes && raw.notes.includes('[via Walk-in POS]')) {
    channel = 'Walk-in POS'
  } else if (raw.channel === 'storefront') {
    channel = 'Website Storefront'
  }

  const isPaid = Boolean(raw.paid_at) || raw.status === 'processing' || raw.status === 'delivered' || raw.status === 'paid'

  let scheduledAt = raw.scheduled_delivery_date ? String(raw.scheduled_delivery_date) : ''
  if (!scheduledAt && raw.notes && raw.notes.includes('[Scheduled Delivery:')) {
    const match = raw.notes.match(/\[Scheduled Delivery:\s*([^\]]+)\]/)
    if (match && match[1]) {
      scheduledAt = match[1].trim()
    }
  }

  const canonicalRef = getCanonicalOrderRef(raw)
  const numericId = extractNumericOrderId(raw.id ?? canonicalRef, 10000)

  return {
    id: numericId,
    order_ref: canonicalRef,
    customer_name: raw.customer_name || 'Storefront Customer',
    customer_email: raw.customer_email || '',
    phone: raw.customer_phone || 'N/A',
    address: raw.delivery_address || 'Storefront Counter Pickup',
    items_summary: items,
    raw_items: Array.isArray(raw.order_items) ? raw.order_items : [],
    total_amount: Number(raw.total) || 0,
    delivery_fee: Number(raw.delivery_fee) || 0,
    channel,
    payment_status: isPaid ? 'paid' : (raw.status === 'cancelled' ? 'refunded' : 'pending'),
    payment_method: raw.payment_method || raw.payment_channel || 'Paystack',
    fulfillment_status,
    created_at: raw.created_at || raw.scheduled_delivery_date || new Date().toISOString(),
    scheduled_delivery_at: scheduledAt,
    paid_at: raw.paid_at || '',
    rider_name: raw.rider_name || (raw.delivery_status ? 'Assigned Rider' : 'Pending Rider'),
    notes: raw.notes || ''
  }
}

// Escape user-supplied text before injecting it into the receipt HTML document
const escapeReceiptHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

// Build receipt line items from raw_items, falling back to parsing items_summary ("2x Item + 1x Other")
const buildReceiptLineItems = (order: WebsiteOrder): Array<{ name: string; qty: number; amount: number | null }> => {
  if (Array.isArray(order.raw_items) && order.raw_items.length > 0 && !order.raw_items.some((i: any) => i.name === 'Walk-in Order' || i.name === 'Standard Order')) {
    return order.raw_items.map((item: any) => {
      const qty = Number(item.qty) || 1
      const price = Number(item.price)
      return {
        name: item.name || 'Smokey Product',
        qty,
        amount: Number.isFinite(price) && price > 0 ? price * qty : null
      }
    })
  }

  const rawSummary = (order.items_summary || '').trim()
  const effectiveSummary = (rawSummary === 'Walk-in Order' || rawSummary === 'Standard Order' || !rawSummary)
    ? resolveOrderItemsSummary(order)
    : rawSummary

  const parts = effectiveSummary
    .split(' + ')
    .map(p => p.trim())
    .filter(Boolean)
  const parsed = parts.map(part => {
    const match = part.match(/^(\d+)\s*x\s*(.+)$/i)
    return match
      ? { name: match[2].trim(), qty: Number(match[1]) || 1 }
      : { name: part, qty: 1 }
  })

  // Without per-item prices, show the full subtotal against a single line; otherwise leave amounts blank
  const subtotal = Math.max((Number(order.total_amount) || 0) - (Number(order.delivery_fee) || 0), 0)
  return parsed.map(p => ({
    ...p,
    amount: parsed.length === 1 && subtotal > 0 ? subtotal : null
  }))
}

// Opens a print-ready receipt window, auto-triggers the native print/PDF dialog and leaves an
// interactive preview (Print / Save as PDF, Close, Back to orders) once that dialog is dismissed.
export const printOrderReceipt = (order: WebsiteOrder) => {
  const naira = (n: number) => '₦' + Math.round(Number(n) || 0).toLocaleString()
  const lineItems = buildReceiptLineItems(order)
  const deliveryFee = Number(order.delivery_fee) || 0
  const total = Number(order.total_amount) || 0
  const itemsTotal = lineItems.reduce((s, i) => s + (i.amount || 0), 0)
  const subtotal = itemsTotal > 0 ? itemsTotal : Math.max(total - deliveryFee, 0)

  const created = order.created_at ? new Date(order.created_at) : null
  const dateStr = created && !isNaN(created.getTime())
    ? created.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '-'

  const paymentMethod = (order.payment_method || 'Paystack')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())

  const origin = window.location.origin
  const logoUrl = `${origin}/logo.svg`
  const ordersUrl = `${origin}/sales/orders`
  const parsedNotes = parseOrderNotes(order.notes)

  const itemRows = lineItems.map(item => `
        <tr>
          <td class="item-name">${escapeReceiptHtml(item.name)}</td>
          <td class="item-qty">${item.qty}</td>
          <td class="item-amount">${item.amount !== null ? naira(item.amount) : '—'}</td>
        </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Receipt ${escapeReceiptHtml(order.order_ref)} — Smokeyhut Delight</title>
  <style>
    :root {
      --font-sf-display: "SF Pro Display", -apple-system, BlinkMacSystemFont, "SF Pro", "Helvetica Neue", sans-serif;
      --font-sf-text: "SF Pro Text", -apple-system, BlinkMacSystemFont, "SF Pro", "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: #f0f0f3; }
    body {
      font-family: var(--font-sf-text);
      color: #18181b;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      font-kerning: normal;
      text-rendering: optimizeLegibility;
    }
    .toolbar {
      position: sticky; top: 0; z-index: 10;
      display: flex; gap: 8px; align-items: center;
      padding: 12px 24px;
      background: #ffffff;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }
    .btn {
      font-family: var(--font-sf-text);
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      height: 36px; padding: 0 14px;
      font-size: 13px; font-weight: 500; line-height: 1;
      border-radius: 8px; cursor: pointer; user-select: none;
      border: 1px solid rgba(24, 24, 27, 0.12);
      background: #ffffff; color: #18181b;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      transition: background-color 150ms ease, border-color 150ms ease, opacity 150ms ease;
    }
    .btn:hover { background: #f4f4f5; }
    .btn:active { background: #e4e4e7; }
    .btn:focus-visible { outline: 2px solid #c0201f; outline-offset: 2px; }
    .btn-primary {
      background: #c0201f;
      border-color: #c0201f;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #a01a19;
      border-color: #a01a19;
    }
    .btn-primary:active {
      opacity: 0.9;
    }
    .sheet-wrap { display: flex; justify-content: center; padding: 28px 16px 48px; }
    .receipt {
      font-family: var(--font-sf-text);
      width: 148mm; max-width: 100%;
      padding: 10mm 12mm 12mm;
      font-size: 12px; color: #18181b; background: #ffffff;
      border: 1px solid #e4e4e7;
      border-radius: 12px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    .center { text-align: center; }
    .logo { width: 32mm; height: auto; display: block; margin: 0 auto 2mm; }
    .sub { font-size: 11px; color: #71717a; margin-top: 0.8mm; line-height: 1.4; }
    .divider { border: none; border-top: 1px solid #e4e4e7; margin: 3.5mm 0; }
    .divider-solid { border: none; border-top: 1px solid #d4d4d8; margin: 3.5mm 0; }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .meta-right {
      text-align: right;
    }
    .meta-date {
      font-family: var(--font-sf-text);
      font-size: 12px;
      font-weight: 500;
      color: #18181b;
    }
    .label {
      font-size: 10px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; color: #71717a; margin-bottom: 0.8mm;
    }
    .value {
      font-family: var(--font-sf-display);
      font-size: 14px; font-weight: 600; color: #18181b; letter-spacing: -0.01em;
    }
    .customer-name {
      font-size: 13px; font-weight: 600; color: #18181b;
    }
    .text { font-size: 12px; font-weight: 400; color: #27272a; line-height: 1.45; }
    .block { margin-bottom: 3mm; }
    .block:last-of-type { margin-bottom: 0; }
    table {
      width: 100%; border-collapse: collapse;
      border-top: 1px solid #e4e4e7; border-bottom: 1px solid #e4e4e7;
      margin: 3.5mm 0;
    }
    thead tr {
      background: #fafafa;
      border-bottom: 1px solid #e4e4e7;
    }
    th {
      font-family: var(--font-sf-text);
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; color: #71717a; padding: 2.2mm 2mm;
    }
    tbody tr { border-bottom: 1px solid #f4f4f5; }
    tbody tr:last-child { border-bottom: none; }
    td {
      font-family: var(--font-sf-text);
      font-size: 12px; padding: 2.4mm 2mm; vertical-align: middle;
    }
    .item-name { text-align: left; font-weight: 500; color: #18181b; padding-left: 2.5mm; }
    .item-qty { width: 16mm; text-align: right; font-weight: 400; color: #27272a; }
    .item-amount { width: 28mm; text-align: right; font-weight: 400; color: #27272a; padding-right: 2.5mm; }
    .row {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 12px; color: #52525b; margin-bottom: 1.8mm;
    }
    .row span:last-child { color: #18181b; font-weight: 500; }
    .row.total {
      font-family: var(--font-sf-display);
      font-size: 14px; font-weight: 700; color: #18181b;
      letter-spacing: -0.01em; margin: 0;
    }
    .row.total span:last-child {
      font-size: 15px; font-weight: 700; color: #18181b;
    }
    .footer {
      font-size: 11px; color: #71717a; text-align: center; line-height: 1.6;
    }
    .footer strong { color: #18181b; font-weight: 600; }
    @media print {
      @page { size: A5 portrait; margin: 0; }
      html, body { background: #ffffff; }
      .no-print { display: none !important; }
      .sheet-wrap { padding: 0; }
      .receipt { border: none; border-radius: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <button type="button" class="btn btn-primary" id="btn-print">Print / Save as PDF</button>
    <button type="button" class="btn" id="btn-close">Close</button>
    <button type="button" class="btn" id="btn-back">Back to orders</button>
  </div>

  <div class="sheet-wrap">
    <div class="receipt">
      <div class="center">
        <img src="${logoUrl}" class="logo" alt="Smokeyhut Delight" onerror="this.style.display='none'" />
        <div class="sub">13 McNeil St, Yaba, Lagos</div>
        <div class="sub">smokeyhutdelight.com</div>
      </div>

      <hr class="divider" />

      <div class="meta-row">
        <div>
          <div class="label">Receipt</div>
          <div class="value">${escapeReceiptHtml(order.order_ref)}</div>
        </div>
        <div class="meta-right">
          <div class="label">Date</div>
          <div class="meta-date">${escapeReceiptHtml(dateStr)}</div>
        </div>
      </div>

      <hr class="divider" />

      <div class="block">
        <div class="label">Customer</div>
        <div class="customer-name">${escapeReceiptHtml(order.customer_name)}</div>
        ${order.phone && order.phone !== 'N/A' ? `<div class="sub">${escapeReceiptHtml(order.phone)}</div>` : ''}
        ${order.customer_email ? `<div class="sub">${escapeReceiptHtml(order.customer_email)}</div>` : ''}
      </div>
      <div class="block">
        <div class="label">Delivery Address</div>
        <div class="text">${escapeReceiptHtml(order.address || '—')}</div>
        ${parsedNotes.deliveryNote ? `
          <div style="margin-top: 5px; padding: 5px 8px; background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 6px;">
            <div style="font-size: 8px; font-weight: 700; text-transform: uppercase; color: #52525b; letter-spacing: 0.05em; margin-bottom: 2px;">Delivery Note</div>
            <div style="font-size: 11px; font-weight: 600; color: #18181b; line-height: 1.4;">${escapeReceiptHtml(parsedNotes.deliveryNote)}</div>
          </div>
        ` : ''}
      </div>
      <div class="block">
        <div class="label">Payment</div>
        <div class="text">${escapeReceiptHtml(paymentMethod)}</div>
      </div>
      ${order.channel ? `<div class="block">
        <div class="label">Channel</div>
        <div class="text">${escapeReceiptHtml(order.channel)}</div>
      </div>` : ''}

      <table>
        <thead>
          <tr>
            <th class="item-name">Item</th>
            <th class="item-qty">Qty</th>
            <th class="item-amount">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}
        </tbody>
      </table>

      <div class="row"><span>Subtotal</span><span>${naira(subtotal)}</span></div>
      <div class="row"><span>Delivery Fee</span><span>${deliveryFee > 0 ? naira(deliveryFee) : 'Free'}</span></div>

      <hr class="divider" />

      <div class="row total"><span>TOTAL PAID</span><span>${naira(total)}</span></div>

      <hr class="divider" />

      <div class="footer">
        <p><strong>Thank you for choosing Smokeyhut Delight!</strong></p>
      </div>
    </div>
  </div>

  <script>
    (function () {
      var ordersUrl = ${JSON.stringify(ordersUrl)};
      document.getElementById('btn-print').addEventListener('click', function () { window.print(); });
      document.getElementById('btn-close').addEventListener('click', function () {
        window.close();
        // Fallback when the browser refuses to close a tab it did not script-open
        setTimeout(function () { if (!window.closed) window.location.href = ordersUrl; }, 200);
      });
      document.getElementById('btn-back').addEventListener('click', function () {
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.focus();
            window.close();
            return;
          }
        } catch (e) {}
        window.location.href = ordersUrl;
      });
      var printed = false;
      function autoPrint() { if (printed) return; printed = true; setTimeout(function () { window.print(); }, 250); }
      if (document.readyState === 'complete') autoPrint();
      else window.addEventListener('load', autoPrint);
    })();
  </script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) {
    // Popup blocked — fall back to a blob URL in the same click flow
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.location.assign(url)
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
}

export const WebsiteOrdersPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    websiteOrders: orders,
    setWebsiteOrders: setOrders,
    refreshWebsiteOrders: fetchLiveOrders,
    isOrdersRefreshing: isRefreshing,
    logisticsDeliveries,
    packagingQueue,
    scheduledOrders,
    storePickups,
    rescheduleOrderDelivery,
    hasPermission
  } = useSmokeyOps()
  const canViewKPIs = hasPermission('perm_orders_kpi_view')
  const [loading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'all' | 'walkin_pos' | 'intake' | 'packaging' | 'transit' | 'delivered'>('all')
  const [selectedOrder, setSelectedOrder] = useState<WebsiteOrder | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isPlayingRingtone, setIsPlayingRingtone] = useState(false)

  const handleToggleTestRingtone = () => {
    if (isPlayingRingtone) {
      stopOrderRingtone()
      setIsPlayingRingtone(false)
    } else {
      playOrderRingtone5s()
      setIsPlayingRingtone(true)
      window.setTimeout(() => {
        setIsPlayingRingtone(false)
      }, 5000)
    }
  }

  // Reschedule / Schedule Delivery State
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('12:00')
  const [rescheduleDateTime, setRescheduleDateTime] = useState('')
  const [rescheduleNotes, setRescheduleNotes] = useState('')
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false)

  // Search State with Full Historical Supabase Querying & Autocomplete Suggestions
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSearchingBackend, setIsSearchingBackend] = useState(false)
  const [backendSuggestions, setBackendSuggestions] = useState<WebsiteOrder[]>([])
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Debounced Historical Backend Search (queries orders as far back as sales database inception)
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q || q.length < 2) {
      setBackendSuggestions([])
      setIsSearchingBackend(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearchingBackend(true)
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .is('deleted_at', null)
          .neq('status', 'pending_payment')
          .neq('status', 'cancelled')
          .neq('status', 'refunded')
          .not('paid_at', 'is', null)
          .or(`customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,delivery_address.ilike.%${q}%,id.ilike.%${q}%,notes.ilike.%${q}%`)
          .order('created_at', { ascending: false })
          .limit(50)
        if (!error && Array.isArray(data)) {
          const paidOrders = data
            .map(mapSupabaseOrderToWebsiteOrder)
            .filter(o => o.payment_status === 'paid' && (o.channel !== 'Website Storefront' || Boolean(o.paid_at)))
          setBackendSuggestions(paidOrders)
        }
      } catch (err) {
        console.warn('Historical search error:', err)
      } finally {
        setIsSearchingBackend(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Merge client-loaded orders and historical backend search results for instant autocomplete suggestions
  const suggestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return []

    const map = new Map<string, { order: WebsiteOrder; matchType: string; matchedValue: string }>()

    const evaluateOrder = (o: WebsiteOrder) => {
      // Invariant: Orders awaiting payment must never appear in website orders autocomplete suggestions
      if (o.payment_status !== 'paid') return
      if (o.channel === 'Website Storefront' && !o.paid_at) return

      const ref = getCanonicalOrderRef(o)
      if (!ref || map.has(ref)) return
      if (ref.toLowerCase().includes(q) || o.order_ref.toLowerCase().includes(q)) {
        map.set(ref, { order: o, matchType: 'Order ID', matchedValue: ref })
      } else if (o.customer_name.toLowerCase().includes(q)) {
        map.set(ref, { order: o, matchType: 'Customer', matchedValue: o.customer_name })
      } else if (o.phone.toLowerCase().includes(q)) {
        map.set(ref, { order: o, matchType: 'Phone', matchedValue: o.phone })
      } else if (o.items_summary.toLowerCase().includes(q)) {
        map.set(ref, { order: o, matchType: 'Product', matchedValue: o.items_summary })
      } else if (o.address.toLowerCase().includes(q)) {
        map.set(ref, { order: o, matchType: 'Address', matchedValue: o.address })
      } else if (o.notes.toLowerCase().includes(q)) {
        map.set(ref, { order: o, matchType: 'Notes', matchedValue: o.notes })
      }
    }

    // Client memory orders first
    orders.forEach(evaluateOrder)

    // Deep historical backend orders second
    backendSuggestions.forEach(evaluateOrder)

    return Array.from(map.values()).slice(0, 8)
  }, [searchQuery, orders, backendSuggestions])

  const handleSelectSuggestion = (order: WebsiteOrder) => {
    const canonicalRef = getCanonicalOrderRef(order)
    setSearchQuery(canonicalRef || order.order_ref)
    setIsSearchOpen(false)
    // If not in current orders list (e.g. from 6 months ago), prepend it so table displays it!
    setOrders((prev) => {
      if (prev.some((o) => getCanonicalOrderRef(o) === canonicalRef)) return prev
      return [order, ...prev]
    })
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        setIsSearchOpen(false)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions[activeSuggestionIndex]) {
        handleSelectSuggestion(suggestions[activeSuggestionIndex].order)
      } else {
        setIsSearchOpen(false)
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false)
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Enrich orders with live operational workflow state from SmokeyOpsContext (logistics, store pickup, packaging, and scheduled pipeline)
  const displayOrders = useMemo(() => {
    const deliveryMap = new Map(logisticsDeliveries.map(d => [getCanonicalOrderRef(d), d]))
    const pickupMap = new Map(storePickups.map(p => [getCanonicalOrderRef(p), p]))
    const packagingMap = new Map(packagingQueue.map(p => [getCanonicalOrderRef(p), p]))
    const scheduledMap = new Map(scheduledOrders.map(s => [getCanonicalOrderRef(s), s]))

    const uniqueOrders = deduplicateByOrderRef(orders)

    // CRITICAL INVARIANT: Orders awaiting payment should never appear on Website Orders page or tabs
    const confirmedPaidOrders = uniqueOrders.filter(ord => {
      if (ord.payment_status !== 'paid') return false
      if (ord.channel === 'Website Storefront' && !ord.paid_at) return false
      return true
    })

    const enriched = confirmedPaidOrders.map(ord => {
      const ref = getCanonicalOrderRef(ord)
      const activeDelivery = deliveryMap.get(ref)
      const activePickup = pickupMap.get(ref)
      const activePkg = packagingMap.get(ref)
      const activeSched = scheduledMap.get(ref)

      let fulfillment_status: WebsiteOrder['fulfillment_status'] = ord.fulfillment_status
      let rider_name = ord.rider_name

      if (activePickup && activePickup.order_status === 'collected') {
        fulfillment_status = 'delivered'
        rider_name = activePickup.collected_by
          ? `Collected by ${activePickup.collected_by}`
          : 'Store Pickup — Collected'
      } else if (activeDelivery) {
        if (activeDelivery.status === 'delivered') {
          fulfillment_status = 'delivered'
          rider_name = activeDelivery.assigned_rider || 'Delivered'
        } else if (activeDelivery.status === 'in_transit' || activeDelivery.status === 'out_for_delivery') {
          fulfillment_status = 'in_transit'
          rider_name = activeDelivery.assigned_rider || 'Assigned Rider'
        } else if (activeDelivery.status === 'assigned') {
          fulfillment_status = 'ready_for_dispatch'
          rider_name = activeDelivery.assigned_rider || 'Assigned Rider'
        } else if (activeDelivery.status === 'pending') {
          fulfillment_status = 'ready_for_dispatch'
          rider_name = 'Awaiting Rider Assignment'
        }
      } else if (ord.fulfillment_status === 'delivered') {
        fulfillment_status = 'delivered'
        if (!rider_name || rider_name === 'Pending Rider' || rider_name === 'Packaged — Ready for Dispatch') {
          rider_name = activePickup ? 'Store Pickup — Collected' : 'Delivered'
        }
      } else if (activePickup && activePickup.order_status === 'ready_for_pickup' && (!activePkg || activePkg.order_status === 'packaged')) {
        fulfillment_status = 'ready_for_dispatch'
        rider_name = 'Ready at Pickup Counter'
      } else if (activePkg) {
        if (activePkg.order_status === 'packaged') {
          fulfillment_status = 'ready_for_dispatch'
          rider_name = activePickup ? 'Ready at Pickup Counter' : 'Packaged — Ready for Dispatch'
        } else if (activePkg.order_status === 'in_packaging') {
          fulfillment_status = 'packaging'
          rider_name = 'Packing in Progress'
        } else if (activePkg.order_status === 'ready_for_fulfillment') {
          fulfillment_status = 'packaging'
          rider_name = 'Queued for Pack'
        }
      } else if (activeSched && activeSched.order_status === 'payment_confirmed') {
        fulfillment_status = 'in_intake'
        rider_name = 'Scheduled Pre-order'
      }

      return {
        ...ord,
        order_ref: ref || ord.order_ref,
        fulfillment_status,
        rider_name,
        scheduled_delivery_at: activeSched?.scheduled_delivery_at || ord.scheduled_delivery_at
      }
    })

    const enrichedRefs = new Set(enriched.map(o => getCanonicalOrderRef(o)))

    // Also include any confirmed scheduled pre-orders from scheduledOrders so they show under Order Intake
    scheduledOrders.forEach(so => {
      if (so.payment_status !== 'paid' && so.order_status !== 'payment_confirmed') return
      const schedRef = getCanonicalOrderRef(so)
      if (schedRef && !enrichedRefs.has(schedRef)) {
        enrichedRefs.add(schedRef)
        enriched.push({
          id: so.id,
          order_ref: schedRef,
          customer_name: so.customer_name,
          phone: so.phone,
          address: so.address,
          items_summary: so.notes || 'Scheduled Pre-order Feast',
          total_amount: so.total_amount,
          delivery_fee: so.delivery_fee,
          channel: 'Website Storefront',
          payment_status: so.payment_status,
          fulfillment_status: 'in_intake',
          created_at: so.scheduled_delivery_at,
          scheduled_delivery_at: so.scheduled_delivery_at,
          rider_name: 'Scheduled Pre-order',
          notes: so.notes
        })
      }
    })

    return enriched
  }, [orders, logisticsDeliveries, storePickups, packagingQueue, scheduledOrders])

  // Walk-in POS helper
  const isWalkInOrder = (o: WebsiteOrder) =>
    o.channel === 'Walk-in POS' ||
    Boolean(o.notes && o.notes.includes('[via Walk-in POS]')) ||
    o.payment_method === 'pos'

  // KPIs
  const totalOrdersCount = displayOrders.length
  const totalGrossRevenue = displayOrders.reduce((sum, ord) => sum + ord.total_amount, 0)
  const walkInCount = displayOrders.filter(isWalkInOrder).length
  const intakeCount = displayOrders.filter((o) => o.fulfillment_status === 'in_intake' && !isWalkInOrder(o)).length
  const activeFulfillmentCount = displayOrders.filter(
    (o) => (o.fulfillment_status === 'packaging' || o.fulfillment_status === 'ready_for_dispatch') && !isWalkInOrder(o)
  ).length
  const outForDeliveryCount = displayOrders.filter((o) => o.fulfillment_status === 'in_transit' && !isWalkInOrder(o)).length
  const deliveredCount = displayOrders.filter((o) => o.fulfillment_status === 'delivered').length

  // Filtered orders by tab
  const tabFilteredOrders = useMemo(() => {
    switch (activeTab) {
      case 'walkin_pos':
        return displayOrders.filter(isWalkInOrder)
      case 'intake':
        return displayOrders.filter((o) => o.fulfillment_status === 'in_intake' && !isWalkInOrder(o))
      case 'packaging':
        return displayOrders.filter((o) => (o.fulfillment_status === 'packaging' || o.fulfillment_status === 'ready_for_dispatch') && !isWalkInOrder(o))
      case 'transit':
        return displayOrders.filter((o) => o.fulfillment_status === 'in_transit' && !isWalkInOrder(o))
      case 'delivered':
        return displayOrders.filter((o) => o.fulfillment_status === 'delivered')
      default:
        return displayOrders
    }
  }, [displayOrders, activeTab])

  // Combined searched orders matching search query (includes live queue and historical database matches)
  const searchedOrders = useMemo(() => {
    if (!searchQuery.trim()) return tabFilteredOrders
    const q = searchQuery.toLowerCase().trim()
    const map = new Map<string, WebsiteOrder>()

    // 1. Live matching orders in active operational queues
    tabFilteredOrders.forEach((o) => {
      const ref = getCanonicalOrderRef(o)
      if (!ref) return
      if (
        ref.toLowerCase().includes(q) ||
        o.order_ref.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q) ||
        o.items_summary.toLowerCase().includes(q) ||
        o.channel.toLowerCase().includes(q) ||
        o.notes.toLowerCase().includes(q)
      ) {
        map.set(ref, o)
      }
    })

    // 2. Deep historical database matches (by Customer Name, Order ID, Phone, Address) — strictly paid
    backendSuggestions.forEach((bo) => {
      const ref = getCanonicalOrderRef(bo)
      if (ref && bo.payment_status === 'paid' && !map.has(ref)) {
        map.set(ref, bo)
      }
    })

    return Array.from(map.values())
  }, [tabFilteredOrders, searchQuery, backendSuggestions])

  const handleOpenDetails = async (order: WebsiteOrder) => {
    setSelectedOrder(order)
    setIsDetailsModalOpen(true)
    const ref = order.order_ref || `SHD-${order.id}`
    if (
      !order.raw_items ||
      order.raw_items.length === 0 ||
      order.raw_items.some((i: any) => !i.name || i.name === 'Walk-in Order' || i.name === 'Standard Order' || i.name === 'Smokey Product')
    ) {
      try {
        const { data, error } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', ref)
        if (!error && Array.isArray(data) && data.length > 0) {
          setSelectedOrder(prev => (prev && (prev.order_ref === ref || String(prev.id) === String(order.id))) ? {
            ...prev,
            raw_items: data
          } : prev)
        }
      } catch (err) {
        console.warn('Failed to fetch detailed order items on modal open:', err)
      }
    }
  }

  // Column definitions matching project DataTable standards
  const columns: ColumnDef<WebsiteOrder>[] = [
    {
      key: 'order_ref',
      header: 'Order Ref',
      defaultWidth: 120,
      accessor: (o) => (
        <span className="font-semibold text-xs text-kumo-strong font-mono">
          {o.order_ref}
        </span>
      ),
      sortValue: (o) => o.order_ref
    },
    {
      key: 'created_at',
      header: 'Date & Time',
      defaultWidth: 155,
      accessor: (o) => {
        const d = o.created_at ? new Date(o.created_at) : null
        const isValid = d && !isNaN(d.getTime())
        if (!isValid) return <span className="text-kumo-subtle text-xs">-</span>
        return (
          <div className="font-sans">
            <div className="font-medium text-xs text-kumo-strong">
              {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div className="text-[11px] text-kumo-subtle font-mono mt-0.5 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 shrink-0 opacity-70" />
              <span>{d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}</span>
            </div>
          </div>
        )
      },
      sortValue: (o) => new Date(o.created_at || 0).getTime()
    },
    {
      key: 'customer',
      header: 'Customer',
      defaultWidth: 190,
      accessor: (o) => (
        <div>
          <div className="font-medium text-xs text-kumo-strong">{o.customer_name}</div>
          <div className="text-[11px] text-kumo-subtle flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3 text-kumo-subtle shrink-0" />
            <span>{o.phone}</span>
          </div>
        </div>
      ),
      sortValue: (o) => o.customer_name
    },
    {
      key: 'items',
      header: 'Items Ordered',
      defaultWidth: 260,
      accessor: (o) => (
        <div>
          <span className="text-xs font-medium text-kumo-strong line-clamp-1">
            {o.items_summary}
          </span>
          <span className="text-[11px] text-kumo-subtle block">
            Channel: {o.channel}
          </span>
        </div>
      ),
      sortValue: (o) => o.items_summary
    },
    {
      key: 'address',
      header: 'Delivery Location',
      defaultWidth: 220,
      accessor: (o) => {
        const parsed = parseOrderNotes(o.notes)
        return (
          <div>
            <div className="flex items-start gap-1 text-xs text-kumo-default">
              <MapPin className="w-3.5 h-3.5 text-kumo-subtle shrink-0 mt-0.5" />
              <span className="line-clamp-1">{o.address}</span>
            </div>
            {parsed.deliveryNote && (
              <div className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate mt-0.5 flex items-center gap-1 font-sans" title={`Delivery Note: ${parsed.deliveryNote}`}>
                <FileText className="w-3 h-3 shrink-0 text-zinc-500" />
                <span className="truncate">Note: {parsed.deliveryNote}</span>
              </div>
            )}
          </div>
        )
      },
      sortValue: (o) => o.address
    },
    {
      key: 'amount',
      header: 'Amount',
      defaultWidth: 120,
      accessor: (o) => (
        <div className="text-right">
          <span className="font-semibold text-xs text-kumo-strong">
            {formatNaira(o.total_amount)}
          </span>
        </div>
      ),
      sortValue: (o) => o.total_amount
    },
    {
      key: 'payment',
      header: 'Payment',
      defaultWidth: 120,
      accessor: (o) => (
        <StatusBadge
          status={o.payment_status === 'paid' ? 'PAID' : 'PENDING'}
          label={o.payment_status === 'paid' ? 'Paid' : 'Pending'}
          size="sm"
        />
      ),
      sortValue: (o) => o.payment_status
    },
    {
      key: 'status',
      header: 'Fulfillment',
      defaultWidth: 155,
      accessor: (o) => {
        const stageMap: Record<string, { status: BadgeStatus | string; label: string }> = {
          in_intake: { status: 'ORDER_INTAKE', label: 'Order Intake' },
          packaging: { status: 'PACKAGING', label: 'Packaging' },
          ready_for_dispatch: { status: 'IN_TRANSIT', label: 'Ready for Dispatch' },
          in_transit: { status: 'IN_TRANSIT', label: 'In Transit' },
          delivered: { status: 'DELIVERED', label: 'Delivered' }
        }
        const config = stageMap[o.fulfillment_status] || { status: 'PACKAGING', label: 'Packaging' }
        return <StatusBadge status={config.status} label={config.label} size="sm" />
      },
      sortValue: (o) => o.fulfillment_status
    },
    {
      key: 'rider',
      header: 'Rider Assigned',
      defaultWidth: 160,
      accessor: (o) => (
        <span className="text-xs text-kumo-default truncate block">
          {o.rider_name}
        </span>
      ),
      sortValue: (o) => o.rider_name
    },
    {
      key: 'actions',
      header: 'Actions',
      defaultWidth: 140,
      accessor: (o) => (
        <div className="flex items-center gap-2">
          <TableActionButton
            variant="outline"
            onClick={() => handleOpenDetails(o)}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
          >
            Details
          </TableActionButton>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Page Header */}
      <PageHeader
        title="Orders"
        subtitle="Manage all customer orders across Website Storefront and Walk-in POS, track payment confirmation, and monitor live kitchen-to-doorstep dispatch."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleTestRingtone}
              leftIcon={isPlayingRingtone ? <VolumeX className="w-4 h-4 text-rose-500 animate-pulse" /> : <Volume2 className="w-4 h-4 text-zinc-500" />}
              className="h-10 px-3.5 text-sm font-medium shadow-xs cursor-pointer"
              title="Test the 5-second incoming order notification ringtone"
            >
              {isPlayingRingtone ? 'Stop Ringtone' : 'Test Ringtone (5s)'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/overview')}
              leftIcon={<ExternalLink className="w-4 h-4 text-blue-600" />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
              title="View the live interactive Order Tracking Diagram on Overview"
            >
              Order Flow Diagram
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => fetchLiveOrders(true)}
              disabled={isRefreshing}
              leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Live Orders'}
            </Button>
          </div>
        }
      />

      {/* 2. KPI Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Orders"
          value={loading ? '...' : totalOrdersCount}
          description="Consolidated customer orders"
          icon={<ShoppingBag className="w-4 h-4 text-primary" />}
          isLocked={!canViewKPIs}
          lockedMessage="Restricted Metric"
        />
        <MetricCard
          title="Total Gross Revenue"
          value={loading ? '...' : formatNaira(totalGrossRevenue)}
          description="Customer payment settlement"
          icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
          isLocked={!canViewKPIs}
          lockedMessage="Confidential Revenue"
        />
        <MetricCard
          title="Packaging Queue"
          value={loading ? '...' : activeFulfillmentCount}
          description="Orders being packed from sales stock"
          icon={<Package className="w-4 h-4 text-amber-500" />}
          variant="default"
          isLocked={!canViewKPIs}
          lockedMessage="Restricted Metric"
        />
        <MetricCard
          title="Out for Delivery"
          value={loading ? '...' : outForDeliveryCount}
          description="Active riders on transit"
          icon={<Truck className="w-4 h-4 text-blue-500" />}
          isLocked={!canViewKPIs}
          lockedMessage="Restricted Metric"
        />
      </div>

      {/* 3. Filter Tabs */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          tabs={[
            { id: 'all', label: 'All Orders', badge: totalOrdersCount },
            { id: 'walkin_pos', label: 'Walk-in POS', badge: walkInCount },
            {
              id: 'intake',
              label: 'Order Intake',
              badge: intakeCount
            },
            {
              id: 'packaging',
              label: 'Packaging Queue',
              badge: activeFulfillmentCount
            },
            {
              id: 'transit',
              label: 'Out for Delivery',
              badge: outForDeliveryCount
            },
            {
              id: 'delivered',
              label: 'Delivered',
              badge: deliveredCount
            }
          ]}
        />
      </div>

      {/* Active Query Filter Pill — Clean Desaturated Grey */}
      {searchQuery.trim() && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 font-sans shadow-2xs">
          <span className="flex items-center gap-1.5">
            <span>Showing results filtered across sales database for:</span>
            <strong className="underline underline-offset-2 font-semibold text-zinc-900 dark:text-zinc-100">"{searchQuery.trim()}"</strong>
            <span className="text-[11px] text-zinc-500 font-mono">({searchedOrders.length} orders found)</span>
          </span>
          <button
            onClick={() => {
              setSearchQuery('')
              setIsSearchOpen(false)
            }}
            className="text-xs font-semibold hover:underline flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Reset Search Filter
          </button>
        </div>
      )}

      {/* 4. DataTable with Unified Search Slot, Category filters, and Full Order Data */}
      <DataTable
        data={searchedOrders}
        keyExtractor={(o) => getCanonicalOrderRef(o)}
        columns={columns}
        onRowClick={handleOpenDetails}
        tableId="website_orders_table"
        exportFilename="website_orders.csv"
        emptyMessage={
          searchQuery.trim()
            ? `No orders found matching "${searchQuery}". Check spelling or search by Order ID (e.g. SHD-00002) or phone.`
            : "Live storefront orders will stream here in real time as customers order. Search by Customer Name, Order ID, or Phone above to view any historical record."
        }
        customSearchSlot={
          <div className="relative font-sans w-full" ref={searchContainerRef}>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setIsSearchOpen(true)
                  setActiveSuggestionIndex(0)
                }}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) setIsSearchOpen(true)
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search orders (ID, Customer, Phone, Items, Address)..."
                className="w-full h-10 pl-10 pr-24 text-sm rounded-lg ring ring-border/60 bg-background text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary transition-all font-sans"
              />

              <div className="absolute right-3 flex items-center gap-2">
                {isSearchingBackend && (
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
                    <span className="hidden sm:inline">Indexing...</span>
                  </span>
                )}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setIsSearchOpen(false)
                    }}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Autocomplete Dropdown with Highlighted Suggestions */}
            {isSearchOpen && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-800/40 px-3 font-sans">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Historical Sales Database Matches
                  </span>
                  <span>Use ↑ ↓ to navigate, Enter to view in table</span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 p-1">
                  {suggestions.map(({ order, matchType, matchedValue }, idx) => {
                    const isActive = idx === activeSuggestionIndex
                    return (
                      <div
                        key={getCanonicalOrderRef(order) || order.id}
                        onClick={() => handleSelectSuggestion(order)}
                        onMouseEnter={() => setActiveSuggestionIndex(idx)}
                        className={cn(
                          "p-3 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs",
                          isActive
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                        )}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              {matchType}
                            </span>
                            <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                              {highlightSearchMatch(matchedValue, searchQuery)}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2 truncate">
                            <span className="font-mono text-zinc-700 dark:text-zinc-300 font-medium">{order.order_ref}</span>
                            <span>•</span>
                            <span>{highlightSearchMatch(order.customer_name, searchQuery)}</span>
                            <span>•</span>
                            <span>{order.items_summary}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 font-mono">
                            {formatNaira(order.total_amount)}
                          </div>
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                            {formatDate(order.scheduled_delivery_at || order.created_at)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        }
      />

      {/* 5. Order Details Modal — Desaturated Grey Layout with Clean Aligned Rows */}
      {selectedOrder && (
        <Dialog
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Order Details: ${selectedOrder.order_ref}`}
          description="Detailed customer information, ordered product breakdown, and real-time fulfillment timeline."
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close
              </Button>
              <div className="flex items-center gap-2">
                {/* Only allow scheduling / rescheduling for orders that are not already out for delivery or delivered */}
                {hasPermission('perm_orders_status') && selectedOrder.fulfillment_status !== 'in_transit' && selectedOrder.fulfillment_status !== 'delivered' && (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      const initialDate = selectedOrder.scheduled_delivery_at
                        ? selectedOrder.scheduled_delivery_at.split('T')[0].split(' ')[0]
                        : new Date().toISOString().split('T')[0]
                      const initialTime = selectedOrder.scheduled_delivery_at && selectedOrder.scheduled_delivery_at.includes(':')
                        ? (selectedOrder.scheduled_delivery_at.split(' ')[1] || '12:00').substring(0, 5)
                        : '12:00'
                      setRescheduleDate(initialDate)
                      setRescheduleTime(initialTime)
                      setRescheduleDateTime(`${initialDate} ${initialTime}`)
                      setRescheduleNotes(cleanOrderNotes(selectedOrder.notes) || '')
                      setIsRescheduleModalOpen(true)
                    }}
                    leftIcon={<Calendar className="w-3.5 h-3.5 text-zinc-500" />}
                  >
                    {selectedOrder.scheduled_delivery_at ? 'Reschedule Delivery' : 'Schedule for Later'}
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => printOrderReceipt(selectedOrder)}
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                >
                  Print Receipt
                </Button>
              </div>
            </div>
          }
        >
          {(() => {
            const selectedOrderNotes = parseOrderNotes(selectedOrder.notes)
            return (
              <div className="space-y-4 font-sans text-xs">
            {/* Master Divided Card Container (Desaturated Grey matching Image 2) */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs">
              
              {/* Section 1: Order Information & Timestamps */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Order Information
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Order Reference</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-semibold">{selectedOrder.order_ref}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Date & Time</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                      {(() => {
                        const d = selectedOrder.created_at ? new Date(selectedOrder.created_at) : null
                        const isValid = d && !isNaN(d.getTime())
                        if (!isValid) return '-'
                        return `${d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}`
                      })()}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Payment Status</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 capitalize">
                      {selectedOrder.payment_status}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Fulfillment Stage</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                      {
                        selectedOrder.fulfillment_status === 'in_intake' ? 'Order Intake' :
                        selectedOrder.fulfillment_status === 'packaging' ? 'Packaging' :
                        selectedOrder.fulfillment_status === 'ready_for_dispatch' ? 'Ready for Dispatch' :
                        selectedOrder.fulfillment_status === 'in_transit' ? 'In Transit' : 'Delivered'
                      }
                    </span>
                  </div>
                  {selectedOrder.scheduled_delivery_at && (
                    <div className="flex items-start text-[13px]">
                      <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Delivery Timing</span>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                        <Calendar className="w-3 h-3 text-blue-500" />
                        Scheduled: {formatDate(selectedOrder.scheduled_delivery_at)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Sales Channel</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedOrder.channel}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Payment Method</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium capitalize">
                      {selectedOrder.payment_method || 'Paystack'}
                      {selectedOrder.paid_at && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal ml-2">
                          (Paid on {new Date(selectedOrder.paid_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })} at {new Date(selectedOrder.paid_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })})
                        </span>
                      )}
                    </span>
                  </div>
                  {selectedOrderNotes.transferName && (
                    <div className="flex items-start text-[13px]">
                      <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Transfer Sender</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                        {selectedOrderNotes.transferName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Customer & Delivery Details */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Customer & Destination
                  </span>
                  <a
                    href={`tel:${selectedOrder.phone}`}
                    className="inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium underline underline-offset-2"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call Customer</span>
                  </a>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Customer Name</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Phone Number</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono">{selectedOrder.phone}</span>
                  </div>
                  {selectedOrder.customer_email && (
                    <div className="flex items-start text-[13px]">
                      <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Email Address</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedOrder.customer_email}</span>
                    </div>
                  )}
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Delivery Address</span>
                    <span className="flex-1 text-zinc-900 dark:text-zinc-100 font-medium block leading-snug">{selectedOrder.address}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Delivery Note</span>
                    {selectedOrderNotes.deliveryNote ? (
                      <div className="flex-1 bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 rounded-lg p-2.5 text-zinc-900 dark:text-zinc-100">
                        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-semibold text-[11px] uppercase tracking-wider mb-1">
                          <FileText className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                          <span>Customer Instructions</span>
                        </div>
                        <p className="text-[12.5px] font-medium leading-relaxed whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">
                          {selectedOrderNotes.deliveryNote}
                        </p>
                      </div>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-500 italic text-[12px]">None</span>
                    )}
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Assigned Courier</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                      {selectedOrder.rider_name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Ordered Products */}
              {(() => {
                const displayItems = (selectedOrder.raw_items && selectedOrder.raw_items.length > 0 && !selectedOrder.raw_items.some((i: any) => i.name === 'Walk-in Order' || i.name === 'Standard Order'))
                  ? selectedOrder.raw_items
                  : buildReceiptLineItems(selectedOrder);
                return (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                        Ordered Products
                      </span>
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                        {displayItems.length} item(s)
                      </span>
                    </div>

                    <div className="pt-1">
                      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {displayItems.map((item: any, idx: number) => {
                          const itemPrice = item.price || item.amount;
                          return (
                            <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-[13px]">
                              <div className="flex items-center gap-2.5">
                                <span className="font-semibold text-zinc-700 dark:text-zinc-300 font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                  {item.qty || 1}x
                                </span>
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.name || 'Smokey Product'}</span>
                              </div>
                              {itemPrice && (
                                <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                  {formatNaira(item.price ? (item.qty || 1) * item.price : itemPrice)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Section 4: Billing Breakdown */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Billing & Payment
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Meals Subtotal</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-medium">
                      {formatNaira(Math.max(0, selectedOrder.total_amount - selectedOrder.delivery_fee))}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Delivery Fee</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-medium">
                      {selectedOrder.delivery_fee > 0 ? formatNaira(selectedOrder.delivery_fee) : 'Free Delivery'}
                    </span>
                  </div>
                  <div className="flex items-start text-[14px] pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-900 dark:text-zinc-100 font-semibold">Total Amount</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold text-base">
                      {formatNaira(selectedOrder.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 5: Order Notes (if present) */}
              {selectedOrderNotes.fullCleanNote && (
                <div className="p-4 space-y-2 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      Order Notes
                    </span>
                  </div>
                  <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed pt-0.5 whitespace-pre-wrap">
                    {selectedOrderNotes.fullCleanNote}
                  </p>
                </div>
              )}
            </div>
          </div>
            )
          })()}
        </Dialog>
      )}

      {/* Schedule / Reschedule Delivery Modal */}
      {selectedOrder && (
        <Dialog
          isOpen={isRescheduleModalOpen}
          onClose={() => setIsRescheduleModalOpen(false)}
          title={`Schedule Delivery: ${selectedOrder.order_ref}`}
          description="Assign or modify the scheduled delivery date for this order."
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="secondary"
                size="md"
                type="button"
                onClick={() => setIsRescheduleModalOpen(false)}
                disabled={isSubmittingSchedule}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                form="schedule-delivery-form"
                disabled={isSubmittingSchedule || !rescheduleDate}
                leftIcon={isSubmittingSchedule ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
              >
                {isSubmittingSchedule ? 'Saving...' : 'Save Schedule'}
              </Button>
            </div>
          }
        >
          <form
            id="schedule-delivery-form"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!rescheduleDate) return
              setIsSubmittingSchedule(true)
              const opening = getOfficeOpeningHourForDate(rescheduleDate)
              const timePart = rescheduleTime || opening.timeStr
              const success = await rescheduleOrderDelivery(
                selectedOrder.order_ref,
                rescheduleDate,
                timePart,
                rescheduleNotes,
                {
                  customer_name: selectedOrder.customer_name,
                  phone: selectedOrder.phone,
                  address: selectedOrder.address,
                  total_amount: selectedOrder.total_amount,
                  delivery_fee: selectedOrder.delivery_fee,
                  notes: selectedOrder.notes
                }
              )
              setIsSubmittingSchedule(false)
              if (success) {
                setSelectedOrder(prev => prev ? {
                  ...prev,
                  scheduled_delivery_at: `${rescheduleDate} ${timePart}`,
                  fulfillment_status: 'in_intake'
                } : null)
                setIsRescheduleModalOpen(false)
              }
            }}
            className="space-y-4 font-sans text-xs"
          >
            {/* Master Divided Card Container (stacked label and value) */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs">
              <div className="p-3.5 space-y-1">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400 font-normal">Customer</span>
                <span className="block text-zinc-900 dark:text-zinc-100 font-semibold text-[13px]">{selectedOrder.customer_name}</span>
              </div>
              <div className="p-3.5 space-y-1">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400 font-normal">Delivery Address</span>
                <span className="block text-zinc-900 dark:text-zinc-100 font-medium text-[13px] leading-snug">{selectedOrder.address}</span>
              </div>
              <div className="p-3.5 space-y-1">
                <span className="block text-xs text-zinc-500 dark:text-zinc-400 font-normal">Current Schedule</span>
                <span className="block text-zinc-900 dark:text-zinc-100 font-medium text-[13px]">
                  {selectedOrder.scheduled_delivery_at ? formatDate(selectedOrder.scheduled_delivery_at) : 'Immediate ASAP Fulfillment'}
                </span>
              </div>
            </div>

            <DateTimePicker
              label="Delivery Date & Time"
              value={rescheduleDateTime}
              onChange={(val, details) => {
                setRescheduleDateTime(val)
                if (details) {
                  setRescheduleDate(details.date)
                  setRescheduleTime(details.time)
                }
              }}
              helperText={rescheduleDate ? `Office Opening Time: ${getOfficeOpeningHourForDate(rescheduleDate).label} (Standard dispatch start)` : undefined}
              required
            />

            <Input
              label="Dispatch & Kitchen Notes (Optional)"
              value={rescheduleNotes}
              onChange={(e) => setRescheduleNotes(e.target.value)}
              placeholder="e.g. Deliver before 2pm for office party, ring doorbell on arrival."
            />
          </form>
        </Dialog>
      )}
    </div>
  )
}

export const OrdersPage = WebsiteOrdersPage
export default WebsiteOrdersPage
