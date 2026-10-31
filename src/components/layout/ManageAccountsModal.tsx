import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  Trash2,
  Key,
  Mail,
  ShieldCheck,
  Shield,
  ArrowUpDown,
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
  Building,
  AlertTriangle,
  UserCheck,
  SlidersHorizontal,
  Layers,
  FileText,
  ChevronRight,
  ChevronDown,
  Package,
  ChefHat,
  Truck,
  Boxes
} from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/button'
import { useSmokeyOps, AppUserAccount, UserRole, ROLE_DEFAULT_PERMISSIONS } from '@/context/SmokeyOpsContext'
import { useWarehouse } from '@/context/WarehouseContext'
import { cn } from '@/lib/utils'

export interface ManageAccountsModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenSignInActivity?: () => void
}

export interface RoleConfig {
  id: UserRole
  label: string
  description: string
  badgeClass: string
  permissions: string[]
}

export interface SystemPermissionItem {
  id: string
  label: string
  category: 'Administration' | 'Finance' | 'Production' | 'Inventory' | 'Logistics'
  description: string
}

export const ALL_SYSTEM_PERMISSIONS: SystemPermissionItem[] = [
  // Administration
  { id: 'perm_records', label: 'Full Database & Records Access', category: 'Administration', description: 'Access master database records and operational raw data tables.' },
  { id: 'perm_users', label: 'User Onboarding & Deletion', category: 'Administration', description: 'Create, update credentials, deactivate and delete dashboard operator accounts.' },
  { id: 'perm_rbac', label: 'Role & Permission Management', category: 'Administration', description: 'Assign roles, adjust privilege scopes, and configure custom security grants.' },
  
  // Finance
  { id: 'perm_finance', label: 'Finance & Payout Remittances', category: 'Finance', description: 'Process batch payouts, approve cash disbursements, and clear ledgers.' },
  { id: 'perm_invoices', label: 'Supplier Invoice Verification', category: 'Finance', description: 'Review purchase order billing, confirm line item unit costs, and approve credits.' },
  { id: 'perm_cod_checkin', label: 'COD Cash Remittance Check-in', category: 'Finance', description: 'Verify physical cash turned in by delivery riders at dispatch stations.' },
  { id: 'perm_cod_collect', label: 'COD Cash Collection', category: 'Finance', description: 'Collect physical cash payment at customer delivery destinations.' },
  { id: 'perm_wallet', label: 'Wallet & Payout History', category: 'Finance', description: 'Inspect individual courier earnings ledger, trip commissions, and deductions.' },

  // Production
  { id: 'perm_batches', label: 'Batch Scheduling & Cook Approvals', category: 'Production', description: 'Schedule smoking grill cooks, modify recipes, and sign off completed runs.' },
  { id: 'perm_cook', label: 'Start & Complete Batches', category: 'Production', description: 'Record real-time cook progress, internal food temps, and yield outputs.' },
  { id: 'perm_raw_deplete', label: 'Raw Materials Depletion', category: 'Production', description: 'Auto-deplete raw cuts of meat, seasoning packs, and marinades during runs.' },
  { id: 'perm_packout', label: 'Portion Pack-out Logging', category: 'Production', description: 'Log sealed units into vacuum pouches and carton cases for sales inventory.' },
  { id: 'perm_spoilage', label: 'Waste & Spoilage Incident Reports', category: 'Production', description: 'Submit and approve burned portions, expired cuts, or compromised batches.' },

  // Inventory
  { id: 'perm_intake', label: 'Stock Intake PO Receipts', category: 'Inventory', description: 'Receive vendor deliveries at loading dock and verify lot batch numbers.' },
  { id: 'perm_cycle_counts', label: 'Periodic Cycle Counts', category: 'Inventory', description: 'Perform physical warehouse stock reconciliations against system tallies.' },
  { id: 'perm_transfers', label: 'Packaging Unit Transfers', category: 'Inventory', description: 'Transfer foil trays, branded thermal bags, and boxes across kitchens and hubs.' },
  { id: 'perm_expiry', label: 'Lot Expiry Monitoring', category: 'Inventory', description: 'Track freshness dates, send urgent reorder notifications, and quarantine aging lots.' },
  { id: 'perm_thresholds', label: 'Inventory Threshold Overrides', category: 'Inventory', description: 'Adjust safety stock minimums and critical reorder threshold parameters.' },

  // Logistics & Dispatch
  { id: 'perm_dispatch_ctrl', label: 'Logistics Dispatch Controls', category: 'Logistics', description: 'Full control over courier allocation, rider assignment, and emergency re-routes.' },
  { id: 'perm_queue_assign', label: 'Dispatch Queue Assignment', category: 'Logistics', description: 'Assign ready cooked orders to available couriers waiting at the staging dock.' },
  { id: 'perm_tracking', label: 'Rider Location & Route Tracking', category: 'Logistics', description: 'Live tracking of delivery couriers, ETA monitoring, and route compliance.' },
  { id: 'perm_3pl', label: 'Third-party Courier Bookings', category: 'Logistics', description: 'Dispatch overflow delivery orders to Gozem, Gokada, or private fleets.' },
  { id: 'perm_delivery_transit', label: 'Accept & Transit Delivery', category: 'Logistics', description: 'Rider mobile view to accept assigned trips and initiate waypoint transit.' },
  { id: 'perm_otp_dropoff', label: 'Customer OTP Drop-off Sign-off', category: 'Logistics', description: 'Validate customer delivery OTP code before concluding drop-off handover.' },
  { id: 'perm_shifts', label: 'Staff Shift Assignments', category: 'Logistics', description: 'Manage rider shift rotas, check-in schedules, and coverage plans.' }
]

export const SYSTEM_ROLE_CONFIGS: RoleConfig[] = [
  {
    id: 'admin',
    label: 'Super Admin',
    description: 'Unrestricted master access across all operational hubs, financial controls, team RBAC, and system audits.',
    badgeClass: 'bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400',
    permissions: [
      'Full Database & Records Access',
      'User Onboarding & Deletion',
      'Role & Permission Management',
      'Finance & Payout Remittances',
      'Inventory Threshold Overrides',
      'Logistics Dispatch Controls'
    ]
  },
  {
    id: 'manager',
    label: 'Operations Manager',
    description: 'Supervises kitchen shifts, approves spoilage write-offs, modifies recipes, and reviews driver payouts.',
    badgeClass: 'bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-400',
    permissions: [
      'Batch Scheduling & Cook Approvals',
      'Variance Reconciliation',
      'Staff Shift Assignments',
      'Supplier Invoice Verification',
      'Waste & Spoilage Write-offs'
    ]
  },
  {
    id: 'kitchen',
    label: 'Production Cook',
    description: 'Executes daily smoking grill runs, batch packaging, ingredients intake, and yield tracking.',
    badgeClass: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400',
    permissions: [
      'Start & Complete Batches',
      'Raw Materials Depletion',
      'Portion Pack-out Logging',
      'Waste & Spoilage Incident Reports'
    ]
  },
  {
    id: 'inventory',
    label: 'Inventory Specialist',
    description: 'Manages physical warehouse stock counts, receiving supplier shipments, and tracking lot expirations.',
    badgeClass: 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400',
    permissions: [
      'Stock Intake PO Receipts',
      'Periodic Cycle Counts',
      'Packaging Unit Transfers',
      'Lot Expiry Monitoring'
    ]
  },
  {
    id: 'dispatcher',
    label: 'Logistics Coordinator',
    description: 'Coordinates dispatch queue, assigns orders to couriers, monitors SLA transit times, and verifies COD cash.',
    badgeClass: 'bg-teal-500/10 text-teal-700 border-teal-500/20 dark:text-teal-400',
    permissions: [
      'Dispatch Queue Assignment',
      'Rider Location & Route Tracking',
      'Third-party Courier Bookings',
      'COD Cash Remittance Check-in'
    ]
  },
  {
    id: 'rider',
    label: 'Delivery Rider',
    description: 'Driver portal view restricted to accepted dispatch orders, customer drop-off verification, and payout earnings.',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400',
    permissions: [
      'Accept & Transit Delivery',
      'Customer OTP Drop-off Sign-off',
      'COD Cash Collection',
      'Wallet & Payout History'
    ]
  }
]

export const ManageAccountsModal: React.FC<ManageAccountsModalProps> = ({
  isOpen,
  onClose,
  onOpenSignInActivity,
}) => {
  const navigate = useNavigate()
  const {
    currentAccount,
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

  // Screen View Tab: 'accounts' (table) | 'roles' (roles & permissions matrix)
  const [activeViewTab, setActiveViewTab] = useState<'accounts' | 'roles'>('accounts')

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<'name' | 'role' | 'hub' | 'permissions'>('name')
  const [sortAsc, setSortAsc] = useState(true)

  // Sub-modal states
  const [openMenuEmail, setOpenMenuEmail] = useState<string | null>(null)
  const [accountToEdit, setAccountToEdit] = useState<AppUserAccount | null>(null)
  const [accountToChangePassword, setAccountToChangePassword] = useState<AppUserAccount | null>(null)
  const [accountToDelete, setAccountToDelete] = useState<AppUserAccount | null>(null)
  const [isOnboardOpen, setIsOnboardOpen] = useState(false)
  const [isManageRolesOpen, setIsManageRolesOpen] = useState(false)

  // Edit Account Form State (Screenshot 2 adaptation + Granular Permissions)
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
    hub: facilities[0]?.name || 'Yaba Head Office',
    temporaryPassword: 'Smokey@' + Math.floor(1000 + Math.random() * 9000),
    permissions: ROLE_DEFAULT_PERMISSIONS['kitchen'] || []
  })
  const [showOnboardCustomPerms, setShowOnboardCustomPerms] = useState(false)

  // Change Password Form State
  const [newPasswordVal, setNewPasswordVal] = useState('')
  const [requirePassReset, setRequirePassReset] = useState(true)
  const [copiedPass, setCopiedPass] = useState(false)

  // Filtered and Sorted accounts
  const filteredAccounts = useMemo(() => {
    let result = availableAccounts.filter((acc) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        acc.name.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q) ||
        acc.roleLabel.toLowerCase().includes(q) ||
        acc.role.toLowerCase().includes(q) ||
        (acc.assigned_hub && acc.assigned_hub.toLowerCase().includes(q)) ||
        (acc.department && acc.department.toLowerCase().includes(q)) ||
        (acc.permissions && acc.permissions.some(p => p.toLowerCase().includes(q)))

      const matchesRole = roleFilter === 'all' || acc.role === roleFilter

      return matchesSearch && matchesRole
    })

    result.sort((a, b) => {
      let comparison = 0
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortField === 'role') {
        comparison = a.roleLabel.localeCompare(b.roleLabel)
      } else if (sortField === 'hub') {
        comparison = (a.assigned_hub || '').localeCompare(b.assigned_hub || '')
      } else if (sortField === 'permissions') {
        const aCount = a.permissions?.length || ROLE_DEFAULT_PERMISSIONS[a.role]?.length || 0
        const bCount = b.permissions?.length || ROLE_DEFAULT_PERMISSIONS[b.role]?.length || 0
        comparison = aCount - bCount
      }
      return sortAsc ? comparison : -comparison
    })

    return result
  }, [availableAccounts, searchQuery, roleFilter, sortField, sortAsc])

  const handleSort = (field: 'name' | 'role' | 'hub' | 'permissions') => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  // Open Edit Modal for an account (Screenshot 2 layout + permissions)
  const startEditAccount = (acc: AppUserAccount) => {
    setAccountToEdit(acc)
    setEditRole(acc.role)
    setEditName(acc.name)
    setEditEmail(acc.email)
    setEditHub(acc.assigned_hub || facilities[0]?.name || 'Yaba Head Office')
    setEditPermissions(acc.permissions || ROLE_DEFAULT_PERMISSIONS[acc.role] || [])
    setPermissionCategoryFilter('All')
    setOpenMenuEmail(null)
  }

  // When changing role inside Edit modal, update permissions to new role defaults
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
      hub: facilities[0]?.name || 'Yaba Head Office',
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

  return (
    <>
      {/* Main Manage Accounts Modal (Matching Screenshot 1 UI) */}
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title="Manage Accounts"
        description="Super Admin view · Active operators, registered credentials, and role-based permissions"
        maxWidth="5xl"
      >
        <div className="space-y-4 font-sans text-[13px]">
          {/* Top Tabs: Accounts List vs Roles & Permissions Matrix */}
          <div className="flex items-center justify-between border-b border-kumo-line pb-2.5">
            <div className="flex items-center gap-1.5 p-0.5 bg-kumo-canvas rounded-lg border border-kumo-line text-[13px]">
              <button
                type="button"
                onClick={() => setActiveViewTab('accounts')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer',
                  activeViewTab === 'accounts'
                    ? 'bg-kumo-base text-kumo-strong shadow-xs font-semibold'
                    : 'text-kumo-subtle hover:text-kumo-strong'
                )}
              >
                <UserCheck className="w-4 h-4 text-primary" />
                <span>Accounts ({availableAccounts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveViewTab('roles')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer',
                  activeViewTab === 'roles'
                    ? 'bg-kumo-base text-kumo-strong shadow-xs font-semibold'
                    : 'text-kumo-subtle hover:text-kumo-strong'
                )}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Roles & Permissions ({SYSTEM_ROLE_CONFIGS.length})</span>
              </button>
            </div>

            {/* Quick stats on the right */}
            <div className="hidden sm:flex items-center gap-3 text-[13px] text-kumo-subtle">
              <span>System Roles: <strong className="text-kumo-strong">6</strong></span>
              <span>•</span>
              <span>Granular Permissions: <strong className="text-kumo-strong">{ALL_SYSTEM_PERMISSIONS.length}</strong></span>
            </div>
          </div>

          {activeViewTab === 'accounts' ? (
            <>
              {/* Top Action Bar (Screenshot 1: Search Input on left, Add buttons on right) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Input with Magnifying Glass & Role Filter */}
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-kumo-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search accounts by name, email, role, hub, or permission..."
                      className="w-full h-10 pl-9 pr-3 rounded-lg border border-kumo-line bg-kumo-base text-[14px] text-kumo-strong placeholder:text-kumo-subtle focus:outline-none focus:border-kumo-brand transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-kumo-subtle hover:text-kumo-strong cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Role filter dropdown */}
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="h-10 px-3 rounded-lg border border-kumo-line bg-kumo-base text-[13px] text-kumo-strong focus:outline-none focus:border-kumo-brand shrink-0 cursor-pointer"
                  >
                    <option value="all">All Roles</option>
                    {SYSTEM_ROLE_CONFIGS.map((r) => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons: + Manage Roles (Outline) and + Onboard Account (Primary) */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="md"
                    type="button"
                    onClick={() => setIsManageRolesOpen(true)}
                    leftIcon={<Shield className="w-4 h-4 text-primary" />}
                    className="h-10 text-[13px]"
                  >
                    Manage Roles
                  </Button>
                  {currentAccount.role === 'admin' && (
                    <Button
                      variant="primary"
                      size="md"
                      type="button"
                      onClick={() => {
                        setOnboardForm((prev) => ({
                          ...prev,
                          temporaryPassword: 'Smokey@' + Math.floor(1000 + Math.random() * 9000),
                          permissions: ROLE_DEFAULT_PERMISSIONS['kitchen'] || []
                        }))
                        setIsOnboardOpen(true)
                      }}
                      leftIcon={<Plus className="w-4 h-4" />}
                      className="h-10 text-[13px]"
                    >
                      Onboard Account
                    </Button>
                  )}
                </div>
              </div>

              {/* Table Container Card (Matching Screenshot 1 + Role & Permissions Column) */}
              <div className="border border-kumo-line rounded-xl bg-kumo-base overflow-hidden shadow-2xs">
                {/* Table Header with Sort chevrons */}
                <div className="grid grid-cols-[1.3fr_0.9fr_1.3fr_1.1fr_40px] px-4 py-2.5 bg-kumo-canvas/60 border-b border-kumo-line text-[13px] font-semibold text-kumo-subtle select-none">
                  <button
                    type="button"
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1.5 text-left hover:text-kumo-strong transition-colors cursor-pointer"
                  >
                    <span>Name</span>
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSort('role')}
                    className="flex items-center gap-1.5 text-left hover:text-kumo-strong transition-colors cursor-pointer"
                  >
                    <span>Role</span>
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSort('permissions')}
                    className="flex items-center gap-1.5 text-left hover:text-kumo-strong transition-colors cursor-pointer"
                  >
                    <span>Permissions</span>
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSort('hub')}
                    className="flex items-center gap-1.5 text-left hover:text-kumo-strong transition-colors cursor-pointer"
                  >
                    <span>Zone & Activity</span>
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <div className="text-right">
                    <span className="sr-only">Actions</span>
                  </div>
                </div>

                {/* Table Rows (Screenshot 1 Row items with ... menu) */}
                <div className="divide-y divide-kumo-line/60 max-h-[400px] overflow-y-auto">
                  {filteredAccounts.length === 0 ? (
                    <div className="p-8 text-center text-kumo-subtle space-y-2">
                      <UserCheck className="w-8 h-8 mx-auto opacity-30" />
                      <p className="font-semibold text-[13px] text-kumo-strong">No accounts match your search</p>
                      <p className="text-[13px]">Try adjusting your search criteria or onboard a new account.</p>
                    </div>
                  ) : (
                    filteredAccounts.map((acc, index) => {
                      const isCurrent = acc.email.toLowerCase() === activeAccountEmail.toLowerCase()
                      const isSuperAdmin = acc.role === 'admin'
                      const roleConfig = SYSTEM_ROLE_CONFIGS.find((r) => r.id === acc.role)
                      const effectivePermissions = acc.permissions || ROLE_DEFAULT_PERMISSIONS[acc.role] || []
                      const isNearBottom = filteredAccounts.length > 2 && index >= filteredAccounts.length - 2

                      return (
                        <div
                          key={acc.email}
                          className={cn(
                            'relative grid grid-cols-[1.3fr_0.9fr_1.3fr_1.1fr_40px] items-center px-4 py-3 hover:bg-kumo-tint/50 transition-colors group select-none text-[13px] font-sans',
                            isCurrent && 'bg-kumo-tint/30'
                          )}
                        >
                          {/* Name Column */}
                          <div 
                            onClick={() => {
                              onClose()
                              navigate(`/accounts/profile/${encodeURIComponent(acc.email)}`)
                            }}
                            className="min-w-0 pr-2 flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity"
                            title="Click to view & edit staff KYC profile"
                          >
                            <div
                              className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[13px] shrink-0 select-none border',
                                isSuperAdmin
                                  ? 'bg-red-500/10 text-primary border-red-500/20'
                                  : 'bg-kumo-canvas text-kumo-strong border-kumo-line'
                              )}
                            >
                              {acc.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-kumo-strong truncate text-[14px] group-hover:underline underline-offset-2">{acc.name}</span>
                                {isCurrent && (
                                  <span className="px-1.5 py-0.2 text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-kumo-subtle text-[13px] truncate mt-0.5">{acc.email}</p>
                            </div>
                          </div>

                          {/* Role Column */}
                          <div className="min-w-0 pr-2">
                            <button
                              type="button"
                              onClick={() => {
                                onClose()
                                navigate(`/accounts/route/${encodeURIComponent(acc.email)}`)
                              }}
                              className="text-left cursor-pointer hover:opacity-80 transition-opacity"
                              title="Click to manage role and permissions"
                            >
                              <span
                                className={cn(
                                  'inline-block px-2.5 py-1 text-[13px] font-medium rounded-md border truncate max-w-full',
                                  roleConfig?.badgeClass || 'bg-kumo-canvas text-kumo-default border-kumo-line'
                                )}
                              >
                                {acc.roleLabel}
                              </span>
                            </button>
                          </div>

                          {/* Permissions Column (Interactive Scope Badges) */}
                          <div className="min-w-0 pr-2">
                            <button
                              type="button"
                              onClick={() => {
                                onClose()
                                navigate(`/accounts/route/${encodeURIComponent(acc.email)}`)
                              }}
                              className="text-left group/perms flex items-center gap-1.5 cursor-pointer max-w-full"
                              title="Click to view and configure granted permissions on Role & Permission page"
                            >
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 text-[12px] font-semibold rounded bg-kumo-canvas border border-kumo-line text-kumo-strong group-hover/perms:border-primary/40 group-hover/perms:text-primary transition-colors shrink-0">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>{effectivePermissions.length} Scopes</span>
                              </span>

                              <span className="text-[12px] text-kumo-subtle truncate hidden md:inline">
                                {effectivePermissions.slice(0, 2).join(', ')}
                                {effectivePermissions.length > 2 && ` +${effectivePermissions.length - 2} more`}
                              </span>
                            </button>
                          </div>

                          {/* Zone & Activity Column */}
                          <div className="min-w-0 pr-2">
                            <p className="text-kumo-strong font-medium truncate text-[13px]">
                              {acc.assigned_hub || facilities[0]?.name || 'Yaba Head Office'}
                            </p>
                            <p className="text-kumo-subtle text-[12px] truncate mt-0.5">
                              {acc.last_active || 'Recent session'}
                            </p>
                          </div>

                          {/* Action More Button `...` with Context Popover */}
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
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {/* Floating Context Menu (Matching Screenshot 1 popover) */}
                            {openMenuEmail === acc.email && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setOpenMenuEmail(null)
                                  }}
                                />
                                <div
                                  className={cn(
                                    'absolute right-0 w-56 rounded-xl border border-kumo-line bg-kumo-base shadow-xl z-50 p-1.5 font-sans text-[13px] animate-in fade-in zoom-in-95 divide-y divide-kumo-line/60 bg-white dark:bg-zinc-900 select-none',
                                    isNearBottom
                                      ? 'bottom-full mb-1.5 origin-bottom-right'
                                      : 'top-full mt-1.5 origin-top-right'
                                  )}
                                >
                                  <div className="py-0.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuEmail(null)
                                        onClose()
                                        navigate(`/accounts/profile/${encodeURIComponent(acc.email)}`)
                                      }}
                                      className="w-full text-left px-3 py-2 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <UserCheck className="w-4 h-4 text-kumo-subtle shrink-0" />
                                      <span>Edit Profile & KYC</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuEmail(null)
                                        onClose()
                                        navigate(`/accounts/route/${encodeURIComponent(acc.email)}`)
                                      }}
                                      className="w-full text-left px-3 py-2 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <Shield className="w-4 h-4 text-kumo-subtle shrink-0" />
                                      <span>Change Role & Permissions</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuEmail(null)
                                        onClose()
                                        navigate(`/accounts/matrix`)
                                      }}
                                      className="w-full text-left px-3 py-2 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <SlidersHorizontal className="w-4 h-4 text-kumo-subtle shrink-0" />
                                      <span>View Policy & Access</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAccountToChangePassword(acc)
                                        setNewPasswordVal(`Smk@${Math.floor(1000 + Math.random() * 9000)}!`)
                                        setOpenMenuEmail(null)
                                      }}
                                      className="w-full text-left px-3 py-2 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <Key className="w-4 h-4 text-kumo-subtle shrink-0" />
                                      <span>Change Password</span>
                                    </button>

                                    {!isCurrent && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          switchAccount(acc.email)
                                          setOpenMenuEmail(null)
                                        }}
                                        className="w-full text-left px-3 py-2 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
                                      >
                                        <UserCheck className="w-4 h-4 text-kumo-subtle shrink-0" />
                                        <span>Switch to Account</span>
                                      </button>
                                    )}
                                  </div>

                                  <div className="py-0.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuEmail(null)
                                        if (onOpenSignInActivity) {
                                          onClose()
                                          onOpenSignInActivity()
                                        }
                                      }}
                                      className="w-full text-left px-3 py-2 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center justify-between cursor-pointer transition-colors"
                                    >
                                      <div className="flex items-center gap-2">
                                        <History className="w-4 h-4 text-kumo-subtle shrink-0" />
                                        <span>View activity</span>
                                      </div>
                                      <ExternalLink className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
                                    </button>
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
                                        'w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors',
                                        availableAccounts.length <= 1
                                          ? 'opacity-40 cursor-not-allowed text-kumo-subtle'
                                          : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer'
                                      )}
                                    >
                                      <Trash2 className="w-4 h-4 shrink-0" />
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
            </>
          ) : (
            /* Roles & Permissions Matrix View */
            <div className="space-y-3">
              <div className="p-3.5 bg-kumo-canvas/60 border border-kumo-line rounded-xl flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-kumo-strong">Role-Based Access Control (RBAC) Policy & Access</span>
                </div>
                <span className="text-kumo-subtle text-[13px]">
                  All permissions are dynamically enforced across API and navigation routes
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {SYSTEM_ROLE_CONFIGS.map((r) => {
                  const members = availableAccounts.filter((a) => a.role === r.id)
                  return (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl border border-kumo-line bg-kumo-base hover:border-kumo-line/80 transition-shadow space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={cn('px-2.5 py-0.5 text-[13px] font-bold rounded-md border', r.badgeClass)}>
                            {r.label}
                          </span>
                          <span className="text-[12px] font-medium text-kumo-subtle bg-kumo-canvas px-2.5 py-0.5 rounded-full border border-kumo-line">
                            {members.length} {members.length === 1 ? 'operator' : 'operators'}
                          </span>
                        </div>

                        <p className="text-[13px] text-kumo-subtle leading-relaxed">
                          {r.description}
                        </p>

                        <div className="pt-1 space-y-1">
                          <span className="text-[12px] font-bold uppercase tracking-wider text-kumo-subtle block">
                            Assigned Privileges ({r.permissions.length}):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {r.permissions.map((p) => (
                              <span
                                key={p}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-kumo-canvas border border-kumo-line text-[12px] text-kumo-default"
                              >
                                <Check className="w-3 h-3 text-primary shrink-0" />
                                <span className="truncate max-w-[180px]">{p}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-kumo-line/60 flex items-center justify-between text-[13px]">
                        <div className="flex items-center -space-x-1.5 overflow-hidden">
                          {members.slice(0, 3).map((m) => (
                            <div
                              key={m.email}
                              className="w-6 h-6 rounded-full bg-primary/10 border border-kumo-base text-[10px] font-bold flex items-center justify-center text-primary"
                              title={`${m.name} (${m.email})`}
                            >
                              {m.name.charAt(0)}
                            </div>
                          ))}
                          {members.length > 3 && (
                            <span className="text-[12px] text-kumo-subtle pl-2">+{members.length - 3}</span>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => {
                            setRoleFilter(r.id)
                            setActiveViewTab('accounts')
                          }}
                        >
                          Filter Accounts
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-kumo-line text-[13px]">
            <span className="text-kumo-subtle">
              Total: <strong className="text-kumo-strong">{availableAccounts.length}</strong> operator accounts across <strong className="text-kumo-strong">{SYSTEM_ROLE_CONFIGS.length}</strong> system roles
            </span>

            <Button variant="outline" size="md" type="button" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* 2. EDIT ACCOUNT MODAL (Exact Adaptation of Screenshot 2 UI)    */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        isOpen={Boolean(accountToEdit)}
        onClose={() => setAccountToEdit(null)}
        title="Edit route & permissions"
        description="Modify operator access credentials, role designation, and assigned permissions."
        maxWidth="lg"
      >
        {accountToEdit && (
          <form onSubmit={handleSaveEdit} className="space-y-3.5 font-sans">
            {/* Field 1: Role / Zone Select Dropdown (Matching Screenshot 2) */}
            <div className="space-y-1 text-left">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold text-kumo-strong">
                  Zone / Role
                </label>
                <span className="text-[13px] text-kumo-subtle">
                  Role: <strong className="text-kumo-strong">{SYSTEM_ROLE_CONFIGS.find(r => r.id === editRole)?.label}</strong>
                </span>
              </div>
              <div className="relative">
                <select
                  value={editRole}
                  onChange={(e) => handleEditRoleChange(e.target.value as UserRole)}
                  className="w-full h-10 pl-3 pr-10 rounded-lg border border-kumo-line bg-kumo-base text-[13px] text-kumo-strong focus:outline-none focus:border-kumo-brand appearance-none cursor-pointer font-sans"
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
            <div className="p-3 bg-kumo-canvas/60 border border-kumo-line rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[16px] font-semibold text-kumo-strong">
                    Role Permissions ({editPermissions.length} Active)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditPermissions(ROLE_DEFAULT_PERMISSIONS[editRole] || [])}
                    className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                  <span className="text-kumo-subtle">•</span>
                  <button
                    type="button"
                    onClick={() => setEditPermissions(ALL_SYSTEM_PERMISSIONS.map(p => p.label))}
                    className="text-[11px] text-kumo-default hover:text-kumo-strong font-medium cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-kumo-subtle">•</span>
                  <button
                    type="button"
                    onClick={() => setEditPermissions([])}
                    className="text-[11px] text-kumo-subtle hover:text-red-500 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Permission Category Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
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
                          className="mt-0.5 rounded border-kumo-line text-primary focus:ring-primary size-4 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium leading-tight truncate">{perm.label}</p>
                          <p className="text-[11px] text-kumo-subtle leading-tight line-clamp-1 mt-0.5">{perm.description}</p>
                        </div>
                      </label>
                    )
                  })}
              </div>
            </div>

            {/* Field 2: Route / Name Input with Green Validation Checkmark (Screenshot 2 exact match) */}
            <div className="space-y-1 text-left">
              <label className="text-[12px] font-semibold text-kumo-strong">
                Route / Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Ayodine Admin"
                  className="w-full h-10 pl-3 pr-10 rounded-lg border border-kumo-line bg-kumo-base text-[14px] text-kumo-strong focus:outline-none focus:border-kumo-brand transition-colors font-sans"
                />
                {/* Green validation checkmark inside right edge (Screenshot 2) */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
                </div>
              </div>
              <p className="text-[13px] text-kumo-subtle leading-relaxed mt-0.5">
                Use an asterisk (*) character to create dynamic patterns that match multiple operations.
              </p>
            </div>

            {/* Field 3: Email Input with Validation Checkmark */}
            <div className="space-y-1 text-left">
              <label className="text-[12px] font-semibold text-kumo-strong">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="operator@smokeyhut.com"
                  className="w-full h-10 pl-3 pr-10 rounded-lg border border-kumo-line bg-kumo-base text-[14px] text-kumo-strong focus:outline-none focus:border-kumo-brand transition-colors font-sans"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
                </div>
              </div>
            </div>

            {/* Field 4: Assigned Facility Hub */}
            <div className="space-y-1 text-left">
              <label className="text-[12px] font-semibold text-kumo-strong">
                Assigned Operating Hub
              </label>
              <div className="relative">
                <select
                  value={editHub}
                  onChange={(e) => setEditHub(e.target.value)}
                  className="w-full h-10 pl-3 pr-10 rounded-lg border border-kumo-line bg-kumo-base text-[13px] text-kumo-strong focus:outline-none focus:border-kumo-brand appearance-none cursor-pointer font-sans"
                >
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
                className="text-[13px] font-semibold text-kumo-strong hover:text-kumo-default px-3 py-2 cursor-pointer transition-colors"
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

      {/* ------------------------------------------------------------- */}
      {/* 3. ONBOARD NEW ACCOUNT MODAL (Role + Permissions)              */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        isOpen={isOnboardOpen}
        onClose={() => setIsOnboardOpen(false)}
        title="Onboard New Account"
        description="Add a new operator to the operations dashboard with designated operational role and permissions."
        maxWidth="md"
      >
        <form onSubmit={handleSaveOnboard} className="space-y-4 font-sans">
          {/* Role Dropdown */}
          <div className="space-y-1.5 text-left">
            <label className="text-[12px] font-semibold text-kumo-strong">
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
                className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-kumo-line bg-kumo-base text-[13px] text-kumo-strong focus:outline-none focus:border-kumo-brand appearance-none cursor-pointer font-sans"
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

          {/* Permissions Accordion in Onboarding */}
          <div className="p-3.5 bg-kumo-canvas/70 border border-kumo-line rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-kumo-strong">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[16px] font-semibold text-kumo-strong">Granted Permissions ({onboardForm.permissions.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setShowOnboardCustomPerms(!showOnboardCustomPerms)}
                className="text-[12px] text-primary hover:underline cursor-pointer font-medium"
              >
                {showOnboardCustomPerms ? 'Hide Details' : 'Customize Permissions'}
              </button>
            </div>

            {showOnboardCustomPerms ? (
              <div className="grid grid-cols-1 gap-1 max-h-[140px] overflow-y-auto pt-1">
                {ALL_SYSTEM_PERMISSIONS.map((perm) => {
                  const isChecked = onboardForm.permissions.includes(perm.label)
                  return (
                    <label
                      key={perm.id}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[12px] cursor-pointer transition-colors',
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
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-kumo-base border border-kumo-line text-[11px] text-kumo-default font-medium"
                  >
                    <Check className="w-3 h-3 text-primary" />
                    <span>{p}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Full Name Input with Green Checkmark */}
          <div className="space-y-1.5 text-left">
            <label className="text-[12px] font-semibold text-kumo-strong">
              Operator Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={onboardForm.name}
                onChange={(e) => setOnboardForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Olayemi Babatunde"
                className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-kumo-line bg-kumo-base text-[14px] text-kumo-strong focus:outline-none focus:border-kumo-brand transition-colors font-sans"
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
            <label className="text-[12px] font-semibold text-kumo-strong">
              Sign-in Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={onboardForm.email}
                onChange={(e) => setOnboardForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="olayemi@smokeyhut.com"
                className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-kumo-line bg-kumo-base text-[14px] text-kumo-strong focus:outline-none focus:border-kumo-brand transition-colors font-sans"
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
            <label className="text-[12px] font-semibold text-kumo-strong">
              Operating Hub / Branch
            </label>
            <div className="relative">
              <select
                value={onboardForm.hub}
                onChange={(e) => setOnboardForm((prev) => ({ ...prev, hub: e.target.value }))}
                className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-kumo-line bg-kumo-base text-[13px] text-kumo-strong focus:outline-none focus:border-kumo-brand appearance-none cursor-pointer font-sans"
              >
                {facilities?.map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
              <ChevronsUpDown className="w-4 h-4 text-kumo-subtle absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Temporary Sign-in Password */}
          <div className="p-3.5 bg-kumo-canvas/70 border border-kumo-line rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-semibold text-kumo-strong flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-500" />
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
                className="text-[12px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
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
                className="font-sans font-bold text-[14px] h-10 px-3.5 rounded-lg border border-kumo-line bg-kumo-base text-kumo-strong flex-1"
              />
              <Button
                variant="outline"
                size="md"
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
              className="text-[13px] font-semibold text-kumo-strong hover:text-kumo-default px-3 py-2 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <Button variant="primary" size="md" type="submit">
              Onboard Operator
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* 4. CHANGE PASSWORD MODAL                                      */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        isOpen={Boolean(accountToChangePassword)}
        onClose={() => setAccountToChangePassword(null)}
        title={`Change Password: ${accountToChangePassword?.name || ''}`}
        description="Reset security credentials for this operator account."
        maxWidth="md"
      >
        {accountToChangePassword && (
          <form onSubmit={handleSavePassword} className="space-y-4 font-sans">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-semibold text-[16px] flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                <span>Super Admin Credential Reset</span>
              </p>
              <p className="text-[13px] opacity-90 leading-relaxed">
                Updating password for <strong>{accountToChangePassword.email}</strong>. The user will be required to update their password upon next sign-in.
              </p>
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold text-kumo-strong">
                  New Password
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setNewPasswordVal('Smokey@' + Math.floor(1000 + Math.random() * 9000))
                  }
                  className="text-[12px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
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
                  className="w-full h-10 pl-3.5 pr-20 font-sans text-[14px] rounded-lg border border-kumo-line bg-kumo-base text-kumo-strong focus:outline-none focus:border-kumo-brand"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(newPasswordVal)
                    setCopiedPass(true)
                    setTimeout(() => setCopiedPass(false), 2000)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[12px] bg-kumo-tint hover:bg-kumo-fill border border-kumo-line rounded text-kumo-default font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPass ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="requirePassReset"
                checked={requirePassReset}
                onChange={(e) => setRequirePassReset(e.target.checked)}
                className="rounded border-kumo-line text-primary focus:ring-primary size-3.5 cursor-pointer"
              />
              <label htmlFor="requirePassReset" className="text-[13px] text-kumo-default cursor-pointer">
                Require password reset on next dashboard session
              </label>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-kumo-line">
              <button
                type="button"
                onClick={() => setAccountToChangePassword(null)}
                className="text-[13px] font-semibold text-kumo-strong hover:text-kumo-default px-3 py-2 cursor-pointer transition-colors"
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



      {/* ------------------------------------------------------------- */}
      {/* 7. MANAGE ROLES DIRECTORY MODAL                               */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        isOpen={isManageRolesOpen}
        onClose={() => setIsManageRolesOpen(false)}
        title="Manage System Roles & Permissions"
        description="Role-Based Access Control (RBAC) definitions and operational capability scopes."
        maxWidth="2xl"
      >
        <div className="space-y-4 font-sans">
          <div className="divide-y divide-kumo-line/80 border border-kumo-line rounded-xl bg-kumo-base overflow-hidden">
            {SYSTEM_ROLE_CONFIGS.map((r) => {
              const members = availableAccounts.filter((a) => a.role === r.id)
              return (
                <div key={r.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[16px] text-kumo-strong">{r.label}</span>
                      <span
                        className={cn(
                          'px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider border',
                          r.badgeClass
                        )}
                      >
                        {r.id}
                      </span>
                    </div>
                    <span className="text-[12px] font-medium text-kumo-subtle bg-kumo-canvas px-2.5 py-0.5 rounded-full border border-kumo-line">
                      {members.length} {members.length === 1 ? 'member' : 'members'} assigned
                    </span>
                  </div>

                  <p className="text-[13px] text-kumo-subtle leading-relaxed">{r.description}</p>

                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {r.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-kumo-tint border border-kumo-line text-[11px] text-kumo-default font-medium"
                      >
                        <Check className="w-2.5 h-2.5 text-primary" />
                        <span>{perm}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end pt-2 border-t border-kumo-line">
            <Button variant="outline" size="md" type="button" onClick={() => setIsManageRolesOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* 8. DELETE / REMOVE CONFIRMATION MODAL                         */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        isOpen={Boolean(accountToDelete)}
        onClose={() => setAccountToDelete(null)}
        title="Remove Account"
        description="Permanently revoke dashboard access for this operator."
        maxWidth="md"
      >
        {accountToDelete && (
          <div className="space-y-4 font-sans">
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-red-900 dark:text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-[16px]">
                  Are you sure you want to remove {accountToDelete.name}?
                </p>
                <p className="text-[13px] opacity-90 leading-relaxed">
                  This action will permanently revoke login credentials and remove <strong>{accountToDelete.email}</strong> from all operational schedules, dispatch queues, and hub assignments.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-kumo-surface border border-kumo-line rounded-lg space-y-1.5 text-[13px]">
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Role:</span>
                <span className="font-semibold text-kumo-strong">{accountToDelete.roleLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Permissions:</span>
                <span className="font-semibold text-kumo-strong">
                  {(accountToDelete.permissions || ROLE_DEFAULT_PERMISSIONS[accountToDelete.role] || []).length} Granted Scopes
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-kumo-subtle">Assigned Hub:</span>
                <span className="font-semibold text-kumo-strong">{accountToDelete.assigned_hub || facilities[0]?.name || 'Yaba Head Office'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-kumo-line">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="text-[13px] font-semibold text-kumo-strong hover:text-kumo-default px-3 py-2 cursor-pointer transition-colors"
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
    </>
  )
}

export default ManageAccountsModal
