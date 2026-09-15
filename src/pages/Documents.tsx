import { useState } from 'react'
import {
  Plus,
  Search,
  Filter,
  FileText,
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
  Download,
  MoreHorizontal,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  FileCheck,
  BookOpen,
  Briefcase,
  Building2,
} from 'lucide-react'

// types
type DocType = 'SOP' | 'Technical Document' | 'Operational Case' | 'Org Info'
type DocStatus = 'Approved' | 'In Review' | 'Draft' | 'Rejected'

interface Document {
  id: number
  title: string
  code: string
  type: DocType
  version: string
  owner: string
  ownerInitials: string
  ownerColor: string
  status: DocStatus
  updatedAt: string
  description: string
}




const mockDocuments: Document[] = [
  // sops
  {
    id: 1,
    title: 'POS Installation SOP',
    code: 'SOP-101',
    type: 'SOP',
    version: 'v2.1',
    owner: 'Adam Ahmed',
    ownerInitials: 'AA',
    ownerColor: 'bg-indigo-100 text-indigo-700',
    status: 'Approved',
    updatedAt: '2 hours ago',
    description: 'Standard Operating Procedure for installing POS systems at retail locations including hardware setup, software configuration, and network connection.',
  },
  {
    id: 2,
    title: 'POS Troubleshooting SOP',
    code: 'SOP-102',
    type: 'SOP',
    version: 'v1.8',
    owner: 'Youssef Hussein',
    ownerInitials: 'YH',
    ownerColor: 'bg-blue-100 text-blue-700',
    status: 'Approved',
    updatedAt: '3 days ago',
    description: 'Step-by-step troubleshooting procedure for common POS system issues including power problems, display errors, and connectivity failures.',
  },
  {
    id: 3,
    title: 'Receipt Printer Setup SOP',
    code: 'SOP-103',
    type: 'SOP',
    version: 'v1.3',
    owner: 'Omar Khaled',
    ownerInitials: 'OK',
    ownerColor: 'bg-indigo-100 text-indigo-700',
    status: 'In Review',
    updatedAt: '1 day ago',
    description: 'Procedure for setting up and configuring receipt printers including driver installation, paper loading, and POS integration.',
  },
  {
    id: 4,
    title: 'Barcode Scanner Configuration SOP',
    code: 'SOP-104',
    type: 'SOP',
    version: 'v1.5',
    owner: 'Youssef Hussein',
    ownerInitials: 'YH',
    ownerColor: 'bg-blue-100 text-blue-700',
    status: 'Draft',
    updatedAt: '5 hours ago',
    description: 'Standard procedure for configuring barcode scanners with POS systems including pairing, scanning mode setup, and testing.',
  },
  {
    id: 5,
    title: 'Device Replacement SOP',
    code: 'SOP-105',
    type: 'SOP',
    version: 'v2.0',
    owner: 'Adam Ahmed',
    ownerInitials: 'AA',
    ownerColor: 'bg-indigo-100 text-indigo-700',
    status: 'Approved',
    updatedAt: '1 week ago',
    description: 'Procedure for replacing faulty devices including inventory check, data migration, and documentation of replacement.',
  },
  {
    id: 6,
    title: 'Windows Installation SOP',
    code: 'SOP-106',
    type: 'SOP',
    version: 'v3.2',
    owner: 'Omar Khaled',
    ownerInitials: 'OK',
    ownerColor: 'bg-indigo-100 text-indigo-700',
    status: 'Approved',
    updatedAt: '2 weeks ago',
    description: 'Standard Windows installation procedure for laptops and desktops including OS setup, driver installation, and system configuration.',
  },
  {
    id: 7,
    title: 'Hardware Maintenance SOP',
    code: 'SOP-107',
    type: 'SOP',
    version: 'v1.4',
    owner: 'Youssef Hussein',
    ownerInitials: 'YH',
    ownerColor: 'bg-blue-100 text-blue-700',
    status: 'In Review',
    updatedAt: '4 days ago',
    description: 'Routine hardware maintenance procedures including cleaning, component inspection, and preventive maintenance schedules.',
  },

  // technical documents
  {
    id: 8,
    title: 'POS Troubleshooting Guide',
    code: 'TG-201',
    type: 'Technical Document',
    version: 'v2.3',
    owner: 'Nour El-Din',
    ownerInitials: 'NE',
    ownerColor: 'bg-pink-100 text-pink-700',
    status: 'In Review',
    updatedAt: '45 min ago',
    description: 'Comprehensive troubleshooting guide for POS systems covering hardware issues, software errors, network problems, and common error codes.',
  },
  {
    id: 9,
    title: 'Receipt Printer Troubleshooting Guide',
    code: 'TG-202',
    type: 'Technical Document',
    version: 'v1.6',
    owner: 'Karim Mahmoud',
    ownerInitials: 'KM',
    ownerColor: 'bg-purple-100 text-purple-700',
    status: 'Approved',
    updatedAt: '6 hours ago',
    description: 'Technical guide for troubleshooting receipt printer issues including paper jams, connectivity problems, and print quality issues.',
  },
  {
    id: 10,
    title: 'Barcode Scanner Configuration Guide',
    code: 'TG-203',
    type: 'Technical Document',
    version: 'v1.8',
    owner: 'Nour El-Din',
    ownerInitials: 'NE',
    ownerColor: 'bg-pink-100 text-pink-700',
    status: 'Approved',
    updatedAt: '2 days ago',
    description: 'Configuration guide for barcode scanners including connection types, scanning modes, and integration with POS systems.',
  },
  {
    id: 11,
    title: 'Laptop Hardware Troubleshooting Guide',
    code: 'TG-204',
    type: 'Technical Document',
    version: 'v2.1',
    owner: 'Karim Mahmoud',
    ownerInitials: 'KM',
    ownerColor: 'bg-purple-100 text-purple-700',
    status: 'Approved',
    updatedAt: '1 week ago',
    description: 'Hardware troubleshooting guide for laptops covering display issues, keyboard problems, battery issues, and peripheral connections.',
  },
  {
    id: 12,
    title: 'Monitor Troubleshooting Guide',
    code: 'TG-205',
    type: 'Technical Document',
    version: 'v1.4',
    owner: 'Nour El-Din',
    ownerInitials: 'NE',
    ownerColor: 'bg-pink-100 text-pink-700',
    status: 'In Review',
    updatedAt: '3 days ago',
    description: 'Troubleshooting guide for monitors including display problems, connectivity issues, and color calibration procedures.',
  },
  {
    id: 13,
    title: 'Driver Installation Guide',
    code: 'TG-206',
    type: 'Technical Document',
    version: 'v2.0',
    owner: 'Karim Mahmoud',
    ownerInitials: 'KM',
    ownerColor: 'bg-purple-100 text-purple-700',
    status: 'Approved',
    updatedAt: '5 days ago',
    description: 'Guide for installing and updating drivers for POS devices, printers, scanners, and other peripheral equipment.',
  },
  {
    id: 14,
    title: 'POS Device Specifications',
    code: 'TG-207',
    type: 'Technical Document',
    version: 'v1.2',
    owner: 'Nour El-Din',
    ownerInitials: 'NE',
    ownerColor: 'bg-pink-100 text-pink-700',
    status: 'Approved',
    updatedAt: '1 week ago',
    description: 'Technical specifications for all POS devices including hardware requirements, compatibility information, and performance metrics.',
  },

  // operational cases
  {
    id: 15,
    title: 'POS Not Powering On',
    code: 'OC-301',
    type: 'Operational Case',
    version: 'v1.0',
    owner: 'Hassan Mostafa',
    ownerInitials: 'HM',
    ownerColor: 'bg-orange-100 text-orange-700',
    status: 'Approved',
    updatedAt: '2 days ago',
    description: 'Case study of POS unit power failure at store location #45, diagnosis of power supply issue, and successful replacement procedure.',
  },
  {
    id: 16,
    title: 'Receipt Printer Not Printing',
    code: 'OC-302',
    type: 'Operational Case',
    version: 'v1.1',
    owner: 'Karim Mahmoud',
    ownerInitials: 'KM',
    ownerColor: 'bg-purple-100 text-purple-700',
    status: 'Approved',
    updatedAt: '1 week ago',
    description: 'Operational case of receipt printer failure at retail location, root cause analysis of driver conflict, and resolution steps.',
  },
  {
    id: 17,
    title: 'Barcode Scanner Not Reading',
    code: 'OC-303',
    type: 'Operational Case',
    version: 'v1.0',
    owner: 'Hassan Mostafa',
    ownerInitials: 'HM',
    ownerColor: 'bg-orange-100 text-orange-700',
    status: 'Rejected',
    updatedAt: '4 days ago',
    description: 'Case of barcode scanner reading failure, investigation of scanning angle and lighting issues, and corrective actions implemented.',
  },
  {
    id: 18,
    title: 'POS Printer Driver Issue',
    code: 'OC-304',
    type: 'Operational Case',
    version: 'v1.2',
    owner: 'Adam Ahmed',
    ownerInitials: 'AA',
    ownerColor: 'bg-indigo-100 text-indigo-700',
    status: 'Approved',
    updatedAt: '3 days ago',
    description: 'Case study of POS printer driver compatibility issue with Windows update, rollback procedure, and driver update documentation.',
  },
  {
    id: 19,
    title: 'Windows Installation Case',
    code: 'OC-305',
    type: 'Operational Case',
    version: 'v1.0',
    owner: 'Omar Khaled',
    ownerInitials: 'OK',
    ownerColor: 'bg-indigo-100 text-indigo-700',
    status: 'Approved',
    updatedAt: '5 days ago',
    description: 'Operational case of Windows installation on multiple laptops, challenges encountered, and successful deployment procedure.',
  },
  {
    id: 20,
    title: 'Device Hardware Failure',
    code: 'OC-306',
    type: 'Operational Case',
    version: 'v1.1',
    owner: 'Hassan Mostafa',
    ownerInitials: 'HM',
    ownerColor: 'bg-orange-100 text-orange-700',
    status: 'In Review',
    updatedAt: '2 days ago',
    description: 'Case of hardware failure in POS terminal, diagnosis of motherboard issue, and replacement workflow documentation.',
  },
  {
    id: 21,
    title: 'POS Network Connectivity Issue',
    code: 'OC-307',
    type: 'Operational Case',
    version: 'v1.0',
    owner: 'Adam Ahmed',
    ownerInitials: 'AA',
    ownerColor: 'bg-indigo-100 text-indigo-700',
    status: 'Approved',
    updatedAt: '1 week ago',
    description: 'Case of POS network connectivity failure at retail location, troubleshooting of network configuration, and resolution steps.',
  },

  // org info
  {
    id: 22,
    title: 'Technical Support Procedures',
    code: 'ORG-101',
    type: 'Org Info',
    version: 'v2.0',
    owner: 'Youssef Hussein',
    ownerInitials: 'YH',
    ownerColor: 'bg-blue-100 text-blue-700',
    status: 'Approved',
    updatedAt: '2 weeks ago',
    description: 'Organizational procedures for technical support team including ticket handling, escalation protocols, and service level guidelines.',
  },
  {
    id: 23,
    title: 'Device Maintenance Guidelines',
    code: 'ORG-102',
    type: 'Org Info',
    version: 'v1.5',
    owner: 'Youssef Hussein',
    ownerInitials: 'YH',
    ownerColor: 'bg-blue-100 text-blue-700',
    status: 'Approved',
    updatedAt: '1 month ago',
    description: 'Guidelines for routine device maintenance including inspection schedules, cleaning procedures, and replacement criteria.',
  },
  {
    id: 24,
    title: 'Support Team Procedures',
    code: 'ORG-103',
    type: 'Org Info',
    version: 'v3.0',
    owner: 'Omar Khaled',
    ownerInitials: 'OK',
    ownerColor: 'bg-indigo-100 text-indigo-700',
    status: 'Approved',
    updatedAt: '3 weeks ago',
    description: 'Procedures for support team operations including shift schedules, on-call protocols, and team communication guidelines.',
  },
  {
    id: 25,
    title: 'Device Handling Guidelines',
    code: 'ORG-104',
    type: 'Org Info',
    version: 'v1.2',
    owner: 'Adam Ahmed',
    ownerInitials: 'AA',
    ownerColor: 'bg-indigo-100 text-indigo-700',
    status: 'In Review',
    updatedAt: '1 week ago',
    description: 'Guidelines for proper handling of IT equipment including transportation, storage, and safety procedures for devices.',
  },
  {
    id: 26,
    title: 'Internal Support Instructions',
    code: 'ORG-105',
    type: 'Org Info',
    version: 'v2.1',
    owner: 'Youssef Hussein',
    ownerInitials: 'YH',
    ownerColor: 'bg-blue-100 text-blue-700',
    status: 'Approved',
    updatedAt: '2 months ago',
    description: 'Internal instructions for support team members including tool usage, documentation requirements, and quality standards.',
  },
]

// config
const DOC_TYPES: { label: string; value: DocType | 'All'; icon: React.ElementType; color: string }[] = [
  { label: 'All Types', value: 'All', icon: FileText, color: 'text-slate-500' },
  { label: 'SOP', value: 'SOP', icon: FileCheck, color: 'text-blue-600' },
  { label: 'Technical Document', value: 'Technical Document', icon: BookOpen, color: 'text-teal-600' },
  { label: 'Operational Case', value: 'Operational Case', icon: Briefcase, color: 'text-orange-500' },
  { label: 'Org Info', value: 'Org Info', icon: Building2, color: 'text-slate-500' },
]

const STATUS_STYLES: Record<DocStatus, string> = {
  Approved: 'bg-green-100 text-green-700',
  'In Review': 'bg-amber-100 text-amber-700',
  Draft: 'bg-slate-100 text-slate-600',
  Rejected: 'bg-red-100 text-red-600',
}

const STATUS_ICONS: Record<DocStatus, React.ElementType> = {
  Approved: CheckCircle,
  'In Review': Clock,
  Draft: FileText,
  Rejected: AlertCircle,
}

const TYPE_STYLES: Record<DocType, string> = {
  SOP: 'bg-blue-100 text-blue-700',
  'Technical Document': 'bg-teal-100 text-teal-700',
  'Operational Case': 'bg-orange-100 text-orange-700',
  'Org Info': 'bg-slate-100 text-slate-600',
}

// create modal
function CreateDocumentModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    title: '',
    type: 'SOP' as DocType,
    description: '',
    code: '',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">Create New Document</h2>
            <p className="text-[12px] text-slate-400 mt-0.5">Add a new document to the knowledge base</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* body */}
        <div className="px-6 py-5 space-y-4">
          {/* title */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Document Title *</label>
            <input
              type="text"
              placeholder="e.g. POS Installation SOP"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
            />
          </div>

          {/* type + code row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Document Type *</label>
              <div className="relative">
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value as DocType })}
                  className="w-full appearance-none px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-8"
                >
                  <option>SOP</option>
                  <option>Technical Document</option>
                  <option>Operational Case</option>
                  <option>Org Info</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Document Code</label>
              <input
                type="text"
                placeholder="e.g. SOP-105"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* description */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Description</label>
            <textarea
              rows={3}
              placeholder="Brief description of this document's purpose for technical support..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* info note */}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-blue-700">Document will be saved as <strong>Draft</strong> and can be submitted for approval later. Choose appropriate category for technical support knowledge.</p>
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!form.title}
            className="px-4 py-2 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Create Document
          </button>
        </div>
      </div>
    </div>
  )
}

// row actions menu
function ActionsMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 w-44" onClick={onClose}>
      {[
        { icon: Eye, label: 'View Document' },
        { icon: Pencil, label: 'Edit' },
        { icon: Download, label: 'Download' },
        { icon: Trash2, label: 'Delete', danger: true },
      ].map(({ icon: Icon, label, danger }) => (
        <button
          key={label}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] font-medium transition-colors ${
            danger
              ? 'text-red-600 hover:bg-red-50'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}

// main page
export function Documents() {
  const [activeType, setActiveType] = useState<DocType | 'All'>('All')
  const [activeStatus, setActiveStatus] = useState<DocStatus | 'All'>('All')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [openMenu, setOpenMenu] = useState<number | null>(null)

  // filter logic
  const filtered = mockDocuments.filter(doc => {
    const matchType = activeType === 'All' || doc.type === activeType
    const matchStatus = activeStatus === 'All' || doc.status === activeStatus
    const matchSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.code.toLowerCase().includes(search.toLowerCase()) ||
      doc.owner.toLowerCase().includes(search.toLowerCase())
    return matchType && matchStatus && matchSearch
  })

  return (
    <>
      {showModal && <CreateDocumentModal onClose={() => setShowModal(false)} />}

      <div className="space-y-5" onClick={() => setOpenMenu(null)}>

        {/* page header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Documents</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">
              {mockDocuments.length} documents · SOPs, Technical Documents, Operational Cases & Org Info
            </p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); setShowModal(true) }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Document
          </button>
        </div>

        {/* type filter tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {DOC_TYPES.map(({ label, value, icon: Icon, color }) => (
            <button
              key={value}
              onClick={() => setActiveType(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                activeType === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${activeType === value ? 'text-white' : color}`} />
              {label}
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                activeType === value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {value === 'All'
                  ? mockDocuments.length
                  : mockDocuments.filter(d => d.type === value).length}
              </span>
            </button>
          ))}
        </div>

        {/* search + status filter bar */}
        <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
          {/* search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search POS, printer, scanner documents…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder:text-slate-400 transition-colors"
            />
          </div>

          {/* divider */}
          <div className="w-px h-5 bg-slate-200 hidden sm:block" />

          {/* status filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[12px] text-slate-500 font-medium">Status:</span>
            {(['All', 'Approved', 'In Review', 'Draft', 'Rejected'] as const).map(s => (
              <button
                key={s}
                onClick={() => setActiveStatus(s)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  activeStatus === s
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Document</th>
                  <th className="text-left py-3 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Type</th>
                  <th className="text-left py-3 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Version</th>
                  <th className="text-left py-3 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Owner</th>
                  <th className="text-left py-3 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="text-left py-3 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide hidden lg:table-cell">Last Updated</th>
                  <th className="py-3 px-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-[13px] font-medium text-slate-400">No documents found</p>
                      <p className="text-[12px] text-slate-300 mt-1">Try adjusting your filters or search term</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(doc => {
                    const StatusIcon = STATUS_ICONS[doc.status]
                    return (
                      <tr
                        key={doc.id}
                        className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* title + code */}
                        <td className="py-3.5 px-5">
                          <p className="text-[13px] font-semibold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">
                            {doc.title}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{doc.code} · {doc.description.slice(0, 55)}…</p>
                        </td>

                        {/* type */}
                        <td className="py-3.5 px-3">
                          <span className={`text-[10px] font-semibold px-2 py-1 rounded ${TYPE_STYLES[doc.type]}`}>
                            {doc.type}
                          </span>
                        </td>

                        {/* version */}
                        <td className="py-3.5 px-3 text-[12px] font-medium text-slate-600">{doc.version}</td>

                        {/* owner */}
                        <td className="py-3.5 px-3 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${doc.ownerColor}`}>
                              {doc.ownerInitials}
                            </div>
                            <span className="text-[12px] text-slate-600">{doc.owner}</span>
                          </div>
                        </td>

                        {/* status */}
                        <td className="py-3.5 px-3">
                          <div className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded ${STATUS_STYLES[doc.status]}`}>
                            <StatusIcon className="w-3 h-3" />
                            {doc.status}
                          </div>
                        </td>

                        {/* updated */}
                        <td className="py-3.5 px-3 text-[12px] text-slate-400 hidden lg:table-cell">{doc.updatedAt}</td>

                        {/* actions */}
                        <td className="py-3.5 px-3 relative">
                          <button
                            onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === doc.id ? null : doc.id) }}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openMenu === doc.id && (
                            <ActionsMenu onClose={() => setOpenMenu(null)} />
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* footer */}
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Showing {filtered.length} of {mockDocuments.length} documents
            </span>
            <div className="flex items-center gap-1">
              {(['Approved', 'In Review', 'Draft', 'Rejected'] as DocStatus[]).map(s => (
                <div key={s} className="flex items-center gap-1 ml-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    s === 'Approved' ? 'bg-green-500' :
                    s === 'In Review' ? 'bg-amber-500' :
                    s === 'Draft' ? 'bg-slate-400' : 'bg-red-500'
                  }`} />
                  <span className="text-[11px] text-slate-400">{mockDocuments.filter(d => d.status === s).length} {s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
