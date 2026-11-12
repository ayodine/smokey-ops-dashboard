import { supabase } from '@/lib/supabase'
import { getCanonicalOrderRef } from '@/lib/orderCanonical'
import type { AuthoritativeOrder } from './OrderTypes'
import { OrderRepository } from './OrderRepository'
import { OrderCache } from './OrderCache'
import { OrderSyncManager } from './OrderSyncManager'

export interface LifecycleActionResult {
  success: boolean
  order?: AuthoritativeOrder
  already_collected?: boolean
  already_delivered?: boolean
  error?: string
  message?: string
}

/**
 * OrderLifecycleService
 * High-level typed service executing transactional, atomic order lifecycle transitions via PostgreSQL RPCs.
 * Ensures concurrency safety (FOR UPDATE locks), idempotency, and immediate cache & realtime dispatch.
 */
export class OrderLifecycleService {
  /**
   * 1. Confirm Rider Collection (Driver Collect)
   * Atomically sets delivery_status='In Transit', packaging_status='packaged',
   * pickup_at=now(), and records the rider trip ledger entry in app_settings.
   */
  static async confirmRiderCollection(orderIdOrRef: string | number): Promise<LifecycleActionResult> {
    const canonicalRef = getCanonicalOrderRef(orderIdOrRef) || String(orderIdOrRef).trim()
    if (!canonicalRef) {
      return { success: false, error: 'invalid_id', message: 'Order reference required' }
    }

    try {
      const { data, error } = await supabase.rpc('confirm_rider_collection', {
        p_order_ref: canonicalRef,
      })

      if (error) {
        console.warn(`[OrderLifecycleService] confirm_rider_collection RPC error: ${error.message}. Falling back to OrderRepository.`, error)
        return this.fallbackRiderCollection(canonicalRef)
      }

      const res = data as any
      if (!res?.success) {
        return {
          success: false,
          error: res?.error || 'rpc_failed',
          message: res?.message || 'Failed to confirm rider collection',
        }
      }

      const confirmedOrder = res.order as AuthoritativeOrder
      if (confirmedOrder) {
        OrderCache.putOrder(confirmedOrder).catch(() => {})
        OrderSyncManager.broadcastLifecycleUpdate(confirmedOrder).catch(() => {})
      }

      return {
        success: true,
        order: confirmedOrder,
        already_collected: Boolean(res.already_collected),
      }
    } catch (err: any) {
      console.error(`[OrderLifecycleService] Exception in confirmRiderCollection:`, err)
      return this.fallbackRiderCollection(canonicalRef)
    }
  }

  /**
   * 2. Mark Order Delivered
   * Atomically sets delivery_status='Delivered', status='delivered', packaging_status='packaged',
   * delivered_at=now(), and updates the rider trip ledger in app_settings.
   */
  static async markOrderDelivered(orderIdOrRef: string | number): Promise<LifecycleActionResult> {
    const canonicalRef = getCanonicalOrderRef(orderIdOrRef) || String(orderIdOrRef).trim()
    if (!canonicalRef) {
      return { success: false, error: 'invalid_id', message: 'Order reference required' }
    }

    try {
      const { data, error } = await supabase.rpc('mark_order_delivered', {
        p_order_ref: canonicalRef,
      })

      if (error) {
        console.warn(`[OrderLifecycleService] mark_order_delivered RPC error: ${error.message}. Falling back to OrderRepository.`, error)
        return this.fallbackMarkDelivered(canonicalRef)
      }

      const res = data as any
      if (!res?.success) {
        return {
          success: false,
          error: res?.error || 'rpc_failed',
          message: res?.message || 'Failed to mark order delivered',
        }
      }

      const confirmedOrder = res.order as AuthoritativeOrder
      if (confirmedOrder) {
        OrderCache.putOrder(confirmedOrder).catch(() => {})
        OrderSyncManager.broadcastLifecycleUpdate(confirmedOrder).catch(() => {})
      }

      return {
        success: true,
        order: confirmedOrder,
        already_delivered: Boolean(res.already_delivered),
      }
    } catch (err: any) {
      console.error(`[OrderLifecycleService] Exception in markOrderDelivered:`, err)
      return this.fallbackMarkDelivered(canonicalRef)
    }
  }

  /**
   * 3. Accept Order Delivery (Rider)
   * Rider acknowledges delivery assignment and transitions to In Transit.
   */
  static async acceptOrderDelivery(orderIdOrRef: string | number): Promise<LifecycleActionResult> {
    const canonicalRef = getCanonicalOrderRef(orderIdOrRef) || String(orderIdOrRef).trim()
    if (!canonicalRef) {
      return { success: false, error: 'invalid_id', message: 'Order reference required' }
    }

    try {
      const { data, error } = await supabase.rpc('accept_order_delivery', {
        p_order_ref: canonicalRef,
      })

      if (error) {
        console.warn(`[OrderLifecycleService] accept_order_delivery RPC error: ${error.message}. Falling back to OrderRepository.`, error)
        return this.fallbackAcceptDelivery(canonicalRef)
      }

      const res = data as any
      if (!res?.success) {
        return {
          success: false,
          error: res?.error || 'rpc_failed',
          message: res?.message || 'Failed to accept order delivery',
        }
      }

      const confirmedOrder = res.order as AuthoritativeOrder
      if (confirmedOrder) {
        OrderCache.putOrder(confirmedOrder).catch(() => {})
        OrderSyncManager.broadcastLifecycleUpdate(confirmedOrder).catch(() => {})
      }

      return {
        success: true,
        order: confirmedOrder,
      }
    } catch (err: any) {
      console.error(`[OrderLifecycleService] Exception in acceptOrderDelivery:`, err)
      return this.fallbackAcceptDelivery(canonicalRef)
    }
  }

  /**
   * 4. Decline Order Delivery (Rider)
   * Rider declines assignment; resets delivery_status to 'Ready for Dispatch' and clears rider fields.
   */
  static async declineOrderDelivery(
    orderIdOrRef: string | number,
    reason: string = ''
  ): Promise<LifecycleActionResult> {
    const canonicalRef = getCanonicalOrderRef(orderIdOrRef) || String(orderIdOrRef).trim()
    if (!canonicalRef) {
      return { success: false, error: 'invalid_id', message: 'Order reference required' }
    }

    try {
      const { data, error } = await supabase.rpc('decline_order_delivery', {
        p_order_ref: canonicalRef,
        p_reason: reason,
      })

      if (error) {
        console.warn(`[OrderLifecycleService] decline_order_delivery RPC error: ${error.message}. Falling back to OrderRepository.`, error)
        return this.fallbackDeclineDelivery(canonicalRef, reason)
      }

      const res = data as any
      if (!res?.success) {
        return {
          success: false,
          error: res?.error || 'rpc_failed',
          message: res?.message || 'Failed to decline order delivery',
        }
      }

      const confirmedOrder = res.order as AuthoritativeOrder
      if (confirmedOrder) {
        OrderCache.putOrder(confirmedOrder).catch(() => {})
        OrderSyncManager.broadcastLifecycleUpdate(confirmedOrder).catch(() => {})
      }

      return {
        success: true,
        order: confirmedOrder,
      }
    } catch (err: any) {
      console.error(`[OrderLifecycleService] Exception in declineOrderDelivery:`, err)
      return this.fallbackDeclineDelivery(canonicalRef, reason)
    }
  }

  /**
   * 5. Confirm Order Packaging (Kitchen Pack-Out)
   * Sets packaging_status='packaged', packaged_at=now(), and records packaged_by.
   */
  static async confirmOrderPackaging(
    orderIdOrRef: string | number,
    staffName: string = 'Packaging Staff'
  ): Promise<LifecycleActionResult> {
    const canonicalRef = getCanonicalOrderRef(orderIdOrRef) || String(orderIdOrRef).trim()
    if (!canonicalRef) {
      return { success: false, error: 'invalid_id', message: 'Order reference required' }
    }

    try {
      const { data, error } = await supabase.rpc('confirm_order_packaging', {
        p_order_ref: canonicalRef,
        p_staff_name: staffName || 'Packaging Staff',
      })

      if (error) {
        console.warn(`[OrderLifecycleService] confirm_order_packaging RPC error: ${error.message}. Falling back to OrderRepository.`, error)
        return this.fallbackConfirmPackaging(canonicalRef, staffName)
      }

      const res = data as any
      if (!res?.success) {
        return {
          success: false,
          error: res?.error || 'rpc_failed',
          message: res?.message || 'Failed to confirm order packaging',
        }
      }

      const confirmedOrder = res.order as AuthoritativeOrder
      if (confirmedOrder) {
        OrderCache.putOrder(confirmedOrder).catch(() => {})
        OrderSyncManager.broadcastLifecycleUpdate(confirmedOrder).catch(() => {})
      }

      return {
        success: true,
        order: confirmedOrder,
      }
    } catch (err: any) {
      console.error(`[OrderLifecycleService] Exception in confirmOrderPackaging:`, err)
      return this.fallbackConfirmPackaging(canonicalRef, staffName)
    }
  }

  /**
   * 6. Mark Store Pickup Collected
   * Sets delivery_status='Delivered', status='delivered', packaging_status='packaged',
   * delivered_at=now(), and appends customer & staff handover audit note.
   */
  static async markStorePickupCollected(
    orderIdOrRef: string | number,
    collectedBy: string,
    handoverStaff: string,
    collectorPhone?: string
  ): Promise<LifecycleActionResult> {
    const canonicalRef = getCanonicalOrderRef(orderIdOrRef) || String(orderIdOrRef).trim()
    if (!canonicalRef) {
      return { success: false, error: 'invalid_id', message: 'Order reference required' }
    }

    try {
      const { data, error } = await supabase.rpc('mark_store_pickup_collected', {
        p_order_ref: canonicalRef,
        p_collected_by: collectedBy || 'Customer',
        p_handover_staff: handoverStaff || 'Staff',
        p_collector_phone: collectorPhone || '',
      })

      if (error) {
        console.warn(`[OrderLifecycleService] mark_store_pickup_collected RPC error: ${error.message}. Falling back to OrderRepository.`, error)
        return this.fallbackStorePickupCollected(canonicalRef, collectedBy, handoverStaff, collectorPhone)
      }

      const res = data as any
      if (!res?.success) {
        return {
          success: false,
          error: res?.error || 'rpc_failed',
          message: res?.message || 'Failed to mark store pickup collected',
        }
      }

      const confirmedOrder = res.order as AuthoritativeOrder
      if (confirmedOrder) {
        OrderCache.putOrder(confirmedOrder).catch(() => {})
        OrderSyncManager.broadcastLifecycleUpdate(confirmedOrder).catch(() => {})
      }

      return {
        success: true,
        order: confirmedOrder,
        already_delivered: Boolean(res.already_delivered),
      }
    } catch (err: any) {
      console.error(`[OrderLifecycleService] Exception in markStorePickupCollected:`, err)
      return this.fallbackStorePickupCollected(canonicalRef, collectedBy, handoverStaff, collectorPhone)
    }
  }

  // ==========================================
  // Resilient Fallbacks (OrderRepository)
  // ==========================================

  private static async fallbackRiderCollection(canonicalRef: string): Promise<LifecycleActionResult> {
    const nowTime = new Date().toISOString()
    const ok = await OrderRepository.updateOrder(canonicalRef, {
      packaging_status: 'packaged',
      delivery_status: 'In Transit',
      pickup_at: nowTime,
    })
    if (!ok) return { success: false, error: 'fallback_failed', message: 'Could not update order via fallback' }
    const order = await OrderRepository.getOrderById(canonicalRef)
    return { success: true, order: order || undefined }
  }

  private static async fallbackMarkDelivered(canonicalRef: string): Promise<LifecycleActionResult> {
    const nowTime = new Date().toISOString()
    const ok = await OrderRepository.updateOrder(canonicalRef, {
      status: 'delivered',
      packaging_status: 'packaged',
      delivery_status: 'Delivered',
      delivered_at: nowTime,
      pickup_at: nowTime,
    })
    if (!ok) return { success: false, error: 'fallback_failed', message: 'Could not update order via fallback' }
    const order = await OrderRepository.getOrderById(canonicalRef)
    return { success: true, order: order || undefined }
  }

  private static async fallbackAcceptDelivery(canonicalRef: string): Promise<LifecycleActionResult> {
    const nowTime = new Date().toISOString()
    const ok = await OrderRepository.updateOrder(canonicalRef, {
      packaging_status: 'packaged',
      delivery_status: 'In Transit',
      pickup_at: nowTime,
    })
    if (!ok) return { success: false, error: 'fallback_failed', message: 'Could not update order via fallback' }
    const order = await OrderRepository.getOrderById(canonicalRef)
    return { success: true, order: order || undefined }
  }

  private static async fallbackDeclineDelivery(canonicalRef: string, reason: string): Promise<LifecycleActionResult> {
    const ok = await OrderRepository.updateOrder(canonicalRef, {
      delivery_status: 'Ready for Dispatch',
      rider_name: null,
      rider_id: null,
      pickup_at: null,
      notes: reason ? `[Declined: ${reason}]` : undefined,
    })
    if (!ok) return { success: false, error: 'fallback_failed', message: 'Could not update order via fallback' }
    const order = await OrderRepository.getOrderById(canonicalRef)
    return { success: true, order: order || undefined }
  }

  private static async fallbackConfirmPackaging(canonicalRef: string, staffName: string): Promise<LifecycleActionResult> {
    const nowTime = new Date().toISOString()
    const ok = await OrderRepository.updateOrder(canonicalRef, {
      packaging_status: 'packaged',
      packaged_at: nowTime,
      packaged_by: staffName,
    })
    if (!ok) return { success: false, error: 'fallback_failed', message: 'Could not update order via fallback' }
    const order = await OrderRepository.getOrderById(canonicalRef)
    return { success: true, order: order || undefined }
  }

  private static async fallbackStorePickupCollected(
    canonicalRef: string,
    collectedBy: string,
    handoverStaff: string,
    collectorPhone?: string
  ): Promise<LifecycleActionResult> {
    const nowTime = new Date().toISOString()
    const note = `[Store Pickup Collected by: ${collectedBy || 'Customer'}, Handover: ${handoverStaff || 'Staff'}${collectorPhone ? `, Phone: ${collectorPhone}` : ''}]`
    const ok = await OrderRepository.updateOrder(canonicalRef, {
      status: 'delivered',
      delivery_status: 'Delivered',
      packaging_status: 'packaged',
      delivered_at: nowTime,
      pickup_at: nowTime,
      notes: note,
    })
    if (!ok) return { success: false, error: 'fallback_failed', message: 'Could not update order via fallback' }
    const order = await OrderRepository.getOrderById(canonicalRef)
    return { success: true, order: order || undefined }
  }
}
