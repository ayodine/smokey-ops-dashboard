# Smokey Hut Ops Design System & Engineering Guidelines

> **Status:** `ACTIVE / LIVING SPECIFICATION`  
> **Source of Truth:** Smokey Hut Food Processing OS Operations Dashboard (`smokey-ops-dashboard`)  
> **Aesthetic Pedigree:** Cloudflare Kumo Console (`dash.cloudflare.com`) + Smokey Brand Identity  
> **Framework Stack:** React 19 + TypeScript (Strict) + Vite + Tailwind CSS v4  
> **Mandatory Rule:** All newly added pages, modules, modals, and components **MUST** adhere strictly to the rules, tokens, and component patterns documented herein.

---

## 1. Core Visual Principles & Philosophy

1. **High Information Density with Visual Restraint**:
   - Engineered for fast, low-latency operational scanning.
   - Avoid excessive decorative whitespace, oversized gradients, or heavy drop shadows.
   - Rely on subtle hairline borders (`border-black/[0.04]` / `border-zinc-200`) and flat plate surfaces.

2. **Strict Color Meaning & Intent**:
   - **Smokey Red (`#c0201f`)**: The authoritative system primary color for primary actions, branding, focus states, and high-intent alerts (replaces legacy blue `#0051C3`).
   - **Cloudflare Signal Orange (`#f6821f`)**: Secondary brand accent and warm warning indicators.
   - **Trend Blue (`#2563eb`)**: Exclusively reserved for KPI sparklines, data trends, and charts with uniform `strokeWidth={2}`.
   - **Soft Light Gray Canvas (`#f0f0f3` / `#f4f4f6`)**: Recessed surfaces and component tracks.

3. **Deterministic Typography Stack**:
   - **SF Pro Display**: Reserved for major headings (`h1`-`h3`), Page Titles, Modal Headers, and big KPI values.
   - **SF Pro Text**: Strictly applied to ALL Data Tables (headers, rows, cells), Breadcrumbs, Buttons, Badges, Labels, Tooltips, KPI titles, Forms, and Dropdowns.
   - **SF Mono**: Used **ONLY** for technical IDs and code snippets outside tables. **STRICTLY PROHIBITED** inside standard data tables, breadcrumbs, or header selectors.

---

## 2. Color Tokens & Theme Configuration

### 2.1 Primary Palette
| Token / Name | Hex / Value | Usage |
| :--- | :--- | :--- |
| `Primary Brand Red` | `#c0201f` | Primary buttons, active highlights, critical accents |
| `Primary Hover Red` | `#a01a19` | Hover states on primary buttons |
| `Cloudflare Orange` | `#f6821f` | Brand accent, active secondary states |
| `Trend Blue` | `#2563eb` | KPI mini-charts, sparklines (`strokeWidth={2}`) |
| `Canvas Background` | `#fbfbfb` / `#ffffff` | Main page background (light mode default) |
| `Recessed Track` | `#f0f0f3` | KumoTabs container track, sunken plates |
| `Hairline Border` | `rgba(0, 0, 0, 0.05)` | Card, table, and pill dividers |

### 2.2 Tailwind CSS v4 Theme Scoping Rule
To prevent operating system dark mode settings from leaking into light mode surfaces, dark variants are strictly scoped via `@custom-variant dark`:
```css
/* src/index.css */
@import "tailwindcss";

@custom-variant dark (&:where([data-mode="dark"], [data-mode="dark"] *, .dark, .dark *));
```
- **Theme Default**: The app defaults to `'light'` in `ThemeContext.tsx`.
- Never use un-scoped `dark:*` classes with hardcoded black backgrounds that can trigger from browser OS media queries.

---

## 3. Typography Rules & Specifications

### 3.1 Font Family Mapping
```css
:root {
  --font-sf-display: "SF Pro Display", -apple-system, BlinkMacSystemFont, "SF Pro", "Helvetica Neue", sans-serif;
  --font-sf-text: "SF Pro Text", -apple-system, BlinkMacSystemFont, "SF Pro", "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  --font-sf-mono: "SF Mono", "JetBrains Mono", Menlo, Monaco, Consolas, monospace;
}
```

### 3.2 Typography Enforcement Matrix
| UI Surface | Allowed Font Family | Size & Weight | Notes |
| :--- | :--- | :--- | :--- |
| **Data Tables** | `SF Pro Text` | `11px` headers, `12px` cells | **Zero monospace inside tables**. Consistent font weight. |
| **Breadcrumbs** | `SF Pro Text` | `12px font-normal` | **Sentence case only**. No all-caps, no monospace. Padding: `py-2.5 px-6`. |
| **Modal Headers** | `SF Pro Display` | `16px (text-base) font-semibold` | Inherited across ALL modal dialogs. |
| **KPI Values** | `SF Pro Display` | `24px (text-2xl) font-bold` | High visual hierarchy, `-0.025em` letter spacing. |
| **KPI Titles** | `SF Pro Text` | `12px font-medium text-zinc-500` | Muted, concise descriptions. |
| **Sidebar Menu** | `SF Pro Text` | `13px` | Generous badge padding (`px-2 py-0.5`). |
| **Buttons / Selects** | `SF Pro Text` | `12px` or `13px font-medium` | Sentence case, balanced horizontal padding. |

---

## 4. Component Catalog & Implementation Patterns

### 4.1 Cloudflare Kumo Tabs (`KumoTabs`)
The standard multi-view toggle switch component across inventory, production, and movements:

```tsx
import { KumoTabs } from '@/components/ui/KumoTabs'

<KumoTabs
  activeTab={activeTab}
  onChange={(id) => setActiveTab(id)}
  tabs={[
    { id: 'current', label: 'Current Inventory', badge: 18 },
    { id: 'inbound', label: 'Inventory In (Received) History', badge: 8 },
    { id: 'outbound', label: 'Inventory Out (Removed) History', badge: 7 },
    { id: 'usage', label: 'Monthly Usage Summary (Sep 2026)' },
  ]}
/>
```

#### Visual Specification:
- **Track / Container**: `bg-[#f0f0f3] dark:bg-zinc-900 border border-black/[0.04] rounded-lg p-1 h-10`.
- **Sliding Pill Indicator**: Pure white `bg-white dark:bg-zinc-800 rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.06]`.
- **Pill Geometry**: Calculated via mathematical `offsetLeft`, `offsetTop`, `offsetWidth`, and `offsetHeight` with `left: 0` and CSS `transform: translateX(...)`.
- **Active Tab Label**: `text-[#18181b] dark:text-zinc-100 font-medium`.
- **Inactive Tab Label**: `text-[#60606a] hover:text-[#18181b] dark:text-zinc-400 dark:hover:text-zinc-100 font-medium`.
- **Count Badges**: Integrated inline parentheses e.g. `(18)` in `text-[#8c8c95] group-hover:text-[#60606a]` (no isolated notification dots/badges).
- **Scrollbar**: Completely hidden via `[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden`.

---

### 4.2 Status Badges & Pills

#### Critical Low Status Badge (Exact Spec)
Used for critical shortages, out-of-stock items, and urgent warnings:
- **Container**: `#FCE8EC` (soft rose-tinted background)
- **Border**: `1px solid #F3B0BB`
- **Text Color**: `#C8102E` (deep crimson red)
- **Shape**: Full pill `rounded-full` (`border-radius: 9999px`)
- **Typography**: `font-semibold text-xs` (SF Pro Text)
- **Padding**: `px-2.5 py-0.5`
- **Utility Class**: `.badge-red-pill` or `[data-badge="critical-low"]`

```tsx
<span className="badge-red-pill inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full">
  <span className="w-1.5 h-1.5 rounded-full bg-[#C8102E]" />
  Critical Low
</span>
```

#### Table Action / Edit Buttons
Action buttons inside data table rows share the light red container specification:
```tsx
<button className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-[#FCE8EC] border border-[#F3B0BB] text-[#C8102E] hover:bg-[#fad4dc] transition-colors cursor-pointer">
  <Edit3 className="w-3 h-3 text-[#C8102E]" />
  Edit
</button>
```

#### Status Badge Palette
| Status State | Container BG | Border | Text Color | Usage Example |
| :--- | :--- | :--- | :--- | :--- |
| **Critical Low / Danger** | `#FCE8EC` | `#F3B0BB` | `#C8102E` | Stock < Threshold, Damaged, Failed QA |
| **Optimal / Normal** | `#ECFDF5` | `#A7F3D0` | `#047857` | Healthy Stock, Batch Completed, Active |
| **Warning / Reorder Point**| `#FFFBEB` | `#FDE68A` | `#B45309` | Low Stock Warning, Pending Inbound |
| **Neutral / Draft** | `#F4F4F5` | `#E4E4E7` | `#52525B` | Draft Status, Archived, Scheduled |

---

### 4.3 Data Tables (`DataTable` Architecture)

Every data table in the application must satisfy:
1. **Header Row**:
   - Background: `bg-white` or `bg-zinc-50/80` with bottom border `border-b border-zinc-200`.
   - Typography: `text-[11px] font-semibold uppercase tracking-wider text-zinc-500`.
   - Alignment: Left-aligned for text/names; Right-aligned for quantities, weights, costs, and currencies.
2. **Body Rows**:
   - Height: Compact density between `36px` and `44px`.
   - Alternating/Hover: `hover:bg-zinc-50/80 transition-colors`.
   - Typography: Strictly `SF Pro Text` with normal font weight (`font-normal text-xs text-zinc-800`), bold/medium only for primary item names.
   - **Zero monospace**: Never apply `font-mono` to quantities or dates inside tables.
3. **Row Options Column (Actions Column)**:
   - **Constraint**: Must NOT be excessively wide.
   - **Width**: Responsive compact width (`w-12 text-center` or `w-14 px-2 py-2`), sized precisely to fit the row options icon button (`...` or action dropdown) with balanced padding.

```tsx
<table className="w-full text-left border-collapse" data-kumo-component="DataTable">
  <thead>
    <tr className="border-b border-zinc-200 bg-zinc-50/50">
      <th className="px-3.5 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Item Name</th>
      <th className="px-3.5 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Category</th>
      <th className="px-3.5 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-right">On Hand</th>
      <th className="px-3.5 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
      <th className="w-12 px-2 py-2.5 text-center text-[11px] font-semibold text-zinc-500 uppercase"></th>
    </tr>
  </thead>
  <tbody className="divide-y divide-zinc-100 text-xs">
    {items.map(item => (
      <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
        <td className="px-3.5 py-2 font-medium text-zinc-900">{item.name}</td>
        <td className="px-3.5 py-2 text-zinc-600">{item.category}</td>
        <td className="px-3.5 py-2 text-right font-normal text-zinc-800">{item.qty} {item.unit}</td>
        <td className="px-3.5 py-2">
          {item.status === 'low' && <span className="badge-red-pill px-2 py-0.5 text-xs font-semibold">Critical Low</span>}
        </td>
        <td className="w-12 px-2 py-2 text-center">
          <button className="p-1 rounded hover:bg-zinc-100 text-zinc-500 cursor-pointer">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

---

### 4.4 Modals & Form Dialogs

1. **Header Consistency**:
   - Title: Strictly `16px` (`text-base`), `font-semibold font-display` with consistent padding.
   - Close button: Top-right corner with `text-zinc-400 hover:text-zinc-600 p-1.5 rounded-md`.
2. **Viewport Responsiveness**:
   - Maximum height: `max-h-[85vh]` with internal smooth scrolling (`overflow-y-auto`).
   - Standard modal widths: `max-w-xl` (forms), `max-w-3xl` (complex recipes, ledgers), `max-w-5xl` (multi-step production flows).
3. **Form Fields & Custom Select Dropdowns**:
   - Uniform height: Inputs and select triggers use `h-9 px-3 text-xs rounded-md border border-zinc-300 focus:border-[#c0201f] focus:ring-1 focus:ring-[#c0201f]`.
   - **Units Display**: Never capitalize units in all-caps (use `kg`, `g`, `pcs`, `crates`, not `KG`, `PCS`).
   - **Dropdown Viewports**: Dropdown select popovers must display a generous scrollable viewport (`max-h-60`) to avoid cramped lists.
4. **Action Footer**:
   - Right-aligned buttons with generous padding (`px-4 py-2 text-xs font-medium`).
   - Primary action in `#c0201f` (`bg-[#c0201f] hover:bg-[#a01a19] text-white rounded-md`).
   - Secondary cancel action in `bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-md`.

---

### 4.5 Navigation Shell & Global Header

1. **Sidebar Navigation**:
   - **Account Selector Dropdown**: Positioned at the very top of the sidebar above the navigation list.
   - **Navigation Font**: `13px` font size with generous badge padding (`px-2 py-0.5`).
   - **Quick Search & Recent Tabs**: Top utility area providing immediate navigation to recently accessed modules with uniform font styling.
   - **Footer Branding**: "Smokey Hut Ops" with "Food Processing OS" positioned pinned at the bottom of the sidebar.
   - **Ask Ops AI**: Omitted.

2. **Global Header Bar**:
   - **Breadcrumbs**: Positioned on the left, strictly in sentence case (e.g. `Inventory / Raw materials & ingredients`), SF Pro Text, with generous padding (`py-2.5 px-6`).
   - **Office Selector**: Positioned at the far right of the top global header (where the user profile previously sat), styled as a clean select without bulky office icons or monospace fonts.
   - **User Profile**: Positioned alongside the office selector using a default clean person avatar icon (no vendor logos).

---

### 4.6 KPI Stat Cards & Analytics Trends

1. **Card Layout**:
   - Background: `bg-white border border-zinc-200 rounded-lg p-4 shadow-2xs`.
   - Title: `12px font-medium text-zinc-500` (SF Pro Text).
   - Value: `24px (text-2xl) font-bold text-zinc-900` (SF Pro Display).
2. **Trend Sparklines & Micro-Charts**:
   - Line Color: **Blue (`#2563eb`)** across all trend indicators.
   - Stroke Width: Uniform `strokeWidth={2}` for visual harmony.
   - Dot / End-point: `r={3}` with `fill="#2563eb"`.

---

### 4.7 Cloudflare Kumo Toggle Switch (`Toggle` / `ToggleSwitch`)

The authoritative toggle switch across all permissions, settings, accounts, and operational controls. Modeled directly from Cloudflare Console (`dash.cloudflare.com/members/.../policies/.../edit`).

#### Visual & Behavioral Specifications:
1. **Form Factor (Squircle, NOT Capsule Pill)**:
   - **Track**: Distinct rounded-rectangle squircle with continuous curvature (`rounded-[6px]` for `md`), avoiding generic capsule pills (`rounded-full`).
   - **Thumb**: Concentric rounded-rectangle squircle (`rounded-[5px]` for `md`) that fills the full inner track height.
2. **Dimension Standards**:
   - **`sm` (Compact)**: Track `w-[32px] h-[18px] rounded-[5px]`, Thumb `w-[15px] h-[16px] rounded-[4px]`, Active translate `translate-x-[15px]`.
   - **`md` (Standard / Default)**: Track `w-[38px] h-[20px] rounded-[6px]`, Thumb `w-[18px] h-[18px] rounded-[5px]`, Active translate `translate-x-[18px]`.
   - **`lg` (Prominent)**: Track `w-[44px] h-[24px] rounded-[7px]`, Thumb `w-[21px] h-[22px] rounded-[6px]`, Active translate `translate-x-[21px]`.
3. **State Matrices & Palette**:
   - **Active (ON)**:
     - Track: Background `#737373` (`rgb(115, 115, 115)`), Border `1px solid #525252` (`rgb(82, 82, 82)`). Hover: `#686868`.
     - Thumb: Solid white `#ffffff` with subtle elevation `shadow-[0_1px_2px_rgba(0,0,0,0.18)]`. Zero dark outer ring.
   - **Inactive (OFF)**:
     - Track: Background `#f2f2f2` (`rgb(242, 242, 242)`), Border `1px solid #d4d4d8` (`rgb(212, 212, 216)`). Hover: `#eaeaea`.
     - Thumb: Solid crisp white `#ffffff` with downward drop shadow `shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]`. Zero ghost ring.
   - **Dark Mode**:
     - Active: Track `dark:bg-[#666666] dark:border-[#444444]`, Thumb `bg-white`.
     - Inactive: Track `dark:bg-zinc-800 dark:border-zinc-700`, Thumb `bg-white`.
4. **Transition Physics**:
   - Track color transition: `transition-colors duration-150 ease-in-out`.
   - Thumb translation: `transform transition-transform duration-150 ease-in-out`.

```tsx
import { Toggle, ToggleSwitch } from '@/components/ui/Toggle'

// Standalone Switch
<Toggle
  checked={isActive}
  onChange={(checked) => setIsActive(checked)}
  ariaLabel="Enable policy"
/>

// Switch with Label & Description
<Toggle
  checked={isEnabled}
  onChange={setIsEnabled}
  label="Domain Administrator"
  description="Grants full access to zones and worker resources"
/>
```

---

### 4.8 Workflow Canvas Connecting Links & Arrowheads (`OrderWorkflowCanvasOverlay`)

The interactive pipeline topology canvas connects sequential operational pillars using high-precision SVG vector geometry, smooth curved junctions, and dynamic state-aware gradients.

#### Visual Specifications:
1. **Rounded Bullet Arrowhead (`#cf-arrow-default` & `#cf-arrow-red`)**:
   - **Form Factor**: Curved bullet / rounded isosceles arrowhead matching modern Cloudflare workflow node architecture (NOT sharp equilateral triangles).
   - **Tip & Barb Geometry**: `M 1.5 2.0 C 1.5 0.9 2.7 0.3 3.7 0.9 L 10.5 5.0 C 11.4 5.5 11.4 6.5 10.5 7.0 L 3.7 11.1 C 2.7 11.7 1.5 11.1 1.5 10.0 Z`.
   - **Marker Metrics**: `viewBox="0 0 12 12"`, `refX="10.5"`, `refY="6"`, `markerWidth="9"`, `markerHeight="9"`, `orient="auto"`, `markerUnits="userSpaceOnUse"`.
   - **Card Boundary Contact**: `refX="10.5"` guarantees the rounded tip touches the container border with zero overshoot or gap.
   - **Color Modes**:
     - Active / Completed: Crimson Red (`#dc2626`).
     - Inactive / Pending: Neutral Cool Gray (`#9ca3af`).

2. **Branch Merging & Seamless Linear Gradient**:
   - **Junction Geometry**: The horizontal feed from Node 1A and the upward trunk from Node 1B/1C merge smoothly at `x = trunkX + radius, y = targetY` via an on-ramp curve (`M ${trunkX} ${targetY + radius} Q ${trunkX} ${targetY} ${trunkX + radius} ${targetY}`).
   - **No Conflicting Overlaps**: Zero dual-drawn strokes, forks, or notched corners at the branch joint.
   - **Gradient Transition (`#cf-flow-gradient-p1-p2`)**: When Pillar 1 is active and Pillar 2 is pending, the horizontal link from `trunkX + radius` to Pillar 2 fades seamlessly from solid Red (`#dc2626`) to Gray (`#9ca3af`) using a userSpaceOnUse `<linearGradient>` with stop offsets `0%` to `100%`.

---

## 5. Checklist for Adding a New Feature or Page

Before shipping or opening a pull request for a new page or component, verify the following checklist:

- [ ] **Routing & Layout**: Page is nested inside `<AppShell>` with proper route in `src/App.tsx`.
- [ ] **Breadcrumbs**: Header breadcrumb uses sentence case, SF Pro Text, and no all-caps or monospace.
- [ ] **Tabs (if multi-view)**: Uses `<KumoTabs>` with clean light-gray track (`#f0f0f3`), white sliding pill, and inline count format `(N)`.
- [ ] **Data Tables**:
  - [ ] Every cell, header, and value uses `SF Pro Text` (no monospace).
  - [ ] Row option action column is compact (`w-12` or `w-14`).
  - [ ] Headers are `text-[11px] uppercase tracking-wider text-zinc-500`.
- [ ] **Status Badges**: Critical shortages use the exact red pill specification (`#FCE8EC` bg, `#F3B0BB` border, `#C8102E` text, `rounded-full`).
- [ ] **Modals**:
  - [ ] Header title is `16px font-semibold font-display`.
  - [ ] Dropdowns and select lists expand smoothly (`max-h-60`) without cramped scroll areas.
  - [ ] Units are lowercase (`kg`, `pcs`, `g`).
- [ ] **Buttons & Interactive Elements**:
  - [ ] Primary actions use `#c0201f` (hover `#a01a19`).
  - [ ] Focus outlines use `#c0201f`.
- [ ] **Theme Safety**: No un-scoped `dark:` classes that turn light mode backgrounds black.
- [ ] **Build Validation**: Clean compile with `npm run build` (zero TypeScript or Vite errors).
