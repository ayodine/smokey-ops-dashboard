import React, { useState, useMemo, useEffect } from 'react'
import {
  Users,
  Search,
  Bell,
  Upload,
  Plus,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  MoreVertical,
  CheckCircle2,
  Trash2,
  Key,
  Mail,
  ShieldCheck,
  Shield,
  ChevronsUpDown,
  ExternalLink,
  X,
  History,
  Lock,
  RefreshCw,
  UserPlus,
  Edit2,
  Copy,
  Check,
  AlertTriangle,
  UserCheck
} from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/button'
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

  // Status Filter: 'all' | 'active' | 'inactive' (Matching Screenshot segmented control)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all')
  const [selectedHubFilter, setSelectedHubFilter] = useState<string>('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)

  // Sort State
  const [sortField, setSortField] = useState<'name' | 'email' | 'activity' | 'role'>('name')
  const [sortAsc, setSortAsc] = useState(true)

  // Selection state for checkboxes
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])

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

  // Keyboard shortcut listener for ⌘1 / Ctrl+1 to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault()
        const el = document.getElementById('team-search-input')
        el?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Formatted realistic last activities matching the screenshot style
  const getActivityTimestamp = (acc: AppUserAccount) => {
    if (acc.role === 'admin') return 'Today, 3:52 PM'
    if (acc.role === 'manager') return 'Today, 3:24 PM'
    if (acc.role === 'rider') return 'Today, 1:15 PM'
    if (acc.role === 'kitchen') return 'Yesterday, 8:21 AM'
    if (acc.role === 'inventory') return 'Sep 24, 2026 at 2:10 PM'
    if (acc.role === 'dispatcher') return 'Sep 23, 2026 at 1:30 PM'
    return acc.last_active || 'Today, 12:00 PM'
  }

  // Filtered and Sorted accounts
  const filteredAccounts = useMemo(() => {
    let result = availableAccounts.filter((acc) => {
      // 1. Status Filter
      const isInactive = acc.status === 'suspended'
      if (statusFilter === 'active' && isInactive) return false
      if (statusFilter === 'inactive' && !isInactive) return false

      // 2. Search query filter
      const q = searchQuery.toLowerCase().trim()
      if (q) {
        const matches =
          acc.name.toLowerCase().includes(q) ||
          acc.email.toLowerCase().includes(q) ||
          acc.roleLabel.toLowerCase().includes(q) ||
          (acc.assigned_hub && acc.assigned_hub.toLowerCase().includes(q)) ||
          (acc.permissions && acc.permissions.some(p => p.toLowerCase().includes(q)))
        if (!matches) return false
      }

      // 3. Dropdown filter: Role
      if (selectedRoleFilter !== 'all' && acc.role !== selectedRoleFilter) {
        return false
      }

      // 4. Dropdown filter: Hub
      if (selectedHubFilter !== 'all' && acc.assigned_hub !== selectedHubFilter) {
        return false
      }

      return true
    })

    result.sort((a, b) => {
      let comparison = 0
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortField === 'email') {
        comparison = a.email.localeCompare(b.email)
      } else if (sortField === 'activity') {
        comparison = getActivityTimestamp(a).localeCompare(getActivityTimestamp(b))
      } else if (sortField === 'role') {
        comparison = a.roleLabel.localeCompare(b.roleLabel)
      }
      return sortAsc ? comparison : -comparison
    })

    return result
  }, [availableAccounts, statusFilter, searchQuery, selectedRoleFilter, selectedHubFilter, sortField, sortAsc])

  const handleSort = (field: 'name' | 'email' | 'activity' | 'role') => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  // Selection handlers
  const isAllSelected = filteredAccounts.length > 0 && selectedEmails.length === filteredAccounts.length
  const isIndeterminate = selectedEmails.length > 0 && selectedEmails.length < filteredAccounts.length

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedEmails([])
    } else {
      setSelectedEmails(filteredAccounts.map(a => a.email))
    }
  }

  const handleToggleRow = (email: string) => {
    setSelectedEmails(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    )
  }

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
    const accountsToExport = selectedEmails.length > 0
      ? availableAccounts.filter(a => selectedEmails.includes(a.email))
      : availableAccounts

    const headers = ['Full Name', 'Email Address', 'Role', 'Assigned Hub', 'Last Activity', 'Permissions Count']
    const rows = accountsToExport.map(a => [
      `"${a.name}"`,
      `"${a.email}"`,
      `"${a.roleLabel}"`,
      `"${a.assigned_hub || 'Central Kitchen'}"`,
      `"${getActivityTimestamp(a)}"`,
      `"${(a.permissions || ROLE_DEFAULT_PERMISSIONS[a.role] || []).length}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `smokey_team_accounts_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast(`Exported ${accountsToExport.length} accounts to CSV`, 'success')
  }

  // Avatar backgrounds matching the illustrated avatar aesthetics from screenshot
  const avatarColors: Record<string, { bg: string; text: string; ring: string }> = {
    'admin': { bg: 'bg-indigo-100 dark:bg-indigo-950/60', text: 'text-indigo-600 dark:text-indigo-400', ring: 'ring-indigo-500/20' },
    'manager': { bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-400', ring: 'ring-amber-500/20' },
    'kitchen': { bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-600 dark:text-rose-400', ring: 'ring-rose-500/20' },
    'inventory': { bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-500/20' },
    'dispatcher': { bg: 'bg-teal-100 dark:bg-teal-950/60', text: 'text-teal-600 dark:text-teal-400', ring: 'ring-teal-500/20' },
    'rider': { bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20' }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER SECTION (Exact layout from user screenshot)          */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        {/* Left: Team Circle Icon, Title, Subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full border border-kumo-line bg-kumo-canvas/80 flex items-center justify-center text-kumo-strong shrink-0 shadow-2xs">
            <Users className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-kumo-strong tracking-tight">Team</h1>
            <p className="text-xs text-kumo-subtle mt-0.5">
              Display team members and personalize preferences.
            </p>
          </div>
        </div>

        {/* Right: Search Icon, Bell, Export, Add Member Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('team-search-input')
              el?.focus()
            }}
            className="w-9 h-9 rounded-xl border border-kumo-line bg-kumo-base hover:bg-kumo-tint flex items-center justify-center text-kumo-subtle hover:text-kumo-strong transition-colors cursor-pointer shadow-2xs"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => showToast('All operator permissions and credentials are up to date.', 'info', 'Notifications')}
            className="w-9 h-9 rounded-xl border border-kumo-line bg-kumo-base hover:bg-kumo-tint flex items-center justify-center text-kumo-subtle hover:text-kumo-strong transition-colors relative cursor-pointer shadow-2xs"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
          </button>

          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handleExportCSV}
            className="h-9 px-3 gap-1.5 text-xs font-medium rounded-xl shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 rotate-90" />
            <span>Export</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={() => {
              setOnboardForm((prev) => ({
                ...prev,
                temporaryPassword: 'Smokey@' + Math.floor(1000 + Math.random() * 9000),
                permissions: ROLE_DEFAULT_PERMISSIONS['kitchen'] || []
              }))
              setIsOnboardOpen(true)
            }}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="h-9 px-3.5 text-xs font-semibold rounded-xl"
          >
            Add Member
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SUB-HEADER / FILTER BAR (Exact layout from screenshot)      */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Left: Segmented Pill Control (All / Active / Inactive) */}
        <div className="flex items-center gap-1 p-1 bg-kumo-canvas/80 rounded-xl border border-kumo-line/80 text-xs font-medium w-fit shadow-2xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={cn(
              'px-5 py-1.5 rounded-lg transition-all cursor-pointer select-none text-xs',
              statusFilter === 'all'
                ? 'bg-kumo-base text-kumo-strong font-semibold shadow-xs'
                : 'text-kumo-subtle hover:text-kumo-strong'
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={cn(
              'px-5 py-1.5 rounded-lg transition-all cursor-pointer select-none text-xs',
              statusFilter === 'active'
                ? 'bg-kumo-base text-kumo-strong font-semibold shadow-xs'
                : 'text-kumo-subtle hover:text-kumo-strong'
            )}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={cn(
              'px-5 py-1.5 rounded-lg transition-all cursor-pointer select-none text-xs',
              statusFilter === 'inactive'
                ? 'bg-kumo-base text-kumo-strong font-semibold shadow-xs'
                : 'text-kumo-subtle hover:text-kumo-strong'
            )}
          >
            Inactive
          </button>
        </div>

        {/* Right: Search with ⌘1, Filter button, Sort by dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input with ⌘1 badge */}
          <div className="relative">
            <Search className="w-4 h-4 text-kumo-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="team-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="h-9 pl-9 pr-12 rounded-xl border border-kumo-line bg-kumo-base text-xs text-kumo-strong placeholder:text-kumo-subtle focus:outline-none focus:border-kumo-brand w-52 sm:w-60 transition-colors shadow-2xs"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-kumo-subtle hover:text-kumo-strong cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 font-sans text-[10px] text-kumo-subtle px-1.5 py-0.5 rounded border border-kumo-line bg-kumo-canvas select-none pointer-events-none">
                ⌘1
              </kbd>
            )}
          </div>

          {/* Filter Popover Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsFilterOpen(!isFilterOpen)
                setIsSortOpen(false)
              }}
              className={cn(
                'h-9 px-3 rounded-xl border bg-kumo-base hover:bg-kumo-tint text-xs text-kumo-strong font-medium flex items-center gap-2 transition-colors cursor-pointer shadow-2xs',
                selectedRoleFilter !== 'all' || selectedHubFilter !== 'all'
                  ? 'border-primary/50 text-primary bg-primary/5'
                  : 'border-kumo-line'
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-kumo-subtle" />
              <span>Filter</span>
              {(selectedRoleFilter !== 'all' || selectedHubFilter !== 'all') && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>

            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsFilterOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-60 rounded-2xl border border-kumo-line bg-kumo-base shadow-xl z-40 p-3 space-y-3 font-sans text-xs animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-1 border-b border-kumo-line">
                    <span className="font-semibold text-kumo-strong text-xs">Filter Team</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRoleFilter('all')
                        setSelectedHubFilter('all')
                      }}
                      className="text-[11px] text-primary hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>

                  {/* Filter by Role */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-kumo-subtle">Role Scope</label>
                    <select
                      value={selectedRoleFilter}
                      onChange={(e) => setSelectedRoleFilter(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-lg border border-kumo-line bg-kumo-canvas text-xs text-kumo-strong focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Roles</option>
                      {SYSTEM_ROLE_CONFIGS.map(r => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Operating Hub */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-kumo-subtle">Assigned Hub</label>
                    <select
                      value={selectedHubFilter}
                      onChange={(e) => setSelectedHubFilter(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-lg border border-kumo-line bg-kumo-canvas text-xs text-kumo-strong focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Operating Hubs</option>
                      <option value="Central Kitchen (Ikeja)">Central Kitchen (Ikeja)</option>
                      <option value="Yaba Head Office">Yaba Head Office</option>
                      <option value="Lekki Dispatch Staging">Lekki Dispatch Staging</option>
                      <option value="Main Storage Warehouse">Main Storage Warehouse</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sort by Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsSortOpen(!isSortOpen)
                setIsFilterOpen(false)
              }}
              className="h-9 px-3 rounded-xl border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-xs text-kumo-strong font-medium flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-kumo-subtle" />
              <span>Sort by</span>
              <ChevronDown className="w-3.5 h-3.5 text-kumo-subtle" />
            </button>

            {isSortOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsSortOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-kumo-line bg-kumo-base shadow-xl z-40 p-1 font-sans text-xs animate-in fade-in zoom-in-95 divide-y divide-kumo-line/60">
                  <div className="py-0.5">
                    {[
                      { key: 'name', label: 'Member Full Name' },
                      { key: 'email', label: 'Email Address' },
                      { key: 'activity', label: 'Last Activity' },
                      { key: 'role', label: 'Role' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          handleSort(opt.key as any)
                          setIsSortOpen(false)
                        }}
                        className={cn(
                          'w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors',
                          sortField === opt.key
                            ? 'bg-kumo-tint text-kumo-strong font-semibold'
                            : 'text-kumo-default hover:bg-kumo-tint'
                        )}
                      >
                        <span>{opt.label}</span>
                        {sortField === opt.key && (
                          <span className="text-[10px] text-primary">{sortAsc ? '↑' : '↓'}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. TABLE CARD (Exact layout from user screenshot)              */}
      {/* ------------------------------------------------------------- */}
      <div className="border border-kumo-line rounded-2xl bg-kumo-base overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Table Header: Checkbox | Member Full Name ⇅ | Email Address ⇅ | Last Activity ⇅ | Role ⇅ | ⋮ */}
            <div className="grid grid-cols-[44px_1.5fr_1.3fr_1.1fr_1.1fr_44px] items-center px-4 py-3 bg-kumo-canvas/50 border-b border-kumo-line text-[12px] font-semibold text-kumo-subtle select-none">
          {/* Checkbox Column */}
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isIndeterminate
              }}
              onChange={handleToggleSelectAll}
              className="rounded border-kumo-line/80 text-primary focus:ring-primary size-4 cursor-pointer"
              aria-label="Select all team members"
            />
          </div>

          {/* Member Full Name */}
          <button
            type="button"
            onClick={() => handleSort('name')}
            className="flex items-center gap-1.5 text-left hover:text-kumo-strong transition-colors cursor-pointer pl-1"
          >
            <span>Member Full Name</span>
            <ArrowUpDown className="w-3 h-3 opacity-60 shrink-0" />
          </button>

          {/* Email Address */}
          <button
            type="button"
            onClick={() => handleSort('email')}
            className="flex items-center gap-1.5 text-left hover:text-kumo-strong transition-colors cursor-pointer"
          >
            <span>Email Address</span>
            <ArrowUpDown className="w-3 h-3 opacity-60 shrink-0" />
          </button>

          {/* Last Activity */}
          <button
            type="button"
            onClick={() => handleSort('activity')}
            className="flex items-center gap-1.5 text-left hover:text-kumo-strong transition-colors cursor-pointer"
          >
            <span>Last Activity</span>
            <ArrowUpDown className="w-3 h-3 opacity-60 shrink-0" />
          </button>

          {/* Role */}
          <button
            type="button"
            onClick={() => handleSort('role')}
            className="flex items-center gap-1.5 text-left hover:text-kumo-strong transition-colors cursor-pointer"
          >
            <span>Role</span>
            <ArrowUpDown className="w-3 h-3 opacity-60 shrink-0" />
          </button>

          {/* Options spacer */}
          <div className="text-right">
            <span className="sr-only">Actions</span>
          </div>
        </div>

        {/* Table Body Rows */}
        <div className="divide-y divide-kumo-line/60">
          {filteredAccounts.length === 0 ? (
            <div className="p-16 text-center text-kumo-subtle space-y-3">
              <Users className="w-10 h-10 mx-auto opacity-30 text-kumo-subtle" />
              <p className="font-semibold text-sm text-kumo-strong">No team members found</p>
              <p className="text-xs">Try adjusting your filters or search keywords.</p>
            </div>
          ) : (
            filteredAccounts.map((acc) => {
              const isSelected = selectedEmails.includes(acc.email)
              const palette = avatarColors[acc.role] || avatarColors['admin']
              const lastActivity = getActivityTimestamp(acc)

              return (
                <div
                  key={acc.email}
                  className={cn(
                    'relative grid grid-cols-[44px_1.5fr_1.3fr_1.1fr_1.1fr_44px] items-center px-4 py-3.5 hover:bg-kumo-tint/40 transition-colors group select-none text-xs font-sans',
                    isSelected && 'bg-kumo-tint/30'
                  )}
                >
                  {/* Checkbox Column */}
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleRow(acc.email)}
                      className="rounded border-kumo-line/80 text-primary focus:ring-primary size-4 cursor-pointer"
                      aria-label={`Select ${acc.name}`}
                    />
                  </div>

                  {/* Member Full Name (Avatar image/badge + Name) */}
                  <div className="min-w-0 pr-2 pl-1 flex items-center gap-3">
                    {/* Illustrated avatar image with fallback */}
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none border border-kumo-line/80 shadow-2xs overflow-hidden',
                        palette.bg,
                        palette.text
                      )}
                    >
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(acc.name)}`}
                        alt={acc.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <span className="sr-only">{acc.name.charAt(0)}</span>
                    </div>

                    <div className="min-w-0">
                      <span className="font-semibold text-kumo-strong truncate text-xs block">
                        {acc.name}
                      </span>
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="min-w-0 pr-3">
                    <span className="text-kumo-subtle truncate text-xs font-normal block">
                      {acc.email}
                    </span>
                  </div>

                  {/* Last Activity */}
                  <div className="min-w-0 pr-3">
                    <span className="text-kumo-strong font-normal truncate text-xs block">
                      {lastActivity}
                    </span>
                  </div>

                  {/* Role (Pill badge with green dot ●, exact match to screenshot) */}
                  <div className="min-w-0 pr-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-kumo-line bg-kumo-base text-xs font-medium text-kumo-strong shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate">{acc.roleLabel}</span>
                    </span>
                  </div>

                  {/* Action More Vertical Ellipsis (⋮) matching screenshot */}
                  <div className="relative flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuEmail(openMenuEmail === acc.email ? null : acc.email)
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-kumo-fill text-kumo-subtle hover:text-kumo-strong transition-colors cursor-pointer"
                      aria-label={`Options for ${acc.name}`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Floating Context Popover */}
                    {openMenuEmail === acc.email && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuEmail(null)
                          }}
                        />
                        <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-kumo-line bg-kumo-base shadow-xl z-50 p-1 font-sans text-xs animate-in fade-in zoom-in-95 divide-y divide-kumo-line/60">
                          <div className="py-0.5">
                            <button
                              type="button"
                              onClick={() => startEditAccount(acc)}
                              className="w-full text-left px-3 py-1.5 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setAccountToChangeRole(acc)
                                setEditRole(acc.role)
                                setEditPermissions(acc.permissions || ROLE_DEFAULT_PERMISSIONS[acc.role] || [])
                                setOpenMenuEmail(null)
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
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
                              className="w-full text-left px-3 py-1.5 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
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
                              className="w-full text-left px-3 py-1.5 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
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
                                className="w-full text-left px-3 py-1.5 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
                                <span>Switch to Account</span>
                              </button>
                            )}
                          </div>

                          <div className="py-0.5">
                            <a
                              href="#activity"
                              onClick={(e) => {
                                e.preventDefault()
                                setOpenMenuEmail(null)
                                setInspectPermissionsAccount(acc)
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center justify-between cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <History className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
                                <span>View activity</span>
                              </div>
                              <ExternalLink className="w-3 h-3 text-kumo-subtle shrink-0" />
                            </a>
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
                                'w-full text-left px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors',
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
              )
            })
          )}
        </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. SUB-MODALS (Screenshot 2 adaptation & Subdialogs)           */}
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

            {/* Footer matching Screenshot 2: Cancel on left, Save on right */}
            <div className="flex items-center justify-between pt-3 border-t border-kumo-line">
              <button
                type="button"
                onClick={() => setAccountToEdit(null)}
                className="text-xs font-semibold text-kumo-strong hover:text-kumo-default px-3 py-2 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <Button variant="primary" size="md" type="submit" className="min-w-20">
                Save
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* B. ONBOARD NEW ACCOUNT MODAL */}
      <Dialog
        isOpen={isOnboardOpen}
        onClose={() => setIsOnboardOpen(false)}
        title="Onboard New Account"
        description="Add a new operator to the operations dashboard with designated operational role and permissions."
        maxWidth="md"
      >
        <form onSubmit={handleSaveOnboard} className="space-y-4 font-sans text-xs">
          {/* Role Dropdown */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-kumo-strong">
              Operational Role & Scope
            </label>
            <div className="relative">
              <select
                value={onboardForm.role}
                onChange={(e) => {
                  const r = e.target.value as UserRole
                  setOnboardForm((prev) => ({
                    ...prev,
                    role: r,
                    permissions: ROLE_DEFAULT_PERMISSIONS[r] || []
                  }))
                }}
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

          {/* Permissions preview in Onboarding */}
          <div className="p-3 bg-kumo-canvas/70 border border-kumo-line rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-kumo-strong">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Granted Permissions ({onboardForm.permissions.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setShowOnboardCustomPerms(!showOnboardCustomPerms)}
                className="text-[11px] text-primary hover:underline cursor-pointer"
              >
                {showOnboardCustomPerms ? 'Hide Details' : 'Customize Permissions'}
              </button>
            </div>

            {showOnboardCustomPerms ? (
              <div className="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto pt-1">
                {ALL_SYSTEM_PERMISSIONS.map((perm) => {
                  const isChecked = onboardForm.permissions.includes(perm.label)
                  return (
                    <label
                      key={perm.id}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-1 rounded border text-[11px] cursor-pointer',
                        isChecked ? 'bg-kumo-base border-primary/30 text-kumo-strong' : 'bg-kumo-canvas/50 border-kumo-line text-kumo-subtle'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setOnboardForm(prev => ({
                            ...prev,
                            permissions: isChecked
                              ? prev.permissions.filter(p => p !== perm.label)
                              : [...prev.permissions, perm.label]
                          }))
                        }}
                        className="rounded border-kumo-line text-primary focus:ring-primary size-3.5"
                      />
                      <span className="truncate">{perm.label}</span>
                    </label>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {onboardForm.permissions.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-kumo-base border border-kumo-line text-[10px] text-kumo-default"
                  >
                    <Check className="w-2.5 h-2.5 text-primary" />
                    <span>{p}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Full Name Input with Green Checkmark */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-kumo-strong">
              Operator Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={onboardForm.name}
                onChange={(e) => setOnboardForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Olayemi Babatunde"
                className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong focus:outline-none focus:border-kumo-brand transition-colors"
              />
              {onboardForm.name.trim().length > 2 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              )}
            </div>
          </div>

          {/* Email Address Input */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-kumo-strong">
              Sign-in Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={onboardForm.email}
                onChange={(e) => setOnboardForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="olayemi@smokeyhut.com"
                className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong focus:outline-none focus:border-kumo-brand transition-colors"
              />
              {onboardForm.email.includes('@') && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              )}
            </div>
          </div>

          {/* Assigned Facility Hub */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-kumo-strong">
              Operating Hub / Branch
            </label>
            <div className="relative">
              <select
                value={onboardForm.hub}
                onChange={(e) => setOnboardForm((prev) => ({ ...prev, hub: e.target.value }))}
                className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong focus:outline-none focus:border-kumo-brand appearance-none cursor-pointer"
              >
                <option value="Central Kitchen (Ikeja)">Central Kitchen (Ikeja)</option>
                <option value="Yaba Head Office">Yaba Head Office</option>
                <option value="Lekki Dispatch Staging">Lekki Dispatch Staging</option>
                <option value="Main Storage Warehouse">Main Storage Warehouse</option>
              </select>
              <ChevronsUpDown className="w-4 h-4 text-kumo-subtle absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Temporary Sign-in Password */}
          <div className="p-3 bg-kumo-canvas/70 border border-kumo-line rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-kumo-strong flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>Temporary Sign-in Password</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  setOnboardForm((prev) => ({
                    ...prev,
                    temporaryPassword: 'Smokey@' + Math.floor(1000 + Math.random() * 9000),
                  }))
                }
                className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerate</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={onboardForm.temporaryPassword}
                className="font-mono font-bold text-xs h-9 px-3 rounded-lg border border-kumo-line bg-kumo-base text-kumo-strong flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(onboardForm.temporaryPassword)
                  showToast('Temporary password copied to clipboard', 'info')
                }}
              >
                Copy
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-kumo-line">
            <button
              type="button"
              onClick={() => setIsOnboardOpen(false)}
              className="text-xs font-semibold text-kumo-strong hover:text-kumo-default px-3 py-2 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <Button variant="primary" size="md" type="submit">
              Onboard Operator
            </Button>
          </div>
        </form>
      </Dialog>

      {/* C. CHANGE PASSWORD MODAL */}
      <Dialog
        isOpen={Boolean(accountToChangePassword)}
        onClose={() => setAccountToChangePassword(null)}
        title={`Change Password: ${accountToChangePassword?.name || ''}`}
        description="Reset security credentials for this operator account."
        maxWidth="md"
      >
        {accountToChangePassword && (
          <form onSubmit={handleSavePassword} className="space-y-4 font-sans text-xs">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-semibold text-xs flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Super Admin Credential Reset</span>
              </p>
              <p className="text-[11px] opacity-90 leading-relaxed">
                Updating password for <strong>{accountToChangePassword.email}</strong>. The user will be required to update their password upon next sign-in.
              </p>
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-kumo-strong">
                  New Password
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setNewPasswordVal('Smokey@' + Math.floor(1000 + Math.random() * 9000))
                  }
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Generate Random</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full h-10 pl-3.5 pr-20 font-mono text-xs rounded-lg border border-kumo-line bg-kumo-base text-kumo-strong focus:outline-none focus:border-kumo-brand"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(newPasswordVal)
                    setCopiedPass(true)
                    setTimeout(() => setCopiedPass(false), 2000)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] bg-kumo-tint hover:bg-kumo-fill border border-kumo-line rounded text-kumo-default font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedPass ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPass ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="requirePassResetPage"
                checked={requirePassReset}
                onChange={(e) => setRequirePassReset(e.target.checked)}
                className="rounded border-kumo-line text-primary focus:ring-primary size-4 cursor-pointer"
              />
              <label htmlFor="requirePassResetPage" className="text-xs text-kumo-default cursor-pointer">
                Require password reset on next dashboard session
              </label>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-kumo-line">
              <button
                type="button"
                onClick={() => setAccountToChangePassword(null)}
                className="text-xs font-semibold text-kumo-strong hover:text-kumo-default px-3 py-2 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <Button variant="primary" size="md" type="submit">
                Update Password
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* D. QUICK CHANGE ROLE MODAL */}
      <Dialog
        isOpen={Boolean(accountToChangeRole)}
        onClose={() => setAccountToChangeRole(null)}
        title={`Change Role: ${accountToChangeRole?.name || ''}`}
        description="Select an operational role to adjust operator permission scope and capabilities."
        maxWidth="md"
      >
        {accountToChangeRole && (
          <div className="space-y-4 font-sans text-xs">
            <div className="space-y-2">
              {SYSTEM_ROLE_CONFIGS.map((r) => {
                const isSelected = editRole === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setEditRole(r.id)
                      setEditPermissions(ROLE_DEFAULT_PERMISSIONS[r.id] || [])
                    }}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3',
                      isSelected
                        ? 'border-primary ring-1 ring-primary bg-primary/5'
                        : 'border-kumo-line hover:bg-kumo-tint/60 bg-kumo-base'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0',
                        isSelected ? 'border-primary bg-primary text-white' : 'border-kumo-line'
                      )}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-kumo-strong">{r.label}</span>
                        <span
                          className={cn(
                            'px-1.5 py-0.2 text-[9px] font-bold rounded uppercase tracking-wider',
                            r.badgeClass
                          )}
                        >
                          {r.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-kumo-subtle leading-relaxed">
                        {r.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-kumo-line">
              <button
                type="button"
                onClick={() => setAccountToChangeRole(null)}
                className="text-xs font-semibold text-kumo-strong hover:text-kumo-default px-3 py-2 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <Button
                variant="primary"
                size="md"
                type="button"
                onClick={() => {
                  const roleConfig = SYSTEM_ROLE_CONFIGS.find((r) => r.id === editRole)
                  updateAccount(accountToChangeRole.email, {
                    role: editRole,
                    roleLabel: roleConfig ? roleConfig.label : editRole,
                    permissions: editPermissions,
                  })
                  setAccountToChangeRole(null)
                }}
              >
                Save Role & Permissions
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* E. INSPECT OPERATOR PERMISSIONS MODAL */}
      <Dialog
        isOpen={Boolean(inspectPermissionsAccount)}
        onClose={() => setInspectPermissionsAccount(null)}
        title={`Granted Permissions: ${inspectPermissionsAccount?.name || ''}`}
        description={`Active capability scopes assigned to ${inspectPermissionsAccount?.email || ''}`}
        maxWidth="md"
      >
        {inspectPermissionsAccount && (
          <div className="space-y-4 font-sans text-xs">
            <div className="p-3 bg-kumo-canvas/60 border border-kumo-line rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider border',
                  SYSTEM_ROLE_CONFIGS.find(r => r.id === inspectPermissionsAccount.role)?.badgeClass
                )}>
                  {inspectPermissionsAccount.roleLabel}
                </span>
                <span className="text-kumo-strong font-semibold">{inspectPermissionsAccount.name}</span>
              </div>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{(inspectPermissionsAccount.permissions || ROLE_DEFAULT_PERMISSIONS[inspectPermissionsAccount.role] || []).length} Granted</span>
              </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {(inspectPermissionsAccount.permissions || ROLE_DEFAULT_PERMISSIONS[inspectPermissionsAccount.role] || []).map((perm, idx) => {
                const sysPerm = ALL_SYSTEM_PERMISSIONS.find(p => p.label === perm)
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-kumo-line bg-kumo-base flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-kumo-strong">{perm}</span>
                        {sysPerm && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-kumo-canvas text-kumo-subtle border border-kumo-line">
                            {sysPerm.category}
                          </span>
                        )}
                      </div>
                      {sysPerm?.description && (
                        <p className="text-[11px] text-kumo-subtle mt-0.5 leading-relaxed">{sysPerm.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-kumo-line">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  const acc = inspectPermissionsAccount
                  setInspectPermissionsAccount(null)
                  startEditAccount(acc)
                }}
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Modify Permissions
              </Button>

              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={() => setInspectPermissionsAccount(null)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* F. DELETE / REMOVE CONFIRMATION MODAL */}
      <Dialog
        isOpen={Boolean(accountToDelete)}
        onClose={() => setAccountToDelete(null)}
        title="Remove Account"
        description="Permanently revoke dashboard access for this operator."
        maxWidth="md"
      >
        {accountToDelete && (
          <div className="space-y-4 font-sans text-xs">
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-900 dark:text-red-200">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-xs">
                  Are you sure you want to remove {accountToDelete.name}?
                </p>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  This action will permanently revoke login credentials and remove <strong>{accountToDelete.email}</strong> from all operational schedules, dispatch queues, and hub assignments.
                </p>
              </div>
            </div>

            <div className="p-3 bg-kumo-surface border border-kumo-line rounded-lg space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Role:</span>
                <span className="font-semibold text-kumo-strong">{accountToDelete.roleLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Assigned Hub:</span>
                <span className="font-semibold text-kumo-strong">{accountToDelete.assigned_hub || 'Central Kitchen'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-kumo-line">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="text-xs font-semibold text-kumo-strong hover:text-kumo-default px-3 py-2 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <Button
                variant="destructive"
                size="md"
                type="button"
                onClick={handleConfirmDelete}
              >
                Remove Account
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}

export default ManageAccountsPage
