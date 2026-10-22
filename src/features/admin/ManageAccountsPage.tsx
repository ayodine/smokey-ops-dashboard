import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  Users,
  Search,
  Download,
  Trash2,
  Key,
  ShieldCheck,
  Shield,
  UserPlus,
  Edit2,
  Copy,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  MoreVertical,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { Tooltip } from '@/components/ui/Tooltip'
import { Select } from '@/components/ui/Select'
import { useSmokeyOps, AppUserAccount, UserRole, ROLE_DEFAULT_PERMISSIONS } from '@/context/SmokeyOpsContext'
import { useWarehouse } from '@/context/WarehouseContext'
import { cn } from '@/lib/utils'
import {
  ALL_SYSTEM_PERMISSIONS,
  SYSTEM_ROLE_CONFIGS
} from '@/components/layout/ManageAccountsModal'

// Reusable Cloudflare Kumo-style Toggle Switch
const ToggleSwitch: React.FC<{
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  id?: string
  ariaLabel?: string
}> = ({ checked, onChange, disabled, id, ariaLabel }) => {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onChange(!checked)
      }}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 select-none',
        checked ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-700',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  )
}

export const ManageAccountsPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { email: urlEmail } = useParams<{ email?: string }>()

  const {
    availableAccounts,
    activeAccountEmail,
    switchAccount,
    createAccount,
    updateAccount,
    deleteAccount,
    changePassword,
    showToast,
  } = useSmokeyOps()

  const { facilities } = useWarehouse()

  // Route modes
  const isRoutePage = location.pathname.includes('/accounts/route')
  const isMatrixPage = location.pathname.includes('/accounts/matrix')

  // Kumo Tabs State for Accounts Table: 'all' | 'active' | 'inactive' | 'matrix'
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive' | 'matrix'>('all')

  // Filter state for DataTable
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all')
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState<string>('all')

  // Sub-modal states
  const [openMenuEmail, setOpenMenuEmail] = useState<string | null>(null)
  const [accountToChangePassword, setAccountToChangePassword] = useState<AppUserAccount | null>(null)
  const [accountToDelete, setAccountToDelete] = useState<AppUserAccount | null>(null)
  const [accountToChangeRole, setAccountToChangeRole] = useState<AppUserAccount | null>(null)
  const [inspectPermissionsAccount, setInspectPermissionsAccount] = useState<AppUserAccount | null>(null)
  const [isOnboardOpen, setIsOnboardOpen] = useState(false)

  // -------------------------------------------------------------
  // EDIT ROUTE PAGE STATE (Screenshot 1 / Screenshot 2)
  // -------------------------------------------------------------
  const targetStaff = useMemo(() => {
    if (urlEmail) {
      const decoded = decodeURIComponent(urlEmail)
      return availableAccounts.find(a => a.email.toLowerCase() === decoded.toLowerCase()) || availableAccounts[0]
    }
    return availableAccounts[0]
  }, [availableAccounts, urlEmail])

  const [editRole, setEditRole] = useState<UserRole>('kitchen')
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editZone, setEditZone] = useState('Zone 1: Core Mainland (Ikeja / Yaba / Surulere)')
  const [editOffice, setEditOffice] = useState('Central Kitchen (Ikeja Office)')
  const [editPermissions, setEditPermissions] = useState<string[]>([])
  const [policySearchQuery, setPolicySearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Overall roles': true,
    'Administration': true,
    'Production': true,
    'Inventory': true,
    'Logistics': true,
    'Finance': true
  })

  // Initialize Edit Route State when target staff changes
  useEffect(() => {
    if (targetStaff) {
      setEditRole(targetStaff.role)
      setEditName(targetStaff.name)
      setEditEmail(targetStaff.email)
      setEditOffice(targetStaff.assigned_hub ? `${targetStaff.assigned_hub} Office` : 'Central Kitchen (Ikeja Office)')
      setEditZone('Zone 1: Core Mainland (Ikeja / Yaba / Surulere)')
      setEditPermissions(targetStaff.permissions || ROLE_DEFAULT_PERMISSIONS[targetStaff.role] || [])
    }
  }, [targetStaff])

  // -------------------------------------------------------------
  // ROLE MATRIX PAGE STATE (Screenshot 2 / Screenshot 1)
  // -------------------------------------------------------------
  const [matrixScope, setMatrixScope] = useState<string>('')
  const [matrixAppliesTo, setMatrixAppliesTo] = useState<string>('Entire account')
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('')
  const [matrixPermissions, setMatrixPermissions] = useState<string[]>([])
  const [matrixExpandedCats, setMatrixExpandedCats] = useState<Record<string, boolean>>({
    'Overall roles': true,
    'Administration': true,
    'Production': true,
    'Inventory': true,
    'Logistics': true,
    'Finance': true
  })

  // When matrix scope is picked, initialize default permissions
  const handleMatrixScopeChange = (scopeId: string) => {
    setMatrixScope(scopeId)
    const matchedRole = SYSTEM_ROLE_CONFIGS.find(r => r.id === scopeId)
    if (matchedRole) {
      setMatrixPermissions(ROLE_DEFAULT_PERMISSIONS[matchedRole.id] || [])
    } else {
      setMatrixPermissions([])
    }
  }

  // Onboard Account Form State
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    email: '',
    role: 'kitchen' as UserRole,
    office: 'Central Kitchen (Ikeja Office)',
    temporaryPassword: 'Smokey@' + Math.floor(1000 + Math.random() * 9000),
    permissions: ROLE_DEFAULT_PERMISSIONS['kitchen'] || []
  })
  const [showOnboardCustomPerms, setShowOnboardCustomPerms] = useState(false)

  // Change Password Form State
  const [newPasswordVal, setNewPasswordVal] = useState('')
  const [requirePassReset, setRequirePassReset] = useState(true)

  // Formatted realistic last activities
  const getActivityTimestamp = (acc: AppUserAccount) => {
    if (acc.role === 'admin') return 'Today, 3:52 PM'
    if (acc.role === 'manager') return 'Today, 3:24 PM'
    if (acc.role === 'rider') return 'Today, 1:15 PM'
    if (acc.role === 'kitchen') return 'Yesterday, 8:21 AM'
    if (acc.role === 'inventory') return 'Sep 24, 2026 at 2:10 PM'
    if (acc.role === 'dispatcher') return 'Sep 23, 2026 at 1:30 PM'
    return acc.last_active || 'Today, 12:00 PM'
  }

  // Counts for tabs
  const activeCount = useMemo(() => {
    return availableAccounts.filter(a => a.status !== 'suspended').length
  }, [availableAccounts])

  const inactiveCount = useMemo(() => {
    return availableAccounts.filter(a => a.status === 'suspended').length
  }, [availableAccounts])

  // Table Data filtered by Tab & Filters
  const tableData = useMemo(() => {
    return availableAccounts.filter((acc) => {
      // 1. Kumo Tab Filter
      if (activeTab === 'active' && acc.status === 'suspended') return false
      if (activeTab === 'inactive' && acc.status !== 'suspended') return false

      // 2. Dropdown Filter: Role
      if (selectedRoleFilter !== 'all' && acc.role !== selectedRoleFilter) {
        return false
      }

      // 3. Dropdown Filter: Office
      if (selectedOfficeFilter !== 'all') {
        const accOffice = acc.assigned_hub || 'Central Kitchen (Ikeja)'
        if (!accOffice.toLowerCase().includes(selectedOfficeFilter.toLowerCase())) {
          return false
        }
      }

      return true
    })
  }, [availableAccounts, activeTab, selectedRoleFilter, selectedOfficeFilter])

  // Handlers for Edit Route Page
  const handleEditRoleChange = (newRole: UserRole) => {
    setEditRole(newRole)
    const defaults = ROLE_DEFAULT_PERMISSIONS[newRole] || []
    setEditPermissions(defaults)
  }

  const togglePolicyPermission = (permLabel: string) => {
    setEditPermissions(prev =>
      prev.includes(permLabel) ? prev.filter(p => p !== permLabel) : [...prev, permLabel]
    )
  }

  const toggleAllInCategory = (categoryPerms: string[], allActive: boolean) => {
    if (allActive) {
      setEditPermissions(prev => prev.filter(p => !categoryPerms.includes(p)))
    } else {
      setEditPermissions(prev => Array.from(new Set([...prev, ...categoryPerms])))
    }
  }

  const handleSaveRouteAndPolicies = (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetStaff) return

    const roleConfig = SYSTEM_ROLE_CONFIGS.find((r) => r.id === editRole)
    const roleLabel = roleConfig ? roleConfig.label : editRole
    const cleanedOffice = editOffice.replace(/\s+Office$/i, '')

    updateAccount(targetStaff.email, {
      name: editName.trim() || targetStaff.name,
      email: editEmail.trim() || targetStaff.email,
      role: editRole,
      roleLabel,
      assigned_hub: cleanedOffice,
      permissions: editPermissions,
    })

    showToast(`Updated route and policies for ${editName}`, 'success')
    navigate('/accounts')
  }

  // Handlers for Role Matrix Page
  const toggleMatrixPolicy = (permLabel: string) => {
    setMatrixPermissions(prev =>
      prev.includes(permLabel) ? prev.filter(p => p !== permLabel) : [...prev, permLabel]
    )
  }

  const toggleMatrixCategory = (categoryPerms: string[], allActive: boolean) => {
    if (allActive) {
      setMatrixPermissions(prev => prev.filter(p => !categoryPerms.includes(p)))
    } else {
      setMatrixPermissions(prev => Array.from(new Set([...prev, ...categoryPerms])))
    }
  }

  const handleSaveMatrixPolicy = () => {
    if (!matrixScope) {
      showToast('Please select a scope to create policy', 'error')
      return
    }
    const matchedRole = SYSTEM_ROLE_CONFIGS.find(r => r.id === matrixScope)
    showToast(`Policy successfully saved for ${matchedRole?.label || matrixScope}`, 'success')
    navigate('/accounts')
  }

  // Handle Onboard Submit
  const handleSaveOnboard = (e: React.FormEvent) => {
    e.preventDefault()
    if (!onboardForm.name.trim() || !onboardForm.email.trim()) {
      showToast('Please enter both name and email address', 'error')
      return
    }

    const roleConfig = SYSTEM_ROLE_CONFIGS.find((r) => r.id === onboardForm.role)
    const roleLabel = roleConfig ? roleConfig.label : onboardForm.role
    const finalPermissions = onboardForm.permissions.length > 0
      ? onboardForm.permissions
      : ROLE_DEFAULT_PERMISSIONS[onboardForm.role] || []
    const cleanedOffice = onboardForm.office.replace(/\s+Office$/i, '')

    const newAcc: AppUserAccount = {
      email: onboardForm.email.trim(),
      name: onboardForm.name.trim(),
      role: onboardForm.role,
      roleLabel,
      assigned_hub: cleanedOffice,
      permissions: finalPermissions,
      department:
        onboardForm.role === 'kitchen'
          ? 'Culinary Operations'
          : onboardForm.role === 'rider' || onboardForm.role === 'dispatcher'
          ? 'Logistics'
          : onboardForm.role === 'inventory'
          ? 'Warehouse'
          : 'Administration',
      staff_id: `SHD-${onboardForm.role.toUpperCase().slice(0, 3)}-${Math.floor(100 + Math.random() * 900)}`,
      status: 'active',
      last_active: 'Invited just now',
      temporary_password: onboardForm.temporaryPassword,
      created_at: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    }

    createAccount(newAcc)
    setIsOnboardOpen(false)
    setOnboardForm({
      name: '',
      email: '',
      role: 'kitchen',
      office: 'Central Kitchen (Ikeja Office)',
      temporaryPassword: 'Smokey@' + Math.floor(1000 + Math.random() * 9000),
      permissions: ROLE_DEFAULT_PERMISSIONS['kitchen'] || []
    })
  }

  // Handle Change Password Submit
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountToChangePassword) return
    if (!newPasswordVal.trim()) {
      showToast('Password cannot be blank', 'error')
      return
    }

    changePassword(accountToChangePassword.email, newPasswordVal)
    setAccountToChangePassword(null)
    setNewPasswordVal('')
  }

  // Handle Confirm Delete
  const handleConfirmDelete = () => {
    if (!accountToDelete) return
    deleteAccount(accountToDelete.email)
    setAccountToDelete(null)
    setOpenMenuEmail(null)
  }

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['Full Name', 'Staff ID', 'Email Address', 'Role', 'Office', 'Last Activity', 'Permissions Count', 'Status']
    const rows = tableData.map(a => [
      `"${a.name}"`,
      `"${a.staff_id || 'SHD-OP'}"`,
      `"${a.email}"`,
      `"${a.roleLabel}"`,
      `"${a.assigned_hub ? `${a.assigned_hub} Office` : 'Central Kitchen Office'}"`,
      `"${getActivityTimestamp(a)}"`,
      `"${(a.permissions || ROLE_DEFAULT_PERMISSIONS[a.role] || []).length}"`,
      `"${a.status || 'active'}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `smokey_team_accounts_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast(`Exported ${tableData.length} team members to CSV`, 'success')
  }

  const handleBulkExport = (selectedItems: AppUserAccount[]) => {
    const headers = ['Full Name', 'Email Address', 'Role', 'Office', 'Status']
    const rows = selectedItems.map(a => [
      `"${a.name}"`,
      `"${a.email}"`,
      `"${a.roleLabel}"`,
      `"${a.assigned_hub ? `${a.assigned_hub} Office` : 'Central Kitchen Office'}"`,
      `"${a.status || 'active'}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `smokey_selected_accounts_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast(`Exported ${selectedItems.length} selected accounts`, 'success')
  }

  // DataTable Column Definitions
  // NO profile icon / avatar per instructions
  const accountColumns: ColumnDef<AppUserAccount>[] = [
    {
      key: 'name',
      header: 'Member Full Name',
      defaultWidth: 240,
      accessor: (acc) => (
        <div>
          <div className="font-semibold text-kumo-strong text-xs font-sans">
            {acc.name}
          </div>
          <div className="text-[11px] text-kumo-subtle font-sans mt-0.5">
            {acc.staff_id || acc.department || 'Operations'}
          </div>
        </div>
      ),
      sortValue: (acc) => acc.name,
    },
    {
      key: 'email',
      header: 'Email Address',
      defaultWidth: 220,
      accessor: (acc) => (
        <span className="text-xs text-kumo-subtle font-mono">
          {acc.email}
        </span>
      ),
      sortValue: (acc) => acc.email,
    },
    {
      key: 'activity',
      header: 'Last Activity',
      defaultWidth: 160,
      accessor: (acc) => (
        <span className="text-xs text-kumo-default font-sans whitespace-nowrap">
          {getActivityTimestamp(acc)}
        </span>
      ),
      sortValue: (acc) => getActivityTimestamp(acc),
    },
    {
      key: 'role',
      header: 'Role',
      defaultWidth: 180,
      accessor: (acc) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-kumo-line bg-kumo-base text-xs font-medium text-kumo-strong shadow-2xs whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>{acc.roleLabel}</span>
        </span>
      ),
      sortValue: (acc) => acc.roleLabel,
    },
    {
      key: 'office',
      header: 'Office',
      defaultWidth: 200,
      accessor: (acc) => (
        <span className="text-xs text-kumo-default font-sans whitespace-nowrap">
          {acc.assigned_hub ? `${acc.assigned_hub} Office` : 'Central Kitchen Office'}
        </span>
      ),
      sortValue: (acc) => acc.assigned_hub || '',
    },
    {
      key: 'status',
      header: 'Status',
      defaultWidth: 120,
      accessor: (acc) => {
        const isActive = acc.status !== 'suspended'
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap shrink-0 ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400'
            }`}
          >
            {isActive ? 'Active' : 'Suspended'}
          </span>
        )
      },
      sortValue: (acc) => acc.status || 'active',
    },
    {
      key: 'actions',
      header: 'Actions',
      defaultWidth: 160,
      accessor: (acc) => (
        <div className="flex items-center gap-2 font-sans flex-nowrap" onClick={(e) => e.stopPropagation()}>
          <Tooltip content="Edit credentials, route, office, and role policy">
            <TableActionButton
              variant="outline"
              onClick={() => navigate(`/accounts/route/${encodeURIComponent(acc.email)}`)}
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Edit
            </TableActionButton>
          </Tooltip>

          {/* Context Popover for Extended Actions */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenuEmail(openMenuEmail === acc.email ? null : acc.email)
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-strong transition-colors cursor-pointer"
              aria-label={`Options for ${acc.name}`}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {openMenuEmail === acc.email && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenMenuEmail(null)
                  }}
                />
                <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-kumo-line bg-kumo-base shadow-xl z-50 p-1 font-sans text-xs animate-in fade-in zoom-in-95 divide-y divide-kumo-line/60">
                  <div className="py-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenuEmail(null)
                        navigate(`/accounts/route/${encodeURIComponent(acc.email)}`)
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
                      <span>Edit Route Page</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountToChangeRole(acc)
                        setEditRole(acc.role)
                        setEditPermissions(acc.permissions || ROLE_DEFAULT_PERMISSIONS[acc.role] || [])
                        setOpenMenuEmail(null)
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
                      <span>Change Role</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInspectPermissionsAccount(acc)
                        setOpenMenuEmail(null)
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
                      <span>View Permissions</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountToChangePassword(acc)
                        setNewPasswordVal(`Smk@${Math.floor(1000 + Math.random() * 9000)}!`)
                        setOpenMenuEmail(null)
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Key className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
                      <span>Change Password</span>
                    </button>
                    {acc.email.toLowerCase() !== activeAccountEmail.toLowerCase() && (
                      <button
                        type="button"
                        onClick={() => {
                          switchAccount(acc.email)
                          setOpenMenuEmail(null)
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
                        <span>Switch to Account</span>
                      </button>
                    )}
                  </div>
                  <div className="py-0.5">
                    <button
                      type="button"
                      disabled={availableAccounts.length <= 1}
                      onClick={() => {
                        setAccountToDelete(acc)
                        setOpenMenuEmail(null)
                      }}
                      className={cn(
                        'w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors',
                        availableAccounts.length <= 1
                          ? 'opacity-40 cursor-not-allowed text-kumo-subtle'
                          : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer'
                      )}
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ),
    },
  ]

  // Filtered policies based on search query in Edit Route Page
  const filteredPolicies = useMemo(() => {
    const q = policySearchQuery.toLowerCase().trim()
    if (!q) return ALL_SYSTEM_PERMISSIONS
    return ALL_SYSTEM_PERMISSIONS.filter(p =>
      p.label.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    )
  }, [policySearchQuery])

  // Filtered policies based on search query in Role Matrix Page
  const matrixFilteredPolicies = useMemo(() => {
    const q = matrixSearchQuery.toLowerCase().trim()
    if (!q) return ALL_SYSTEM_PERMISSIONS
    return ALL_SYSTEM_PERMISSIONS.filter(p =>
      p.label.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    )
  }, [matrixSearchQuery])

  // =========================================================================
  // VIEW 1: DEDICATED EDIT ROUTE & POLICIES PAGE (Screenshot 1 style)
  // =========================================================================
  if (isRoutePage && targetStaff) {
    const totalCount = ALL_SYSTEM_PERMISSIONS.length
    const activePermsCount = editPermissions.length

    return (
      <div className="space-y-6 font-sans max-w-6xl mx-auto pb-12">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/accounts')}
              className="w-9 h-9 rounded-xl border border-kumo-line bg-kumo-base hover:bg-kumo-tint flex items-center justify-center text-kumo-subtle hover:text-kumo-strong transition-colors cursor-pointer shadow-2xs shrink-0"
              aria-label="Back to team accounts"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-kumo-strong tracking-tight">Edit route</h1>
                <span className="text-xs px-2 py-0.5 rounded-full border border-kumo-line bg-kumo-canvas text-kumo-subtle font-mono">
                  {targetStaff.staff_id || 'SHD-STAFF'}
                </span>
              </div>
              <p className="text-xs text-kumo-subtle mt-0.5">
                Modify operator route credentials, office designation, and granular policy privileges.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => navigate('/accounts')}
              className="h-9 px-4 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={handleSaveRouteAndPolicies}
              className="h-9 px-4 text-xs font-semibold"
            >
              Save Changes
            </Button>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSaveRouteAndPolicies} className="space-y-6">
          {/* Card 1: Route & Identity Configuration */}
          <div className="border border-kumo-line rounded-2xl bg-kumo-base p-6 space-y-5 shadow-xs">
            <div className="pb-3 border-b border-kumo-line flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-kumo-strong">Route & Identity Credentials</h2>
                <p className="text-xs text-kumo-subtle mt-0.5">
                  Designated routing patterns and assigned physical office.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-kumo-line bg-kumo-canvas text-xs font-medium text-kumo-strong">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{SYSTEM_ROLE_CONFIGS.find(r => r.id === editRole)?.label || editRole}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Field 1: Zone (Using our design system custom Select component) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-kumo-strong">Zone</label>
                <Select
                  value={editZone}
                  onValueChange={(val) => setEditZone(String(val))}
                  options={[
                    { value: 'Zone 1: Core Mainland (Ikeja / Yaba / Surulere)', label: 'Zone 1: Core Mainland (Ikeja / Yaba / Surulere)' },
                    { value: 'Zone 2: Island Express (Victoria Island / Lekki / Ikoyi)', label: 'Zone 2: Island Express (Victoria Island / Lekki / Ikoyi)' },
                    { value: 'Zone 3: Greater Lagos & Inter-hub Trunk', label: 'Zone 3: Greater Lagos & Inter-hub Trunk' },
                    { value: 'Zone 4: Central Production Hub', label: 'Zone 4: Central Production Hub' },
                  ]}
                  placeholder="Select operating zone..."
                />
              </div>

              {/* Field 2: Office (Renamed from Operating Hub, using our Select component) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-kumo-strong">Office</label>
                <Select
                  value={editOffice}
                  onValueChange={(val) => setEditOffice(String(val))}
                  options={[
                    { value: 'Central Kitchen (Ikeja Office)', label: 'Central Kitchen (Ikeja Office)' },
                    { value: 'Yaba Head Office', label: 'Yaba Head Office' },
                    { value: 'Lekki Dispatch Staging Office', label: 'Lekki Dispatch Staging Office' },
                    { value: 'Main Storage Warehouse Office', label: 'Main Storage Warehouse Office' },
                    ...(facilities || []).map(f => ({ value: `${f.name} Office`, label: `${f.name} Office` }))
                  ]}
                  placeholder="Select assigned office..."
                />
              </div>

              {/* Field 3: Route Input with Green Validation Checkmark */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-kumo-strong">Route</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. www.thecentralreport.com/*"
                    className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong focus:outline-none focus:border-kumo-brand transition-colors font-mono"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
                  </div>
                </div>
                <p className="text-[11px] text-kumo-subtle leading-relaxed">
                  Use an asterisk (*) character to create dynamic patterns that match multiple URLs.
                </p>
              </div>

              {/* Field 4: Email Address Input with Green Validation Checkmark */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-kumo-strong">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="operator@smokeyhut.com"
                    className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong focus:outline-none focus:border-kumo-brand transition-colors font-mono"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
                  </div>
                </div>
              </div>

              {/* Field 5: Role Permissions Dropdown Select List */}
              <div className="md:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-kumo-strong">
                    Role Permissions ({activePermsCount} Active)
                  </label>
                  <span className="text-[11px] text-kumo-subtle">
                    Changing role resets baseline permission policies below
                  </span>
                </div>
                <Select
                  value={editRole}
                  onValueChange={(val) => handleEditRoleChange(val as UserRole)}
                  options={SYSTEM_ROLE_CONFIGS.map(r => ({
                    value: r.id,
                    label: `${r.label} — ${(ROLE_DEFAULT_PERMISSIONS[r.id] || []).length} baseline policies (${r.id.toUpperCase()})`
                  }))}
                  placeholder="Select designated role..."
                />
              </div>
            </div>
          </div>

          {/* Card 2: Create Policy / Role Permissions (Exact Match to Screenshot 1) */}
          <div className="border border-kumo-line rounded-2xl bg-kumo-base overflow-hidden shadow-xs">
            {/* Policy Card Header */}
            <div className="p-5 border-b border-kumo-line bg-kumo-canvas/40">
              <h2 className="text-sm font-bold text-kumo-strong">Create policy</h2>
            </div>

            <div className="p-6 space-y-5">
              {/* Top Selectors Row (Scope & Applies to) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="w-full">
                  <Select
                    value={editEmail}
                    onValueChange={(val) => setEditEmail(String(val))}
                    options={availableAccounts.map(a => ({
                      value: a.email,
                      label: `${a.email}'s Account`
                    }))}
                  />
                </div>
                <div className="w-full">
                  <Select
                    value={editOffice}
                    onValueChange={(val) => setEditOffice(String(val))}
                    options={[
                      { value: 'Entire account', label: 'Entire account' },
                      { value: 'Central Kitchen (Ikeja Office)', label: 'Central Kitchen (Ikeja Office)' },
                      { value: 'Yaba Head Office', label: 'Yaba Head Office' },
                      { value: 'Lekki Dispatch Staging Office', label: 'Lekki Dispatch Staging Office' },
                      { value: 'Main Storage Warehouse Office', label: 'Main Storage Warehouse Office' },
                    ]}
                  />
                </div>
              </div>

              {/* Explanatory Context Text */}
              <p className="text-xs text-kumo-default leading-relaxed">
                Define what permissions <strong className="text-kumo-strong font-semibold">{editEmail}</strong> should have within the account-level scope: <strong className="text-kumo-strong font-semibold">{editEmail}'s Account</strong>.
              </p>

              {/* Search Bar matching screenshot */}
              <div className="relative">
                <Search className="w-4 h-4 text-kumo-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={policySearchQuery}
                  onChange={(e) => setPolicySearchQuery(e.target.value)}
                  placeholder="Search by role name..."
                  className="w-full h-10 pl-10 pr-10 rounded-xl border border-kumo-line bg-kumo-base text-xs text-kumo-strong placeholder:text-kumo-subtle focus:outline-none focus:border-kumo-brand transition-colors"
                />
                {policySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setPolicySearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-kumo-subtle hover:text-kumo-strong"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Collapsible Accordion: Overall roles with count and master toggle */}
              <div className="border border-kumo-line rounded-xl overflow-hidden bg-kumo-base divide-y divide-kumo-line">
                {/* Header matching Screenshot 1 */}
                <div className="flex items-center justify-between px-4 py-3 bg-kumo-canvas/60 select-none">
                  <button
                    type="button"
                    onClick={() => setExpandedCategories(prev => ({
                      ...prev,
                      'Overall roles': !prev['Overall roles']
                    }))}
                    className="flex items-center gap-2 text-left cursor-pointer group"
                  >
                    {expandedCategories['Overall roles'] ? (
                      <ChevronDown className="w-4 h-4 text-kumo-subtle group-hover:text-kumo-strong transition-colors" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-kumo-subtle group-hover:text-kumo-strong transition-colors" />
                    )}
                    <span className="font-semibold text-xs text-kumo-strong">Overall roles</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-kumo-subtle">
                      {activePermsCount}/{totalCount}
                    </span>
                    <ToggleSwitch
                      checked={activePermsCount === totalCount}
                      onChange={() => toggleAllInCategory(ALL_SYSTEM_PERMISSIONS.map(p => p.label), activePermsCount === totalCount)}
                      ariaLabel="Toggle all overall roles"
                    />
                  </div>
                </div>

                {/* Policy Rows with Dashed Divider Lines (Exact Screenshot 1 Style) */}
                {expandedCategories['Overall roles'] && (
                  <div className="divide-y divide-dashed divide-kumo-line">
                    {filteredPolicies.map((perm) => {
                      const isChecked = editPermissions.includes(perm.label)
                      return (
                        <div
                          key={perm.id}
                          className="grid grid-cols-[1.4fr_2.4fr_auto] items-center gap-4 px-5 py-3.5 hover:bg-kumo-tint/30 transition-colors"
                        >
                          {/* Policy Name (Left) */}
                          <div className="min-w-0 pr-2">
                            <span className="font-semibold text-xs text-kumo-strong block leading-tight">
                              {perm.label}
                            </span>
                            <span className="text-[10px] text-kumo-subtle font-mono mt-0.5 block">
                              {perm.category}
                            </span>
                          </div>

                          {/* Description (Center) */}
                          <div className="min-w-0 pr-3">
                            <p className="text-xs text-kumo-default leading-relaxed line-clamp-2">
                              {perm.description}
                            </p>
                          </div>

                          {/* Toggle Switch (Right) */}
                          <div className="flex items-center justify-end pl-2">
                            <ToggleSwitch
                              checked={isChecked}
                              onChange={() => togglePolicyPermission(perm.label)}
                              ariaLabel={`Toggle ${perm.label}`}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 border-t border-kumo-line bg-kumo-canvas/40 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate('/accounts')}
                className="h-10 px-5 text-xs font-medium"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="h-10 px-6 text-xs font-semibold shadow-xs"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    )
  }

  // =========================================================================
  // VIEW 2: DEDICATED ROLE MATRIX PAGE (Screenshot 2 & Screenshot 1 style)
  // =========================================================================
  if (isMatrixPage) {
    const isScopeSelected = Boolean(matrixScope)
    const totalCount = ALL_SYSTEM_PERMISSIONS.length
    const activeMatrixCount = matrixPermissions.length

    return (
      <div className="space-y-6 font-sans max-w-6xl mx-auto pb-12">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/accounts')}
              className="w-9 h-9 rounded-xl border border-kumo-line bg-kumo-base hover:bg-kumo-tint flex items-center justify-center text-kumo-subtle hover:text-kumo-strong transition-colors cursor-pointer shadow-2xs shrink-0"
              aria-label="Back to team accounts"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-kumo-strong tracking-tight">Role Matrix & Policies</h1>
              <p className="text-xs text-kumo-subtle mt-0.5">
                Define and manage system-wide role policies, authority scopes, and functional operational access across all offices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => navigate('/accounts')}
              className="h-9 px-4 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              disabled={!isScopeSelected}
              onClick={handleSaveMatrixPolicy}
              className="h-9 px-4 text-xs font-semibold"
            >
              Create policy
            </Button>
          </div>
        </div>

        {/* Create Policy Card (Exact match to Screenshot 2 & Screenshot 1) */}
        <div className="border border-kumo-line rounded-2xl bg-kumo-base overflow-hidden shadow-xs">
          {/* Card Header matching Screenshot 2 */}
          <div className="p-5 border-b border-kumo-line bg-kumo-canvas/40">
            <h2 className="text-sm font-bold text-kumo-strong">Create policy</h2>
          </div>

          <div className="p-6 space-y-5">
            {/* Top Scope Selectors Row (Screenshot 2: Select a scope... & Applies to...) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="w-full">
                <Select
                  value={matrixScope}
                  onValueChange={(val) => handleMatrixScopeChange(String(val))}
                  options={[
                    { value: '', label: 'Select a scope...' },
                    ...SYSTEM_ROLE_CONFIGS.map(r => ({
                      value: r.id,
                      label: `${r.label} (${(ROLE_DEFAULT_PERMISSIONS[r.id] || []).length} baseline policies)`
                    }))
                  ]}
                  placeholder="Select a scope..."
                />
              </div>

              <div className="w-full">
                <Select
                  value={matrixAppliesTo}
                  onValueChange={(val) => setMatrixAppliesTo(String(val))}
                  options={[
                    { value: 'Entire account', label: 'Entire account' },
                    { value: 'Central Kitchen (Ikeja Office)', label: 'Central Kitchen (Ikeja Office)' },
                    { value: 'Yaba Head Office', label: 'Yaba Head Office' },
                    { value: 'Lekki Dispatch Staging Office', label: 'Lekki Dispatch Staging Office' },
                    { value: 'Main Storage Warehouse Office', label: 'Main Storage Warehouse Office' },
                  ]}
                  placeholder="Applies to..."
                />
              </div>
            </div>

            {/* When NO scope is selected yet: EXACT MATCH TO SCREENSHOT 2 */}
            {!isScopeSelected ? (
              <div className="border-2 border-dashed border-kumo-line rounded-2xl p-16 text-center my-6">
                <p className="text-xs text-kumo-subtle select-none font-medium">
                  Roles will appear after you select a scope.
                </p>
              </div>
            ) : (
              /* When Scope IS Selected: EXACT MATCH TO SCREENSHOT 1 */
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Context description */}
                <p className="text-xs text-kumo-default leading-relaxed">
                  Define what permissions <strong className="text-kumo-strong font-semibold">{SYSTEM_ROLE_CONFIGS.find(r => r.id === matrixScope)?.label || matrixScope}</strong> should have within the account-level scope: <strong className="text-kumo-strong font-semibold">{matrixAppliesTo}</strong>.
                </p>

                {/* Search Input matching Screenshot 1 */}
                <div className="relative">
                  <Search className="w-4 h-4 text-kumo-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={matrixSearchQuery}
                    onChange={(e) => setMatrixSearchQuery(e.target.value)}
                    placeholder="Search by role name..."
                    className="w-full h-10 pl-10 pr-10 rounded-xl border border-kumo-line bg-kumo-base text-xs text-kumo-strong placeholder:text-kumo-subtle focus:outline-none focus:border-kumo-brand transition-colors"
                  />
                  {matrixSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setMatrixSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-kumo-subtle hover:text-kumo-strong"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Collapsible Accordion with Dashed Line Rows matching Screenshot 1 */}
                <div className="border border-kumo-line rounded-xl overflow-hidden bg-kumo-base divide-y divide-kumo-line">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-kumo-canvas/60 select-none">
                    <button
                      type="button"
                      onClick={() => setMatrixExpandedCats(prev => ({
                        ...prev,
                        'Overall roles': !prev['Overall roles']
                      }))}
                      className="flex items-center gap-2 text-left cursor-pointer group"
                    >
                      {matrixExpandedCats['Overall roles'] ? (
                        <ChevronDown className="w-4 h-4 text-kumo-subtle group-hover:text-kumo-strong transition-colors" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-kumo-subtle group-hover:text-kumo-strong transition-colors" />
                      )}
                      <span className="font-semibold text-xs text-kumo-strong">Overall roles</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-kumo-subtle">
                        {activeMatrixCount}/{totalCount}
                      </span>
                      <ToggleSwitch
                        checked={activeMatrixCount === totalCount}
                        onChange={() => toggleMatrixCategory(ALL_SYSTEM_PERMISSIONS.map(p => p.label), activeMatrixCount === totalCount)}
                        ariaLabel="Toggle all matrix roles"
                      />
                    </div>
                  </div>

                  {/* Dashed Rows */}
                  {matrixExpandedCats['Overall roles'] && (
                    <div className="divide-y divide-dashed divide-kumo-line">
                      {matrixFilteredPolicies.map((perm) => {
                        const isChecked = matrixPermissions.includes(perm.label)
                        return (
                          <div
                            key={perm.id}
                            className="grid grid-cols-[1.4fr_2.4fr_auto] items-center gap-4 px-5 py-3.5 hover:bg-kumo-tint/30 transition-colors"
                          >
                            {/* Left: Policy Name */}
                            <div className="min-w-0 pr-2">
                              <span className="font-semibold text-xs text-kumo-strong block leading-tight">
                                {perm.label}
                              </span>
                              <span className="text-[10px] text-kumo-subtle font-mono mt-0.5 block">
                                {perm.category}
                              </span>
                            </div>

                            {/* Middle: Description */}
                            <div className="min-w-0 pr-3">
                              <p className="text-xs text-kumo-default leading-relaxed line-clamp-2">
                                {perm.description}
                              </p>
                            </div>

                            {/* Right: Toggle Switch */}
                            <div className="flex items-center justify-end pl-2">
                              <ToggleSwitch
                                checked={isChecked}
                                onChange={() => toggleMatrixPolicy(perm.label)}
                                ariaLabel={`Toggle ${perm.label}`}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Footer Actions matching Screenshot 2 */}
          <div className="p-4 border-t border-kumo-line bg-kumo-canvas/40 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate('/accounts')}
              className="h-10 px-5 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="button"
              disabled={!isScopeSelected}
              onClick={handleSaveMatrixPolicy}
              className="h-10 px-6 text-xs font-semibold shadow-xs"
            >
              Create policy
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // VIEW 3: MAIN TEAM ACCOUNTS TABLE PAGE
  // =========================================================================
  return (
    <div className="space-y-6 font-sans">
      {/* ------------------------------------------------------------- */}
      {/* 1. PAGE HEADER                                                */}
      {/* ------------------------------------------------------------- */}
      <PageHeader
        title="Manage Accounts"
        subtitle="Display team members, configure system permissions, and manage access credentials across all offices."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<Download className="w-4 h-4" />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/accounts/matrix')}
              leftIcon={<Shield className="w-4 h-4 text-blue-600" />}
              className="h-10 px-4 text-sm font-medium shadow-xs"
            >
              Role Matrix
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setOnboardForm((prev) => ({
                  ...prev,
                  temporaryPassword: 'Smokey@' + Math.floor(1000 + Math.random() * 9000),
                  permissions: ROLE_DEFAULT_PERMISSIONS['kitchen'] || []
                }))
                setIsOnboardOpen(true)
              }}
              leftIcon={<UserPlus className="w-4 h-4" />}
              className="h-10 px-4 text-sm font-semibold shadow-xs"
            >
              Add Member
            </Button>
          </>
        }
      />

      {/* ------------------------------------------------------------- */}
      {/* 2. KUMO TABS                                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val) => {
            if (val === 'matrix') {
              navigate('/accounts/matrix')
            } else {
              setActiveTab(val as any)
            }
          }}
          tabs={[
            { id: 'all', label: 'All Accounts', badge: availableAccounts.length },
            { id: 'active', label: 'Active', badge: activeCount },
            { id: 'inactive', label: 'Inactive', badge: inactiveCount > 0 ? inactiveCount : undefined },
            { id: 'matrix', label: 'Role Matrix' },
          ]}
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. MAIN DATA TABLE                                            */}
      {/* ------------------------------------------------------------- */}
      <div>
        <DataTable<AppUserAccount>
          data={tableData}
          columns={accountColumns}
          searchable={true}
          searchPlaceholder="Filter team members by name, email, role, office..."
          searchFilter={(acc, q) =>
            Boolean(
              acc.name.toLowerCase().includes(q) ||
              acc.email.toLowerCase().includes(q) ||
              acc.roleLabel.toLowerCase().includes(q) ||
              (acc.assigned_hub && acc.assigned_hub.toLowerCase().includes(q)) ||
              (acc.permissions && acc.permissions.some(p => p.toLowerCase().includes(q)))
            )
          }
          title="Team Members"
          exportFilename="smokey-team-accounts.csv"
          enableRowSelection={true}
          onRowClick={(acc) => navigate(`/accounts/route/${encodeURIComponent(acc.email)}`)}
          filterCategories={[
            {
              name: 'Role Scope',
              key: 'role',
              options: [
                { label: 'All Roles', value: 'all' },
                ...SYSTEM_ROLE_CONFIGS.map(r => ({ label: r.label, value: r.id }))
              ],
              activeValue: selectedRoleFilter,
              onChange: setSelectedRoleFilter
            },
            {
              name: 'Office',
              key: 'office',
              options: [
                { label: 'All Offices', value: 'all' },
                { label: 'Central Kitchen (Ikeja Office)', value: 'Central Kitchen' },
                { label: 'Yaba Head Office', value: 'Yaba' },
                { label: 'Lekki Dispatch Staging Office', value: 'Lekki' },
                { label: 'Main Storage Warehouse Office', value: 'Main Storage' }
              ],
              activeValue: selectedOfficeFilter,
              onChange: setSelectedOfficeFilter
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

      {/* ------------------------------------------------------------- */}
      {/* 4. SUB-MODALS                                                 */}
      {/* ------------------------------------------------------------- */}

      {/* ONBOARD NEW OPERATOR MODAL */}
      <Dialog
        isOpen={isOnboardOpen}
        onClose={() => setIsOnboardOpen(false)}
        title="Onboard New Team Member"
        description="Register a new staff member or operator, provision their credentials, and assign role authority."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveOnboard} className="space-y-4 font-sans text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-kumo-strong">Full Name</label>
              <input
                type="text"
                required
                value={onboardForm.name}
                onChange={(e) => setOnboardForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Samuel Adeleke"
                className="w-full h-9 px-3 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong focus:outline-none focus:border-kumo-brand"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-kumo-strong">Email Address</label>
              <input
                type="email"
                required
                value={onboardForm.email}
                onChange={(e) => setOnboardForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="samuel@smokeyhut.com"
                className="w-full h-9 px-3 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong focus:outline-none focus:border-kumo-brand"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-kumo-strong">Designated Role</label>
              <select
                value={onboardForm.role}
                onChange={(e) => {
                  const r = e.target.value as UserRole
                  setOnboardForm(prev => ({
                    ...prev,
                    role: r,
                    permissions: ROLE_DEFAULT_PERMISSIONS[r] || []
                  }))
                }}
                className="w-full h-9 px-3 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong focus:outline-none focus:border-kumo-brand"
              >
                {SYSTEM_ROLE_CONFIGS.map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-kumo-strong">Office</label>
              <select
                value={onboardForm.office}
                onChange={(e) => setOnboardForm(prev => ({ ...prev, office: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong focus:outline-none focus:border-kumo-brand"
              >
                <option value="Central Kitchen (Ikeja Office)">Central Kitchen (Ikeja Office)</option>
                <option value="Yaba Head Office">Yaba Head Office</option>
                <option value="Lekki Dispatch Staging Office">Lekki Dispatch Staging Office</option>
                <option value="Main Storage Warehouse Office">Main Storage Warehouse Office</option>
              </select>
            </div>
          </div>

          {/* Temporary Password */}
          <div className="p-3 bg-kumo-canvas/60 border border-kumo-line rounded-xl space-y-1 text-left">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-kumo-strong">Temporary Password</label>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(onboardForm.temporaryPassword)
                  showToast('Temporary password copied to clipboard', 'success')
                }}
                className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
            <p className="font-mono text-xs font-bold text-kumo-strong bg-kumo-base px-2.5 py-1.5 rounded border border-kumo-line/80 inline-block">
              {onboardForm.temporaryPassword}
            </p>
            <p className="text-[10px] text-kumo-subtle">
              Operator will be prompted to set a permanent password upon first login.
            </p>
          </div>

          {/* Custom Permissions Toggle */}
          <div className="space-y-2 text-left">
            <button
              type="button"
              onClick={() => setShowOnboardCustomPerms(!showOnboardCustomPerms)}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showOnboardCustomPerms ? 'Hide custom permissions' : 'Customize granular permissions'}</span>
              <span>({onboardForm.permissions.length} active)</span>
            </button>

            {showOnboardCustomPerms && (
              <div className="p-3 bg-kumo-canvas border border-kumo-line rounded-xl max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_SYSTEM_PERMISSIONS.map((perm) => {
                  const checked = onboardForm.permissions.includes(perm.label)
                  return (
                    <label key={perm.id} className="flex items-start gap-2 text-left cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setOnboardForm(prev => ({
                            ...prev,
                            permissions: checked
                              ? prev.permissions.filter(p => p !== perm.label)
                              : [...prev.permissions, perm.label]
                          }))
                        }}
                        className="mt-0.5 rounded border-kumo-line text-primary focus:ring-primary size-3.5 shrink-0"
                      />
                      <span className="text-[11px] text-kumo-strong leading-tight">{perm.label}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-kumo-line">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsOnboardOpen(false)}
              className="h-9 px-4 text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              className="h-9 px-4 text-xs font-semibold"
            >
              Create Account
            </Button>
          </div>
        </form>
      </Dialog>

      {/* CHANGE PASSWORD MODAL */}
      <Dialog
        isOpen={Boolean(accountToChangePassword)}
        onClose={() => setAccountToChangePassword(null)}
        title="Reset Operator Password"
        description={`Set a new secure access credential for ${accountToChangePassword?.name}.`}
        maxWidth="md"
      >
        {accountToChangePassword && (
          <form onSubmit={handleSavePassword} className="space-y-4 font-sans text-xs text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-kumo-strong">New Password</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  className="w-full h-9 pl-3 pr-20 rounded-lg border border-kumo-line bg-kumo-base text-xs font-mono text-kumo-strong focus:outline-none focus:border-kumo-brand"
                />
                <button
                  type="button"
                  onClick={() => setNewPasswordVal(`Smk@${Math.floor(1000 + Math.random() * 9000)}!`)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-primary hover:underline font-medium cursor-pointer"
                >
                  Generate
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requireReset"
                checked={requirePassReset}
                onChange={(e) => setRequirePassReset(e.target.checked)}
                className="rounded border-kumo-line text-primary focus:ring-primary size-3.5"
              />
              <label htmlFor="requireReset" className="text-xs text-kumo-default cursor-pointer select-none">
                Require password change upon next login
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-kumo-line">
              <Button
                variant="outline"
                type="button"
                onClick={() => setAccountToChangePassword(null)}
                className="h-9 px-4 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="h-9 px-4 text-xs font-semibold"
              >
                Update Password
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* CHANGE ROLE MODAL */}
      <Dialog
        isOpen={Boolean(accountToChangeRole)}
        onClose={() => setAccountToChangeRole(null)}
        title="Change Operator Role"
        description={`Update system role and authority level for ${accountToChangeRole?.name}.`}
        maxWidth="md"
      >
        {accountToChangeRole && (
          <div className="space-y-4 font-sans text-xs text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-kumo-strong">Select New Role</label>
              <div className="space-y-2">
                {SYSTEM_ROLE_CONFIGS.map((r) => {
                  const isSelected = editRole === r.id
                  return (
                    <div
                      key={r.id}
                      onClick={() => handleEditRoleChange(r.id)}
                      className={cn(
                        'p-3 rounded-xl border cursor-pointer transition-colors flex items-start gap-3',
                        isSelected
                          ? 'bg-primary/5 border-primary text-kumo-strong'
                          : 'bg-kumo-base border-kumo-line text-kumo-default hover:bg-kumo-tint'
                      )}
                    >
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => handleEditRoleChange(r.id)}
                        className="mt-0.5 text-primary focus:ring-primary"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-kumo-strong">{r.label}</p>
                        <p className="text-[11px] text-kumo-subtle mt-0.5">{r.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-kumo-line">
              <Button
                variant="outline"
                type="button"
                onClick={() => setAccountToChangeRole(null)}
                className="h-9 px-4 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="button"
                onClick={() => {
                  const roleConfig = SYSTEM_ROLE_CONFIGS.find((r) => r.id === editRole)
                  const roleLabel = roleConfig ? roleConfig.label : editRole
                  updateAccount(accountToChangeRole.email, {
                    role: editRole,
                    roleLabel,
                    permissions: editPermissions,
                  })
                  setAccountToChangeRole(null)
                  showToast(`Updated role to ${roleLabel}`, 'success')
                }}
                className="h-9 px-4 text-xs font-semibold"
              >
                Apply Role
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* VIEW PERMISSIONS MODAL */}
      <Dialog
        isOpen={Boolean(inspectPermissionsAccount)}
        onClose={() => setInspectPermissionsAccount(null)}
        title={`Active Permissions: ${inspectPermissionsAccount?.name}`}
        description={`Role: ${inspectPermissionsAccount?.roleLabel} • Office: ${inspectPermissionsAccount?.assigned_hub ? `${inspectPermissionsAccount.assigned_hub} Office` : 'Central Kitchen Office'}`}
        maxWidth="lg"
      >
        {inspectPermissionsAccount && (
          <div className="space-y-3 font-sans text-xs text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {(inspectPermissionsAccount.permissions || ROLE_DEFAULT_PERMISSIONS[inspectPermissionsAccount.role] || []).map((p) => (
                <div
                  key={p}
                  className="flex items-center gap-2 p-2 rounded-lg border border-kumo-line bg-kumo-canvas/50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-medium text-xs text-kumo-strong">{p}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-kumo-line">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectPermissionsAccount(null)}
                className="h-9 px-4 text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* DELETE ACCOUNT CONFIRMATION */}
      <Dialog
        isOpen={Boolean(accountToDelete)}
        onClose={() => setAccountToDelete(null)}
        title="Remove Team Member"
        description="Are you sure you want to permanently remove this operator account? Access privileges will be revoked immediately."
        maxWidth="sm"
      >
        {accountToDelete && (
          <div className="space-y-4 font-sans text-xs text-left">
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="text-red-900 dark:text-red-200">
                <p className="font-semibold text-xs">{accountToDelete.name}</p>
                <p className="text-[11px] opacity-80">{accountToDelete.email}</p>
                <p className="text-[11px] opacity-80 mt-1">
                  Assigned role: <strong>{accountToDelete.roleLabel}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-kumo-line">
              <Button
                variant="outline"
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="h-9 px-4 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                type="button"
                onClick={handleConfirmDelete}
                className="h-9 px-4 text-xs font-semibold"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
export default ManageAccountsPage
