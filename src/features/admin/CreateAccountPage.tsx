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
  ArrowLeft,
  Calendar,
  MapPin,
  HeartHandshake,
  BadgeAlert,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useSmokeyOps, type UserRole, type AppUserAccount } from '@/context/SmokeyOpsContext'
import { useWarehouse } from '@/context/WarehouseContext'
import { cn } from '@/lib/utils'

export const CreateAccountPage: React.FC = () => {
  const navigate = useNavigate()
  const { createAccount, showToast } = useSmokeyOps()
  const { facilities, selectedWarehouse } = useWarehouse()

  // 1. Role & Operating Branch
  const [role, setRole] = useState<UserRole>('admin')
  const [assignedHub, setAssignedHub] = useState(selectedWarehouse?.name || facilities[0]?.name || 'Lagos Mainland HQ')
  const [employmentStatus, setEmploymentStatus] = useState<'full_time' | 'contract' | 'probation' | 'part_time'>('full_time')

  // 2. Personal & Contact Details
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [staffId, setStaffId] = useState('')
  const [dob, setDob] = useState('')
  const [address, setAddress] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [bvn, setBvn] = useState('')

  // 3. Emergency Contact (Next of Kin) & Guarantor
  const [emergencyContact, setEmergencyContact] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [emergencyRelationship, setEmergencyRelationship] = useState('')
  const [guarantorName, setGuarantorName] = useState('')
  const [guarantorPhone, setGuarantorPhone] = useState('')
  const [guarantorRelationship, setGuarantorRelationship] = useState('')

  // 4. Bank Account for Payroll
  const [bankName, setBankName] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')

  // 5. Rider Fleet & Vehicle KYC (Conditional)
  const [vehicleType, setVehicleType] = useState('Bajaj Boxer 150 Motorcycle')
  const [plateNumber, setPlateNumber] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [licenseExpiry, setLicenseExpiry] = useState('')
  const [codLimit, setCodLimit] = useState(50000)

  // 6. Security Credentials
  const [username, setUsername] = useState('')
  const [tempPassword, setTempPassword] = useState(() => `Smk@${Math.floor(1000 + Math.random() * 9000)}!`)
  const [showPassword, setShowPassword] = useState(false)
  const [mustChangePassword, setMustChangePassword] = useState(true)

  // Success view state
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
      showToast('Full name and email are required', 'error')
      return
    }

    const derivedUsername = username.trim() || email.split('@')[0].toLowerCase()
    const finalPassword = tempPassword.trim() || `Smk@${Math.floor(1000 + Math.random() * 9000)}!`
    const accName = name.trim()
    const generatedStaffId = staffId.trim() || `SHD-${role.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`

    const newAccountData: AppUserAccount = {
      email: email.trim().toLowerCase(),
      name: accName,
      role,
      roleLabel: roleLabels[role],
      phone: phone.trim() || '080' + Math.floor(10000000 + Math.random() * 90000000),
      staff_id: generatedStaffId,
      assigned_hub: assignedHub,
      employment_status: employmentStatus,
      date_of_birth: dob.trim() || undefined,
      residential_address: address.trim() || undefined,
      national_id_nin: nationalId.trim() || '7829-4821-9921',
      bvn: bvn.trim() || undefined,
      emergency_contact: emergencyContact.trim() || undefined,
      emergency_phone: emergencyPhone.trim() || undefined,
      emergency_relationship: emergencyRelationship.trim() || undefined,
      guarantor_name: guarantorName.trim() || undefined,
      guarantor_phone: guarantorPhone.trim() || undefined,
      guarantor_relationship: guarantorRelationship.trim() || undefined,
      bank_name: bankName.trim() || undefined,
      bank_account_number: bankAccountNumber.trim() || undefined,
      bank_account_name: bankAccountName.trim() || accName,
      vehicle_type: role === 'rider' ? vehicleType : undefined,
      plate_number: role === 'rider' ? (plateNumber.trim() || 'LND-482-XA') : undefined,
      license_number: role === 'rider' ? (licenseNumber.trim() || 'DL-98234-LAG') : undefined,
      license_expiry: role === 'rider' ? (licenseExpiry.trim() || '2028-12-31') : undefined,
      cod_limit: role === 'rider' ? Number(codLimit) : undefined,
      temporary_password: finalPassword,
      status: 'active',
      last_active: 'Account registered just now',
    }

    createAccount(newAccountData)

    setCreatedAccount({
      name: accName,
      email: email.trim().toLowerCase(),
      username: derivedUsername,
      tempPass: finalPassword,
      role: roleLabels[role],
    })

    showToast(`Account and KYC registered successfully for ${accName}`, 'success')
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
      {/* Header */}
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
              <span className="text-[16px] font-semibold text-zinc-700 dark:text-zinc-300">Register Staff Account & KYC</span>
            </div>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Create an operational team member profile with identity KYC, branch assignment, and access credentials in one place.
            </p>
          </div>
        </div>
      </div>

      {createdAccount ? (
        <div className="max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Account & KYC Created Successfully</h2>
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                Staff profile, verification details, and login credentials have been saved.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3">
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-zinc-500 dark:text-zinc-400">Full Legal Name</span>
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
              className="w-full sm:w-auto h-10 px-5 rounded-lg bg-[#c0201f] hover:bg-[#a01817] text-white text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
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
          {/* SECTION 1: ROLE & BRANCH ASSIGNMENT */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
              <Shield className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                1. Role & Operating Branch
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Role & Access Scope"
                value={role}
                onValueChange={(val) => setRole(val as UserRole)}
                options={[
                  { value: 'admin', label: 'Administrator (Full Access)' },
                  { value: 'manager', label: 'Operations Manager (Kitchen & Logistics)' },
                  { value: 'kitchen', label: 'Kitchen Chef / Prep Lead' },
                  { value: 'inventory', label: 'Inventory & Stock Officer' },
                  { value: 'dispatcher', label: 'Logistics Dispatcher' },
                  { value: 'rider', label: 'Delivery Fleet Rider' },
                ]}
              />

              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  Assigned Branch / Office
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

              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  Employment Status
                </label>
                <select
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value as any)}
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                >
                  <option value="full_time">Full Time</option>
                  <option value="contract">Contract</option>
                  <option value="probation">Probationary Period</option>
                  <option value="part_time">Part Time</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: PERSONAL IDENTITY & CONTACT DETAILS */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
              <User className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                2. Personal Details & Identity (KYC)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  Full Legal Name <span className="text-[#c0201f]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (!bankAccountName) setBankAccountName(e.target.value)
                  }}
                  placeholder="e.g. Yusuf Babatunde Balogun"
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  Work Email Address <span className="text-[#c0201f]">*</span>
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
                  Direct Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 802 345 6789"
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
                  placeholder="e.g. SHD-FLT-18 (Leave blank to auto-generate)"
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  National Identification Number (NIN)
                </label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="11-digit NIN (e.g. 7829-4821-9921)"
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 14 Commercial Avenue, Sabo, Yaba, Lagos"
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: EMERGENCY CONTACT & GUARANTOR */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
              <HeartHandshake className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                3. Emergency Contact & Guarantor Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  Next of Kin Name
                </label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. Mary Balogun"
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  Next of Kin Relationship
                </label>
                <input
                  type="text"
                  value={emergencyRelationship}
                  onChange={(e) => setEmergencyRelationship(e.target.value)}
                  placeholder="e.g. Spouse / Sibling / Parent"
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  Next of Kin Phone
                </label>
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+234 803 111 2233"
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  Guarantor Full Name
                </label>
                <input
                  type="text"
                  value={guarantorName}
                  onChange={(e) => setGuarantorName(e.target.value)}
                  placeholder="e.g. Chief Adebayo Coker"
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  Guarantor Relationship
                </label>
                <input
                  type="text"
                  value={guarantorRelationship}
                  onChange={(e) => setGuarantorRelationship(e.target.value)}
                  placeholder="e.g. Business Partner / Community Leader"
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  Guarantor Phone Number
                </label>
                <input
                  type="tel"
                  value={guarantorPhone}
                  onChange={(e) => setGuarantorPhone(e.target.value)}
                  placeholder="+234 805 444 8899"
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: BANK ACCOUNT FOR PAYROLL */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
              <CreditCard className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                4. Bank Account for Payroll & Disbursement
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Zenith Bank / GTBank"
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  Account Number
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="10-digit NUBAN"
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                  Account Beneficiary Name
                </label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="e.g. Yusuf Balogun"
                  className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: DRIVER FLEET KYC (CONDITIONAL FOR RIDERS) */}
          {role === 'rider' && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
                <Bike className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  5. Driver & Fleet Vehicle Verification
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
                    License Plate Number
                  </label>
                  <input
                    type="text"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="e.g. LND-482-XA"
                    className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                    Driver's License Number
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. DL-98234-LAG"
                    className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                    License Expiry Date
                  </label>
                  <input
                    type="date"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-4 mb-1.5">
                    Daily Cash on Delivery (COD) Float Limit (₦)
                  </label>
                  <input
                    type="number"
                    min="5000"
                    step="5000"
                    value={codLimit}
                    onChange={(e) => setCodLimit(Number(e.target.value))}
                    className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                  />
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Maximum cash a rider can hold before turning in remittances to dispatch stations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: SECURITY CREDENTIALS */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  {role === 'rider' ? '6. Sign-in Credentials' : '5. Sign-in Credentials'}
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

              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mustChangePassword}
                    onChange={(e) => setMustChangePassword(e.target.checked)}
                    className="rounded border-zinc-300 dark:border-zinc-700 text-primary focus:ring-primary size-4"
                  />
                  <span className="text-[13px] text-zinc-700 dark:text-zinc-300">
                    Force password change on first sign-in (Recommended)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
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
              className="h-10 px-5 rounded-lg bg-[#c0201f] hover:bg-[#a01817] active:opacity-90 text-white text-[13px] font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account & KYC</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
export default CreateAccountPage
