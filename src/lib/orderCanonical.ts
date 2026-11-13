/**
 * Canonical order reference normalization and deduplication utilities.
 * Ensures that numeric IDs (e.g. 11394) and string order references (e.g. "SHD-11394", "shd-11394 ")
 * resolve to a single canonical identifier ("SHD-11394").
 */

export function getCanonicalOrderRef(item: any): string {
  if (!item) return ''
  if (typeof item === 'string' || typeof item === 'number') {
    const raw = String(item).trim().toUpperCase()
    if (!raw) return ''
    if (raw.startsWith('SHD-')) return raw
    const digits = raw.replace(/\D/g, '')
    return digits ? `SHD-${digits}` : raw
  }

  const refCandidate = item.order_ref ?? item.orderRef ?? item.id
  if (refCandidate === undefined || refCandidate === null) return ''
  const raw = String(refCandidate).trim().toUpperCase()
  if (!raw) return ''
  if (raw.startsWith('SHD-')) return raw
  const digits = raw.replace(/\D/g, '')
  return digits ? `SHD-${digits}` : raw
}

export function extractNumericOrderId(rawId: unknown, fallback = 0): number {
  if (typeof rawId === 'number' && Number.isFinite(rawId)) return rawId
  const digits = String(rawId ?? '').replace(/\D/g, '')
  const parsed = parseInt(digits, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function deduplicateByOrderRef<T>(items: T[], preferHigherStage?: (a: T, b: T) => T): T[] {
  const map = new Map<string, T>()
  for (const item of items) {
    const key = getCanonicalOrderRef(item)
    if (!key) continue
    const existing = map.get(key)
    if (!existing) {
      map.set(key, item)
    } else if (preferHigherStage) {
      map.set(key, preferHigherStage(existing, item))
    }
  }
  return Array.from(map.values())
}

/**
 * Canonical classifier for Store Pickup / Counter Pickup orders.
 * Ensures pickup orders never leak onto the Logistics Dispatch Board.
 */
export function isStorePickupOrder(order: any): boolean {
  if (!order) return false
  const address = String(order.delivery_address ?? order.address ?? '').toLowerCase()
  const zone = String(order.delivery_zone ?? '').toLowerCase()
  const notes = String(order.notes ?? '').toLowerCase()
  const delivStatus = String(order.delivery_status ?? '').toLowerCase()
  const deliveryType = String(order.delivery_type ?? order.fulfillment_type ?? '').toLowerCase()
  const fee = order.delivery_fee !== undefined && order.delivery_fee !== null ? Number(order.delivery_fee) : null

  return Boolean(
    (address && (address.includes('pickup') || address.includes('counter'))) ||
    (zone && zone.includes('pickup')) ||
    (notes && notes.includes('pickup') && !notes.includes('not pickup')) ||
    deliveryType === 'pickup' ||
    delivStatus.includes('pickup') ||
    delivStatus === 'collected' ||
    (fee === 0 && (address.includes('store') || address.includes('hq') || address.includes('yaba')))
  )
}


