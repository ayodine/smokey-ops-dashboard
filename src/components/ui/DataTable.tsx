import React, { useState, useMemo, useEffect, useRef } from 'react'
import { motion, useReducedMotion, AnimatePresence, type Variants } from 'framer-motion'
import { Resizable } from 'react-resizable'
import 'react-resizable/css/styles.css'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { Select } from './Select'
import { 
  Search, 
  ArrowUp, 
  ArrowDown, 
  ChevronsUpDown,
  ChevronLeft, 
  ChevronRight, 
  Download,
  Plus,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Calendar,
  Check,
  Minus,
  ArrowDownWideNarrow,
  Inbox
} from 'lucide-react'
import { Tooltip } from './Tooltip'
import { DateRangePicker, type DateRange, formatLocalDateToYMD } from './DateRangePicker'

export interface ColumnDef<T> {
  key: string
  header: string
  accessor: (item: T) => React.ReactNode
  sortValue?: (item: T) => string | number
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  className?: string
  width?: string | number
  defaultWidth?: number
}

export interface DataTableProps<T> {
  tableId?: string
  title?: string
  data: T[]
  columns: ColumnDef<T>[]
  keyExtractor?: (item: T) => string
  searchable?: boolean
  customSearchSlot?: React.ReactNode
  searchPlaceholder?: string
  searchablePlaceholder?: string
  searchFilter?: (item: T, query: string) => boolean
  onSearchChange?: (query: string) => void
  onRowClick?: (item: T) => void
  primaryAction?: {
    label: string
    icon?: React.ReactNode
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    icon?: React.ReactNode
    onClick: () => void
  }
  filterCategories?: {
    name: string
    key: string
    options: { label: string; value: string }[]
    activeValue: string
    onChange: (value: string) => void
  }[]
  bulkActions?: {
    label: string
    icon?: React.ReactNode
    onClick: (selectedItems: T[]) => void
    variant?: 'primary' | 'destructive' | 'secondary'
  }[]
  actionHeader?: string
  rowActions?: (item: T) => React.ReactNode
  isLoading?: boolean
  emptyMessage?: React.ReactNode
  exportFilename?: string
  /** Show the Export (CSV / JSON) dropdown in the toolbar. Defaults to true. */
  enableExport?: boolean
  itemsPerPageOptions?: number[]
  initialSortKey?: string
  initialSortDirection?: 'asc' | 'desc'
  mobileRender?: (item: T) => React.ReactNode
  showDefaultRowAction?: boolean
  enableColumnResize?: boolean
  enableAnimations?: boolean
  enableRowSelection?: boolean
  enableDateFilter?: boolean
  dateField?: (item: T) => string | undefined
  onDateRangeChange?: (range: DateRange) => void
  isRowExpandable?: (item: T) => boolean
  isRowExpanded?: (item: T) => boolean
  onToggleExpand?: (item: T) => void
  getSubRows?: (item: T) => T[] | undefined
  renderExpandedSubTable?: (item: T) => React.ReactNode
  /** Optional server-side pagination total count. When passed, enables controlled server pagination. */
  serverTotalCount?: number
  /** Controlled active page (1-based) */
  currentPage?: number
  /** Callback when page is changed */
  onPageChange?: (page: number) => void
  /** Callback when items per page limit changes */
  onItemsPerPageChange?: (itemsPerPage: number) => void
}

export function DataTable<T>({
  tableId,
  title,
  data,
  columns,
  keyExtractor = (item: any) => String(item?.id ?? item?.sku ?? item?.batch_ref ?? item?.order_ref ?? item?.delivery_ref ?? item?.task_ref ?? item?.week_start ?? item?.key ?? Math.random()),
  searchable = true,
  customSearchSlot,
  searchPlaceholder,
  searchablePlaceholder = 'Search records...',
  searchFilter,
  onSearchChange,
  onRowClick,
  primaryAction,
  secondaryAction,
  filterCategories,
  bulkActions,
  actionHeader = '',
  rowActions,
  isLoading = false,
  emptyMessage = 'Live operational queue is clear. Fresh incoming storefront orders will stream here in real time.',
  exportFilename = 'records.csv',
  enableExport = true,
  itemsPerPageOptions = [10, 25, 50],
  initialSortKey,
  initialSortDirection = 'asc',
  mobileRender,
  showDefaultRowAction = false,
  enableColumnResize = true,
  enableAnimations = false,
  enableRowSelection = true,
  enableDateFilter = true,
  dateField,
  onDateRangeChange,
  isRowExpandable,
  isRowExpanded,
  onToggleExpand,
  getSubRows,
  renderExpandedSubTable,
  serverTotalCount,
  currentPage: controlledCurrentPage,
  onPageChange,
  onItemsPerPageChange,
}: DataTableProps<T>) {
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<string | undefined>(initialSortKey)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection)
  const [localCurrentPage, setLocalCurrentPage] = useState(1)
  const isServerPaginated = serverTotalCount !== undefined
  const activeCurrentPage = controlledCurrentPage !== undefined ? controlledCurrentPage : localCurrentPage

  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage)
    } else {
      setLocalCurrentPage(newPage)
    }
  }
  const [itemsPerPage, setItemsPerPage] = useState(itemsPerPageOptions[0] || 10)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [dateFilterRange, setDateFilterRange] = useState<string>('all')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [showDateFilterMenu, setShowDateFilterMenu] = useState(false)

  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = enableAnimations && !shouldReduceMotion

  // Unique storage key per table for persisting column widths across pages and refreshes
  const tableStorageKey = useMemo(() => {
    const tableIdentifier = tableId || exportFilename.replace(/\.csv$/, '') || `${typeof window !== 'undefined' ? window.location.pathname : ''}_${columns.map(c => c.key).slice(0, 4).join('_')}`
    return `ops_table_widths_${tableIdentifier.replace(/[^a-zA-Z0-9_-]/g, '_')}`
  }, [tableId, exportFilename, columns])

  const isResizingRef = useRef(false)

  // Column width state for resizable columns, loaded from localStorage if previously adjusted
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = { checkbox: 48, actions: 240 }
    columns.forEach(col => {
      const parsed = typeof col.width === 'number' ? col.width : parseInt(String(col.width || '0'), 10)
      if (col.defaultWidth) {
        initial[col.key] = col.defaultWidth
      } else if (!isNaN(parsed) && parsed > 50) {
        initial[col.key] = parsed
      } else {
        const k = col.key.toLowerCase()
        if (k.includes('status') || k.includes('state')) {
          initial[col.key] = 200
        } else if (k === 'actions' || k.includes('action') || k.includes('option')) {
          initial[col.key] = col.defaultWidth || 240
        } else if (k === 'sku' || k.includes('ref') || k === 'code') {
          initial[col.key] = 150
        } else if (k.includes('date') || k.includes('time')) {
          initial[col.key] = 160
        } else if (k.includes('name') || k.includes('title') || k.includes('dish') || k.includes('product')) {
          initial[col.key] = 220
        } else if (k.includes('desc') || k.includes('notes') || k.includes('instruction') || k.includes('address') || k.includes('channel')) {
          initial[col.key] = 240
        } else if (k.includes('cost') || k.includes('price') || k.includes('value') || k.includes('spend') || k.includes('total')) {
          initial[col.key] = 165
        } else if (k.includes('qty') || k.includes('count') || k.includes('output') || k.includes('level') || k.includes('yield')) {
          initial[col.key] = 165
        } else {
          initial[col.key] = 180
        }
      }
    })

    // Try reading saved widths from localStorage
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(tableStorageKey) : null
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed === 'object' && parsed !== null) {
          if (parsed.actions && parsed.actions < 180) {
            parsed.actions = 240
          }
          return { ...initial, ...parsed }
        }
      }
    } catch (e) {
      // localStorage error fallback
    }

    return initial
  })

  // Synchronize column widths whenever tableStorageKey changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(tableStorageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed === 'object' && parsed !== null) {
          if (parsed.actions && parsed.actions < 180) {
            parsed.actions = 240
          }
          setColumnWidths(prev => ({ ...prev, ...parsed }))
        }
      }
    } catch (e) {}
  }, [tableStorageKey])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleResize = (columnKey: string, size: { width: number }) => {
    const newWidth = Math.max(80, Math.min(500, size.width))
    setColumnWidths(prev => {
      const next = {
        ...prev,
        [columnKey]: newWidth
      }
      try {
        localStorage.setItem(tableStorageKey, JSON.stringify(next))
      } catch (e) {}
      return next
    })
  }

  // Filter Data
  const filteredData = useMemo(() => {
    if (isServerPaginated) {
      let result = [...data]
      if (sortKey) {
        const col = columns.find(c => c.key === sortKey)
        if (col && col.sortable !== false) {
          result.sort((a, b) => {
            let valA: any
            let valB: any
            if (col.sortValue) {
              valA = col.sortValue(a)
              valB = col.sortValue(b)
            } else {
              valA = (a as any)[col.key] ?? ''
              valB = (b as any)[col.key] ?? ''
            }
            if (typeof valA === 'number' && typeof valB === 'number') {
              return sortDirection === 'asc' ? valA - valB : valB - valA
            }
            const strA = String(valA).toLowerCase()
            const strB = String(valB).toLowerCase()
            if (strA < strB) return sortDirection === 'asc' ? -1 : 1
            if (strA > strB) return sortDirection === 'asc' ? 1 : -1
            return 0
          })
        }
      }
      return result
    }

    let result = [...data]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      if (searchFilter) {
        result = result.filter(item => searchFilter(item, q))
      } else {
        result = result.filter(item => {
          return Object.values(item as any).some(val => {
            if (val === null || val === undefined) return false
            if (typeof val === 'object') return false
            return String(val).toLowerCase().includes(q)
          })
        })
      }
    }

    // Helper to get date string from item
    const getItemDate = (item: any): string | null => {
      if (dateField) {
        const d = dateField(item)
        if (d) return String(d)
      }
      return (
        item.delivered_at ||
        item.dispatch_date ||
        item.pickup_at ||
        item.trip_date ||
        item.scheduled_delivery_date ||
        item.scheduled_delivery_at ||
        item.paid_at ||
        item.created_at ||
        item.date ||
        item.order_date ||
        item.last_active_at ||
        item.completed_at ||
        item.updated_at ||
        item.last_received ||
        item.packaged_at ||
        item.due_date ||
        item.expiry_date ||
        item.timestamp ||
        null
      )
    }

    if (dateFilterRange !== 'all') {
      const now = new Date()
      result = result.filter(item => {
        const rawDate = getItemDate(item)
        if (!rawDate) return false
        const itemDate = new Date(rawDate)
        const isStandardDateString = typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(rawDate.trim())
        if (isNaN(itemDate.getTime()) && !isStandardDateString) return false

        let itemYMD = ''
        if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim())) {
          itemYMD = rawDate.trim()
        } else if (!isNaN(itemDate.getTime())) {
          itemYMD = formatLocalDateToYMD(itemDate)
        } else if (isStandardDateString) {
          itemYMD = String(rawDate).trim().substring(0, 10)
        }

        if (dateFilterRange === 'today') {
          return itemYMD === formatLocalDateToYMD(now)
        }
        if (dateFilterRange === 'yesterday') {
          const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
          return itemYMD === formatLocalDateToYMD(yesterday)
        }
        if (dateFilterRange === '30m') {
          return itemDate.getTime() >= (now.getTime() - 30 * 60 * 1000)
        }
        if (dateFilterRange === '1h') {
          return itemDate.getTime() >= (now.getTime() - 60 * 60 * 1000)
        }
        if (dateFilterRange === '6h') {
          return itemDate.getTime() >= (now.getTime() - 6 * 60 * 60 * 1000)
        }
        if (dateFilterRange === '12h') {
          return itemDate.getTime() >= (now.getTime() - 12 * 60 * 60 * 1000)
        }
        if (dateFilterRange === '24h') {
          return itemDate.getTime() >= (now.getTime() - 24 * 60 * 60 * 1000)
        }
        if (dateFilterRange === '7d' || dateFilterRange === '7days') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return itemDate.getTime() >= sevenDaysAgo.getTime()
        }
        if (dateFilterRange === '30d' || dateFilterRange === '30days') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          return itemDate.getTime() >= thirtyDaysAgo.getTime()
        }
        if (dateFilterRange === 'month') {
          return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
        }
        if (dateFilterRange === 'custom') {
          if (!itemYMD) return false
          if (customStartDate && itemYMD < customStartDate) return false
          if (customEndDate && itemYMD > customEndDate) return false
          return true
        }
        return true
      })
    }

    if (sortKey) {
      const col = columns.find(c => c.key === sortKey)
      if (col && col.sortable !== false) {
        result.sort((a, b) => {
          let valA: any
          let valB: any
          if (col.sortValue) {
            valA = col.sortValue(a)
            valB = col.sortValue(b)
          } else {
            valA = (a as any)[col.key] ?? ''
            valB = (b as any)[col.key] ?? ''
          }
          if (typeof valA === 'number' && typeof valB === 'number') {
            return sortDirection === 'asc' ? valA - valB : valB - valA
          }
          const strA = String(valA).toLowerCase()
          const strB = String(valB).toLowerCase()
          if (strA < strB) return sortDirection === 'asc' ? -1 : 1
          if (strA > strB) return sortDirection === 'asc' ? 1 : -1
          return 0
        })
      }
    }

    return result
  }, [isServerPaginated, data, searchQuery, searchFilter, sortKey, sortDirection, columns, dateFilterRange, customStartDate, customEndDate, dateField])

  // Pagination calculations
  const effectiveTotalCount = isServerPaginated ? (serverTotalCount ?? 0) : filteredData.length
  const totalPages = Math.max(1, Math.ceil(effectiveTotalCount / itemsPerPage))
  const paginatedData = useMemo(() => {
    if (isServerPaginated) {
      return filteredData
    }
    const start = (activeCurrentPage - 1) * itemsPerPage
    return filteredData.slice(start, start + itemsPerPage)
  }, [isServerPaginated, filteredData, activeCurrentPage, itemsPerPage])

  // Sorting Handler
  const handleSort = (key: string) => {
    if (isResizingRef.current) return
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc')
      else {
        setSortKey(undefined)
        setSortDirection('asc')
      }
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
    setShowSortMenu(false)
  }

  // Row Selection Handlers
  const handleToggleRow = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedData.length) {
      setSelectedIds(new Set())
    } else {
      const allIds = new Set(paginatedData.map(item => keyExtractor(item)))
      setSelectedIds(allIds)
    }
  }

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredData.length) return

    const headers = columns.map(c => c.header).join(',')
    const rows = filteredData.map(item => {
      return columns
        .map(c => {
          const val = c.sortValue ? c.sortValue(item) : (item as any)[c.key] ?? ''
          const stringVal = String(val).replace(/"/g, '""')
          return `"${stringVal}"`
        })
        .join(',')
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', exportFilename.endsWith('.csv') ? exportFilename : `${exportFilename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export Selected Rows to CSV
  const handleExportSelectedCSV = () => {
    if (!selectedItems.length) return

    const headers = columns.map(c => c.header).join(',')
    const rows = selectedItems.map(item => {
      return columns
        .map(c => {
          const val = c.sortValue ? c.sortValue(item) : (item as any)[c.key] ?? ''
          const stringVal = String(val).replace(/"/g, '""')
          return `"${stringVal}"`
        })
        .join(',')
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${exportFilename.replace(/\.csv$/, '')}-selected.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export to JSON
  const handleExportJSON = () => {
    if (!filteredData.length) return

    const jsonContent = JSON.stringify(filteredData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${exportFilename.replace(/\.csv$/, '')}-${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  const selectedItems = useMemo(() => {
    return data.filter(item => selectedIds.has(keyExtractor(item)))
  }, [data, selectedIds, keyExtractor])

  const isAllSelected =
    paginatedData.length > 0 && paginatedData.every(item => selectedIds.has(keyExtractor(item)))
  const isPartiallySelected =
    selectedIds.size > 0 && !isAllSelected

  const hasRowAction = Boolean(rowActions)

  // Framer motion variants
  const containerVariants: Variants = {
    visible: {
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.05,
      },
    }
  }

  const rowVariants: Variants = {
    hidden: { 
      opacity: 1, 
      y: 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0,
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.1 }
    }
  }

  const currentDateRange: DateRange = useMemo(() => {
    if (dateFilterRange === 'custom' && customStartDate && customEndDate) {
      return {
        start: new Date(customStartDate + 'T00:00:00'),
        end: new Date(customEndDate + 'T23:59:59.999'),
        presetKey: 'custom'
      }
    }
    if (dateFilterRange !== 'all') {
      return {
        start: null,
        end: null,
        presetKey: dateFilterRange
      }
    }
    return {
      start: null,
      end: null,
      presetKey: 'all'
    }
  }, [dateFilterRange, customStartDate, customEndDate])

  return (
    <div className="space-y-3.5 select-none font-sans">
      {/* Section Title */}
      {title && (
        <h2 className="text-[15px] sm:text-base font-semibold text-foreground tracking-normal">
          {title}
        </h2>
      )}

      {/* Header Bar: Search input on left, Action and Sort/Export buttons on right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Wide Search Bar & Category Filters */}
        <div className="flex items-center gap-2.5 flex-1 max-w-2xl">
          {customSearchSlot ? (
            <div className="relative flex-1">
              {customSearchSlot}
            </div>
          ) : searchable ? (
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  const val = e.target.value
                  setSearchQuery(val)
                  handlePageChange(1)
                  onSearchChange?.(val)
                }}
                placeholder={searchPlaceholder || searchablePlaceholder}
                className="w-full h-10 pl-10 pr-4 text-sm rounded-lg ring ring-border/60 bg-background text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          ) : null}

          {filterCategories && (
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {filterCategories.map(cat => (
                <div key={cat.key} className="min-w-[130px]">
                  <Select
                    value={cat.activeValue}
                    onValueChange={val => {
                      cat.onChange(String(val))
                      handlePageChange(1)
                    }}
                    options={cat.options}
                    size="md"
                    buttonClassName="h-10 text-[13px] font-medium"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Actions, Sort, Date Filter, and Export Dropdowns */}
        <div className="flex items-center gap-2 justify-end shrink-0 flex-wrap">
          {/* Custom Date Filter */}
          {enableDateFilter && (
            <DateRangePicker
              value={currentDateRange}
              onChange={(range) => {
                if (range.presetKey === 'all') {
                  setCustomStartDate('')
                  setCustomEndDate('')
                  setDateFilterRange('all')
                } else if (range.presetKey && range.presetKey !== 'custom') {
                  setCustomStartDate(range.start ? formatLocalDateToYMD(range.start) : '')
                  setCustomEndDate(range.end ? formatLocalDateToYMD(range.end) : '')
                  setDateFilterRange(range.presetKey)
                } else {
                  if (range.start && range.end) {
                    setCustomStartDate(formatLocalDateToYMD(range.start))
                    setCustomEndDate(formatLocalDateToYMD(range.end))
                  }
                  setDateFilterRange('custom')
                }
                handlePageChange(1)
                onDateRangeChange?.(range)
              }}
            />
          )}

          {/* Sort Dropdown Menu */}
          <div className="relative">
            <Tooltip content="Sort table rows">
              <button 
                type="button"
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="px-3.5 py-2 h-10 bg-background border border-border text-foreground text-[13px] font-medium hover:bg-muted/30 transition-colors flex items-center gap-2 rounded-lg cursor-pointer shadow-xs"
              >
                <ArrowDownWideNarrow className="w-4 h-4 text-foreground/80 shrink-0" />
                <span>Sort</span>
                {sortKey && (
                  <span className="ml-0.5 text-[13px] bg-primary text-primary-foreground rounded-sm px-1.5 py-0.2 font-medium">
                    1
                  </span>
                )}
                <ChevronDown size={14} className="opacity-60" />
              </button>
            </Tooltip>
            
            {showSortMenu && (
              <>
                <div 
                  className="fixed inset-0 z-30"
                  onClick={() => setShowSortMenu(false)}
                />
                <div className="absolute right-0 mt-1.5 w-52 bg-background border border-border shadow-xl rounded-lg z-40 py-1.5 animate-in fade-in zoom-in-95">
                  <div className="px-3.5 py-1 text-[11px] font-semibold uppercase text-muted-foreground border-b border-border/50 mb-1">
                    Sort Column
                  </div>
                  {columns.filter(c => c.sortable !== false).map(c => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => handleSort(c.key)}
                      className={cn(
                        'w-full px-3.5 py-2 text-left text-[13px] hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-between',
                        sortKey === c.key && 'bg-muted/30 font-semibold text-primary'
                      )}
                    >
                      <span>{c.header}</span>
                      {sortKey === c.key && (
                        <span className="text-xs text-primary font-semibold">
                          {sortDirection === 'asc' ? '↑ ASC' : '↓ DESC'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Export Dropdown Menu */}
          {enableExport && (
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3.5 py-2 h-10 bg-background border border-border text-foreground text-[13px] font-medium hover:bg-muted/30 transition-colors flex items-center gap-2 rounded-lg cursor-pointer shadow-xs"
            >
              <Download size={15} />
              <span>Export</span>
              <ChevronDown size={14} className="opacity-60" />
            </button>
            
            {showExportMenu && (
              <>
                <div 
                  className="fixed inset-0 z-30"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 mt-1.5 w-44 bg-background border border-border shadow-xl rounded-lg z-40 py-1.5 animate-in fade-in zoom-in-95">
                  <div className="px-3.5 py-1 text-[11px] font-semibold uppercase text-muted-foreground border-b border-border/50 mb-1">
                    Export Format
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleExportCSV()
                      setShowExportMenu(false)
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-[13px] hover:bg-muted/50 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>CSV Spreadsheet</span>
                    <span className="text-xs font-medium text-muted-foreground uppercase">.csv</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleExportJSON()
                      setShowExportMenu(false)
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-[13px] hover:bg-muted/50 transition-colors flex items-center justify-between border-t border-border/40 cursor-pointer"
                  >
                    <span>JSON Raw Data</span>
                    <span className="text-xs font-medium text-muted-foreground uppercase">.json</span>
                  </button>
                </div>
              </>
            )}
          </div>
          )}

          {secondaryAction && (
            <Button
              size="md"
              variant="secondary"
              onClick={secondaryAction.onClick}
              leftIcon={secondaryAction.icon || <Plus className="w-4 h-4" />}
              className="h-9.5 px-3.5 text-xs font-medium"
            >
              {secondaryAction.label}
            </Button>
          )}

          {primaryAction && (
            <Button
              size="md"
              variant="brand"
              onClick={primaryAction.onClick}
              leftIcon={primaryAction.icon || <Plus className="w-4 h-4" />}
              className="h-9.5 px-4 text-xs font-medium"
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>

      {/* Multi-Select Action Strip */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg px-3.5 py-2.5 flex items-center justify-between animate-in fade-in flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary">
              {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'} selected
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="xs"
              variant="secondary"
              onClick={handleExportSelectedCSV}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Selected
            </Button>
            {bulkActions?.map((action, i) => (
              <Button
                key={i}
                size="xs"
                variant={action.variant || 'secondary'}
                onClick={() => action.onClick(selectedItems)}
                leftIcon={action.icon}
              >
                {action.label}
              </Button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer ml-1"
            >
              Deselect all
            </button>
          </div>
        </div>
      )}

      {/* Resizable Table Container with Vertical Cell Dividers and Light Mode Styling */}
      <div data-table-container="true" className="hidden md:block rounded-lg border border-border/60 bg-background overflow-hidden shadow-xs relative">
        <div className="overflow-x-auto min-w-full">
          <div className="w-max min-w-full inline-block align-middle">
            {/* Header: Vertical dividers, resizable handles */}
            <div className="w-max min-w-full flex text-xs font-medium text-muted-foreground/80 bg-muted/5 border-b border-border items-stretch">
              {enableRowSelection && (
                <div 
                  className="flex items-center justify-center border-r border-border px-3 py-3 shrink-0" 
                  style={{ width: columnWidths.checkbox || 48 }}
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isAllSelected}
                    onClick={handleSelectAll}
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer bg-white dark:bg-zinc-900',
                      isAllSelected || isPartiallySelected
                        ? 'border-[#c0201f]'
                        : 'border-border/80 hover:border-kumo-line-strong'
                    )}
                  >
                    {isAllSelected ? (
                      <Check className="w-3.5 h-3.5 text-[#c0201f] stroke-[2.5]" />
                    ) : isPartiallySelected ? (
                      <Minus className="w-3 h-3 text-[#c0201f] stroke-[2.5]" />
                    ) : null}
                  </button>
                </div>
              )}

              {(renderExpandedSubTable || getSubRows) && (
                <div
                  className="flex items-center justify-center border-r border-border px-2.5 py-3 shrink-0"
                  style={{ width: 48 }}
                />
              )}

              {columns.map(col => {
                const currentWidth = columnWidths[col.key] || 180
                const isColSortable = col.sortable !== false

                const headerContent = (
                  <div
                    className={cn(
                      'flex items-center gap-1.5 border-r border-border px-4 py-3 relative overflow-hidden font-medium text-muted-foreground/90 select-none h-full',
                      isColSortable && 'cursor-pointer hover:text-foreground transition-colors'
                    )}
                    style={{ width: currentWidth, minWidth: currentWidth, flex: '1 1 0%' }}
                    onClick={(e) => {
                      if (isResizingRef.current) {
                        e.preventDefault()
                        e.stopPropagation()
                        return
                      }
                      if (isColSortable) handleSort(col.key)
                    }}
                  >
                    <span className="truncate">{col.header}</span>
                    {isColSortable && (
                      <span className="text-muted-foreground/60 shrink-0 ml-auto pr-1.5">
                        {sortKey === col.key ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                )

                if (!enableColumnResize) return <React.Fragment key={col.key}>{headerContent}</React.Fragment>

                return (
                  <Resizable
                    key={col.key}
                    width={currentWidth}
                    height={0}
                    onResizeStart={() => {
                      isResizingRef.current = true
                    }}
                    onResize={(_e, data) => {
                      isResizingRef.current = true
                      handleResize(col.key, data.size)
                    }}
                    onResizeStop={() => {
                      setTimeout(() => {
                        isResizingRef.current = false
                      }, 250)
                    }}
                    minConstraints={[80, 0]}
                    maxConstraints={[500, 0]}
                    handle={
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-3.5 -mr-1.5 cursor-col-resize z-20 flex items-center justify-center group/resize select-none"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          isResizingRef.current = true
                        }}
                      >
                        <div className="w-[2px] h-full bg-transparent group-hover/resize:bg-primary/50 transition-colors" />
                      </div>
                    }
                  >
                    {headerContent}
                  </Resizable>
                )
              })}

              {hasRowAction && (
                <div 
                  className="flex items-center justify-center px-3 py-3 text-xs font-medium text-muted-foreground border-r border-border shrink-0 select-none" 
                  style={{ width: columnWidths.actions || 240 }}
                >
                  {actionHeader || 'Action'}
                </div>
              )}
            </div>

            {/* Rows with Light Mode Padding */}
            <div className="w-full min-w-full">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="py-4 px-6 border-b border-border flex items-center animate-pulse w-full">
                      <div className="h-4 bg-muted/40 rounded w-full" />
                    </div>
                  ))
                ) : paginatedData.length === 0 ? (
                  <div className="py-16 px-6 text-center w-full flex flex-col items-center justify-center">
                    {typeof emptyMessage === 'string' ? (
                      <div className="max-w-md mx-auto flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-muted/40 border border-border/80 flex items-center justify-center mb-3 text-muted-foreground/80">
                          {Boolean(searchQuery.trim()) ? <Search className="w-5 h-5 text-primary" /> : <Inbox className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                        </div>
                        <h4 className="text-sm font-semibold text-foreground mb-1">
                          {Boolean(searchQuery.trim()) ? 'No Matching Records' : 'Active Queue Clear'}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {emptyMessage}
                        </p>
                      </div>
                    ) : (
                      emptyMessage
                    )}
                  </div>
                ) : (
                  paginatedData.map(item => {
                    const id = keyExtractor(item)
                    const isSelected = selectedIds.has(id)
                    const expandable = Boolean((renderExpandedSubTable || getSubRows) && isRowExpandable?.(item))
                    const expanded = Boolean(expandable && isRowExpanded?.(item))
                    const subRows = expanded && getSubRows ? getSubRows(item) : undefined

                    return (
                      <div
                        key={id}
                        className="w-full min-w-full border-b border-border"
                      >
                        <div
                          onClick={() => onRowClick?.(item)}
                          className={cn(
                            'w-max min-w-full group relative transition-all duration-150 flex items-stretch',
                            isSelected 
                              ? 'bg-muted/30' 
                              : 'bg-muted/5 hover:bg-muted/20',
                            onRowClick && 'cursor-pointer'
                          )}
                        >
                          {enableRowSelection && (
                            <div 
                              className="flex items-center justify-center border-r border-border px-3 py-3 shrink-0"
                              style={{ width: columnWidths.checkbox || 48 }}
                              onClick={e => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={isSelected}
                                onClick={() => handleToggleRow(id)}
                                className={cn(
                                  'w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer bg-white dark:bg-zinc-900',
                                  isSelected
                                    ? 'border-[#c0201f]'
                                    : 'border-border/80 hover:border-kumo-line-strong'
                                )}
                              >
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-[#c0201f] stroke-[2.5]" />
                                )}
                              </button>
                            </div>
                          )}

                          {(renderExpandedSubTable || getSubRows) && (
                            <div
                              className="flex items-center justify-center border-r border-border px-2.5 py-3 shrink-0"
                              style={{ width: 48 }}
                              onClick={e => e.stopPropagation()}
                            >
                              {expandable ? (
                                <button
                                  type="button"
                                  onClick={() => onToggleExpand?.(item)}
                                  aria-label={expanded ? 'Collapse variants' : 'Expand variants'}
                                  className="w-7 h-7 rounded-lg bg-zinc-100/90 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 transition-colors cursor-pointer shadow-2xs"
                                >
                                  {expanded ? (
                                    <ChevronUp className="w-3.5 h-3.5 stroke-[2.2]" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 stroke-[2.2]" />
                                  )}
                                </button>
                              ) : null}
                            </div>
                          )}

                          {columns.map((col, colIdx) => {
                            const currentWidth = columnWidths[col.key] || 180
                            return (
                              <div
                                key={col.key}
                                style={{ width: currentWidth, minWidth: currentWidth, flex: '1 1 0%' }}
                                className={cn(
                                  'flex items-center border-r border-border px-4 py-3 min-w-0 text-xs text-foreground leading-normal font-sans',
                                  col.key.toLowerCase().includes('action') ? 'overflow-visible' : 'overflow-hidden',
                                  colIdx === 0 ? 'font-medium' : 'font-normal',
                                  col.align === 'right' && 'justify-end text-right',
                                  col.align === 'center' && 'justify-center text-center',
                                  col.className
                                )}
                              >
                                <div className={cn(
                                  'w-full max-w-full min-w-0 flex items-center',
                                  col.key.toLowerCase().includes('action') ? 'overflow-visible' : 'overflow-hidden',
                                  col.align === 'right' ? 'justify-end text-right' : col.align === 'center' ? 'justify-center text-center' : 'justify-start text-left',
                                  // Standalone badges & pills adapt naturally without being squeezed
                                  '[&>[data-kumo-component="Badge"]]:w-auto [&>[data-kumo-component="Badge"]]:max-w-full [&>[data-kumo-component="Badge"]]:shrink-0 [&>[data-kumo-component="Badge"]]:whitespace-nowrap',
                                  '[&>[data-badge]]:w-auto [&>[data-badge]]:max-w-full [&>[data-badge]]:shrink-0 [&>[data-badge]]:whitespace-nowrap',
                                  // Action container keeps buttons naturally sized side by side
                                  '[&>div:has(button)]:w-auto [&>div:has(button)]:max-w-full [&>div:has(button)]:flex [&>div:has(button)]:items-center [&>div:has(button)]:gap-1.5 [&>div:has(button)]:shrink-0',
                                  '[&>div:has([data-kumo-tooltip])]:w-auto [&>div:has([data-kumo-tooltip])]:max-w-full [&>div:has([data-kumo-tooltip])]:flex [&>div:has([data-kumo-tooltip])]:items-center [&>div:has([data-kumo-tooltip])]:gap-1.5 [&>div:has([data-kumo-tooltip])]:shrink-0',
                                  // Buttons inside action containers maintain natural width and padding
                                  '[&>div:has(button)>button]:w-auto [&>div:has(button)>button]:shrink-0 [&>div:has(button)>button]:flex-none [&>div:has(button)>button]:whitespace-nowrap',
                                  '[&>div:has(button)>[data-kumo-tooltip]]:w-auto [&>div:has(button)>[data-kumo-tooltip]]:shrink-0 [&>div:has(button)>[data-kumo-tooltip]]:flex-none',
                                  '[&_[data-kumo-tooltip]>button]:w-auto [&_[data-kumo-tooltip]>button]:shrink-0 [&_[data-kumo-tooltip]>button]:flex-none [&_[data-kumo-tooltip]>button]:whitespace-nowrap',
                                  '[&_button]:whitespace-nowrap',
                                  // Standalone rounded status spans maintain natural pill shape
                                  '[&>span[class*="rounded"]]:w-auto [&>span[class*="rounded"]]:max-w-full [&>span[class*="rounded"]]:shrink-0 [&>span[class*="rounded"]]:inline-flex [&>span[class*="rounded"]]:whitespace-nowrap',
                                  // Text labels and divs adapt with clean truncation, protecting badge pills
                                  '[&>span:not([class*="rounded"]):not([data-kumo-component])]:truncate [&>div]:min-w-0'
                                )}>
                                  {col.accessor(item)}
                                </div>
                              </div>
                            )
                          })}

                          {hasRowAction && (
                            <div 
                              className="flex items-center justify-center px-3 py-3 border-r border-border shrink-0 text-xs"
                              style={{ width: columnWidths.actions || 240 }}
                            >
                              <div className="w-full max-w-full min-w-0 flex items-center justify-center [&_button]:w-auto [&_button]:shrink-0 [&_button]:flex-none [&_button]:whitespace-nowrap gap-1.5">
                                {rowActions ? (
                                  rowActions(item)
                                ) : null}
                              </div>
                            </div>
                          )}
                        </div>

                        {subRows && subRows.map(subItem => {
                          const subId = keyExtractor(subItem)
                          const isSubSelected = selectedIds.has(subId)
                          return (
                            <div
                              key={subId}
                              onClick={() => onRowClick?.(subItem)}
                              className={cn(
                                'w-max min-w-full group relative transition-all duration-150 flex items-stretch border-t border-border',
                                isSubSelected
                                  ? 'bg-muted/30'
                                  : 'bg-muted/5 hover:bg-muted/20',
                                onRowClick && 'cursor-pointer'
                              )}
                            >
                              {enableRowSelection && (
                                <div
                                  className="flex items-center justify-center border-r border-border px-3 py-3 shrink-0"
                                  style={{ width: columnWidths.checkbox || 48 }}
                                  onClick={e => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    role="checkbox"
                                    aria-checked={isSubSelected}
                                    onClick={() => handleToggleRow(subId)}
                                    className={cn(
                                      'w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer bg-white dark:bg-zinc-900',
                                      isSubSelected
                                        ? 'border-[#c0201f]'
                                        : 'border-border/80 hover:border-kumo-line-strong'
                                    )}
                                  >
                                    {isSubSelected && (
                                      <Check className="w-3.5 h-3.5 text-[#c0201f] stroke-[2.5]" />
                                    )}
                                  </button>
                                </div>
                              )}

                              {(renderExpandedSubTable || getSubRows) && (
                                <div
                                  className="flex items-center justify-center border-r border-border px-2.5 py-3 shrink-0"
                                  style={{ width: 48 }}
                                  onClick={e => e.stopPropagation()}
                                />
                              )}

                              {columns.map((col, colIdx) => {
                                const currentWidth = columnWidths[col.key] || 180
                                return (
                                  <div
                                    key={col.key}
                                    style={{ width: currentWidth, minWidth: currentWidth, flex: '1 1 0%' }}
                                    className={cn(
                                      'flex items-center border-r border-border py-3 min-w-0 text-xs text-foreground leading-normal font-sans',
                                      colIdx === 0 ? 'pl-9 pr-4 font-medium' : 'px-4 font-normal',
                                      col.key.toLowerCase().includes('action') ? 'overflow-visible' : 'overflow-hidden',
                                      col.align === 'right' && 'justify-end text-right',
                                      col.align === 'center' && 'justify-center text-center',
                                      col.className
                                    )}
                                  >
                                    <div className={cn(
                                      'w-full max-w-full min-w-0 flex items-center',
                                      col.key.toLowerCase().includes('action') ? 'overflow-visible' : 'overflow-hidden',
                                      col.align === 'right' ? 'justify-end text-right' : col.align === 'center' ? 'justify-center text-center' : 'justify-start text-left',
                                      '[&>[data-kumo-component="Badge"]]:w-auto [&>[data-kumo-component="Badge"]]:max-w-full [&>[data-kumo-component="Badge"]]:shrink-0 [&>[data-kumo-component="Badge"]]:whitespace-nowrap',
                                      '[&>[data-badge]]:w-auto [&>[data-badge]]:max-w-full [&>[data-badge]]:shrink-0 [&>[data-badge]]:whitespace-nowrap',
                                      '[&>div:has(button)]:w-auto [&>div:has(button)]:max-w-full [&>div:has(button)]:flex [&>div:has(button)]:items-center [&>div:has(button)]:gap-1.5 [&>div:has(button)]:shrink-0',
                                      '[&>div:has([data-kumo-tooltip])]:w-auto [&>div:has([data-kumo-tooltip])]:max-w-full [&>div:has([data-kumo-tooltip])]:flex [&>div:has([data-kumo-tooltip])]:items-center [&>div:has([data-kumo-tooltip])]:gap-1.5 [&>div:has([data-kumo-tooltip])]:shrink-0',
                                      '[&>div:has(button)>button]:w-auto [&>div:has(button)>button]:shrink-0 [&>div:has(button)>button]:flex-none [&>div:has(button)>button]:whitespace-nowrap',
                                      '[&>div:has(button)>[data-kumo-tooltip]]:w-auto [&>div:has(button)>[data-kumo-tooltip]]:shrink-0 [&>div:has(button)>[data-kumo-tooltip]]:flex-none',
                                      '[&_[data-kumo-tooltip]>button]:w-auto [&_[data-kumo-tooltip]>button]:shrink-0 [&_[data-kumo-tooltip]>button]:flex-none [&_[data-kumo-tooltip]>button]:whitespace-nowrap',
                                      '[&_button]:whitespace-nowrap',
                                      '[&>span[class*="rounded"]]:w-auto [&>span[class*="rounded"]]:max-w-full [&>span[class*="rounded"]]:shrink-0 [&>span[class*="rounded"]]:inline-flex [&>span[class*="rounded"]]:whitespace-nowrap',
                                      '[&>span:not([class*="rounded"]):not([data-kumo-component])]:truncate [&>div]:min-w-0'
                                    )}>
                                      {col.accessor(subItem)}
                                    </div>
                                  </div>
                                )
                              })}

                              {hasRowAction && (
                                <div
                                  className="flex items-center justify-center px-3 py-3 border-r border-border shrink-0 text-xs"
                                  style={{ width: columnWidths.actions || 240 }}
                                >
                                  <div className="w-full max-w-full min-w-0 flex items-center justify-center [&_button]:w-auto [&_button]:shrink-0 [&_button]:flex-none [&_button]:whitespace-nowrap gap-1.5">
                                    {rowActions ? rowActions(subItem) : null}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}

                        {expanded && renderExpandedSubTable && (
                          <div
                            className="w-full bg-background pb-4 pr-4 pt-1"
                            style={{ paddingLeft: (enableRowSelection ? (columnWidths.checkbox || 48) : 0) + 48 }}
                          >
                            {renderExpandedSubTable(item)}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="md:hidden space-y-2.5">
        {isLoading ? (
          <div className="p-4 bg-background border border-border/60 rounded-lg text-center text-sm text-muted-foreground">
            Loading data...
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="p-8 bg-background border border-border/60 rounded-xl text-center w-full flex flex-col items-center justify-center">
            {typeof emptyMessage === 'string' ? (
              <div className="max-w-xs mx-auto flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-muted/40 border border-border/80 flex items-center justify-center mb-2.5 text-muted-foreground/80">
                  {Boolean(searchQuery.trim()) ? <Search className="w-4 h-4 text-primary" /> : <Inbox className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <h4 className="text-xs font-semibold text-foreground mb-1">
                  {Boolean(searchQuery.trim()) ? 'No Matching Records' : 'Active Queue Clear'}
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {emptyMessage}
                </p>
              </div>
            ) : (
              emptyMessage
            )}
          </div>
        ) : (
          paginatedData.map(item => {
            const id = keyExtractor(item)
            const expandable = Boolean((renderExpandedSubTable || getSubRows) && isRowExpandable?.(item))
            const expanded = Boolean(expandable && isRowExpanded?.(item))
            const subRows = expanded && getSubRows ? getSubRows(item) : undefined
            return (
              <div
                key={id}
                className="bg-background border border-border/60 rounded-lg p-4 shadow-2xs space-y-2.5"
              >
                {mobileRender ? (
                  mobileRender(item)
                ) : (
                  <>
                    <div className="flex items-center justify-between border-b border-border pb-2 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {expandable && (
                          <button
                            type="button"
                            onClick={() => onToggleExpand?.(item)}
                            className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 shrink-0"
                          >
                            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <span className="font-semibold text-xs text-foreground truncate">
                          {columns[0]?.accessor(item)}
                        </span>
                      </div>
                      {hasRowAction && (
                        rowActions ? rowActions(item) : (
                          <button type="button" className="p-1 text-muted-foreground">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {columns.slice(1).map(col => (
                        <div key={col.key} className="space-y-0.5">
                          <span className="text-[10px] uppercase font-medium text-muted-foreground">
                            {col.header}
                          </span>
                          <div className="text-foreground">
                            {col.accessor(item)}
                          </div>
                        </div>
                      ))}
                    </div>
                    {subRows && subRows.length > 0 && (
                      <div className="pt-2 border-t border-border/60 space-y-2 pl-4">
                        {subRows.map(subItem => (
                          <div key={keyExtractor(subItem)} className="border-t border-border/40 pt-2 first:border-t-0 first:pt-0 space-y-1.5">
                            <div className="font-medium text-xs text-foreground">
                              {columns[0]?.accessor(subItem)}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {columns.slice(1).map(col => (
                                <div key={col.key} className="space-y-0.5">
                                  <span className="text-[10px] uppercase font-medium text-muted-foreground">
                                    {col.header}
                                  </span>
                                  <div className="text-foreground">
                                    {col.accessor(subItem)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {expanded && renderExpandedSubTable && (
                      <div className="pt-2 border-t border-border/60 overflow-x-auto">
                        {renderExpandedSubTable(item)}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 text-[13px] text-muted-foreground select-none">
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-medium">Rows per page:</span>
          <div className="w-20">
            <Select
              value={itemsPerPage}
              onValueChange={val => {
                const nextLimit = Number(val)
                setItemsPerPage(nextLimit)
                if (onItemsPerPageChange) {
                  onItemsPerPageChange(nextLimit)
                }
                handlePageChange(1)
              }}
              options={itemsPerPageOptions.map(opt => ({
                value: opt,
                label: String(opt),
              }))}
              size="sm"
              buttonClassName="h-8.5 text-[13px] font-medium"
            />
          </div>
          <span className="ml-2 text-xs sm:text-[13px]">
            Page {activeCurrentPage} of {totalPages} • {effectiveTotalCount.toLocaleString()} records
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="xs"
            variant="secondary"
            onClick={() => handlePageChange(Math.max(1, activeCurrentPage - 1))}
            disabled={activeCurrentPage <= 1 || isLoading}
            leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
          >
            Previous
          </Button>
          <span className="px-2 text-xs font-medium">
            {activeCurrentPage} / {totalPages}
          </span>
          <Button
            size="xs"
            variant="secondary"
            onClick={() => handlePageChange(Math.min(totalPages, activeCurrentPage + 1))}
            disabled={activeCurrentPage >= totalPages || isLoading}
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
export default DataTable
