import React, { useState, useMemo, useEffect } from 'react'
import {
  FileText,
  LifeBuoy,
  Bug,
  ShieldAlert,
  BookOpen,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  Eye,
  Plus
} from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Select, type SelectOption } from '@/components/ui/Select'
import { Tooltip } from '@/components/ui/Tooltip'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { DataTable, type ColumnDef } from '@/components/ui/DataTable'
import { FileUpload, type FileUploadItem } from '@/components/ui/FileUpload'
import { StatusBadge } from '@/components/ui/Badge'
import { TableActionButton } from '@/components/ui/TableActionButton'
import { useWarehouse } from '@/context/WarehouseContext'
import { cn } from '@/lib/utils'

export type SupportModalType =
  | 'none'
  | 'submit-case'
  | 'request-support'
  | 'report-bug'
  | 'report-abuse'
  | 'faq'
  | 'view-ticket'

export interface SupportTicket {
  id: string
  type: 'Case' | 'Support' | 'Bug' | 'Abuse'
  category: string
  subject: string
  facility: string
  priority: 'Critical' | 'High' | 'Moderate' | 'Low'
  createdAt: string
  status: 'Under Review' | 'In Progress' | 'Resolved'
  description: string
  reporter?: string
  filesCount?: number
  isAnonymous?: boolean
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'TKT-2026-104',
    type: 'Support',
    category: 'Weighing Scales & Kitchen Tools',
    subject: 'Portioning digital scale tare drift in meat prep station',
    facility: 'Yaba Central Kitchen',
    priority: 'Moderate',
    createdAt: '2026-10-31 16:20',
    status: 'In Progress',
    description: 'Digital scale in the raw chicken marination section drifts by +15g when tared. Needs recalibration or replacement with backup unit.',
    reporter: 'tunde@smokeyhutdelight.com',
    filesCount: 1
  },
  {
    id: 'BUG-2026-088',
    type: 'Bug',
    category: 'Logistics & Rider Board',
    subject: 'Waybill upload preview thumbnail slow to render on mobile browser',
    facility: 'All Facilities',
    priority: 'Low',
    createdAt: '2026-10-31 14:05',
    status: 'Resolved',
    description: 'When dispatchers take a live camera photo of the delivery slip on iPhone, image preview took 3 seconds to appear before confirming assignment.',
    reporter: 'dispatcher@smokeyhutdelight.com',
    filesCount: 0
  },
  {
    id: 'ABU-2026-019',
    type: 'Abuse',
    category: 'Rider Cash Collection Diversion',
    subject: 'Discrepancy in customer cash on delivery remittance',
    facility: 'Ikeja Outlet',
    priority: 'High',
    createdAt: '2026-10-30 19:40',
    status: 'Under Review',
    description: 'Order #SH-4091 marked as paid via cash handover, but rider remitted ₦5,000 less than invoice total at close of shift.',
    isAnonymous: true,
    filesCount: 2
  }
]

interface FaqItem {
  id: string
  category: 'Orders' | 'Inventory & Cooking' | 'Packaging' | 'Logistics & Riders' | 'Accounts'
  question: string
  answer: string
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'Orders',
    question: 'How do customer orders sync from the online storefront?',
    answer: 'Orders placed on the website automatically sync into the Ops Dashboard within 2-5 seconds via Supabase Realtime. When a customer checkout is completed with verified Paystack payment, an alert chime sounds and the order appears on the Order Tracking Diagram under Intake with status "Done".'
  },
  {
    id: 'faq-2',
    category: 'Orders',
    question: 'How do I cancel or void an order if customer requests a change?',
    answer: 'If an order has not entered smoking production or dispatch, open Website Orders, click the order row, and select "Cancel Order". If ingredients or packaging have already been deducted, an adjustment movement will be logged automatically to return items to stock.'
  },
  {
    id: 'faq-3',
    category: 'Inventory & Cooking',
    question: 'When are raw ingredients automatically deducted from inventory?',
    answer: 'When a smoking production run is launched in Cooking Batches, recipe ingredients (e.g. fresh chicken, dry pepper, cloves, cinnamon sticks, firewood) are automatically deducted from Raw Inventory based on the batch size and recipe ratio.'
  },
  {
    id: 'faq-4',
    category: 'Inventory & Cooking',
    question: 'How do we log physical inventory counts and count variances?',
    answer: 'Navigate to Raw Ingredients and click "Physical Stock Count". Enter the physical counts for each SKU. The system computes discrepancies between system stock and physical count, logging an auditable stock adjustment.'
  },
  {
    id: 'faq-5',
    category: 'Packaging',
    question: 'What packaging sizes should be used for smoked orders?',
    answer: 'Use Size 8 Nylon for single portions (e.g. Half Chicken, Smokey Gizzard) and Size 12 Nylon for large/family orders (e.g. Whole Smoked Chicken, Full Guineafowl). Heat seal each package and affix a thermal order barcode label.'
  },
  {
    id: 'faq-6',
    category: 'Logistics & Riders',
    question: 'What is the difference between In-House Rider and Third-Party Rider?',
    answer: 'In-House Riders are company delivery personnel with fixed daily schedules and shift-based settlements. Third-Party Riders are on-demand dispatch couriers (Uber, InDrive, Gokada, Bolt, GIG). All third-party dispatches require an uploaded waybill slip or charged fare receipt.'
  },
  {
    id: 'faq-7',
    category: 'Logistics & Riders',
    question: 'Is waybill proof of delivery slip upload compulsory?',
    answer: 'Yes. Whenever assigning an order to a third-party rider, dispatch staff must upload a clear screenshot of the courier fare receipt or paper waybill slip before confirming dispatch.'
  },
  {
    id: 'faq-8',
    category: 'Accounts',
    question: 'How do I reset my password or request elevated role permissions?',
    answer: 'Only Super Administrators can create staff accounts or elevate roles. If you cannot access a station or forgot your credentials, submit an internal case using the "Submit a Case" card on this page.'
  }
]

export const SupportHelpDeskPage: React.FC = () => {
  const { selectedWarehouse, facilities } = useWarehouse()
  const [activeModal, setActiveModal] = useState<SupportModalType>('none')
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<string>('All')
  const [faqOpenMap, setFaqOpenMap] = useState<Record<string, boolean>>({ 'faq-1': true })

  // Stored tickets in local storage
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem('smokey_support_tickets')
      if (saved) return JSON.parse(saved)
    } catch {
      // fallback
    }
    return INITIAL_TICKETS
  })

  useEffect(() => {
    try {
      localStorage.setItem('smokey_support_tickets', JSON.stringify(tickets))
    } catch {
      // ignore
    }
  }, [tickets])

  // Form states with custom selects
  const [caseForm, setCaseForm] = useState({
    category: 'Order Escalation',
    impact: 'P3 - Moderate (Workaround available)',
    facility: selectedWarehouse?.name || 'Yaba Central Kitchen',
    description: '',
    contactEmail: '',
    orderRef: '',
    uploadedFiles: [] as FileUploadItem[]
  })

  const [supportForm, setSupportForm] = useState({
    supportType: 'POS Terminal & Hardware',
    station: 'Packaging & Sealing Table',
    urgency: 'Today (Needed by end of shift)',
    description: '',
    contactPhone: '',
    uploadedFiles: [] as FileUploadItem[]
  })

  const [bugForm, setBugForm] = useState({
    module: 'Logistics & Dispatch Board',
    summary: '',
    stepsToReproduce: '',
    severity: 'Major (Incorrect data or calculation error)',
    device: 'Desktop Chrome',
    uploadedFiles: [] as FileUploadItem[]
  })

  const [abuseForm, setAbuseForm] = useState({
    category: 'Inventory / Raw Meat Theft',
    dateTime: '2026-10-31 19:30',
    facility: selectedWarehouse?.name || 'Yaba Central Kitchen',
    statement: '',
    isAnonymous: true,
    reporterName: '',
    reporterContact: '',
    uploadedFiles: [] as FileUploadItem[]
  })

  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null)
  const [isHowReportsHandledOpen, setIsHowReportsHandledOpen] = useState(false)

  // Facility Options for Select
  const facilityOptions: SelectOption[] = useMemo(() => {
    return [
      ...facilities.map(f => ({ value: f.name, label: `${f.name} (${f.city})` })),
      { value: 'All Facilities', label: 'All Facilities' }
    ]
  }, [facilities])

  // Case category options
  const caseCategoryOptions: SelectOption[] = [
    { value: 'Order Escalation', label: 'Order Escalation' },
    { value: 'Inventory Discrepancy', label: 'Inventory Discrepancy' },
    { value: 'Supplier Delivery Variance', label: 'Supplier Delivery Variance' },
    { value: 'Logistics & Rider Settlement', label: 'Logistics & Rider Settlement' },
    { value: 'Billing & Account Management', label: 'Billing & Account Management' },
    { value: 'Other Operational Request', label: 'Other Operational Request' }
  ]

  // Impact options
  const impactOptions: SelectOption[] = [
    { value: 'P1 - Critical (Operations blocked)', label: 'P1 - Critical (Operations blocked)' },
    { value: 'P2 - High (Significant delay or bottleneck)', label: 'P2 - High (Significant delay)' },
    { value: 'P3 - Moderate (Workaround available)', label: 'P3 - Moderate (Workaround available)' },
    { value: 'P4 - General questions / Low', label: 'P4 - General questions / Low' }
  ]

  // Support type options
  const supportTypeOptions: SelectOption[] = [
    { value: 'POS Terminal & Hardware', label: 'POS Terminal & Hardware' },
    { value: 'Receipt / Waybill Printer', label: 'Receipt / Waybill Printer' },
    { value: 'Weighing Scales & Kitchen Tools', label: 'Weighing Scales & Kitchen Tools' },
    { value: 'Packaging Heat Sealer', label: 'Packaging Heat Sealer' },
    { value: 'Smoking Grill & Chimney', label: 'Smoking Grill & Chimney' },
    { value: 'Station Wi-Fi & Internet', label: 'Station Wi-Fi & Internet' }
  ]

  // Urgency options
  const urgencyOptions: SelectOption[] = [
    { value: 'Immediate (Station Halted)', label: 'Immediate (Station Halted)' },
    { value: 'Urgent (Needed within 1 hour)', label: 'Urgent (Needed within 1 hour)' },
    { value: 'Today (Needed by end of shift)', label: 'Today (Needed by end of shift)' },
    { value: 'Scheduled Maintenance', label: 'Scheduled Maintenance' }
  ]

  // Station options
  const stationOptions: SelectOption[] = [
    { value: 'Raw Meat Prep Area', label: 'Raw Meat Prep Area' },
    { value: 'Grill Smoking Station', label: 'Grill Smoking Station' },
    { value: 'Packaging & Sealing Table', label: 'Packaging & Sealing Table' },
    { value: 'Rider Dispatch Desk', label: 'Rider Dispatch Desk' },
    { value: 'Admin Office', label: 'Admin Office' }
  ]

  // Bug module options
  const bugModuleOptions: SelectOption[] = [
    { value: 'Overview & Order Tracking Diagram', label: 'Overview & Order Tracking Diagram' },
    { value: 'Website Orders & Ingestion', label: 'Website Orders & Ingestion' },
    { value: 'Raw Inventory & Stock Deductions', label: 'Raw Inventory & Stock Deductions' },
    { value: 'Packaging Execution & Materials', label: 'Packaging Execution & Materials' },
    { value: 'Cooking Batches & Yields', label: 'Cooking Batches & Yields' },
    { value: 'Logistics & Dispatch Board', label: 'Logistics & Dispatch Board' },
    { value: 'Staff Accounts & Authentication', label: 'Staff Accounts & Authentication' }
  ]

  // Bug severity options
  const bugSeverityOptions: SelectOption[] = [
    { value: 'Blocking (Prevents completing task)', label: 'Blocking (Prevents completing task)' },
    { value: 'Major (Incorrect data or calculation error)', label: 'Major (Incorrect data or error)' },
    { value: 'Minor (Visual alignment or slow load)', label: 'Minor (Visual alignment or slow load)' }
  ]

  // Abuse category options
  const abuseCategoryOptions: SelectOption[] = [
    { value: 'Inventory / Raw Meat Theft', label: 'Inventory / Raw Meat Theft' },
    { value: 'Packaging Supply Shrinkage', label: 'Packaging Supply Shrinkage' },
    { value: 'Rider Cash Collection Diversion', label: 'Rider Cash Collection Diversion' },
    { value: 'Unauthorized Order Cancellation or Void', label: 'Unauthorized Order Cancellation or Void' },
    { value: 'Falsified Expense or Vendor Invoice', label: 'Falsified Expense or Vendor Invoice' },
    { value: 'Procedural Breach / Other Misconduct', label: 'Procedural Breach / Other Misconduct' }
  ]

  // Handle Submit a Case
  const handleSubmitCase = (e: React.FormEvent) => {
    e.preventDefault()
    if (!caseForm.description.trim()) return

    const newTicket: SupportTicket = {
      id: `TKT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      type: 'Case',
      category: caseForm.category,
      subject: caseForm.orderRef ? `Case: ${caseForm.category} (${caseForm.orderRef})` : `Case: ${caseForm.category}`,
      facility: caseForm.facility,
      priority: caseForm.impact.includes('P1')
        ? 'Critical'
        : caseForm.impact.includes('P2')
        ? 'High'
        : caseForm.impact.includes('P3')
        ? 'Moderate'
        : 'Low',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'Under Review',
      description: caseForm.description,
      reporter: caseForm.contactEmail || 'staff@smokeyhutdelight.com',
      filesCount: caseForm.uploadedFiles.length
    }

    setTickets(prev => [newTicket, ...prev])
    setSubmissionSuccess(`Case ${newTicket.id} submitted successfully! Our operations desk has received your ticket.`)
    setActiveModal('none')
    setCaseForm({
      category: 'Order Escalation',
      impact: 'P3 - Moderate (Workaround available)',
      facility: selectedWarehouse?.name || 'Yaba Central Kitchen',
      description: '',
      contactEmail: '',
      orderRef: '',
      uploadedFiles: []
    })
  }

  // Handle Request Support
  const handleRequestSupport = (e: React.FormEvent) => {
    e.preventDefault()
    if (!supportForm.description.trim()) return

    const newTicket: SupportTicket = {
      id: `SUP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      type: 'Support',
      category: supportForm.supportType,
      subject: `Support: ${supportForm.supportType} at ${supportForm.station}`,
      facility: selectedWarehouse?.name || 'Yaba Central Kitchen',
      priority: supportForm.urgency.includes('Immediate') ? 'Critical' : 'Moderate',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'Under Review',
      description: supportForm.description,
      reporter: supportForm.contactPhone,
      filesCount: supportForm.uploadedFiles.length
    }

    setTickets(prev => [newTicket, ...prev])
    setSubmissionSuccess(`Support request ${newTicket.id} logged. A technician or supervisor will attend to your station.`)
    setActiveModal('none')
    setSupportForm({
      supportType: 'POS Terminal & Hardware',
      station: 'Packaging & Sealing Table',
      urgency: 'Today (Needed by end of shift)',
      description: '',
      contactPhone: '',
      uploadedFiles: []
    })
  }

  // Handle Report Bug
  const handleReportBug = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bugForm.summary.trim() || !bugForm.stepsToReproduce.trim()) return

    const newTicket: SupportTicket = {
      id: `BUG-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      type: 'Bug',
      category: bugForm.module,
      subject: bugForm.summary,
      facility: 'System-wide',
      priority: bugForm.severity.includes('Blocking') ? 'Critical' : 'Moderate',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'Under Review',
      description: `Steps to reproduce & actual behavior:\n${bugForm.stepsToReproduce}\n(Device: ${bugForm.device})`,
      filesCount: bugForm.uploadedFiles.length
    }

    setTickets(prev => [newTicket, ...prev])
    setSubmissionSuccess(`Bug report ${newTicket.id} received. The development team has been notified.`)
    setActiveModal('none')
    setBugForm({
      module: 'Logistics & Dispatch Board',
      summary: '',
      stepsToReproduce: '',
      severity: 'Major (Incorrect data or calculation error)',
      device: 'Desktop Chrome',
      uploadedFiles: []
    })
  }

  // Handle Report Abuse
  const handleReportAbuse = (e: React.FormEvent) => {
    e.preventDefault()
    if (!abuseForm.statement.trim()) return

    const newTicket: SupportTicket = {
      id: `ABU-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      type: 'Abuse',
      category: abuseForm.category,
      subject: `Confidential Report: ${abuseForm.category}`,
      facility: abuseForm.facility,
      priority: 'High',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'Under Review',
      description: abuseForm.statement,
      isAnonymous: abuseForm.isAnonymous,
      reporter: abuseForm.isAnonymous ? 'Anonymous' : abuseForm.reporterName,
      filesCount: abuseForm.uploadedFiles.length
    }

    setTickets(prev => [newTicket, ...prev])
    setSubmissionSuccess(`Confidential report ${newTicket.id} submitted securely to internal audit.`)
    setActiveModal('none')
    setAbuseForm({
      category: 'Inventory / Raw Meat Theft',
      dateTime: '2026-10-31 19:30',
      facility: selectedWarehouse?.name || 'Yaba Central Kitchen',
      statement: '',
      isAnonymous: true,
      reporterName: '',
      reporterContact: '',
      uploadedFiles: []
    })
  }

  // FAQ Filtering
  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter(item => {
      const matchesCategory = faqCategoryFilter === 'All' || item.category === faqCategoryFilter
      const matchesSearch =
        searchQuery === '' ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [faqCategoryFilter, searchQuery])

  const toggleFaq = (id: string) => {
    setFaqOpenMap(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // DataTable columns desaturated to neutral grey design system
  const ticketColumns: ColumnDef<SupportTicket>[] = useMemo(() => [
    {
      key: 'id',
      header: 'Ticket ID',
      accessor: (t) => (
        <span className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold text-xs">
          {t.id}
        </span>
      ),
      sortable: true,
      sortValue: (t) => t.id,
      width: '120px'
    },
    {
      key: 'type',
      header: 'Type & Category',
      accessor: (t) => (
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            {t.type}
          </span>
          <span className="text-zinc-600 dark:text-zinc-300 text-xs truncate max-w-[160px]">
            {t.category}
          </span>
        </div>
      ),
      sortable: true,
      sortValue: (t) => t.category,
      width: '210px'
    },
    {
      key: 'subject',
      header: 'Summary',
      accessor: (t) => (
        <span className="text-zinc-900 dark:text-zinc-100 font-medium text-xs line-clamp-1">
          {t.subject}
        </span>
      ),
      sortable: true,
      sortValue: (t) => t.subject
    },
    {
      key: 'facility',
      header: 'Station / Facility',
      accessor: (t) => (
        <span className="text-zinc-600 dark:text-zinc-400 text-xs">
          {t.facility}
        </span>
      ),
      sortable: true,
      sortValue: (t) => t.facility,
      width: '160px'
    },
    {
      key: 'priority',
      header: 'Priority',
      accessor: (t) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
          {t.priority}
        </span>
      ),
      sortable: true,
      sortValue: (t) => t.priority,
      width: '100px'
    },
    {
      key: 'createdAt',
      header: 'Date',
      accessor: (t) => (
        <span className="text-zinc-500 dark:text-zinc-400 text-xs whitespace-nowrap">
          {t.createdAt}
        </span>
      ),
      sortable: true,
      sortValue: (t) => t.createdAt,
      width: '140px'
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (t) => {
        if (t.status === 'Resolved') {
          return <StatusBadge status="RESOLVED" label="resolved" size="sm" />
        }
        if (t.status === 'In Progress') {
          return <StatusBadge status="IN_PROGRESS" label="in-progress" size="sm" />
        }
        return <StatusBadge status="UNDER_REVIEW" label="under-review" size="sm" />
      },
      sortable: true,
      sortValue: (t) => t.status,
      width: '140px'
    },
    {
      key: 'actions',
      header: 'Action',
      defaultWidth: 110,
      accessor: (t) => (
        <div className="flex items-center justify-end w-full" onClick={(e) => e.stopPropagation()}>
          <TableActionButton
            variant="outline"
            onClick={() => {
              setSelectedTicket(t)
              setActiveModal('view-ticket')
            }}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
          >
            View
          </TableActionButton>
        </div>
      ),
      align: 'right'
    }
  ], [])

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 font-sans animate-in fade-in duration-300">
      {/* Submission Success Banner */}
      {submissionSuccess && (
        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{submissionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setSubmissionSuccess(null)}
            className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Main Bento Cards Section (Clean without bottom indicators) */}
      <div className="space-y-4">
        <div className="text-center max-w-2xl mx-auto py-2">
          <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            What can we help you with?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
            Choose an option below to submit an operational case, request station support, or access operating knowledge.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Card 1: Submit a case (Wide 3 cols on lg) */}
          <button
            type="button"
            onClick={() => setActiveModal('submit-case')}
            className="lg:col-span-3 group relative text-left p-6 rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center border border-zinc-200/80 dark:border-zinc-700">
                  <FileText className="w-5 h-5 stroke-[1.75]" />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-[17px] font-semibold text-zinc-900 dark:text-zinc-100 mt-4 tracking-tight">
                Submit a case
              </h3>
              <p className="text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                Open an operational case or workflow escalation with central management for order cancellations, delivery disputes, or supplier variances.
              </p>
            </div>
          </button>

          {/* Card 2: Request support (Wide 3 cols on lg) */}
          <button
            type="button"
            onClick={() => setActiveModal('request-support')}
            className="lg:col-span-3 group relative text-left p-6 rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center border border-zinc-200/80 dark:border-zinc-700">
                  <LifeBuoy className="w-5 h-5 stroke-[1.75]" />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-[17px] font-semibold text-zinc-900 dark:text-zinc-100 mt-4 tracking-tight">
                Request support
              </h3>
              <p className="text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                Request hands-on assistance with POS terminals, receipt printers, weighing scales, packaging heat sealers, or kitchen tools.
              </p>
            </div>
          </button>

          {/* Card 3: Report issue/bug (2 cols on lg) */}
          <button
            type="button"
            onClick={() => setActiveModal('report-bug')}
            className="lg:col-span-2 group relative text-left p-6 rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center border border-zinc-200/80 dark:border-zinc-700">
                  <Bug className="w-5 h-5 stroke-[1.75]" />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-[16px] font-semibold text-zinc-900 dark:text-zinc-100 mt-4 tracking-tight">
                Report issue / bug
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                Report software glitches, inventory formula variances, or dashboard display issues.
              </p>
            </div>
          </button>

          {/* Card 4: Report thief/fraud/abuse (2 cols on lg) */}
          <button
            type="button"
            onClick={() => setActiveModal('report-abuse')}
            className="lg:col-span-2 group relative text-left p-6 rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center border border-zinc-200/80 dark:border-zinc-700">
                  <ShieldAlert className="w-5 h-5 stroke-[1.75]" />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-[16px] font-semibold text-zinc-900 dark:text-zinc-100 mt-4 tracking-tight">
                Report theft / fraud / abuse
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                Confidential channel for reporting inventory theft, cash diversion, or procedural misconduct.
              </p>
            </div>
          </button>

          {/* Card 5: FAQ (2 cols on lg) */}
          <button
            type="button"
            onClick={() => setActiveModal('faq')}
            className="lg:col-span-2 group relative text-left p-6 rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center border border-zinc-200/80 dark:border-zinc-700">
                  <BookOpen className="w-5 h-5 stroke-[1.75]" />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-[16px] font-semibold text-zinc-900 dark:text-zinc-100 mt-4 tracking-tight">
                Operating FAQ & Guide
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                Browse kitchen guidelines, packaging rules, rider assignment steps, and common answers.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. My Submitted Cases Table - Standardized DataTable desaturated to grey */}
      <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
        <DataTable<SupportTicket>
          title="My Submitted Cases & Incident Reports"
          data={tickets}
          columns={ticketColumns}
          keyExtractor={(t) => t.id}
          searchable={true}
          searchPlaceholder="Search tickets by ID, category, or summary..."
          searchFilter={(item, query) => {
            const q = query.toLowerCase()
            return (
              item.id.toLowerCase().includes(q) ||
              item.category.toLowerCase().includes(q) ||
              item.subject.toLowerCase().includes(q) ||
              item.facility.toLowerCase().includes(q)
            )
          }}
        />
      </div>

      {/* =========================================================================
          MODAL 1: SUBMIT A CASE (With Custom Select, Tooltips, Red Action, Outline Back)
         ========================================================================= */}
      <Dialog
        isOpen={activeModal === 'submit-case'}
        onClose={() => setActiveModal('none')}
        title="Submit an Operational Case"
        description="Provide details regarding your operational inquiry, order escalation, or supplier variance."
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={() => setActiveModal('none')}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              form="submit-case-form"
            >
              Submit Case
            </Button>
          </div>
        }
      >
        <form id="submit-case-form" onSubmit={handleSubmitCase} className="space-y-4 text-xs font-sans">
          {/* Describe your issue or request */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <label htmlFor="case-description">Describe your issue or request</label>
              <Tooltip position="bottom" content="Please provide a detailed account of your issue or request. Helpful information includes: order reference, description of problem, steps taken, and relevant details.">
                <span className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </Tooltip>
            </div>
            <textarea
              id="case-description"
              required
              rows={4}
              value={caseForm.description}
              onChange={(e) => setCaseForm({ ...caseForm, description: e.target.value })}
              placeholder="Please provide a detailed account of your issue or request. Helpful information includes: order reference, description of problem, steps taken, and relevant details..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 focus:border-zinc-500 transition-colors"
            />
          </div>

          {/* Operational Impact Priority (own row) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <span>How is this impacting operations?</span>
              <Tooltip position="bottom" content="Select operational severity level affecting kitchen, packaging, or deliveries.">
                <span className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </Tooltip>
            </div>
            <Select
              value={caseForm.impact}
              onValueChange={(val) => setCaseForm({ ...caseForm, impact: String(val) })}
              options={impactOptions}
              placeholder="Select operational impact..."
            />
          </div>

          {/* Case Category (own row) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <span>Case Category</span>
              <Tooltip position="bottom" content="Select the domain category that this case concerns.">
                <span className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </Tooltip>
            </div>
            <Select
              value={caseForm.category}
              onValueChange={(val) => setCaseForm({ ...caseForm, category: String(val) })}
              options={caseCategoryOptions}
              placeholder="Select category..."
            />
          </div>

          {/* Add any relevant files or screenshots (FileUpload) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <span>Add any relevant files or screenshots</span>
              <Tooltip position="bottom" content="Upload photos, receipts, or waybills supporting this case.">
                <span className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </Tooltip>
            </div>
            <FileUpload
              title="Drag and drop or choose files to upload"
              description="PNG, JPG, PDF up to 10MB (Screenshots, receipts, or waybills)"
              multiple={true}
              onFilesChange={(newFiles) => setCaseForm({ ...caseForm, uploadedFiles: newFiles })}
            />
          </div>

          {/* Affected Facility / Station (own row) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <span>Select the affected facility / station</span>
              <Tooltip position="bottom" content="Choose the physical kitchen branch or fulfillment depot.">
                <span className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </Tooltip>
            </div>
            <Select
              value={caseForm.facility}
              onValueChange={(val) => setCaseForm({ ...caseForm, facility: String(val) })}
              options={facilityOptions}
              placeholder="Select facility..."
            />
          </div>

          {/* Order Reference / Batch ID (own row) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <label htmlFor="case-order-ref">Order Reference / Batch ID (Optional)</label>
              <Tooltip position="bottom" content="Associated customer order number (e.g. #SH-4091) or cooking batch.">
                <span className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </Tooltip>
            </div>
            <input
              id="case-order-ref"
              type="text"
              value={caseForm.orderRef}
              onChange={(e) => setCaseForm({ ...caseForm, orderRef: e.target.value })}
              placeholder="e.g. #SH-4091 or BATCH-082"
              className="w-full h-10 px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 focus:border-zinc-500 transition-colors"
            />
          </div>

          {/* Notification Email */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <label htmlFor="case-email">Add notification email / internal contact</label>
              <Tooltip content="Internal staff email to receive status resolution notifications.">
                <span className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </Tooltip>
            </div>
            <input
              id="case-email"
              type="email"
              value={caseForm.contactEmail}
              onChange={(e) => setCaseForm({ ...caseForm, contactEmail: e.target.value })}
              placeholder="name@smokeyhutdelight.com"
              className="w-full h-10 px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 focus:border-zinc-500 transition-colors"
            />
          </div>
        </form>
      </Dialog>

      {/* =========================================================================
          MODAL 2: REQUEST SUPPORT (With Custom Select, Tooltips, Red Action, Outline Back)
         ========================================================================= */}
      <Dialog
        isOpen={activeModal === 'request-support'}
        onClose={() => setActiveModal('none')}
        title="Request Station & Equipment Support"
        description="Request hands-on assistance with POS terminals, receipt printers, weighing scales, or kitchen tools."
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={() => setActiveModal('none')}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              form="request-support-form"
            >
              Submit Support Request
            </Button>
          </div>
        }
      >
        <form id="request-support-form" onSubmit={handleRequestSupport} className="space-y-4 text-xs font-sans">
          {/* Equipment or Support Type (own row) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <span>Equipment or Support Type</span>
              <Tooltip position="bottom" content="Select the hardware or station tool needing maintenance.">
                <span className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </Tooltip>
            </div>
            <Select
              value={supportForm.supportType}
              onValueChange={(val) => setSupportForm({ ...supportForm, supportType: String(val) })}
              options={supportTypeOptions}
              placeholder="Select equipment..."
            />
          </div>

          {/* Urgency Level (own row) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <span>Urgency Level</span>
              <Tooltip position="bottom" content="How quickly is a technician required at your station?">
                <span className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </Tooltip>
            </div>
            <Select
              value={supportForm.urgency}
              onValueChange={(val) => setSupportForm({ ...supportForm, urgency: String(val) })}
              options={urgencyOptions}
              placeholder="Select urgency..."
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <span>Kitchen Station / Work Area</span>
              <Tooltip content="Physical area in the facility where the equipment is stationed.">
                <span className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </Tooltip>
            </div>
            <Select
              value={supportForm.station}
              onValueChange={(val) => setSupportForm({ ...supportForm, station: String(val) })}
              options={stationOptions}
              placeholder="Select work station..."
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <label htmlFor="sup-desc">Describe the malfunctioning equipment or assistance needed</label>
              <Tooltip content="Detail error codes, abnormal sounds, tare drift, or paper jams.">
                <span className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </Tooltip>
            </div>
            <textarea
              id="sup-desc"
              required
              rows={3}
              value={supportForm.description}
              onChange={(e) => setSupportForm({ ...supportForm, description: e.target.value })}
              placeholder="Describe error lights, error codes on printer, tare drift on scale, or what is happening..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 focus:border-zinc-500"
            />
          </div>

          {/* Photo / Screenshot Upload */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
              Attach photo of equipment or error screen (Optional)
            </span>
            <FileUpload
              title="Click to upload or drop equipment photo"
              description="PNG or JPG up to 5MB"
              onFilesChange={(files) => setSupportForm({ ...supportForm, uploadedFiles: files })}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sup-phone" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
              Station Lead Name & Phone Number
            </label>
            <input
              id="sup-phone"
              type="text"
              value={supportForm.contactPhone}
              onChange={(e) => setSupportForm({ ...supportForm, contactPhone: e.target.value })}
              placeholder="e.g. Tunde (08012345678)"
              className="w-full h-10 px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
          </div>
        </form>
      </Dialog>

      {/* =========================================================================
          MODAL 3: REPORT ISSUE / BUG (With Custom Select, Tooltips, Red Action, Outline Back)
         ========================================================================= */}
      <Dialog
        isOpen={activeModal === 'report-bug'}
        onClose={() => setActiveModal('none')}
        title="Report Dashboard Glitch or Bug"
        description="Help our engineering team identify and resolve software errors, sync failures, or display issues."
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={() => setActiveModal('none')}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              form="report-bug-form"
            >
              Submit Bug Report
            </Button>
          </div>
        }
      >
        <form id="report-bug-form" onSubmit={handleReportBug} className="space-y-4 text-xs font-sans">
          {/* Affected Module (own row) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <span>Affected Module</span>
              <Tooltip position="bottom" content="Which section of the dashboard encountered the bug?">
                <span className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </Tooltip>
            </div>
            <Select
              value={bugForm.module}
              onValueChange={(val) => setBugForm({ ...bugForm, module: String(val) })}
              options={bugModuleOptions}
              placeholder="Select module..."
            />
          </div>

          {/* Severity (own row) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <span>Severity</span>
              <Tooltip position="bottom" content="How severely does this glitch hinder operations?">
                <span className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </Tooltip>
            </div>
            <Select
              value={bugForm.severity}
              onValueChange={(val) => setBugForm({ ...bugForm, severity: String(val) })}
              options={bugSeverityOptions}
              placeholder="Select severity..."
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <label htmlFor="bug-summary">One-line Summary</label>
              <Tooltip content="Brief headline describing the bug behavior.">
                <span className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </Tooltip>
            </div>
            <input
              id="bug-summary"
              type="text"
              required
              value={bugForm.summary}
              onChange={(e) => setBugForm({ ...bugForm, summary: e.target.value })}
              placeholder="e.g. Receipt upload button disabled after attaching file"
              className="w-full h-10 px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <label htmlFor="bug-steps">Steps to Reproduce & Expected vs Actual Result</label>
              <Tooltip content="List steps to cause the glitch, what you expected, and what happened.">
                <span className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </Tooltip>
            </div>
            <textarea
              id="bug-steps"
              required
              rows={4}
              value={bugForm.stepsToReproduce}
              onChange={(e) => setBugForm({ ...bugForm, stepsToReproduce: e.target.value })}
              placeholder="1. Go to Logistics Board&#10;2. Click Assign Rider&#10;3. Expected: Waybill upload accepts photo&#10;4. Actual: Error toast displayed"
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
          </div>

          {/* Screenshot / Log Upload */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
              Attach Screenshot of Bug or Console Error
            </span>
            <FileUpload
              title="Click or drag to attach screenshot"
              description="PNG or JPG showing the bug on your screen"
              onFilesChange={(files) => setBugForm({ ...bugForm, uploadedFiles: files })}
            />
          </div>
        </form>
      </Dialog>

      {/* =========================================================================
          MODAL 4: REPORT THEFT / FRAUD / ABUSE (With DateTimePicker, Custom Select, Red Action)
         ========================================================================= */}
      <Dialog
        isOpen={activeModal === 'report-abuse'}
        onClose={() => setActiveModal('none')}
        title="Report Theft, Fraud or Operational Abuse"
        description="Confidential reporting channel for stock shrinkage, diverted cash payments, and procedural misconduct."
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={() => setActiveModal('none')}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              form="report-abuse-form"
            >
              Submit Confidential Report
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-sans">
          {/* Collapsible How reports are handled section (Hide & Reveal) */}
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setIsHowReportsHandledOpen(!isHowReportsHandledOpen)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>How reports are handled</span>
                <span className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                  • Whistleblower Protection Protocol
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium shrink-0">
                <span>{isHowReportsHandledOpen ? 'Hide guidelines' : 'Show guidelines'}</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isHowReportsHandledOpen && "rotate-180")} />
              </div>
            </button>

            {isHowReportsHandledOpen && (
              <div className="px-4 pb-4 pt-1 space-y-3 border-t border-zinc-200/80 dark:border-zinc-700/80 animate-in fade-in duration-200">
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-[11.5px]">
                  Reports submitted through this channel are protected under our internal Whistleblower Protection Protocol and routed directly to executive audit.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60">
                    <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                      Strict Confidentiality
                    </h4>
                    <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5 leading-normal">
                      Whether submitted anonymously or with identity disclosed, records are restricted from station supervisors and station peers.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60">
                    <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                      Evidence Integrity
                    </h4>
                    <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5 leading-normal">
                      Attach specific dates, order reference numbers, or weigh slip copies to allow our audit team to verify inventory discrepancy logs.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60">
                    <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                      Zero Retaliation Policy
                    </h4>
                    <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5 leading-normal">
                      Staff reporting good-faith inventory or procedural discrepancies are protected against discrimination or shift penalties.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form with each field strictly on its own line per row */}
          <form id="report-abuse-form" onSubmit={handleReportAbuse} className="space-y-4">
            {/* 1. Incident Category (own row) */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                <span>Incident Category</span>
                <Tooltip position="bottom" content="Select the type of breach or fraudulent activity observed.">
                  <span className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                    <Info className="w-3.5 h-3.5" />
                  </span>
                </Tooltip>
              </div>
              <Select
                value={abuseForm.category}
                onValueChange={(val) => setAbuseForm({ ...abuseForm, category: String(val) })}
                options={abuseCategoryOptions}
                placeholder="Select incident category..."
              />
            </div>

            {/* 2. Approximate Date & Time of Incident (own row) */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                <span>Approximate Date & Time of Incident</span>
                <Tooltip position="bottom" content="Pick the exact date and estimated time of the occurrence using our calendar picker.">
                  <span className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                    <Info className="w-3.5 h-3.5" />
                  </span>
                </Tooltip>
              </div>
              <DateTimePicker
                value={abuseForm.dateTime}
                onChange={(val) => setAbuseForm({ ...abuseForm, dateTime: val })}
                placeholder="Select date and time..."
                required
              />
            </div>

            {/* 3. Facility / Station Involved (own row) */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                <span>Facility / Station Involved</span>
                <Tooltip position="bottom" content="Facility branch or dispatch route where incident occurred.">
                  <span className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                    <Info className="w-3.5 h-3.5" />
                  </span>
                </Tooltip>
              </div>
              <Select
                value={abuseForm.facility}
                onValueChange={(val) => setAbuseForm({ ...abuseForm, facility: String(val) })}
                options={[
                  ...facilityOptions,
                  { value: 'In Transit (Delivery)', label: 'In Transit (Delivery Route)' }
                ]}
                placeholder="Select facility..."
              />
            </div>

            {/* 4. Detailed Statement & Observed Evidence (own row) */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                <label htmlFor="abuse-stmt">Detailed Statement & Observed Evidence</label>
                <Tooltip position="bottom" content="Provide an objective description of facts, names, order IDs, or quantities.">
                  <span className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                    <Info className="w-3.5 h-3.5" />
                  </span>
                </Tooltip>
              </div>
              <textarea
                id="abuse-stmt"
                required
                rows={4}
                value={abuseForm.statement}
                onChange={(e) => setAbuseForm({ ...abuseForm, statement: e.target.value })}
                placeholder="State the observed behavior objectively. Include names of persons involved, order reference numbers, missing quantities, or vehicle license plates..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 focus:border-zinc-500"
              />
            </div>

            {/* 5. Supporting Evidence (own row) */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
                Supporting Evidence (CCTV stills, receipts, waybills, photos)
              </span>
              <FileUpload
                title="Drop files or click to upload evidence"
                description="PNG, JPG, PDF up to 10MB"
                multiple={true}
                onFilesChange={(files) => setAbuseForm({ ...abuseForm, uploadedFiles: files })}
              />
            </div>

            {/* 6. Anonymity Selection Checkbox (own row) */}
            <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  id="anonymous-check"
                  type="checkbox"
                  checked={abuseForm.isAnonymous}
                  onChange={(e) => setAbuseForm({ ...abuseForm, isAnonymous: e.target.checked })}
                  className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-500 cursor-pointer"
                />
                <label htmlFor="anonymous-check" className="text-xs font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer">
                  Submit this report anonymously (Your identity will not be attached)
                </label>
              </div>

              {!abuseForm.isAnonymous && (
                <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Your Full Name</span>
                    <input
                      type="text"
                      value={abuseForm.reporterName}
                      onChange={(e) => setAbuseForm({ ...abuseForm, reporterName: e.target.value })}
                      placeholder="Your Full Name"
                      className="w-full h-10 px-3.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Confidential Phone or Email</span>
                    <input
                      type="text"
                      value={abuseForm.reporterContact}
                      onChange={(e) => setAbuseForm({ ...abuseForm, reporterContact: e.target.value })}
                      placeholder="Confidential Phone or Email"
                      className="w-full h-10 px-3.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </Dialog>

      {/* =========================================================================
          MODAL 5: FAQ & OPERATIONAL KNOWLEDGE BASE (Consistent rounded-lg, desaturated)
         ========================================================================= */}
      <Dialog
        isOpen={activeModal === 'faq'}
        onClose={() => setActiveModal('none')}
        title="Frequently Asked Questions & Ops Knowledge Base"
        description="Search standard operational procedures, packaging checklists, and dispatch rules."
        maxWidth="3xl"
        footer={
          <div className="flex items-center justify-between w-full text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">Can't find what you need?</span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setActiveModal('none')}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setActiveModal('submit-case')}
              >
                Submit a Case
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-sans">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search kitchen recipes, packaging rules, rider assignment..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/20"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {['All', 'Orders', 'Inventory & Cooking', 'Packaging', 'Logistics & Riders', 'Accounts'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFaqCategoryFilter(cat)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border",
                  faqCategoryFilter === cat
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200/80 dark:hover:bg-zinc-700"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Accordion Questions */}
          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 text-xs">
                No questions found matching your search. Try another query or submit a case above.
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isOpen = !!faqOpenMap[faq.id]
                return (
                  <div
                    key={faq.id}
                    className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs sm:text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="text-[10.5px] uppercase font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shrink-0 leading-normal">
                          {faq.category}
                        </span>
                        <span className="leading-snug">{faq.question}</span>
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-3.5 pb-3.5 pt-2 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-800/20">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </Dialog>

      {/* =========================================================================
          MODAL 6: VIEW TICKET DETAILS (Matching Order Details Master Card Container from Image 2)
         ========================================================================= */}
      <Dialog
        isOpen={activeModal === 'view-ticket' && !!selectedTicket}
        onClose={() => {
          setActiveModal('none')
          setSelectedTicket(null)
        }}
        title={`Ticket Details: ${selectedTicket?.id}`}
        description="Detailed operational case record, severity indicators, and resolution progress."
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setActiveModal('none')
                setSelectedTicket(null)
              }}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setActiveModal('none')
                setSelectedTicket(null)
              }}
            >
              Acknowledge & Close
            </Button>
          </div>
        }
      >
        {selectedTicket && (
          <div className="space-y-4 font-sans text-xs">
            {/* Master Divided Card Container (Desaturated Grey matching Image 2 Reference) */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 shadow-2xs">
              
              {/* Section 1: Ticket Information */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Ticket Information
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Ticket Reference</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-semibold">{selectedTicket.id}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Date & Time Logged</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                      {selectedTicket.createdAt}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Status</span>
                    <div className="flex items-center">
                      {selectedTicket.status === 'Resolved' && <StatusBadge status="RESOLVED" label="resolved" size="sm" />}
                      {selectedTicket.status === 'In Progress' && <StatusBadge status="IN_PROGRESS" label="in-progress" size="sm" />}
                      {selectedTicket.status === 'Under Review' && <StatusBadge status="UNDER_REVIEW" label="under-review" size="sm" />}
                    </div>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Priority</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Facility / Station</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedTicket.facility}</span>
                  </div>
                  <div className="flex items-start text-[13px]">
                    <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Type & Category</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                      {selectedTicket.type} • {selectedTicket.category}
                    </span>
                  </div>
                  {selectedTicket.reporter && (
                    <div className="flex items-start text-[13px]">
                      <span className="w-36 sm:w-44 shrink-0 text-zinc-500 dark:text-zinc-400 font-normal">Reported By</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedTicket.reporter}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Subject */}
              <div className="p-4 space-y-2">
                <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block">
                  Subject
                </span>
                <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                  {selectedTicket.subject}
                </p>
              </div>

              {/* Section 3: Statement & Details */}
              <div className="p-4 space-y-2">
                <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block">
                  Statement / Details
                </span>
                <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Section 4: File Attachments if present */}
              {selectedTicket.filesCount !== undefined && selectedTicket.filesCount > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span>{selectedTicket.filesCount} file attachment(s) uploaded with this case</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}

export default SupportHelpDeskPage
