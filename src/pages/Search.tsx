import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getDocuments, searchDocuments } from '../services/documents'
import type { DocType } from '../types/database'
import {
  Search as SearchIcon,
  FileText,
  X,
  Filter,
  BookOpen,
  Briefcase,
  Building2,
  ArrowRight,
  Clock,
  Star,
  Loader2,
} from 'lucide-react'

const TYPE_CONFIG: Record<DocType, { icon: React.ElementType; color: string; label: string }> = {
  SOP: { icon: FileText, color: 'bg-blue-100 text-blue-700', label: 'SOP' },
  'Technical Document': { icon: BookOpen, color: 'bg-teal-100 text-teal-700', label: 'Technical' },
  'Operational Case': { icon: Briefcase, color: 'bg-orange-100 text-orange-700', label: 'Case' },
  'Org Info': { icon: Building2, color: 'bg-slate-100 text-slate-600', label: 'Org' },
}

export function Search() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [activeType, setActiveType] = useState<DocType | 'All'>('All')
  const [recentSearches, setRecentSearches] = useState<string[]>(['POS installation', 'printer troubleshooting', 'network issues'])
  const [documents, setDocuments] = useState<any[]>([])
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDocuments() {
      try {
        const data = await getDocuments()
        setDocuments(data)
      } catch (err) {
        setError('Failed to load documents: ' + (err as Error).message)
        console.error('Error loading documents:', err)
      }
    }
    loadDocuments()
  }, [])

  useEffect(() => {
    async function performSearch() {
      if (query.trim() === '') {
        setSearchResults([])
        return
      }

      try {
        setLoading(true)
        const results = await searchDocuments(query)
        setSearchResults(results)
      } catch (err) {
        setError('Failed to search: ' + (err as Error).message)
        console.error('Error searching:', err)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(performSearch, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  const filteredDocs = searchResults.length > 0 ? searchResults : documents.filter(doc => {
    const matchType = activeType === 'All' || doc.type === activeType
    return matchType
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && !recentSearches.includes(query)) {
      setRecentSearches([query, ...recentSearches.slice(0, 4)])
    }
  }

  const handleRecentSearch = (search: string) => {
    setQuery(search)
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Search Knowledge Base</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Find SOPs, technical documents, operational cases, and organizational information
        </p>
      </div>

      {/* search bar */}
      <form onSubmit={handleSearch} className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by title, code, description, or content..."
          className="w-full pl-12 pr-12 py-4 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {loading && (
          <Loader2 className="absolute right-12 top-1/2 -translate-y-1/2 text-blue-600 w-5 h-5 animate-spin" />
        )}
      </form>

      {/* type filter */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter className="w-4 h-4 text-slate-400" />
        {(['All', 'SOP', 'Technical Document', 'Operational Case', 'Org Info'] as const).map(type => (
          <button
            key={type}
            onClick={() => setActiveType(type as DocType | 'All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeType === type
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* recent searches */}
      {query === '' && recentSearches.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Recent Searches</h2>
            <button
              onClick={() => setRecentSearches([])}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, i) => (
              <button
                key={i}
                onClick={() => handleRecentSearch(search)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs text-slate-600 transition-colors"
              >
                <Clock className="w-3 h-3" />
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* search results */}
      {query && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {filteredDocs.length} result{filteredDocs.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <SearchIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-400">No results found</p>
              <p className="text-xs text-slate-300 mt-1">Try different keywords or filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocs.map(doc => {
                const typeConfig = TYPE_CONFIG[doc.type]
                const TypeIcon = typeConfig.icon
                
                // Highlight matching text
                const highlightText = (text: string) => {
                  if (!query) return text
                  const regex = new RegExp(`(${query})`, 'gi')
                  return text.replace(regex, '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>')
                }

                return (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm hover:border-blue-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      {/* type icon */}
                      <div className={`w-10 h-10 rounded-lg ${typeConfig.color} flex items-center justify-center flex-shrink-0`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>

                      {/* content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 
                            className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors"
                            dangerouslySetInnerHTML={{ __html: highlightText(doc.title) }}
                          />
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${typeConfig.color}`}>
                            {typeConfig.label}
                          </span>
                        </div>
                        
                        <p className="text-xs text-slate-500 mb-2">
                          <span dangerouslySetInnerHTML={{ __html: highlightText(doc.code) }} />
                          <span className="mx-1">•</span>
                          {doc.version}
                          <span className="mx-1">•</span>
                          {doc.users?.name || 'Unknown'}
                        </p>
                        
                        <p 
                          className="text-xs text-slate-600 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: highlightText(doc.description) }}
                        />
                        
                        {/* tags */}
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {doc.tags.slice(0, 3).map((tag: string, i: number) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded"
                                dangerouslySetInnerHTML={{ __html: highlightText(tag) }}
                              />
                            ))}
                            {doc.tags.length > 3 && (
                              <span className="text-xs text-slate-400">+{doc.tags.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* arrow */}
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* quick access when no search */}
      {query === '' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            Quick Access
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.slice(0, 6).map(doc => {
              const typeConfig = TYPE_CONFIG[doc.type]
              const TypeIcon = typeConfig.icon

              return (
                <button
                  key={doc.id}
                  onClick={() => navigate(`/documents/${doc.id}`)}
                  className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left group"
                >
                  <div className={`w-8 h-8 rounded-lg ${typeConfig.color} flex items-center justify-center flex-shrink-0`}>
                    <TypeIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{doc.title}</p>
                    <p className="text-[10px] text-slate-500 truncate">{doc.code}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
