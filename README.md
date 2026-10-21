# SmokeyOps: Cloudflare-Inspired Operations Console

> **Domain:** Inventory Control, Kitchen Production Management, and Logistics & Fulfillment  
> **Design Pedigree:** Inspired by the enterprise console architecture of `dash.cloudflare.com`  
> **Tech Stack:** React 19 + TypeScript + Vite 8 + Tailwind CSS + Lucide Icons + Supabase

---

## 🚀 Overview

**SmokeyOps** is an independent, mission-critical operations console developed alongside **Smokey-React**. It connects directly to the shared Supabase backend database, reusing `.env` configuration keys, authentication profiles, product records, and order pipelines while providing a dedicated high-density workspace for kitchen operators, inventory controllers, and logistics dispatchers.

---

## 🛠️ Getting Started

### 1. Requirements
* Node.js $\ge 18$
* Shared `.env` file from `Smokey-React`

### 2. Run the Development Server
```bash
# In the smokey-ops-dashboard directory:
npm run dev
```

### 3. Production Build
```bash
npm run build
npm run preview
```

---

## 🎨 Visual Design Foundations (Smokey Ops Design System)

For complete rules, component specifications, and engineering checklists, refer to the **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)**.

* **Primary System Red (`#c0201f`):** Authoritative system primary color for primary actions, focus rings, and high-intent alerts (`hover: #a01a19`).
* **Cloudflare Orange (`#f6821f`):** Secondary brand accent and warm warning indicators.
* **Trend Blue (`#2563eb`):** Exclusively used for KPI trend sparklines and charts (`strokeWidth={2}`).
* **Typography Stack:**
  * **SF Pro Text:** Strictly for Data Tables (headers, cells, values), Breadcrumbs (sentence case with generous padding), Buttons, Badges, Labels, Form Inputs, and Dropdowns. **Zero monospace inside tables.**
  * **SF Pro Display:** Headings, Modal Headers (`16px font-semibold`), and large KPI numeric metrics.
* **KumoTabs:** Soft recessed light-gray track (`#f0f0f3`), white sliding pill, inline count labels `(18)`.
* **Critical Low Badges:** `#FCE8EC` light red container, `#F3B0BB` border, `#C8102E` deep red text, full pill shape.
* **Compact Actions Column:** Table row option action columns are responsive and compact (`w-12`).

---

## 📦 Core Operational Modules

1. **Inventory Management (`/inventory`)**:
   * Multi-facility stock balances across central kitchens, regional depots, and cold chain facilities.
   * Atomic stock adjustments requiring mandatory reason codes and user attribution.
   * Real-time ledger audit trail (`/inventory/movements`) tracking all movements.
   * Product & SKU registry (`/inventory/products`) with barcodes, UoMs, and reorder lines.
   * Procurement & PO Receiving (`/inventory/procurement`) with dock intake variance checking.

2. **Production Management (`/production`)**:
   * Real-time smokery pit monitor (`Smokery Pit 1`, `Smokery Pit 2`).
   * Bill of Materials (BOM) & Recipe calculator (`/production/bom`) with scrap allowances and substitutions.
   * Interactive 8-Stage Gated Lifecycle Stepper (`/production/orders`):
     `Draft` $\to$ `Planned` $\to$ `Materials Reserved` $\to$ `Ready to Produce` $\to$ `In Production` $\to$ `Quality Check` $\to$ `Completed` $\to$ `Closed`.
   * Quality Control inspection modal verifying core food temperatures ($\ge 75^\circ\text{C}$) and crediting sound units into finished inventory.

3. **Logistics & Fulfilment (`/logistics`)**:
   * Live dispatch queue (`/logistics/dispatch`) with urgency sorting (Standard, Priority, Express).
   * Printable Waybill Manifest generator with Code-128 barcodes and courier handover sign-off.
   * Active shipment milestone tracking (`/logistics/shipments`) with event checkpoints and driver contacts.
   * Returns & RMA manager (`/logistics/returns`) with restock vs. quarantine write-off disposition.
