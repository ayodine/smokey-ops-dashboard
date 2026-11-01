const fs = require('fs');
const path = require('path');

// 1. Load Supabase Service Credentials from .env
const envPath = path.resolve(__dirname, '../.env');
const env = fs.readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) acc[k.trim()] = v.join('=').trim();
  return acc;
}, {});

const { createClient } = require('@supabase/supabase-js');
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function executeCleanStartPurge() {
  console.log('====================================================');
  console.log('🚀 EXECUTING SMOKEYOPS CLEAN-START DATA PURGE PROTOCOL');
  console.log('====================================================\n');

  // STEP 1: Reset Virtual / Dummy / Test Finished Goods Stock in Supabase 'products'
  console.log('📦 Step 1: Resetting dummy & test finished goods stock in `products` table...');
  const { data: productsWithStock, error: fetchProdError } = await sb
    .from('products')
    .select('id, name, stock')
    .gt('stock', 0);

  if (fetchProdError) {
    console.error('❌ Error fetching products:', fetchProdError);
  } else {
    console.log(`Found ${productsWithStock.length} products with test/virtual stock:`);
    for (const p of productsWithStock) {
      console.log(`   - [ID ${p.id}] ${p.name}: current stock ${p.stock} -> resetting to 0`);
    }

    const { error: resetStockError } = await sb
      .from('products')
      .update({ stock: 0 })
      .gt('stock', 0);

    if (resetStockError) {
      console.error('❌ Error updating product stock:', resetStockError);
    } else {
      console.log('✅ Successfully reset all test & virtual product stock to 0.\n');
    }
  }

  // STEP 2: Clear Test Operational Arrays in Supabase 'app_settings'
  console.log('🧹 Step 2: Purging test operational queues in `app_settings` table...');
  const settingsToClear = [
    { key: 'production_batches', value: [] },
    { key: 'intermediate_preps', value: [] },
    { key: 'compound_inventory', value: [] },
    { key: 'inter_station_transfers', value: [] },
    { key: 'raw_deliveries', value: [] },
    { key: 'raw_movements', value: [] },
    { key: 'sales_movements', value: [] },
    { key: 'order_pipeline_state', value: {} },
    { key: 'stocktake_variances', value: [] },
    { key: 'packaging_materials_daily', value: [] },
    { key: 'packaging_receipts_totals', value: [] },
    { key: 'packaging_reconciliations', value: [] },
    { key: 'kitchen_tasks', value: [] },
    { key: 'rider_tasks', value: [] },
    { key: 'store_pickups', value: [] },
  ];

  for (const s of settingsToClear) {
    const { error } = await sb
      .from('app_settings')
      .upsert({ key: s.key, value: s.value }, { onConflict: 'key' });

    if (error) {
      console.error(`❌ Failed to reset ${s.key}:`, error);
    } else {
      console.log(`   ✅ Reset ${s.key} -> ${Array.isArray(s.value) ? '[]' : '{}'}`);
    }
  }

  // STEP 3: Reset Rider Payout & Trip Counters (Preserve Roster)
  console.log('\n🏍️ Step 3: Resetting rider trip counters and wallet balances...');
  const { data: ridersRow, error: ridersFetchErr } = await sb
    .from('app_settings')
    .select('value')
    .eq('key', 'fleet_riders')
    .single();

  if (ridersFetchErr) {
    console.error('❌ Error fetching fleet_riders:', ridersFetchErr);
  } else if (Array.isArray(ridersRow?.value)) {
    const resetRiders = ridersRow.value.map(r => ({
      ...r,
      pending_payout: 0,
      net_balance: 0,
      total_completed: 0,
      today_trips: 0,
      deliveries_today: 0,
      deliveries_week: 0,
      deliveries_month: 0,
      earnings_today: 0,
      earnings_week: 0,
      earnings_month: 0,
      lifetime_earnings: 0,
      paid_total: 0,
      active_assignments: 0,
      delayed_deliveries: 0,
      declined_dispatches: 0,
      rating: 5.0,
      on_time_rate: 100,
      status: 'available'
    }));

    const { error: ridersUpdateErr } = await sb
      .from('app_settings')
      .upsert({ key: 'fleet_riders', value: resetRiders }, { onConflict: 'key' });

    if (ridersUpdateErr) {
      console.error('❌ Failed to update fleet_riders:', ridersUpdateErr);
    } else {
      console.log(`   ✅ Reset counters for all ${resetRiders.length} in-house delivery fleet riders.`);
    }
  }

  console.log('\n====================================================');
  console.log('🎉 CLEAN-START DATA PURGE COMPLETE!');
  console.log('====================================================');
}

executeCleanStartPurge().catch(console.error);
