import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://itpnfalqjjicesqcjzix.supabase.co'
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || ''
  const sb = createClient(supabaseUrl, serviceKey || env.VITE_SUPABASE_ANON_KEY || '')

  const serverCache: {
    liveOrders: any[] | null
    products: any[] | null
    rawInventory: any[] | null
    packagingInventory: any[] | null
    suppliers: any[] | null
    fleetRiders: any[] | null
    staffAccounts: any[] | null
    facilities: any[] | null
    lastUpdated: number
    warmingPromise: Promise<void> | null
  } = {
    liveOrders: null,
    products: null,
    rawInventory: null,
    packagingInventory: null,
    suppliers: null,
    fleetRiders: null,
    staffAccounts: null,
    facilities: null,
    lastUpdated: 0,
    warmingPromise: null,
  }

  const refreshServerCache = async () => {
    try {
      const [ordersRes, productsRes, settingsRes] = await Promise.all([
        sb
          .from('orders')
          .select('*, order_items(*)')
          .is('deleted_at', null)
          .neq('status', 'pending_payment')
          .order('created_at', { ascending: false })
          .limit(200),
        sb
          .from('products')
          .select('*')
          .is('deleted_at', null)
          .order('name', { ascending: true }),
        sb
          .from('app_settings')
          .select('key, value')
          .in('key', [
            'inventory_raw',
            'inventory_packaging',
            'suppliers',
            'fleet_riders',
            'staff_accounts',
            'facilities',
          ]),
      ])

      if (!ordersRes.error && Array.isArray(ordersRes.data)) {
        serverCache.liveOrders = ordersRes.data
      }
      if (!productsRes.error && Array.isArray(productsRes.data)) {
        serverCache.products = productsRes.data
      }
      if (!settingsRes.error && Array.isArray(settingsRes.data)) {
        const settingsMap = new Map(settingsRes.data.map((r: any) => [r.key, r.value]))
        if (settingsMap.has('inventory_raw')) serverCache.rawInventory = settingsMap.get('inventory_raw') || []
        if (settingsMap.has('inventory_packaging')) serverCache.packagingInventory = settingsMap.get('inventory_packaging') || []
        if (settingsMap.has('suppliers')) serverCache.suppliers = settingsMap.get('suppliers') || []
        if (settingsMap.has('fleet_riders')) serverCache.fleetRiders = settingsMap.get('fleet_riders') || []
        if (settingsMap.has('staff_accounts')) serverCache.staffAccounts = settingsMap.get('staff_accounts') || []
        if (settingsMap.has('facilities')) serverCache.facilities = settingsMap.get('facilities') || []
      }
      serverCache.lastUpdated = Date.now()
    } catch (err) {
      // Ignore transient network errors during background warm
    } finally {
      serverCache.warmingPromise = null
    }
  }

  const ensureCacheWarm = async (force = false) => {
    const isCold = serverCache.liveOrders === null || serverCache.products === null
    const isStale = Date.now() - serverCache.lastUpdated > 10000
    if (force || isCold) {
      if (!serverCache.warmingPromise || force) {
        serverCache.warmingPromise = refreshServerCache()
      }
      await serverCache.warmingPromise
    } else if (isStale && !serverCache.warmingPromise) {
      // Non-blocking background revalidation
      serverCache.warmingPromise = refreshServerCache()
    }
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'supabase-api-dev-middleware',
        async transformIndexHtml(html) {
          await ensureCacheWarm()
          const payload = JSON.stringify({
            liveOrders: serverCache.liveOrders || [],
            products: serverCache.products || [],
            rawInventory: serverCache.rawInventory || [],
            packagingInventory: serverCache.packagingInventory || [],
            suppliers: serverCache.suppliers || [],
            fleetRiders: serverCache.fleetRiders || [],
            staffAccounts: serverCache.staffAccounts || [],
            facilities: serverCache.facilities || []
          }).replace(/</g, '\\u003c')
          return html.replace(
            '</head>',
            () => `<script>window.__SMOKEY_LIVE_BOOTSTRAP__ = ${payload};</script></head>`
          )
        },
        configureServer(server) {
          // Pre-warm cache immediately on dev server startup
          ensureCacheWarm()

          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/live-orders')) {
              try {
                const urlObj = new URL(req.url, 'http://localhost')
                const query = urlObj.searchParams.get('q')?.trim()
                const forceRefresh = urlObj.searchParams.get('refresh') === '1'

                if (!query) {
                  await ensureCacheWarm(forceRefresh)
                  if (serverCache.liveOrders) {
                    res.statusCode = 200
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ data: serverCache.liveOrders }))
                    return
                  }
                }

                let queryBuilder = sb
                  .from('orders')
                  .select('*, order_items(*)')
                  .is('deleted_at', null)
                  .neq('status', 'pending_payment')
                  .order('created_at', { ascending: false })

                if (query) {
                  // Search historical records across all fields without limit restriction
                  queryBuilder = queryBuilder
                    .or(`customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%,delivery_address.ilike.%${query}%,id.ilike.%${query}%,notes.ilike.%${query}%`)
                    .limit(50)
                } else {
                  queryBuilder = queryBuilder.limit(200)
                }

                const { data, error } = await queryBuilder

                if (error) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: error.message }))
                  return
                }

                if (!query && Array.isArray(data)) {
                  serverCache.liveOrders = data
                }

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ data }))
              } catch (err: any) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err?.message || 'Server error' }))
              }
              return
            }

            if (req.url?.startsWith('/api/products')) {
              try {
                const urlObj = new URL(req.url, 'http://localhost')
                const forceRefresh = urlObj.searchParams.get('refresh') === '1'
                await ensureCacheWarm(forceRefresh)
                if (serverCache.products) {
                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ data: serverCache.products }))
                  return
                }

                const { data, error } = await sb
                  .from('products')
                  .select('*')
                  .is('deleted_at', null)
                  .order('name', { ascending: true })

                if (error) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: error.message }))
                  return
                }

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ data }))
              } catch (err: any) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err?.message || 'Server error' }))
              }
              return
            }

            if (req.url?.startsWith('/api/raw-inventory')) {
              try {
                await ensureCacheWarm()
                if (serverCache.rawInventory) {
                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ data: serverCache.rawInventory }))
                  return
                }
                const { data, error } = await sb
                  .from('app_settings')
                  .select('value')
                  .eq('key', 'inventory_raw')
                  .single()

                if (error && error.code !== 'PGRST116') {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: error.message }))
                  return
                }

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ data: data?.value || [] }))
              } catch (err: any) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err?.message || 'Server error' }))
              }
              return
            }

            if (req.url?.startsWith('/api/packaging-inventory')) {
              try {
                await ensureCacheWarm()
                if (serverCache.packagingInventory) {
                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ data: serverCache.packagingInventory }))
                  return
                }
                const { data, error } = await sb
                  .from('app_settings')
                  .select('value')
                  .eq('key', 'inventory_packaging')
                  .single()

                if (error && error.code !== 'PGRST116') {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: error.message }))
                  return
                }

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ data: data?.value || [] }))
              } catch (err: any) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err?.message || 'Server error' }))
              }
              return
            }

            if (req.url?.startsWith('/api/suppliers')) {
              try {
                await ensureCacheWarm()
                if (serverCache.suppliers) {
                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ data: serverCache.suppliers }))
                  return
                }
                const { data, error } = await sb
                  .from('app_settings')
                  .select('value')
                  .eq('key', 'suppliers')
                  .single()

                if (error && error.code !== 'PGRST116') {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: error.message }))
                  return
                }

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ data: data?.value || [] }))
              } catch (err: any) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err?.message || 'Server error' }))
              }
              return
            }

            if (req.url?.startsWith('/api/fleet-riders')) {
              try {
                await ensureCacheWarm()
                if (serverCache.fleetRiders) {
                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ data: serverCache.fleetRiders }))
                  return
                }
                const { data, error } = await sb
                  .from('app_settings')
                  .select('value')
                  .eq('key', 'fleet_riders')
                  .single()

                if (error && error.code !== 'PGRST116') {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: error.message }))
                  return
                }

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ data: data?.value || [] }))
              } catch (err: any) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err?.message || 'Server error' }))
              }
              return
            }

            if (req.url?.startsWith('/api/staff-accounts')) {
              try {
                await ensureCacheWarm()
                if (serverCache.staffAccounts) {
                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ data: serverCache.staffAccounts }))
                  return
                }
                const { data, error } = await sb
                  .from('app_settings')
                  .select('value')
                  .eq('key', 'staff_accounts')
                  .single()

                if (error && error.code !== 'PGRST116') {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: error.message }))
                  return
                }

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ data: data?.value || [] }))
              } catch (err: any) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err?.message || 'Server error' }))
              }
              return
            }

            if (req.url?.startsWith('/api/facilities')) {
              try {
                await ensureCacheWarm()
                if (serverCache.facilities) {
                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ data: serverCache.facilities }))
                  return
                }
                const { data, error } = await sb
                  .from('app_settings')
                  .select('value')
                  .eq('key', 'facilities')
                  .single()

                if (error && error.code !== 'PGRST116') {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: error.message }))
                  return
                }

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ data: data?.value || [] }))
              } catch (err: any) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err?.message || 'Server error' }))
              }
              return
            }

            if (req.url?.startsWith('/api/app-settings')) {
              try {
                if (req.method === 'POST' || req.method === 'PUT') {
                  let body = ''
                  req.on('data', chunk => {
                    body += chunk.toString()
                  })
                  req.on('end', async () => {
                    try {
                      const parsed = JSON.parse(body)
                      const { key, value } = parsed
                      if (!key) {
                        res.statusCode = 400
                        res.setHeader('Content-Type', 'application/json')
                        res.end(JSON.stringify({ error: 'Missing key' }))
                        return
                      }
                      const { error } = await sb
                        .from('app_settings')
                        .upsert({ key, value }, { onConflict: 'key' })
                      if (error) {
                        res.statusCode = 500
                        res.setHeader('Content-Type', 'application/json')
                        res.end(JSON.stringify({ error: error.message }))
                        return
                      }
                      if (key === 'inventory_raw') serverCache.rawInventory = value
                      if (key === 'inventory_packaging') serverCache.packagingInventory = value
                      if (key === 'suppliers') serverCache.suppliers = value
                      if (key === 'fleet_riders') serverCache.fleetRiders = value
                      if (key === 'staff_accounts') serverCache.staffAccounts = value
                      if (key === 'facilities') serverCache.facilities = value
                      res.statusCode = 200
                      res.setHeader('Content-Type', 'application/json')
                      res.end(JSON.stringify({ ok: true }))
                    } catch (e: any) {
                      res.statusCode = 500
                      res.setHeader('Content-Type', 'application/json')
                      res.end(JSON.stringify({ error: e?.message || 'Invalid JSON' }))
                    }
                  })
                  return
                }

                const urlObj = new URL(req.url, 'http://localhost')
                const keysParam = urlObj.searchParams.get('keys')
                let query = sb.from('app_settings').select('key, value')
                if (keysParam) {
                  query = query.in('key', keysParam.split(',').map(k => k.trim()))
                }
                const { data, error } = await query
                if (error) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: error.message }))
                  return
                }
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ data: data || [] }))
              } catch (err: any) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err?.message || 'Server error' }))
              }
              return
            }

            if (req.url?.startsWith('/api/update-order') && (req.method === 'POST' || req.method === 'PUT')) {
              let body = ''
              req.on('data', chunk => {
                body += chunk.toString()
              })
              req.on('end', async () => {
                try {
                  const parsed = JSON.parse(body)
                  const { id, updates } = parsed
                  if (!id || !updates) {
                    res.statusCode = 400
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: 'Missing id or updates' }))
                    return
                  }
                  const { data, error } = await sb
                    .from('orders')
                    .update(updates)
                    .eq('id', String(id))
                    .select()
                  if (error) {
                    res.statusCode = 500
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: error.message }))
                    return
                  }
                  serverCache.liveOrders = null
                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ ok: true, data }))
                } catch (e: any) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: e?.message || 'Invalid JSON' }))
                }
              })
              return
            }

            if (req.url?.startsWith('/api/update-product') && (req.method === 'POST' || req.method === 'PUT')) {
              let body = ''
              req.on('data', chunk => {
                body += chunk.toString()
              })
              req.on('end', async () => {
                try {
                  const parsed = JSON.parse(body)
                  const { id, updates, insert } = parsed
                  if (insert && updates) {
                    const { data, error } = await sb
                      .from('products')
                      .insert(updates)
                      .select()
                    if (error) {
                      res.statusCode = 500
                      res.setHeader('Content-Type', 'application/json')
                      res.end(JSON.stringify({ error: error.message }))
                      return
                    }
                    serverCache.products = null
                    res.statusCode = 200
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ ok: true, data }))
                    return
                  }
                  if (!id || !updates) {
                    res.statusCode = 400
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: 'Missing id or updates' }))
                    return
                  }
                  const { data, error } = await sb
                    .from('products')
                    .update(updates)
                    .eq('id', Number(id))
                    .select()
                  if (error) {
                    res.statusCode = 500
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: error.message }))
                    return
                  }
                  serverCache.products = null
                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ ok: true, data }))
                } catch (e: any) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: e?.message || 'Invalid JSON' }))
                }
              })
              return
            }

            next()
          })
        }
      }
    ],
    resolve: {
      alias: {
        '@/components/ui/button': path.resolve(import.meta.dirname, './src/components/ui/Button.tsx'),
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
  }
})

