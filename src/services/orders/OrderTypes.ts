/**
 * Authoritative Order Domain Types for OrderRepository
 */

export interface AuthoritativeOrderItem {
  id: number | string
  order_id: string
  product_id?: number | null
  name: string
  qty: number
  price: number
  is_preorder?: boolean
  preorder_release_date?: string | null
  preorder_snapshot?: any
  dispatch_rule_snapshot?: any
}

export interface AuthoritativeOrder {
  id: string // Canonical order reference, e.g. "SHD-11383"
  customer_id?: string | null
  store_id?: string | null
  customer_name: string
  customer_phone: string
  customer_email?: string | null
  delivery_address: string
  delivery_zone?: string | null
  total: number
  delivery_fee: number
  base_delivery_fee?: number | null
  status: string
  payment_method?: string | null
  payment_channel?: string | null
  paid_at?: string | null
  paystack_ref?: string | null
  notes?: string | null
  channel?: string | null
  created_at: string
  updated_at?: string | null
  deleted_at?: string | null
  scheduled_delivery_date?: string | null
  delivery_status?: string | null
  delivery_rescheduled_at?: string | null
  delivery_rescheduled_by?: string | null
  rider_name?: string | null
  rider_id?: number | string | null
  rider_type?: 'internal' | 'third_party' | null
  third_party_provider?: string | null
  booked_fee?: number | null
  fee_evidence_path?: string | null
  fee_verify_status?: 'none' | 'pending' | 'approved' | 'flagged' | string | null
  packaging_status?: string | null
  packaged_at?: string | null
  packaged_by?: string | null
  pickup_at?: string | null
  delivered_at?: string | null
  order_items?: AuthoritativeOrderItem[]
}

export type OrderLookupResult<T> =
  | { success: true; data: T; source: 'memory' | 'cache' | 'database' }
  | { success: false; error: 'not_found' | 'permission_denied' | 'network_error' | 'database_error'; message: string }

export interface OrderLifecycleUpdates {
  status?: string
  delivery_status?: string
  packaging_status?: string
  rider_name?: string | null
  rider_id?: number | null
  rider_type?: 'internal' | 'third_party' | null
  third_party_provider?: string | null
  booked_fee?: number | null
  fee_evidence_path?: string | null
  fee_verify_status?: 'none' | 'pending' | 'approved' | 'flagged' | string | null
  pickup_at?: string | null
  delivered_at?: string | null
  packaged_at?: string | null
  packaged_by?: string | null
  [key: string]: any
}

export interface OrderCursor {
  createdAt: string
  id: string
}

export interface PaginatedResult<T> {
  items: T[]
  nextCursor: OrderCursor | null
  hasMore: boolean
  totalCount?: number
}

export interface LogisticsQueueFilters {
  tab?: 'all' | 'unassigned' | 'assigned' | 'in_transit' | 'delivered'
  search?: string
  dateRange?: { from?: string; to?: string }
}

export interface WebsiteOrdersFilters {
  tab?: 'all' | 'walkin_pos' | 'intake' | 'packaging' | 'transit' | 'delivered'
  search?: string
  dateRange?: { from?: string; to?: string }
}

export interface PackagingQueueFilters {
  tab?: 'ready' | 'history' | 'all'
  search?: string
}

export interface CachedOrderRecord {
  id: string              // Canonical order reference or DB id (e.g. 'SHD-11383')
  order_ref: string       // Canonical reference
  payload: AuthoritativeOrder
  updated_at: string      // Server-provided ISO timestamp
  cached_at: number       // Client Date.now() timestamp when cached
  ttl_ms: number          // Validity duration (default: 5 minutes)
}

export interface CachedQueryResult {
  query_key: string
  order_ids: string[]
  cached_at: number
  ttl_ms: number
}

export type OrderSyncEventType =
  | 'order.created'
  | 'order.updated'
  | 'order.deleted'
  | 'order.lifecycle_transition'
  | 'products.updated'
  | 'system.low_stock'
  | 'system.accounts_updated'

export interface OrderSyncEvent {
  event: OrderSyncEventType
  order_id: string          // Canonical primary key, e.g. "SHD-11383"
  order_ref: string         // Canonical order reference
  updated_at: string        // Authoritative ISO timestamp
  changed_fields?: string[] // Optional array of modified columns
  data?: any
}

export type OrderSyncListener = (event: OrderSyncEvent) => void

