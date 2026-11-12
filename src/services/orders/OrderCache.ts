import type { AuthoritativeOrder, CachedOrderRecord, CachedQueryResult } from './OrderTypes'
import { getCanonicalOrderRef } from '@/lib/orderCanonical'

const DB_NAME = 'smokey_ops_db_v1'
const DB_VERSION = 1
const STORE_ORDERS = 'orders'
const STORE_QUERY_CACHE = 'query_cache'
const STORE_METADATA = 'metadata'

export const DEFAULT_ORDER_TTL_MS = 5 * 60 * 1000 // 5 minutes
export const DEFAULT_QUERY_TTL_MS = 2 * 60 * 1000 // 2 minutes
export const MAX_CACHED_ORDERS = 500
export const EVICTION_BATCH_SIZE = 100

/**
 * OrderCache
 * Structured browser IndexedDB cache for authoritative order records.
 * Non-authoritative, selective presentation cache with TTL and bounded LRU retention.
 */
export class OrderCache {
  private static dbPromise: Promise<IDBDatabase | null> | null = null
  private static memoryOrders = new Map<string, CachedOrderRecord>()
  private static memoryQueryCache = new Map<string, CachedQueryResult>()
  private static isIndexedDBSupported = typeof window !== 'undefined' && 'indexedDB' in window

  /**
   * Initializes or reuses the IndexedDB connection.
   */
  private static async getDb(): Promise<IDBDatabase | null> {
    if (!this.isIndexedDBSupported) return null
    if (this.dbPromise) return this.dbPromise

    this.dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION)

        req.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result
          if (!db.objectStoreNames.contains(STORE_ORDERS)) {
            const orderStore = db.createObjectStore(STORE_ORDERS, { keyPath: 'id' })
            orderStore.createIndex('by_ref', 'order_ref', { unique: false })
            orderStore.createIndex('by_updated_at', 'updated_at', { unique: false })
            orderStore.createIndex('by_cached_at', 'cached_at', { unique: false })
          }
          if (!db.objectStoreNames.contains(STORE_QUERY_CACHE)) {
            const queryStore = db.createObjectStore(STORE_QUERY_CACHE, { keyPath: 'query_key' })
            queryStore.createIndex('by_cached_at', 'cached_at', { unique: false })
          }
          if (!db.objectStoreNames.contains(STORE_METADATA)) {
            db.createObjectStore(STORE_METADATA, { keyPath: 'key' })
          }
        }

        req.onsuccess = () => {
          resolve(req.result)
        }

        req.onerror = () => {
          console.warn('[OrderCache] Failed to open IndexedDB, falling back to in-memory cache:', req.error)
          resolve(null)
        }

        req.onblocked = () => {
          console.warn('[OrderCache] IndexedDB open blocked by other tabs')
          resolve(null)
        }
      } catch (err) {
        console.warn('[OrderCache] Exception initializing IndexedDB:', err)
        resolve(null)
      }
    })

    return this.dbPromise
  }

  /**
   * Normalize an ID or reference to canonical string format
   */
  private static normalizeId(idOrRef: string | number): string {
    if (typeof idOrRef === 'number') {
      return idOrRef >= 10000 ? `SHD-${idOrRef}` : `SHD-${String(idOrRef).padStart(5, '0')}`
    }
    const clean = String(idOrRef).trim()
    if (/^\d+$/.test(clean)) {
      const num = parseInt(clean, 10)
      return num >= 10000 ? `SHD-${num}` : `SHD-${clean.padStart(5, '0')}`
    }
    return clean
  }

  /**
   * Retrieves an order from IndexedDB by primary ID or canonical order_ref.
   * Returns the record and whether it is fresh according to its TTL.
   */
  static async getOrder(
    idOrRef: string | number
  ): Promise<{ record: CachedOrderRecord; isFresh: boolean } | null> {
    const norm = this.normalizeId(idOrRef)

    // Check memory fallback first
    const mem = this.memoryOrders.get(norm)
    if (mem) {
      const isFresh = Date.now() - mem.cached_at < mem.ttl_ms
      return { record: mem, isFresh }
    }

    const db = await this.getDb()
    if (!db) return null

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_ORDERS], 'readonly')
        const store = tx.objectStore(STORE_ORDERS)

        // Try primary key get first
        const req = store.get(norm)
        req.onsuccess = () => {
          let rec = req.result as CachedOrderRecord | undefined

          if (!rec) {
            // Try secondary index by_ref
            const refIndex = store.index('by_ref')
            const refReq = refIndex.get(norm)
            refReq.onsuccess = () => {
              rec = refReq.result as CachedOrderRecord | undefined
              if (rec) {
                this.memoryOrders.set(norm, rec)
                const isFresh = Date.now() - rec.cached_at < rec.ttl_ms
                resolve({ record: rec, isFresh })
              } else {
                resolve(null)
              }
            }
            refReq.onerror = () => resolve(null)
          } else {
            this.memoryOrders.set(norm, rec)
            const isFresh = Date.now() - rec.cached_at < rec.ttl_ms
            resolve({ record: rec, isFresh })
          }
        }
        req.onerror = () => resolve(null)
      } catch (err) {
        console.warn('[OrderCache.getOrder] Error querying cache:', err)
        resolve(null)
      }
    })
  }

  /**
   * Puts an authoritative order into the cache.
   * Only server-confirmed orders should be passed here.
   */
  static async putOrder(
    order: AuthoritativeOrder,
    ttlMs: number = DEFAULT_ORDER_TTL_MS
  ): Promise<void> {
    if (!order || !order.id) return
    const canonicalRef = getCanonicalOrderRef(order) || order.id
    const record: CachedOrderRecord = {
      id: order.id,
      order_ref: canonicalRef,
      payload: order,
      updated_at: order.updated_at || order.created_at || new Date().toISOString(),
      cached_at: Date.now(),
      ttl_ms: ttlMs
    }

    // Always update in-memory cache
    this.memoryOrders.set(order.id, record)
    this.memoryOrders.set(canonicalRef, record)

    const db = await this.getDb()
    if (!db) return

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_ORDERS], 'readwrite')
        const store = tx.objectStore(STORE_ORDERS)
        store.put(record)

        tx.oncomplete = () => {
          resolve()
          // Asynchronously trigger eviction check if needed
          this.checkAndEvict().catch(() => {})
        }

        tx.onerror = () => {
          console.warn('[OrderCache.putOrder] Transaction error:', tx.error)
          resolve()
        }
      } catch (err) {
        console.warn('[OrderCache.putOrder] Failed to store in IndexedDB:', err)
        resolve()
      }
    })
  }

  /**
   * Batch put multiple authoritative orders into cache in a single transaction.
   */
  static async putOrders(
    orders: AuthoritativeOrder[],
    ttlMs: number = DEFAULT_ORDER_TTL_MS
  ): Promise<void> {
    if (!Array.isArray(orders) || orders.length === 0) return

    const records: CachedOrderRecord[] = []
    const now = Date.now()

    for (const ord of orders) {
      if (!ord || !ord.id) continue
      const canonicalRef = getCanonicalOrderRef(ord) || ord.id
      const record: CachedOrderRecord = {
        id: ord.id,
        order_ref: canonicalRef,
        payload: ord,
        updated_at: ord.updated_at || ord.created_at || new Date().toISOString(),
        cached_at: now,
        ttl_ms: ttlMs
      }
      records.push(record)
      this.memoryOrders.set(ord.id, record)
      this.memoryOrders.set(canonicalRef, record)
    }

    const db = await this.getDb()
    if (!db) return

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_ORDERS], 'readwrite')
        const store = tx.objectStore(STORE_ORDERS)
        for (const rec of records) {
          store.put(rec)
        }
        tx.oncomplete = () => {
          resolve()
          this.checkAndEvict().catch(() => {})
        }
        tx.onerror = () => {
          console.warn('[OrderCache.putOrders] Batch transaction error:', tx.error)
          resolve()
        }
      } catch (err) {
        console.warn('[OrderCache.putOrders] Exception during batch put:', err)
        resolve()
      }
    })
  }

  /**
   * Invalidates a single order from the cache.
   */
  static async invalidateOrder(idOrRef: string | number): Promise<void> {
    const norm = this.normalizeId(idOrRef)
    this.memoryOrders.delete(norm)

    const db = await this.getDb()
    if (!db) return

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_ORDERS], 'readwrite')
        const store = tx.objectStore(STORE_ORDERS)
        store.delete(norm)

        // Also check by_ref in case key is canonical ref
        const refIndex = store.index('by_ref')
        const refReq = refIndex.getKey(norm)
        refReq.onsuccess = () => {
          if (refReq.result) {
            store.delete(refReq.result)
          }
        }

        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      } catch (err) {
        console.warn('[OrderCache.invalidateOrder] Exception:', err)
        resolve()
      }
    })
  }

  /**
   * Retrieves cached query results (array of canonical order IDs).
   */
  static async getQueryCache(
    queryKey: string
  ): Promise<{ orderIds: string[]; isFresh: boolean } | null> {
    const mem = this.memoryQueryCache.get(queryKey)
    if (mem) {
      const isFresh = Date.now() - mem.cached_at < mem.ttl_ms
      return { orderIds: mem.order_ids, isFresh }
    }

    const db = await this.getDb()
    if (!db) return null

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_QUERY_CACHE], 'readonly')
        const store = tx.objectStore(STORE_QUERY_CACHE)
        const req = store.get(queryKey)
        req.onsuccess = () => {
          const res = req.result as CachedQueryResult | undefined
          if (res) {
            this.memoryQueryCache.set(queryKey, res)
            const isFresh = Date.now() - res.cached_at < res.ttl_ms
            resolve({ orderIds: res.order_ids, isFresh })
          } else {
            resolve(null)
          }
        }
        req.onerror = () => resolve(null)
      } catch {
        resolve(null)
      }
    })
  }

  /**
   * Stores query result order IDs into query_cache.
   */
  static async putQueryCache(
    queryKey: string,
    orderIds: string[],
    ttlMs: number = DEFAULT_QUERY_TTL_MS
  ): Promise<void> {
    const rec: CachedQueryResult = {
      query_key: queryKey,
      order_ids: orderIds,
      cached_at: Date.now(),
      ttl_ms: ttlMs
    }
    this.memoryQueryCache.set(queryKey, rec)

    const db = await this.getDb()
    if (!db) return

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_QUERY_CACHE], 'readwrite')
        const store = tx.objectStore(STORE_QUERY_CACHE)
        store.put(rec)
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      } catch {
        resolve()
      }
    })
  }

  /**
   * Completely clears all caches (used on logout, account switch, or cache corruption recovery).
   */
  static async clear(): Promise<void> {
    this.memoryOrders.clear()
    this.memoryQueryCache.clear()

    const db = await this.getDb()
    if (!db) return

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_ORDERS, STORE_QUERY_CACHE, STORE_METADATA], 'readwrite')
        tx.objectStore(STORE_ORDERS).clear()
        tx.objectStore(STORE_QUERY_CACHE).clear()
        tx.objectStore(STORE_METADATA).clear()
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      } catch (err) {
        console.warn('[OrderCache.clear] Failed to clear stores:', err)
        resolve()
      }
    })
  }

  /**
   * Bounded LRU eviction:
   * If orders count exceeds MAX_CACHED_ORDERS, deletes the oldest EVICTION_BATCH_SIZE records.
   */
  private static async checkAndEvict(): Promise<void> {
    const db = await this.getDb()
    if (!db) return

    try {
      const countTx = db.transaction([STORE_ORDERS], 'readonly')
      const store = countTx.objectStore(STORE_ORDERS)
      const countReq = store.count()

      countReq.onsuccess = () => {
        const count = countReq.result
        if (count > MAX_CACHED_ORDERS) {
          // Evict oldest entries by by_cached_at index
          const evictTx = db.transaction([STORE_ORDERS], 'readwrite')
          const evictStore = evictTx.objectStore(STORE_ORDERS)
          const index = evictStore.index('by_cached_at')
          const cursorReq = index.openCursor() // Ascending: oldest first
          let evicted = 0

          cursorReq.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result
            if (cursor && evicted < EVICTION_BATCH_SIZE) {
              const key = cursor.primaryKey
              cursor.delete()
              this.memoryOrders.delete(String(key))
              evicted++
              cursor.continue()
            }
          }
        }
      }
    } catch (err) {
      console.warn('[OrderCache.checkAndEvict] Eviction error:', err)
    }
  }
}
