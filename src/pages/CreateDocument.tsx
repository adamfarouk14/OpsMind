import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DocType } from '@/data/documents'
import { ArrowLeft, Save, X, AlertCircle, ChevronDown, FileText } from 'lucide-react'

export function CreateDocument() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    code: '',
    type: 'SOP' as DocType,
    description: '',
    content: '',
    tags: '',
  })

  const [showDiscardModal, setShowDiscardModal] = useState(false)

  const handleCreate = () => {
    console.log('Creating document:', form)
    navigate('/documents')
  }

  const handleDiscard = () => {
    navigate('/documents')
  }

  const isFormValid = form.title.trim() !== ''

  return (
    <>
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDiscardModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Discard New Document?</h3>
                <p className="text-sm text-slate-500 mt-1">The document you're creating will not be saved. This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDiscardModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDiscard}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Discard Document
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {/* header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => setShowDiscardModal(true)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors mt-0.5"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Create New Document</h1>
              <p className="text-sm text-slate-500 mt-0.5">Add a new document to the knowledge base</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDiscardModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-medium text-slate-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!isFormValid}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Create Document
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* main form */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Document Details</h2>
              
              {/* title */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. POS Installation SOP"
                />
              </div>

              {/* type + code */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Document Type *
                  </label>
                  <div className="relative">
                    <select
                      value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value as DocType })}
                      className="w-full appearance-none px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-8"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Document Code
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. SOP-108"
                  />
                  <p className="text-xs text-slate-400 mt-1">Auto-generated if left empty</p>
                </div>
              </div>

              {/* description */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Brief description of this document's purpose for technical support..."
                />
              </div>

              {/* tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tags
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. POS, Installation, Hardware (comma separated)"
                />
                <p className="text-xs text-slate-400 mt-1">Separate multiple tags with commas</p>
              </div>
            </div>

            {/* content */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Document Content</h2>
              <textarea
                rows={16}
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                placeholder="Enter document content here...&#10;&#10;You can use markdown formatting:&#10;## Headings&#10;- Bullet points&#10;1. Numbered lists"
              />
            </div>
          </div>

          {/* sidebar */}
          <div className="space-y-5">
            {/* document type guide */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Document Types</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-900 mb-0.5">SOP</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Step-by-step operational procedures
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 mb-0.5">Technical Document</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Guides, specifications, troubleshooting
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 mb-0.5">Operational Case</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Real cases with problem and resolution
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 mb-0.5">Org Info</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Team procedures and policies
                  </p>
                </div>
              </div>
            </div>

            {/* tips */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Writing Tips</h2>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Keep titles clear and descriptive</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Include device/system names in tags</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Use numbered steps for procedures</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Add relevant technical details</span>
                </li>
              </ul>
            </div>

            {/* info box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-blue-900 mb-1">Document Status</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    New documents are saved as <strong>Draft</strong>. Submit for approval when ready to publish.
                  </p>
                </div>
              </div>
            </div>

            {/* template suggestion */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Need a Template?</h2>
              <p className="text-xs text-slate-500 mb-3">Start with an existing document as a template</p>
              <button className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg font-medium transition-colors">
                Browse Templates
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
