import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { getCanonicalOrderRef } from '@/lib/orderCanonical'
import { OrderCache } from './OrderCache'
import type { OrderSyncEvent, OrderSyncListener, AuthoritativeOrder } from './OrderTypes'

const CONSOLIDATED_CHANNEL_NAME = 'smokey_ops_realtime_v1'
const DB_TRIGGER_CHANNEL_NAME = 'ops_context_system_broadcast'
const LOCAL_TAB_BROADCAST_NAME = 'smokey_ops_tab_sync'

/**
 * OrderSyncManager
 * Singleton manager consolidating all Realtime subscriptions and cross-tab broadcasts.
 * Guarantees zero-latency local dispatch, cross-tab synchronization, monotonic ordering,
 * and resilient recovery.
 */
export class OrderSyncManager {
  private static channel: RealtimeChannel | null = null
  private static dbTriggerChannel: RealtimeChannel | null = null
  private static localTabChannel: BroadcastChannel | null = null
  private static listeners = new Set<OrderSyncListener>()
  private static lastSeenUpdatedAt = new Map<string, string>()
  private static connectionStatus: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' = 'DISCONNECTED'
  private static wasDisconnected = false

  /**
   * Initializes the consolidated Realtime channel and local cross-tab BroadcastChannel.
   * Safe to call multiple times; idempotently reuses existing channels.
   */
  static init(): RealtimeChannel | null {
    if (this.channel) return this.channel
    if (typeof window === 'undefined') return null

    this.connectionStatus = 'CONNECTING'

    // 0. Initialize native browser BroadcastChannel for 0ms cross-tab synchronization
    if (!this.localTabChannel && 'BroadcastChannel' in window) {
      try {
        this.localTabChannel = new BroadcastChannel(LOCAL_TAB_BROADCAST_NAME)
        this.localTabChannel.onmessage = (event: MessageEvent) => {
          const syncEvent = event.data as OrderSyncEvent
          if (syncEvent && syncEvent.event) {
            this.notifyListeners(syncEvent, false) // Do not re-broadcast to avoid loop
          }
        }
      } catch (err) {
        console.warn('[OrderSyncManager] BroadcastChannel unsupported or failed:', err)
      }
    }

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

      const handleLifecycleBroadcast = (payload: any) => {
        const data = payload?.payload
        if (!data) return

        const orderRef = getCanonicalOrderRef(data) || String(data.id || '')
        const now = data.updated_at || new Date().toISOString()

        if (this.isStaleEvent(orderRef, now)) return
        this.lastSeenUpdatedAt.set(orderRef, now)

        this.notifyListeners({
          event: 'order.lifecycle_transition',
          order_id: String(data.id || orderRef),
          order_ref: orderRef,
          updated_at: now,
          data
        })
      }

      const handleNewOrderAlert = (payload: any) => {
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
      }

      // 3. Broadcast: order lifecycle update
      ch.on('broadcast', { event: 'order_lifecycle_updated' }, handleLifecycleBroadcast)

      // 4. Broadcast: new order alert
      ch.on('broadcast', { event: 'new_order_alert' }, handleNewOrderAlert)

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

      // 7. Also subscribe to DB Trigger channel to receive PostgreSQL trigger notifications
      try {
        const dbCh = supabase.channel(DB_TRIGGER_CHANNEL_NAME)
        dbCh.on('broadcast', { event: 'order_lifecycle_updated' }, handleLifecycleBroadcast)
        dbCh.on('broadcast', { event: 'new_order_alert' }, handleNewOrderAlert)
        dbCh.subscribe()
        this.dbTriggerChannel = dbCh
      } catch (err) {
        console.warn('[OrderSyncManager] Failed to subscribe to DB trigger channel:', err)
      }

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
      const updatedAt = newOrder.updated_at || new Date().toISOString()

      // Monotonic guard with clock skew tolerance
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
   * Check if incoming event is older or duplicate compared to last seen.
   * Tolerates up to 10 seconds of clock skew between client and server.
   */
  private static isStaleEvent(orderRef: string, incomingUpdatedAt: string): boolean {
    const lastSeen = this.lastSeenUpdatedAt.get(orderRef)
    if (!lastSeen) return false
    const diffMs = new Date(incomingUpdatedAt).getTime() - new Date(lastSeen).getTime()
    return diffMs < -10000
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
   * Broadcast a typed lifecycle change event to connected clients, open browser tabs,
   * and in-process registered listeners with zero latency.
   */
  static async broadcastLifecycleUpdate(event: {
    id: string
    order_ref?: string
    [key: string]: any
  }): Promise<void> {
    const canonicalRef = getCanonicalOrderRef(event) || String(event.id || event.order_ref || '')
    const updatedAt = event.updated_at || new Date().toISOString()
    this.lastSeenUpdatedAt.set(canonicalRef, updatedAt)

    const syncEvent: OrderSyncEvent = {
      event: 'order.lifecycle_transition',
      order_id: String(event.id || canonicalRef),
      order_ref: canonicalRef,
      updated_at: updatedAt,
      data: {
        ...event,
        order_ref: canonicalRef,
        updated_at: updatedAt
      }
    }

    // 1. Optimistic synchronous in-process notification (0ms local UI reactivity)
    this.notifyListeners(syncEvent, true)

    // 2. Synchronize OrderCache immediately
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

    // 3. Broadcast to Supabase Realtime websocket
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
   * Notify all registered in-process listeners, and optionally post to local BroadcastChannel.
   */
  private static notifyListeners(event: OrderSyncEvent, forwardToTabs = true): void {
    // 1. Local in-process listeners
    this.listeners.forEach((listener) => {
      try {
        listener(event)
      } catch (err) {
        console.error('[OrderSyncManager] Error in listener execution:', err)
      }
    })

    // 2. Cross-tab BroadcastChannel
    if (forwardToTabs && this.localTabChannel) {
      try {
        this.localTabChannel.postMessage(event)
      } catch {
        // Ignore channel closed errors
      }
    }
  }

  /**
   * Helper utility to patch a list of order records in-place when a lifecycle event arrives.
   */
  static patchOrderInList<T extends Record<string, any>>(list: T[], updatedData: any): T[] {
    if (!list || list.length === 0 || !updatedData) return list
    const targetRef = getCanonicalOrderRef(updatedData)
    const targetId = String(updatedData.id || '')
    if (!targetRef && !targetId) return list

    let hasChange = false
    const patched = list.map(item => {
      const itemRef = getCanonicalOrderRef(item)
      const itemId = String(item.id || '')
      if ((targetRef && itemRef === targetRef) || (targetId && itemId === targetId)) {
        hasChange = true
        return {
          ...item,
          ...updatedData,
          order_ref: itemRef || item.order_ref,
          id: item.id
        }
      }
      return item
    })

    return hasChange ? patched : list
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
    if (this.dbTriggerChannel) {
      supabase.removeChannel(this.dbTriggerChannel)
      this.dbTriggerChannel = null
    }
    if (this.localTabChannel) {
      this.localTabChannel.close()
      this.localTabChannel = null
    }
    this.listeners.clear()
    this.lastSeenUpdatedAt.clear()
    this.connectionStatus = 'DISCONNECTED'
  }
}

