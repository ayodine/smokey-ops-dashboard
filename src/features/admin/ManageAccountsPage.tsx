import React, { useState, useMemo } from 'react'
import {
  Users,
  Search,
  Download,
  Plus,
  Trash2,
  Key,
  Mail,
  ShieldCheck,
  Shield,
  ChevronsUpDown,
  ExternalLink,
  History,
  Lock,
  RefreshCw,
  UserPlus,
  Edit2,
  Copy,
  Check,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  MoreVertical,
  Layers
} from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { KumoTabs } from '@/components/ui/KumoTabs'
import { DataTable, ColumnDef } from '@/components/ui/DataTable'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { Tooltip } from '@/components/ui/Tooltip'
import { useSmokeyOps, AppUserAccount, UserRole, ROLE_DEFAULT_PERMISSIONS } from '@/context/SmokeyOpsContext'
import { useWarehouse } from '@/context/WarehouseContext'
import { cn } from '@/lib/utils'
import {
  ALL_SYSTEM_PERMISSIONS,
  SYSTEM_ROLE_CONFIGS
} from '@/components/layout/ManageAccountsModal'

export const ManageAccountsPage: React.FC = () => {
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

  // Kumo Tabs State: 'all' | 'active' | 'inactive' | 'roles'
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive' | 'roles'>('all')

  // Dropdown filter state for DataTable filterCategories
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all')
  const [selectedHubFilter, setSelectedHubFilter] = useState<string>('all')

  // Sub-modal states
  const [openMenuEmail, setOpenMenuEmail] = useState<string | null>(null)
  const [accountToEdit, setAccountToEdit] = useState<AppUserAccount | null>(null)
  const [accountToChangePassword, setAccountToChangePassword] = useState<AppUserAccount | null>(null)
  const [accountToDelete, setAccountToDelete] = useState<AppUserAccount | null>(null)
  const [accountToChangeRole, setAccountToChangeRole] = useState<AppUserAccount | null>(null)
  const [inspectPermissionsAccount, setInspectPermissionsAccount] = useState<AppUserAccount | null>(null)
  const [isOnboardOpen, setIsOnboardOpen] = useState(false)
  const [isManageRolesOpen, setIsManageRolesOpen] = useState(false)

  // Edit Account Form State (Screenshot 2 adaptation)
  const [editRole, setEditRole] = useState<UserRole>('kitchen')
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editHub, setEditHub] = useState('')
  const [editPermissions, setEditPermissions] = useState<string[]>([])
  const [permissionCategoryFilter, setPermissionCategoryFilter] = useState<string>('All')

  // Onboard Account Form State
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    email: '',
    role: 'kitchen' as UserRole,
    hub: 'Central Kitchen (Ikeja)',
    temporaryPassword: 'Smokey@' + Math.floor(1000 + Math.random() * 9000),
    permissions: ROLE_DEFAULT_PERMISSIONS['kitchen'] || []
  })
  const [showOnboardCustomPerms, setShowOnboardCustomPerms] = useState(false)

  // Change Password Form State
  const [newPasswordVal, setNewPasswordVal] = useState('')
  const [requirePassReset, setRequirePassReset] = useState(true)
  const [copiedPass, setCopiedPass] = useState(false)

  // Formatted realistic last activities matching the design system
  const getActivityTimestamp = (acc: AppUserAccount) => {
    if (acc.role === 'admin') return 'Today, 3:52 PM'
    if (acc.role === 'manager') return 'Today, 3:24 PM'
    if (acc.role === 'rider') return 'Today, 1:15 PM'
    if (acc.role === 'kitchen') return 'Yesterday, 8:21 AM'
    if (acc.role === 'inventory') return 'Sep 24, 2026 at 2:10 PM'
    if (acc.role === 'dispatcher') return 'Sep 23, 2026 at 1:30 PM'
    return acc.last_active || 'Today, 12:00 PM'
  }

  // KPI Calculations
  const activeCount = useMemo(() => {
    return availableAccounts.filter(a => a.status !== 'suspended').length
  }, [availableAccounts])

  const inactiveCount = useMemo(() => {
    return availableAccounts.filter(a => a.status === 'suspended').length
  }, [availableAccounts])

  // Data filtered by the active Kumo tab & dropdowns
  const tableData = useMemo(() => {
    return availableAccounts.filter((acc) => {
      // 1. Kumo Tab Filter
      if (activeTab === 'active' && acc.status === 'suspended') return false
      if (activeTab === 'inactive' && acc.status !== 'suspended') return false

      // 2. Dropdown Filter: Role
      if (selectedRoleFilter !== 'all' && acc.role !== selectedRoleFilter) {
        return false
      }

      // 3. Dropdown Filter: Hub
      if (selectedHubFilter !== 'all' && acc.assigned_hub !== selectedHubFilter) {
        return false
      }

      return true
    })
  }, [availableAccounts, activeTab, selectedRoleFilter, selectedHubFilter])

  // Open Edit Modal for an account (Screenshot 2 layout + permissions)
  const startEditAccount = (acc: AppUserAccount) => {
    setAccountToEdit(acc)
    setEditRole(acc.role)
    setEditName(acc.name)
    setEditEmail(acc.email)
    setEditHub(acc.assigned_hub || 'Central Kitchen (Ikeja)')
    setEditPermissions(acc.permissions || ROLE_DEFAULT_PERMISSIONS[acc.role] || [])
    setPermissionCategoryFilter('All')
    setOpenMenuEmail(null)
  }

  const handleEditRoleChange = (newRole: UserRole) => {
    setEditRole(newRole)
    const defaults = ROLE_DEFAULT_PERMISSIONS[newRole] || []
    setEditPermissions(defaults)
  }

  const toggleEditPermission = (permLabel: string) => {
    setEditPermissions(prev =>
      prev.includes(permLabel) ? prev.filter(p => p !== permLabel) : [...prev, permLabel]
    )
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountToEdit) return

    const roleConfig = SYSTEM_ROLE_CONFIGS.find((r) => r.id === editRole)
    const roleLabel = roleConfig ? roleConfig.label : editRole

    updateAccount(accountToEdit.email, {
      name: editName.trim() || accountToEdit.name,
      email: editEmail.trim() || accountToEdit.email,
      role: editRole,
      roleLabel,
      assigned_hub: editHub,
      permissions: editPermissions,
    })

    setAccountToEdit(null)
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

    const newAcc: AppUserAccount = {
      email: onboardForm.email.trim(),
      name: onboardForm.name.trim(),
      role: onboardForm.role,
      roleLabel,
      assigned_hub: onboardForm.hub,
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
      hub: 'Central Kitchen (Ikeja)',
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
    const headers = ['Full Name', 'Staff ID', 'Email Address', 'Role', 'Assigned Hub', 'Last Activity', 'Permissions Count', 'Status']
    const rows = tableData.map(a => [
      `"${a.name}"`,
      `"${a.staff_id || 'SHD-OP'}"`,
      `"${a.email}"`,
      `"${a.roleLabel}"`,
      `"${a.assigned_hub || 'Central Kitchen (Ikeja)'}"`,
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
    const headers = ['Full Name', 'Email Address', 'Role', 'Assigned Hub', 'Status']
    const rows = selectedItems.map(a => [
      `"${a.name}"`,
      `"${a.email}"`,
      `"${a.roleLabel}"`,
      `"${a.assigned_hub || 'Central Kitchen'}"`,
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

  // DataTable Column Definitions (Adapted from Raw Inventory layout)
  // Notice: Profile icon / avatar is REMOVED from the table per user request
  const accountColumns: ColumnDef<AppUserAccount>[] = [
    {
      key: 'name',
      header: 'Member Full Name',
      defaultWidth: 240,
      accessor: (acc) => (
        <div>
          {/* Pure clean typography - NO profile avatar image/icon */}
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
      key: 'assigned_hub',
      header: 'Operating Hub',
      defaultWidth: 200,
      accessor: (acc) => (
        <span className="text-xs text-kumo-default font-sans whitespace-nowrap">
          {acc.assigned_hub || 'Central Kitchen (Ikeja)'}
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
          <Tooltip content="Edit credentials, route, hub, and permissions">
            <TableActionButton
              variant="outline"
              onClick={() => startEditAccount(acc)}
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
                      onClick={() => startEditAccount(acc)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
                      <span>Edit Route</span>
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

  return (
    <div className="space-y-6 font-sans">
      {/* ------------------------------------------------------------- */}
      {/* 1. PAGE HEADER (Matches Raw Inventory design system layout)   */}
      {/* ------------------------------------------------------------- */}
      <PageHeader
        title="Manage Accounts"
        subtitle="Display team members, configure system permissions, and manage access credentials across all operating hubs."
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
              onClick={() => setIsManageRolesOpen(true)}
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
      {/* 2. KUMO TABS (Official Cloudflare Kumo design system component)*/}
      {/* ------------------------------------------------------------- */}
      <div className="py-1 max-w-full overflow-x-auto [scrollbar-width:none]">
        <KumoTabs
          activeTab={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          tabs={[
            { id: 'all', label: 'All Accounts', badge: availableAccounts.length },
            { id: 'active', label: 'Active', badge: activeCount },
            { id: 'inactive', label: 'Inactive', badge: inactiveCount > 0 ? inactiveCount : undefined },
            { id: 'roles', label: 'Role Permissions' },
          ]}
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. MAIN DATA TABLE (Adapted from Raw Inventory DataTable)     */}
      {/* ------------------------------------------------------------- */}
      <div>
        {activeTab !== 'roles' ? (
          <DataTable<AppUserAccount>
            data={tableData}
            columns={accountColumns}
            searchable={true}
            searchPlaceholder="Filter team members by name, email, role, hub..."
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
            onRowClick={(acc) => startEditAccount(acc)}
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
                name: 'Operating Hub',
                key: 'hub',
                options: [
                  { label: 'All Operating Hubs', value: 'all' },
                  { label: 'Central Kitchen (Ikeja)', value: 'Central Kitchen (Ikeja)' },
                  { label: 'Yaba Head Office', value: 'Yaba Head Office' },
                  { label: 'Lekki Dispatch Staging', value: 'Lekki Dispatch Staging' },
                  { label: 'Main Storage Warehouse', value: 'Main Storage Warehouse' }
                ],
                activeValue: selectedHubFilter,
                onChange: setSelectedHubFilter
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
        ) : (
          /* Role Permissions Overview Panel */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-kumo-line">
              <div>
                <h3 className="text-sm font-bold text-kumo-strong">System Role Permission Matrix</h3>
                <p className="text-xs text-kumo-subtle mt-0.5">
                  Review baseline privileges and functional operational scopes granted to each role.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsManageRolesOpen(true)}
                leftIcon={<Shield className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Inspect All Permissions ({ALL_SYSTEM_PERMISSIONS.length})
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SYSTEM_ROLE_CONFIGS.map((r) => {
                const defaults = ROLE_DEFAULT_PERMISSIONS[r.id] || []
                const membersInRole = availableAccounts.filter(a => a.role === r.id)

                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl border border-kumo-line bg-kumo-base space-y-3 shadow-2xs hover:border-kumo-brand/40 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-kumo-line bg-kumo-canvas text-xs font-semibold text-kumo-strong">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>{r.label}</span>
                        </span>
                        <p className="text-[11px] text-kumo-subtle mt-1.5 font-mono">{r.id.toUpperCase()}</p>
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-kumo-tint text-kumo-strong">
                        {membersInRole.length} {membersInRole.length === 1 ? 'member' : 'members'}
                      </span>
                    </div>

                    <p className="text-xs text-kumo-default leading-relaxed line-clamp-2">
                      {r.description}
                    </p>

                    <div className="pt-2 border-t border-kumo-line/60">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-kumo-subtle font-medium">Default Permissions</span>
                        <span className="font-semibold text-kumo-strong">{defaults.length} active</span>
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                        {defaults.slice(0, 4).map((p) => (
                          <span
                            key={p}
                            className="px-2 py-0.5 rounded text-[10px] bg-kumo-canvas text-kumo-subtle border border-kumo-line/60"
                          >
                            {p}
                          </span>
                        ))}
                        {defaults.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-kumo-canvas text-kumo-subtle border border-kumo-line/60">
                            +{defaults.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. SUB-MODALS (Screenshot 2 adaptation & Subdialogs)           */}
      {/* ------------------------------------------------------------- */}

      {/* A. EDIT ROUTE / ACCOUNT MODAL (Exact match to Screenshot 2) */}
      <Dialog
        isOpen={Boolean(accountToEdit)}
        onClose={() => setAccountToEdit(null)}
        title="Edit route"
        description="Modify operator access credentials, role designation, and assigned zone."
        maxWidth="lg"
      >
        {accountToEdit && (
          <form onSubmit={handleSaveEdit} className="space-y-4 font-sans text-xs">
            {/* Field 1: Zone / Role Select Dropdown (Matching Screenshot 2) */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-kumo-strong">
                  Zone
                </label>
                <span className="text-[11px] text-kumo-subtle">
                  Role: <strong className="text-kumo-strong">{SYSTEM_ROLE_CONFIGS.find(r => r.id === editRole)?.label}</strong>
                </span>
              </div>
              <div className="relative">
                <select
                  value={editRole}
                  onChange={(e) => handleEditRoleChange(e.target.value as UserRole)}
                  className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong focus:outline-none focus:border-kumo-brand appearance-none cursor-pointer"
                >
                  {SYSTEM_ROLE_CONFIGS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label} ({r.id.toUpperCase()})
                    </option>
                  ))}
                </select>
                <ChevronsUpDown className="w-4 h-4 text-kumo-subtle absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Granular Permissions Section Inside Edit Route Modal */}
            <div className="p-3 bg-kumo-canvas/60 border border-kumo-line rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-kumo-strong">
                    Role Permissions ({editPermissions.length} Active)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditPermissions(ROLE_DEFAULT_PERMISSIONS[editRole] || [])}
                    className="text-[10px] text-primary hover:underline font-medium cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                  <span className="text-kumo-subtle">•</span>
                  <button
                    type="button"
                    onClick={() => setEditPermissions(ALL_SYSTEM_PERMISSIONS.map(p => p.label))}
                    className="text-[10px] text-kumo-default hover:text-kumo-strong font-medium cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-kumo-subtle">•</span>
                  <button
                    type="button"
                    onClick={() => setEditPermissions([])}
                    className="text-[10px] text-kumo-subtle hover:text-red-500 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
                {['All', 'Administration', 'Finance', 'Production', 'Inventory', 'Logistics'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPermissionCategoryFilter(cat)}
                    className={cn(
                      'px-2 py-0.5 rounded border transition-colors shrink-0 cursor-pointer',
                      permissionCategoryFilter === cat
                        ? 'bg-kumo-base text-kumo-strong font-bold border-kumo-line shadow-2xs'
                        : 'bg-kumo-canvas text-kumo-subtle border-transparent hover:text-kumo-strong'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Checkbox List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[150px] overflow-y-auto pr-1">
                {ALL_SYSTEM_PERMISSIONS
                  .filter((p) => permissionCategoryFilter === 'All' || p.category === permissionCategoryFilter)
                  .map((perm) => {
                    const isChecked = editPermissions.includes(perm.label)
                    return (
                      <label
                        key={perm.id}
                        className={cn(
                          'flex items-start gap-2 p-2 rounded-lg border text-left cursor-pointer transition-colors',
                          isChecked
                            ? 'bg-kumo-base border-primary/30 text-kumo-strong'
                            : 'bg-kumo-canvas/40 border-kumo-line/60 text-kumo-subtle hover:bg-kumo-base'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEditPermission(perm.label)}
                          className="mt-0.5 rounded border-kumo-line text-primary focus:ring-primary size-3.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium leading-tight truncate">{perm.label}</p>
                          <p className="text-[9px] text-kumo-subtle leading-tight line-clamp-1 mt-0.5">{perm.description}</p>
                        </div>
                      </label>
                    )
                  })}
              </div>
            </div>

            {/* Field 2: Route / Name Input with Green Validation Checkmark (Screenshot 2 exact match) */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-kumo-strong">
                Route
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. www.thecentralreport.com/*"
                  className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong focus:outline-none focus:border-kumo-brand transition-colors"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
                </div>
              </div>
              <p className="text-[11px] text-kumo-subtle leading-relaxed">
                Use an asterisk (*) character to create dynamic patterns that match multiple URLs.
              </p>
            </div>

            {/* Field 3: Email Address Input with Validation Checkmark */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-kumo-strong">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="operator@smokeyhut.com"
                  className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong focus:outline-none focus:border-kumo-brand transition-colors"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
                </div>
              </div>
            </div>

            {/* Field 4: Assigned Facility Hub */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-kumo-strong">
                Assigned Operating Hub
              </label>
              <div className="relative">
                <select
                  value={editHub}
                  onChange={(e) => setEditHub(e.target.value)}
                  className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong focus:outline-none focus:border-kumo-brand appearance-none cursor-pointer"
                >
                  <option value="Central Kitchen (Ikeja)">Central Kitchen (Ikeja)</option>
                  <option value="Yaba Head Office">Yaba Head Office</option>
                  <option value="Lekki Dispatch Staging">Lekki Dispatch Staging</option>
                  <option value="Main Storage Warehouse">Main Storage Warehouse</option>
                  {facilities?.map((f) => (
                    <option key={f.id} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <ChevronsUpDown className="w-4 h-4 text-kumo-subtle absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-kumo-line">
              <Button
                variant="outline"
                type="button"
                onClick={() => setAccountToEdit(null)}
                className="h-9 px-4 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="h-9 px-4 text-xs font-semibold"
              >
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* B. ONBOARD NEW OPERATOR MODAL */}
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
              <label className="text-xs font-semibold text-kumo-strong">Operating Hub</label>
              <select
                value={onboardForm.hub}
                onChange={(e) => setOnboardForm(prev => ({ ...prev, hub: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong focus:outline-none focus:border-kumo-brand"
              >
                <option value="Central Kitchen (Ikeja)">Central Kitchen (Ikeja)</option>
                <option value="Yaba Head Office">Yaba Head Office</option>
                <option value="Lekki Dispatch Staging">Lekki Dispatch Staging</option>
                <option value="Main Storage Warehouse">Main Storage Warehouse</option>
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

      {/* C. CHANGE PASSWORD MODAL */}
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

      {/* D. CHANGE ROLE MODAL */}
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
                }}
                className="h-9 px-4 text-xs font-semibold"
              >
                Apply Role
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* E. VIEW PERMISSIONS MODAL */}
      <Dialog
        isOpen={Boolean(inspectPermissionsAccount)}
        onClose={() => setInspectPermissionsAccount(null)}
        title={`Active Permissions: ${inspectPermissionsAccount?.name}`}
        description={`Role: ${inspectPermissionsAccount?.roleLabel} • Hub: ${inspectPermissionsAccount?.assigned_hub || 'Central Kitchen (Ikeja)'}`}
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

      {/* F. DELETE ACCOUNT CONFIRMATION */}
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

      {/* G. SYSTEM ROLE MATRIX OVERVIEW MODAL */}
      <Dialog
        isOpen={isManageRolesOpen}
        onClose={() => setIsManageRolesOpen(false)}
        title="System Roles & Authority Matrix"
        description="Complete overview of all built-in system personas and their privileged access domains."
        maxWidth="xl"
      >
        <div className="space-y-4 font-sans text-xs text-left max-h-[460px] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SYSTEM_ROLE_CONFIGS.map((r) => {
              const defaults = ROLE_DEFAULT_PERMISSIONS[r.id] || []
              return (
                <div
                  key={r.id}
                  className="p-3.5 rounded-xl border border-kumo-line bg-kumo-canvas/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-kumo-strong">{r.label}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-kumo-base border border-kumo-line text-kumo-subtle">
                      {r.id.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-kumo-default leading-relaxed">{r.description}</p>
                  <div className="pt-1.5 border-t border-kumo-line/60">
                    <p className="text-[10px] font-semibold text-kumo-subtle mb-1">
                      Privileges ({defaults.length}):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {defaults.slice(0, 5).map((p) => (
                        <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-kumo-base border border-kumo-line/80 text-kumo-strong">
                          {p}
                        </span>
                      ))}
                      {defaults.length > 5 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-kumo-base border border-kumo-line/80 text-kumo-subtle">
                          +{defaults.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-kumo-line">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsManageRolesOpen(false)}
              className="h-9 px-4 text-xs"
            >
              Close Matrix
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
