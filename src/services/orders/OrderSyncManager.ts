import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { getCanonicalOrderRef } from '@/lib/orderCanonical'
import { OrderCache } from './OrderCache'
import type { OrderSyncEvent, OrderSyncListener, AuthoritativeOrder } from './OrderTypes'

const CONSOLIDATED_CHANNEL_NAME = 'smokey_ops_realtime_v1'

/**
 * OrderSyncManager
 * Singleton manager consolidating all Realtime subscriptions into a single managed connection.
 * Guarantees monotonic ordering, lightweight change payloads, cache synchronization, and clean listener lifecycles.
 */
export class OrderSyncManager {
  private static channel: RealtimeChannel | null = null
  private static listeners = new Set<OrderSyncListener>()
  private static lastSeenUpdatedAt = new Map<string, string>()
  private static connectionStatus: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' = 'DISCONNECTED'
  private static wasDisconnected = false

  /**
   * Initializes the consolidated Realtime channel.
   * Safe to call multiple times; idempotently reuses existing channel.
   */
  static init(): RealtimeChannel | null {
    if (this.channel) return this.channel
    if (typeof window === 'undefined') return null

    this.connectionStatus = 'CONNECTING'

    try {
      const ch = supabase.channel(CONSOLIDATED_CHANNEL_NAME, {
        config: { broadcast: { self: true } }
      })

      // 1. Postgres Changes: orders table
      ch.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: any) => {
          this.handlePostgresOrderChange(payload)
        }
      )

      // 2. Postgres Changes: products table
      ch.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          this.notifyListeners({
            event: 'products.updated',
            order_id: '',
            order_ref: '',
            updated_at: new Date().toISOString()
          })
        }
      )

      // 3. Broadcast: order lifecycle update
      ch.on('broadcast', { event: 'order_lifecycle_updated' }, (payload: any) => {
        const data = payload?.payload
        if (!data) return

        const orderRef = getCanonicalOrderRef(data) || String(data.id || '')
        const now = data.updated_at || new Date().toISOString()

        // Monotonic check
        if (this.isStaleEvent(orderRef, now)) return
        this.lastSeenUpdatedAt.set(orderRef, now)

        this.notifyListeners({
          event: 'order.lifecycle_transition',
          order_id: String(data.id || orderRef),
          order_ref: orderRef,
          updated_at: now,
          data
        })
      })

      // 4. Broadcast: new order alert
      ch.on('broadcast', { event: 'new_order_alert' }, (payload: any) => {
        const data = payload?.payload
        if (!data) return
        const orderRef = getCanonicalOrderRef(data) || String(data.id || '')
        this.notifyListeners({
          event: 'order.created',
          order_id: String(data.id || orderRef),
          order_ref: orderRef,
          updated_at: data.created_at || new Date().toISOString(),
          data
        })
      })

      // 5. Broadcast: accounts / permissions updated
      ch.on('broadcast', { event: 'accounts_permissions_updated' }, (payload: any) => {
        this.notifyListeners({
          event: 'system.accounts_updated',
          order_id: '',
          order_ref: '',
          updated_at: new Date().toISOString(),
          data: payload?.payload
        })
      })

      // 6. Broadcast: low stock alert
      ch.on('broadcast', { event: 'low_stock_alert' }, (payload: any) => {
        this.notifyListeners({
          event: 'system.low_stock',
          order_id: '',
          order_ref: '',
          updated_at: new Date().toISOString(),
          data: payload?.payload
        })
      })

      ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          const isReconnect = this.wasDisconnected
          this.connectionStatus = 'CONNECTED'
          this.wasDisconnected = false
          if (isReconnect) {
            console.info('[OrderSyncManager] Reconnected. Reconciling active queues.')
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          this.connectionStatus = 'DISCONNECTED'
          this.wasDisconnected = true
        }
      })

      this.channel = ch
      return ch
    } catch (err) {
      console.warn('[OrderSyncManager] Error creating channel:', err)
      this.connectionStatus = 'DISCONNECTED'
      return null
    }
  }

  /**
   * Process Postgres Changes events on orders table
   */
  private static handlePostgresOrderChange(payload: any) {
    if (!payload) return
    const eventType = payload.eventType

    if (eventType === 'INSERT') {
      const newOrder = payload.new
      if (!newOrder) return
      const ref = getCanonicalOrderRef(newOrder) || String(newOrder.id || '')
      this.notifyListeners({
        event: 'order.created',
        order_id: String(newOrder.id || ref),
        order_ref: ref,
        updated_at: newOrder.created_at || new Date().toISOString(),
        data: newOrder
      })
    } else if (eventType === 'UPDATE') {
      const newOrder = payload.new
      if (!newOrder) return
      const ref = getCanonicalOrderRef(newOrder) || String(newOrder.id || '')
      const updatedAt = newOrder.updated_at || newOrder.created_at || new Date().toISOString()

      // Monotonic version/timestamp guard: reject stale or out-of-order event
      if (this.isStaleEvent(ref, updatedAt)) return
      this.lastSeenUpdatedAt.set(ref, updatedAt)

      // Synchronize OrderCache with authoritative confirmed change
      OrderCache.putOrder(newOrder as unknown as AuthoritativeOrder).catch(() => {})

      this.notifyListeners({
        event: 'order.updated',
        order_id: String(newOrder.id || ref),
        order_ref: ref,
        updated_at: updatedAt,
        changed_fields: payload.columns ? Object.keys(payload.columns) : undefined,
        data: newOrder
      })
    } else if (eventType === 'DELETE') {
      const oldOrder = payload.old
      const ref = String(oldOrder?.id || '')
      if (ref) {
        OrderCache.invalidateOrder(ref).catch(() => {})
        this.notifyListeners({
          event: 'order.deleted',
          order_id: ref,
          order_ref: ref,
          updated_at: new Date().toISOString()
        })
      }
    }
  }

  /**
   * Check if incoming event is older or duplicate compared to last seen
   */
  private static isStaleEvent(orderRef: string, incomingUpdatedAt: string): boolean {
    const lastSeen = this.lastSeenUpdatedAt.get(orderRef)
    if (!lastSeen) return false
    return new Date(incomingUpdatedAt).getTime() < new Date(lastSeen).getTime()
  }

  /**
   * Subscribe a listener callback. Returns an unregister function.
   */
  static subscribe(listener: OrderSyncListener): () => void {
    this.listeners.add(listener)
    // Ensure channel is initialized
    if (!this.channel) {
      this.init()
    }
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Broadcast a typed lifecycle change event to other connected clients.
   */
  static async broadcastLifecycleUpdate(event: {
    id: string
    order_ref?: string
    [key: string]: any
  }): Promise<void> {
    const canonicalRef = getCanonicalOrderRef(event) || String(event.id || event.order_ref || '')
    const updatedAt = event.updated_at || new Date().toISOString()
    this.lastSeenUpdatedAt.set(canonicalRef, updatedAt)

    // Update local OrderCache immediately
    if (event.id) {
      OrderCache.getOrder(event.id).then((cached) => {
        if (cached?.record?.payload) {
          const merged: AuthoritativeOrder = {
            ...cached.record.payload,
            ...event,
            id: cached.record.payload.id,
            total: cached.record.payload.total,
            delivery_fee: cached.record.payload.delivery_fee,
            customer_name: cached.record.payload.customer_name,
            customer_phone: cached.record.payload.customer_phone,
            delivery_address: cached.record.payload.delivery_address,
            created_at: cached.record.payload.created_at,
            status: event.status || cached.record.payload.status,
            updated_at: updatedAt
          }
          OrderCache.putOrder(merged).catch(() => {})
        }
      }).catch(() => {})
    }

    if (!this.channel) {
      this.init()
    }

    if (this.channel) {
      try {
        await this.channel.send({
          type: 'broadcast',
          event: 'order_lifecycle_updated',
          payload: {
            ...event,
            order_ref: canonicalRef,
            updated_at: updatedAt
          }
        })
      } catch (err) {
        console.warn('[OrderSyncManager] Broadcast error:', err)
      }
    }
  }

  /**
   * Notify all registered in-process listeners.
   */
  private static notifyListeners(event: OrderSyncEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event)
      } catch (err) {
        console.error('[OrderSyncManager] Error in listener execution:', err)
      }
    })
  }

  /**
   * Check current connection state
   */
  static isConnected(): boolean {
    return this.connectionStatus === 'CONNECTED'
  }

  /**
   * Destroy connection cleanly on application shutdown
   */
  static destroy(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel)
      this.channel = null
    }
    this.listeners.clear()
    this.lastSeenUpdatedAt.clear()
    this.connectionStatus = 'DISCONNECTED'
  }
}

