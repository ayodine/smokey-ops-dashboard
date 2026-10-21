import React, { useState, useMemo } from 'react'
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
  UserCheck
} from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/button'
import { useSmokeyOps, AppUserAccount, UserRole } from '@/context/SmokeyOpsContext'
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

export const SYSTEM_ROLE_CONFIGS: RoleConfig[] = [
  {
    id: 'admin',
    label: 'Super Admin',
    description: 'Unrestricted master access across all operational hubs, financial controls, team RBAC, and system audits.',
    badgeClass: 'bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400',
    permissions: [
      'Full Database & Records Access',
      'User Onboarding & Deletion',
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
      'Supplier Invoice Verification'
    ]
  },
  {
    id: 'kitchen',
    label: 'Production Cook',
    description: 'Executes daily smoking pit runs, batch packaging, ingredients intake, and yield tracking.',
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
  const {
    availableAccounts,
    activeAccountEmail,
    currentAccount,
    switchAccount,
    createAccount,
    updateAccount,
    deleteAccount,
    changePassword,
    showToast,
  } = useSmokeyOps()

  const { facilities } = useWarehouse()

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<'name' | 'role' | 'hub'>('name')
  const [sortAsc, setSortAsc] = useState(true)

  // Sub-modal states
  const [openMenuEmail, setOpenMenuEmail] = useState<string | null>(null)
  const [accountToEdit, setAccountToEdit] = useState<AppUserAccount | null>(null)
  const [accountToChangePassword, setAccountToChangePassword] = useState<AppUserAccount | null>(null)
  const [accountToDelete, setAccountToDelete] = useState<AppUserAccount | null>(null)
  const [accountToChangeRole, setAccountToChangeRole] = useState<AppUserAccount | null>(null)
  const [isOnboardOpen, setIsOnboardOpen] = useState(false)
  const [isManageRolesOpen, setIsManageRolesOpen] = useState(false)

  // Edit Account Form State (Screenshot 2 adaptation)
  const [editRole, setEditRole] = useState<UserRole>('kitchen')
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editHub, setEditHub] = useState('')

  // Onboard Account Form State
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    email: '',
    role: 'kitchen' as UserRole,
    hub: 'Central Kitchen (Ikeja)',
    temporaryPassword: 'Smokey@' + Math.floor(1000 + Math.random() * 9000),
  })

  // Change Password Form State
  const [newPasswordVal, setNewPasswordVal] = useState('')
  const [requirePassReset, setRequirePassReset] = useState(true)
  const [copiedPass, setCopiedPass] = useState(false)

  // Filtered and Sorted accounts
  const filteredAccounts = useMemo(() => {
    let result = availableAccounts.filter((acc) => {
      const q = searchQuery.toLowerCase().trim()
      if (!q) return true
      return (
        acc.name.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q) ||
        acc.roleLabel.toLowerCase().includes(q) ||
        acc.role.toLowerCase().includes(q) ||
        (acc.assigned_hub && acc.assigned_hub.toLowerCase().includes(q)) ||
        (acc.department && acc.department.toLowerCase().includes(q))
      )
    })

    result.sort((a, b) => {
      let comparison = 0
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortField === 'role') {
        comparison = a.roleLabel.localeCompare(b.roleLabel)
      } else if (sortField === 'hub') {
        comparison = (a.assigned_hub || '').localeCompare(b.assigned_hub || '')
      }
      return sortAsc ? comparison : -comparison
    })

    return result
  }, [availableAccounts, searchQuery, sortField, sortAsc])

  const handleSort = (field: 'name' | 'role' | 'hub') => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  // Open Edit Modal for an account (Screenshot 2 layout)
  const startEditAccount = (acc: AppUserAccount) => {
    setAccountToEdit(acc)
    setEditRole(acc.role)
    setEditName(acc.name)
    setEditEmail(acc.email)
    setEditHub(acc.assigned_hub || 'Central Kitchen (Ikeja)')
    setOpenMenuEmail(null)
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

    const newAcc: AppUserAccount = {
      email: onboardForm.email.trim(),
      name: onboardForm.name.trim(),
      role: onboardForm.role,
      roleLabel,
      assigned_hub: onboardForm.hub,
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
        description="Super Admin view · Active operators, registered credentials, and dashboard permissions"
        maxWidth="4xl"
      >
        <div className="space-y-4 font-sans text-xs">
          {/* Top Action Bar (Screenshot 1: Search Input on left, Add buttons on right) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input with Magnifying Glass */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-kumo-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search accounts by name, email, role or hub..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong placeholder:text-kumo-subtle focus:outline-none focus:border-kumo-brand transition-colors"
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

            {/* Action Buttons: + Manage Roles (Outline) and + Onboard Account (Primary) */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsManageRolesOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="h-9 text-xs"
              >
                Manage Roles
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={() => {
                  setOnboardForm((prev) => ({
                    ...prev,
                    temporaryPassword: 'Smokey@' + Math.floor(1000 + Math.random() * 9000),
                  }))
                  setIsOnboardOpen(true)
                }}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="h-9 text-xs"
              >
                Onboard Account
              </Button>
            </div>
          </div>

          {/* Table Container Card (Matching Screenshot 1) */}
          <div className="border border-kumo-line rounded-xl bg-kumo-base overflow-hidden shadow-2xs">
            {/* Table Header with Sort chevrons */}
            <div className="grid grid-cols-[1.5fr_1.1fr_1.3fr_44px] px-4 py-2.5 bg-kumo-canvas/60 border-b border-kumo-line text-[11px] font-semibold text-kumo-subtle select-none">
              <button
                type="button"
                onClick={() => handleSort('name')}
                className="flex items-center gap-1.5 text-left hover:text-kumo-strong transition-colors cursor-pointer"
              >
                <span>Name</span>
                <ArrowUpDown className="w-3 h-3 opacity-60" />
              </button>

              <button
                type="button"
                onClick={() => handleSort('role')}
                className="flex items-center gap-1.5 text-left hover:text-kumo-strong transition-colors cursor-pointer"
              >
                <span>Type</span>
                <ArrowUpDown className="w-3 h-3 opacity-60" />
              </button>

              <button
                type="button"
                onClick={() => handleSort('hub')}
                className="flex items-center gap-1.5 text-left hover:text-kumo-strong transition-colors cursor-pointer"
              >
                <span>Zone</span>
                <ArrowUpDown className="w-3 h-3 opacity-60" />
              </button>

              <div className="text-right">
                <span className="sr-only">Actions</span>
              </div>
            </div>

            {/* Table Rows (Screenshot 1 Row items with ... menu) */}
            <div className="divide-y divide-kumo-line/60 max-h-[380px] overflow-y-auto">
              {filteredAccounts.length === 0 ? (
                <div className="p-8 text-center text-kumo-subtle space-y-2">
                  <UserCheck className="w-8 h-8 mx-auto opacity-30" />
                  <p className="font-medium text-xs text-kumo-strong">No accounts match your search</p>
                  <p className="text-[11px]">Try adjusting your search criteria or onboard a new account.</p>
                </div>
              ) : (
                filteredAccounts.map((acc) => {
                  const isCurrent = acc.email.toLowerCase() === activeAccountEmail.toLowerCase()
                  const isSuperAdmin = acc.role === 'admin'
                  const roleConfig = SYSTEM_ROLE_CONFIGS.find((r) => r.id === acc.role)

                  return (
                    <div
                      key={acc.email}
                      className={cn(
                        'relative grid grid-cols-[1.5fr_1.1fr_1.3fr_44px] items-center px-4 py-3 hover:bg-kumo-tint/50 transition-colors group select-none text-xs font-sans',
                        isCurrent && 'bg-kumo-tint/30'
                      )}
                    >
                      {/* Name Column */}
                      <div className="min-w-0 pr-2 flex items-center gap-2.5">
                        <div
                          className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 select-none border',
                            isSuperAdmin
                              ? 'bg-red-500/10 text-primary border-red-500/20'
                              : 'bg-kumo-canvas text-kumo-strong border-kumo-line'
                          )}
                        >
                          {acc.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-kumo-strong truncate text-xs">{acc.name}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-kumo-subtle text-[11px] truncate mt-0.5">{acc.email}</p>
                        </div>
                      </div>

                      {/* Type / Role Column */}
                      <div className="min-w-0 pr-2">
                        <span
                          className={cn(
                            'inline-block px-2 py-0.5 text-[11px] font-medium rounded-md border truncate max-w-full',
                            roleConfig?.badgeClass || 'bg-kumo-canvas text-kumo-default border-kumo-line'
                          )}
                        >
                          {acc.roleLabel}
                        </span>
                      </div>

                      {/* Zone / Hub Column (Matching Screenshot 1 zone format) */}
                      <div className="min-w-0 pr-2">
                        <p className="text-kumo-strong font-normal truncate text-xs">
                          {acc.assigned_hub || 'Central Hub (Ikeja)'}
                        </p>
                        <p className="text-kumo-subtle text-[10px] truncate mt-0.5">
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
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-kumo-fill text-kumo-subtle hover:text-kumo-strong transition-colors cursor-pointer"
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
                            <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-kumo-line bg-kumo-base shadow-xl z-50 p-1 font-sans text-xs animate-in fade-in zoom-in-95 divide-y divide-kumo-line/60">
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
                                    setAccountToChangePassword(acc)
                                    setNewPasswordVal('Smokey@' + Math.floor(1000 + Math.random() * 9000))
                                    setOpenMenuEmail(null)
                                  }}
                                  className="w-full text-left px-3 py-1.5 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <Key className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
                                  <span>Change Password</span>
                                </button>

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

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuEmail(null)
                                    onClose()
                                    if (onOpenSignInActivity) onOpenSignInActivity()
                                  }}
                                  className="w-full text-left px-3 py-1.5 rounded-lg text-kumo-default hover:bg-kumo-tint flex items-center justify-between cursor-pointer transition-colors"
                                >
                                  <span className="flex items-center gap-2">
                                    <History className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
                                    <span>View activity</span>
                                  </span>
                                  <ExternalLink className="w-3 h-3 text-kumo-subtle" />
                                </button>
                              </div>

                              {/* Destructive Action (Screenshot 1: Remove in red) */}
                              <div className="pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAccountToDelete(acc)
                                    setOpenMenuEmail(null)
                                  }}
                                  disabled={availableAccounts.length <= 1}
                                  className="w-full text-left px-3 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                                  <span className="font-medium">Remove</span>
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

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-kumo-line text-xs">
            <span className="text-kumo-subtle">
              Total: <strong className="text-kumo-strong">{availableAccounts.length}</strong> operator accounts
            </span>

            <Button variant="outline" size="sm" type="button" onClick={onClose}>
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
        title="Edit route"
        description="Modify operator access credentials, role designation, and assigned zone."
        maxWidth="md"
      >
        {accountToEdit && (
          <form onSubmit={handleSaveEdit} className="space-y-4 font-sans text-xs">
            {/* Field 1: Role / Zone Select Dropdown (Matching Screenshot 2) */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-kumo-strong">
                Zone / Role
              </label>
              <div className="relative">
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
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

            {/* Field 2: Route / Name Input with Green Validation Checkmark (Screenshot 2 exact match) */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-kumo-strong">
                Route / Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Ayodine Admin"
                  className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-strong focus:outline-none focus:border-kumo-brand transition-colors"
                />
                {/* Green validation checkmark inside right edge (Screenshot 2) */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
                </div>
              </div>
              <p className="text-[11px] text-kumo-subtle leading-relaxed">
                Use an asterisk (*) character to create dynamic patterns that match multiple operations.
              </p>
            </div>

            {/* Field 3: Email Input with Validation Checkmark */}
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

      {/* ------------------------------------------------------------- */}
      {/* 3. ONBOARD NEW ACCOUNT MODAL                                  */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        isOpen={isOnboardOpen}
        onClose={() => setIsOnboardOpen(false)}
        title="Onboard New Account"
        description="Add a new operator to the operations dashboard with designated operational privileges."
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
                onChange={(e) =>
                  setOnboardForm((prev) => ({ ...prev, role: e.target.value as UserRole }))
                }
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
            <p className="text-[11px] text-kumo-subtle">
              An activation invitation and initial credentials will be provisioned.
            </p>
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
                id="requirePassReset"
                checked={requirePassReset}
                onChange={(e) => setRequirePassReset(e.target.checked)}
                className="rounded border-kumo-line text-primary focus:ring-primary size-4 cursor-pointer"
              />
              <label htmlFor="requirePassReset" className="text-xs text-kumo-default cursor-pointer">
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

      {/* ------------------------------------------------------------- */}
      {/* 5. QUICK CHANGE ROLE MODAL                                    */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        isOpen={Boolean(accountToChangeRole)}
        onClose={() => setAccountToChangeRole(null)}
        title={`Change Role: ${accountToChangeRole?.name || ''}`}
        description="Select an operational role to adjust operator permission scope."
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
                    onClick={() => setEditRole(r.id)}
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
                    <div className="min-w-0 flex-1">
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
                      <p className="text-[11px] text-kumo-subtle mt-0.5 leading-relaxed">
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
                  })
                  setAccountToChangeRole(null)
                }}
              >
                Save Role
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* 6. MANAGE ROLES DIRECTORY MODAL                               */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        isOpen={isManageRolesOpen}
        onClose={() => setIsManageRolesOpen(false)}
        title="Manage System Roles"
        description="Role-Based Access Control (RBAC) definitions and operational capability scopes."
        maxWidth="2xl"
      >
        <div className="space-y-4 font-sans text-xs">
          <div className="divide-y divide-kumo-line/80 border border-kumo-line rounded-xl bg-kumo-base overflow-hidden">
            {SYSTEM_ROLE_CONFIGS.map((r) => {
              const members = availableAccounts.filter((a) => a.role === r.id)
              return (
                <div key={r.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-kumo-strong">{r.label}</span>
                      <span
                        className={cn(
                          'px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider border',
                          r.badgeClass
                        )}
                      >
                        {r.id}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-kumo-subtle bg-kumo-canvas px-2.5 py-1 rounded-full border border-kumo-line">
                      {members.length} {members.length === 1 ? 'member' : 'members'} assigned
                    </span>
                  </div>

                  <p className="text-xs text-kumo-subtle leading-relaxed">{r.description}</p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {r.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-kumo-tint border border-kumo-line text-[10px] text-kumo-default font-medium"
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
            <Button variant="outline" size="sm" type="button" onClick={() => setIsManageRolesOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* 7. DELETE / REMOVE CONFIRMATION MODAL                         */}
      {/* ------------------------------------------------------------- */}
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
    </>
  )
}

export default ManageAccountsModal
