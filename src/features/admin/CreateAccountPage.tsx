import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserPlus,
  Key,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Check,
  Building2,
  Phone,
  Mail,
  User,
  CreditCard,
  Bike,
  CheckCircle2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useSmokeyOps, type UserRole } from '@/context/SmokeyOpsContext'
import { useWarehouse } from '@/context/WarehouseContext'
import { cn } from '@/lib/utils'

export const CreateAccountPage: React.FC = () => {
  const navigate = useNavigate()
  const { createAccount, showToast } = useSmokeyOps()
  const { facilities, selectedWarehouse } = useWarehouse()

  // Form states
  const [role, setRole] = useState<UserRole>('admin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [staffId, setStaffId] = useState('')
  const [assignedHub, setAssignedHub] = useState(selectedWarehouse?.name || facilities[0]?.name || 'Yaba Head Office')
  const [nationalId, setNationalId] = useState('')

  // Rider KYC states
  const [vehicleType, setVehicleType] = useState('Bajaj Boxer 150 Motorcycle')
  const [plateNumber, setPlateNumber] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [codLimit, setCodLimit] = useState(50000)

  // Security Credentials states
  const [username, setUsername] = useState('')
  const [tempPassword, setTempPassword] = useState(() => `Smk@${Math.floor(1000 + Math.random() * 9000)}!`)
  const [showPassword, setShowPassword] = useState(false)
  const [mustChangePassword, setMustChangePassword] = useState(true)

  // Created Summary State
  const [createdAccount, setCreatedAccount] = useState<{
    name: string
    email: string
    username: string
    tempPass: string
    role: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const roleLabels: Record<UserRole, string> = {
    admin: 'Administrator',
    manager: 'Operations Manager',
    kitchen: 'Kitchen Chef / Prep Lead',
    inventory: 'Inventory & Stock Officer',
    dispatcher: 'Logistics Dispatcher',
    rider: 'Delivery Fleet Rider',
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !name.trim()) {
      showToast('Name and email are required', 'error')
      return
    }

    const derivedUsername = username.trim() || email.split('@')[0].toLowerCase()
    const finalPassword = tempPassword.trim() || `Smk@${Math.floor(1000 + Math.random() * 9000)}!`
    const accName = name.trim()

    createAccount({
      email: email.trim().toLowerCase(),
      name: accName,
      role,
      roleLabel: roleLabels[role],
      phone: phone.trim() || '080' + Math.floor(10000000 + Math.random() * 90000000),
      staff_id: staffId.trim() || `SHD-${role.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      assigned_hub: assignedHub,
      national_id_nin: nationalId.trim() || '7829-4821-9921',
      vehicle_type: role === 'rider' ? vehicleType : undefined,
      plate_number: role === 'rider' ? (plateNumber.trim() || 'LND-482-XA') : undefined,
      license_number: role === 'rider' ? (licenseNumber.trim() || 'DL-98234-LAG') : undefined,
      cod_limit: role === 'rider' ? Number(codLimit) : undefined,
    })

    setCreatedAccount({
      name: accName,
      email: email.trim().toLowerCase(),
      username: derivedUsername,
      tempPass: finalPassword,
      role: roleLabels[role],
    })

    showToast(`Account successfully created for ${accName}`, 'success')
  }

  const handleCopyCredentials = () => {
    if (!createdAccount) return
    const text = `SmokeyOps Credentials\nName: ${createdAccount.name}\nEmail: ${createdAccount.email}\nUsername: ${createdAccount.username}\nTemporary Password: ${createdAccount.tempPass}\nRole: ${createdAccount.role}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    showToast('Credentials copied to clipboard', 'info')
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Navigation Breadcrumb & Header matching ManageAccountsPage & ManageOfficesPage */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/accounts')}
            className="w-9 h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer shadow-2xs shrink-0"
            aria-label="Back to accounts"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Manage Accounts</h1>
              <span className="text-zinc-400 dark:text-zinc-500 text-[16px] font-normal">/</span>
              <span className="text-[16px] font-semibold text-zinc-700 dark:text-zinc-300">Create Account</span>
            </div>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Register a new staff member, driver or operator account with operational KYC and system permissions.
            </p>
          </div>
        </div>
      </div>

      {createdAccount ? (
        <div className="max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Account Created Successfully</h2>
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                Please provide the login credentials below to the new operator.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3">
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-zinc-500 dark:text-zinc-400">Full Name</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{createdAccount.name}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-zinc-500 dark:text-zinc-400">Email Address</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100">{createdAccount.email}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-zinc-500 dark:text-zinc-400">Username</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100">{createdAccount.username}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-zinc-500 dark:text-zinc-400">Temporary Password</span>
              <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{createdAccount.tempPass}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-zinc-500 dark:text-zinc-400">Assigned Role</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
                {createdAccount.role}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleCopyCredentials}
              className="w-full sm:w-auto h-10 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Credentials'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/accounts')}
              className="w-full sm:w-auto h-10 px-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[13px] font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>View in Accounts Table</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreate} className="max-w-4xl space-y-6 pb-12">
          {/* 1. ROLE & OPERATIONAL SCOPE */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
              <Shield className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                1. Role & Operational Scope
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Role & System Permissions"
                value={role}
                onValueChange={(val) => setRole(val as UserRole)}
                options={[
                  { value: 'admin', label: 'Administrator (Full Access)' },
                  { value: 'manager', label: 'Operations Manager (Kitchen & Logistics)' },
                  { value: 'kitchen', label: 'Kitchen Chef / Prep Lead' },
                  { value: 'inventory', label: 'Inventory & Stock Officer' },
                  { value: 'dispatcher', label: 'Logistics Dispatcher' },
                  { value: 'rider', label: 'Delivery Fleet Rider (Trip Portal & Wallet)' },
                ]}
              />

              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  Assigned Operating Hub / Office
                </label>
                <select
                  value={assignedHub}
                  onChange={(e) => setAssignedHub(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                >
                  {facilities.map((fac) => (
                    <option key={fac.id} value={fac.name}>
                      {fac.name} ({fac.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. ACCOUNT IDENTITY & STAFF KYC */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
              <User className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                2. Identity & Contact Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  Full Name <span className="text-zinc-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Yusuf Alabi"
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  Work Email Address <span className="text-zinc-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@smokeyhut.com"
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08012345678"
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  Staff / Employee ID
                </label>
                <input
                  type="text"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="e.g. SHD-FLT-18"
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  National Identification Number (NIN)
                </label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="e.g. 7829-4821-9921"
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* 3. CONDITIONAL RIDER FLEET KYC */}
          {role === 'rider' && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
                <Bike className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  3. Driver Fleet KYC & Logistics Credentials
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                    Vehicle Model
                  </label>
                  <input
                    type="text"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    placeholder="e.g. Bajaj Boxer 150 Motorcycle"
                    className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                    Plate Number
                  </label>
                  <input
                    type="text"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="LND-482-XA"
                    className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                    Rider Driver's License No
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="DL-98234-LAG"
                    className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                    Max Daily COD Cash Limit (₦)
                  </label>
                  <input
                    type="number"
                    min="5000"
                    step="5000"
                    value={codLimit}
                    onChange={(e) => setCodLimit(Number(e.target.value))}
                    className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. SECURITY & TEMPORARY ACCESS CREDENTIALS */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  {role === 'rider' ? '4. Security Credentials' : '3. Security Credentials'}
                </h3>
              </div>
              <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                Auto-Provisioned
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  Sign-in Username / Handle
                </label>
                <input
                  type="text"
                  required
                  value={username || (email ? email.split('@')[0].toLowerCase() : '')}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. yusuf.ops"
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4">
                    Temporary Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setTempPassword(`Smk@${Math.floor(1000 + Math.random() * 9000)}!`)}
                    className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Regenerate</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="w-full h-10 pl-3.5 pr-10 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2 pt-1">
                <label className="flex items-center gap-2.5 text-[13px] text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mustChangePassword}
                    onChange={(e) => setMustChangePassword(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
                  />
                  <span>Force password change on first sign-in (Recommended)</span>
                </label>
              </div>
            </div>
          </div>

          {/* STANDARDIZED ACTION BUTTONS (DESATURATED GREY) */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => navigate('/accounts')}
              className="h-10 px-4 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 text-[13px] font-medium transition-colors cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-[13px] font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
export default CreateAccountPage
