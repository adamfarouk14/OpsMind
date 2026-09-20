import { useState } from 'react'
import { mockDocuments } from '../data/documents'
import type { DocType, DocStatus } from '../data/documents'
import {
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Download,
  Filter,
  ChevronDown,
  BarChart3,
  PieChart,
} from 'lucide-react'

export function Reports() {
  const [dateRange, setDateRange] = useState<'30D' | '90D' | '1Y'>('30D')
  const [activeReport, setActiveReport] = useState<'overview' | 'by-type' | 'approvals' | 'activity'>('overview')

  const stats = {
    totalDocs: mockDocuments.length,
    approvedDocs: mockDocuments.filter(d => d.status === 'Approved').length,
    inReviewDocs: mockDocuments.filter(d => d.status === 'In Review').length,
    draftDocs: mockDocuments.filter(d => d.status === 'Draft').length,
    rejectedDocs: mockDocuments.filter(d => d.status === 'Rejected').length,
  }

  const docsByType = [
    { type: 'SOP', count: mockDocuments.filter(d => d.type === 'SOP').length, color: 'bg-blue-500' },
    { type: 'Technical Document', count: mockDocuments.filter(d => d.type === 'Technical Document').length, color: 'bg-teal-500' },
    { type: 'Operational Case', count: mockDocuments.filter(d => d.type === 'Operational Case').length, color: 'bg-orange-500' },
    { type: 'Org Info', count: mockDocuments.filter(d => d.type === 'Org Info').length, color: 'bg-slate-400' },
  ]

  const recentActivity = [
    { period: 'Week 1', created: 28, updated: 18 },
    { period: 'Week 2', created: 35, updated: 22 },
    { period: 'Week 3', created: 22, updated: 30 },
    { period: 'Week 4', created: 40, updated: 25 },
    { period: 'Week 5', created: 30, updated: 35 },
    { period: 'Week 6', created: 45, updated: 28 },
    { period: 'Week 7', created: 38, updated: 42 },
    { period: 'Week 8', created: 55, updated: 48 },
  ]

  const maxActivityValue = Math.max(...recentActivity.flatMap(d => [d.created, d.updated]))

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Document statistics and activity metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-medium text-slate-700 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export Report
          </button>
        </div>
      </div>

      {/* date range selector */}
      <div className="flex items-center gap-1.5">
        {(['30D', '90D', '1Y'] as const).map(range => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              dateRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-green-600 font-medium">+12%</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.totalDocs}</p>
          <p className="text-xs text-slate-500 mt-1">Total Documents</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-green-600 font-medium">+8%</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.approvedDocs}</p>
          <p className="text-xs text-slate-500 mt-1">Approved Documents</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs text-amber-600 font-medium">-3%</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.inReviewDocs}</p>
          <p className="text-xs text-slate-500 mt-1">Pending Review</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-slate-600" />
            </div>
            <span className="text-xs text-green-600 font-medium">+15%</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.approvedDocs / stats.totalDocs * 100}%</p>
          <p className="text-xs text-slate-500 mt-1">Approval Rate</p>
        </div>
      </div>

      {/* charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* documents by type */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Documents by Type
            </h2>
            <Filter className="w-4 h-4 text-slate-400" />
          </div>
          
          <div className="space-y-3">
            {docsByType.map(item => (
              <div key={item.type} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-900">{item.type}</span>
                    <span className="text-xs text-slate-500">{item.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className={`${item.color} h-1.5 rounded-full transition-all`}
                      style={{ width: `${(item.count / stats.totalDocs) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* activity chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Document Activity
            </h2>
            <div className="flex items-center gap-1">
              {(['30D', '90D', '1Y'] as const).map(t => (
                <button
                  key={t}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded transition-colors ${
                    t === '30D'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end gap-2 h-32 px-1">
            {recentActivity.map((d, i) => {
              const createdH = Math.round((d.created / maxActivityValue) * 100)
              const updatedH = Math.round((d.updated / maxActivityValue) * 100)
              const isCurrent = i === recentActivity.length - 1
              
              return (
                <div key={d.period} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-0.5 w-full justify-center">
                    <div
                      className={`w-[42%] rounded-t-sm transition-all ${isCurrent ? 'bg-blue-600' : 'bg-blue-300'}`}
                      style={{ height: `${createdH}%` }}
                    />
                    <div
                      className={`w-[42%] rounded-t-sm transition-all ${isCurrent ? 'bg-blue-400' : 'bg-blue-200'}`}
                      style={{ height: `${updatedH}%` }}
                    />
                  </div>
                  <span className={`text-[8px] text-center leading-tight ${isCurrent ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
                    {d.period.replace(' ', '\n')}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 rounded-sm bg-blue-500" />
              <span className="text-[10px] text-slate-500">Created</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 rounded-sm bg-blue-200" />
              <span className="text-[10px] text-slate-500">Updated</span>
            </div>
          </div>
        </div>
      </div>

      {/* status breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Document Status Breakdown
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-green-700">Approved</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{stats.approvedDocs}</p>
            <p className="text-xs text-green-600 mt-1">{((stats.approvedDocs / stats.totalDocs) * 100).toFixed(1)}% of total</p>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">In Review</span>
            </div>
            <p className="text-2xl font-bold text-amber-900">{stats.inReviewDocs}</p>
            <p className="text-xs text-amber-600 mt-1">{((stats.inReviewDocs / stats.totalDocs) * 100).toFixed(1)}% of total</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-semibold text-slate-700">Draft</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.draftDocs}</p>
            <p className="text-xs text-slate-600 mt-1">{((stats.draftDocs / stats.totalDocs) * 100).toFixed(1)}% of total</p>
          </div>

          <div className="p-4 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs font-semibold text-red-700">Rejected</span>
            </div>
            <p className="text-2xl font-bold text-red-900">{stats.rejectedDocs}</p>
            <p className="text-xs text-red-600 mt-1">{((stats.rejectedDocs / stats.totalDocs) * 100).toFixed(1)}% of total</p>
          </div>
        </div>
      </div>

      {/* recent documents table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Recently Updated Documents
          </h2>
          <button className="text-xs text-blue-600 hover:underline font-medium">
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Document</th>
                <th className="text-left py-2 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Type</th>
                <th className="text-left py-2 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="text-left py-2 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Updated</th>
              </tr>
            </thead>
            <tbody>
              {mockDocuments.slice(0, 5).map(doc => (
                <tr key={doc.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2.5 px-3">
                    <p className="text-xs font-medium text-slate-900">{doc.title}</p>
                    <p className="text-[10px] text-slate-400">{doc.code}</p>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] text-slate-600">{doc.type}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      doc.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      doc.status === 'In Review' ? 'bg-amber-100 text-amber-700' :
                      doc.status === 'Draft' ? 'bg-slate-100 text-slate-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-slate-500">{doc.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
