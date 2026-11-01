import React, { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import {
  ShieldCheck,
  Search,
  Laptop,
  Smartphone,
  Globe,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  LogOut,
  UserCheck,
  ShieldAlert
} from 'lucide-react'

export interface SignInLog {
  id: string
  when: string
  timestamp: string
  user: string
  email: string
  role: string
  country: string
  countryCode: string
  ipAddress: string
  device: string
  browser: string
  action: string
  status: 'success' | 'warning'
}

const SEED_SIGN_IN_LOGS: SignInLog[] = [
  {
    id: 'log-1',
    when: 'Today at 09:42 AM',
    timestamp: '2026-10-21 09:42:15',
    user: 'Ayobami Olowookere',
    email: 'ayodine47@gmail.com',
    role: 'Super Admin',
    country: 'Nigeria 🇳🇬',
    countryCode: 'NG',
    ipAddress: '102.89.44.12',
    device: 'MacBook Pro (macOS)',
    browser: 'Chrome 132.0',
    action: 'Signed in with Google',
    status: 'success'
  },
  {
    id: 'log-2',
    when: 'Today at 07:15 AM',
    timestamp: '2026-10-21 07:15:30',
    user: 'Babajide Ogundipe',
    email: 'ovensupervisor@smokeyhutdelight.com',
    role: 'Kitchen Lead',
    country: 'Nigeria 🇳🇬',
    countryCode: 'NG',
    ipAddress: '197.210.55.88',
    device: 'iPhone 15 Pro (iOS 18)',
    browser: 'Mobile Safari',
    action: 'Signed in with password',
    status: 'success'
  },
  {
    id: 'log-3',
    when: 'Yesterday at 06:30 PM',
    timestamp: '2026-10-20 18:30:00',
    user: 'Ayobami Olowookere',
    email: 'ayodine47@gmail.com',
    role: 'Super Admin',
    country: 'Nigeria 🇳🇬',
    countryCode: 'NG',
    ipAddress: '102.89.44.12',
    device: 'MacBook Pro (macOS)',
    browser: 'Chrome 132.0',
    action: 'Session refreshed',
    status: 'success'
  },
  {
    id: 'log-4',
    when: '20 Oct at 02:10 PM',
    timestamp: '2026-10-20 14:10:45',
    user: 'Chioma Okonkwo',
    email: 'chioma@smokeyhutdelight.com',
    role: 'Inventory Manager',
    country: 'Nigeria 🇳🇬',
    countryCode: 'NG',
    ipAddress: '105.112.33.19',
    device: 'Windows 11 PC',
    browser: 'Microsoft Edge',
    action: 'Signed in with password',
    status: 'success'
  },
  {
    id: 'log-5',
    when: '19 Oct at 08:22 PM',
    timestamp: '2026-10-19 20:22:10',
    user: 'Emeka Nwosu',
    email: 'dispatch@smokeyhutdelight.com',
    role: 'Dispatch Courier Lead',
    country: 'Nigeria 🇳🇬',
    countryCode: 'NG',
    ipAddress: '197.210.42.99',
    device: 'Samsung Galaxy S24',
    browser: 'Chrome Mobile',
    action: 'Signed in with password',
    status: 'success'
  },
  {
    id: 'log-6',
    when: '19 Oct at 11:45 AM',
    timestamp: '2026-10-19 11:45:00',
    user: 'Ayobami Olowookere',
    email: 'ayodine47@gmail.com',
    role: 'Super Admin',
    country: 'United Kingdom 🇬🇧',
    countryCode: 'GB',
    ipAddress: '86.14.122.9',
    device: 'iPad Air (iPadOS)',
    browser: 'Safari',
    action: 'Signed in with Google',
    status: 'success'
  },
  {
    id: 'log-7',
    when: '18 Oct at 04:12 PM',
    timestamp: '2026-10-18 16:12:30',
    user: 'Tunde Bakare',
    email: 'tunde.bakare@smokeyhutdelight.com',
    role: 'Store Counter Lead',
    country: 'Nigeria 🇳🇬',
    countryCode: 'NG',
    ipAddress: '102.89.33.45',
    device: 'Dell Latitude (Windows 11)',
    browser: 'Chrome 131.0',
    action: 'Signed in with password',
    status: 'success'
  },
  {
    id: 'log-8',
    when: '18 Oct at 09:20 AM',
    timestamp: '2026-10-18 09:20:10',
    user: 'Rider Yusuf',
    email: 'Ridersmokeyyusuf@gmail.com',
    role: 'Fleet Rider',
    country: 'Nigeria 🇳🇬',
    countryCode: 'NG',
    ipAddress: '197.210.64.12',
    device: 'Infinix Hot 30 (Android 14)',
    browser: 'Chrome Mobile',
    action: 'Mobile App Session Token',
    status: 'success'
  },
  {
    id: 'log-9',
    when: '17 Oct at 08:05 PM',
    timestamp: '2026-10-17 20:05:40',
    user: 'Kafayat Balogun',
    email: 'surulere.hub@smokeyhutdelight.com',
    role: 'Hub Operations Supervisor',
    country: 'Nigeria 🇳🇬',
    countryCode: 'NG',
    ipAddress: '105.112.48.91',
    device: 'MacBook Air (macOS)',
    browser: 'Chrome 132.0',
    action: 'Signed in with password',
    status: 'success'
  },
  {
    id: 'log-10',
    when: '17 Oct at 01:30 PM',
    timestamp: '2026-10-17 13:30:25',
    user: 'Chef Moses',
    email: 'moses.kitchen@smokeyhutdelight.com',
    role: 'Head Chef',
    country: 'Nigeria 🇳🇬',
    countryCode: 'NG',
    ipAddress: '197.210.55.90',
    device: 'iPad 10th Gen (iPadOS)',
    browser: 'Mobile Safari',
    action: 'Signed in with password',
    status: 'success'
  },
  {
    id: 'log-11',
    when: '16 Oct at 10:15 AM',
    timestamp: '2026-10-16 10:15:00',
    user: 'Ayobami Olowookere',
    email: 'ayodine47@gmail.com',
    role: 'Super Admin',
    country: 'Nigeria 🇳🇬',
    countryCode: 'NG',
    ipAddress: '102.89.44.12',
    device: 'MacBook Pro (macOS)',
    browser: 'Chrome 132.0',
    action: 'Two-Factor Authentication Verified',
    status: 'success'
  },
  {
    id: 'log-12',
    when: '15 Oct at 07:45 PM',
    timestamp: '2026-10-15 19:45:12',
    user: 'Oven Supervisor John',
    email: 'ovensupervisor.john@smokeyhutdelight.com',
    role: 'Oven Supervisor Lead',
    country: 'Nigeria 🇳🇬',
    countryCode: 'NG',
    ipAddress: '105.112.60.22',
    device: 'Tecno Spark 20 (Android 13)',
    browser: 'Chrome Mobile',
    action: 'Signed in with password',
    status: 'success'
  },
  {
    id: 'log-13',
    when: '15 Oct at 11:20 AM',
    timestamp: '2026-10-15 11:20:45',
    user: 'Sarah Intake',
    email: 'intake@smokeyhutdelight.com',
    role: 'Intake Clerk',
    country: 'Nigeria 🇳🇬',
    countryCode: 'NG',
    ipAddress: '102.89.33.80',
    device: 'Windows 10 Workstation',
    browser: 'Firefox 130.0',
    action: 'Signed in with password',
    status: 'success'
  },
  {
    id: 'log-14',
    when: '14 Oct at 03:10 PM',
    timestamp: '2026-10-14 15:10:00',
    user: 'Chinedu Eze',
    email: 'lekki.hub@smokeyhutdelight.com',
    role: 'Hub Operations Supervisor',
    country: 'Nigeria 🇳🇬',
    countryCode: 'NG',
    ipAddress: '197.210.42.11',
    device: 'HP EliteBook (Windows 11)',
    browser: 'Microsoft Edge',
    action: 'Signed in with password',
    status: 'success'
  }
]

interface SignInActivityModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SignInActivityModal: React.FC<SignInActivityModalProps> = ({
  isOpen,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  const liveLogs: SignInLog[] = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('smokey_sign_in_logs_v1')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      // ignore
    }
    return [SEED_SIGN_IN_LOGS[0]]
  }, [isOpen])

  const filteredLogs = liveLogs.filter(log => {
    const q = searchQuery.toLowerCase().trim()
    return (
      !q ||
      log.user.toLowerCase().includes(q) ||
      log.email.toLowerCase().includes(q) ||
      log.country.toLowerCase().includes(q) ||
      log.device.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q)
    )
  })

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Sign-in Activity & Security Log"
      description="Recent account logins, device sessions, and authentication events across your team."
      maxWidth="5xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[13px] text-kumo-subtle">
            Showing {filteredLogs.length} recent events
          </span>
          <Button variant="outline" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4 font-sans">
        {/* Super Admin Notice Pill */}
        <div className="flex items-center justify-between p-3.5 rounded-lg bg-kumo-surface border border-kumo-line text-kumo-strong">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-black dark:text-white shrink-0" />
            <div>
              <p className="font-semibold text-kumo-strong text-[16px]">
                Super Admin Security Audit
              </p>
              <p className="text-[13px] text-kumo-subtle mt-0.5">
                Full visibility of all user logins, device footprints, and authentication sessions across your team.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black shrink-0">
            Super Admin
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-kumo-subtle pointer-events-none" />
          <input
            type="text"
            placeholder="Search by user, email, country, device, or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-kumo-line bg-kumo-base text-[14px] text-kumo-strong placeholder:text-kumo-subtle focus:outline-none focus:ring-1 focus:ring-kumo-link"
          />
        </div>

        {/* Table of Activity */}
        <div className="overflow-x-auto rounded-lg border border-kumo-line bg-kumo-base">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-kumo-line bg-kumo-canvas/60 text-[11px] font-semibold text-kumo-subtle uppercase tracking-wider select-none">
                <th className="py-2.5 px-3.5 whitespace-nowrap">When</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">User</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">Country</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">Device & Browser</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kumo-line/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-kumo-subtle whitespace-nowrap text-[13px]">
                    No sign-in records matched your search.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-kumo-tint/40 transition-colors">
                    {/* When */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="font-medium text-kumo-strong text-[13px]">{log.when}</div>
                      <div className="text-[11px] text-kumo-subtle">{log.timestamp.slice(11)}</div>
                    </td>

                    {/* User */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="font-semibold text-kumo-strong text-[13px]">{log.user}</div>
                      <div className="text-[12px] text-kumo-subtle">{log.email}</div>
                    </td>

                    {/* Country */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="font-medium text-kumo-strong text-[13px]">{log.country}</span>
                      <div className="text-[11px] text-kumo-subtle">{log.ipAddress}</div>
                    </td>

                    {/* Device */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="text-kumo-strong font-medium flex items-center gap-1.5 whitespace-nowrap text-[13px]">
                        {log.device.toLowerCase().includes('phone') ? (
                          <Smartphone className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
                        ) : (
                          <Laptop className="w-3.5 h-3.5 text-kumo-subtle shrink-0" />
                        )}
                        <span>{log.device}</span>
                      </div>
                      <div className="text-[11px] text-kumo-subtle">{log.browser}</div>
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900 whitespace-nowrap shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        {log.action}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Dialog>
  )
}
