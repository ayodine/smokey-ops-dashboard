# React AI Implementation & Deployment Specification
> **AI-Actionable Engineering Prompt & Architecture Blueprint**  
> Use this document as the system prompt or build instruction for an AI agent to build, wire, test, and deploy the **Smokey Hut Food Processing OS Operations Dashboard** in **React 19 + TypeScript + Vite + Tailwind CSS**.

---

## 1. System Prompt for the Implementing AI Agent

```markdown
You are an expert Senior Full-Stack React Engineer tasked with building and deploying the Smokey Hut Food Processing OS.
Your objective is to implement a production-grade, state-of-the-art web application covering four core operational modules:
1. Inventory (Raw, Packaging, Sales, Movements, Suppliers)
2. Production (Batches, BOM Recipe Engine, Packaging Station, Kitchen Tasks)
3. Logistics (Dispatch Board, Delivery Schedule, Third-Party Courier Margin Auditing, Store Pickup)
4. Riders / Delivery Team (Fleet Management, Individual Rider Ledgers, COD Reconciliation & Commission Clearing)

TECH STACK REQUIREMENTS:
- Framework: React 19 + Vite 8
- Language: TypeScript 5+ (Strict mode, zero `any` types)
- Styling: Tailwind CSS v4 + Framer Motion (for smooth micro-interactions)
- Routing: React Router DOM v7 (Data routers or component routes)
- State Management: React Context or Zustand + TanStack Query / Async API Client
- Icons: Lucide React
- Theme: Dark / Light Mode with seamless CSS variable tokens

QUALITY STANDARDS:
- Implement complete interactive workflows (not static mockups). Modals must open, submit, update state, and close.
- Data drift prevention: Enforce mathematical invariants (e.g. Available = On-Hand - Allocated; prevent negative stock).
- Premium aesthetics: High-contrast data tables, sticky headers, stat KPI cards, badges, and responsive layouts.
- Zero build errors: Must pass `tsc -b && vite build` cleanly.
```

---

## 2. Project Setup & Deployment Architecture

### 2.1 Package Dependencies (`package.json`)
```json
{
  "name": "smokey-ops-dashboard",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "oxlint || eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "clsx": "^2.1.1",
    "framer-motion": "^12.0.0",
    "lucide-react": "^1.16.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "tailwind-merge": "^3.0.0",
    "tailwindcss": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.7.0",
    "vite": "^6.0.0"
  }
}
```

### 2.2 Deployment Targets & Configuration Files

#### Vercel (`vercel.json`)
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### Cloudflare Pages / Netlify (`_redirects` in `public/`)
```
/*    /index.html   200
```

---

## 3. Core TypeScript Data Models (`src/types/index.ts`)

```typescript
export type ProductType = 'raw' | 'packaging' | 'sales' | 'finished';
export type MovementType = 'consumption' | 'waste' | 'adjustment' | 'sale' | 'batch_output' | 'transfer';
export type BatchStatus = 'draft' | 'in_production' | 'completed' | 'cancelled';
export type OrderStatus = 'payment_confirmed' | 'ready_for_fulfillment' | 'in_packaging' | 'packaged' | 'dispatched' | 'delivered' | 'cancelled';
export type DeliveryStatus = 'pending' | 'assigned' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed_delivery';
export type FeeVerifyStatus = 'none' | 'pending' | 'approved' | 'flagged';
export type RiderType = 'internal' | 'third_party';

// 1. Product Entity
export interface Product {
  id: number;
  sku: string;
  name: string;
  product_type: ProductType;
  unit: string;
  unit_cost: number;
  selling_price?: number | null;
  stock_qty: number;
  qty_available?: number;
  qty_allocated?: number;
  reorder_level: number;
  inventory_value: number;
  is_active: number;
}

// 2. Inbound Delivery / Receipt
export interface InboundReceipt {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  supplier_id: number;
  supplier_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  value_amount: number;
  date_received: string;
  user_name: string;
  notes?: string;
}

// 3. Stock Movement
export interface StockMovement {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  location: 'raw' | 'packaging' | 'sales' | 'finished';
  movement_type: MovementType;
  quantity: number;
  balance_after: number;
  value_amount: number;
  created_at: string;
  user_name: string;
  notes?: string;
}

// 4. Production Batch & Bill of Materials
export interface RecipeIngredient {
  product_id: number;
  sku: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface ProductionBatch {
  id: number;
  batch_ref: string;
  output_product_id: number;
  output_product_name: string;
  expected_output: number;
  actual_output: number | null;
  wastage: number;
  status: BatchStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  remarks?: string | null;
  raw_materials: RecipeIngredient[];
}

// 5. Packaging Item Consumption
export interface PackagingItemPick {
  product_id: number;
  sku: string;
  name: string;
  quantity: number;
  unit_cost: number;
}

// 6. Logistics & Deliveries
export interface DeliveryTrip {
  id: number;
  order_id: number;
  delivery_ref: string;
  order_ref: string;
  customer_name: string;
  address: string;
  phone: string;
  items_summary: string;
  delivery_fee: number;      // Customer paid
  booked_fee?: number | null; // 3rd party courier invoiced
  fee_variance?: number;     // delivery_fee - booked_fee
  rider_type: RiderType;
  assigned_rider?: string;
  assigned_rider_user_id?: number | null;
  third_party_provider?: string | null;
  status: DeliveryStatus;
  pickup_at?: string | null;
  delivered_at?: string | null;
  fee_verify_status: FeeVerifyStatus;
  fee_evidence_path?: string | null;
}

// 7. Rider Financial Account
export interface RiderAccount {
  rider_user_id: number;
  name: string;
  email?: string;
  phone?: string;
  is_delivery_rider: number;
  active_assignments: number;
  pending_payout: number;
  paid_total: number;
  lifetime_earnings: number;
  earnings_today: number;
  earnings_week: number;
  earnings_month: number;
  pending_cod_remittance?: number; // Cash on delivery collected from customers
}
```

---

## 4. Routing Table & Page Structure (`src/App.tsx`)

```tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';

// Domain Features
import { RawInventoryPage } from '@/features/inventory/RawInventoryPage';
import { PackagingInventoryPage } from '@/features/inventory/PackagingInventoryPage';
import { SalesInventoryPage } from '@/features/inventory/SalesInventoryPage';
import { StockMovementsPage } from '@/features/inventory/StockMovementsPage';
import { SuppliersPage } from '@/features/inventory/SuppliersPage';

import { ProductionBatchesPage } from '@/features/production/ProductionBatchesPage';
import { PackagingExecutionPage } from '@/features/production/PackagingExecutionPage';
import { KitchenTasksPage } from '@/features/production/KitchenTasksPage';

import { LogisticsBoardPage } from '@/features/logistics/LogisticsBoardPage';
import { DeliverySchedulePage } from '@/features/logistics/DeliverySchedulePage';
import { DeliveryTeamPage } from '@/features/logistics/DeliveryTeamPage';
import { RiderDetailPage } from '@/features/logistics/RiderDetailPage';
import { ThirdPartyLogisticsPage } from '@/features/logistics/ThirdPartyLogisticsPage';
import { StorePickupPage } from '@/features/logistics/StorePickupPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/inventory/raw" replace />} />
          
          {/* 1. INVENTORY */}
          <Route path="inventory/raw" element={<RawInventoryPage />} />
          <Route path="inventory/packaging" element={<PackagingInventoryPage />} />
          <Route path="inventory/sales" element={<SalesInventoryPage />} />
          <Route path="inventory/movements" element={<StockMovementsPage />} />
          <Route path="inventory/suppliers" element={<SuppliersPage />} />

          {/* 2. PRODUCTION */}
          <Route path="production/batches" element={<ProductionBatchesPage />} />
          <Route path="production/packaging" element={<PackagingExecutionPage />} />
          <Route path="production/tasks" element={<KitchenTasksPage />} />

          {/* 3. LOGISTICS */}
          <Route path="logistics/board" element={<LogisticsBoardPage />} />
          <Route path="logistics/schedule" element={<DeliverySchedulePage />} />
          <Route path="logistics/third-party" element={<ThirdPartyLogisticsPage />} />
          <Route path="logistics/pickup" element={<StorePickupPage />} />
          <Route path="logistics/riders" element={<DeliveryTeamPage />} />
          <Route path="logistics/riders/:id" element={<RiderDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 5. UI/UX Design System Specifications

### 5.1 Color Tokens & Dark/Light Mapping
```css
/* Smokey Hut Enterprise Palette */
:root {
  --sh-brand-primary: #c8102e;        /* Smokey Red */
  --sh-brand-primary-hover: #9f0c24;
  --sh-brand-charcoal: #111827;
  --sh-brand-amber: #f59e0b;
  --sh-brand-ink: #0f172a;
  
  /* Surfaces */
  --sh-canvas-bg: #f8fafc;
  --sh-surface-card: #ffffff;
  --sh-surface-card-hover: #f1f5f9;
  --sh-border: #e2e8f0;
  
  /* Text */
  --sh-text-primary: #0f172a;
  --sh-text-muted: #64748b;
  
  /* Status Colors */
  --sh-status-success-bg: #d1fae5;
  --sh-status-success-text: #065f46;
  --sh-status-warning-bg: #fef3c7;
  --sh-status-warning-text: #92400e;
  --sh-status-danger-bg: #fee2e2;
  --sh-status-danger-text: #991b1b;
  --sh-status-info-bg: #dbeafe;
  --sh-status-info-text: #1e40af;
}

.dark {
  --sh-canvas-bg: #090d16;
  --sh-surface-card: #141d33;
  --sh-surface-card-hover: #1a2542;
  --sh-border: rgba(255, 255, 255, 0.1);
  --sh-text-primary: #f8fafc;
  --sh-text-muted: #94a3b8;
}
```

### 5.2 Reusable Atomic Components to Implement
1. **`StatCard` (`components/ui/StatCard.tsx`):** Displays metric title, value, change pill, and icon.
2. **`DataTable` (`components/ui/DataTable.tsx`):** Sticky header table with pagination, search input, and action buttons.
3. **`Modal` (`components/ui/Modal.tsx`):** Accessible portal dialog with backdrop blur, keyboard ESC close, and footer buttons.
4. **`StatusPill` (`components/ui/StatusPill.tsx`):** Pill tag dynamically styling `success`, `warning`, `danger`, and `info` states.
5. **`TabNav` (`components/ui/TabNav.tsx`):** Pill-style tab selector with count badges.

---

## 6. Detailed Implementation Requirements by Module

### 6.1 Raw Inventory (`/inventory/raw`)
* **State & Data:** Load raw products, inbound receipts, and usage movements.
* **Header Actions:**
  * `Receive Stock`: Opens modal with fields: Supplier (dropdown), Product, Qty, Unit Cost, Notes. Increases `stock_qty` and adds to Inbound Receipts.
  * `New Product`: Opens modal with fields: SKU, Name, Unit, Unit Cost, Reorder Level.
* **Tabs:**
  1. `Current Inventory`: Table showing SKU, Name, Unit, Stock, Cost, Value, Reorder. Row turns red/amber if `stock_qty <= reorder_level`. Includes `Adjust` button (modal to +/- stock with reason).
  2. `In History`: Chronological table of receipts.
  3. `Out History`: Chronological table of raw consumption and wastage.
  4. `Monthly Usage`: Aggregate consumption totals per SKU.

### 6.2 Packaging Inventory (`/inventory/packaging`)
* **State & Data:** Packaging products and cumulative delivery totals.
* **Header Actions:** `Receive Packaging Materials` modal.
* **Tabs:**
  1. `Packaging Materials`: Stock, Unit Cost, Inventory Valuation, and reorder alerts.
  2. `Packaging Receipts (Totals)`: Summary by material with modal drill-down into receipt batches.

### 6.3 Sales Inventory (`/inventory/sales`)
* **State & Data:** Finished processed meal SKUs.
* **Tabs:**
  1. `Sales Inventory`: SKU, Name, Unit, Stock, Selling Price, Unit Cost, Total Value, Reorder Level. Actions: Edit, Adjust Stock, Delete.
  2. `Sales per Day`: Daily throughput filterable by date picker. Shows product sales breakdown, channel tags (Storefront vs POS), and total sales value.

### 6.4 Sales Stock Movements (`/inventory/movements`)
* **State & Data:** Immutable ledger of additions, deductions, and sales.
* **Features:** Date range picker, text search, and `Reverse Transaction` button (which creates a counter-balancing entry tagged `[reversed]`).

### 6.5 Suppliers (`/inventory/suppliers`)
* **State & Data:** Supplier records and total spend.
* **Header Actions:** `New Supplier` modal (Name, Phone, Email, Address, Payment Terms).
* **Tabs:** `Suppliers` directory list and `Recent Deliveries` feed.

---

### 6.6 Production Batches (`/production/batches`)
* **Lifecycle State Machine:**
  * `Draft`: Batch created with BOM ingredients.
  * `In Production`: Cook clicks **"Start"**. Started timestamp is recorded.
  * `Completed`: Cook clicks **"End"**. Opens `CompleteBatchModal` to input `actual_output` and `wastage`. **Crucial Automation: Auto-increments finished stock in Sales Inventory.**
* **Header Action `New Batch` Modal:**
  * Select target Sales SKU (e.g. *Grill Guineafowl*).
  * Enter Target Output (e.g. *50*).
  * Build BOM ingredients dynamically (Add Row: Raw Ingredient + Quantity).
  * Add Batch Notes / Shift line.

### 6.7 Packaging Execution (`/production/packaging`)
* **Workflow:**
  1. `Ready for Packaging` Tab: Orders waiting to be packed.
  2. Staff click **"Start Packaging"**: Opens mandatory **Pick Packaging Materials Modal**. Staff pick bowls/bags. **Crucial Automation: Deducts selected items from Packaging Inventory.**
  3. Order transitions to `In Packaging` Tab.
  4. Staff click **"Confirm"**: Order transitions to `packaged` and **auto-routes into the Logistics Dispatch Board**.
  5. `Daily Materials Used` Tab: Real-time packaging materials consumption today.

### 6.8 Kitchen Tasks (`/production/tasks`)
* **Features:** Task title, assignee, due time, priority (Low/Medium/Urgent), and inline buttons: **"Start"** (`in_progress`) and **"Done"** (`completed`).

---

### 6.9 Logistics Dispatch Board (`/logistics/board`)
* **Tabs:**
  1. `Awaiting Assignment`: Packaged orders with address, delivery fee, and phone.
     * Click **"Assign Rider"**: Modal to select internal rider or third-party courier.
  2. `Assigned Deliveries`: Orders currently in transit.
     * Click **"Confirm Rider Collect"**: Changes status to `in_transit` (handover confirmed).
     * Click **"Mark Delivered"**: Changes status to `delivered`. **Crucial Automation: Credits delivery fee to assigned rider's earnings balance.**

### 6.10 Delivery Schedule (`/logistics/schedule`)
* **Tabs:** `All Deliveries`, `Instant Deliveries`, `Scheduled Deliveries`.
* **Actions:** Date range filters, **"Set Date"** picker, and **"Start Schedule"** button (releases scheduled order to kitchen Packaging Queue).

### 6.11 Third-Party Logistics (`/logistics/third-party`)
* **Margin Variance Engine:** Computes $\text{Net} = \text{Order Fee} - \text{Booked Fee}$.
* **Weekly Stat Cards:** Order Fees, Booked Fees, Net Gain/Loss, Loss Count (subsidized orders), Gain Count.
* **Table Actions:** **"Approve Fee"**, **"Flag Fee"**, and **"View Receipt Image"**.

### 6.12 Store Pickup Counter (`/logistics/pickup`)
* **Features:** Packaged orders marked for customer pickup (no delivery fee). Dropdown to assign front-of-house staff, and **"Mark Collected"** button.

---

### 6.13 Riders / Delivery Team Portal (`/logistics/riders`)
* **Manager Fleet Overview:**
  * Stat Cards: Total Riders, Active Shipments on Road, Pending Commission Payouts.
  * Rider List: Click any rider row to navigate to `/logistics/riders/:id`.
* **Individual Rider Detail Page (`/logistics/riders/:id`):**
  * **Earnings Matrix:** Today, Week, Month, Lifetime, Pending Balance.
  * **Active Deliveries Table:** Orders assigned to this rider with quick transit toggles.
  * **Delivery History Table:** Searchable log of completed deliveries.
  * **"Pay & Reset Outstanding" Action:**
    * Resets `pending_payout` to `₦0.00`.
    * Increments `paid_total`.
    * Preserves `lifetime_earnings` in immutable ledger.

---

## 7. State Management & Invariant Engine

The AI agent should implement a state store (e.g. React Context or Zustand) that enforces these invariant rules:

```typescript
// Example Invariant Validation in State Store
export function processBatchCompletion(state: AppState, batchId: number, actualOutput: number, wastage: number): AppState {
  const batch = state.batches.find(b => b.id === batchId);
  if (!batch) return state;

  return {
    ...state,
    batches: state.batches.map(b => b.id === batchId ? {
      ...b,
      status: 'completed',
      actual_output: actualOutput,
      wastage,
      completed_at: new Date().toISOString()
    } : b),
    // AUTOMATION: Increment finished goods in Sales Inventory
    salesInventory: state.salesInventory.map(prod => prod.id === batch.output_product_id ? {
      ...prod,
      stock_qty: prod.stock_qty + actualOutput,
      inventory_value: (prod.stock_qty + actualOutput) * prod.unit_cost
    } : prod)
  };
}

export function processDeliveryCompletion(state: AppState, deliveryId: number): AppState {
  const trip = state.deliveries.find(d => d.id === deliveryId);
  if (!trip) return state;

  const fee = trip.delivery_fee || 0;
  const riderId = trip.assigned_rider_user_id;

  return {
    ...state,
    deliveries: state.deliveries.map(d => d.id === deliveryId ? {
      ...d,
      status: 'delivered',
      delivered_at: new Date().toISOString()
    } : d),
    // AUTOMATION: Credit rider pending payout
    riders: state.riders.map(r => r.rider_user_id === riderId ? {
      ...r,
      pending_payout: r.pending_payout + fee,
      lifetime_earnings: r.lifetime_earnings + fee,
      active_assignments: Math.max(0, r.active_assignments - 1)
    } : r)
  };
}
```

---

## 8. Step-by-Step Build & Verification Instructions for AI

```bash
# 1. Project Initialization & Validation
npm install
npm run lint

# 2. Type Checking
npx tsc -b

# 3. Development Server Test
npm run dev

# 4. Production Bundle Build Test
npm run build
npm run preview
```

### Verification Acceptance Criteria
1. **Zero TypeScript Errors:** `npx tsc -b` exits with code `0`.
2. **Navigation Works:** All 12 routes in the sidebar navigate smoothly without page reload.
3. **Modal Form Workflows:**
   * Adding a product appears in the table.
   * Creating a batch and ending it increases finished goods stock.
   * Picking packaging materials decreases packaging inventory.
   * Marking a delivery complete increases rider pending earnings.
   * Clicking "Pay & reset outstanding" sets rider pending balance to `₦0.00`.
4. **Theme Switcher:** Toggling light/dark updates surfaces and text with zero unstyled flash.
5. **Mobile Responsiveness:** Tables scroll horizontally inside container (`overflow-x-auto`); cards stack vertically on `< 768px`.
