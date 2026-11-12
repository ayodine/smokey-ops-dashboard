import { supabase } from '@/lib/supabase'
import type {
  AuthoritativeOrder,
  OrderCursor,
  PaginatedResult,
  LogisticsQueueFilters,
  WebsiteOrdersFilters,
  PackagingQueueFilters
} from './OrderTypes'

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
 * OrderQueries
 * Screen-specific server-side queries with selective field projection and keyset/cursor pagination.
 */
export class OrderQueries {
  /**
   * Screen Query: Logistics Dispatch Board
   * Retrieves active or historical logistics deliveries.
   */
  static async getLogisticsQueue(
    filters?: LogisticsQueueFilters,
    cursor?: OrderCursor,
    limit = 50
  ): Promise<PaginatedResult<AuthoritativeOrder>> {
    try {
      let query = supabase
        .from('orders')
        .select(ORDER_SELECT_COLUMNS)
        .is('deleted_at', null)
        .neq('status', 'cancelled')
        .neq('status', 'refunded')
        .neq('status', 'pending_payment')

      // 1. Status/Tab Filter
      if (filters?.tab === 'delivered') {
        query = query.eq('delivery_status', 'Delivered')
      } else if (filters?.tab === 'in_transit') {
        query = query.in('delivery_status', ['In Transit', 'in_transit', 'out_for_delivery'])
      } else if (filters?.tab === 'assigned') {
        query = query
          .in('delivery_status', ['Assigned', 'assigned'])
          .not('rider_name', 'is', null)
          .neq('rider_name', 'Unassigned')
      } else if (filters?.tab === 'unassigned') {
        query = query
          .neq('delivery_status', 'Delivered')
          .or('delivery_status.in.(Ready for Dispatch,pending,assigned),rider_name.is.null,rider_name.eq.Unassigned')
      }

      // 2. Search filter
      const q = filters?.search?.trim()
      if (q) {
        query = query.or(
          `customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,delivery_address.ilike.%${q}%,id.ilike.%${q}%,notes.ilike.%${q}%,rider_name.ilike.%${q}%`
        )
      }

      // 3. Date range filter
      if (filters?.dateRange?.from) {
        query = query.gte('created_at', `${filters.dateRange.from}T00:00:00.000Z`)
      }
      if (filters?.dateRange?.to) {
        query = query.lte('created_at', `${filters.dateRange.to}T23:59:59.999Z`)
      }

      // 4. Keyset Cursor: (created_at, id) < (cursor.createdAt, cursor.id)
      if (cursor?.createdAt && cursor?.id) {
        query = query.or(
          `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
        )
      }

      // 5. Stable keyset ordering
      query = query
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit + 1)

      const { data, error } = await query
      if (error) {
        console.error('[OrderQueries.getLogisticsQueue] Query error:', error.message)
        return { items: [], nextCursor: null, hasMore: false }
      }

      const rawItems = (data || []) as unknown as AuthoritativeOrder[]
      const hasMore = rawItems.length > limit
      const items = hasMore ? rawItems.slice(0, limit) : rawItems
      const lastItem = items[items.length - 1]
      const nextCursor: OrderCursor | null = hasMore && lastItem ? {
        createdAt: lastItem.created_at,
        id: lastItem.id
      } : null

      return { items, nextCursor, hasMore }
    } catch (err) {
      console.error('[OrderQueries.getLogisticsQueue] Exception:', err)
      return { items: [], nextCursor: null, hasMore: false }
    }
  }

  /**
   * Screen Query: Packaging Execution Queue
   * Retrieves orders awaiting packaging or in packaging.
   */
  static async getPackagingQueue(
    filters?: PackagingQueueFilters,
    cursor?: OrderCursor,
    limit = 50
  ): Promise<PaginatedResult<AuthoritativeOrder>> {
    try {
      let query = supabase
        .from('orders')
        .select(ORDER_SELECT_COLUMNS)
        .is('deleted_at', null)
        .neq('status', 'cancelled')
        .neq('status', 'refunded')
        .neq('status', 'pending_payment')

      if (filters?.tab === 'history') {
        query = query.in('packaging_status', ['packaged', 'dispatched'])
      } else if (filters?.tab !== 'all') {
        query = query.in('packaging_status', ['ready_for_fulfillment', 'in_packaging'])
      }

      const q = filters?.search?.trim()
      if (q) {
        query = query.or(
          `customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,delivery_address.ilike.%${q}%,id.ilike.%${q}%,notes.ilike.%${q}%`
        )
      }

      if (cursor?.createdAt && cursor?.id) {
        query = query.or(
          `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
        )
      }

      query = query
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit + 1)

      const { data, error } = await query
      if (error) {
        console.error('[OrderQueries.getPackagingQueue] Query error:', error.message)
        return { items: [], nextCursor: null, hasMore: false }
      }

      const rawItems = (data || []) as unknown as AuthoritativeOrder[]
      const hasMore = rawItems.length > limit
      const items = hasMore ? rawItems.slice(0, limit) : rawItems
      const lastItem = items[items.length - 1]
      const nextCursor: OrderCursor | null = hasMore && lastItem ? {
        createdAt: lastItem.created_at,
        id: lastItem.id
      } : null

      return { items, nextCursor, hasMore }
    } catch (err) {
      console.error('[OrderQueries.getPackagingQueue] Exception:', err)
      return { items: [], nextCursor: null, hasMore: false }
    }
  }

  /**
   * Screen Query: Website Orders / Sales
   * Server-side filtering and keyset pagination.
   */
  static async getWebsiteOrders(
    filters?: WebsiteOrdersFilters,
    cursor?: OrderCursor,
    limit = 50
  ): Promise<PaginatedResult<AuthoritativeOrder>> {
    try {
      let query = supabase
        .from('orders')
        .select(ORDER_SELECT_COLUMNS)
        .is('deleted_at', null)
        .neq('status', 'cancelled')
        .neq('status', 'refunded')
        .neq('status', 'pending_payment')

      // STRICT USER INVARIANT: Only confirmed orders with paid_at or paid status are visible
      query = query.or('paid_at.not.is.null,status.in.(processing,delivered)')

      // 1. Tab filtering
      if (filters?.tab === 'walkin_pos') {
        query = query.or('channel.ilike.%walk%,channel.ilike.%pos%')
      } else if (filters?.tab === 'intake') {
        query = query.in('packaging_status', ['ready_for_fulfillment'])
      } else if (filters?.tab === 'packaging') {
        query = query.in('packaging_status', ['in_packaging'])
      } else if (filters?.tab === 'transit') {
        query = query.in('delivery_status', ['In Transit', 'in_transit', 'out_for_delivery'])
      } else if (filters?.tab === 'delivered') {
        query = query.in('delivery_status', ['Delivered', 'delivered'])
      }

      // 2. Search
      const q = filters?.search?.trim()
      if (q) {
        query = query.or(
          `customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,delivery_address.ilike.%${q}%,id.ilike.%${q}%,notes.ilike.%${q}%,rider_name.ilike.%${q}%`
        )
      }

      // 3. Date range
      if (filters?.dateRange?.from) {
        query = query.gte('created_at', `${filters.dateRange.from}T00:00:00.000Z`)
      }
      if (filters?.dateRange?.to) {
        query = query.lte('created_at', `${filters.dateRange.to}T23:59:59.999Z`)
      }

      // 4. Cursor
      if (cursor?.createdAt && cursor?.id) {
        query = query.or(
          `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
        )
      }

      query = query
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit + 1)

      const { data, error } = await query
      if (error) {
        console.error('[OrderQueries.getWebsiteOrders] Query error:', error.message)
        return { items: [], nextCursor: null, hasMore: false }
      }

      const rawItems = (data || []) as unknown as AuthoritativeOrder[]
      const hasMore = rawItems.length > limit
      const items = hasMore ? rawItems.slice(0, limit) : rawItems
      const lastItem = items[items.length - 1]
      const nextCursor: OrderCursor | null = hasMore && lastItem ? {
        createdAt: lastItem.created_at,
        id: lastItem.id
      } : null

      return { items, nextCursor, hasMore }
    } catch (err) {
      console.error('[OrderQueries.getWebsiteOrders] Exception:', err)
      return { items: [], nextCursor: null, hasMore: false }
    }
  }

  /**
   * Screen Query: Store Pickup Counter
   * Retrieves orders designated for store pickup.
   */
  static async getStorePickups(
    cursor?: OrderCursor,
    limit = 50
  ): Promise<PaginatedResult<AuthoritativeOrder>> {
    try {
      let query = supabase
        .from('orders')
        .select(ORDER_SELECT_COLUMNS)
        .is('deleted_at', null)
        .neq('status', 'cancelled')
        .neq('status', 'refunded')
        .or('delivery_zone.eq.Store Pickup,delivery_address.ilike.%store pickup%')

      if (cursor?.createdAt && cursor?.id) {
        query = query.or(
          `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
        )
      }

      query = query
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit + 1)

      const { data, error } = await query
      if (error) {
        console.error('[OrderQueries.getStorePickups] Query error:', error.message)
        return { items: [], nextCursor: null, hasMore: false }
      }

      const rawItems = (data || []) as unknown as AuthoritativeOrder[]
      const hasMore = rawItems.length > limit
      const items = hasMore ? rawItems.slice(0, limit) : rawItems
      const lastItem = items[items.length - 1]
      const nextCursor: OrderCursor | null = hasMore && lastItem ? {
        createdAt: lastItem.created_at,
        id: lastItem.id
      } : null

      return { items, nextCursor, hasMore }
    } catch (err) {
      console.error('[OrderQueries.getStorePickups] Exception:', err)
      return { items: [], nextCursor: null, hasMore: false }
    }
  }
}
