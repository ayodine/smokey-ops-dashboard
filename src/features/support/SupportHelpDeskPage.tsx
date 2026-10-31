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
  AlertCircle,
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
import { FileUpload, type FileUploadItem } from '@/components/ui/FileUpload'
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

  // Form states
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
    dateTime: new Date().toISOString().slice(0, 16),
    facility: selectedWarehouse?.name || 'Yaba Central Kitchen',
    statement: '',
    isAnonymous: true,
    reporterName: '',
    reporterContact: '',
    uploadedFiles: [] as FileUploadItem[]
  })

  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null)

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
      dateTime: new Date().toISOString().slice(0, 16),
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

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 font-sans animate-in fade-in duration-300">
      {/* 1. Header Banner & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Operations Help Desk
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700">
              <Building2 className="w-3 h-3 text-zinc-400" />
              {selectedWarehouse?.name || 'Yaba Central Kitchen'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
            Support & Incident Center
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
            Submit internal operational cases, request kitchen and station equipment support, report glitches or discrepancies, and consult standard operating guidelines.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveModal('submit-case')}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>Submit a Case</span>
          </button>
        </div>
      </div>

      {/* Submission Success Banner */}
      {submissionSuccess && (
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{submissionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setSubmissionSuccess(null)}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Main Bento Cards Section (Inspired by Image Reference 3) */}
      <div className="space-y-4">
        <div className="text-center max-w-2xl mx-auto py-4">
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
            className="lg:col-span-3 group relative text-left p-6 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[160px]"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center border border-zinc-200/80 dark:border-zinc-700">
                  <FileText className="w-5 h-5 stroke-[1.75]" />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-[17px] font-semibold text-zinc-900 dark:text-zinc-100 mt-4 tracking-tight">
                Submit a case
              </h3>
              <p className="text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Open an operational case or workflow escalation with central management for order cancellations or supplier variances.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Tracked operational case
            </div>
          </button>

          {/* Card 2: Request support (Wide 3 cols on lg) */}
          <button
            type="button"
            onClick={() => setActiveModal('request-support')}
            className="lg:col-span-3 group relative text-left p-6 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[160px]"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center border border-zinc-200/80 dark:border-zinc-700">
                  <LifeBuoy className="w-5 h-5 stroke-[1.75]" />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-[17px] font-semibold text-zinc-900 dark:text-zinc-100 mt-4 tracking-tight">
                Request support
              </h3>
              <p className="text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Request hands-on assistance with POS terminals, receipt printers, weighing scales, packaging heat sealers, or kitchen tools.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Station hardware & equipment
            </div>
          </button>

          {/* Card 3: Report issue/bug (2 cols on lg) */}
          <button
            type="button"
            onClick={() => setActiveModal('report-bug')}
            className="lg:col-span-2 group relative text-left p-6 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[160px]"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center border border-zinc-200/80 dark:border-zinc-700">
                  <Bug className="w-5 h-5 stroke-[1.75]" />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-[16px] font-semibold text-zinc-900 dark:text-zinc-100 mt-4 tracking-tight">
                Report issue / bug
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Report software glitches, inventory formula variances, or dashboard display issues.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Technical issue
            </div>
          </button>

          {/* Card 4: Report thief/fraud/abuse (2 cols on lg) */}
          <button
            type="button"
            onClick={() => setActiveModal('report-abuse')}
            className="lg:col-span-2 group relative text-left p-6 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[160px]"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/80 dark:border-rose-900">
                  <ShieldAlert className="w-5 h-5 stroke-[1.75]" />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-[16px] font-semibold text-zinc-900 dark:text-zinc-100 mt-4 tracking-tight">
                Report theft / fraud / abuse
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Confidential channel for reporting inventory theft, cash diversion, or procedural misconduct.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2 text-[11px] font-medium text-rose-600 dark:text-rose-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Strictly confidential
            </div>
          </button>

          {/* Card 5: FAQ (2 cols on lg) */}
          <button
            type="button"
            onClick={() => setActiveModal('faq')}
            className="lg:col-span-2 group relative text-left p-6 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[160px]"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center border border-zinc-200/80 dark:border-zinc-700">
                  <BookOpen className="w-5 h-5 stroke-[1.75]" />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-[16px] font-semibold text-zinc-900 dark:text-zinc-100 mt-4 tracking-tight">
                Operating FAQ & Guide
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Browse kitchen guidelines, packaging rules, rider assignment steps, and common answers.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Standard Operating Procedures
            </div>
          </button>
        </div>
      </div>

      {/* 3. My Submitted Cases Table */}
      <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              My Submitted Cases & Incident Reports
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Track real-time progress on support tickets, hardware requests, and operational escalations.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shrink-0 self-start sm:self-auto">
            {tickets.length} Total Cases
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Type & Category</th>
                  <th className="py-3 px-4">Summary</th>
                  <th className="py-3 px-4">Station / Facility</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-100 shrink-0">
                      {t.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase",
                          t.type === 'Case' ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700" :
                          t.type === 'Support' ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900" :
                          t.type === 'Bug' ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900" :
                          "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                        )}>
                          {t.type}
                        </span>
                        <span className="text-zinc-600 dark:text-zinc-300 truncate max-w-[150px]">
                          {t.category}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-medium max-w-[260px] truncate">
                      {t.subject}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400">
                      {t.facility}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                        t.priority === 'Critical' ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800" :
                        t.priority === 'High' ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" :
                        t.priority === 'Moderate' ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" :
                        "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                      )}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {t.createdAt}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                        t.status === 'Resolved' ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" :
                        t.status === 'In Progress' ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" :
                        "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                      )}>
                        {t.status === 'Resolved' && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                        {t.status === 'In Progress' && <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                        {t.status === 'Under Review' && <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTicket(t)
                          setActiveModal('view-ticket')
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: SUBMIT A CASE (Inspired by Image Reference 1)
         ========================================================================= */}
      <Dialog
        isOpen={activeModal === 'submit-case'}
        onClose={() => setActiveModal('none')}
        title="Submit an Operational Case"
        description="Provide details regarding your operational inquiry, order escalation, or supplier variance."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmitCase} className="space-y-4">
          {/* Describe your issue or request */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <label htmlFor="case-description">Describe your issue or request</label>
              <span title="Please provide a detailed account of your issue or request. Helpful details include: description of problem, order number, and timestamp." className="cursor-help text-zinc-400 hover:text-zinc-600">
                <Info className="w-3.5 h-3.5" />
              </span>
            </div>
            <textarea
              id="case-description"
              required
              rows={4}
              value={caseForm.description}
              onChange={(e) => setCaseForm({ ...caseForm, description: e.target.value })}
              placeholder="Please provide a detailed account of your issue or request. Helpful information includes: order reference, description of problem, steps taken, and relevant details..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 focus:border-zinc-500 transition-colors"
            />
          </div>

          {/* Operational Impact Priority & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                <label htmlFor="case-impact">How is this impacting operations?</label>
                <span title="Select operational severity" className="cursor-help text-zinc-400 hover:text-zinc-600">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </div>
              <select
                id="case-impact"
                value={caseForm.impact}
                onChange={(e) => setCaseForm({ ...caseForm, impact: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 focus:border-zinc-500"
              >
                <option value="P1 - Critical (Operations blocked)">P1 - Critical (Operations blocked)</option>
                <option value="P2 - High (Significant delay or bottleneck)">P2 - High (Significant delay)</option>
                <option value="P3 - Moderate (Workaround available)">P3 - Moderate (Workaround available)</option>
                <option value="P4 - General questions / Low">P4 - General questions / Low</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                <label htmlFor="case-category">Case Category</label>
                <span title="Topic of the case" className="cursor-help text-zinc-400 hover:text-zinc-600">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </div>
              <select
                id="case-category"
                value={caseForm.category}
                onChange={(e) => setCaseForm({ ...caseForm, category: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 focus:border-zinc-500"
              >
                <option value="Order Escalation">Order Escalation</option>
                <option value="Inventory Discrepancy">Inventory Discrepancy</option>
                <option value="Supplier Delivery Variance">Supplier Delivery Variance</option>
                <option value="Logistics & Rider Settlement">Logistics & Rider Settlement</option>
                <option value="Billing & Account Management">Billing & Account Management</option>
                <option value="Other Operational Request">Other Operational Request</option>
              </select>
            </div>
          </div>

          {/* Add any relevant files or screenshots (FileUpload) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <label>Add any relevant files or screenshots</label>
              <span title="Attach receipts, waybills, or error screenshots" className="cursor-help text-zinc-400 hover:text-zinc-600">
                <Info className="w-3.5 h-3.5" />
              </span>
            </div>
            <FileUpload
              title="Drag and drop or choose files to upload"
              description="PNG, JPG, PDF up to 10MB (Screenshots, receipts, or waybills)"
              multiple={true}
              onFilesChange={(newFiles) => setCaseForm({ ...caseForm, uploadedFiles: newFiles })}
            />
          </div>

          {/* Affected Facility / Station & Optional Order Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                <label htmlFor="case-facility">Select the affected facility / station</label>
                <span title="Facility location" className="cursor-help text-zinc-400 hover:text-zinc-600">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </div>
              <select
                id="case-facility"
                value={caseForm.facility}
                onChange={(e) => setCaseForm({ ...caseForm, facility: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 focus:border-zinc-500"
              >
                {facilities.map((f) => (
                  <option key={f.id} value={f.name}>{f.name} ({f.city})</option>
                ))}
                <option value="All Facilities">All Facilities</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                <label htmlFor="case-order-ref">Order Reference / Batch ID (Optional)</label>
                <span title="Associated order number e.g. #SH-4091" className="cursor-help text-zinc-400 hover:text-zinc-600">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </div>
              <input
                id="case-order-ref"
                type="text"
                value={caseForm.orderRef}
                onChange={(e) => setCaseForm({ ...caseForm, orderRef: e.target.value })}
                placeholder="e.g. #SH-4091 or BATCH-082"
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 focus:border-zinc-500"
              />
            </div>
          </div>

          {/* Notification Email */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <label htmlFor="case-email">Add notification email / internal contact</label>
              <span title="Email for resolution updates" className="cursor-help text-zinc-400 hover:text-zinc-600">
                <Info className="w-3.5 h-3.5" />
              </span>
            </div>
            <input
              id="case-email"
              type="email"
              value={caseForm.contactEmail}
              onChange={(e) => setCaseForm({ ...caseForm, contactEmail: e.target.value })}
              placeholder="name@smokeyhutdelight.com"
              className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 focus:border-zinc-500"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveModal('none')}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-sm transition-colors cursor-pointer"
            >
              Submit Case
            </button>
          </div>
        </form>
      </Dialog>

      {/* =========================================================================
          MODAL 2: REQUEST SUPPORT (Hardware, equipment, station help)
         ========================================================================= */}
      <Dialog
        isOpen={activeModal === 'request-support'}
        onClose={() => setActiveModal('none')}
        title="Request Station & Equipment Support"
        description="Request hands-on assistance with POS terminals, receipt printers, weighing scales, or kitchen tools."
        maxWidth="2xl"
      >
        <form onSubmit={handleRequestSupport} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="sup-type" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Equipment or Support Type
              </label>
              <select
                id="sup-type"
                value={supportForm.supportType}
                onChange={(e) => setSupportForm({ ...supportForm, supportType: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100"
              >
                <option value="POS Terminal & Hardware">POS Terminal & Hardware</option>
                <option value="Receipt / Waybill Printer">Receipt / Waybill Printer</option>
                <option value="Weighing Scales & Kitchen Tools">Weighing Scales & Kitchen Tools</option>
                <option value="Packaging Heat Sealer">Packaging Heat Sealer</option>
                <option value="Smoking Grill & Chimney">Smoking Grill & Chimney</option>
                <option value="Station Wi-Fi & Internet">Station Wi-Fi & Internet</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sup-urgency" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Urgency Level
              </label>
              <select
                id="sup-urgency"
                value={supportForm.urgency}
                onChange={(e) => setSupportForm({ ...supportForm, urgency: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100"
              >
                <option value="Immediate (Station Halted)">Immediate (Station Halted)</option>
                <option value="Urgent (Needed within 1 hour)">Urgent (Needed within 1 hour)</option>
                <option value="Today (Needed by end of shift)">Today (Needed by end of shift)</option>
                <option value="Scheduled Maintenance">Scheduled Maintenance</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sup-station" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Kitchen Station / Work Area
            </label>
            <select
              id="sup-station"
              value={supportForm.station}
              onChange={(e) => setSupportForm({ ...supportForm, station: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100"
            >
              <option value="Raw Meat Prep Area">Raw Meat Prep Area</option>
              <option value="Grill Smoking Station">Grill Smoking Station</option>
              <option value="Packaging & Sealing Table">Packaging & Sealing Table</option>
              <option value="Rider Dispatch Desk">Rider Dispatch Desk</option>
              <option value="Admin Office">Admin Office</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sup-desc" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Describe the malfunctioning equipment or assistance needed
            </label>
            <textarea
              id="sup-desc"
              required
              rows={3}
              value={supportForm.description}
              onChange={(e) => setSupportForm({ ...supportForm, description: e.target.value })}
              placeholder="Describe error lights, error codes on printer, tare drift on scale, or what is happening..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 focus:border-zinc-500"
            />
          </div>

          {/* Photo / Screenshot Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Attach photo of equipment or error screen (Optional)
            </label>
            <FileUpload
              title="Click to upload or drop equipment photo"
              description="PNG or JPG up to 5MB"
              onFilesChange={(files) => setSupportForm({ ...supportForm, uploadedFiles: files })}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sup-phone" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Station Lead Name & Phone Number
            </label>
            <input
              id="sup-phone"
              type="text"
              value={supportForm.contactPhone}
              onChange={(e) => setSupportForm({ ...supportForm, contactPhone: e.target.value })}
              placeholder="e.g. Tunde (08012345678)"
              className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveModal('none')}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Back
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-sm"
            >
              Submit Support Request
            </button>
          </div>
        </form>
      </Dialog>

      {/* =========================================================================
          MODAL 3: REPORT ISSUE / BUG (Software, formula discrepancy, sync bug)
         ========================================================================= */}
      <Dialog
        isOpen={activeModal === 'report-bug'}
        onClose={() => setActiveModal('none')}
        title="Report Dashboard Glitch or Bug"
        description="Help our engineering team identify and resolve software errors, sync failures, or display issues."
        maxWidth="2xl"
      >
        <form onSubmit={handleReportBug} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="bug-module" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Affected Module
              </label>
              <select
                id="bug-module"
                value={bugForm.module}
                onChange={(e) => setBugForm({ ...bugForm, module: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100"
              >
                <option value="Overview & Order Tracking Diagram">Overview & Order Tracking Diagram</option>
                <option value="Website Orders & Ingestion">Website Orders & Ingestion</option>
                <option value="Raw Inventory & Stock Deductions">Raw Inventory & Stock Deductions</option>
                <option value="Packaging Execution & Materials">Packaging Execution & Materials</option>
                <option value="Cooking Batches & Yields">Cooking Batches & Yields</option>
                <option value="Logistics & Dispatch Board">Logistics & Dispatch Board</option>
                <option value="Staff Accounts & Authentication">Staff Accounts & Authentication</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="bug-severity" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Severity
              </label>
              <select
                id="bug-severity"
                value={bugForm.severity}
                onChange={(e) => setBugForm({ ...bugForm, severity: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100"
              >
                <option value="Blocking (Prevents completing task)">Blocking (Prevents completing task)</option>
                <option value="Major (Incorrect data or calculation error)">Major (Incorrect data or error)</option>
                <option value="Minor (Visual alignment or slow load)">Minor (Visual alignment or slow load)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bug-summary" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              One-line Summary
            </label>
            <input
              id="bug-summary"
              type="text"
              required
              value={bugForm.summary}
              onChange={(e) => setBugForm({ ...bugForm, summary: e.target.value })}
              placeholder="e.g. Receipt upload button disabled after attaching file"
              className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bug-steps" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Steps to Reproduce & Expected vs Actual Result
            </label>
            <textarea
              id="bug-steps"
              required
              rows={4}
              value={bugForm.stepsToReproduce}
              onChange={(e) => setBugForm({ ...bugForm, stepsToReproduce: e.target.value })}
              placeholder="1. Go to Logistics Board&#10;2. Click Assign Rider&#10;3. Expected: Waybill upload accepts photo&#10;4. Actual: Error toast displayed"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
          </div>

          {/* Screenshot / Log Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Attach Screenshot of Bug or Console Error
            </label>
            <FileUpload
              title="Click or drag to attach screenshot"
              description="PNG or JPG showing the bug on your screen"
              onFilesChange={(files) => setBugForm({ ...bugForm, uploadedFiles: files })}
            />
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveModal('none')}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Back
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-sm"
            >
              Submit Bug Report
            </button>
          </div>
        </form>
      </Dialog>

      {/* =========================================================================
          MODAL 4: REPORT THEFT / FRAUD / ABUSE (Inspired by Image Reference 2)
         ========================================================================= */}
      <Dialog
        isOpen={activeModal === 'report-abuse'}
        onClose={() => setActiveModal('none')}
        title="Report Theft, Fraud or Operational Abuse"
        description="Confidential reporting channel for stock shrinkage, diverted cash payments, and procedural misconduct."
        maxWidth="4xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: 8 cols */}
          <form onSubmit={handleReportAbuse} className="lg:col-span-8 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="abuse-cat" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Incident Category
              </label>
              <select
                id="abuse-cat"
                value={abuseForm.category}
                onChange={(e) => setAbuseForm({ ...abuseForm, category: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100"
              >
                <option value="Inventory / Raw Meat Theft">Inventory / Raw Meat Theft</option>
                <option value="Packaging Supply Shrinkage">Packaging Supply Shrinkage</option>
                <option value="Rider Cash Collection Diversion">Rider Cash Collection Diversion</option>
                <option value="Unauthorized Order Cancellation or Void">Unauthorized Order Cancellation or Void</option>
                <option value="Falsified Expense or Vendor Invoice">Falsified Expense or Vendor Invoice</option>
                <option value="Procedural Breach / Other Misconduct">Procedural Breach / Other Misconduct</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="abuse-time" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Approximate Date & Time of Incident
                </label>
                <input
                  id="abuse-time"
                  type="datetime-local"
                  value={abuseForm.dateTime}
                  onChange={(e) => setAbuseForm({ ...abuseForm, dateTime: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="abuse-fac" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Facility / Station Involved
                </label>
                <select
                  id="abuse-fac"
                  value={abuseForm.facility}
                  onChange={(e) => setAbuseForm({ ...abuseForm, facility: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100"
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.name}>{f.name} ({f.city})</option>
                  ))}
                  <option value="In Transit (Delivery)">In Transit (Delivery)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="abuse-stmt" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Detailed Statement & Observed Evidence
              </label>
              <textarea
                id="abuse-stmt"
                required
                rows={4}
                value={abuseForm.statement}
                onChange={(e) => setAbuseForm({ ...abuseForm, statement: e.target.value })}
                placeholder="State the observed behavior objectively. Include names of persons involved, order reference numbers, missing quantities, or vehicle license plates..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              />
            </div>

            {/* Evidence File Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Supporting Evidence (CCTV stills, receipts, waybills, photos)
              </label>
              <FileUpload
                title="Drop files or click to upload evidence"
                description="PNG, JPG, PDF up to 10MB"
                multiple={true}
                onFilesChange={(files) => setAbuseForm({ ...abuseForm, uploadedFiles: files })}
              />
            </div>

            {/* Anonymity Selection */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-3">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <input
                    type="text"
                    value={abuseForm.reporterName}
                    onChange={(e) => setAbuseForm({ ...abuseForm, reporterName: e.target.value })}
                    placeholder="Your Full Name"
                    className="h-9 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                  <input
                    type="text"
                    value={abuseForm.reporterContact}
                    onChange={(e) => setAbuseForm({ ...abuseForm, reporterContact: e.target.value })}
                    placeholder="Confidential Phone or Email"
                    className="h-9 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors cursor-pointer"
              >
                Submit Confidential Report
              </button>
            </div>
          </form>

          {/* Right Callout: 4 cols (Directly inspired by Image 2 design layout) */}
          <div className="lg:col-span-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-4 self-start text-xs">
            <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>How reports are handled</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-[11.5px]">
              Reports submitted through this channel are protected under our internal Whistleblower Protection Protocol and routed directly to executive audit.
            </p>

            <div className="space-y-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-700/80">
              <div>
                <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                  Strict Confidentiality
                </h4>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5 leading-normal">
                  Whether submitted anonymously or with identity disclosed, records are restricted from station supervisors and station peers.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                  Evidence Integrity
                </h4>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5 leading-normal">
                  Attach specific dates, order reference numbers, or weigh slip copies to allow our audit team to verify inventory discrepancy logs.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                  Zero Retaliation Policy
                </h4>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5 leading-normal">
                  Staff reporting good-faith inventory or procedural discrepancies are protected against discrimination or shift penalties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      {/* =========================================================================
          MODAL 5: FAQ & OPERATIONAL KNOWLEDGE BASE
         ========================================================================= */}
      <Dialog
        isOpen={activeModal === 'faq'}
        onClose={() => setActiveModal('none')}
        title="Frequently Asked Questions & Ops Knowledge Base"
        description="Search standard operational procedures, packaging checklists, and dispatch rules."
        maxWidth="3xl"
      >
        <div className="space-y-5">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search kitchen recipes, packaging rules, rider assignment..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/20"
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
                  "px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer",
                  faqCategoryFilter === cat
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/80 dark:hover:bg-zinc-700"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Accordion Questions */}
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
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
                    className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 text-xs sm:text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0">
                          {faq.category}
                        </span>
                        <span>{faq.question}</span>
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-3.5 pt-1 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-800/20">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Can't find what you need?</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveModal('submit-case')}
                className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer"
              >
                Submit a Case →
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* =========================================================================
          MODAL 6: VIEW TICKET DETAILS
         ========================================================================= */}
      <Dialog
        isOpen={activeModal === 'view-ticket' && !!selectedTicket}
        onClose={() => {
          setActiveModal('none')
          setSelectedTicket(null)
        }}
        title={`Ticket ${selectedTicket?.id}`}
        description={`${selectedTicket?.category} • ${selectedTicket?.facility}`}
        maxWidth="lg"
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div>
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Status</span>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                  {selectedTicket.status}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Priority</span>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                  {selectedTicket.priority}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Date Logged</span>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                  {selectedTicket.createdAt}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Subject</h4>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {selectedTicket.subject}
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Statement / Details</h4>
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {selectedTicket.description}
              </div>
            </div>

            {selectedTicket.filesCount !== undefined && selectedTicket.filesCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <FileText className="w-4 h-4 text-zinc-500" />
                <span>{selectedTicket.filesCount} file attachment(s) uploaded with this case</span>
              </div>
            )}

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setActiveModal('none')
                  setSelectedTicket(null)
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}

export default SupportHelpDeskPage
