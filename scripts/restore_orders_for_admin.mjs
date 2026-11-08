/**
 * Restore Orders and Order Items for Smokey-React/admin
 * 
 * Restores 12,106 historical customer orders and 16,004 order_items from
 * scratch/pre_purge_orders_backup.json.
 * 
 * Protects storefront product inventory by snapshotting product stock prior to
 * insertion and restoring exact stock values afterwards (counteracting on_new_order_item DB trigger).
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Parse .env
const envText = fs.readFileSync(path.join(rootDir, '.env'), 'utf8')
const env = {}
for (const line of envText.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let value = match[2] || ''
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
    env[match[1]] = value.trim()
  }
}

const supabaseUrl = env.VITE_SUPABASE_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
})

const backupPath = path.join(rootDir, 'scratch', 'pre_purge_orders_backup.json')
if (!fs.existsSync(backupPath)) {
  console.error(`Backup file not found at ${backupPath}`)
  process.exit(1)
}

const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
const orders = backup.orders || []
const orderItems = backup.order_items || []

console.log('--------------------------------------------------')
console.log(`Loaded backup: ${orders.length} orders, ${orderItems.length} order items`)
console.log('--------------------------------------------------')

async function run() {
  // Step 1: Snapshot current product stocks
  console.log('Step 1: Snapshotting current product stock levels...')
  const { data: initialProducts, error: prodErr } = await supabase
    .from('products')
    .select('id, name, stock')
  if (prodErr || !initialProducts) {
    console.error('Failed to snapshot products:', prodErr)
    process.exit(1)
  }
  const productStockSnapshot = new Map(initialProducts.map(p => [p.id, p.stock]))
  console.log(`Snapshotted ${productStockSnapshot.size} products. Sample stock levels:`)
  initialProducts.slice(0, 5).forEach(p => console.log(`  - [ID ${p.id}] ${p.name}: ${p.stock}`))

  // Step 2: Insert Orders in batches
  console.log('\nStep 2: Inserting orders into Supabase...')
  const ORDER_BATCH_SIZE = 250
  for (let i = 0; i < orders.length; i += ORDER_BATCH_SIZE) {
    const batch = orders.slice(i, i + ORDER_BATCH_SIZE)
    const { error: insErr } = await supabase.from('orders').upsert(batch, { onConflict: 'id' })
    if (insErr) {
      console.error(`Error inserting orders batch ${i} - ${i + batch.length}:`, insErr)
      process.exit(1)
    }
    const pct = Math.round(((i + batch.length) / orders.length) * 100)
    process.stdout.write(`\r  [Orders] ${i + batch.length} / ${orders.length} inserted (${pct}%)...`)
  }
  console.log('\n  Orders restored successfully.')

  // Step 3: Insert Order Items in batches
  console.log('\nStep 3: Inserting order_items into Supabase...')
  const ITEM_BATCH_SIZE = 400
  for (let i = 0; i < orderItems.length; i += ITEM_BATCH_SIZE) {
    const batch = orderItems.slice(i, i + ITEM_BATCH_SIZE)
    const { error: itemErr } = await supabase.from('order_items').upsert(batch, { onConflict: 'id' })
    if (itemErr) {
      console.error(`Error inserting order_items batch ${i} - ${i + batch.length}:`, itemErr)
      process.exit(1)
    }
    const pct = Math.round(((i + batch.length) / orderItems.length) * 100)
    process.stdout.write(`\r  [Items] ${i + batch.length} / ${orderItems.length} inserted (${pct}%)...`)
  }
  console.log('\n  Order items restored successfully.')

  // Step 4: Restore product stocks
  console.log('\nStep 4: Counteracting on_new_order_item triggers - restoring original product stocks...')
  for (const [productId, originalStock] of productStockSnapshot.entries()) {
    const { error: updateErr } = await supabase
      .from('products')
      .update({ stock: originalStock })
      .eq('id', productId)
    if (updateErr) {
      console.warn(`  Warning: Failed to restore stock for product ${productId}:`, updateErr.message)
    }
  }
  console.log('  Product stocks restored to original snapshot levels.')

  // Step 5: Verification & Safety Invariants
  console.log('\nStep 5: Verifying restored counts and operations fresh start boundary...')
  const [ordersRes, itemsRes, opsOrdersRes, verifiedProductsRes] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('order_items').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', '2026-11-06T02:00:00.000Z'),
    supabase.from('products').select('id, name, stock')
  ])

  console.log('--------------------------------------------------')
  console.log('VERIFICATION RESULTS:')
  console.log(`  - Total Orders in Supabase (Smokey-React/admin): ${ordersRes.count} (Expected: ${orders.length})`)
  console.log(`  - Total Order Items in Supabase:                 ${itemsRes.count} (Expected: ${orderItems.length})`)
  console.log(`  - Ops Live Orders (created_at >= 02:00Z):        ${opsOrdersRes.count} (Expected: 0)`)
  
  let stockDiscrepancies = 0
  if (verifiedProductsRes.data) {
    for (const p of verifiedProductsRes.data) {
      const snap = productStockSnapshot.get(p.id)
      if (snap !== undefined && p.stock !== snap) {
        console.warn(`  Discrepancy: Product ${p.id} (${p.name}): got ${p.stock}, expected ${snap}`)
        stockDiscrepancies++
      }
    }
  }
  console.log(`  - Product Stock Check: ${stockDiscrepancies === 0 ? 'All 33 products match exact snapshot (PASSED)' : `${stockDiscrepancies} mismatches (FAILED)`}`)
  console.log('--------------------------------------------------')

  if (ordersRes.count === orders.length && itemsRes.count === orderItems.length && opsOrdersRes.count === 0 && stockDiscrepancies === 0) {
    console.log('SUCCESS: Historical orders fully restored for Smokey-React/admin while Smokey Ops Dashboard remains 100% clean and isolated!')
  } else {
    console.warn('ATTENTION: Some checks had discrepancies. Please inspect the log above.')
  }
}

run().catch(err => {
  console.error('Unhandled fatal error in restore script:', err)
  process.exit(1)
})

