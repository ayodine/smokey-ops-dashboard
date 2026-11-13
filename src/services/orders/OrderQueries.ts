import { supabase } from '@/lib/supabase'
import { isStorePickupOrder } from '@/lib/orderCanonical'
import type {
  AuthoritativeOrder,
  OrderCursor,
  PaginatedResult,
  LogisticsQueueFilters,
  WebsiteOrdersFilters,
  PackagingQueueFilters,
  WebsiteOrdersKPISummary,
  ServerPaginatedResult
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

      // 1. Exclude Store Pickup orders from Dispatch Board queries (preserving NULL columns)
      query = query
        .or('delivery_zone.is.null,delivery_zone.not.ilike.%pickup%')
        .or('delivery_address.is.null,delivery_address.not.ilike.%pickup%')
        .or('delivery_address.is.null,delivery_address.not.ilike.%counter%')
        .or('delivery_status.is.null,delivery_status.not.in.("Ready for Pickup",ready_for_pickup,Collected,collected)')

      // 2. Status/Tab Filter
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
          .or('delivery_status.in.("Ready for Dispatch",pending,assigned),rider_name.is.null,rider_name.eq.Unassigned')
      } else {
        // Default / Search mode on Dispatch Board: only show orders that are packaged or already in dispatch/delivery
        query = query.or('packaging_status.in.(packaged,dispatched),delivery_status.in.("Ready for Dispatch",Assigned,assigned,"In Transit",in_transit,out_for_delivery,Delivered,delivered)')
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
      const sliced = hasMore ? rawItems.slice(0, limit) : rawItems
      const items = sliced.filter(o => !isStorePickupOrder(o))
      const lastItem = sliced[sliced.length - 1]
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
        query = query.or('delivery_status.ilike.%transit%,delivery_status.ilike.%out_for_delivery%')
      } else if (filters?.tab === 'delivered') {
        query = query.ilike('delivery_status', '%deliver%')
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
   * Authoritative KPI Aggregates for Website Orders Page
   */
  static async getWebsiteOrdersKPIs(dateRange?: { from?: string; to?: string }): Promise<WebsiteOrdersKPISummary> {
    try {
      const p_from = dateRange?.from ? `${dateRange.from}T00:00:00.000Z` : null
      const p_to = dateRange?.to ? `${dateRange.to}T23:59:59.999Z` : null

      const { data, error } = await supabase.rpc('get_website_orders_kpis', {
        p_from,
        p_to
      })

      if (!error && data && typeof data === 'object') {
        return {
          total_orders: Number(data.total_orders) || 0,
          total_revenue: Number(data.total_revenue) || 0,
          walkin_count: Number(data.walkin_count) || 0,
          intake_count: Number(data.intake_count) || 0,
          packaging_count: Number(data.packaging_count) || 0,
          transit_count: Number(data.transit_count) || 0,
          delivered_count: Number(data.delivered_count) || 0
        }
      }

      // Resilient fallback using existing get_orders_status_counts and get_overview_kpis RPCs
      const [overviewRes, statusRes] = await Promise.all([
        supabase.rpc('get_overview_kpis', { p_start: p_from }),
        supabase.rpc('get_orders_status_counts', { p_start: p_from, p_end: p_to })
      ])

      const totalOrders = Number(statusRes.data?.all) || Number(overviewRes.data?.order_count) || 0
      const totalRevenue = Number(overviewRes.data?.revenue) || 0
      const deliveredCount = Number(statusRes.data?.delivered) || 0
      const processingCount = Number(statusRes.data?.processing) || 0

      return {
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        walkin_count: 0,
        intake_count: processingCount,
        packaging_count: 0,
        transit_count: Number(statusRes.data?.shipped) || 0,
        delivered_count: deliveredCount
      }
    } catch (err) {
      console.warn('[OrderQueries.getWebsiteOrdersKPIs] Fallback to zero metrics:', err)
      return {
        total_orders: 0,
        total_revenue: 0,
        walkin_count: 0,
        intake_count: 0,
        packaging_count: 0,
        transit_count: 0,
        delivered_count: 0
      }
    }
  }

  /**
   * Server-Side Paginated Query for Website Orders Page
   * Supports unlimited pages with exact counts ({ count: 'exact' })
   */
  static async getWebsiteOrdersPage(params: {
    tab?: string
    search?: string
    dateRange?: { from?: string; to?: string }
    page?: number
    limit?: number
  }): Promise<ServerPaginatedResult<AuthoritativeOrder>> {
    const page = Math.max(1, params.page || 1)
    const limit = Math.max(1, params.limit || 50)
    const fromIdx = (page - 1) * limit
    const toIdx = fromIdx + limit - 1

    try {
      let query = supabase
        .from('orders')
        .select(ORDER_SELECT_COLUMNS, { count: 'exact' })
        .is('deleted_at', null)
        .neq('status', 'cancelled')
        .neq('status', 'refunded')
        .neq('status', 'pending_payment')

      // STRICT USER INVARIANT: Only confirmed orders with paid_at or paid status are visible
      query = query.or('paid_at.not.is.null,status.in.(processing,delivered)')

      // 1. Tab filtering
      if (params.tab === 'walkin_pos') {
        query = query.or('channel.ilike.%walk%,channel.ilike.%pos%')
      } else if (params.tab === 'intake') {
        query = query.in('packaging_status', ['ready_for_fulfillment'])
      } else if (params.tab === 'packaging') {
        query = query.in('packaging_status', ['in_packaging'])
      } else if (params.tab === 'transit') {
        query = query.or('delivery_status.ilike.%transit%,delivery_status.ilike.%out_for_delivery%')
      } else if (params.tab === 'delivered') {
        query = query.ilike('delivery_status', '%deliver%')
      }

      // 2. Search
      const q = params.search?.trim().replace(/[,()]/g, '')
      if (q) {
        query = query.or(
          `customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,delivery_address.ilike.%${q}%,id.ilike.%${q}%,notes.ilike.%${q}%,rider_name.ilike.%${q}%`
        )
      }

      // 3. Date range
      if (params.dateRange?.from) {
        query = query.gte('created_at', `${params.dateRange.from}T00:00:00.000Z`)
      }
      if (params.dateRange?.to) {
        query = query.lte('created_at', `${params.dateRange.to}T23:59:59.999Z`)
      }

      // 4. Stable ordering and range
      query = query
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(fromIdx, toIdx)

      const { data, count, error } = await query
      if (error) {
        console.error('[OrderQueries.getWebsiteOrdersPage] Query error:', error.message)
        return { items: [], totalCount: 0, page, totalPages: 1 }
      }

      const items = (data || []) as unknown as AuthoritativeOrder[]
      const totalCount = count !== null && count !== undefined ? count : items.length
      const totalPages = Math.max(1, Math.ceil(totalCount / limit))

      return { items, totalCount, page, totalPages }
    } catch (err) {
      console.error('[OrderQueries.getWebsiteOrdersPage] Exception:', err)
      return { items: [], totalCount: 0, page, totalPages: 1 }
    }
  }

  /**
   * Server-Side Paginated Query for Delivered Logistics Orders
   */
  static async getDeliveredOrdersPage(params: {
    search?: string
    dateRange?: { from?: string; to?: string }
    page?: number
    limit?: number
  }): Promise<ServerPaginatedResult<AuthoritativeOrder>> {
    const page = Math.max(1, params.page || 1)
    const limit = Math.max(1, params.limit || 50)
    const fromIdx = (page - 1) * limit
    const toIdx = fromIdx + limit - 1

    try {
      let query = supabase
        .from('orders')
        .select(ORDER_SELECT_COLUMNS, { count: 'exact' })
        .is('deleted_at', null)
        .neq('status', 'cancelled')
        .neq('status', 'refunded')
        .neq('status', 'pending_payment')
        .ilike('delivery_status', '%deliver%')
        .or('delivery_zone.is.null,delivery_zone.not.ilike.%pickup%')
        .or('delivery_address.is.null,delivery_address.not.ilike.%pickup%')
        .or('delivery_address.is.null,delivery_address.not.ilike.%counter%')

      const q = params.search?.trim().replace(/[,()]/g, '')
      if (q) {
        query = query.or(
          `customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,delivery_address.ilike.%${q}%,id.ilike.%${q}%,notes.ilike.%${q}%,rider_name.ilike.%${q}%`
        )
      }

      if (params.dateRange?.from) {
        query = query.gte('created_at', `${params.dateRange.from}T00:00:00.000Z`)
      }
      if (params.dateRange?.to) {
        query = query.lte('created_at', `${params.dateRange.to}T23:59:59.999Z`)
      }

      query = query
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(fromIdx, toIdx)

      const { data, count, error } = await query
      if (error) {
        console.error('[OrderQueries.getDeliveredOrdersPage] Query error:', error.message)
        return { items: [], totalCount: 0, page, totalPages: 1 }
      }

      const rawItems = (data || []) as unknown as AuthoritativeOrder[]
      const items = rawItems.filter(o => !isStorePickupOrder(o))
      const totalCount = count !== null && count !== undefined ? count : items.length
      const totalPages = Math.max(1, Math.ceil(totalCount / limit))

      return { items, totalCount, page, totalPages }
    } catch (err) {
      console.error('[OrderQueries.getDeliveredOrdersPage] Exception:', err)
      return { items: [], totalCount: 0, page, totalPages: 1 }
    }
  }

  /**
   * Server-Side Paginated Query for Packaged Kitchen History
   */
  static async getPackagedOrdersPage(params: {
    search?: string
    page?: number
    limit?: number
  }): Promise<ServerPaginatedResult<AuthoritativeOrder>> {
    const page = Math.max(1, params.page || 1)
    const limit = Math.max(1, params.limit || 50)
    const fromIdx = (page - 1) * limit
    const toIdx = fromIdx + limit - 1

    try {
      let query = supabase
        .from('orders')
        .select(ORDER_SELECT_COLUMNS, { count: 'exact' })
        .is('deleted_at', null)
        .neq('status', 'cancelled')
        .neq('status', 'refunded')
        .neq('status', 'pending_payment')
        .in('packaging_status', ['packaged', 'dispatched'])

      const q = params.search?.trim().replace(/[,()]/g, '')
      if (q) {
        query = query.or(
          `customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,delivery_address.ilike.%${q}%,id.ilike.%${q}%,notes.ilike.%${q}%`
        )
      }

      query = query
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(fromIdx, toIdx)

      const { data, count, error } = await query
      if (error) {
        console.error('[OrderQueries.getPackagedOrdersPage] Query error:', error.message)
        return { items: [], totalCount: 0, page, totalPages: 1 }
      }

      const items = (data || []) as unknown as AuthoritativeOrder[]
      const totalCount = count !== null && count !== undefined ? count : items.length
      const totalPages = Math.max(1, Math.ceil(totalCount / limit))

      return { items, totalCount, page, totalPages }
    } catch (err) {
      console.error('[OrderQueries.getPackagedOrdersPage] Exception:', err)
      return { items: [], totalCount: 0, page, totalPages: 1 }
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
