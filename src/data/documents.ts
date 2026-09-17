// shared document types and mock data

export type DocType = 'SOP' | 'Technical Document' | 'Operational Case' | 'Org Info'
export type DocStatus = 'Approved' | 'In Review' | 'Draft' | 'Rejected'

export interface VersionEntry {
  version: string
  date: string
  author: string
  notes: string
}

export interface ApprovalEntry {
  step: string
  approver: string
  approverInitials: string
  approverColor: string
  status: 'Approved' | 'Pending' | 'Rejected' | 'Not Started'
  date: string | null
  notes: string | null
}

export interface Document {
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
  createdAt: string
  description: string
  content: string
  tags: string[]
  versions: VersionEntry[]
  approvalChain: ApprovalEntry[]
}

export const mockDocuments: Document[] = [
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
    createdAt: 'Jan 15, 2026',
    description: 'Standard Operating Procedure for installing POS systems at retail locations including hardware setup, software configuration, and network connection.',
    content: `## Purpose\nThis SOP defines the standard process for installing POS systems at retail locations.\n\n## Scope\nApplies to all Technical Support team members performing POS installations.\n\n## Steps\n1. Unbox and inspect all components\n2. Mount POS unit on counter bracket\n3. Connect power and ethernet cables\n4. Power on and configure network\n5. Install POS software from USB\n6. Test transaction`,
    tags: ['POS', 'Installation', 'Hardware'],
    versions: [
      { version: 'v2.1', date: 'Sep 14, 2026', author: 'Adam Ahmed', notes: 'Added network credential step' },
      { version: 'v2.0', date: 'Jul 10, 2026', author: 'Adam Ahmed', notes: 'Full rewrite for new hardware model' },
    ],
    approvalChain: [
      { step: 'Author Review', approver: 'Adam Ahmed', approverInitials: 'AA', approverColor: 'bg-indigo-100 text-indigo-700', status: 'Approved', date: 'Sep 14, 2026', notes: null },
      { step: 'Technical Review', approver: 'Karim Mahmoud', approverInitials: 'KM', approverColor: 'bg-purple-100 text-purple-700', status: 'Approved', date: 'Sep 14, 2026', notes: null },
      { step: 'Supervisor Approval', approver: 'Youssef Hussein', approverInitials: 'YH', approverColor: 'bg-blue-100 text-blue-700', status: 'Approved', date: 'Sep 15, 2026', notes: 'Approved' },
    ],
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
    createdAt: 'Feb 20, 2026',
    description: 'Step-by-step troubleshooting procedure for common POS system issues including power problems, display errors, and connectivity failures.',
    content: `## Purpose\nDefines troubleshooting process for POS issues.\n\n## Steps\n1. Collect symptom details\n2. Check power and cables\n3. Restart and observe boot\n4. Check network connectivity\n5. Test with external monitor if needed`,
    tags: ['POS', 'Troubleshooting', 'Support'],
    versions: [
      { version: 'v1.8', date: 'Sep 13, 2026', author: 'Youssef Hussein', notes: 'Added display troubleshooting' },
    ],
    approvalChain: [
      { step: 'Author Review', approver: 'Youssef Hussein', approverInitials: 'YH', approverColor: 'bg-blue-100 text-blue-700', status: 'Approved', date: 'Sep 13, 2026', notes: null },
      { step: 'Supervisor Approval', approver: 'Youssef Hussein', approverInitials: 'YH', approverColor: 'bg-blue-100 text-blue-700', status: 'Approved', date: 'Sep 14, 2026', notes: null },
    ],
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
    createdAt: 'Mar 10, 2026',
    description: 'Procedure for setting up and configuring receipt printers including driver installation, paper loading, and POS integration.',
    content: `## Purpose\nCovers receipt printer setup and configuration.\n\n## Steps\n1. Install printer driver\n2. Connect via USB or network\n3. Load thermal paper\n4. Print self-test page\n5. Configure in POS settings`,
    tags: ['Printer', 'Receipt', 'Setup'],
    versions: [
      { version: 'v1.3', date: 'Sep 15, 2026', author: 'Omar Khaled', notes: 'Added POS integration steps' },
    ],
    approvalChain: [
      { step: 'Author Review', approver: 'Omar Khaled', approverInitials: 'OK', approverColor: 'bg-indigo-100 text-indigo-700', status: 'Approved', date: 'Sep 15, 2026', notes: null },
      { step: 'Technical Review', approver: 'Karim Mahmoud', approverInitials: 'KM', approverColor: 'bg-purple-100 text-purple-700', status: 'Pending', date: null, notes: null },
      { step: 'Supervisor Approval', approver: 'Youssef Hussein', approverInitials: 'YH', approverColor: 'bg-blue-100 text-blue-700', status: 'Not Started', date: null, notes: null },
    ],
  },
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
    createdAt: 'Feb 12, 2026',
    description: 'Comprehensive troubleshooting guide for POS systems covering hardware issues, software errors, and error codes.',
    content: `## Overview\nComprehensive POS troubleshooting information.\n\n## Common Error Codes\n- E001: Power failure\n- E002: Network disconnected\n- E010: Software crash\n\n## Hardware Issues\n- No display: Check video cable\n- No power: Test power cable`,
    tags: ['POS', 'Troubleshooting', 'Technical'],
    versions: [
      { version: 'v2.3', date: 'Sep 16, 2026', author: 'Nour El-Din', notes: 'Added new error codes' },
    ],
    approvalChain: [
      { step: 'Author Review', approver: 'Nour El-Din', approverInitials: 'NE', approverColor: 'bg-pink-100 text-pink-700', status: 'Approved', date: 'Sep 16, 2026', notes: null },
      { step: 'Technical Review', approver: 'Karim Mahmoud', approverInitials: 'KM', approverColor: 'bg-purple-100 text-purple-700', status: 'Pending', date: null, notes: null },
      { step: 'Supervisor Approval', approver: 'Youssef Hussein', approverInitials: 'YH', approverColor: 'bg-blue-100 text-blue-700', status: 'Not Started', date: null, notes: null },
    ],
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
    createdAt: 'Mar 5, 2026',
    description: 'Technical guide for troubleshooting receipt printer issues including paper jams and connectivity problems.',
    content: `## Overview\nReceipt printer troubleshooting guide.\n\n## Paper Jam\n1. Power off printer\n2. Remove jammed paper\n3. Reload correctly\n\n## Connectivity\n- USB: Try different port\n- Network: Check IP`,
    tags: ['Printer', 'Troubleshooting'],
    versions: [
      { version: 'v1.6', date: 'Sep 16, 2026', author: 'Karim Mahmoud', notes: 'Added network section' },
    ],
    approvalChain: [
      { step: 'Author Review', approver: 'Karim Mahmoud', approverInitials: 'KM', approverColor: 'bg-purple-100 text-purple-700', status: 'Approved', date: 'Sep 16, 2026', notes: null },
      { step: 'Supervisor Approval', approver: 'Youssef Hussein', approverInitials: 'YH', approverColor: 'bg-blue-100 text-blue-700', status: 'Approved', date: 'Sep 16, 2026', notes: null },
    ],
  },
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
    createdAt: 'Sep 1, 2026',
    description: 'Case study of POS unit power failure at store location, diagnosis of power supply issue, and resolution.',
    content: `## Case Summary\n**Location:** Store #45\n**Date:** Sep 1, 2026\n\n## Problem\nPOS terminal failed to power on after power outage.\n\n## Diagnosis\nTested power cable and outlet. Power supply unit failed.\n\n## Resolution\nReplaced power supply. Installed surge protector.`,
    tags: ['POS', 'Power', 'Case Study'],
    versions: [
      { version: 'v1.0', date: 'Sep 1, 2026', author: 'Hassan Mostafa', notes: 'Initial case documentation' },
    ],
    approvalChain: [
      { step: 'Author Review', approver: 'Hassan Mostafa', approverInitials: 'HM', approverColor: 'bg-orange-100 text-orange-700', status: 'Approved', date: 'Sep 1, 2026', notes: null },
      { step: 'Supervisor Approval', approver: 'Youssef Hussein', approverInitials: 'YH', approverColor: 'bg-blue-100 text-blue-700', status: 'Approved', date: 'Sep 2, 2026', notes: null },
    ],
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
    createdAt: 'Aug 25, 2026',
    description: 'Case of receipt printer failure, root cause analysis of driver conflict, and resolution.',
    content: `## Case Summary\n**Location:** Head Office\n**Date:** Aug 25, 2026\n\n## Problem\nPrinter stopped after Windows Update.\n\n## Diagnosis\nDriver conflict with Windows Update.\n\n## Resolution\nRolled back driver. Working again.`,
    tags: ['Printer', 'Driver', 'Case Study'],
    versions: [
      { version: 'v1.1', date: 'Sep 9, 2026', author: 'Karim Mahmoud', notes: 'Added KB reference' },
    ],
    approvalChain: [
      { step: 'Author Review', approver: 'Karim Mahmoud', approverInitials: 'KM', approverColor: 'bg-purple-100 text-purple-700', status: 'Approved', date: 'Sep 9, 2026', notes: null },
      { step: 'Supervisor Approval', approver: 'Youssef Hussein', approverInitials: 'YH', approverColor: 'bg-blue-100 text-blue-700', status: 'Approved', date: 'Sep 9, 2026', notes: null },
    ],
  },
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
    createdAt: 'Jan 10, 2026',
    description: 'Organizational procedures for technical support team including ticket handling, escalation protocols, and SLA guidelines.',
    content: `## Overview\nCore operational procedures for Technical Support.\n\n## Ticket Handling\n1. Log all requests within 15 minutes\n2. Categorize by type\n3. Set priority level\n\n## Escalation\n- L1: Basic resolution\n- L2: Complex issues\n- L3: Vendor involvement`,
    tags: ['Procedures', 'Tickets', 'SLA'],
    versions: [
      { version: 'v2.0', date: 'Sep 2, 2026', author: 'Youssef Hussein', notes: 'Updated SLA targets' },
    ],
    approvalChain: [
      { step: 'Author Review', approver: 'Youssef Hussein', approverInitials: 'YH', approverColor: 'bg-blue-100 text-blue-700', status: 'Approved', date: 'Sep 2, 2026', notes: null },
      { step: 'Department Head', approver: 'Youssef Hussein', approverInitials: 'YH', approverColor: 'bg-blue-100 text-blue-700', status: 'Approved', date: 'Sep 3, 2026', notes: null },
    ],
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
    createdAt: 'Feb 5, 2026',
    description: 'Guidelines for routine device maintenance including inspection schedules and replacement criteria.',
    content: `## Overview\nDevice maintenance standards.\n\n## Schedule\n- POS: Monthly cleaning\n- Laptops: Quarterly check\n- Printers: Monthly inspection\n\n## Replacement Criteria\nReplace if 3+ failures in 12 months or repair > 60% of cost.`,
    tags: ['Maintenance', 'Guidelines', 'Devices'],
    versions: [
      { version: 'v1.5', date: 'Aug 16, 2026', author: 'Youssef Hussein', notes: 'Updated criteria' },
    ],
    approvalChain: [
      { step: 'Author Review', approver: 'Youssef Hussein', approverInitials: 'YH', approverColor: 'bg-blue-100 text-blue-700', status: 'Approved', date: 'Aug 16, 2026', notes: null },
      { step: 'Department Head', approver: 'Youssef Hussein', approverInitials: 'YH', approverColor: 'bg-blue-100 text-blue-700', status: 'Approved', date: 'Aug 16, 2026', notes: null },
    ],
  },
]

export function getDocumentById(id: number): Document | undefined {
  return mockDocuments.find(d => d.id === id)
}
