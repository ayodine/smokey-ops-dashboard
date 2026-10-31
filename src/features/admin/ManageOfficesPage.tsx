import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  Building2,
  Plus,
  Trash2,
  Check,
  Search,
  MapPin,
  AlertTriangle,
  X,
  ShieldCheck,
  Download,
  MoreVertical,
  ArrowLeft,
  Pencil,
  Phone,
  User,
  Boxes,
  ChefHat,
  Store,
  Snowflake,
  CheckCircle2,
  Clock,
  Sparkles,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PageHeader } from '@/components/ui/PageHeader'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { Tooltip } from '@/components/ui/Tooltip'
import { MetricCard } from '@/components/ui/MetricCard'
import { useWarehouse, FacilityOption, INITIAL_FACILITY } from '@/context/WarehouseContext'
import { useSmokeyOps } from '@/context/SmokeyOpsContext'
import { cn } from '@/lib/utils'

// Portal-based action dropdown menu matching ManageAccountsPage AccountActionDropdown
const OfficeActionDropdown: React.FC<{
  isOpen: boolean
  onClose: () => void
  buttonRef: React.RefObject<HTMLButtonElement | null>
  children: React.ReactNode
}> = ({ isOpen, onClose, buttonRef, children }) => {
  const menuRef = useRef<HTMLDivElement>(null)

  const getPosition = useCallback(() => {
    if (!buttonRef.current) return { right: 12, openUp: false }
    const rect = buttonRef.current.getBoundingClientRect()
    const menuHeight = menuRef.current?.offsetHeight || 200
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    const openUp = spaceBelow < menuHeight + 12 && spaceAbove > spaceBelow

    if (openUp) {
      return {
        bottom: Math.max(8, window.innerHeight - rect.top + 4),
        right: Math.max(12, window.innerWidth - rect.right),
        openUp: true,
        maxHeight: Math.max(160, rect.top - 16),
      }
    }
    return {
      top: rect.bottom + 4,
      right: Math.max(12, window.innerWidth - rect.right),
      openUp: false,
      maxHeight: Math.max(160, spaceBelow - 16),
    }
  }, [buttonRef])

  const [position, setPosition] = useState(getPosition)

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return

    const update = () => {
      setPosition(getPosition())
    }

    update()
    const animId = requestAnimationFrame(update)

    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [isOpen, buttonRef, getPosition])

  if (!isOpen) return null

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9998]"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      />
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          ...(position.openUp
            ? { bottom: `${position.bottom}px` }
            : { top: `${position.top}px` }),
          right: `${position.right}px`,
          maxHeight: position.maxHeight ? `${position.maxHeight}px` : undefined,
          zIndex: 9999,
        }}
        className={cn(
          'w-56 min-w-[220px] rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-1 font-sans text-[13px] animate-in fade-in zoom-in-95 divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900 select-none overflow-y-auto',
          position.openUp ? 'origin-bottom-right' : 'origin-top-right'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>,
    document.body
  )
}

// ProfileFieldRow matching ManageAccountsPage exact layout
interface ProfileFieldRowProps {
  label: string
  description?: React.ReactNode
  required?: boolean
  children: React.ReactNode
}

const ProfileFieldRow: React.FC<ProfileFieldRowProps> = ({
  label,
  description,
  required,
  children
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 hover:bg-kumo-canvas/20 transition-colors">
      <div className="min-w-0 pr-4">
        <label className="block text-[12px] font-semibold text-kumo-strong leading-4">
          {label}
          {required && <span className="text-kumo-danger ml-0.5">*</span>}
        </label>
        {description && (
          <p className="text-[13px] text-kumo-subtle mt-0.5 leading-normal">{description}</p>
        )}
      </div>
      <div className="w-full sm:w-80 shrink-0 flex justify-end">
        {children}
      </div>
    </div>
  )
}

const NIGERIAN_STATES = [
  { value: 'Lagos State', label: 'Lagos State' },
  { value: 'Abuja (FCT)', label: 'Abuja (FCT)' },
  { value: 'Ogun State', label: 'Ogun State' },
  { value: 'Oyo State', label: 'Oyo State' },
  { value: 'Rivers State', label: 'Rivers State' },
  { value: 'Kano State', label: 'Kano State' },
  { value: 'Edo State', label: 'Edo State' },
  { value: 'Delta State', label: 'Delta State' },
  { value: 'Kaduna State', label: 'Kaduna State' },
  { value: 'Enugu State', label: 'Enugu State' },
]

const FACILITY_TYPE_OPTIONS = [
  { value: 'central_kitchen', label: 'Central Production Kitchen' },
  { value: 'retail_hub', label: 'Retail Store & Pickup Counter' },
  { value: 'cold_storage', label: 'Cold-Chain Storage Unit' },
]

export const ManageOfficesPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: urlId } = useParams<{ id?: string }>()

  const {
    facilities,
    selectedWarehouse,
    setSelectedWarehouse,
    addFacility,
    updateFacility,
    deleteFacility
  } = useWarehouse()

  const { showToast } = useSmokeyOps()

  // Route modes
  const isRegisterPage = location.pathname.includes('/offices/register') || location.pathname.includes('/offices/create')
  const isEditPage = location.pathname.includes('/offices/edit') && Boolean(urlId)

  // Tabs & Filters for DataTable
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'kitchen'>('all')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all')
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('all')

  // Sub-modal states
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [facilityToDelete, setFacilityToDelete] = useState<FacilityOption | null>(null)

  // Form State for Register / Edit
  const targetOffice = useMemo(() => {
    if (urlId) {
      return facilities.find(f => f.id === urlId || f.code.toLowerCase() === urlId.toLowerCase()) || null
    }
    return null
  }, [facilities, urlId])

  const [formName, setFormName] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formType, setFormType] = useState<FacilityOption['type']>('central_kitchen')
  const [formState, setFormState] = useState('Lagos State')
  const [formCity, setFormCity] = useState('Lagos')
  const [formAddress, setFormAddress] = useState('')
  const [formManagerName, setFormManagerName] = useState('')
  const [formContactPhone, setFormContactPhone] = useState('')
  const [formTotalSkus, setFormTotalSkus] = useState<number>(36)
  const [formCapacityUtilization, setFormCapacityUtilization] = useState<number>(70)
  const [formIsPrimary, setFormIsPrimary] = useState<'yes' | 'no'>('no')
  const [formIsActive, setFormIsActive] = useState<'active' | 'suspended'>('active')

  // Initialize form when editing
  useEffect(() => {
    if (isEditPage && targetOffice) {
      setFormName(targetOffice.name || '')
      setFormCode(targetOffice.code || '')
      setFormType(targetOffice.type || 'central_kitchen')
      setFormState(targetOffice.state || 'Lagos State')
      setFormCity(targetOffice.city || 'Lagos')
      setFormAddress(targetOffice.address || '')
      setFormManagerName(targetOffice.manager_name || 'Operations Lead')
      setFormContactPhone(targetOffice.contact_phone || '+234 803 123 4567')
      setFormTotalSkus(targetOffice.total_skus ?? 36)
      setFormCapacityUtilization(targetOffice.capacity_utilization ?? 70)
      setFormIsPrimary(targetOffice.isPrimary ? 'yes' : 'no')
      setFormIsActive(targetOffice.is_active === false ? 'suspended' : 'active')
    } else if (isRegisterPage) {
      setFormName('')
      setFormCode(`OFFICE-${String(facilities.length + 1).padStart(2, '0')}`)
      setFormType('central_kitchen')
      setFormState('Lagos State')
      setFormCity('Lagos')
      setFormAddress('')
      setFormManagerName('')
      setFormContactPhone('')
      setFormTotalSkus(24)
      setFormCapacityUtilization(50)
      setFormIsPrimary('no')
      setFormIsActive('active')
    }
  }, [isEditPage, isRegisterPage, targetOffice, facilities.length])

  // Save Office Submit
  const handleSaveOffice = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      showToast('Please enter an office or branch name', 'error', 'Validation Error')
      return
    }

    const payload = {
      name: formName.trim(),
      code: formCode.trim().toUpperCase() || `FAC-${Date.now().toString().slice(-4)}`,
      type: formType,
      state: formState,
      city: formCity.trim() || 'Lagos',
      address: formAddress.trim(),
      manager_name: formManagerName.trim() || 'Operations Lead',
      contact_phone: formContactPhone.trim() || '+234 800 000 0000',
      total_skus: Number(formTotalSkus) || 24,
      capacity_utilization: Number(formCapacityUtilization) || 50,
      isPrimary: formIsPrimary === 'yes',
      is_active: formIsActive === 'active',
    }

    if (isEditPage && targetOffice) {
      updateFacility(targetOffice.id, payload)
      showToast(`Updated operating office "${payload.name}" successfully`, 'success', 'Office Updated')
      navigate('/offices')
    } else {
      const created = addFacility(payload)
      showToast(`Registered new office "${created.name}" and set as active workspace`, 'success', 'Office Registered')
      navigate('/offices')
    }
  }

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!facilityToDelete) return
    deleteFacility(facilityToDelete.id)
    showToast(`Removed office "${facilityToDelete.name}"`, 'info', 'Office Deleted')
    setFacilityToDelete(null)
    setOpenMenuId(null)
  }

  // Switch Active Workspace
  const handleSetActive = (fac: FacilityOption) => {
    setSelectedWarehouse(fac)
    showToast(`Switched active workspace to "${fac.name}" (${fac.code})`, 'success', 'Workspace Activated')
  }

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Office Name', 'Office Code', 'Operational Type', 'State', 'City', 'Physical Address', 'Hub Manager', 'Phone', 'SKUs', 'Capacity %', 'Is HQ', 'Status']
    const rows = facilities.map(f => [
      `"${f.name}"`,
      `"${f.code}"`,
      `"${f.type || 'warehouse'}"`,
      `"${f.state || 'Lagos State'}"`,
      `"${f.city}"`,
      `"${f.address || ''}"`,
      `"${f.manager_name || 'Operations Lead'}"`,
      `"${f.contact_phone || ''}"`,
      `"${f.total_skus || 24}"`,
      `"${f.capacity_utilization || 50}%"`,
      `"${f.isPrimary ? 'Yes' : 'No'}"`,
      `"${f.is_active !== false ? 'Active' : 'Suspended'}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `smokey_offices_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast(`Exported ${facilities.length} operating offices to CSV`, 'success')
  }

  const handleBulkExport = (selectedItems: FacilityOption[]) => {
    const headers = ['Office Name', 'Code', 'Type', 'City', 'Address', 'Manager', 'Phone']
    const rows = selectedItems.map(f => [
      `"${f.name}"`,
      `"${f.code}"`,
      `"${f.type || 'warehouse'}"`,
      `"${f.city}"`,
      `"${f.address || ''}"`,
      `"${f.manager_name || 'Operations Lead'}"`,
      `"${f.contact_phone || ''}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `smokey_selected_offices_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast(`Exported ${selectedItems.length} selected offices`, 'success')
  }

  // Filtered Table Data
  const tableData = useMemo(() => {
    return facilities.filter((fac) => {
      if (activeTab === 'active' && fac.is_active === false) return false
      if (activeTab === 'kitchen' && fac.type !== 'central_kitchen') return false

      if (selectedTypeFilter !== 'all' && (fac.type || 'central_kitchen') !== selectedTypeFilter) {
        return false
      }

      if (selectedCityFilter !== 'all') {
        const cityLower = (fac.city || '').toLowerCase()
        if (!cityLower.includes(selectedCityFilter.toLowerCase())) {
          return false
        }
      }

      return true
    })
  }, [facilities, activeTab, selectedTypeFilter, selectedCityFilter])

  // Unique cities for filter
  const cityFilterOptions = useMemo(() => {
    const cities = Array.from(new Set(facilities.map(f => f.city).filter(Boolean)))
    return [
      { label: 'All Cities', value: 'all' },
      ...cities.map(c => ({ label: c, value: c }))
    ]
  }, [facilities])

  // KPIs
  const totalOffices = facilities.length
  const activeOfficesCount = facilities.filter(f => f.is_active !== false).length
  const kitchenCount = facilities.filter(f => f.type === 'central_kitchen').length

  // Render Type Badge
  const renderTypeBadge = (type?: string) => {
    const t = type || 'central_kitchen'
    if (t === 'central_kitchen') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 whitespace-nowrap">
          <ChefHat className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Production Kitchen</span>
        </span>
      )
    }
    if (t === 'retail_hub') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 whitespace-nowrap">
          <Store className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
          <span>Store Pickup Hub</span>
        </span>
      )
    }
    if (t === 'cold_storage') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 whitespace-nowrap">
          <Snowflake className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span>Cold Storage</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 whitespace-nowrap">
        <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>Operating Office</span>
      </span>
    )
  }

  // DataTable Columns
  const officeColumns: ColumnDef<FacilityOption>[] = [
    {
      key: 'name',
      header: 'Office / Facility Name',
      defaultWidth: 260,
      accessor: (fac) => (
        <div
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/offices/edit/${fac.id}`)
          }}
          className="cursor-pointer group select-none"
          title="Click to view & configure facility details"
        >
          <div className="font-semibold text-kumo-strong text-[14px] font-sans group-hover:text-primary group-hover:underline underline-offset-2 flex items-center gap-2">
            <span>{fac.name}</span>
            {fac.isPrimary && (
              <span className="text-[10px] px-1.5 py-0.5 font-sans font-semibold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded shrink-0">
                Main HQ
              </span>
            )}
          </div>
          <div className="text-[13px] text-kumo-subtle font-sans mt-0.5 font-mono">
            {fac.code}
          </div>
        </div>
      ),
      sortValue: (fac) => fac.name,
    },
    {
      key: 'type',
      header: 'Operational Type',
      defaultWidth: 200,
      accessor: (fac) => renderTypeBadge(fac.type),
      sortValue: (fac) => fac.type || 'warehouse',
    },
    {
      key: 'location',
      header: 'Location & Address',
      defaultWidth: 240,
      accessor: (fac) => (
        <div className="min-w-0 pr-2">
          <div className="text-[13px] font-medium text-kumo-strong truncate">
            {fac.city} {fac.state ? `• ${fac.state}` : ''}
          </div>
          <div className="text-[12px] text-kumo-subtle truncate max-w-[220px]" title={fac.address}>
            {fac.address || 'Address pending verification'}
          </div>
        </div>
      ),
      sortValue: (fac) => fac.city,
    },
    {
      key: 'manager',
      header: 'Hub Management',
      defaultWidth: 200,
      accessor: (fac) => (
        <div className="text-[13px] font-sans">
          <div className="text-kumo-strong font-medium truncate">
            {fac.manager_name || 'Operations Lead'}
          </div>
          <div className="text-[12px] text-kumo-subtle truncate">
            {fac.contact_phone || '+234 800 000 0000'}
          </div>
        </div>
      ),
      sortValue: (fac) => fac.manager_name || '',
    },
    {
      key: 'capacity',
      header: 'SKUs & Capacity',
      defaultWidth: 160,
      accessor: (fac) => (
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-kumo-strong font-sans">
            {fac.total_skus || 24} SKUs
          </span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-kumo-canvas border border-kumo-line text-kumo-subtle font-mono">
            {fac.capacity_utilization || 50}% Cap
          </span>
        </div>
      ),
      sortValue: (fac) => fac.capacity_utilization || 50,
    },
    {
      key: 'status',
      header: 'Workspace State',
      defaultWidth: 160,
      accessor: (fac) => {
        const isSelected = fac.id === selectedWarehouse.id
        if (isSelected) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 shadow-2xs whitespace-nowrap">
              <Check className="w-3 h-3 stroke-[2.5]" />
              <span>Active Workspace</span>
            </span>
          )
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400 whitespace-nowrap">
            {fac.is_active !== false ? 'Standby Branch' : 'Maintenance'}
          </span>
        )
      },
      sortValue: (fac) => (fac.id === selectedWarehouse.id ? 1 : 0),
    },
    {
      key: 'actions',
      header: 'Actions',
      defaultWidth: 180,
      accessor: (fac) => {
        const buttonRef = useRef<HTMLButtonElement>(null)
        const isOpen = openMenuId === fac.id
        const isSelected = fac.id === selectedWarehouse.id
        const isPrimary = fac.isPrimary || fac.id === INITIAL_FACILITY.id

        return (
          <div className="flex items-center justify-end gap-1.5 relative">
            {!isSelected && (
              <Tooltip content="Set as currently active operating hub">
                <TableActionButton
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSetActive(fac)
                  }}
                >
                  Set Active
                </TableActionButton>
              </Tooltip>
            )}

            <Tooltip content="Edit office details & parameters">
              <TableActionButton
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/offices/edit/${fac.id}`)
                }}
                leftIcon={<Pencil className="w-3.5 h-3.5" />}
              >
                Edit
              </TableActionButton>
            </Tooltip>

            <button
              ref={buttonRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenuId(isOpen ? null : fac.id)
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-strong transition-colors cursor-pointer"
              aria-label={`Options for ${fac.name}`}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            <OfficeActionDropdown
              isOpen={isOpen}
              onClose={() => setOpenMenuId(null)}
              buttonRef={buttonRef}
            >
              <div className="py-0.5 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenuId(null)
                    navigate(`/offices/edit/${fac.id}`)
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors whitespace-nowrap block"
                >
                  Edit Facility Details
                </button>
                {!isSelected && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuId(null)
                      handleSetActive(fac)
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors whitespace-nowrap block"
                  >
                    Set Active Workspace
                  </button>
                )}
              </div>
              <div className="py-0.5 pt-1">
                <button
                  type="button"
                  disabled={isPrimary || facilities.length <= 1}
                  onClick={() => {
                    setOpenMenuId(null)
                    setFacilityToDelete(fac)
                  }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap',
                    isPrimary || facilities.length <= 1
                      ? 'opacity-40 cursor-not-allowed text-zinc-400'
                      : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer'
                  )}
                  title={isPrimary ? 'Default HQ cannot be deleted' : undefined}
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Remove Office</span>
                </button>
              </div>
            </OfficeActionDropdown>
          </div>
        )
      },
    },
  ]

  // =========================================================================
  // VIEW: REGISTER OR EDIT OFFICE PAGE (Matching ManageAccounts Profile Style)
  // =========================================================================
  if (isRegisterPage || (isEditPage && targetOffice)) {
    const isEditing = isEditPage && Boolean(targetOffice)
    const pageTitle = isEditing ? 'Edit Operating Office' : 'Register New Office / Branch'
    const pageSubtitle = isEditing
      ? `Configure operational classification, regional municipal address, and management parameters for ${targetOffice?.name}.`
      : 'Register a new regional kitchen hub, distribution depot, or store pickup facility across the network.'

    return (
      <div className="space-y-6 font-sans max-w-6xl mx-auto pb-16">
        {/* Navigation Breadcrumb & Header matching ManageAccountsPage */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/offices')}
              className="w-9 h-9 rounded-xl border border-kumo-line bg-kumo-base hover:bg-kumo-tint flex items-center justify-center text-kumo-subtle hover:text-kumo-strong transition-colors cursor-pointer shadow-2xs shrink-0"
              aria-label="Back to offices"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-kumo-strong tracking-tight">Office Governance</h1>
                <span className="text-kumo-subtle text-[16px] font-normal">/</span>
                <span className="text-[16px] font-semibold text-kumo-default">
                  {isEditing ? targetOffice?.name : 'New Operating Office'}
                </span>
              </div>
              <p className="text-[13px] text-kumo-subtle mt-0.5">
                {pageSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[13px] text-kumo-subtle font-sans inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-kumo-line bg-kumo-base shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-kumo-subtle" />
              <span>Office Code:</span>
              <strong className="text-kumo-strong font-mono">{formCode || 'PENDING'}</strong>
            </span>
          </div>
        </div>

        {/* Form Container Cards matching ManageAccountsPage */}
        <form onSubmit={handleSaveOffice} className="space-y-6">
          {/* Card 1: Facility Identity & Regional Location */}
          <div className="border border-kumo-line rounded-2xl bg-kumo-base overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-kumo-line bg-kumo-canvas/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-kumo-canvas text-kumo-subtle border border-kumo-line flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-kumo-strong">Facility Identity & Location Dossier</h3>
                  <p className="text-[13px] text-kumo-subtle">Regional location identity, operational classification, and municipal zoning</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-kumo-line/60">
              <ProfileFieldRow
                label="Office / Branch Name"
                description="Official operating name displayed on waybills and orders"
                required
              >
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Ikeja Central Kitchen"
                  required
                  aria-label="Office / Branch Name"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Facility Code"
                description="Unique inventory and dispatch identifier (e.g. HQ-YABA, DEPOT-02)"
                required
              >
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. BR-IKEJA"
                  required
                  aria-label="Facility Code"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Operational Facility Type"
                description="Core operational role defining station functions and inventory intake"
                required
              >
                <Select
                  value={formType || 'warehouse'}
                  onValueChange={(val) => setFormType(val as any)}
                  options={FACILITY_TYPE_OPTIONS}
                  aria-label="Operational Facility Type"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Federal State / Region"
                description="State administrative jurisdiction"
                required
              >
                <Select
                  value={formState}
                  onValueChange={(val) => setFormState(String(val))}
                  options={NIGERIAN_STATES}
                  aria-label="Federal State / Region"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="City / Municipal Area"
                description="City or local government area of operation"
                required
              >
                <Input
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  placeholder="e.g. Ikeja, Lagos Mainland"
                  required
                  aria-label="City / Municipal Area"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Street Address & Landmark"
                description="Physical premises address for supply chain deliveries and rider dispatch"
              >
                <Input
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g. 18 Obafemi Awolowo Way, Ikeja"
                  aria-label="Street Address & Landmark"
                />
              </ProfileFieldRow>
            </div>
          </div>

          {/* Card 2: Operational Governance & Capacity */}
          <div className="border border-kumo-line rounded-2xl bg-kumo-base overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-kumo-line bg-kumo-canvas/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-kumo-canvas text-kumo-subtle border border-kumo-line flex items-center justify-center shrink-0">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-kumo-strong">Operational Governance & Storage Thresholds</h3>
                  <p className="text-[13px] text-kumo-subtle">Primary workspace designation, SKU allocation limits, and operating capacity</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-kumo-line/60">
              <ProfileFieldRow
                label="Primary Company Headquarters (HQ)"
                description="Designate this facility as the organization root headquarters"
              >
                <Select
                  value={formIsPrimary}
                  onValueChange={(val) => setFormIsPrimary(val as any)}
                  options={[
                    { value: 'yes', label: 'Yes - Primary Organization HQ' },
                    { value: 'no', label: 'No - Regional Branch / Depot' }
                  ]}
                  aria-label="Primary Company Headquarters"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Operational Status"
                description="Status of this facility across order dispatch and stock intakes"
              >
                <Select
                  value={formIsActive}
                  onValueChange={(val) => setFormIsActive(val as any)}
                  options={[
                    { value: 'active', label: 'Active - Receiving Orders & Stock' },
                    { value: 'suspended', label: 'Suspended - Temporary Maintenance / Offline' }
                  ]}
                  aria-label="Operational Status"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Active SKU Capacity Limit"
                description="Maximum unique stock-keeping units allocated to this location"
              >
                <Input
                  type="number"
                  min="1"
                  max="500"
                  value={formTotalSkus}
                  onChange={(e) => setFormTotalSkus(Number(e.target.value))}
                  aria-label="Active SKU Capacity Limit"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Baseline Capacity Utilization (%)"
                description="Target floor storage capacity percentage"
              >
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formCapacityUtilization}
                  onChange={(e) => setFormCapacityUtilization(Number(e.target.value))}
                  aria-label="Baseline Capacity Utilization"
                />
              </ProfileFieldRow>
            </div>
          </div>

          {/* Card 3: Leadership & Escalation Contact */}
          <div className="border border-kumo-line rounded-2xl bg-kumo-base overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-kumo-line bg-kumo-canvas/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-kumo-canvas text-kumo-subtle border border-kumo-line flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-kumo-strong">Station Leadership & Contact Escalation</h3>
                  <p className="text-[13px] text-kumo-subtle">Designated facility lead, escalation telephone, and dispatch channel</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-kumo-line/60">
              <ProfileFieldRow
                label="Station / Hub Manager Full Name"
                description="Operational lead responsible for facility compliance"
              >
                <Input
                  value={formManagerName}
                  onChange={(e) => setFormManagerName(e.target.value)}
                  placeholder="e.g. Babajide Ogundipe"
                  aria-label="Station / Hub Manager Full Name"
                />
              </ProfileFieldRow>

              <ProfileFieldRow
                label="Direct Official Phone Number"
                description="Direct contact line for courier coordination and emergencies"
              >
                <Input
                  value={formContactPhone}
                  onChange={(e) => setFormContactPhone(e.target.value)}
                  placeholder="+234 803 123 4567"
                  aria-label="Direct Official Phone Number"
                />
              </ProfileFieldRow>
            </div>
          </div>

          {/* Bottom Action Footer Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-kumo-line">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/offices')}
              className="h-10 px-5 text-[13px] font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Check className="w-4 h-4" />}
              className="h-10 px-6 text-[13px] font-semibold shadow-xs"
            >
              {isEditing ? 'Save Changes' : 'Register Office'}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  // =========================================================================
  // VIEW: MAIN OFFICES TABLE PAGE (Matching ManageAccounts Main Page)
  // =========================================================================
  return (
    <div className="space-y-6 font-sans">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Manage Offices & Facilities"
        subtitle="Register regional operating branches and manage multi-hub kitchen facilities across the network."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<Download className="w-4 h-4" />}
              className="h-10 px-4 text-[13px] font-medium shadow-xs"
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/offices/register')}
              leftIcon={<Plus className="w-4 h-4" />}
              className="h-10 px-4 text-[13px] font-semibold shadow-xs"
            >
              Add New Office
            </Button>
          </>
        }
      />

      {/* 2. KPI STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          title="Total Registered Offices"
          value={totalOffices}
          description="Operating network locations"
          icon={<Building2 className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Active Hubs"
          value={activeOfficesCount}
          description="Receiving orders & dispatches"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Production Kitchens"
          value={kitchenCount}
          description="Smoke pit & cook stations"
          icon={<ChefHat className="w-4 h-4 text-amber-500" />}
        />
      </div>

      {/* 3. KUMO TABS */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          tabs={[
            { id: 'all', label: 'All Offices', badge: totalOffices },
            { id: 'active', label: 'Active Facilities', badge: activeOfficesCount },
            { id: 'kitchen', label: 'Kitchen Hubs', badge: kitchenCount },
          ]}
        />
      </div>

      {/* 4. MAIN DATA TABLE */}
      <div>
        <DataTable<FacilityOption>
          data={tableData}
          columns={officeColumns}
          searchable={true}
          searchPlaceholder="Filter offices by name, code, city, type, or manager..."
          searchFilter={(fac, q) =>
            Boolean(
              fac.name.toLowerCase().includes(q) ||
              fac.code.toLowerCase().includes(q) ||
              fac.city.toLowerCase().includes(q) ||
              (fac.address && fac.address.toLowerCase().includes(q)) ||
              (fac.manager_name && fac.manager_name.toLowerCase().includes(q)) ||
              (fac.type && fac.type.toLowerCase().includes(q))
            )
          }
          title="Operating Offices & Hubs"
          exportFilename="smokey-operating-offices.csv"
          enableRowSelection={true}
          onRowClick={(fac) => navigate(`/offices/edit/${fac.id}`)}
          filterCategories={[
            {
              name: 'Facility Type',
              key: 'type',
              options: [
                { label: 'All Facility Types', value: 'all' },
                ...FACILITY_TYPE_OPTIONS
              ],
              activeValue: selectedTypeFilter,
              onChange: setSelectedTypeFilter
            },
            {
              name: 'City / Region',
              key: 'city',
              options: cityFilterOptions,
              activeValue: selectedCityFilter,
              onChange: setSelectedCityFilter
            }
          ]}
          bulkActions={[
            {
              label: 'Export Selected',
              icon: <Download className="w-3.5 h-3.5" />,
              onClick: handleBulkExport
            }
          ]}
        />
      </div>

      {/* 5. SUB-MODALS: DELETE OFFICE CONFIRMATION */}
      <Dialog
        isOpen={Boolean(facilityToDelete)}
        onClose={() => setFacilityToDelete(null)}
        title="Remove Operating Office"
        description={`Are you sure you want to permanently remove "${facilityToDelete?.name}" (${facilityToDelete?.code})?`}
        maxWidth="md"
      >
        {facilityToDelete && (
          <div className="space-y-4 font-sans text-left text-xs">
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl space-y-1 text-red-900 dark:text-red-200">
              <div className="font-semibold flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>Operational Warning</span>
              </div>
              <p className="text-[12px] opacity-90 leading-relaxed">
                Deleting this facility will remove it from future order routing, dispatch logs, and staff assignments. Any inventory or active batches allocated to this hub should be relocated before removal.
              </p>
            </div>

            <div className="p-3 bg-kumo-surface border border-kumo-line rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-kumo-subtle">Office Name:</span>
                <span className="font-bold text-kumo-strong">{facilityToDelete.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-kumo-subtle">Facility Code:</span>
                <span className="font-mono text-kumo-strong font-semibold">{facilityToDelete.code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-kumo-subtle">Location:</span>
                <span className="text-kumo-strong">{facilityToDelete.city}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFacilityToDelete(null)}
                className="h-9 px-4 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                className="h-9 px-4 text-xs font-semibold"
              >
                Delete Office
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}

export default ManageOfficesPage
