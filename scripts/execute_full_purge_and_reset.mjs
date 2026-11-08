import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 1. Read .env file
const envFilePath = path.resolve(__dirname, '../.env')
if (!fs.existsSync(envFilePath)) {
  console.error('ERROR: .env file not found at:', envFilePath)
  process.exit(1)
}

const envFile = fs.readFileSync(envFilePath, 'utf8')
const env = {}
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=')
  if (k && v.length) env[k.trim()] = v.join('=').trim()
})

const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function run() {
  console.log('==================================================================')
  console.log('🚀 SMOKEY OPS: COMPLETE PURGE, RESET & FRESH START EXECUTION')
  console.log('Connected to Supabase:', supabaseUrl)
  console.log('==================================================================\n')

  // -------------------------------------------------------------------------
  // STEP 1: PRE-PURGE BACKUP OF ORDERS & ORDER ITEMS
  // -------------------------------------------------------------------------
  const scratchDir = path.resolve(__dirname, '../scratch')
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true })
  }
  const backupFilePath = path.join(scratchDir, 'pre_purge_orders_backup.json')

  if (fs.existsSync(backupFilePath) && fs.statSync(backupFilePath).size > 1024 * 1024) {
    const backupStats = fs.statSync(backupFilePath)
    console.log(`📦 STEP 1: Verified existing backup at ${backupFilePath} (${(backupStats.size / (1024 * 1024)).toFixed(2)} MB). Skipping re-download.\n`)
  } else {
    console.log('📦 STEP 1: Backing up existing orders & order_items to disk...')
    let allOrders = []
    let from = 0
    const pageSize = 1000

    console.log('  -> Fetching all orders...')
    while (true) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .range(from, from + pageSize - 1)
        .order('id', { ascending: true })

      if (error) {
        console.error('Failed to fetch orders for backup:', error)
        process.exit(1)
      }
      if (!data || data.length === 0) break
      allOrders.push(...data)
      from += pageSize
      process.stdout.write(`     Retrieved ${allOrders.length} orders...\r`)
    }
    console.log(`\n  -> Successfully fetched ${allOrders.length} orders.`)

    let allOrderItems = []
    from = 0
    console.log('  -> Fetching all order_items...')
    while (true) {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .range(from, from + pageSize - 1)
        .order('id', { ascending: true })

      if (error) {
        console.error('Failed to fetch order_items for backup:', error)
        process.exit(1)
      }
      if (!data || data.length === 0) break
      allOrderItems.push(...data)
      from += pageSize
      process.stdout.write(`     Retrieved ${allOrderItems.length} order items...\r`)
    }
    console.log(`\n  -> Successfully fetched ${allOrderItems.length} order items.`)

    const backupData = {
      backup_timestamp: new Date().toISOString(),
      total_orders: allOrders.length,
      total_order_items: allOrderItems.length,
      orders: allOrders,
      order_items: allOrderItems
    }

    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8')
    const backupStats = fs.statSync(backupFilePath)
    console.log(`  ✅ Backup successfully written to ${backupFilePath} (${(backupStats.size / (1024 * 1024)).toFixed(2)} MB)\n`)
  }

  // -------------------------------------------------------------------------
  // STEP 2: DELETE ORDER_ITEMS AND ORDERS IN CHUNKS TO PREVENT TIMEOUT
  // -------------------------------------------------------------------------
  console.log('🗑️ STEP 2: Purging public.order_items and public.orders in chunks...')
  
  // A. Purge order_items in chunks of 500
  let deletedItems = 0
  while (true) {
    const { data: chunk, error: fetchErr } = await supabase
      .from('order_items')
      .select('id')
      .limit(500)

    if (fetchErr) {
      console.error('Error fetching order_items chunk:', fetchErr)
      process.exit(1)
    }
    if (!chunk || chunk.length === 0) break

    const ids = chunk.map(r => r.id)
    const { error: delErr } = await supabase
      .from('order_items')
      .delete()
      .in('id', ids)

    if (delErr) {
      console.error('Error deleting order_items batch:', delErr)
      process.exit(1)
    }
    deletedItems += ids.length
    process.stdout.write(`  -> Purged ${deletedItems} order_items...\r`)
  }
  console.log(`\n  ✅ All public.order_items purged (${deletedItems} total).`)

  // B. Purge orders in chunks of 500
  let deletedOrders = 0
  while (true) {
    const { data: chunk, error: fetchErr } = await supabase
      .from('orders')
      .select('id')
      .limit(500)

    if (fetchErr) {
      console.error('Error fetching orders chunk:', fetchErr)
      process.exit(1)
    }
    if (!chunk || chunk.length === 0) break

    const ids = chunk.map(r => r.id)
    const { error: delErr } = await supabase
      .from('orders')
      .delete()
      .in('id', ids)

    if (delErr) {
      console.error('Error deleting orders batch:', delErr)
      process.exit(1)
    }
    deletedOrders += ids.length
    process.stdout.write(`  -> Purged ${deletedOrders} orders...\r`)
  }
  console.log(`\n  ✅ All public.orders purged (${deletedOrders} total).\n`)

  // -------------------------------------------------------------------------
  // STEP 3: RESET APP_SETTINGS FOR ALL OPERATIONAL DOMAINS
  // -------------------------------------------------------------------------
  console.log('⚙️ STEP 3: Updating app_settings with clean zeroed catalogs & empty queues...')

  // Helper to get setting value
  async function getSetting(key) {
    const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle()
    if (!data || !data.value) return null
    return typeof data.value === 'string' ? JSON.parse(data.value) : data.value
  }

  // Helper to upsert setting
  async function setSetting(key, val) {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value: val, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (error) {
      console.error(`Error saving app_setting [${key}]:`, error)
      throw error
    }
  }

  // A. inventory_raw: Zero out stock quantities and inventory values
  const currentRaw = await getSetting('inventory_raw') || []
  const zeroedRaw = currentRaw.map(item => ({
    ...item,
    stock_qty: 0,
    qty_allocated: 0,
    qty_available: 0,
    qty_quarantine: 0,
    inventory_value: 0
  }))
  await setSetting('inventory_raw', zeroedRaw)
  console.log(`  ✅ inventory_raw: ${zeroedRaw.length} raw ingredients zeroed to 0.00kg / ₦0.`)

  // B. inventory_packaging: Zero out central & bench stock
  const currentPackaging = await getSetting('inventory_packaging') || []
  const zeroedPackaging = currentPackaging.map(item => ({
    ...item,
    stock_qty: 0,
    central_stock_qty: 0,
    bench_stock_qty: 0,
    qty_allocated: 0,
    qty_available: 0,
    inventory_value: 0
  }))
  await setSetting('inventory_packaging', zeroedPackaging)
  console.log(`  ✅ inventory_packaging: ${zeroedPackaging.length} packaging SKUs zeroed to 0 units / ₦0.`)

  // C. inventory_sales: Zero out finished goods stock
  const currentSales = await getSetting('inventory_sales') || []
  const zeroedSales = currentSales.map(item => ({
    ...item,
    stock_qty: 0,
    qty_allocated: 0,
    qty_available: 0,
    inventory_value: 0
  }))
  await setSetting('inventory_sales', zeroedSales)
  console.log(`  ✅ inventory_sales: ${zeroedSales.length} sales products zeroed to 0 ready portions / ₦0.`)

  // D. recipe_templates: Complete clean slate
  await setSetting('recipe_templates', [])
  console.log('  ✅ recipe_templates: Cleared to [] (fresh kitchen slate).')

  // E. suppliers: Reset spend and delivery counts
  const currentSuppliers = await getSetting('suppliers') || []
  const zeroedSuppliers = currentSuppliers.map(s => ({
    ...s,
    delivery_count: 0,
    total_spend: 0
  }))
  await setSetting('suppliers', zeroedSuppliers)
  console.log(`  ✅ suppliers: ${zeroedSuppliers.length} active suppliers reset to 0 deliveries / ₦0 spend.`)

  // F. fleet_riders: Reset all trips, earnings, and payout balances
  const currentRiders = await getSetting('fleet_riders') || []
  const zeroedRiders = currentRiders.map(r => ({
    ...r,
    today_trips: 0,
    total_completed: 0,
    earnings_today: 0,
    net_balance: 0,
    paid_total: 0,
    active_assignments: 0,
    earnings_week: 0,
    earnings_month: 0,
    pending_payout: 0,
    deliveries_week: 0,
    deliveries_month: 0,
    deliveries_today: 0,
    lifetime_earnings: 0,
    delayed_deliveries: 0,
    declined_dispatches: 0,
    status: 'active'
  }))
  await setSetting('fleet_riders', zeroedRiders)
  console.log(`  ✅ fleet_riders: ${zeroedRiders.length} in-house fleet riders reset to 0 trips / ₦0 earnings.`)

  // G. order_pipeline_state & store_pickups
  await setSetting('order_pipeline_state', {})
  console.log('  ✅ order_pipeline_state: Reset to {}.')

  await setSetting('store_pickups', [])
  console.log('  ✅ store_pickups: Reset to [].')

  // H. Reset all operational movement and production queues
  const emptyKeys = [
    'raw_movements',
    'sales_movements',
    'raw_deliveries',
    'production_batches',
    'kitchen_tasks',
    'packaging_materials_daily',
    'packaging_receipts_totals',
    'packaging_reconciliations',
    'rider_tasks',
    'inventory_lots',
    'stocktake_variances',
    'inter_station_transfers',
    'intermediate_preps',
    'compound_inventory'
  ]

  for (const k of emptyKeys) {
    await setSetting(k, [])
    console.log(`  ✅ ${k}: Reset to [].`)
  }

  // -------------------------------------------------------------------------
  // STEP 4: VERIFICATION
  // -------------------------------------------------------------------------
  console.log('\n🔍 STEP 4: Verifying database zero-baseline state...')
  const { count: finalOrderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true })
  const { count: finalItemCount } = await supabase.from('order_items').select('*', { count: 'exact', head: true })

  console.log(`  - orders remaining: ${finalOrderCount}`)
  console.log(`  - order_items remaining: ${finalItemCount}`)

  if (finalOrderCount !== 0 || finalItemCount !== 0) {
    console.error('❌ WARNING: Counts are not 0!')
    process.exit(1)
  }

  console.log('\n✨ COMPLETE: All operational data, orders, and recipes have been purged and reset to true fresh zero baseline.')
  console.log('==================================================================\n')
}

run().catch(err => {
  console.error('Purge execution error:', err)
  process.exit(1)
})
