import type { SalesProduct } from './smokeyData'

export interface VariantConfigItem {
  product_id: number
  sku: string
  variant_label: string
  match_names: string[]
  sort_order: number
}

export interface ParentProductGroupConfig {
  parent_group_key: string
  parent_id: string
  parent_name: string
  category_id: string
  unit: string
  description: string
  variants: VariantConfigItem[]
}

export const PARENT_PRODUCT_GROUPS: ParentProductGroupConfig[] = [
  {
    parent_group_key: 'smokey-guinea-fowl',
    parent_id: 'parent-smokey-guinea-fowl',
    parent_name: 'Smokey Guinea Fowl',
    category_id: 'guineafowl',
    unit: 'unit',
    description: 'Whole / Standard, Chopped, and Extra Dry variants',
    variants: [
      {
        product_id: 7,
        sku: 'WEB-PROD-7',
        variant_label: 'Whole / Standard',
        match_names: [
          'full smokey guineafowl',
          'full smokey guinea fowl',
          'smokey guinea fowl — whole / standard',
          'smokey guinea fowl - whole / standard',
        ],
        sort_order: 1,
      },
      {
        product_id: 10,
        sku: 'WEB-PROD-10',
        variant_label: 'Chopped',
        match_names: [
          'full smokey guineafowl (chopped)',
          'guinea fowl chopped',
          'chopped guineafowl',
          'smokey guinea fowl — chopped',
          'smokey guinea fowl - chopped',
        ],
        sort_order: 2,
      },
      {
        product_id: 5,
        sku: 'WEB-PROD-5',
        variant_label: 'Extra Dry',
        match_names: [
          'travel standard dry guineafowl',
          'guinea fowl extra dry',
          'extra dry guineafowl',
          'smokey guinea fowl — extra dry',
          'smokey guinea fowl - extra dry',
        ],
        sort_order: 3,
      },
    ],
  },
  {
    parent_group_key: 'king-size-smokey-guinea-fowl',
    parent_id: 'parent-king-size-smokey-guinea-fowl',
    parent_name: 'King Size Smokey Guinea Fowl',
    category_id: 'guineafowl',
    unit: 'unit',
    description: 'Standard, King Size Extra, and Extra Dry King Size variants',
    variants: [
      {
        product_id: 24,
        sku: 'WEB-PROD-24',
        variant_label: 'Standard',
        match_names: [
          'king size smokey guineafowl + gizzard',
          'king size smokey guinea fowl — standard',
          'king size smokey guinea fowl - standard',
        ],
        sort_order: 1,
      },
      {
        product_id: 30,
        sku: 'WEB-PROD-30',
        variant_label: 'King Size Extra',
        match_names: [
          'king size extra + gizzard',
          'king size smokey guinea fowl — king size extra',
          'king size smokey guinea fowl - king size extra',
        ],
        sort_order: 2,
      },
      {
        product_id: 28,
        sku: 'WEB-PROD-28',
        variant_label: 'Extra Dry King Size',
        match_names: [
          'extra dry king size guineafowl + gizzard',
          'king size smokey guinea fowl — extra dry king size',
          'king size smokey guinea fowl - extra dry king size',
        ],
        sort_order: 3,
      },
    ],
  },
  {
    parent_group_key: 'smokey-chicken',
    parent_id: 'parent-smokey-chicken',
    parent_name: 'Smokey Chicken',
    category_id: 'chicken',
    unit: 'unit',
    description: 'Full Chicken and Chopped Chicken variants',
    variants: [
      {
        product_id: 9,
        sku: 'WEB-PROD-9',
        variant_label: 'Full Chicken',
        match_names: [
          'full smokey chicken',
          'full chicken',
          'smokey chicken — full chicken',
          'smokey chicken - full chicken',
        ],
        sort_order: 1,
      },
      {
        product_id: 8,
        sku: 'WEB-PROD-8',
        variant_label: 'Chopped Chicken',
        match_names: [
          'full smokey chicken (chopped)',
          'chopped chicken',
          'smokey chicken — chopped chicken',
          'smokey chicken - chopped chicken',
        ],
        sort_order: 2,
      },
    ],
  },
]

export interface ResolvedVariantMeta {
  parent_group_key: string
  parent_id: string
  parent_name: string
  category_id: string
  variant_label: string
  sort_order: number
  sku: string
}

export function resolveProductVariantMeta(product: {
  id?: number | string | null
  product_id?: number | string | null
  variant_id?: number | string | null
  sku?: string | null
  name?: string | null
  parent_group_key?: string | null
  parent_name?: string | null
  variant_label?: string | null
  variant_sort_order?: number | null
}): ResolvedVariantMeta | null {
  if (!product) return null

  const pid = Number(product.variant_id ?? product.product_id ?? product.id)
  const normName = String(product.name || '').toLowerCase().trim()
  const normSku = String(product.sku || '').toUpperCase().trim()

  for (const group of PARENT_PRODUCT_GROUPS) {
    for (const v of group.variants) {
      if (
        (!Number.isNaN(pid) && pid > 0 && pid === v.product_id) ||
        (normSku && (normSku === v.sku || normSku === `SMK-${String(v.product_id).padStart(4, '0')}`)) ||
        (normName && v.match_names.includes(normName))
      ) {
        return {
          parent_group_key: group.parent_group_key,
          parent_id: group.parent_id,
          parent_name: group.parent_name,
          category_id: group.category_id,
          variant_label: v.variant_label,
          sort_order: v.sort_order,
          sku: v.sku,
        }
      }
    }
  }

  if (product.parent_group_key && product.variant_label) {
    const group = PARENT_PRODUCT_GROUPS.find(g => g.parent_group_key === product.parent_group_key)
    return {
      parent_group_key: product.parent_group_key,
      parent_id: group?.parent_id || `parent-${product.parent_group_key}`,
      parent_name: group?.parent_name || product.parent_name || String(product.name || ''),
      category_id: group?.category_id || 'guineafowl',
      variant_label: product.variant_label,
      sort_order: Number(product.variant_sort_order || 99),
      sku: String(product.sku || ''),
    }
  }

  return null
}

export interface SalesInventoryParentRow {
  type: 'parent_group'
  parent_group_key: string
  parent_id: string
  parent_name: string
  description: string
  unit: string
  variants: Array<SalesProduct & { variant_label: string; variant_sort_order: number }>
  total_physical_qty: number
  total_estimated_qty: number
  total_allocated_qty: number
  total_sellable_qty: number
  total_reorder_level: number
  total_retail_valuation: number
  min_price: number
  max_price: number
}

export interface SalesInventoryStandaloneRow {
  type: 'standalone'
  product: SalesProduct
}

export type SalesInventoryDisplayRow = SalesInventoryParentRow | SalesInventoryStandaloneRow

/**
 * Groups SalesProduct[] into expandable Parent Product rows (with individual variant child rows)
 * and standalone product rows. Parent totals are rolled up purely for summary display and never
 * double-counted in SKU or valuation totals.
 */
export function groupSalesInventoryByParent(
  products: SalesProduct[],
  getEstimatedForProduct?: (p: SalesProduct) => number
): SalesInventoryDisplayRow[] {
  const groupedMap = new Map<string, Array<SalesProduct & { variant_label: string; variant_sort_order: number }>>()
  const standaloneRows: SalesInventoryStandaloneRow[] = []

  for (const prod of products) {
    const meta = resolveProductVariantMeta(prod)
    if (meta) {
      const list = groupedMap.get(meta.parent_group_key) || []
      list.push({
        ...prod,
        parent_group_key: meta.parent_group_key,
        parent_name: meta.parent_name,
        variant_label: meta.variant_label,
        variant_sort_order: meta.sort_order,
      })
      groupedMap.set(meta.parent_group_key, list)
    } else {
      standaloneRows.push({ type: 'standalone', product: prod })
    }
  }

  const parentRows: SalesInventoryParentRow[] = []

  for (const groupConfig of PARENT_PRODUCT_GROUPS) {
    const variants = groupedMap.get(groupConfig.parent_group_key)
    if (!variants || variants.length === 0) continue

    variants.sort((a, b) => a.variant_sort_order - b.variant_sort_order)

    let totalPhysical = 0
    let totalEstimated = 0
    let totalAllocated = 0
    let totalSellable = 0
    let totalReorder = 0
    let totalValuation = 0
    const prices: number[] = []

    for (const v of variants) {
      const phys = Number(v.stock_qty || 0)
      const est = getEstimatedForProduct
        ? Number(getEstimatedForProduct(v) || 0)
        : Number(v.estimated_incoming_qty || 0)
      const alloc = Number(v.qty_allocated || 0)
      const sellable = Math.max(0, phys + est - alloc)
      const price = Number(v.selling_price || 0)

      totalPhysical += phys
      totalEstimated += est
      totalAllocated += alloc
      totalSellable += sellable
      totalReorder += Number(v.reorder_level || 0)
      totalValuation += phys * price
      if (price > 0) prices.push(price)
    }

    parentRows.push({
      type: 'parent_group',
      parent_group_key: groupConfig.parent_group_key,
      parent_id: groupConfig.parent_id,
      parent_name: groupConfig.parent_name,
      description: groupConfig.description,
      unit: groupConfig.unit,
      variants,
      total_physical_qty: totalPhysical,
      total_estimated_qty: totalEstimated,
      total_allocated_qty: totalAllocated,
      total_sellable_qty: totalSellable,
      total_reorder_level: totalReorder,
      total_retail_valuation: totalValuation,
      min_price: prices.length > 0 ? Math.min(...prices) : 0,
      max_price: prices.length > 0 ? Math.max(...prices) : 0,
    })
  }

  return [...parentRows, ...standaloneRows]
}

/**
 * Matches an order item or summary segment to the exact stock-bearing SalesProduct variant.
 */
export function matchOrderItemToSalesProduct(
  orderItem: {
    id?: number | string | null
    product_id?: number | string | null
    variant_id?: number | string | null
    sku?: string | null
    name?: string | null
    parent_name?: string | null
    variant_label?: string | null
  },
  salesProducts: SalesProduct[]
): SalesProduct | undefined {
  if (!orderItem || !Array.isArray(salesProducts) || salesProducts.length === 0) return undefined

  // 1. Exact ID match (variant_id -> product_id -> id)
  const candidateId = Number(orderItem.variant_id ?? orderItem.product_id ?? orderItem.id)
  if (!Number.isNaN(candidateId) && candidateId > 0) {
    const byId = salesProducts.find(sp => Number(sp.id) === candidateId)
    if (byId) return byId
  }

  // 2. Resolved variant metadata match
  const meta = resolveProductVariantMeta(orderItem)
  if (meta) {
    const group = PARENT_PRODUCT_GROUPS.find(g => g.parent_group_key === meta.parent_group_key)
    const variantCfg = group?.variants.find(v => v.variant_label === meta.variant_label)
    if (variantCfg) {
      const byVariantId = salesProducts.find(sp => Number(sp.id) === variantCfg.product_id)
      if (byVariantId) return byVariantId
    }
  }

  // 3. Name / formatted "Parent — Variant" match
  const rawName = String(orderItem.name || '').toLowerCase().trim()
  if (!rawName) return undefined

  // Check if rawName matches any configured variant match_names
  for (const group of PARENT_PRODUCT_GROUPS) {
    for (const v of group.variants) {
      if (
        v.match_names.includes(rawName) ||
        rawName === `${group.parent_name.toLowerCase()} — ${v.variant_label.toLowerCase()}` ||
        rawName === `${group.parent_name.toLowerCase()} - ${v.variant_label.toLowerCase()}`
      ) {
        const found = salesProducts.find(sp => Number(sp.id) === v.product_id)
        if (found) return found
      }
    }
  }

  // 4. Direct case-insensitive name match against salesProducts
  return salesProducts.find(sp => sp.name.toLowerCase().trim() === rawName)
}
