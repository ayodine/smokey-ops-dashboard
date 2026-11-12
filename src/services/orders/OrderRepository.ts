import { supabase } from '@/lib/supabase'
import { getCanonicalOrderRef, extractNumericOrderId } from '@/lib/orderCanonical'
import type { AuthoritativeOrder, OrderLifecycleUpdates } from './OrderTypes'
import { OrderCache } from './OrderCache'

const ORDER_SELECT_COLUMNS = [
  'id',
  'customer_id',
  'store_id',
  'customer_name',
  'customer_phone',
  'customer_email',
  'delivery_address',
  'delivery_zone',
  'total',
  'delivery_fee',
  'base_delivery_fee',
  'status',
  'payment_method',
  'payment_channel',
  'paid_at',
  'paystack_ref',
  'notes',
  'channel',
  'created_at',
  'updated_at',
  'deleted_at',
  'scheduled_delivery_date',
  'delivery_status',
  'delivery_rescheduled_at',
  'delivery_rescheduled_by',
  'rider_name',
  'rider_id',
  'rider_type',
  'third_party_provider',
  'booked_fee',
  'fee_evidence_path',
  'fee_verify_status',
  'packaging_status',
  'packaged_at',
  'packaged_by',
  'pickup_at',
  'delivered_at',
  'order_items(id, order_id, product_id, name, qty, price, is_preorder, preorder_release_date)'
].join(',')

/**
 * OrderRepository
 * Central authoritative order access and mutation layer.
 * Guarantees that any order can be retrieved and actioned regardless of age or frontend state.
 */
export class OrderRepository {
  /**
   * Authoritative lookup by canonical order reference or database ID.
   * Checks structured OrderCache first, then directly queries PostgreSQL.
   */
  static async getOrderById(idOrRef: string | number): Promise<AuthoritativeOrder | null> {
    if (!idOrRef) return null
    const canonicalRef = getCanonicalOrderRef(idOrRef)
    const rawStr = String(idOrRef).trim()

    // 0. Check structured IndexedDB cache first
    try {
      const cached = await OrderCache.getOrder(idOrRef)
      if (cached && cached.isFresh) {
        return cached.record.payload
      }
    } catch (err) {
      console.warn('[OrderRepository] Cache check skipped:', err)
    }

    try {
      // 1. Primary lookup by canonical order reference (e.g. "SHD-11383")
      if (canonicalRef) {
        const { data, error } = await supabase
          .from('orders')
          .select(ORDER_SELECT_COLUMNS)
          .eq('id', canonicalRef)
          .is('deleted_at', null)
          .maybeSingle()

        if (!error && data) {
          const authOrder = data as unknown as AuthoritativeOrder
          OrderCache.putOrder(authOrder).catch(() => {})
          return authOrder
        }
      }

      // 2. Secondary lookup by raw string if different from canonical
      if (rawStr && rawStr !== canonicalRef) {
        const { data, error } = await supabase
          .from('orders')
          .select(ORDER_SELECT_COLUMNS)
          .eq('id', rawStr)
          .is('deleted_at', null)
          .maybeSingle()

        if (!error && data) {
          const authOrder = data as unknown as AuthoritativeOrder
          OrderCache.putOrder(authOrder).catch(() => {})
          return authOrder
        }
      }

      // 3. Fallback by numeric digits if raw input was purely numeric
      const numericId = extractNumericOrderId(idOrRef)
      if (numericId > 0 && !canonicalRef.endsWith(String(numericId))) {
        const fallbackRef = `SHD-${numericId}`
        const { data, error } = await supabase
          .from('orders')
          .select(ORDER_SELECT_COLUMNS)
          .eq('id', fallbackRef)
          .is('deleted_at', null)
          .maybeSingle()

        if (!error && data) {
          const authOrder = data as unknown as AuthoritativeOrder
          OrderCache.putOrder(authOrder).catch(() => {})
          return authOrder
        }
      }

      return null
    } catch (err) {
      console.error(`[OrderRepository] Exception fetching order ${idOrRef}:`, err)
      return null
    }
  }

  /**
   * Search historical orders across customer and reference fields without age cutoffs.
   */
  static async searchOrders(query: string, limit = 50): Promise<AuthoritativeOrder[]> {
    const q = query.trim()
    if (!q) return []

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(ORDER_SELECT_COLUMNS)
        .is('deleted_at', null)
        .or(`customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,delivery_address.ilike.%${q}%,id.ilike.%${q}%,notes.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('[OrderRepository] Search error:', error.message)
        return []
      }

      const orders = (data || []) as unknown as AuthoritativeOrder[]
      if (orders.length > 0) {
        OrderCache.putOrders(orders).catch(() => {})
      }

      return orders
    } catch (err) {
      console.error('[OrderRepository] Exception in searchOrders:', err)
      return []
    }
  }

  /**
   * Authoritative mutation: Persists changes directly to PostgreSQL orders table
   * and updates OrderCache only with confirmed server data.
   */
  static async updateOrder(idOrRef: string | number, updates: OrderLifecycleUpdates): Promise<boolean> {
    if (!idOrRef) return false
    const canonicalRef = getCanonicalOrderRef(idOrRef) || String(idOrRef).trim()

    // 1. Sync dev server middleware cache if present
    fetch('/api/update-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: canonicalRef, updates }),
    }).catch(() => {})

    // 2. Authoritative database update in Supabase
    try {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', canonicalRef)
        .select(ORDER_SELECT_COLUMNS)
        .maybeSingle()

      if (error) {
        console.error(`[OrderRepository] Failed to update order ${canonicalRef}:`, error.message)
        return false
      }

      // Update OrderCache only from confirmed server result
      if (data) {
        OrderCache.putOrder(data as unknown as AuthoritativeOrder).catch(() => {})
      }

      return true
    } catch (err) {
      console.error(`[OrderRepository] Exception updating order ${canonicalRef}:`, err)
      return false
    }
  }
}

