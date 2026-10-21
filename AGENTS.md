# Smokey Hut Ops Dashboard - AI Agent Directives

> This repository contains the **Smokey Hut Food Processing OS Operations Dashboard** built with **React 19 + TypeScript + Vite + Tailwind CSS v4**.

## MANDATORY DESIGN SYSTEM COMPLIANCE

Whenever modifying, designing, or adding new pages, modals, or components to this repository, you **MUST** strictly follow [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

### Non-Negotiable Core Rules:
1. **Primary System Color**: Always use `#c0201f` (Smokey Red) for primary actions, focus rings, and high-intent alerts. Hover state is `#a01a19`.
2. **Typography Rules**:
   - **SF Pro Text**: Strictly applied to all Data Tables (cells, headers, numbers), Breadcrumbs (sentence case only, generous padding), Buttons, Badges, Labels, Form Inputs, and Dropdowns.
   - **SF Pro Display**: Strictly for Headings (`h1`-`h3`), Modal Headers (`16px font-semibold`), and large KPI numeric values.
   - **SF Mono**: Strictly PROHIBITED inside standard data tables, breadcrumbs, and header controls.
3. **KumoTabs**: Always use `<KumoTabs>` for tabbed views. The track is soft light gray (`bg-[#f0f0f3] dark:bg-zinc-900 border border-black/[0.04]`), the active pill is pure white (`bg-white dark:bg-zinc-800`), and counts use inline parentheses `(18)`.
4. **Critical Low Badge**: Must use container `#FCE8EC`, border `#F3B0BB`, and text `#C8102E` with full pill shape (`rounded-full`).
5. **Data Tables**: Row option / action column must be compact (`w-12` or `w-14`), never excessively wide.
6. **KPI Trend Sparklines**: Always use blue `#2563eb` with uniform `strokeWidth={2}`.
7. **Modals**: Must inherit `16px font-semibold font-display` header with generous button padding and non-cramped dropdown viewports.
8. **Dark Mode Theme Safety**: In Tailwind v4, dark variants are scoped via `@custom-variant dark`. Never write hardcoded `dark:bg-[#1e1e22]` on light mode containers.

Before concluding any task, always verify with `npm run build` to ensure zero compilation or type errors.
